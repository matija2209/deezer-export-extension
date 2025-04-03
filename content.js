// Deezer Playlist Exporter - Content Script
(function() {
  'use strict';

  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'startExport') {
      // Check if we're on a Deezer page
      if (!window.location.href.includes('deezer.com')) {
        sendResponse({ status: 'error', message: 'Not a Deezer page' });
        return true;
      }

      // Set up event listeners for monitoring export progress
      const messageListener = function(event) {
        // We'll use this to catch console.log messages from the script
        if (event.source === window && event.data && typeof event.data === 'object') {
          if (event.data.type === 'DEEZER_EXPORT_LOG') {
            const message = event.data.message;
            
            // Check for specific log messages to report progress
            if (message.includes('Starting Deezer song extraction')) {
              chrome.runtime.sendMessage({
                action: 'exportProgress',
                progress: 'Starting export...'
              });
            } else if (message.includes('Scrolling down to collect all songs')) {
              chrome.runtime.sendMessage({
                action: 'exportProgress',
                progress: 'Scrolling to collect songs...'
              });
            } else if (message.includes('Scraped. Total unique:')) {
              const match = message.match(/Total unique: (\d+)/);
              if (match && match[1]) {
                chrome.runtime.sendMessage({
                  action: 'exportProgress',
                  progress: `Found ${match[1]} songs so far...`
                });
              }
            } else if (message.includes('CSV string generated')) {
              chrome.runtime.sendMessage({
                action: 'exportProgress',
                progress: 'Generating CSV file...'
              });
            } else if (message.includes('CSV download initiated as')) {
              const match = message.match(/CSV download initiated as "([^"]+)"/);
              const filename = match ? match[1] : 'unknown_file.csv';
              
              // Get additional info from previous logs
              let sourceContextName = "Unknown Source";
              const contextMatch = logHistory.find(log => log.includes('Detected source context:'));
              if (contextMatch) {
                const nameMatch = contextMatch.match(/Detected source context: "([^"]+)"/);
                if (nameMatch && nameMatch[1]) {
                  sourceContextName = nameMatch[1];
                }
              }
              
              let songCount = 0;
              const countMatch = logHistory.find(log => log.includes('Final song count:'));
              if (countMatch) {
                const numberMatch = countMatch.match(/Final song count: (\d+)/);
                if (numberMatch && numberMatch[1]) {
                  songCount = parseInt(numberMatch[1], 10);
                }
              }
              
              chrome.runtime.sendMessage({
                action: 'exportComplete',
                data: {
                  name: sourceContextName,
                  filename: filename,
                  count: songCount,
                  url: window.location.href
                }
              });
            } else if (message.includes('Error') || message.includes('error')) {
              chrome.runtime.sendMessage({
                action: 'exportError',
                error: message
              });
            }
            
            // Keep a rolling log history to extract context information
            logHistory.push(message);
            if (logHistory.length > 30) logHistory.shift();
          }
        }
      };
      
      let logHistory = [];
      window.addEventListener('message', messageListener);
      
      // Override console.log to catch export progress
      try {
        // Inject script to override console.log and capture progress
        const interceptorScript = document.createElement('script');
        interceptorScript.textContent = `
          // Store the original console.log
          const originalConsoleLog = console.log;
          
          // Override console.log
          console.log = function() {
            // Call the original console.log
            originalConsoleLog.apply(console, arguments);
            
            // Convert arguments to a string
            const message = Array.from(arguments).join(' ');
            
            // Send the message to content script
            window.postMessage({
              type: 'DEEZER_EXPORT_LOG',
              message: message
            }, '*');
          };
        `;
        document.head.appendChild(interceptorScript);
        document.head.removeChild(interceptorScript);
        
        // Now inject the export script
        const scriptPath = chrome.runtime.getURL('scripts.js');
        const script = document.createElement('script');
        script.src = scriptPath;
        script.onerror = function() {
          console.error('Failed to load export script.');
          chrome.runtime.sendMessage({
            action: 'exportError',
            error: 'Failed to load export script'
          });
          window.removeEventListener('message', messageListener);
        };
        document.head.appendChild(script);
        
        sendResponse({ status: 'started' });
      } catch (error) {
        console.error('Error injecting script:', error);
        window.removeEventListener('message', messageListener);
        sendResponse({ 
          status: 'error', 
          message: error.message || 'Failed to start export script' 
        });
      }
      
      return true; // Keep the message channel open for async response
    }
  });

  // Check if we're on a Deezer page and notify popup
  if (window.location.href.includes('deezer.com')) {
    chrome.runtime.sendMessage({ action: 'onDeezerPage' });
  }
})(); 