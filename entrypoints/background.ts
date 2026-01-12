import { GeminiAPI } from '../api/gemini';
import { OpenAIAPI } from '../api/openai';
import { StorageManager } from '../utils/storage';
import { CacheManager } from '../utils/cache';
import type { Runtime, Tabs } from 'webextension-polyfill';

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

interface TabState {
  isLoading: boolean;
  summary: string | null;
  error: string | null;
  pageContent: any | null;
}

// State manager for tabs
class TabStateManager {
  private static states: Map<number, TabState> = new Map();

  static getState(tabId: number): TabState {
    if (!this.states.has(tabId)) {
      this.states.set(tabId, {
        isLoading: false,
        summary: null,
        error: null,
        pageContent: null
      });
    }
    return this.states.get(tabId)!;
  }

  static updateState(tabId: number, update: Partial<TabState>) {
    const currentState = this.getState(tabId);
    const newState = { ...currentState, ...update };
    this.states.set(tabId, newState);
    this.broadcastState(tabId, newState);
  }

  private static broadcastState(tabId: number, state: TabState) {
    // Send message to all frames in the tab (popup, content script)
    browser.runtime.sendMessage({
      action: 'summarizationStateUpdated',
      tabId,
      state
    }).catch(() => {
        // Ignore errors if no receivers (e.g. popup closed)
    });

    // Also try to send to the specific tab content script
    browser.tabs.sendMessage(tabId, {
       action: 'summarizationStateUpdated',
       tabId,
       state
    }).catch(() => {
      // Ignore errors if content script not ready
    });
  }
}

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

interface GetSummarizationStateRequest {
  action: 'getSummarizationState';
}

type MessageRequest = SummarizeRequest | QuestionRequest | GetContentRequest | OpenOptionsPageRequest | OpenFullPageRequest | GetSummarizationStateRequest;

/**
 * Handle incoming messages
 */
async function handleMessage(
  message: MessageRequest,
  sender: Runtime.MessageSender
): Promise<any> {
  // Use sender.tab.id for content scripts, or derive from active tab for popup
  let tabId = sender.tab?.id;
  
  if (!tabId) {
      // If message is from Popup (no sender.tab), get the active tab
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      tabId = tabs[0]?.id;
  }

  if (!tabId) {
      console.warn('Could not determine tab ID for message:', message);
      return { error: 'Could not determine active tab' };
  }

  console.log(`Received message: ${message.action} for tab ${tabId}`);

  switch (message.action) {
    case 'summarize':
      return handleSummarize(message, tabId);

    case 'question':
      return handleQuestion(message);

    case 'getContent':
      return handleGetContent({ ...message, tabId: tabId }, sender);

    case 'openOptionsPage':
      return handleOpenOptionsPage();

    case 'openFullPage':
      return handleOpenFullPage(message);
    
    case 'getSummarizationState':
      return TabStateManager.getState(tabId);

    default:
      // Don't throw for unknown messages, just return undefined so other listeners can handle it
      // or check if it's a system message
      if ((message as any).action === 'summarizationStateUpdated') return;
      console.warn('Unknown action:', (message as any).action);
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
async function handleOpenFullPage(request: OpenFullPageRequest): Promise<Tabs.Tab> {
  return browser.tabs.create({ url: request.url });
}

/**
 * Handle summarize request
 */
async function handleSummarize(request: SummarizeRequest, tabId: number): Promise<{ summary: string | null, error?: string }> {
  const { content, url, title, forceRefresh } = request;

  const currentState = TabStateManager.getState(tabId);
  
  // If already loading, ignore request (debouncing/deduplication)
  if (currentState.isLoading) {
      console.log('Summarization already in progress for tab', tabId);
      return { summary: currentState.summary }; // Return current (possibly null) summary
  }

  // Update state to loading
  TabStateManager.updateState(tabId, { isLoading: true, error: null, pageContent: { content, url, title } });

  try {
    // Check cache first (skip if forceRefresh is true)
    let summary: string | null = null;
    
    if (!forceRefresh) {
      const cachedSummary = await CacheManager.get(url, content);
      if (cachedSummary) {
        console.log('Returning cached summary');
        summary = cachedSummary;
      }
    } else {
      console.log('Force refresh: bypassing cache');
    }

    if (!summary) {
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
    }

    // Update state with success
    TabStateManager.updateState(tabId, { isLoading: false, summary: summary });
    return { summary };

  } catch (error: any) {
    console.error('Summarization failed:', error);
    TabStateManager.updateState(tabId, { isLoading: false, error: error.message || 'Failed to generate summary' });
    throw error;
  }
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
  sender: Runtime.MessageSender
): Promise<{ title: string; url: string; content: string; description: string }> {
  // Use resolved tabId from request if available, otherwise find active tab
  let tabId = request.tabId;
  console.log('GetContent request for tab:', tabId);

  if (!tabId) {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    tabId = tabs[0]?.id;
  }

  if (!tabId) {
    throw new Error('No active tab found');
  }

  console.log('Executing script on tab:', tabId);

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
