# Browser Pet Companion 🐾

A cozy AI-generated pet companion Chrome extension that helps you manage browser tabs, organize them into categories, and keep a Nest Archive of closed tabs.

## Features

- 🎨 **AI-Generated Pet Avatars**: Create your own pet or choose from templates, with emotion-based expressions
- 🏠 **Floating Pet Companion**: Your pet appears on web pages, reacting to tab clutter and showing status
- 📁 **Tab Nests**: Intelligent tab categorization (School, Work, Personal, etc.) with learning capabilities
- 🧹 **Tab Management**: Detect and clean up zombie tabs, duplicates, and clutter
- 📚 **Nest Archive**: Cozy archive for closed tabs, organized by category
- 💭 **Smart Nudges**: Gentle reminders when tabs need attention
- 🎭 **Emotional Reactions**: Pet shows different emotions based on your tab health

## Installation

### From Chrome Web Store
*(Coming soon)*

### Manual Installation (Development)

1. Clone this repository:
```bash
git clone https://github.com/cherepashka123/browser-pet-companion.git
cd browser-pet-companion
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `browser-pet-companion` folder

## Development

```bash
# Build for production
npm run build

# Build for development (with source maps)
npm run build:dev

# Watch mode for development
npm run dev

# Type checking
npm run type-check

# Clean build files
npm run clean
```

## Tech Stack

- **Manifest V3** - Latest Chrome Extension API
- **React** - UI framework
- **TypeScript** - Type safety
- **Webpack** - Bundling
- **Hugging Face API** - AI image generation (optional, with SVG fallback)

## Privacy

All data is stored locally on your device. We do not collect, transmit, or share any user data.

See [Privacy Policy](https://cherepashka123.github.io/browser-pet-companion/) for details.

## License

MIT License - see LICENSE file for details

## Contributing

Contributions welcome! Please open an issue or pull request.

## Support

For issues, questions, or suggestions, please open an issue on [GitHub](https://github.com/cherepashka123/browser-pet-companion/issues).

