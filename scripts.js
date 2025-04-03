(async function() {
    'use strict';

    // --- Configuration ---
    const SONG_ROW_SELECTOR = 'div[role="row"][aria-rowindex]';
    const TITLE_SELECTOR = '[data-testid="title"]';
    const ARTIST_SELECTOR = '[data-testid="artist"]';
    const ALBUM_SELECTOR = '[data-testid="album"]';
    const DURATION_SELECTOR = '[data-testid="duration"]';
    const DATE_SELECTOR = '.xogtX'; // Class for the date column
    const POPULARITY_SELECTOR = '[data-testid="popularity"]';
    const FAVORITED_SELECTOR = '[data-testid="HeartFilledIcon"]'; // Filled heart icon
    const LYRICS_SELECTOR = '[data-testid="MicrophoneIcon"]'; // Lyrics button icon
    const COVER_SELECTOR = '[data-testid="cover"]';
    const ROW_INDEX_ATTRIBUTE = 'aria-rowindex';

    // Selector for the main title in the masthead (playlist/album name)
    const SOURCE_NAME_SELECTOR = '[data-testid="masthead"] h2';

    // Scroll settings
    const SCROLL_DELAY_MS = 1000;
    const SCROLL_AMOUNT_PX = 500;
    const MAX_NO_NEW_SONGS_ATTEMPTS = 5;
    const SCROLL_CONTAINER_SELECTOR = null; // Adjust if necessary

    console.log(`Starting Deezer song extraction (Selector: "${SONG_ROW_SELECTOR}")...`);

    // --- Helper Functions ---
    function safeGetText(element, selector) {
        const el = element.querySelector(selector);
        return el ? el.textContent.trim() : '';
    }

    function safeGetAttribute(element, selector, attribute) {
        const el = element.querySelector(selector);
        return el ? el.getAttribute(attribute) : '';
    }

    function safeElementExists(element, selector) {
        return !!element.querySelector(selector);
    }

    function escapeCSV(data) {
        if (data === null || data === undefined) return '';
        const str = String(data);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            const escapedStr = str.replace(/"/g, '""');
            return `"${escapedStr}"`;
        }
        return str;
    }

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function sanitizeFilename(name) {
        if (!name) return "deezer_export";
        let sanitized = name.replace(/[\\/:*?"<>|]/g, ''); // Remove invalid chars
        sanitized = sanitized.replace(/\s+/g, '_'); // Replace whitespace with underscore
        sanitized = sanitized.substring(0, 100); // Limit length
        // Ensure filename isn't just underscores if original was only spaces/invalid chars
        return sanitized.replace(/^_+$/, '') || "deezer_export";
    }

    // --- Get Source Context Name (Playlist/Album etc.) ---
    let sourceContextName = "Unknown Source"; // Default
    try {
        const sourceNameElement = document.querySelector(SOURCE_NAME_SELECTOR);
        if (sourceNameElement && sourceNameElement.textContent.trim()) {
            sourceContextName = sourceNameElement.textContent.trim();
            console.log(`Detected source context: "${sourceContextName}"`);
        } else {
             // Fallback: Try finding the main h1 as sometimes structure differs
             const mainHeading = document.querySelector('h1');
             if (mainHeading && mainHeading.textContent.trim()) {
                 sourceContextName = mainHeading.textContent.trim();
                 console.log(`Detected source context (fallback h1): "${sourceContextName}"`);
             } else {
                 console.warn(`Could not automatically detect source context name using selector "${SOURCE_NAME_SELECTOR}" or h1 fallback. Using default.`);
             }
        }
    } catch (e) {
        console.error("Error trying to detect source context name:", e);
    }
    const safeFilenameBase = sanitizeFilename(sourceContextName);
    const downloadFilename = `${safeFilenameBase}_export_scrolled.csv`;
    console.log(`Will use filename: "${downloadFilename}"`);


    // --- Main Logic ---
    let scrollElement;
    let getScrollTop, setScrollTop, getScrollHeight;

    // Determine scroll element (window or specific container)
    if (SCROLL_CONTAINER_SELECTOR) {
        scrollElement = document.querySelector(SCROLL_CONTAINER_SELECTOR);
        if (!scrollElement) {
            console.error(`Scroll container element not found: "${SCROLL_CONTAINER_SELECTOR}". Falling back to window scrolling.`);
            scrollElement = window;
            getScrollTop = () => window.pageYOffset || document.documentElement.scrollTop;
            setScrollTop = (y) => window.scrollTo(0, y);
            getScrollHeight = () => document.documentElement.scrollHeight;
        } else {
            console.log(`Using scroll container:`, scrollElement);
            getScrollTop = () => scrollElement.scrollTop;
            setScrollTop = (y) => { scrollElement.scrollTop = y; };
            getScrollHeight = () => scrollElement.scrollHeight;
        }
    } else {
        console.log("Using window for scrolling.");
        scrollElement = window;
        getScrollTop = () => window.pageYOffset || document.documentElement.scrollTop;
        setScrollTop = (y) => window.scrollTo(0, y);
        getScrollHeight = () => document.documentElement.scrollHeight;
    }


    const allSongsData = new Map();
    let noNewSongsCounter = 0;
    let previousScrollTop = -1;

    console.log("Scrolling down to collect all songs...");
    setScrollTop(0); // Start from the top
    await wait(SCROLL_DELAY_MS / 2);

    while (noNewSongsCounter < MAX_NO_NEW_SONGS_ATTEMPTS) {
        const currentScrollTop = getScrollTop();
        const currentScrollHeight = getScrollHeight();
        const initialSongCount = allSongsData.size;

        // Scrape currently visible songs
        const songRows = document.querySelectorAll(SONG_ROW_SELECTOR);
        songRows.forEach(row => {
            const rowIndex = row.getAttribute(ROW_INDEX_ATTRIBUTE);
            if (rowIndex && !allSongsData.has(rowIndex)) {
                try {
                    const title = safeGetText(row, TITLE_SELECTOR);
                    if (!title) return; // Skip incomplete rows

                    const artist = safeGetText(row, ARTIST_SELECTOR);
                    const album = safeGetText(row, ALBUM_SELECTOR);
                    const duration = safeGetText(row, DURATION_SELECTOR);
                    const date = safeGetText(row, DATE_SELECTOR);
                    const popularityLabel = safeGetAttribute(row, POPULARITY_SELECTOR, 'aria-label');
                    const isFavorited = safeElementExists(row, FAVORITED_SELECTOR);
                    const hasLyrics = safeElementExists(row, LYRICS_SELECTOR);
                    const artistLink = safeGetAttribute(row, ARTIST_SELECTOR, 'href');
                    const albumLink = safeGetAttribute(row, ALBUM_SELECTOR, 'href');
                    const coverUrl = safeGetAttribute(row, COVER_SELECTOR, 'src');

                    const baseUrl = window.location.origin;
                    const fullArtistLink = artistLink && !artistLink.startsWith('http') ? baseUrl + artistLink : artistLink;
                    const fullAlbumLink = albumLink && !albumLink.startsWith('http') ? baseUrl + albumLink : albumLink;

                    allSongsData.set(rowIndex, {
                        'Row Index': rowIndex,
                        'Title': title,
                        'Artist': artist,
                        'Album': album,
                        'Source Context': sourceContextName, // Add the source context here
                        'Duration': duration,
                        'Date': date,
                        'Popularity': popularityLabel || '',
                        'Favorited': isFavorited,
                        'Has Lyrics': hasLyrics,
                        'Artist Link': fullArtistLink || '',
                        'Album Link': fullAlbumLink || '',
                        'Cover URL': coverUrl || ''
                    });
                } catch (e) {
                    console.warn(`Error processing song row index ${rowIndex}:`, e, row);
                }
            }
        });

        const newSongsFound = allSongsData.size - initialSongCount;
        console.log(`Scraped. Total unique: ${allSongsData.size} (+${newSongsFound} new). Scroll: ${Math.round(currentScrollTop)}/${currentScrollHeight}`);

        // Check stopping conditions
        if (newSongsFound === 0) {
             if (previousScrollTop !== -1 && Math.abs(currentScrollTop - previousScrollTop) < SCROLL_AMOUNT_PX / 2) {
                noNewSongsCounter++;
                console.log(`No new songs & no scroll change, counter: ${noNewSongsCounter}/${MAX_NO_NEW_SONGS_ATTEMPTS}`);
             } else if (previousScrollTop !== -1) {
                 noNewSongsCounter = 1;
                 console.log(`Scrolled but no new songs yet.`);
             }
        } else {
            noNewSongsCounter = 0; // Reset counter
        }

        if (noNewSongsCounter >= MAX_NO_NEW_SONGS_ATTEMPTS) {
            console.log("Reached max attempts without finding new songs or scroll change. Assuming end.");
            break;
        }

        // Check if near bottom
        const elementHeight = scrollElement === window ? window.innerHeight : scrollElement.clientHeight;
        if (currentScrollTop + elementHeight >= currentScrollHeight - 10) {
             console.log("Reached bottom of scrollable area.");
             await wait(SCROLL_DELAY_MS * 1.5); // Wait a bit longer at the end
             const finalSongRows = document.querySelectorAll(SONG_ROW_SELECTOR);
             let finalCount = 0;
             finalSongRows.forEach(row => { // Final scrape pass
                 const rowIndex = row.getAttribute(ROW_INDEX_ATTRIBUTE);
                 if (rowIndex && !allSongsData.has(rowIndex)) {
                      try { // Re-extract just in case
                            const title = safeGetText(row, TITLE_SELECTOR);
                            if (!title) return;
                             const artist = safeGetText(row, ARTIST_SELECTOR);
                            const album = safeGetText(row, ALBUM_SELECTOR);
                            const duration = safeGetText(row, DURATION_SELECTOR);
                            const date = safeGetText(row, DATE_SELECTOR);
                            const popularityLabel = safeGetAttribute(row, POPULARITY_SELECTOR, 'aria-label');
                            const isFavorited = safeElementExists(row, FAVORITED_SELECTOR);
                            const hasLyrics = safeElementExists(row, LYRICS_SELECTOR);
                            const artistLink = safeGetAttribute(row, ARTIST_SELECTOR, 'href');
                            const albumLink = safeGetAttribute(row, ALBUM_SELECTOR, 'href');
                            const coverUrl = safeGetAttribute(row, COVER_SELECTOR, 'src');
                            const baseUrl = window.location.origin;
                            const fullArtistLink = artistLink && !artistLink.startsWith('http') ? baseUrl + artistLink : artistLink;
                            const fullAlbumLink = albumLink && !albumLink.startsWith('http') ? baseUrl + albumLink : albumLink;

                            allSongsData.set(rowIndex, {
                                'Row Index': rowIndex, 'Title': title, 'Artist': artist, 'Album': album,
                                'Source Context': sourceContextName, 'Duration': duration, 'Date': date,
                                'Popularity': popularityLabel || '', 'Favorited': isFavorited, 'Has Lyrics': hasLyrics,
                                'Artist Link': fullArtistLink || '', 'Album Link': fullAlbumLink || '', 'Cover URL': coverUrl || ''
                            });
                            finalCount++;
                        } catch (e) {
                            console.warn(`Error processing final song row index ${rowIndex}:`, e, row);
                        }
                 }
             });
             if (finalCount > 0) console.log(`Found ${finalCount} more song(s) at the bottom.`);
             console.log(`Final song count: ${allSongsData.size}`);
             break; // Exit loop
        }

        // Scroll down
        previousScrollTop = currentScrollTop;
        setScrollTop(currentScrollTop + SCROLL_AMOUNT_PX);
        await wait(SCROLL_DELAY_MS); // Wait for load
    }

    console.log(`Scrolling finished. Extracted ${allSongsData.size} unique songs.`);

    if (allSongsData.size === 0) {
        console.warn("No song data extracted. Check selectors and page content.");
        return;
    }

    // --- Generate CSV ---
    const songsArray = Array.from(allSongsData.values()).sort((a, b) => {
        const indexA = parseInt(a['Row Index'], 10);
        const indexB = parseInt(b['Row Index'], 10);
        return indexA - indexB;
    });

    // Define headers including the new column
    const headers = [
        'Row Index', 'Title', 'Artist', 'Album', 'Source Context', // Added new column
        'Duration', 'Date', 'Popularity', 'Favorited', 'Has Lyrics',
        'Artist Link', 'Album Link', 'Cover URL'
    ];

    // Ensure all objects have all header keys
    const processedSongsArray = songsArray.map(song => {
        const fullSong = {};
        headers.forEach(header => {
            fullSong[header] = song[header] !== undefined ? song[header] : '';
        });
        return fullSong;
    });


    const csvRows = [];
    csvRows.push(headers.map(escapeCSV).join(',')); // Header row

    processedSongsArray.forEach(song => {
        const rowValues = headers.map(header => escapeCSV(song[header]));
        csvRows.push(rowValues.join(','));
    });

    const csvString = csvRows.join('\n');
    console.log("CSV string generated.");

    // Create and trigger download with the dynamic filename
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', downloadFilename); // Use the sanitized filename
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log(`CSV download initiated as "${downloadFilename}".`);
    } else {
        console.error("Browser does not support the download attribute.");
        console.log("CSV Data:\n", csvString);
    }

})();