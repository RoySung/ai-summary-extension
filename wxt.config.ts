import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],
  manifest: {
    permissions: ['storage', 'activeTab', 'scripting'],
    name: 'AI Summary',
    description: 'Summarize web pages using AI (Gemini or OpenAI)',
  },
});
