// Create context menu item when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "viewJson",
    title: "View as JSON",
    contexts: ["selection"]
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "viewJson") {
    const selectedText = info.selectionText;
    
    // Store the selected text and open viewer
    chrome.storage.local.set({ jsonData: selectedText }, () => {
      chrome.tabs.create({
        url: chrome.runtime.getURL("viewer.html")
      });
    });
  }
});

// Listen for messages from content script (for larger selections)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openJsonViewer") {
    chrome.storage.local.set({ jsonData: request.jsonData }, () => {
      chrome.tabs.create({
        url: chrome.runtime.getURL("viewer.html")
      });
    });
  }
});
