#!/bin/sh
# Deploy the current code as a Vercel preview and point the staging URL at it.
# Preview builds use the staging backend + database (VITE_API_BASE_URL is set for Preview in Vercel).
set -e

STAGING_ALIAS="premium-g-staging.vercel.app"

echo "Deploying preview build..."
OUTPUT=$(vercel deploy --yes 2>&1) || { echo "$OUTPUT"; echo "Deploy failed."; exit 1; }

URL=$(echo "$OUTPUT" | grep -oE 'https://premium-g-frontend-[a-z0-9]+-ray-s1\.vercel\.app' | head -1)
if [ -z "$URL" ]; then
  echo "$OUTPUT"
  echo "Could not find the preview URL in Vercel's output."
  exit 1
fi

echo "Preview ready: $URL"
vercel alias set "$URL" "$STAGING_ALIAS"
echo "Staging is live: https://$STAGING_ALIAS"
