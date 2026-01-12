$envFile = ".env.local"
$googleKey = "AQ.Ab8RN6IB_CyfOEueG5cq3y_Nt3vPeMbHadYNLI4POn0vpwQlWg"

Add-Content -Path $envFile -Value ""
Add-Content -Path $envFile -Value "# Google Cloud / Vertex AI"
Add-Content -Path $envFile -Value "GOOGLE_CLOUD_API_KEY=$googleKey"
Add-Content -Path $envFile -Value "NEXT_PUBLIC_VERTEX_AI_KEY=$googleKey"

Write-Host "Added Google Cloud / Vertex AI keys to .env.local" -ForegroundColor Green
