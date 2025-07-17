#!/bin/bash

# Apply CORS configuration using AWS CLI with R2's S3-compatible API

# Ensure R2 credentials are set
if [[ -z "$AWS_ACCESS_KEY_ID" || -z "$AWS_SECRET_ACCESS_KEY" ]]; then
  echo "Error: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set"
  echo "Please export these environment variables before running this script"
  exit 1
fi

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
        "https://*.visual-prompt-builder.pages.dev",
        "https://kantanprompt.com",
        "https://www.kantanprompt.com"
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
if ! aws s3api put-bucket-cors \
  --bucket "$BUCKET_NAME" \
  --cors-configuration file://cors-config.json \
  --endpoint-url "$R2_ENDPOINT"; then
  echo "Error: Failed to apply CORS configuration"
  rm cors-config.json
  exit 1
fi

# Verify CORS configuration
echo "Verifying CORS configuration..."
aws s3api get-bucket-cors \
  --bucket "$BUCKET_NAME" \
  --endpoint-url "$R2_ENDPOINT"

# Clean up
rm cors-config.json

echo "CORS configuration applied successfully!"