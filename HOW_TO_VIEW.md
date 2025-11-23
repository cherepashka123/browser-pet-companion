# How to View Your Browser Pet Companion Extension

## Step-by-Step Instructions

### 1. Build the Extension

Open a terminal in the `browser-pet-companion` directory and run:

```bash
npm install
npm run build
```

This will create a `dist/` folder with the compiled files.

### 2. Load Extension in Chrome

1. **Open Chrome Extensions Page:**
   - Open Google Chrome
   - Type `chrome://extensions/` in the address bar and press Enter
   - OR go to: Menu (three dots) → Extensions → Manage Extensions

2. **Enable Developer Mode:**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension:**
   - Click the "Load unpacked" button
   - Navigate to and select the `browser-pet-companion` folder
   - Click "Select Folder"

### 3. View Your Extension

Once loaded, you'll see:
- The extension icon in your Chrome toolbar
- Click the icon to open the popup
- On first launch, you'll see the pet creation screen

### 4. Create Your Pet

1. Choose to create a custom pet or select a template
2. Follow the wizard to set up your pet's personality and preferences
3. Your pet will appear in the popup!

### 5. Use the Extension

- **Pet Dashboard**: View your pet's emotion and tab health
- **Nest Archive**: See your closed tabs
- **Settings**: Customize your pet and preferences

## Troubleshooting

### If the build fails:

Try building in development mode:
```bash
npm run build:dev
```

### If extension won't load:

1. Make sure the `dist/` folder exists and contains:
   - `background.js`
   - `popup.js`
   - `content.js`

2. Check the browser console for errors:
   - Right-click the extension icon → "Inspect popup"
   - Or go to `chrome://extensions/` → Click "service worker" link under your extension

### If you see errors:

- Make sure all dependencies are installed: `npm install`
- Check that Node.js version is 16 or higher: `node --version`
- Try deleting `node_modules` and `dist` folders, then run `npm install` again

## Quick Test

After loading, you should:
1. See the extension icon in your toolbar
2. Click it to see the pet creation screen
3. Create a pet and see it react to your tabs!

