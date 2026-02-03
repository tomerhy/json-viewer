# Privacy Policy for JSON Viewer Pro

**Last Updated: February 3, 2026**

## Overview

JSON Viewer Pro is a Chrome extension that helps users format and view JSON data. This privacy policy explains how we handle your data.

## Data Collection

### Analytics Data

We use Google Analytics 4 to collect anonymous usage data to improve the extension. This includes:

- Page views within the extension
- Button clicks (which features are used)
- General feature usage patterns
- JSON parsing statistics (type and size, not content)

**We do NOT collect:**
- The actual JSON content you view
- Personal information (name, email, etc.)
- Browsing history outside the extension
- Any data that could identify you personally

### How Analytics Works

- A random, anonymous client ID is generated and stored locally
- This ID cannot be linked to your identity
- No cookies are used
- Data is sent to Google Analytics via the Measurement Protocol

## How the Extension Works

1. When you select JSON text and use the "View as JSON" feature, the selected text is temporarily stored in your browser's local storage
2. This data is immediately cleared after the JSON viewer page loads
3. All JSON processing happens entirely within your browser

## Permissions Explained

The extension requires the following permissions:

- **contextMenus**: To add the "View as JSON" option to the right-click menu
- **activeTab**: To access the currently selected text on the active page
- **storage**: To temporarily pass the selected JSON to the viewer page

## Data Storage

- JSON data is stored locally in your browser using Chrome's storage API
- JSON data is NOT transmitted to any external servers
- Temporary data is cleared immediately after use
- Only anonymous analytics events are sent to Google Analytics

## Third-Party Services

This extension uses Google Analytics 4 for anonymous usage analytics. No other third-party services are used.

## Your Choices

The extension functions fully regardless of analytics. Analytics helps us understand which features are most useful so we can improve the extension.

## Changes to This Policy

If we make changes to this privacy policy, we will update the "Last Updated" date at the top of this document.

## Contact

If you have questions about this privacy policy, please:
- Open an issue on GitHub: https://github.com/tomerhy/json-viewer
- Email: tomer.haryoffi@gmail.com

## Consent

By using JSON Viewer Pro, you consent to this privacy policy.
