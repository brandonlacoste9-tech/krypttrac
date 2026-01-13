# 🚀 Krypto Trac Launch Checklist (Golden Master v1.0)

## ☁️ Phase 1: CloudSync (Supabase)

- [ ] Go to [Supabase Dashboard](https://supabase.com/dashboard/project/hiuemmkhwiaarpdyncgj) > **SQL Editor**.
- [ ] Paste the content of `supabase-migration.sql`.
- [ ] Click **Run**.
- [ ] Verify message: `SUCCESS: Golden Master Migration Applied. System is Secure.`

## 🔑 Phase 2: Key Integration (Vercel)

- [ ] Open **Vercel Dashboard** > **Settings** > **Environment Variables**.
- [ ] Add the following keys (copy from your local `.env.local`):
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `GOOGLE_CLOUD_API_KEY`
  - `NEXT_PUBLIC_STRIPE_CORE_PRICE_ID`
  - `NEXT_PUBLIC_STRIPE_DEFI_PRICE_ID` (Magnum Tier)
  - `NEXT_PUBLIC_STRIPE_WHALE_PRICE_ID`
- [ ] **Redeploy** the project to ensure env vars are picked up.

## 💳 Phase 3: The Money Test

- [ ] Open your live app URL (e.g., `https://krypttrac.vercel.app`).
- [ ] Log in.
- [ ] Click the **"High-Yield"** button.
- [ ] Confirm the Upgrade Modal shows **$10/mo**.
- [ ] (Optional) Perform a real transaction with a test card (`4242 4242...`).

## 📢 Phase 4: The Signal (Marketing)

- [ ] Open `BETA_TESTER_INVITE.md`.
- [ ] Copy the **Subject** and **Body**.
- [ ] Send to your first 50 users via BCC.
- [ ] Post the **Twitter Thread** from `TWITTER_MARKETING_THREAD.md`.

## ✅ Status

**System:** GO  
**Security:** SENTINEL ACTIVE  
**Revenue:** ONLINE
