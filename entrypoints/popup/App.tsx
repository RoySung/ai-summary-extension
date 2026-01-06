import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './App.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [pageContent, setPageContent] = useState<any>(null);

  // Get current page content on mount
  useEffect(() => {
    loadPageContent();
  }, []);

  const loadPageContent = async () => {
    try {
      const response = await browser.runtime.sendMessage({ action: 'getContent' });
      if (response.error) {
        setError(response.error);
      } else {
        setPageContent(response);
      }
    } catch (err: any) {
      console.error('Failed to load page content:', err);
      setError(err.message || 'Failed to load page content');
    }
  };

  const handleSummarize = async (forceRefresh: boolean = false) => {
    if (!pageContent) {
      setError('No page content available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await browser.runtime.sendMessage({
        action: 'summarize',
        content: pageContent.content,
        url: pageContent.url,
        title: pageContent.title,
        forceRefresh,
      });

      if (response.error) {
        setError(response.error);
      } else {
        setSummary(response.summary);
        setMessages([]);
      }
    } catch (err: any) {
      console.error('Summarization error:', err);
      setError(err.message || 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim() || !summary || !pageContent) return;

    const userMessage: Message = { role: 'user', content: question };
    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);
    setError(null);

    try {
      const response = await browser.runtime.sendMessage({
        action: 'question',
        question: question,
        context: pageContent.content.slice(0, 5000), // Limit context size
        summary: summary,
      });

      if (response.error) {
        setError(response.error);
      } else {
        const assistantMessage: Message = { role: 'assistant', content: response.answer };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (err: any) {
      console.error('Question error:', err);
      setError(err.message || 'Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  const openSettings = () => {
    browser.runtime.openOptionsPage();
  };

  const openInFullPage = async () => {
    if (!summary || !pageContent) return;

    const data = {
      summary,
      pageContent,
      pageTitle: pageContent.title,
      pageUrl: pageContent.url,
      messages,
    };

    // Generate a unique ID for this session
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);

    // Store data in browser storage with the unique ID
    await browser.storage.local.set({ [`fullPageData_${id}`]: data });

    // Open the full page with the ID
    browser.tabs.create({ url: `fullpage.html?id=${id}` });
  };

  return (
    <div className="app">
      <header>
        <h1>🤖 AI Summary</h1>
        <button className="settings-btn" onClick={openSettings} title="Settings">
          ⚙️
        </button>
      </header>

      <div className="content">
        {pageContent && (
          <div className="page-info">
            <h2>{pageContent.title}</h2>
          </div>
        )}

        {error && (
          <div className="error">
            <p>⚠️ {error}</p>
          </div>
        )}

        {!summary && (
          <div className="actions">
            <button
              onClick={() => handleSummarize(false)}
              disabled={loading || !pageContent}
              className="primary-btn"
            >
              {loading ? 'Summarizing...' : '✨ Summarize Page'}
            </button>
          </div>
        )}

        {summary && (
          <>
            <div className="summary">
              <h3>Summary</h3>
              <div className="summary-content-wrapper">
                <div className="summary-content markdown-content">
                  <ReactMarkdown>{summary}</ReactMarkdown>
                </div>
                {loading && <div className="loading-overlay" />}
              </div>
              <div className="summary-actions">
                <button
                  onClick={() => handleSummarize(true)}
                  disabled={loading}
                  className="secondary-btn"
                >
                  {loading ? 'Re-summarizing...' : '🔄 Re-summarize'}
                </button>
                <button
                  onClick={openInFullPage}
                  disabled={loading}
                  className="primary-btn"
                >
                  📄 Open in Full Page
                </button>
              </div>
            </div>

            <div className="chat">
              <h3>Ask Questions</h3>
              {messages.length > 0 && (
                <div className="messages">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.role}`}>
                      <div className="message-content markdown-content">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="input-container">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question about this page..."
                  disabled={loading}
                  className="question-input"
                />
                <button
                  onClick={handleAskQuestion}
                  disabled={loading || !question.trim()}
                  className="send-btn"
                >
                  {loading ? '...' : '➤'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
