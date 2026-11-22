# TWOM Atelier — Analytics & Conversion Funnel Setup Guide

This guide provides step-by-step instructions for activating **Google Analytics 4 (GA4)** and **Microsoft Clarity** on the TWOM online store.

Both tools are **100% free forever** (no credit card required) and provide enterprise-grade analytics without any paid Vercel or Supabase plans.

---

## What This Setup Tracks Automatically

The TWOM codebase is already pre-instrumented with the full **E-Commerce Purchase Funnel**:

```
[ 1,000 Visitors ]  (Session Start — Landing Page / Bio link)
        ↓  40% viewed a piece
[   400 Shoppers ]  (view_item — Viewed Product Details)
        ↓  25% added to bag
[   100 In Cart  ]  (add_to_cart — Added piece to Atelier Bag)
        ↓  60% clicked checkout
[    60 Checkout ]  (begin_checkout — Reached /checkout page)
        ↓  80% paid successfully
[    48 Orders   ]  (purchase — Completed Paystack payment)
```

In addition, you receive:
1. **Best-Selling Products**: Ranked by page views, bag adds, units sold, and total ₦ gross revenue.
2. **Traffic Attribution**: See whether your buyers come from Instagram bio, TikTok, WhatsApp, X (Twitter), or Google search.
3. **Session Replays & Heatmaps**: Watch video recordings of shoppers browsing TWOM on mobile and see heatmaps of where they tap.

---

## Part 1: Get Your Google Analytics 4 Measurement ID

1. Open **[analytics.google.com](https://analytics.google.com)** in your browser and sign in with your Google account.
2. Click **Start measuring** (or click the **Admin ⚙️** gear icon in the bottom-left corner and click **+ Create Property**).
3. **Step 1 — Account Name**:
   - Account Name: `TWOM`
   - Click **Next**.
4. **Step 2 — Property Details**:
   - Property Name: `TWOM Atelier`
   - Reporting Time Zone: Select **Nigeria (GMT+1)** *(or your local timezone)*.
   - Currency: Select **Nigerian Naira (NGN)** *(crucial so your funnel displays sales in ₦)*.
   - Click **Next**.
5. **Step 3 — Business Objectives**:
   - Industry: Select **Shopping / Clothing & Apparel**.
   - Objectives: Check **Drive online sales** and **Examine user behavior**.
   - Click **Create** and accept the terms.
6. **Step 4 — Choose Platform**:
   - Click the **Web** tile.
   - Website URL: Enter your live domain (e.g. `twom.vercel.app` or custom domain).
   - Stream Name: `TWOM Web Store`.
   - Click **Create stream**.
7. **Copy Your Measurement ID**:
   - In the top-right corner of the Stream Details panel, copy your **Measurement ID**:
     ```
     G-XXXXXXXXXX
     ```

---

## Part 2: Get Your Microsoft Clarity Project ID

1. Open **[clarity.microsoft.com](https://clarity.microsoft.com)** and sign in (you can use your same Google account).
2. Click **Add new project**:
   - Name: `TWOM`
   - Website URL: `https://twom.vercel.app` (or your custom domain).
   - Category: Select **E-commerce / Retail**.
   - Click **Add new project**.
3. **Copy Your Project ID**:
   - Look at the top menu and click **Settings** → **Overview**.
   - Locate **Project ID** (a short 8–10 character code like `n7k4m9pq`).
   - *(It is also visible directly in the browser address bar: `clarity.microsoft.com/projects/view/your_project_id`)*.

---

## Part 3: Activate in Your Store (Takes 60 Seconds)

Once you have your two IDs, you simply add them to your environment variables. **No code changes are required.**

### 1. In Local Development (`.env.local`)
Add these two lines to your `.env.local` file:
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_CLARITY_PROJECT_ID=n7k4m9pq
```

### 2. On Vercel (Production)
1. Go to your **[Vercel Dashboard](https://vercel.com/dashboard)**.
2. Click your **twom** project → **Settings** → **Environment Variables**.
3. Add the two keys:
   - Key: `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Value: `G-XXXXXXXXXX`
   - Key: `NEXT_PUBLIC_CLARITY_PROJECT_ID` | Value: `n7k4m9pq`
4. Click **Save** and trigger a Redeploy (or push any commit to `main`).

---

## Part 4: 1-Click Link Clarity to Google Analytics 4

To watch session video recordings of people who abandon at checkout:
1. Open **[clarity.microsoft.com](https://clarity.microsoft.com)**.
2. Go to **Settings** → **Setup** → scroll to **Google Analytics integration**.
3. Click **Connect with Google Analytics**.
4. Select your `TWOM Atelier` property.

Now, whenever you see an abandoned cart in Google Analytics, you can click directly into the Clarity video replay of that shopper.

---

## Part 5: Where to View Your Reports

### 1. The Purchase Funnel (Drop-off Rate)
- In GA4, go to **Reports → Monetization → Purchase Journey**.
- You will see the staircase chart of:
  `Session start → View item → Add to cart → Begin checkout → Purchase`.

### 2. Best-Selling Products
- In GA4, go to **Reports → Monetization → E-Commerce Purchases**.
- You will see a table of each garment ranked by Views, Cart Adds, Units Sold, and ₦ Revenue.

### 3. Customer Video Recordings & Heatmaps
- Open **[clarity.microsoft.com](https://clarity.microsoft.com)**.
- Click **Recordings** to watch how visitors browse on mobile.
- Click **Heatmaps** to see which buttons and garment pictures get the most taps.

### 4. Admin Header Shortcut
The `Analytics ↗` button in your `/admin` header will take you directly to your analytics dashboard whenever you click it.
