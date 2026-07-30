# Stripe Integration Guide for Static Site (GitHub Pages)

Because this website (**`brown`**) is a **static web app hosted on GitHub Pages**, all code runs directly in the user's browser.

> [!WARNING]
> **NEVER put your Stripe Secret Key (`sk_live_...`) in this repository or in any static JS file.** Anyone inspecting the web page can steal your secret key.

---

## Option 1: Stripe Payment Links (Simplest — 100% Serverless on GitHub Pages)

Stripe Payment Links allow you to accept payments without hosting any server or secret keys. You generate a buy link in Stripe and redirect users directly to it.

### Step 1: Create Payment Links in Stripe
1. Log in to **[Stripe Dashboard](https://dashboard.stripe.com/)** (Ensure **Test mode** is OFF for live payments).
2. Go to **More → Payment Links** (or search "Payment Links").
3. Click **+ New**.
4. Add your product (e.g., "Private Dan Brown Prague Tour" — €150).
5. In **After payment** section (Confirmation page settings):
   - Select **"Redirect customers to your website"**.
   - Set **Redirect URL** to your custom domain confirmation page:
     `https://praguetrip.cz/confirmation` (or `https://praguetrip.cz/confirmation.html`).
6. Click **Create link**.
7. Copy the generated URL (looks like `https://buy.stripe.com/live_abc123...`).

### Step 2: Put the Link in `js/cart.js`
In your codebase, open [js/cart.js](file:///Users/gosha/Documents/GitHub/brown/js/cart.js):

```javascript
const services = {
    'private-tour': {
        name: 'Private Dan Brown Prague Tour',
        price: 150,
        duration: '2-3 hours',
        maxGroupSize: 8,
        pricingType: 'per-group',
        // PASTE YOUR LIVE STRIPE PAYMENT LINK HERE:
        stripePaymentLink: 'https://buy.stripe.com/YOUR_LIVE_LINK_HERE' 
    },
    'escape-room': {
        name: 'Dan Brown Mystery Escape Room',
        price: 35,
        duration: '60 minutes',
        maxGroupSize: 6,
        pricingType: 'per-person',
        stripePaymentLink: 'https://buy.stripe.com/YOUR_ESCAPE_ROOM_LINK_HERE'
    }
};
```

### Step 3: Redirect Customer to Payment Link
In your frontend submit handler (or button click):
```javascript
const paymentUrl = generateStripePaymentUrl({ email: customerEmail });
window.location.href = paymentUrl;
```

---

## Option 2: Dynamic Stripe Checkout via Supabase Edge Function / Backend

If you want real-time date/time availability checking and automatic booking status confirmation in your database before taking payment:

1. **Frontend (GitHub Pages)**:
   - Inserts booking into Supabase (`status: pending`).
   - Calls an external endpoint via `fetch()` (such as Supabase Edge Function or a serverless API).
2. **External Serverless Function**:
   - Holds `STRIPE_SECRET_KEY` safely in its environment variables.
   - Creates a Stripe Checkout Session using `stripe.checkout.sessions.create()`.
   - Returns `{ url: "https://checkout.stripe.com/..." }`.
3. **Frontend Redirect**:
   - `window.location.href = result.url`.

---

## Summary: What Variables Do You Need & Where?

| Method | What to Get from Stripe | Where to Put It |
| :--- | :--- | :--- |
| **Option 1: Payment Links** | Live Payment Link URL (`https://buy.stripe.com/...`) | Directly in [js/cart.js](file:///Users/gosha/Documents/GitHub/brown/js/cart.js) |
| **Option 2: Dynamic Checkout** | `STRIPE_SECRET_KEY` (`sk_live_...`) | In Supabase Edge Function secrets or Serverless Environment Variables (NOT GitHub Pages) |
