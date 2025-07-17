#!/bin/bash

# Apply CORS configuration to R2 bucket using wrangler

echo "Applying CORS configuration to R2 bucket..."

# Create a temporary wrangler.toml for R2 operations
cat > temp-r2-cors.toml << EOF
name = "r2-cors-config"
account_id = "YOUR_ACCOUNT_ID"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "prompt-builder"
EOF

# Apply CORS using wrangler r2 bucket cors put
wrangler r2 bucket cors put prompt-builder --file docs/R2_CORS_CONFIG.json

# Clean up
rm temp-r2-cors.toml

echo "CORS configuration applied successfully!"