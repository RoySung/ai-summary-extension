// API Endpoints
export const OPENAI_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

export const CONTEXT_MENU_IDS = {
    SUMMARIZE_SELECTION: 'summarize-selection',
    SUMMARIZE_FULL_PAGE: 'summarize-full-page',
} as const;

// Model Configurations
export const MODELS = {
    GEMINI: {
        'gemini-2.5-flash': {
            name: 'Gemini 2.5 Flash',
            maxInput: 1000000,
            maxOutput: 8192,
        },
        'gemini-3-flash-preview': {
            name: 'Gemini 3 Flash Preview',
            maxInput: 1000000,
            maxOutput: 8192,
        },
        'gemini-3-pro-preview': {
            name: 'Gemini 3 Pro Preview',
            maxInput: 2000000,
            maxOutput: 8192,
        },
    },
    OPENAI: {
        'gpt-4o': { name: 'GPT-4o', maxInput: 128000, maxOutput: 16384 },
        'gpt-4o-mini': {
            name: 'GPT-4o Mini',
            maxInput: 128000,
            maxOutput: 16384,
        },
        'gpt-4-turbo': {
            name: 'GPT-4 Turbo',
            maxInput: 128000,
            maxOutput: 4096,
        },
    },
};

// Default Prompts
export const DEFAULT_PROMPTS = {
    SUMMARIZE: `Please provide a concise and comprehensive summary of the following content. Focus on the main points, key arguments, and important details. Structure the summary in a clear and readable format.

Content:
{content}`,

    QUESTION: `Based on the following context and summary, please answer the question.

Context: {context}

Summary: {summary}

Question: {question}`,
};

// Cache Settings
export const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours
export const CACHE_KEY_PREFIX = 'ai_summary_cache_';

// Storage Keys
export const STORAGE_KEYS = {
    API_PROVIDER: 'apiProvider',
    GEMINI_API_KEY: 'geminiApiKey',
    OPENAI_API_KEY: 'openaiApiKey',
    GEMINI_MODEL: 'geminiModel',
    OPENAI_MODEL: 'openaiModel',
    CUSTOM_PROMPTS: 'customPrompts', // Legacy: holds { summarize: string, question: string }
    SAVED_PROMPTS: 'savedPrompts', // New: List of CustomPrompt
    DEFAULT_PROMPT_ID: 'defaultPromptId', // New: ID of the default prompt
    CACHE_DATA: 'cacheData',
    THEME: 'theme',
    SHOW_FLOATING_BALL: 'showFloatingBall',
};

export interface CustomPrompt {
    id: string;
    name: string;
    content: string;
}

export const PRESET_PROMPTS: CustomPrompt[] = [
    {
        id: 'default',
        name: 'Standard Summary',
        content: DEFAULT_PROMPTS.SUMMARIZE,
    },
    {
        id: 'bullet-points',
        name: 'Bullet Points',
        content: `Summarize the following content using a bulleted list. Capture the main ideas and key details.

Content:
{content}`,
    },
    {
        id: 'deep-dive',
        name: 'Deep Dive',
        content: `Provide a detailed and comprehensive analysis of the following content. Include all significant details and nuances.

Content:
{content}`,
    },
    {
        id: 'eli5',
        name: 'ELI5 (Simple)',
        content: `Explain the following content effectively to a 5-year-old. Use simple language and analogies.

Content:
{content}`,
    },
    {
        id: 'action-items',
        name: 'Action Items',
        content: `Identify and list any action items, recommendations, or key takeaways from the following content.

Content:
{content}`,
    },
];

// Default Settings
export const DEFAULT_SETTINGS = {
    apiProvider: 'gemini' as 'gemini' | 'openai',
    geminiApiKey: '',
    openaiApiKey: '',
    geminiModel: 'gemini-2.5-flash',
    openaiModel: 'gpt-4o-mini',
    customPrompts: {
        summarize: DEFAULT_PROMPTS.SUMMARIZE,
        question: DEFAULT_PROMPTS.QUESTION,
    },
    savedPrompts: PRESET_PROMPTS,
    defaultPromptId: 'default',
    theme: 'warm' as Theme,
    showFloatingBall: true,
};

export type Theme = 'warm' | 'cool' | 'light';
export type Settings = typeof DEFAULT_SETTINGS;
export type ApiProvider = 'gemini' | 'openai';
