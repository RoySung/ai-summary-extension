import { GeminiAPI } from '../api/gemini';
import { OpenAIAPI } from '../api/openai';
import { StorageManager } from '../utils/storage';
import { CacheManager } from '../utils/cache';
import type { Settings } from '../utils/constants';

export default defineBackground(() => {
  console.log('AI Summary background worker initialized');

  // Clean expired cache entries on startup
  CacheManager.cleanExpired();

  // Message handler
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender)
      .then(sendResponse)
      .catch((error) => {
        console.error('Error handling message:', error);
        sendResponse({ error: error.message });
      });

    // Return true to indicate async response
    return true;
  });
});

interface SummarizeRequest {
  action: 'summarize';
  content: string;
  url: string;
  title: string;
  forceRefresh?: boolean;
}

interface QuestionRequest {
  action: 'question';
  question: string;
  context: string;
  summary: string;
}

interface GetContentRequest {
  action: 'getContent';
  tabId?: number;
}

interface OpenOptionsPageRequest {
  action: 'openOptionsPage';
}

interface OpenFullPageRequest {
  action: 'openFullPage';
  url: string;
}

type MessageRequest = SummarizeRequest | QuestionRequest | GetContentRequest | OpenOptionsPageRequest | OpenFullPageRequest;

/**
 * Handle incoming messages
 */
async function handleMessage(
  message: MessageRequest,
  sender: browser.Runtime.MessageSender
): Promise<any> {
  console.log('Received message:', message.action);

  switch (message.action) {
    case 'summarize':
      return handleSummarize(message);

    case 'question':
      return handleQuestion(message);

    case 'getContent':
      return handleGetContent(message, sender);

    case 'openOptionsPage':
      return handleOpenOptionsPage();

    case 'openFullPage':
      return handleOpenFullPage(message);

    default:
      throw new Error('Unknown action');
  }
}

/**
 * Handle open options page request
 */
async function handleOpenOptionsPage(): Promise<void> {
  return browser.runtime.openOptionsPage();
}

/**
 * Handle open full page request
 */
async function handleOpenFullPage(request: OpenFullPageRequest): Promise<browser.Tabs.Tab> {
  return browser.tabs.create({ url: request.url });
}

/**
 * Handle summarize request
 */
async function handleSummarize(request: SummarizeRequest): Promise<{ summary: string }> {
  const { content, url, title, forceRefresh } = request;

  // Check cache first (skip if forceRefresh is true)
  if (!forceRefresh) {
    const cachedSummary = await CacheManager.get(url, content);
    if (cachedSummary) {
      console.log('Returning cached summary');
      return { summary: cachedSummary };
    }
  } else {
    console.log('Force refresh: bypassing cache');
  }

  // Get settings
  const settings = await StorageManager.getSettings();

  // Validate API key
  const apiKey = settings.apiProvider === 'gemini'
    ? settings.geminiApiKey
    : settings.openaiApiKey;

  if (!apiKey) {
    throw new Error(`Please configure your ${settings.apiProvider.toUpperCase()} API key in settings`);
  }

  // Create API client
  let summary: string;
  if (settings.apiProvider === 'gemini') {
    const api = new GeminiAPI(apiKey, settings.geminiModel);
    const prompt = settings.customPrompts?.summarize;
    summary = await api.summarize(content, prompt);
  } else {
    const api = new OpenAIAPI(apiKey, settings.openaiModel);
    const prompt = settings.customPrompts?.summarize;
    summary = await api.summarize(content, prompt);
  }

  // Cache the summary
  await CacheManager.set(url, content, summary);

  return { summary };
}

/**
 * Handle question request
 */
async function handleQuestion(request: QuestionRequest): Promise<{ answer: string }> {
  const { question, context, summary } = request;

  // Get settings
  const settings = await StorageManager.getSettings();

  // Validate API key
  const apiKey = settings.apiProvider === 'gemini'
    ? settings.geminiApiKey
    : settings.openaiApiKey;

  if (!apiKey) {
    throw new Error(`Please configure your ${settings.apiProvider.toUpperCase()} API key in settings`);
  }

  // Create API client and get answer
  let answer: string;
  if (settings.apiProvider === 'gemini') {
    const api = new GeminiAPI(apiKey, settings.geminiModel);
    const prompt = settings.customPrompts?.question;
    answer = await api.answerQuestion(context, summary, question, prompt);
  } else {
    const api = new OpenAIAPI(apiKey, settings.openaiModel);
    const prompt = settings.customPrompts?.question;
    answer = await api.answerQuestion(context, summary, question, prompt);
  }

  return { answer };
}

/**
 * Handle get content request - extract content from current tab
 */
async function handleGetContent(
  request: GetContentRequest,
  sender: browser.Runtime.MessageSender
): Promise<{ title: string; url: string; content: string; description: string }> {
  // Get active tab
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const tabId = request.tabId || tabs[0]?.id;

  if (!tabId) {
    throw new Error('No active tab found');
  }

  // Execute content extraction in the tab
  const results = await browser.scripting.executeScript({
    target: { tabId },
    func: () => {
      // This function runs in the context of the page
      const title = document.title;
      const url = window.location.href;

      const metaDescription = document.querySelector('meta[name="description"]');
      const description = metaDescription?.getAttribute('content') || '';

      let content = '';
      const mainSelectors = [
        'main',
        'article',
        '[role="main"]',
        '.main-content',
        '#main-content',
        '.content',
        '#content',
      ];

      let mainElement: Element | null = null;
      for (const selector of mainSelectors) {
        mainElement = document.querySelector(selector);
        if (mainElement) break;
      }

      const contentElement = mainElement || document.body;
      const clone = contentElement.cloneNode(true) as Element;

      const unwantedSelectors = [
        'script', 'style', 'nav', 'header', 'footer', 'aside',
        '.navigation', '.menu', '.sidebar', '.advertisement', '.ads',
        '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
      ];

      unwantedSelectors.forEach(selector => {
        clone.querySelectorAll(selector).forEach(el => el.remove());
      });

      content = clone.textContent || '';
      content = content.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();

      return { title, url, content, description };
    },
  });

  if (!results || results.length === 0 || !results[0].result) {
    throw new Error('Failed to extract content from page');
  }

  return results[0].result;
}
