# AskWeb AI

AskWeb AI is a powerful and elegant Chrome extension that helps you summarize and chat with any page using AI (Google Gemini or OpenAI).

## ✨ Key Features

- **🆓 100% Free & Bring Your Own Key **: No subscription fees or hidden charges. Use your own API key from Google Gemini or OpenAI and only pay the provider directly (or enjoy their free tiers).
- **🚀 Instant Page Summarization**: Get concise, accurate summaries of any web page with a single click.
- **💬 Interactive Q&A Chat**: Have a conversation with the AI about the page content. Ask specific questions and get answers based on the context.
- **🎯 Floating Mode**: A non-intrusive floating ball allows quick access to the summarizer. It expands into a fully **resizable window**, letting you browse and read summaries side-by-side.
- **📄 Full Page View**: Switch to a dedicated immersive view for reading long summaries or managing complex Q&A sessions.
- **🎨 Theme Selection**: Customize the look and feel with built-in themes
- **🌐 Language Setting**: Switch between English and Traditional Chinese for the extension UI, context menu labels, and AI-generated summaries and answers.

## 🤖 Supported AI Providers

- **Google Gemini** (Recommended for free tier users)
- **OpenAI**

## 🛠️ Installation

### Development Mode

1.  Clone this repository.
2.  Install dependencies:
    ```bash
    pnpm install
    ```
3.  Start the development server:
    ```bash
    pnpm dev
    ```
    Chrome will open with the extension loaded.

### Production Build

1.  Build the extension:
    ```bash
    pnpm build
    ```
2.  Load in Chrome:
    - Open `chrome://extensions/`
    - Enable **Developer mode**
    - Click **Load unpacked**
    - Select the `.output/chrome-mv3` directory

## ⚙️ Setup & Configuration

1.  **Open the Extension**: Click the extension icon or the floating ball.
2.  **Go to Settings**: Click the gear icon (⚙️) in the header.
3.  **Choose Provider**: Select Google Gemini or OpenAI.
4.  **Enter API Key**:
    - **Gemini**: Get it from [Google AI Studio](https://aistudio.google.com/apikey).
    - **OpenAI**: Get it from [OpenAI Platform](https://platform.openai.com/api-keys).
5.  **Choose Language**: Select English or Traditional Chinese. This also controls the language used for summaries, answers, and context menu entries.
6.  **Select Theme**: Choose your preferred visual style (Warm, Cool, or Light).
7.  **Custom Prompts** (Optional): Customize the instructions for summarization and Q&A to fit your specific needs.
8.  **Floating Ball**: You can toggle the visibility of the floating ball on specific pages if desired.

## 📖 Usage Guide

### Using the Floating Window (Summarize Entire Page)

1.  Open the window by clicking the **extension icon** or the **floating ball** on the web page.
2.  **Resize**: Drag the edges of the window to resize it to your liking.
3.  **Summarize**: Click "✨ Summarize Page" to summarize the entire page's content.
4.  **Chat**: Type in the input box to ask follow-up questions.

### Summarize Selected Text

Highlight any specific text on a web page to generate a targeted summary for just that selected content.

### Full Page View

For a deeper dive, click the **"📄 Full Page"** button within the summary view. This opens a dedicated tab with your current summary and chat history, giving you more space to think and read.

## 💻 Tech Stack

- **Framework**: [WXT](https://wxt.dev/) - Next-gen Web Extension Framework
- **Frontend**: React 19, TypeScript
- **Styling**: Modern CSS Variables, CSS Modules
- **Build Tool**: Vite
- **AI Integration**: Gemini API, OpenAI API
- **State Management**: Custom background state synchronization

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
