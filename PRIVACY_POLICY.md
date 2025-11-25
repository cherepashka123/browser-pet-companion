# Privacy Policy for Browser Pet Companion

**Last Updated: December 2024**

## Introduction

Browser Pet Companion ("we", "our", "the extension") is a Chrome browser extension that helps users manage their browser tabs with a friendly pet companion. This privacy policy explains how we handle your data.

## Data Collection and Storage

### What We Store Locally

Browser Pet Companion stores the following data **exclusively on your device** using Chrome's local storage:

- **Tab Information**: URLs, page titles, domains, and active time for open tabs
- **Pet Configuration**: Your pet's name, appearance, personality settings, and generated icons
- **Nest Archive**: Archived tabs (URLs, titles, domains) that you've closed
- **Tab Categories**: Your tab categorization rules and preferences
- **Settings**: Notification preferences and extension settings

### What We Do NOT Collect

- ❌ We do NOT send any data to external servers
- ❌ We do NOT track your browsing history beyond what's needed for tab management
- ❌ We do NOT share data with third parties
- ❌ We do NOT collect personal information
- ❌ We do NOT use analytics or tracking services

## Third-Party Services

### AI Image Generation

Browser Pet Companion uses **Hugging Face Inference API** to generate custom pet avatars:

- **Service**: Hugging Face Inference API (api-inference.huggingface.co)
- **Data Sent**: Only text prompts describing your pet (e.g., "cute cat with blue colors")
- **Purpose**: Generate custom pet avatar images
- **Data Retention**: Hugging Face may temporarily cache requests per their terms
- **Fallback**: If AI generation fails, we use locally generated SVG graphics
- **User Control**: You can regenerate or change your pet at any time

**Important**: No personal data, browsing history, or tab content is ever sent to external services.

## Third-Party Services

### Hugging Face Inference API

Browser Pet Companion uses the Hugging Face Inference API (free tier) to generate AI pet avatars. 

- **What is sent**: Pet description prompts (e.g., "a cute cat with a hat")
- **What is received**: Generated pet images
- **Data retention**: Images are generated on-demand and stored locally on your device. Hugging Face does not store your prompts or images.
- **Privacy**: Hugging Face's privacy policy: https://huggingface.co/privacy

**Note**: If the Hugging Face API is unavailable, the extension automatically uses SVG-based pet generation, which works entirely offline.

## Permissions Explained

Browser Pet Companion requests the following permissions:

- **`tabs`**: To track open tabs, detect duplicate/zombie tabs, and help manage tab clutter
- **`storage`**: To save your pet configuration, preferences, and archived tabs locally
- **`scripting`**: To inject the floating pet companion UI that appears on web pages
- **`activeTab`**: To access the current tab's URL and title for categorization
- **`<all_urls>`**: To display the floating pet companion on all websites you visit

All permissions are used solely for the extension's core functionality and no data is transmitted externally.

## Data Storage Location

All data is stored locally on your device using Chrome's `chrome.storage.local` API. Data is never transmitted to external servers or cloud services.

## Data Deletion

You can delete all extension data at any time by:
1. Uninstalling the extension (removes all stored data)
2. Using Chrome's "Clear browsing data" feature for extensions
3. Resetting the extension in Chrome's extension settings

## Children's Privacy

Browser Pet Companion is not intended for children under 13. We do not knowingly collect data from children.

## Changes to This Privacy Policy

We may update this privacy policy from time to time. The "Last Updated" date at the top indicates when changes were made. Continued use of the extension after changes constitutes acceptance of the updated policy.

## Contact

If you have questions about this privacy policy or how your data is handled, please contact us at:

[Your email address or contact form URL]

## Your Rights

You have the right to:
- Access your stored data (via Chrome's storage API or extension settings)
- Delete your data (by uninstalling the extension)
- Understand how your data is used (this privacy policy)
- Opt out of features (disable notifications, categorization, etc. in settings)

---

**Browser Pet Companion** - A cozy companion for your browser tabs.

