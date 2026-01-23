// Content script to handle text selection
// This is used as a fallback for larger text selections that might be truncated
// by the context menu's selectionText

document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Shift + J to open JSON viewer with selection
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      chrome.runtime.sendMessage({
        action: "openJsonViewer",
        jsonData: selectedText
      });
    }
  }
});
