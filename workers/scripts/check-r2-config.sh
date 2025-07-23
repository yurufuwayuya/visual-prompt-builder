#!/bin/bash

echo "Checking R2 configuration..."
echo "============================="

# Check if we're in the workers directory
if [ ! -f "package.json" ] || [ ! -f "wrangler.toml" ]; then
    echo "✗ Error: This script must be run from the workers directory"
    exit 1
fi

# Check if .dev.vars exists
echo ""
echo "Checking local development configuration..."
if [ -f ".dev.vars" ]; then
    echo "✓ .dev.vars file found"
    
    # Check if R2 keys are set (without showing actual values)
    if grep -q "R2_ACCESS_KEY_ID=" .dev.vars; then
        if grep -q "R2_ACCESS_KEY_ID=your-r2-access-key-id" .dev.vars; then
            echo "⚠ R2_ACCESS_KEY_ID is still a placeholder"
        else
            echo "✓ R2_ACCESS_KEY_ID is set"
        fi
    else
        echo "✗ R2_ACCESS_KEY_ID is missing"
    fi
    
    if grep -q "R2_SECRET_ACCESS_KEY=" .dev.vars; then
        if grep -q "R2_SECRET_ACCESS_KEY=your-r2-secret-access-key" .dev.vars; then
            echo "⚠ R2_SECRET_ACCESS_KEY is still a placeholder"
        else
            echo "✓ R2_SECRET_ACCESS_KEY is set"
        fi
    else
        echo "✗ R2_SECRET_ACCESS_KEY is missing"
    fi
    
    # Check other important vars
    if grep -q "IMAGE_API_KEY=" .dev.vars; then
        echo "✓ IMAGE_API_KEY is set"
    else
        echo "✗ IMAGE_API_KEY is missing"
    fi
    
    if grep -q "R2_CUSTOM_DOMAIN=" .dev.vars; then
        echo "✓ R2_CUSTOM_DOMAIN is set"
    else
        echo "✗ R2_CUSTOM_DOMAIN is missing"
    fi
else
    echo "✗ .dev.vars file not found"
    echo "  Create it by copying .dev.vars.example:"
    echo "  cp .dev.vars.example .dev.vars"
fi

# Check wrangler secrets
echo ""
echo "Checking Wrangler secrets..."
echo "----------------------------"
npx wrangler secret list 2>/dev/null || echo "✗ Failed to list secrets"

# Check wrangler.toml configuration
echo ""
echo "Checking wrangler.toml configuration..."
echo "--------------------------------------"
if grep -q "R2_CUSTOM_DOMAIN" wrangler.toml; then
    echo "✓ R2_CUSTOM_DOMAIN found in wrangler.toml"
else
    echo "✗ R2_CUSTOM_DOMAIN not found in wrangler.toml"
fi

if grep -q "IMAGE_BUCKET" wrangler.toml; then
    echo "✓ IMAGE_BUCKET binding found in wrangler.toml"
else
    echo "✗ IMAGE_BUCKET binding not found in wrangler.toml"
fi

# Final summary
echo ""
echo "============================="
echo "Configuration check complete!"
echo ""
echo "Next steps:"
echo "1. If you see any ✗ or ⚠ above, follow the setup guide in docs/R2_ACCESS_KEY_SETUP.md"
echo "2. Get R2 API credentials from Cloudflare Dashboard"
echo "3. Update .dev.vars with your actual values"
echo "4. Run 'npm run test:r2' to test the configuration"