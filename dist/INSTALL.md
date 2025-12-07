# 🚀 Quick Start Guide - X Invest Chrome Extension

## Installation (2 minutes)

1. **Open Chrome Extensions**
   - Go to `chrome://extensions/` in your Chrome browser
   - Or click the puzzle icon → "Manage Extensions"

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Navigate to and select: `/Users/adi/lab/xinvest.com/dist`
   - Click "Select"

4. **Done!** 🎉
   - The X Invest extension is now installed
   - You'll see it in your extensions list

## Using the Extension

1. **Go to X.com**
   - Navigate to https://x.com or https://twitter.com

2. **Find the Invest Tab**
   - Look in the left sidebar navigation
   - You'll see a new "Invest" tab with an up arrow icon (↗)
   - It's positioned right below the "Grok" tab

3. **Click to Open**
   - Click the "Invest" tab
   - The X Invest interface will replace the main timeline
   - The timeline is hidden while X Invest is open

4. **Analyze an Account**
   - Enter a Twitter handle (without @)
   - Click the search button
   - Wait for Grok to analyze the tweets

5. **Edit Your Portfolio**
   - Review the suggested tickers
   - Adjust weights as needed
   - Add or remove tickers

6. **Open Vault**
   - Click "Open Vault" to see full analytics
   - This opens your web app in a new tab

## Features

✅ **Seamless Integration** - Looks native to X.com  
✅ **TwitterChirp Font** - Matches X.com's typography  
✅ **Phosphor Icons** - Beautiful, scalable SVG icons  
✅ **Dark Theme** - Perfectly matches X.com's dark mode  
✅ **Real-time Editing** - Edit tickers and weights instantly  
✅ **Local Storage** - Your data persists across sessions  

## Troubleshooting

**Tab not showing?**
- Refresh the X.com page
- Check if the extension is enabled in chrome://extensions/
- Make sure you're on x.com (not twitter.com might work but x.com is primary)

**Panel not opening?**
- Check the browser console (F12) for errors
- Try clicking the tab again
- Refresh the page

**Styling looks off?**
- Clear your browser cache
- Disable other X.com extensions temporarily
- Check if X.com updated their design

## Development

To modify the extension:

1. Edit files in `/dist`
2. Go to `chrome://extensions/`
3. Click the refresh icon on the X Invest card
4. Reload X.com

## Next Steps

- Connect to your actual API endpoint (edit `content.js`)
- Update the vault URL to your production domain
- Add more features as needed

---

**Need help?** Check the main README.md for detailed documentation.
