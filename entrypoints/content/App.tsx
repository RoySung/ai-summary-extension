import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { extractPageContent } from '../../utils/page';
import { StorageManager } from '../../utils/storage';
import { type Theme } from '../../utils/constants';
import icon from '../../assets/icon.png';
import '../../assets/theme.css';
import '../popup/App.css';
import './style.css';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function App() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [question, setQuestion] = useState('');
    const [pageContent, setPageContent] = useState<any>(null);
    const [theme, setTheme] = useState<Theme>('warm');
    const [showFloatingBall, setShowFloatingBall] = useState(true);
    const [windowSize, setWindowSize] = useState({ width: 380, height: 500 });

    useEffect(() => {
        loadSettings();
        const handleStorageChange = (changes: any) => {
            if (changes.theme) {
                setTheme(changes.theme.newValue);
            }
            if (changes.showFloatingBall) {
                setShowFloatingBall(changes.showFloatingBall.newValue);
            }
        };
        browser.storage.onChanged.addListener(handleStorageChange);
        return () => browser.storage.onChanged.removeListener(handleStorageChange);
    }, []);

    useEffect(() => {
        if (isExpanded) {
            loadPageContent();
        }
    }, [isExpanded]);

    const loadSettings = async () => {
        const settings = await StorageManager.getSettings();
        setTheme(settings.theme);
        setShowFloatingBall(settings.showFloatingBall);
    };

    const loadPageContent = async () => {
        try {
            const content = extractPageContent();
            setPageContent(content);
        } catch (err: any) {
            console.error('Failed to load page content:', err);
            setError(err.message || 'Failed to load page content');
        }
    };

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    const handleHideFloatingBall = async () => {
        await StorageManager.saveSettings({ showFloatingBall: false });
        setShowFloatingBall(false);
    };

    const handleResizeMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = windowSize.width;
        const startHeight = windowSize.height;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = startX - moveEvent.clientX; // Moving left increases width
            const deltaY = startY - moveEvent.clientY; // Moving up increases height

            setWindowSize({
                width: Math.max(300, Math.min(800, startWidth + deltaX)),
                height: Math.max(300, Math.min(800, startHeight + deltaY))
            });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
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
        browser.runtime.sendMessage({ action: 'openOptionsPage' });
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

        const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        await browser.storage.local.set({ [`fullPageData_${id}`]: data });
        await browser.runtime.sendMessage({
            action: 'openFullPage',
            url: browser.runtime.getURL(`/fullpage.html?id=${id}`)
        });
    };

    // If hidden, render nothing
    if (!showFloatingBall) {
        return null;
    }

    if (!isExpanded) {
        return (
            <div className="ai-summary-floating-container">
                <button
                    className="ai-summary-floating-ball"
                    onClick={toggleExpand}
                    title="Open AI Summary"
                >
                    <img src={icon} alt="AI Summary" style={{ width: '42px', height: '42px' }} />
                </button>
            </div>
        );
    }

    return (
        <div className="ai-summary-floating-container">
            <div
                className="ai-summary-window"
                data-theme={theme}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: `${windowSize.width}px`,
                    height: `${windowSize.height}px`
                }}
            >
                <div
                    className="ai-summary-resize-handle"
                    onMouseDown={handleResizeMouseDown}
                    title="Drag to resize"
                />
                <div className="ai-summary-header">
                    <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2 className="ai-summary-title">AI Summary</h2>
                    </div>
                    <div className="ai-summary-actions">
                        <button className="settings-btn" onClick={openSettings} title="Settings" style={{ fontSize: '16px' }}>
                            ⚙️
                        </button>
                        <button className="ai-summary-icon-btn" onClick={handleHideFloatingBall} title="Hide Floating Ball">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                            </svg>
                        </button>
                        <button className="ai-summary-icon-btn" onClick={toggleExpand} title="Minimize">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="ai-summary-content" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                    {pageContent && (
                        <div className="page-info">
                            <h2 style={{ fontSize: '14px', margin: '0 0 12px 0' }}>{pageContent.title}</h2>
                        </div>
                    )}

                    {error && (
                        <div className="error">
                            <p>⚠️ {error}</p>
                        </div>
                    )}

                    {!summary && (
                        <div className="actions" style={{ margin: '20px 0' }}>
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
                                        {loading ? '...' : '🔄 Re-summarize'}
                                    </button>
                                    <button
                                        onClick={openInFullPage}
                                        disabled={loading}
                                        className="primary-btn"
                                    >
                                        📄 Full Page
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
                                        placeholder="Ask a question..."
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
        </div>
    );
}
