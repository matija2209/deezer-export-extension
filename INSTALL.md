# Deezer Playlist Exporter - Installation Guide

This guide will help you install and test the Deezer Playlist Exporter Chrome extension in developer mode.

## Installation Steps

1. **Download the extension files**
   - Make sure you have all the required files:
     - manifest.json
     - popup.html
     - popup.js
     - content.js
     - scripts.js
     - icons/ folder (with placeholder for icon files)

2. **Create icon files (optional for testing)**
   - For proper appearance, create 3 icon files in the `icons/` directory:
     - icon16.png (16x16 pixels)
     - icon48.png (48x48 pixels)
     - icon128.png (128x128 pixels)
   - You can use any icon generator or simple design tool
   - For testing purposes, you can also just copy the same image file to all three names

3. **Load the extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" using the toggle in the top-right corner
   - Click "Load unpacked"
   - Select the folder containing all the extension files
   - The extension should appear in your extensions list

4. **Pin the extension (optional)**
   - Click the extensions icon in Chrome's toolbar (puzzle piece icon)
   - Find "Deezer Playlist Exporter" in the dropdown
   - Click the pin icon to keep it visible in the toolbar

## Testing the Extension

1. **Navigate to Deezer**
   - Go to [Deezer](https://www.deezer.com)
   - Log in to your account
   - Navigate to a playlist, album, or other page containing a list of songs

2. **Use the extension**
   - Click the Deezer Playlist Exporter icon in your browser toolbar
   - Click the "Export Playlist" button
   - Wait for the export process to complete
   - The CSV file will be automatically downloaded

3. **Verify export results**
   - Open the downloaded CSV file
   - Check that all song information is correctly captured
   - The exported file should include all the songs in the playlist

## Troubleshooting

- **Extension icon shows but doesn't work**
  - Make sure you're on a Deezer page with a playlist or album
  - Check the browser console for any errors

- **Export starts but fails**
  - Check if the selectors in scripts.js match the current Deezer page structure
  - Deezer occasionally updates their UI which may require selector updates

- **Icons not showing**
  - Ensure you've created the proper icon files in the icons/ directory
  - Reload the extension from the chrome://extensions/ page

## For Developers

If you need to modify the extension:

1. Make your changes to the relevant files
2. Go to `chrome://extensions/`
3. Find the Deezer Playlist Exporter extension
4. Click the refresh icon to reload the extension
5. Test your changes

The most important files are:
- `scripts.js` - Contains the core export functionality
- `content.js` - Injects the export script into the Deezer page
- `popup.js` - Handles the extension UI and user interactions 