# R2 Configuration Guide for Image Generation

## Overview

This guide explains how to configure Cloudflare R2 storage for the Visual Prompt
Builder's image generation feature.

## Current Configuration

- **Bucket Name**: prompt-builder
- **Custom Domain**: https://image.kantanprompt.com
- **Purpose**: Temporary storage for images sent to Replicate API

## Requirements

For Replicate and other external image generation APIs to access uploaded
images, R2 buckets must be configured with:

1. A custom domain for public access
2. Proper CORS configuration for your application domain

## Configuration Steps

### 1. Configure Custom Domain for R2 Bucket

1. Go to your Cloudflare dashboard
2. Navigate to R2 > Your Bucket (prompt-builder)
3. Click on "Settings" tab
4. Under "Custom Domains", add your custom domain:
   - Domain: `image.kantanprompt.com`
5. Wait for the domain to be activated (usually takes a few minutes)

### 2. Configure CORS for R2 Bucket

1. In the R2 bucket settings, go to "CORS policy"
2. Add the CORS configuration from `docs/R2_CORS_CONFIG.json`
3. This allows your application domains to access the uploaded images

### 3. Set Environment Variables

The R2_CUSTOM_DOMAIN is already configured in `wrangler.toml`:

```toml
[vars]
R2_CUSTOM_DOMAIN = "https://image.kantanprompt.com"
```

For local development override, you can add to `.dev.vars`:

```
R2_CUSTOM_DOMAIN=https://image.kantanprompt.com
```

**Important**: Do NOT use the internal URL (`r2.cloudflarestorage.com`) as it's
not publicly accessible.

### 4. Production Configuration

The R2_CUSTOM_DOMAIN is already configured in the production environment in
`wrangler.toml`:

```toml
[env.production]
vars = { ENVIRONMENT = "production", R2_CUSTOM_DOMAIN = "https://image.kantanprompt.com" }
```

No additional secret configuration is needed unless you want to override this
value.

## Common Issues

### Error: "400 Client Error: Bad Request for url"

This error occurs when:

- R2 bucket doesn't have public access enabled
- Using the internal `r2.cloudflarestorage.com` URL instead of the public URL
- The bucket name or configuration is incorrect

### Error: "404 Client Error: Not Found for url"

This error occurs when:

- The public URL is for a different bucket than the one being used
- In development, the `preview_bucket_name` might not match the public URL's
  bucket
- The bucket doesn't have proper CORS configuration

### Solution

1. Ensure custom domain is configured for your R2 bucket
   (image.kantanprompt.com)
2. Use the correct custom domain URL: `https://image.kantanprompt.com`
3. Verify the bucket binding matches your wrangler.toml configuration
4. Check that the custom domain is active in the Cloudflare dashboard
5. **Development workaround**: The system automatically falls back to file.io in
   development mode if R2 is not accessible

## Security Considerations

- Uploaded images are temporary and should be cleaned up after use
- Consider implementing signed URLs for sensitive content
- Set appropriate CORS policies for your domain

## Testing Configuration

Use the provided test script to verify your R2 configuration:

```bash
cd workers
./test-r2-config.sh
```

This script will:

1. Test domain accessibility
2. Check file access (404 for non-existent files is expected)
3. Verify CORS headers

## Alternative for Development

If R2 public access cannot be configured, the system will automatically fall
back to using file.io for temporary image hosting in development mode only.
