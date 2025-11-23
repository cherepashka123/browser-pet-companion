# Quick Start: Publishing to Chrome Web Store

## ✅ Will It Work for Other Users?

**YES!** The extension will work for all Chrome users because:
- ✅ Uses standard Chrome Extension APIs (Manifest V3)
- ✅ All code is bundled (no external dependencies)
- ✅ SVG pet generation works offline (no API needed)
- ✅ Hugging Face API is optional (falls back to SVG if it fails)

## 🚀 Quick Publishing Steps

### 1. Create Privacy Policy (REQUIRED)

I've created a `PRIVACY_POLICY.md` file for you. You need to:
1. Host it online (GitHub Pages, Netlify, Vercel, or your website)
2. Get the URL (e.g., `https://yourusername.github.io/browser-pet-companion/privacy-policy`)

**Free hosting options:**
- **GitHub Pages**: Create a repo, enable Pages, upload the markdown file
- **Netlify Drop**: Drag and drop the file at https://app.netlify.com/drop
- **Vercel**: Deploy a simple HTML page with the privacy policy

### 2. Update Manifest with Privacy Policy URL

Once you have the URL, add it to `manifest.json`:

```json
{
  "manifest_version": 3,
  "name": "Browser Pet Companion",
  "version": "1.0.0",
  "privacy_policy": "https://your-privacy-policy-url.com",
  ...
}
```

### 3. Prepare Store Assets

You'll need:
- **Screenshots** (1-5): 1280x800 or 640x400 pixels
  - Screenshot of the popup with pet
  - Screenshot showing floating pet on a webpage
  - Screenshot of the Nest Archive
- **Small Promo Tile**: 440x280 pixels
- **Store Description**: Already have one in manifest

### 4. Package the Extension

Run:
```bash
npm run package
```

This creates `browser-pet-companion.zip` in the parent directory.

**OR manually:**
1. Run `npm run build`
2. Create a zip file containing:
   - `manifest.json`
   - `popup.html`
   - `icons/` folder
   - `dist/` folder
   - `PRIVACY_POLICY.md` (optional, but good to include)

**DO NOT include:**
- `node_modules/`
- `src/`
- `*.ts`, `*.tsx` files
- `package.json`, `webpack.config.js`, etc.

### 5. Create Chrome Web Store Developer Account

1. Go to https://chrome.google.com/webstore/devconsole
2. Pay $5 one-time fee
3. Complete identity verification

### 6. Upload to Chrome Web Store

1. Click "New Item" in developer dashboard
2. Upload `browser-pet-companion.zip`
3. Fill in store listing:
   - **Name**: Browser Pet Companion
   - **Description**: (use the one from manifest or expand it)
   - **Category**: Productivity or Lifestyle
   - **Privacy Policy URL**: Your hosted privacy policy URL
   - **Screenshots**: Upload your screenshots
   - **Promo Tile**: Upload your promo tile
4. Answer permission justifications (see PUBLISHING_GUIDE.md)
5. Submit for review

### 7. Wait for Review

- Usually takes 1-3 business days
- Google may ask questions (respond promptly)
- Once approved, your extension goes live!

## 📋 Permission Justifications (Copy-Paste Ready)

When submitting, you'll need to justify permissions:

**`tabs`**: "To track open tabs, detect duplicate/zombie tabs, and help users manage their browser tabs"

**`storage`**: "To save pet configuration, preferences, and archived tabs locally on the user's device"

**`scripting`**: "To inject the floating pet companion UI that appears on web pages"

**`activeTab`**: "To access the current tab's URL and title for categorization"

**`<all_urls>`**: "To display the floating pet companion on all websites the user visits"

## 🔒 Privacy & Data Handling

In the store dashboard, declare:

- **"Does your extension handle user data?"** → **YES**
- **Data Type**: "Browsing activity" (tab URLs, titles)
- **Data Handling**: "Stored locally on device"
- **Data Transmission**: "No data transmitted to external servers" (except optional Hugging Face API for image generation - mention this)
- **Data Sharing**: "No data shared with third parties"

## ⚠️ Important Notes

1. **Hugging Face API**: Free tier has rate limits. The extension gracefully falls back to SVG generation, so it always works.

2. **Version Updates**: Each update requires re-review (usually faster). Update the version number in `manifest.json` before submitting updates.

3. **Testing**: Test on a fresh Chrome profile before submitting to ensure everything works for new users.

## 📚 Full Details

See `PUBLISHING_GUIDE.md` for comprehensive information about:
- Legal requirements
- Security considerations
- Store listing best practices
- Common rejection reasons

## ✅ Pre-Submission Checklist

- [ ] Privacy policy hosted and URL ready
- [ ] Privacy policy URL added to manifest.json
- [ ] Screenshots prepared (1-5)
- [ ] Promo tile created (440x280)
- [ ] Extension tested on fresh Chrome profile
- [ ] Package created (zip file)
- [ ] Developer account created ($5 paid)
- [ ] Store listing written
- [ ] Permission justifications prepared

## 🎉 You're Ready!

Once you complete the checklist above, you're ready to publish! The extension is well-built and should pass review easily.

