export default defineContentScript({
  matches: ['*://*/*'],
  main() {
    console.log('AI Summary content script loaded');
  },
});

/**
 * Extract main content from the page
 */
export function extractPageContent(): {
  title: string;
  url: string;
  content: string;
  description: string;
} {
  // Get page title
  const title = document.title;

  // Get URL
  const url = window.location.href;

  // Get meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  const description = metaDescription?.getAttribute('content') || '';

  // Extract main content
  let content = '';

  // Try to find main content area
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

  // If no main element found, use body
  const contentElement = mainElement || document.body;

  // Clone the element to avoid modifying the actual page
  const clone = contentElement.cloneNode(true) as Element;

  // Remove unwanted elements
  const unwantedSelectors = [
    'script',
    'style',
    'nav',
    'header',
    'footer',
    'aside',
    '.navigation',
    '.menu',
    '.sidebar',
    '.advertisement',
    '.ads',
    '[role="navigation"]',
    '[role="banner"]',
    '[role="contentinfo"]',
  ];

  unwantedSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove());
  });

  // Extract text content
  content = clone.textContent || '';

  // Clean up whitespace
  content = content
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n\n')  // Clean up multiple newlines
    .trim();

  return {
    title,
    url,
    content,
    description,
  };
}
