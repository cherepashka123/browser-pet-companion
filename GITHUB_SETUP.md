# GitHub Setup Instructions

Follow these steps to set up your GitHub repository and enable GitHub Pages for the privacy policy.

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `browser-pet-companion`
3. Description: "A cozy AI-generated pet companion Chrome extension"
4. Make it **Public** (required for free GitHub Pages)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 2: Initialize Git and Push

Run these commands in your terminal (from the browser-pet-companion directory):

```bash
cd /Applications/Antigravity.app/Contents/Resources/browser-pet-companion

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Browser Pet Companion extension"

# Add remote (replace with your actual GitHub username if different)
git remote add origin https://github.com/cherepashka123/browser-pet-companion.git

# Push to GitHub
git branch -M main
git push -u origin main
```

If you get authentication errors, you may need to:
- Use a personal access token instead of password
- Or use SSH: `git remote set-url origin git@github.com:cherepashka123/browser-pet-companion.git`

## Step 3: Enable GitHub Pages

1. Go to your repository: https://github.com/cherepashka123/browser-pet-companion
2. Click **Settings** (top right)
3. Scroll down to **Pages** (left sidebar)
4. Under **Source**, select:
   - Branch: `main`
   - Folder: `/docs`
5. Click **Save**

## Step 4: Verify Privacy Policy URL

After a few minutes, your privacy policy will be live at:
**https://cherepashka123.github.io/browser-pet-companion/**

The manifest.json is already configured with this URL.

## Step 5: Test the Privacy Policy

1. Wait 1-2 minutes for GitHub Pages to deploy
2. Visit: https://cherepashka123.github.io/browser-pet-companion/
3. You should see the privacy policy page

## Troubleshooting

### If GitHub Pages doesn't work:
- Make sure the repository is **Public**
- Make sure you selected `/docs` folder
- Wait a few minutes for deployment
- Check the Actions tab for any build errors

### If you need to update the privacy policy:
1. Edit `docs/index.html`
2. Commit and push:
```bash
git add docs/index.html
git commit -m "Update privacy policy"
git push
```

## Next Steps

Once GitHub Pages is working:
1. ✅ Privacy policy URL is ready
2. ✅ Manifest.json is configured
3. Ready to package and submit to Chrome Web Store!

See `QUICK_START_PUBLISHING.md` for the next steps.

