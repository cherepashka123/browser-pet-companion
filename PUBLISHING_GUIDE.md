# Publishing Guide: Browser Pet Companion

## ✅ Will It Work for Other Users?

**Yes, with minor considerations:**

1. **Core Functionality**: ✅ Works for everyone
   - Uses standard Chrome Extension APIs (Manifest V3)
   - All data stored locally (`chrome.storage.local`)
   - SVG pet generation works offline (no API needed)

2. **AI Image Generation**: ⚠️ May be limited
   - Hugging Face API (free tier) has rate limits
   - First-time model loading can take 20-30 seconds
   - Falls back to SVG generation if API fails (so it always works)

3. **Dependencies**: ✅ All bundled
   - React, TypeScript compiled to JavaScript
   - No external CDN dependencies
   - Works offline after installation

## 🔒 Legal & Security Requirements for Chrome Web Store

### 1. **Privacy Policy** (REQUIRED)

You **MUST** create a privacy policy because your extension:
- Accesses tab URLs, titles, and domains
- Stores user data locally
- Uses `<all_urls>` permission
- Makes API calls to Hugging Face (third-party service)

**Create a privacy policy page** (host it on GitHub Pages, your website, or a free hosting service):

```markdown
# Privacy Policy for Browser Pet Companion

**Last Updated: [DATE]**

## Data Collection

Browser Pet Companion stores the following data **locally on your device**:
- Tab information (URLs, titles, domains, active time)
- Pet configuration and preferences
- Archived tabs (Nest Archive)
- Tab categorization rules

**We do NOT:**
- Send any data to external servers
- Track your browsing history
- Share data with third parties
- Collect personal information

## Third-Party Services

### Hugging Face Inference API
- Used for AI-generated pet avatars (optional)
- Images generated on-demand, not stored by Hugging Face
- Free tier may have rate limits
- Privacy policy: https://huggingface.co/privacy

## Permissions

- **tabs**: To track open tabs and help manage tab clutter
- **storage**: To save your pet configuration and preferences locally
- **scripting**: To inject the floating pet UI on web pages
- **activeTab**: To access current tab information
- **<all_urls>**: To display the floating pet on all websites

## Data Storage

All data is stored locally using Chrome's `chrome.storage.local` API. 
Data is never transmitted to external servers.

## Contact

[Your email or contact form]
```

### 2. **Permissions Justification** (REQUIRED in Chrome Web Store)

In the Chrome Web Store developer dashboard, you'll need to justify each permission:

- **`tabs`**: "To track open tabs, detect duplicates/zombie tabs, and help users manage their browser tabs"
- **`storage`**: "To save pet configuration, preferences, and archived tabs locally on the user's device"
- **`scripting`**: "To inject the floating pet companion UI that appears on web pages"
- **`activeTab`**: "To access the current tab's URL and title for categorization"
- **`<all_urls>`**: "To display the floating pet companion on all websites the user visits"

### 3. **Single Purpose Policy** (REQUIRED)

Your extension must have a single, clear purpose. ✅ **You're good here:**
- **Purpose**: "A pet companion that helps users manage browser tabs and organize them into categories"

### 4. **Content Security Policy** (CSP)

Your extension should comply with CSP. Check your `manifest.json`:
- ✅ No inline scripts
- ✅ No `eval()`
- ✅ External resources properly declared

### 5. **User Data Privacy** (REQUIRED)

In Chrome Web Store dashboard, you'll need to declare:

**"Does your extension handle user data?"** → **YES**

Then specify:
- **Data Type**: "Browsing activity" (tab URLs, titles)
- **Data Handling**: "Stored locally on device"
- **Data Transmission**: "No data transmitted to external servers" (except optional Hugging Face API for image generation)
- **Data Sharing**: "No data shared with third parties"

### 6. **Store Listing Requirements**

You'll need:
- ✅ **Name**: "Browser Pet Companion"
- ✅ **Description**: Already have one
- ✅ **Screenshots**: 1-5 screenshots (1280x800 or 640x400)
- ✅ **Small Promo Tile**: 440x280
- ✅ **Marquee Promo Tile** (optional): 920x680
- ✅ **Privacy Policy URL**: Link to your privacy policy
- ✅ **Category**: Productivity or Lifestyle
- ✅ **Language**: English (and others if you support them)

### 7. **Developer Account**

- **One-time fee**: $5 USD (one-time, not recurring)
- **Verification**: Google will verify your identity
- **Account type**: Individual or Organization

### 8. **Review Process**

Chrome Web Store review typically takes:
- **First submission**: 1-3 business days
- **Updates**: Usually faster (hours to 1 day)

**Common rejection reasons to avoid:**
- ❌ Missing privacy policy
- ❌ Unclear permission justifications
- ❌ Violating single purpose policy
- ❌ Malicious code or obfuscation
- ❌ Copyright violations (images, code)

## 🛠️ Pre-Publishing Checklist

### Code Quality
- [x] No console.log in production (or minimal, for debugging)
- [x] Error handling for API calls
- [x] Graceful fallbacks (SVG if AI fails)
- [x] No hardcoded API keys (✅ you're good - using free tier)
- [x] TypeScript compiled without errors
- [x] Webpack builds successfully

### Manifest
- [x] Valid Manifest V3
- [x] All required icons present
- [x] Permissions justified
- [x] Version number set

### Testing
- [ ] Test on fresh Chrome profile (no existing data)
- [ ] Test pet creation flow
- [ ] Test tab management features
- [ ] Test floating pet appears
- [ ] Test archive functionality
- [ ] Test on different websites
- [ ] Test with many tabs (30+)

### Assets
- [ ] Screenshots (1-5)
- [ ] Promo tile (440x280)
- [ ] Privacy policy hosted and linked
- [ ] Store description polished

## 📝 Recommended Changes Before Publishing

### 1. Add Privacy Policy Link to Manifest

```json
{
  "manifest_version": 3,
  ...
  "privacy_policy": "https://yourwebsite.com/privacy-policy"
}
```

### 2. Improve Error Handling

Consider adding user-friendly error messages if Hugging Face API fails.

### 3. Add Version to Manifest

Update version for each release:
```json
"version": "1.0.0"
```

### 4. Add Homepage URL (Optional)

```json
{
  "homepage_url": "https://github.com/yourusername/browser-pet-companion"
}
```

## 🚀 Publishing Steps

1. **Create Privacy Policy**
   - Write privacy policy (use template above)
   - Host it (GitHub Pages, Netlify, Vercel, etc.)
   - Get the URL

2. **Prepare Store Assets**
   - Take screenshots of your extension
   - Create promo tile
   - Write store description

3. **Create Developer Account**
   - Go to https://chrome.google.com/webstore/devconsole
   - Pay $5 one-time fee
   - Complete verification

4. **Package Extension**
   - Run `npm run build`
   - Zip the `dist/` folder, `manifest.json`, `popup.html`, and `icons/` folder
   - **Do NOT include**: `node_modules/`, `src/`, `package.json`, etc.

5. **Upload to Chrome Web Store**
   - Go to developer dashboard
   - Click "New Item"
   - Upload zip file
   - Fill in store listing
   - Submit for review

6. **Wait for Review**
   - Usually 1-3 business days
   - Google may ask questions
   - Respond promptly

## ⚠️ Important Notes

### Hugging Face API
- Free tier has rate limits
- May require API key for higher limits (users can add their own)
- Consider making it optional or using only SVG generation

### Data Storage
- Chrome storage has limits (~10MB)
- Consider adding archive size limits
- Warn users if approaching limit

### Updates
- Each update requires re-review (usually faster)
- Update version number in manifest
- Test thoroughly before submitting updates

## 📚 Resources

- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [Chrome Extension Publishing Guide](https://developer.chrome.com/docs/webstore/publish/)
- [Privacy Policy Requirements](https://developer.chrome.com/docs/webstore/user-data/)
- [Single Purpose Policy](https://developer.chrome.com/docs/webstore/single-purpose/)

## 🎯 Summary

**Your extension is ready to publish!** Just need to:
1. ✅ Create privacy policy (REQUIRED)
2. ✅ Prepare store assets (screenshots, etc.)
3. ✅ Pay $5 developer fee
4. ✅ Submit for review

The extension will work for all users. The SVG fallback ensures pet generation always works, even if Hugging Face API is unavailable.

