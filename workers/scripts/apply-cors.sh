#!/bin/bash

# Apply CORS configuration to R2 bucket using wrangler

echo "Applying CORS configuration to R2 bucket..."

# Validate required file exists
if [ ! -f "docs/R2_CORS_CONFIG.json" ]; then
  echo "Error: docs/R2_CORS_CONFIG.json not found. Please ensure you're running from the workers directory."
  exit 1
fi

# Apply CORS using wrangler r2 bucket cors put
if ! wrangler r2 bucket cors put prompt-builder --file docs/R2_CORS_CONFIG.json; then
  echo "Error: Failed to apply CORS configuration"
  exit 1
fi

echo "CORS configuration applied successfully!"