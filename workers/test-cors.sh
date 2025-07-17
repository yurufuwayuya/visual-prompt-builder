#!/bin/bash

echo "Testing CORS configuration for image.kantanprompt.com..."
echo "=================================================="

# Test 1: OPTIONS request from localhost:5173
echo -e "\n1. Testing OPTIONS request from localhost:5173:"
curl -I -X OPTIONS https://image.kantanprompt.com/ \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  2>/dev/null | grep -E "^(HTTP|Access-Control-)"

# Test 2: OPTIONS request from production domain
echo -e "\n2. Testing OPTIONS request from Pages domain:"
curl -I -X OPTIONS https://image.kantanprompt.com/ \
  -H "Origin: https://visual-prompt-builder.pages.dev" \
  -H "Access-Control-Request-Method: PUT" \
  -H "Access-Control-Request-Headers: Content-Type" \
  2>/dev/null | grep -E "^(HTTP|Access-Control-)"

# Test 3: Simple GET request with Origin header
echo -e "\n3. Testing GET request with Origin header:"
curl -I -X GET https://image.kantanprompt.com/ \
  -H "Origin: http://localhost:5173" \
  2>/dev/null | grep -E "^(HTTP|Access-Control-)"

# Test 4: Check if preflight caching works (MaxAgeSeconds)
echo -e "\n4. Checking preflight cache header:"
curl -I -X OPTIONS https://image.kantanprompt.com/ \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  2>/dev/null | grep -E "Access-Control-Max-Age"

echo -e "\n=================================================="
echo "CORS test complete. Check the headers above."
echo ""
echo "Expected headers for proper CORS:"
echo "- Access-Control-Allow-Origin: <requesting origin>"
echo "- Access-Control-Allow-Methods: GET, PUT, POST, DELETE, HEAD"
echo "- Access-Control-Allow-Headers: *"
echo "- Access-Control-Max-Age: 3600"
echo "- Access-Control-Expose-Headers: ETag, Content-Length, Content-Type"