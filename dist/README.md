# X Invest Chrome Extension

A Chrome extension that integrates X Invest directly into X.com (Twitter).

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `/dist` folder from this project

## Features

- **Invest Tab**: Adds an "Invest" tab under the Grok tab in X.com's navigation
- **Seamless Integration**: Opens in the middle section of X.com when clicked
- **TwitterChirp Font**: Uses X.com's native font for perfect visual integration
- **Phosphor Icon**: Features an up arrow icon matching X.com's design language
- **Portfolio Analysis**: Analyze any X account and generate stock portfolios
- **Live Editing**: Edit tickers and portfolio weights directly in the extension
- **Vault Integration**: Opens your full vault in a new tab

## Icons

You need to create three icon files in the `dist/icons/` folder:
- `icon16.png` (16x16px)
- `icon48.png` (48x48px)  
- `icon128.png` (128x128px)

**Icon Design**: Use a bright blue (#1D9BF0) upward trending arrow on a black background to match X.com's color scheme.

You can create these icons using:
1. **Figma/Sketch**: Design the icon and export at different sizes
2. **Online Tools**: Use favicon generators or icon creators
3. **Phosphor Icons**: Download the "trend-up" icon from https://phosphoricons.com/ and style it

## File Structure

```
dist/
├── manifest.json       # Extension configuration
├── content.js          # Main injection script
├── styles.css          # X.com-matched styling
├── icons/              # Extension icons (you need to add these)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           # This file
```

## How It Works

1. **Tab Injection**: The extension finds the Grok tab and clones it to create an Invest tab
2. **Panel Creation**: When clicked, it creates a full-screen panel in the main timeline area
3. **UI Rendering**: The panel contains the full X Invest interface with form, results, and editing capabilities
4. **Data Sync**: Saves portfolio data to localStorage and can open the full web app in a new tab

## Development

To modify the extension:

1. Edit the files in the `/dist` folder
2. Go to `chrome://extensions/`
3. Click the refresh icon on the X Invest extension card
4. Reload X.com to see your changes

## API Integration

Currently, the extension uses mock data. To connect to your actual API:

1. Open `dist/content.js`
2. Find the `handleAnalyze` function
3. Replace the mock data section with an actual fetch call to your API endpoint
4. Update the `openVault` function to point to your production URL instead of localhost

## Styling

The extension uses X.com's exact color palette:
- Background: `rgb(0, 0, 0)`
- Text: `rgb(231, 233, 234)`
- Secondary: `rgb(113, 118, 123)`
- Primary Blue: `rgb(29, 155, 240)`
- Borders: `rgb(47, 51, 54)`
- Font: `TwitterChirp`

## Troubleshooting

**Tab not appearing?**
- Make sure you're on x.com (not twitter.com)
- Check the browser console for errors
- Try refreshing the page

**Panel not opening?**
- Check if the main timeline element exists
- Look for JavaScript errors in the console
- Ensure content script is loaded

**Styling looks off?**
- Clear browser cache
- Check if X.com updated their design system
- Verify styles.css is being injected

## License

This extension is part of the X Invest project.
