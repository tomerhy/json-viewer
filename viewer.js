// JSON Viewer Pro - Main Script

// GA4 Measurement Protocol Configuration
const GA_CONFIG = {
  measurementId: 'G-CY79S1XCC4',
  apiSecret: 'XqBAkvLhTnuOOeTtEe9Zpg'
};

// Get or create a client ID for analytics
function getClientId() {
  let clientId = localStorage.getItem('ga_client_id');
  if (!clientId) {
    clientId = crypto.randomUUID();
    localStorage.setItem('ga_client_id', clientId);
  }
  return clientId;
}

// Analytics helper using Measurement Protocol
function trackEvent(eventName, params = {}) {
  if (GA_CONFIG.apiSecret === 'YOUR_API_SECRET') {
    return; // Skip if API secret not configured
  }
  
  const payload = {
    client_id: getClientId(),
    events: [{
      name: eventName,
      params: {
        ...params,
        engagement_time_msec: 100
      }
    }]
  };
  
  fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${GA_CONFIG.measurementId}&api_secret=${GA_CONFIG.apiSecret}`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }).catch(() => {
    // Silently fail - analytics should not break the app
  });
}

// Track page view on load
function trackPageView() {
  trackEvent('page_view', {
    page_title: 'JSON Viewer Pro',
    page_location: 'chrome-extension://json-viewer-pro'
  });
}

class JSONViewer {
  constructor() {
    this.jsonInput = document.getElementById('jsonInput');
    this.treeView = document.getElementById('treeView');
    this.rawView = document.getElementById('rawView');
    this.errorView = document.getElementById('errorView');
    this.errorMessage = document.getElementById('errorMessage');
    this.inputStats = document.getElementById('inputStats');
    this.toast = document.getElementById('toast');
    this.toastMessage = document.getElementById('toastMessage');
    
    this.currentView = 'tree';
    this.parsedJson = null;
    
    this.init();
  }
  
  init() {
    // Track page view
    trackPageView();
    
    // Display version
    this.displayVersion();
    
    // Load JSON from storage (from context menu selection)
    this.loadFromStorage();
    
    // Setup event listeners
    this.setupEventListeners();
  }
  
  displayVersion() {
    const versionBadge = document.getElementById('versionBadge');
    if (versionBadge && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
      const manifest = chrome.runtime.getManifest();
      versionBadge.textContent = `v${manifest.version}`;
    }
  }
  
  loadFromStorage() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['jsonData'], (result) => {
        if (result.jsonData) {
          trackEvent('feature_usage', { feature: 'context_menu_load' });
          this.jsonInput.value = result.jsonData;
          this.parseAndRender();
          // Clear storage after loading
          chrome.storage.local.remove(['jsonData']);
        }
      });
    }
  }
  
  setupEventListeners() {
    // Input change
    let debounceTimer;
    this.jsonInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => this.parseAndRender(), 300);
    });
    
    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        trackEvent('feature_usage', { feature: 'view_toggle', view_type: view });
        this.switchView(view);
      });
    });
    
    // Expand/Collapse all
    document.getElementById('expandAll').addEventListener('click', () => {
      trackEvent('button_click', { button_name: 'expand_all' });
      this.expandAll();
    });
    
    document.getElementById('collapseAll').addEventListener('click', () => {
      trackEvent('button_click', { button_name: 'collapse_all' });
      this.collapseAll();
    });
    
    // Copy button
    document.getElementById('copyBtn').addEventListener('click', () => {
      trackEvent('button_click', { button_name: 'copy_json' });
      this.copyToClipboard();
    });
    
    // Download button
    document.getElementById('downloadBtn').addEventListener('click', () => {
      trackEvent('button_click', { button_name: 'download_json' });
      this.downloadJson();
    });
    
    // Paste button
    document.getElementById('pasteBtn').addEventListener('click', async () => {
      trackEvent('button_click', { button_name: 'paste_json' });
      try {
        const text = await navigator.clipboard.readText();
        this.jsonInput.value = text;
        this.parseAndRender();
      } catch (err) {
        this.showToast('Failed to paste from clipboard');
      }
    });
  }
  
  parseAndRender() {
    const input = this.jsonInput.value.trim();
    
    if (!input) {
      this.showEmptyState();
      this.inputStats.textContent = '';
      return;
    }
    
    try {
      this.parsedJson = JSON.parse(input);
      this.updateStats(input);
      this.renderTree();
      this.renderRaw();
      this.showView(this.currentView);
      
      // Track successful JSON parse
      const jsonType = Array.isArray(this.parsedJson) ? 'array' : 'object';
      const itemCount = Array.isArray(this.parsedJson) ? this.parsedJson.length : Object.keys(this.parsedJson).length;
      trackEvent('feature_usage', { 
        feature: 'json_parsed', 
        json_type: jsonType,
        item_count: itemCount,
        size_bytes: new Blob([input]).size
      });
    } catch (err) {
      trackEvent('feature_usage', { feature: 'json_parse_error' });
      this.showError(err.message);
    }
  }
  
  updateStats(input) {
    const bytes = new Blob([input]).size;
    const formatted = this.formatBytes(bytes);
    this.inputStats.textContent = formatted;
  }
  
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  renderTree() {
    const html = this.generateTreeHTML(this.parsedJson, 0, true);
    this.treeView.innerHTML = html;
    this.attachToggleListeners();
  }
  
  generateTreeHTML(data, indent = 0, isLast = true) {
    const indentStr = '<span class="json-indent"></span>'.repeat(indent);
    
    if (data === null) {
      return `<span class="json-null">null</span>${isLast ? '' : '<span class="json-comma">,</span>'}`;
    }
    
    if (typeof data === 'boolean') {
      return `<span class="json-boolean">${data}</span>${isLast ? '' : '<span class="json-comma">,</span>'}`;
    }
    
    if (typeof data === 'number') {
      return `<span class="json-number">${data}</span>${isLast ? '' : '<span class="json-comma">,</span>'}`;
    }
    
    if (typeof data === 'string') {
      const escaped = this.escapeHtml(data);
      return `<span class="json-string">${escaped}</span>${isLast ? '' : '<span class="json-comma">,</span>'}`;
    }
    
    if (Array.isArray(data)) {
      return this.generateArrayHTML(data, indent, isLast);
    }
    
    if (typeof data === 'object') {
      return this.generateObjectHTML(data, indent, isLast);
    }
    
    return '';
  }
  
  generateArrayHTML(arr, indent, isLast) {
    const id = this.generateId();
    const size = arr.length;
    const indentStr = '<span class="json-indent"></span>'.repeat(indent);
    const innerIndentStr = '<span class="json-indent"></span>'.repeat(indent + 1);
    
    if (size === 0) {
      return `<span class="json-bracket">[]</span>${isLast ? '' : '<span class="json-comma">,</span>'}`;
    }
    
    let html = `<span class="json-toggle" data-target="${id}">▼</span><span class="json-bracket">[</span><span class="json-size">${size} items</span>`;
    html += `<div id="${id}" class="json-collapsed-content" style="display: block;">`;
    
    arr.forEach((item, index) => {
      const itemIsLast = index === arr.length - 1;
      html += `<div class="json-line">${innerIndentStr}${this.generateTreeHTML(item, indent + 1, itemIsLast)}</div>`;
    });
    
    html += `</div><div class="json-line json-closing">${indentStr}<span class="json-bracket">]</span>${isLast ? '' : '<span class="json-comma">,</span>'}</div>`;
    
    return html;
  }
  
  generateObjectHTML(obj, indent, isLast) {
    const id = this.generateId();
    const keys = Object.keys(obj);
    const size = keys.length;
    const indentStr = '<span class="json-indent"></span>'.repeat(indent);
    const innerIndentStr = '<span class="json-indent"></span>'.repeat(indent + 1);
    
    if (size === 0) {
      return `<span class="json-bracket">{}</span>${isLast ? '' : '<span class="json-comma">,</span>'}`;
    }
    
    let html = `<span class="json-toggle" data-target="${id}">▼</span><span class="json-bracket">{</span><span class="json-size">${size} keys</span>`;
    html += `<div id="${id}" class="json-collapsed-content" style="display: block;">`;
    
    keys.forEach((key, index) => {
      const itemIsLast = index === keys.length - 1;
      const escapedKey = this.escapeHtml(key);
      const value = this.generateTreeHTML(obj[key], indent + 1, itemIsLast);
      html += `<div class="json-line">${innerIndentStr}<span class="json-key">"${escapedKey}"</span><span class="json-colon">:</span> ${value}</div>`;
    });
    
    html += `</div><div class="json-line json-closing">${indentStr}<span class="json-bracket">}</span>${isLast ? '' : '<span class="json-comma">,</span>'}</div>`;
    
    return html;
  }
  
  generateId() {
    return 'json-' + Math.random().toString(36).substr(2, 9);
  }
  
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  
  attachToggleListeners() {
    this.treeView.querySelectorAll('.json-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        const targetId = e.target.dataset.target;
        const content = document.getElementById(targetId);
        const closingBracket = content.nextElementSibling;
        
        if (content.style.display === 'none') {
          content.style.display = 'block';
          closingBracket.style.display = 'block';
          e.target.textContent = '▼';
          e.target.classList.remove('collapsed');
          trackEvent('feature_usage', { feature: 'tree_node_expand' });
        } else {
          content.style.display = 'none';
          closingBracket.style.display = 'none';
          e.target.textContent = '▶';
          e.target.classList.add('collapsed');
          trackEvent('feature_usage', { feature: 'tree_node_collapse' });
        }
      });
    });
  }
  
  renderRaw() {
    const formatted = JSON.stringify(this.parsedJson, null, 2);
    this.rawView.textContent = formatted;
  }
  
  switchView(view) {
    this.currentView = view;
    
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    this.showView(view);
  }
  
  showView(view) {
    this.errorView.style.display = 'none';
    
    if (view === 'tree') {
      this.treeView.style.display = 'block';
      this.rawView.style.display = 'none';
    } else {
      this.treeView.style.display = 'none';
      this.rawView.style.display = 'block';
    }
  }
  
  showError(message) {
    this.treeView.style.display = 'none';
    this.rawView.style.display = 'none';
    this.errorView.style.display = 'flex';
    this.errorMessage.textContent = message;
  }
  
  showEmptyState() {
    this.treeView.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3"/>
        </svg>
        <div class="empty-state-title">No JSON to display</div>
        <div class="empty-state-desc">Paste JSON in the input panel or select text on any page and right-click → "View as JSON"</div>
      </div>
    `;
    this.errorView.style.display = 'none';
  }
  
  expandAll() {
    this.treeView.querySelectorAll('.json-toggle').forEach(toggle => {
      const targetId = toggle.dataset.target;
      const content = document.getElementById(targetId);
      const closingBracket = content.nextElementSibling;
      
      content.style.display = 'block';
      closingBracket.style.display = 'block';
      toggle.textContent = '▼';
      toggle.classList.remove('collapsed');
    });
  }
  
  collapseAll() {
    this.treeView.querySelectorAll('.json-toggle').forEach(toggle => {
      const targetId = toggle.dataset.target;
      const content = document.getElementById(targetId);
      const closingBracket = content.nextElementSibling;
      
      content.style.display = 'none';
      closingBracket.style.display = 'none';
      toggle.textContent = '▶';
      toggle.classList.add('collapsed');
    });
  }
  
  copyToClipboard() {
    if (!this.parsedJson) {
      this.showToast('No JSON to copy');
      return;
    }
    
    const formatted = JSON.stringify(this.parsedJson, null, 2);
    navigator.clipboard.writeText(formatted).then(() => {
      this.showToast('Copied to clipboard!');
    }).catch(() => {
      this.showToast('Failed to copy');
    });
  }
  
  downloadJson() {
    if (!this.parsedJson) {
      this.showToast('No JSON to download');
      return;
    }
    
    const formatted = JSON.stringify(this.parsedJson, null, 2);
    const blob = new Blob([formatted], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showToast('JSON downloaded!');
  }
  
  showToast(message) {
    this.toastMessage.textContent = message;
    this.toast.classList.add('show');
    
    setTimeout(() => {
      this.toast.classList.remove('show');
    }, 2500);
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new JSONViewer();
});
