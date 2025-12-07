# 🔧 Troubleshooting Guide - X Invest Extension Not Loading

## Quick Diagnostic Steps

### Step 1: Check Extension is Loaded
1. Open `chrome://extensions/`
2. Look for "X Invest" in the list
3. Check that the toggle is **ON** (blue)
4. Check for any error messages in red

**If you see errors, skip to "Common Errors" section below**

### Step 2: Check Console for Errors
1. Go to https://x.com
2. Press `F12` (or `Cmd+Option+I` on Mac)
3. Click the "Console" tab
4. Look for messages starting with "X Invest:"
   - ✅ Should see: `X Invest: Initializing...`
   - ✅ Should see: `X Invest: Tab created successfully`

**If you see errors, copy them and check "Common Errors" below**

### Step 3: Force Reload
1. On `chrome://extensions/` page
2. Find "X Invest"
3. Click the **refresh icon** (circular arrow)
4. Go to https://x.com
5. **Hard refresh**: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+F5` (Windows)

### Step 4: Check Content Script Loaded
1. On https://x.com with DevTools open (F12)
2. Go to "Sources" tab
3. Look for "Content scripts" in left sidebar
4. Expand it → Should see "X Invest"
5. Should see `content.js` and `styles.css`

**If you don't see these, the extension isn't injecting**

## Common Errors & Fixes

### Error: "Manifest file is missing or unreadable"
**Fix:**
```bash
cd /Users/adi/lab/xinvest.com/dist
cat manifest.json
```
Make sure the file is valid JSON (no syntax errors)

### Error: "Could not load javascript 'content.js'"
**Fix:**
```bash
cd /Users/adi/lab/xinvest.com/dist
ls -la content.js
```
Make sure the file exists and is readable

### Error: "This extension may have been corrupted"
**Fix:**
1. Remove the extension from Chrome
2. Reload it fresh:
   - `chrome://extensions/`
   - "Load unpacked"
   - Select `/Users/adi/lab/xinvest.com/dist`

### No Errors But Still Not Working

#### Check 1: Are you on the right URL?
- ✅ Must be: `https://x.com` or `https://x.com/home`
- ❌ Not: `http://x.com` (no https)
- ❌ Not: `twitter.com` (should work but x.com is primary)

#### Check 2: Is the page fully loaded?
- Wait 2-3 seconds after page loads
- The extension waits for the Grok tab to appear
- If Grok tab doesn't exist, Invest tab won't be created

#### Check 3: Do you have Grok access?
- The extension looks for: `nav[aria-label="Primary"] a[href="/i/grok"]`
- If you don't have Grok, this selector won't find anything
- Check if you can see the "Grok" tab in your X.com sidebar

## Manual Test

Let's test if the script can run manually:

1. Go to https://x.com
2. Open DevTools (F12)
3. Go to "Console" tab
4. Paste this code and press Enter:

```javascript
// Test if we can find the Grok tab
const grokTab = document.querySelector('nav[aria-label="Primary"] a[href="/i/grok"]');
console.log('Grok tab found:', grokTab);

// Test if we can find the primary column
const primaryColumn = document.querySelector('div[data-testid="primaryColumn"]');
console.log('Primary column found:', primaryColumn);
```

**Expected Results:**
- `Grok tab found: <a href="/i/grok">...</a>` ✅
- `Primary column found: <div data-testid="primaryColumn">...</div>` ✅

**If you see `null` for either:**
- Your X.com layout is different
- You might not have Grok access
- X.com might have changed their HTML structure

## Alternative: Test Without Grok Dependency

If you don't have Grok access, I can modify the extension to work without it. Let me know!

## Quick Fix Commands

Run these in your terminal:

```bash
# Navigate to dist folder
cd /Users/adi/lab/xinvest.com/dist

# Check all files exist
ls -la

# Validate manifest.json
cat manifest.json | python3 -m json.tool

# Check file permissions
chmod 644 content.js styles.css manifest.json icon.svg
```

## Still Not Working?

Please provide:

1. **Screenshot of chrome://extensions/** showing X Invest
2. **Console output** from https://x.com (F12 → Console tab)
3. **Answer these questions:**
   - Do you see the Grok tab in your X.com sidebar?
   - What URL are you on exactly?
   - Any error messages in red on chrome://extensions/?

---

**Most Common Issue:** Not having Grok access means the selector can't find the tab to clone.

**Quick Solution:** I can modify the extension to add the tab in a different location (e.g., after Chat or at the bottom of nav).
