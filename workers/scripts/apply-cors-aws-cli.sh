#!/bin/bash

# Apply CORS configuration using AWS CLI with R2's S3-compatible API

# Set your R2 credentials
export AWS_ACCESS_KEY_ID="YOUR_R2_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="YOUR_R2_SECRET_ACCESS_KEY"

# R2 endpoint
R2_ENDPOINT="https://1b154d8dab68e47be1d8dc7734f1d802.r2.cloudflarestorage.com"
BUCKET_NAME="prompt-builder"

echo "Applying CORS configuration to R2 bucket using AWS CLI..."

# Create CORS configuration file
cat > cors-config.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "https://visual-prompt-builder.pages.dev",
        "https://*.visual-prompt-builder.pages.dev"
      ],
      "AllowedMethods": [
        "GET",
        "PUT",
        "POST",
        "DELETE",
        "HEAD"
      ],
      "AllowedHeaders": [
        "*"
      ],
      "ExposeHeaders": [
        "ETag",
        "Content-Length",
        "Content-Type"
      ],
      "MaxAgeSeconds": 3600
    }
  ]
}
EOF

# Apply CORS configuration
aws s3api put-bucket-cors \
  --bucket "$BUCKET_NAME" \
  --cors-configuration file://cors-config.json \
  --endpoint-url "$R2_ENDPOINT"

# Verify CORS configuration
echo "Verifying CORS configuration..."
aws s3api get-bucket-cors \
  --bucket "$BUCKET_NAME" \
  --endpoint-url "$R2_ENDPOINT"

# Clean up
rm cors-config.json

echo "CORS configuration applied successfully!"