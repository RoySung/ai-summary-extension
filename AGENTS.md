<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# AGENTS.md

## Project Overview
**AI Summary Extension** is a browser extension built with the [WXT Framework](https://wxt.dev/) and React. It uses Google Gemini and OpenAI to summarize web pages and answer questions based on the page content.

## Architecture

### Core Components
1.  **Background Service Worker** (`entrypoints/background.ts`)
    -   Acts as the "Backend" of the extension.
    -   Manages application state (`TabStateManager`).
    -   Handles external API calls (Gemini/OpenAI) to avoid CORS issues and ensure persistence.
    -   Broadcasts state updates (`summarizationStateUpdated`) to other components.
    -   **Content Extraction**: Triggers script execution (`browser.scripting.executeScript`) to extract content from active tabs (logic in `handleGetContent`).

2.  **Popup UI** (`entrypoints/popup/App.tsx`)
    -   The main user interface.
    -   Displays summaries and chat interface.
    -   Communicates with Background via `browser.runtime.sendMessage`.
    -   Listens for state updates to reactively update the UI.

3.  **Content Script UI** (`entrypoints/content/App.tsx`)
    -   Provides an in-page floating interface ("Floating Ball" & "Floating Window").
    -   Allows users to view summaries and chat without leaving the page.
    -   Syncs state with Background and Popup.

4.  **Settings UI** (`entrypoints/options/`)
    -   Configures user preferences (API keys, theme selection, functionality toggles).
    -   Persists data using `utils/storage.ts`.

5.  **Utilities**
    -   `utils/chunking.ts`: Handles text splitting to respect LLM token limits (`gpt-tokenizer`).
    -   `utils/storage.ts`: Manages user settings (API keys, preferences).
    -   `utils/cache.ts`: Caches summaries to reduce API costs.

### Data Flow
1.  **User Interest**: User clicks "Summarize" in Popup.
2.  **Request**: Popup sends `{ action: 'summarize' }` to Background.
3.  **Extraction**: Background executes script in Active Tab to get text.
4.  **Processing**: Background splits text (Chunking) and calls AI API (`api/gemini.ts` or `api/openai.ts`).
5.  **Response**:
    -   Background updates `TabState` and broadcasts event.
    -   Popup listener receives event and updates UI.

## Key Files & Directories

-   `entrypoints/background.ts`: **Critical**. Central logic hub. All API interactions happen here. Uses `TabStateManager` to sync state.
-   `entrypoints/popup/App.tsx`: Main Popup React component.
-   `entrypoints/content/App.tsx`: Content Script UI (Floating Mode).
-   `entrypoints/options/`: Settings/Options page.
-   `utils/chunking.ts`: Logic for splitting large articles.
-   `api/`: Wrappers for Gemini and OpenAI APIs.
-   `wxt.config.ts`: WXT configuration (permissions, modules).

## Development Guidelines for Agents

-   **State Management**: Do not store state locally in the Popup if it needs to persist across closing/reopening the popup. Use `TabStateManager` in `background.ts`.
-   **API Calls**: **NEVER** make LLM API calls directly from the Popup or Content Script. Always delegate to `background.ts` via message passing.
-   **Async Operations**: The WXT messaging system expects `return true` or a Promise in `onMessage` listeners for async responses.
-   **Styling**: Uses standard CSS imports (`App.css`, `theme.css`).

## Commands
-   `pnpm dev`: Start development server.
-   `pnpm build`: Build for production.
