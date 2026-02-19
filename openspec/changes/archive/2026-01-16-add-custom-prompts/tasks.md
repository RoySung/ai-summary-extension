- [x] **Update Storage Schema** <!-- id: 0 -->
    - Modify `utils/storage.ts` to define `CustomPrompt` interface (id, name, content).
    - Add `customPrompts` and `defaultPromptId` to `ISettings`.
    - Implement migration/initialization logic to populate valid default templates (ELI5, Bullet Points, etc.) if empty.

- [x] **Update Background Logic** <!-- id: 1 -->
    - Update `entrypoints/background.ts`: `handleSummarize` function signature or message payload.
    - Allow payload to include `customPromptText`.
    - If `customPromptText` is present, use it. Otherwise, look up `defaultPromptId` from storage and use that.

- [x] **Implement Settings UI** <!-- id: 2 -->
    - Modify `entrypoints/options/Options.tsx`.
    - Create a list view for `customPrompts`.
    - Implement "Add", "Edit", "Delete" actions.
    - Implement "Set as Default" logic (updating `defaultPromptId`).

- [x] **Implement Popup Split Button** <!-- id: 3 -->
    - Modify `entrypoints/popup/App.tsx`.
    - Load `customPrompts` and `defaultPromptId` on mount.
    - Create a Split Button component (or inline logic).
        - **Main Click**: Send message with `defaultPromptId` (or resolve text locally).
        - **Dropdown Item Click**: Send message with the selected prompt's text.

- [x] **Refactor to Reusable SplitButton Component** <!-- id: 4 -->
    - Install `@radix-ui/react-dropdown-menu` dependency.
    - Create `components/SplitButton.tsx` using Radix UI DropdownMenu.
    - Extract common split button logic from Popup and Content UI.
    - Component props: variant, icon, text, disabled, loading, loadingText, settings, onAction, menuPosition.
    - Update `entrypoints/popup/App.tsx` to use new component.
    - Update `entrypoints/content/App.tsx` to use new component.
