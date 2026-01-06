import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import icon from '../../assets/icon.png';
import './style.css';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface StoredData {
    summary: string;
    pageContent: any;
    pageTitle: string;
    pageUrl: string;
    messages?: Message[];
}

export default function FullPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [question, setQuestion] = useState('');
    const [pageContent, setPageContent] = useState<any>(null);
    const [pageTitle, setPageTitle] = useState('');
    const [pageUrl, setPageUrl] = useState('');

    useEffect(() => {
        // Get data from browser storage
        const loadData = async () => {
            try {
                // Get ID from URL
                const params = new URLSearchParams(window.location.search);
                const id = params.get('id');
                const storageKey = id ? `fullPageData_${id}` : 'fullPageData';

                const result = await browser.storage.local.get(storageKey);
                const data = result[storageKey];

                if (data) {
                    setSummary(data.summary);
                    setPageContent(data.pageContent);
                    setPageTitle(data.pageTitle);
                    setPageUrl(data.pageUrl);
                    if (data.messages) {
                        setMessages(data.messages);
                    }
                } else {
                    setError('No data found. Please generate a summary first.');
                }
            } catch (err) {
                console.error('Failed to load data:', err);
                setError('Failed to load summary data');
            }
        };
        loadData();
    }, []);

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
                context: pageContent.content.slice(0, 5000),
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

    const handleSummarize = async () => {
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
                url: pageUrl,
                title: pageTitle,
                forceRefresh: true,
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

    return (
        <div className="fullpage-app">
            <header className="fullpage-header">
                <div className="header-content">
                    <div className="logo-container">
                        <img src={icon} alt="AI Summary" className="logo-icon" />
                        <h1>AI Summary</h1>
                    </div>
                    {pageUrl && (
                        <a href={pageUrl} target="_blank" rel="noopener noreferrer" className="page-link">
                            Visit Original Page ↗
                        </a>
                    )}
                </div>
            </header>

            <main className="fullpage-content">
                <div className="page-info-full">
                    <h2>{pageTitle || 'Loading...'}</h2>
                    {pageUrl && <p className="page-url">{pageUrl}</p>}
                </div>

                {error && (
                    <div className="error">
                        <p>⚠️ {error}</p>
                    </div>
                )}

                {summary && (
                    <>
                        <div className="summary-full">
                            <div className="section-header">
                                <h3>Summary</h3>
                                <button
                                    onClick={handleSummarize}
                                    disabled={loading}
                                    className="secondary-btn"
                                >
                                    {loading ? 'Re-summarizing...' : '🔄 Re-summarize'}
                                </button>
                            </div>
                            <div className="summary-content-wrapper">
                                <div className="summary-content markdown-content">
                                    <ReactMarkdown>{summary}</ReactMarkdown>
                                </div>
                                {loading && <div className="loading-overlay" />}
                            </div>
                        </div>

                        <div className="chat-full">
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

                            <div className="input-container-full">
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

                {!summary && !error && (
                    <div className="no-summary">
                        <p>Loading summary...</p>
                    </div>
                )}
            </main>
        </div>
    );
}
