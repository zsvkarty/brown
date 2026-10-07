// Booking page: a four-step flow (group, date & time, details, summary)
// that ends in Stripe Checkout. Availability and booking creation go
// through js/booking-api.js.

(function () {
    // Private tour price (EUR) by group size - keep in sync with the
    // pricing in brown-admin-dashboard/app/api/checkout/create-session.
    const PRICE_BY_GROUP_SIZE = { 2: 99, 3: 129, 4: 155, 5: 175, 6: 189, 7: 199, 8: 209 };
    const TOUR_TIMES = ['10:00', '14:00', '16:00', '18:00'];
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
        'August', 'September', 'October', 'November', 'December'];
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // TEMPORARY soft-lock while Stripe checkout runs in sandbox mode. A
    // client-side check only (visible in page source), not real security -
    // remove once the site is confirmed on live Stripe keys.
    const BOOKING_UNLOCK_PASSWORD = 'brownpassword';

    const form = document.getElementById('book-form');
    if (!form) return;

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

    const state = { step: 1, group: null, date: null, time: null, unlocked: false, paying: false };
    const today = new Date();
    const view = { year: today.getFullYear(), month: today.getMonth() };
    let taken = new Set(); // "YYYY-MM-DD HH:MM" for booked or blocked slots in the shown month
    let loadId = 0;

    const pad = (n) => String(n).padStart(2, '0');
    const isoDate = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
    const longDate = (iso) => {
        const [y, m, d] = iso.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        });
    };
    const shortDate = (iso) => {
        const [y, m, d] = iso.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    };
    const field = (name) => form.elements[name].value.trim();

    // ---------- step completeness ----------

    function detailsValid() {
        return field('customerName') !== '' && EMAIL_RE.test(field('email'));
    }

    function complete(step) {
        if (step === 1) return state.group !== null;
        if (step === 2) return state.date !== null && state.time !== null;
        if (step === 3) return detailsValid();
        return false;
    }

    // A step can be opened once every step before it is complete.
    function reachable(step) {
        for (let s = 1; s < step; s++) if (!complete(s)) return false;
        return true;
    }

    // ---------- navigation ----------

    function goTo(step, { push = true } = {}) {
        if (!reachable(step)) step = 1;
        state.step = step;

        $$('.book__step', form).forEach((section) => {
            section.hidden = Number(section.dataset.step) !== step;
        });
        if (push) history.pushState({ bookStep: step }, '', `#step-${step}`);

        renderStepBar();
        renderBar();
        if (step === 2) renderCalendar();
        if (step === 4) renderReview();

        window.scrollTo({ top: 0, behavior: 'auto' });
        const heading = $(`.book__step[data-step="${step}"] .book__title`, form);
        if (heading) heading.focus({ preventScroll: true });
    }

    function next() {
        clearError();
        if (state.step === 3 && !showDetailErrors()) return;
        if (state.step === 4) { pay(); return; }
        if (complete(state.step)) goTo(state.step + 1);
    }

    function prev() {
        clearError();
        if (state.step > 1) goTo(state.step - 1);
    }

    // ---------- rendering ----------

    function renderStepBar() {
        $$('.book__stepbar li').forEach((li) => {
            const n = Number(li.dataset.step);
            const button = $('button', li);
            li.classList.toggle('is-done', n < state.step);
            li.classList.toggle('is-current', n === state.step);
            li.classList.toggle('is-next', n === state.step + 1);
            button.disabled = n === state.step || !reachable(n);
            if (n === state.step) button.setAttribute('aria-current', 'step');
            else button.removeAttribute('aria-current');
        });
    }

    function renderBar() {
        const prevBtn = $('#book-prev');
        const nextBtn = $('#book-next');
        // keeps its place in the bar on step 1 so the layout doesn't jump
        prevBtn.style.visibility = state.step === 1 ? 'hidden' : 'visible';
        nextBtn.textContent = state.step === 4 && state.group ? `Pay €${PRICE_BY_GROUP_SIZE[state.group]}` : 'Next step';
        // steps 1-2 unlock "Next" once a choice is made; steps 3-4 validate on click
        nextBtn.disabled = state.paying || (state.step <= 2 && !complete(state.step));
        renderSummary();
    }

    function renderSummary() {
        const price = state.group ? PRICE_BY_GROUP_SIZE[state.group] : null;
        const set = (key, value) => {
            $$(`[data-summary="${key}"]`).forEach((el) => {
                el.textContent = value || '—';
                el.classList.toggle('is-empty', !value);
            });
        };
        set('date', state.date ? longDate(state.date) : '');
        set('time', state.time || '');
        set('group', state.group ? `${state.group} people` : '');
        set('price', price ? `€${price}` : '');

        // phones: two short lines in the bottom bar
        const [line1, line2] = $$('#book-mini span');
        if (!state.group) {
            line1.textContent = 'Private tour';
            line2.textContent = 'from €99';
        } else {
            line1.textContent = `€${price} · ${state.group} people`;
            line2.textContent = state.date
                ? [shortDate(state.date), state.time].filter(Boolean).join(' · ')
                : '';
        }
    }

    function renderGroups() {
        $$('.book__group').forEach((button) => {
            const selected = Number(button.dataset.size) === state.group;
            button.classList.toggle('is-selected', selected);
            button.setAttribute('aria-pressed', String(selected));
        });
    }

    async function renderCalendar() {
        const grid = $('#cal-days');
        const label = $('#cal-month');
        const prevMonth = $('#cal-prev');
        label.textContent = `${MONTHS[view.month]} ${view.year}`;
        prevMonth.disabled = view.year === today.getFullYear() && view.month === today.getMonth();

        const id = ++loadId;
        grid.setAttribute('aria-busy', 'true');
        $('#cal-status').textContent = 'Loading availability…';

        const { data, error } = await bookingAPI.getAvailability(view.year, view.month);
        if (id !== loadId) return; // a newer month was requested meanwhile
        grid.removeAttribute('aria-busy');

        if (error) {
            $('#cal-status').textContent = 'We couldn’t load availability. Please refresh the page or write to info@praguetrip.cz.';
            grid.innerHTML = '';
            return;
        }
        $('#cal-status').textContent = '';
        taken = new Set(data.map((slot) => `${slot.date} ${slot.time}`));

        grid.innerHTML = '';
        // Monday-first grid
        const lead = (new Date(view.year, view.month, 1).getDay() + 6) % 7;
        for (let i = 0; i < lead; i++) grid.appendChild(document.createElement('span'));

        const days = new Date(view.year, view.month + 1, 0).getDate();
        for (let d = 1; d <= days; d++) {
            const iso = isoDate(view.year, view.month, d);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'cal__day';
            button.textContent = d;
            button.dataset.date = iso;

            if (openTimes(iso).length === 0) {
                button.disabled = true;
                // struck through only when every time is booked, not when the day has passed
                if (TOUR_TIMES.every((t) => taken.has(`${iso} ${t}`))) {
                    button.classList.add('is-full');
                    button.title = 'Fully booked';
                }
            }
            if (iso === state.date) {
                button.classList.add('is-selected');
                button.setAttribute('aria-pressed', 'true');
            }
            grid.appendChild(button);
        }

        // the chosen date may have filled up since it was picked
        if (state.date && state.date.startsWith(`${view.year}-${pad(view.month + 1)}`) && openTimes(state.date).length === 0) {
            state.date = null;
            state.time = null;
        }
        renderTimes();
        renderBar();
    }

    // Times still bookable on a date: not taken, and not already past today.
    function openTimes(iso) {
        const [y, m, d] = iso.split('-').map(Number);
        return TOUR_TIMES.filter((t) => {
            const [hh, mm] = t.split(':').map(Number);
            return !taken.has(`${iso} ${t}`) && new Date(y, m - 1, d, hh, mm) > new Date();
        });
    }

    function renderTimes() {
        const wrap = $('#times');
        const hint = $('#times-hint');
        if (!state.date) {
            wrap.hidden = true;
            hint.hidden = false;
            return;
        }
        wrap.hidden = false;
        hint.hidden = true;
        $('#times-date').textContent = longDate(state.date);

        const open = openTimes(state.date);
        if (state.time && !open.includes(state.time)) state.time = null;
        $$('.book__time', wrap).forEach((button) => {
            const t = button.dataset.time;
            const available = open.includes(t);
            button.disabled = !available;
            $('.book__time-state', button).textContent = available ? 'Available' : 'Booked';
            const selected = t === state.time;
            button.classList.toggle('is-selected', selected);
            button.setAttribute('aria-pressed', String(selected));
        });
    }

    function renderReview() {
        const rows = {
            name: field('customerName'),
            email: field('email'),
            phone: field('phone') || 'Not given',
            date: state.date ? longDate(state.date) : '',
            time: state.time,
            group: `${state.group} people`,
            requests: field('specialRequests') || 'None',
            total: `€${PRICE_BY_GROUP_SIZE[state.group]}`,
        };
        Object.entries(rows).forEach(([key, value]) => {
            const el = $(`[data-review="${key}"]`);
            if (el) el.textContent = value;
        });
    }

    // ---------- validation + errors ----------

    function setFieldError(name, message) {
        const input = form.elements[name];
        const out = $(`#err-${name}`);
        input.setAttribute('aria-invalid', message ? 'true' : 'false');
        out.textContent = message || '';
        out.hidden = !message;
    }

    function showDetailErrors() {
        const nameOk = field('customerName') !== '';
        const emailOk = EMAIL_RE.test(field('email'));
        setFieldError('customerName', nameOk ? '' : 'Please enter your full name');
        setFieldError('email', emailOk ? '' : 'Please enter a valid email address');
        if (!nameOk) form.elements.customerName.focus();
        else if (!emailOk) form.elements.email.focus();
        return nameOk && emailOk;
    }

    function showError(message) {
        const box = $('#book-error');
        box.textContent = message;
        box.hidden = false;
    }

    function clearError() {
        $('#book-error').hidden = true;
    }

    // ---------- payment ----------

    function unlock() {
        if (state.unlocked) return true;
        const input = prompt('This tour is still in testing. Enter the password to continue booking:');
        if (input === null) return false;
        if (input === BOOKING_UNLOCK_PASSWORD) {
            state.unlocked = true;
            return true;
        }
        alert('Incorrect password.');
        return false;
    }

    async function pay() {
        const terms = form.elements.terms;
        const termsError = $('#err-terms');
        termsError.hidden = terms.checked;
        if (!terms.checked) { terms.focus(); return; }
        if (!unlock()) return;

        state.paying = true;
        const nextBtn = $('#book-next');
        nextBtn.textContent = 'Opening secure payment…';
        nextBtn.disabled = true;

        try {
            const { data: booking, error } = await bookingAPI.createBooking({
                tourId: 'private-tour',
                date: state.date,
                time: state.time,
                customerName: field('customerName'),
                email: field('email'),
                phone: field('phone'),
                groupSize: state.group,
                specialRequests: field('specialRequests'),
            });
            if (error) throw new Error(error);

            const here = window.location.href.split(/[?#]/)[0];
            const { data: checkout, error: checkoutError } = await bookingAPI.createCheckoutSession(
                booking.id,
                bookingAPI.buildConfirmationUrl(booking),
                `${here}?payment=cancelled`
            );
            if (checkoutError) throw new Error(checkoutError);

            window.location.href = checkout.url;
        } catch (err) {
            state.paying = false;
            renderBar();
            showError(`Sorry, something went wrong: ${err.message}. Nothing has been charged.`);
        }
    }

    // ---------- events ----------

    $$('.book__group').forEach((button) => {
        button.addEventListener('click', () => {
            state.group = Number(button.dataset.size);
            renderGroups();
            renderBar();
            renderStepBar();
        });
    });

    $('#cal-prev').addEventListener('click', () => {
        view.month -= 1;
        if (view.month < 0) { view.month = 11; view.year -= 1; }
        renderCalendar();
    });
    $('#cal-next').addEventListener('click', () => {
        view.month += 1;
        if (view.month > 11) { view.month = 0; view.year += 1; }
        renderCalendar();
    });
    $('#cal-days').addEventListener('click', (e) => {
        const button = e.target.closest('.cal__day');
        if (!button || button.disabled) return;
        state.date = button.dataset.date;
        $$('.cal__day').forEach((b) => {
            const on = b === button;
            b.classList.toggle('is-selected', on);
            b.setAttribute('aria-pressed', String(on));
        });
        renderTimes();
        renderBar();
        renderStepBar();
    });
    $$('.book__time').forEach((button) => {
        button.addEventListener('click', () => {
            if (button.disabled) return;
            state.time = button.dataset.time;
            renderTimes();
            renderBar();
            renderStepBar();
        });
    });

    ['customerName', 'email'].forEach((name) => {
        form.elements[name].addEventListener('input', () => {
            if (form.elements[name].getAttribute('aria-invalid') === 'true') setFieldError(name, '');
            renderStepBar();
        });
    });
    form.elements.terms.addEventListener('change', () => {
        if (form.elements.terms.checked) $('#err-terms').hidden = true;
    });

    $$('.book__stepbar button').forEach((button) => {
        button.addEventListener('click', () => goTo(Number(button.closest('li').dataset.step)));
    });
    $$('[data-edit]').forEach((button) => {
        button.addEventListener('click', () => goTo(Number(button.dataset.edit)));
    });

    $('#book-next').addEventListener('click', next);
    $('#book-prev').addEventListener('click', prev);
    // Enter in a text field moves on instead of submitting the form
    form.addEventListener('submit', (e) => { e.preventDefault(); next(); });

    window.addEventListener('popstate', (e) => {
        const step = (e.state && e.state.bookStep) || 1;
        goTo(step, { push: false });
    });

    // ---------- start ----------

    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'cancelled') {
        $('#book-notice').hidden = false;
        history.replaceState(null, '', window.location.pathname);
    }

    renderGroups();
    history.replaceState({ bookStep: 1 }, '', window.location.pathname);
    goTo(1, { push: false });
})();
