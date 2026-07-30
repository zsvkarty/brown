import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "npm:stripe@^13.0.0";
import { Resend } from "npm:resend@^2.0.0";
import { createClient } from "npm:@supabase/supabase-js@^2.0.0";

// Initialize Stripe (requires STRIPE_SECRET_KEY, but we only need it for webhook validation here, so we actually need STRIPE_WEBHOOK_SECRET)
// Note: We need a dummy Stripe API key if we don't do API calls, just for the library initialization.
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "sk_test_123", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(), // Use fetch instead of Node's http
});

// Initialize Resend
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const signature = req.headers.get("Stripe-Signature");
  if (!signature) {
    return new Response("Missing Stripe signature", { status: 400 });
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  try {
    const body = await req.text();
    
    // Verify the webhook signature securely
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // We only care about successful checkouts
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      
      // The booking.id from Supabase we passed as client_reference_id
      const bookingId = session.client_reference_id;
      
      if (bookingId) {
        // Initialize Supabase Admin Client to bypass RLS
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 1. Update Booking Status in Supabase
        const { data: booking, error: updateError } = await supabaseAdmin
          .from("bookings")
          .update({ status: "confirmed" })
          .eq("id", bookingId)
          .select()
          .single();

        if (updateError) {
          console.error("Error updating booking status:", updateError);
          throw new Error("Failed to update database");
        }

        console.log(`Successfully confirmed booking: ${bookingId}`);

        // 2. Send Confirmation Email via Resend
        if (booking && booking.customer_email) {
          const emailHtml = `
            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
              <h1 style="color: #1a1a2e;">Your Adventure Awaits!</h1>
              <p>Hi ${booking.customer_name || 'Explorer'},</p>
              <p>Thank you for booking the <strong>Private Dan Brown Prague Tour</strong>.</p>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #d4af37;">Booking Details:</h3>
                <ul style="list-style: none; padding: 0;">
                  <li><strong>Date:</strong> ${booking.booking_date}</li>
                  <li><strong>Time:</strong> ${booking.booking_time}</li>
                  <li><strong>Group Size:</strong> ${booking.group_size} people</li>
                </ul>
              </div>

              <h3>Meeting Point</h3>
              <p>Please meet your guide at the <strong>Astronomical Clock (Orloj)</strong> in the Old Town Square.</p>
              
              <p>If you have any questions, reply directly to this email!</p>
              <br/>
              <p>Best regards,<br/>The Prague Mysteries Team</p>
            </div>
          `;

          const { data, error: emailError } = await resend.emails.send({
            from: "Prague Mysteries <info@praguetrip.cz>", // IMPORTANT: Change this to your verified Resend domain
            to: [booking.customer_email],
            subject: "Booking Confirmed: Private Dan Brown Prague Tour",
            html: emailHtml,
          });

          if (emailError) {
            console.error("Error sending email via Resend:", emailError);
            // We don't throw here so Stripe still gets a 200 OK (booking is confirmed)
          } else {
            console.log("Email sent successfully via Resend", data);
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Unexpected error handling webhook:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
