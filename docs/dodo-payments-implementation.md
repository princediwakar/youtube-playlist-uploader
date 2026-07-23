# Dodo Payments Implementation Plan

Based on the pricing strategy outlined in `pricing-strategy.md`, here is the proposed architecture and implementation plan for integrating **Dodo Payments** to support the "Locked Grid" model and subscriptions.

## 1. Dodo Payments Dashboard Setup (Products & Prices)

First, configure the product catalog in the Dodo Payments dashboard:

*   **Create the Main Product:** "YouTube Playlist Uploader"
*   **Create Subscription Pricing Plans:**
    *   **Creator Pro (Monthly):** $9.00 (Billed monthly)
    *   **Creator Pro (Yearly):** $49.00 (Billed yearly)


## 2. Database Schema (e.g., Neon)

Track user access and usage to enforce limits:

*   **`users` / `profiles` table:** Standard user data and YouTube channel connection status.
*   **`subscriptions` table:** To store the `dodo_subscription_id`, `status` (active, past_due, canceled), `plan_id` (monthly/yearly), and `current_period_end`.

## 3. The Checkout Flow (The Paywall)

*   **The Trigger:** When a user uploads a batch of videos, the UI processes the first 3 for free. When they click to process the remaining videos, the app checks their subscription status.
*   **The Paywall:** If they have no active subscription, a pricing modal appears offering the Monthly or Yearly plans.
*   **Generating Checkout Sessions:** When they select a plan, your backend calls the Dodo Payments API to create a Checkout Session.
*   **Metadata:** You must pass the internal `user_id` in the Dodo Payments metadata so you know who to credit when the payment succeeds.
*   **Redirection:** Redirect the user to the Dodo Payments hosted checkout page. Upon success, Dodo redirects them back to a success page in your app.

## 4. Webhook Architecture (The Source of Truth)

Webhooks are essential for securely granting access:

*   Create a dedicated API endpoint (e.g., `/api/webhooks/dodo`) to listen for Dodo Payments events.
*   **Listen for Subscription Events:** Handle `subscription.active`, `subscription.renewed`, and `subscription.canceled`. Update your database's `subscriptions` table based on these events to lock or unlock the user's account.

## 5. Enforcing the "Locked Grid" Logic

*   **Free Users:** When the UI renders the grid, the app checks if `subscription.status === 'active'`. If false, the AI generation logic on the backend restricts processing to index 0, 1, and 2. The frontend overlays a lock icon and an "Upgrade to Unlock" button on index 3 and beyond.
*   **Paid Users:** The app verifies the active subscription and processes the entire batch seamlessly with unlimited AI metadata generation.


