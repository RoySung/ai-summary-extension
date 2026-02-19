# Add Custom Prompts

## Why

Currently, the extension uses a single global prompt for all summaries. Users often visit different types of pages (technical docs vs. news vs. tutorials) and require different output formats.

## What Changes

### 1. Storage & Data Model

-   Extend `Settings` to include `customPrompts: CustomPrompt[]` and `defaultPromptId: string`.
-   **Initial Templates**: Pre-populate with useful presets (Bulleted List, Deep Dive, ELI5, Action Items) on first install.

### 2. Settings UI

-   Add a "Prompt Manager" section in the Options page.
-   Allow users to:
    -   Add new prompts.
    -   Edit existing prompts.
    -   Delete prompts.
    -   "Set as Default" (determines which prompt is used by the main button).

### 3. Popup UI (Split Button)

-   Replace the standard "Summarize" button with a **Split Button**.
-   **Main Button**: Triggers summarization using the `defaultPromptId` prompt.
-   **Dropdown Arrow**: Shows a list of all other available prompts. Clicking one triggers summarization with that specific prompt.

### 4. Background Logic

-   Update `BACKGROUND_ACTIONS.SUMMARIZE` message handler to accept an optional `promptId` or `promptText` override.
-   Ensure the background script uses the provided prompt text instead of always fetching the default one.
