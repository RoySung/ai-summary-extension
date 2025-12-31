# AI Summary Chrome Extension

A powerful Chrome extension that uses AI (Google Gemini or OpenAI) to summarize web pages and answer questions about their content.

## Features

✨ **Page Summarization** - Get concise summaries of any web page with one click  
💬 **Interactive Q&A** - Ask follow-up questions about the page content  
🔧 **Customizable** - Configure API providers, models, and prompts  
📦 **Smart Caching** - Avoid redundant API calls with intelligent caching  
🚀 **Chunking Support** - Handles long content by splitting into manageable chunks

## Supported AI Providers

- **Google Gemini** (gemini-2.0-flash-exp, gemini-1.5-pro, gemini-1.5-flash)
- **OpenAI** (GPT-4o, GPT-4o Mini, GPT-4 Turbo)

## Installation

### Development Mode

1. Clone or download this repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Start the development server:
   ```bash
   pnpm dev
   ```
4. The extension will automatically load in Chrome

### Production Build

1. Build the extension:
   ```bash
   pnpm build
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `.output/chrome-mv3` directory

## Setup

1. Click the extension icon in your browser
2. Click the settings (⚙️) button
3. Choose your AI provider (Gemini or OpenAI)
4. Enter your API key:
   - **Gemini**: Get from [Google AI Studio](https://aistudio.google.com/apikey)
   - **OpenAI**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
5. Select your preferred model
6. Click "Save Settings"

## Usage

### Summarizing a Page

1. Navigate to any web page
2. Click the extension icon
3. Click "✨ Summarize Page"
4. Wait for the AI to generate a summary

### Asking Questions

1. After generating a summary
2. Type your question in the input field
3. Press Enter or click the send button (➤)
4. The AI will answer based on the page content and summary

### Custom Prompts

1. Open extension settings
2. Scroll to "Custom Prompts"
3. Edit the summarization or Q&A prompts
4. Use placeholders:
   - `{content}` - Page content
   - `{context}` - Page context
   - `{summary}` - Generated summary
   - `{question}` - User's question
5. Click "Save Settings"

### Cache Management

Summaries are cached for 24 hours to save API costs:

- To clear the cache: Go to settings → Click "Clear Cache"
- Cache clears automatically when expired

## Project Structure

```
ai-summary-extension/
├── api/                    # API integrations
│   ├── gemini.ts          # Gemini API client
│   └── openai.ts          # OpenAI API client
├── entrypoints/           # Extension entry points
│   ├── background.ts      # Service worker
│   ├── content.ts         # Content script
│   ├── popup/             # Popup UI
│   └── options/           # Settings page
├── utils/                 # Utility modules
│   ├── cache.ts           # Caching logic
│   ├── chunking.ts        # Content chunking
│   ├── constants.ts       # Constants and config
│   └── storage.ts         # Settings storage
└── wxt.config.ts          # WXT configuration
```

## Technologies

- **Framework**: [WXT](https://wxt.dev/) - Modern Chrome extension framework
- **UI**: React 19 with TypeScript
- **Styling**: CSS with modern gradients and animations
- **Build Tool**: Vite
- **APIs**: Google Gemini AI & OpenAI

## Development Commands

```bash
# Start dev server (auto-reloads on changes)
pnpm dev

# Build for production (Chrome)
pnpm build

# Build for Firefox
pnpm build:firefox

# Create distribution zip
pnpm zip

# Type checking
pnpm compile
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
