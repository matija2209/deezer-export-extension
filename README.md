# Deezer Playlist Exporter

A Chrome extension to export your Deezer playlists to CSV files.

**GitHub Repository**: [https://github.com/matija2209/deezer-export-extension](https://github.com/matija2209/deezer-export-extension)

## Features

- Export any Deezer playlist, album, artist page, etc. with one click
- Automatically captures all song data including titles, artists, albums
- Scrolls through long playlists to ensure all songs are captured
- Keeps a history of your exported playlists
- Simple and clean user interface

## How to Install

### Installation from Chrome Web Store (Coming Soon)

1. Visit the Chrome Web Store listing (link to be added)
2. Click "Add to Chrome"
3. Confirm the installation

### Manual Installation (Developer Mode)

1. Download or clone this repository: `git clone https://github.com/matija2209/deezer-export-extension.git`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the folder containing the extension files
5. The extension should now appear in your browser toolbar

## How to Use

1. Navigate to any Deezer playlist, album, or page containing song lists
2. Click the Deezer Playlist Exporter icon in your browser toolbar
3. Click the "Export Playlist" button
4. Wait for the export process to complete
5. The CSV file will be automatically downloaded to your default download location
6. You can view your export history in the extension popup

## CSV Format

The exported CSV file includes the following columns:

- Row Index
- Title
- Artist
- Album
- Source Context (playlist/album name)
- Duration
- Date (if available)
- Popularity (if available)
- Favorited (whether the song is favorited)
- Has Lyrics (whether lyrics are available)
- Artist Link
- Album Link
- Cover URL

## Development

To contribute to the development of this extension:

1. Fork the repository
2. Clone your fork
3. Make your changes
4. Create a pull request

For more detailed instructions on setting up the development environment, see [INSTALL.md](INSTALL.md).

## Privacy

This extension operates entirely locally in your browser. No data is sent to any external servers. Your playlist information is processed within your browser, and the resulting CSV file is saved directly to your device.

## License

MIT License 