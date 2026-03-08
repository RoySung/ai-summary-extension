import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
    modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],
    manifest: {
        permissions: ['storage', 'activeTab', 'scripting', 'contextMenus'],
        name: 'AskWeb AI: Summarize & Chat with Any Page',
        description:
            'Summarize and chat with any web page using your own Gemini or OpenAI API key.',
    },
});
