#!/bin/bash

# X Invest Extension - Quick Diagnostic Script

echo "🔍 X Invest Extension Diagnostics"
echo "=================================="
echo ""

# Check if dist folder exists
if [ ! -d "/Users/adi/lab/xinvest.com/dist" ]; then
    echo "❌ ERROR: /dist folder not found!"
    exit 1
fi

cd /Users/adi/lab/xinvest.com/dist

echo "📁 Checking files..."
echo ""

# Check required files
files=("manifest.json" "content.js" "styles.css" "icon.svg")
all_exist=true

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        size=$(ls -lh "$file" | awk '{print $5}')
        echo "✅ $file ($size)"
    else
        echo "❌ $file - MISSING!"
        all_exist=false
    fi
done

echo ""

if [ "$all_exist" = false ]; then
    echo "❌ Some files are missing. Extension won't work."
    exit 1
fi

# Validate manifest.json
echo "🔍 Validating manifest.json..."
if python3 -m json.tool manifest.json > /dev/null 2>&1; then
    echo "✅ manifest.json is valid JSON"
else
    echo "❌ manifest.json has syntax errors!"
    exit 1
fi

echo ""

# Check file permissions
echo "🔐 Checking file permissions..."
for file in "${files[@]}"; do
    perms=$(ls -l "$file" | awk '{print $1}')
    echo "   $file: $perms"
done

echo ""
echo "=================================="
echo "✅ All basic checks passed!"
echo ""
echo "📝 Next steps:"
echo "1. Open chrome://extensions/"
echo "2. Enable 'Developer mode'"
echo "3. Click 'Load unpacked'"
echo "4. Select: /Users/adi/lab/xinvest.com/dist"
echo "5. Go to https://x.com"
echo "6. Open DevTools (F12) and check Console tab"
echo ""
echo "🐛 If still not working:"
echo "- Check TROUBLESHOOTING.md in the dist folder"
echo "- Look for console errors on x.com"
echo "- Make sure you have Grok access (or use content-no-grok.js)"
echo ""
