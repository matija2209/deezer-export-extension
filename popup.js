document.addEventListener('DOMContentLoaded', function() {
  const exportButton = document.getElementById('export-button');
  const loadingIndicator = document.getElementById('loading-indicator');
  const statusText = document.getElementById('status-text');
  const notDeezerMessage = document.getElementById('not-deezer-message');
  const exportContainer = document.getElementById('export-container');
  const historyList = document.getElementById('history-list');
  const noHistory = document.getElementById('no-history');

  // Check if current page is a Deezer page
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];
    if (!currentTab.url.includes('deezer.com')) {
      notDeezerMessage.classList.remove('hidden');
      exportContainer.classList.add('hidden');
      return;
    }

    // Load export history
    loadExportHistory();
  });

  // Handle export button click
  exportButton.addEventListener('click', function() {
    // Update UI to loading state
    exportButton.disabled = true;
    loadingIndicator.classList.remove('hidden');
    statusText.textContent = 'Exporting playlist...';

    // Send message to content script to start export
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: 'startExport' },
        function(response) {
          if (chrome.runtime.lastError) {
            handleError('Failed to connect to page. Please refresh and try again.');
            return;
          }

          if (response && response.status === 'started') {
            statusText.textContent = 'Export in progress...';
          } else if (response && response.status === 'error') {
            handleError(response.message || 'Unknown error occurred');
          }
        }
      );
    });
  });

  // Listen for messages from content script
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'exportComplete') {
      handleExportComplete(message.data);
    } else if (message.action === 'exportError') {
      handleError(message.error);
    } else if (message.action === 'exportProgress') {
      statusText.textContent = `Exporting... ${message.progress}`;
    }
    sendResponse({ received: true });
    return true;
  });

  function handleExportComplete(data) {
    // Reset UI
    exportButton.disabled = false;
    loadingIndicator.classList.add('hidden');
    statusText.textContent = 'Export completed successfully!';
    
    // Save to history
    saveToHistory(data.name, data.url, data.count);
    
    // Update history display
    loadExportHistory();
  }

  function handleError(message) {
    exportButton.disabled = false;
    loadingIndicator.classList.add('hidden');
    statusText.textContent = `Error: ${message}`;
    statusText.classList.add('text-red-600');
    
    // Remove error styling after 5 seconds
    setTimeout(() => {
      statusText.classList.remove('text-red-600');
      statusText.textContent = 'Ready to export playlist data';
    }, 5000);
  }

  function saveToHistory(name, url, songCount) {
    chrome.storage.local.get('exportHistory', function(data) {
      const history = data.exportHistory || [];
      
      // Add new entry at the beginning
      history.unshift({
        name: name,
        url: url,
        songCount: songCount,
        timestamp: new Date().toISOString()
      });
      
      // Keep only the most recent 10 entries
      const trimmedHistory = history.slice(0, 10);
      
      chrome.storage.local.set({ exportHistory: trimmedHistory });
    });
  }

  function loadExportHistory() {
    chrome.storage.local.get('exportHistory', function(data) {
      const history = data.exportHistory || [];
      
      if (history.length === 0) {
        noHistory.classList.remove('hidden');
        historyList.innerHTML = '';
        return;
      }
      
      noHistory.classList.add('hidden');
      
      // Clear the current list
      historyList.innerHTML = '';
      
      // Add each history entry
      history.forEach(function(entry) {
        const date = new Date(entry.timestamp);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const listItem = document.createElement('li');
        listItem.className = 'history-item p-2 rounded cursor-pointer';
        listItem.innerHTML = `
          <div class="flex justify-between">
            <div class="font-medium truncate" title="${entry.name}">${entry.name}</div>
            <div class="text-gray-500 text-xs">${formattedDate}</div>
          </div>
          <div class="text-xs text-gray-600">${entry.songCount} songs</div>
        `;
        
        // Add click handler to open the URL
        listItem.addEventListener('click', function() {
          chrome.tabs.create({ url: entry.url });
        });
        
        historyList.appendChild(listItem);
      });
    });
  }
}); 