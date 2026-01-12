# PowerShell script to create .env.local file with Stripe configuration
# Run this in PowerShell: .\setup-env.ps1

$envContent = @"
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://hiuemmkhwiaarpdyncgj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpdWVtbWtod2lhYXJwZHluY2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMDgxNDAsImV4cCI6MjA4MDc4NDE0MH0.FRHPXLUx-okrpdVUnhBPZdagg4MCTvUDGowa0dsSMrQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpdWVtbWtod2lhYXJwZHluY2dqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIwODE0MCwiZXhwIjoyMDgwNzg0MTQwfQ.-3y1gFjuhkamg5L6wMVIQWhCUy9SXU5cSWo7uNpQdbc

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51S6ND4CzqBvMqSYFwZYJrUszoHeo9HKmGfC19S1nGZF46wfaww1RgTD2D37dQUArrWcDZSwBeumudR9EFk1bP0Nx00f7AHiEQZ
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Stripe Price IDs (Create products in Stripe Dashboard first)
NEXT_PUBLIC_STRIPE_CORE_PRICE_ID=price_YOUR_CORE_PRICE_ID
NEXT_PUBLIC_STRIPE_DEFI_PRICE_ID=price_YOUR_DEFI_PRICE_ID
NEXT_PUBLIC_STRIPE_WHALE_PRICE_ID=price_YOUR_WHALE_PRICE_ID

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
"@

$envContent | Out-File -FilePath ".env.local" -Encoding utf8 -NoNewline

Write-Host "Created .env.local file with your Stripe publishable key!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Get your Stripe Secret Key from dashboard"
Write-Host "2. Replace STRIPE_SECRET_KEY in .env.local"
Write-Host "3. Create products in Stripe Dashboard and add Price IDs"
Write-Host "4. Set up webhook endpoint (see STRIPE_SETUP.md)"
Write-Host ""
