#!/bin/bash

# Test R2 configuration with custom domain
# This script tests if the R2 bucket is accessible via the custom domain

CUSTOM_DOMAIN="https://image.kantanprompt.com"
TEST_KEY="test/config-check.txt"

echo "Testing R2 configuration..."
echo "Custom Domain: $CUSTOM_DOMAIN"
echo ""

# Test 1: Check if domain responds
echo "1. Testing domain accessibility..."
curl -I "$CUSTOM_DOMAIN" 2>/dev/null | head -n 1

# Test 2: Try to access a test file
echo ""
echo "2. Testing file access (expected 404 for non-existent file)..."
curl -I "$CUSTOM_DOMAIN/$TEST_KEY" 2>/dev/null | head -n 1

# Test 3: Check CORS headers (if configured)
echo ""
echo "3. Checking CORS headers..."
curl -I -H "Origin: http://localhost:5173" "$CUSTOM_DOMAIN" 2>/dev/null | grep -i "access-control"

echo ""
echo "Test complete. Please verify:"
echo "- Domain should respond with HTTP status (not connection error)"
echo "- 404 for non-existent files is expected"
echo "- CORS headers should be present if configured"