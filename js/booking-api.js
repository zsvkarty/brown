// Booking API integration with Supabase

const SUPABASE_URL = 'https://ewjgrbnhvkyjoohhncmb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_F4YVBGauSsAp17ehUK5Y4w_OHF8bYtb';

// Server that holds the Stripe secret key and the service-role Supabase
// client (the brown-admin-dashboard Next.js app). Change this when deployed.
const CHECKOUT_API_BASE_URL = 'https://brown-admin-dashboard-tau.vercel.app/';

const MAX_GROUP_SIZE = 8;

class BookingAPI {
    constructor() {
        this.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    // Get availability for a specific month. `month` is 0-indexed (JS Date convention).
    // Returns entries shaped like { date, time, groupSize }; a blocked slot is
    // represented as a full slot (groupSize = MAX_GROUP_SIZE) so callers don't
    // need to special-case it.
    async getAvailability(year, month) {
        try {
            const { data: bookingRows, error: bookingError } = await this.supabaseClient.rpc(
                'get_availability',
                { p_year: year, p_month: month + 1 }
            );

            if (bookingError) throw bookingError;

            const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
            const nextMonthDate = new Date(year, month + 1, 1);
            const monthEnd = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-01`;

            const { data: blockedRows, error: blockedError } = await this.supabaseClient
                .from('blocked_slots')
                .select('date, time')
                .eq('status', 'active')
                .gte('date', monthStart)
                .lt('date', monthEnd);

            if (blockedError) throw blockedError;

            const availability = [
                ...(bookingRows || []).map((row) => ({
                    date: row.booking_date,
                    time: row.booking_time.substring(0, 5),
                    groupSize: row.group_size,
                })),
                ...(blockedRows || []).map((row) => ({
                    date: row.date,
                    time: row.time.substring(0, 5),
                    groupSize: MAX_GROUP_SIZE,
                })),
            ];

            return { data: availability, error: null };
        } catch (error) {
            console.error('Error fetching availability:', error);
            return { data: null, error: error.message };
        }
    }

    // Check if a specific date/time can fit the requested group size.
    async checkAvailability(date, time, requestedGroupSize = 1) {
        try {
            const [year, month] = date.split('-').map(Number);
            const { data: availability, error } = await this.getAvailability(year, month - 1);
            if (error) throw new Error(error);

            // A private tour books out the whole slot exclusively - it isn't
            // shared capacity between different customers' parties.
            const isTaken = availability.some((slot) => slot.date === date && slot.time === time);

            return {
                available: !isTaken && requestedGroupSize <= MAX_GROUP_SIZE,
                availableSpots: isTaken ? 0 : MAX_GROUP_SIZE,
                maxGroupSize: MAX_GROUP_SIZE,
            };
        } catch (error) {
            return { available: false, error: error.message };
        }
    }

    // Create a new booking (starts as 'pending' until payment confirms it).
    async createBooking(bookingData) {
        try {
            const availability = await this.checkAvailability(
                bookingData.date,
                bookingData.time,
                Number(bookingData.groupSize)
            );

            if (!availability.available) {
                throw new Error('Selected date/time is no longer available');
            }

            // Generate the id client-side and skip .select() on the insert: the
            // public "Anyone can create bookings" policy only covers INSERT, and
            // anon has no SELECT policy on bookings (customer data stays admin-only).
            // Asking Postgres to return the inserted row would fail RLS on the
            // implicit read, even though the insert itself is allowed.
            const newBooking = {
                id: crypto.randomUUID(),
                tour_id: bookingData.tourId || 'private-tour',
                booking_date: bookingData.date,
                booking_time: bookingData.time,
                customer_name: bookingData.customerName,
                customer_email: bookingData.email,
                customer_phone: bookingData.phone || null,
                group_size: Number(bookingData.groupSize),
                special_requests: bookingData.specialRequests || null,
                status: 'pending',
            };

            const { error } = await this.supabaseClient.from('bookings').insert([newBooking]);

            if (error) throw error;

            return { data: newBooking, error: null };
        } catch (error) {
            console.error('Error creating booking:', error);
            return { data: null, error: error.message };
        }
    }

    // Create a Stripe Checkout Session for a pending booking and return its URL.
    async createCheckoutSession(bookingId, successUrl, cancelUrl) {
        try {
            const response = await fetch(`${CHECKOUT_API_BASE_URL}/api/checkout/create-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId, successUrl, cancelUrl }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to start checkout');

            return { data: result, error: null };
        } catch (error) {
            console.error('Error creating checkout session:', error);
            return { data: null, error: error.message };
        }
    }
}

const bookingAPI = new BookingAPI();

if (typeof window !== 'undefined') {
    window.bookingAPI = bookingAPI;
}
