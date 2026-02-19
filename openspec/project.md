# Project Context

## Purpose

**AI Summary Extension** is a browser extension built to enhance productivity by summarising web pages and enabling interactive Q&A based on page content. It leverages Large Language Models (LLMs) like Google Gemini and OpenAI to process content directly within the browser.

## Tech Stack

-   **Framework**: [WXT](https://wxt.dev/) (Web Extension Tools) - opinionated framework for building browser extensions.
-   **Language**: TypeScript
-   **UI Library**: React 19
-   **Bundler**: Vite (internal to WXT)
-   **AI Integration**:
    -   `@google/genai` (Google Gemini)
    -   OpenAI API (via direct REST/fetch wrappers)
-   **Utilities**:
    -   `gpt-tokenizer`: For token counting and efficient text chunking.
    -   `react-markdown`: For rendering AI responses.
    -   `webextension-polyfill`: For cross-browser compatibility.

## Project Conventions

### Code Style

-   **TypeScript**: Strict typing is encouraged.
-   **React**: Functional components with Hooks.
-   **CSS**: Standard CSS imports (`style.css`, `App.css`).
-   **Imports**: Use standard relative imports or aliases if configured in `tsconfig`.

### Architecture Patterns

-   **Entrypoints**: Follows WXT structure (`entrypoints/`).
    -   `background.ts`: The "Backend". Handles state, API calls, and content extraction to avoid CORS and persistence issues.
    -   `popup/`: Main extension UI.
    -   `content/`: In-page UI (floating action button/window).
    -   `options/`: Settings page.
-   **State Management**:
    -   **Global/Persistent State**: Managed in `background.ts` using `TabStateManager` pattern. UI components subscribe to state updates via message passing.
    -   **Local State**: React `useState` for transient UI states.
-   **Communication**: Uses `browser.runtime.sendMessage` and `browser.runtime.onMessage` for communication between UI (popup/content) and Background.

### Testing Strategy

-   Currently manual testing via `pnpm dev` (Chrome) and `pnpm dev:firefox` (Firefox).

### Git Workflow

-   Standard feature branch workflow.
-   Commits should be descriptive.

## Domain Context

-   **Browser Extension Lifecycle**: Understanding of `activeTab`, `scripting`, and `background` service worker lifecycles is crucial.
-   **LLM Context Windows**: Handling large webpages requires "chunking" strategies (`utils/chunking.ts`) to fit within model token limits.
-   **Content Security Policy (CSP)**: API calls to LLMs must be made from the background script to comply with extension security policies and avoid CORS errors.

## Important Constraints

-   **CORS**: The Popup and Content Scripts cannot make requests to 3rd party AI APIs directly due to browser security restrictions. All external API calls **must** be proxied through the Background script.
-   **Persistence**: Popup state is lost when closed. Persistent data must be stored in `storage` or manaed by the Background script.

## External Dependencies

-   **Google Gemini API**: Requires API Key.
-   **OpenAI API**: Requires API Key.
