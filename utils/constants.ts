// API Endpoints
export const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
export const OPENAI_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

// Model Configurations
export const MODELS = {
    GEMINI: {
        'gemini-2.5-flash': { name: 'Gemini 2.5 Flash', maxTokens: 32000 },
        'gemini-2.0-flash-exp': { name: 'Gemini 2.0 Flash', maxTokens: 32000 },
        'gemini-1.5-pro': { name: 'Gemini 1.5 Pro', maxTokens: 128000 },
        'gemini-1.5-flash': { name: 'Gemini 1.5 Flash', maxTokens: 32000 },
    },
    OPENAI: {
        'gpt-4o': { name: 'GPT-4o', maxTokens: 8000 },
        'gpt-4o-mini': { name: 'GPT-4o Mini', maxTokens: 8000 },
        'gpt-4-turbo': { name: 'GPT-4 Turbo', maxTokens: 8000 },
    },
};

// Token Limits (conservative estimates to leave room for response)
export const TOKEN_LIMITS = {
    GEMINI_INPUT: 30000,
    OPENAI_INPUT: 7000,
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
    CUSTOM_PROMPTS: 'customPrompts',
    CACHE_DATA: 'cacheData',
};

// Default Settings
export const DEFAULT_SETTINGS = {
    apiProvider: 'gemini' as 'gemini' | 'openai',
    geminiApiKey: '',
    openaiApiKey: '',
    geminiModel: 'gemini-2.0-flash-exp',
    openaiModel: 'gpt-4o-mini',
    customPrompts: {
        summarize: DEFAULT_PROMPTS.SUMMARIZE,
        question: DEFAULT_PROMPTS.QUESTION,
    },
};

export type Settings = typeof DEFAULT_SETTINGS;
export type ApiProvider = 'gemini' | 'openai';
