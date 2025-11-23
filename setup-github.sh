#!/bin/bash

# GitHub Setup Script for Browser Pet Companion
# This script helps you push the extension to GitHub and set up GitHub Pages

set -e

echo "🚀 Setting up GitHub repository for Browser Pet Companion"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git not initialized. Run: git init"
    exit 1
fi

# Check if remote exists
if git remote get-url origin > /dev/null 2>&1; then
    echo "✅ Remote 'origin' already exists"
    REMOTE_URL=$(git remote get-url origin)
    echo "   Current remote: $REMOTE_URL"
    read -p "Do you want to change it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter new GitHub repository URL: " NEW_URL
        git remote set-url origin "$NEW_URL"
        echo "✅ Remote updated"
    fi
else
    echo "📝 Setting up remote repository..."
    read -p "Enter your GitHub repository URL (or press Enter for default): " REPO_URL
    if [ -z "$REPO_URL" ]; then
        REPO_URL="https://github.com/cherepashka123/browser-pet-companion.git"
    fi
    git remote add origin "$REPO_URL"
    echo "✅ Remote added: $REPO_URL"
fi

# Check git config
echo ""
echo "📋 Checking git configuration..."
if ! git config user.name > /dev/null 2>&1; then
    read -p "Enter your git username: " GIT_USER
    git config user.name "$GIT_USER"
fi
if ! git config user.email > /dev/null 2>&1; then
    read -p "Enter your git email: " GIT_EMAIL
    git config user.email "$GIT_EMAIL"
fi

echo "   User: $(git config user.name)"
echo "   Email: $(git config user.email)"

# Add all files
echo ""
echo "📦 Adding files to git..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit"
else
    echo "💾 Committing changes..."
    git commit -m "Initial commit: Browser Pet Companion extension

- Chrome extension with AI-generated pet avatars
- Tab management and categorization (Tab Nests)
- Nest Archive for closed tabs
- Floating pet companion on web pages
- Privacy policy hosted on GitHub Pages"
    echo "✅ Changes committed"
fi

# Push to GitHub
echo ""
echo "🚀 Pushing to GitHub..."
read -p "Push to GitHub now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Set default branch to main if it doesn't exist
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
    if [ -z "$CURRENT_BRANCH" ]; then
        git checkout -b main
    fi
    
    git push -u origin main || git push -u origin master
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Go to: https://github.com/cherepashka123/browser-pet-companion"
    echo "2. Click Settings → Pages"
    echo "3. Select Source: Branch 'main', Folder '/docs'"
    echo "4. Click Save"
    echo "5. Wait 1-2 minutes, then visit: https://cherepashka123.github.io/browser-pet-companion/"
    echo ""
    echo "Your privacy policy will be live at that URL!"
else
    echo "ℹ️  Skipped push. Run 'git push -u origin main' when ready."
fi

echo ""
echo "✨ Setup complete!"

