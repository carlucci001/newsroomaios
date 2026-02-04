#!/bin/bash

# GoDaddy API credentials (get from: https://developer.godaddy.com/keys)
GODADDY_API_KEY="${GODADDY_API_KEY}"
GODADDY_API_SECRET="${GODADDY_API_SECRET}"

# DNS record details
DOMAIN="newsroomaios.com"
RECORD_NAME="the42"
RECORD_TYPE="CNAME"
RECORD_VALUE="cname.vercel-dns.com"
TTL=3600

if [ -z "$GODADDY_API_KEY" ] || [ -z "$GODADDY_API_SECRET" ]; then
  echo "❌ Error: GoDaddy API credentials not set"
  echo ""
  echo "Get your API key from: https://developer.godaddy.com/keys"
  echo ""
  echo "Then run:"
  echo "export GODADDY_API_KEY=your_key_here"
  echo "export GODADDY_API_SECRET=your_secret_here"
  echo "bash scripts/add-godaddy-dns.sh"
  exit 1
fi

echo "Adding DNS record to GoDaddy..."
echo "Domain: $DOMAIN"
echo "Record: $RECORD_NAME.$DOMAIN"
echo "Type: $RECORD_TYPE"
echo "Value: $RECORD_VALUE"
echo ""

# Add CNAME record via GoDaddy API
curl -X PATCH "https://api.godaddy.com/v1/domains/$DOMAIN/records" \
  -H "Authorization: sso-key $GODADDY_API_KEY:$GODADDY_API_SECRET" \
  -H "Content-Type: application/json" \
  -d "[{
    \"type\": \"$RECORD_TYPE\",
    \"name\": \"$RECORD_NAME\",
    \"data\": \"$RECORD_VALUE\",
    \"ttl\": $TTL
  }]"

echo ""
echo "✅ DNS record added!"
echo ""
echo "The site should be accessible at https://the42.newsroomaios.com in 5-15 minutes"
