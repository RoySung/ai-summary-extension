import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { extractPageContent } from '../../utils/page';
import { StorageManager } from '../../utils/storage';
import {
    type Theme,
    type Settings,
    DEFAULT_SETTINGS,
} from '../../utils/constants';
import SplitButton from '../../components/SplitButton';
import icon from '../../assets/icon.png';
import '../../assets/theme.css';
import '../../assets/common.css';
import './style.css';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function App() {
    const version = browser.runtime.getManifest().version;
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
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

    useEffect(() => {
        loadSettings();
        initializeState();

        const handleStorageChange = (changes: any) => {
            if (changes.theme) {
                setTheme(changes.theme.newValue);
            }
            if (changes.showFloatingBall) {
                setShowFloatingBall(changes.showFloatingBall.newValue);
            }
        };

        // Listen for state updates from background
        const messageListener = (message: any) => {
            if (
                message.action === 'summarizationStateUpdated' &&
                message.state
            ) {
                // Content script receives state updates from background
                // Background already handles tab validation, we just apply the update
                const {
                    isLoading,
                    summary: newSummary,
                    error: newError,
                    pageContent: newPageContent,
                } = message.state;
                setLoading(isLoading);
                if (newSummary !== undefined) setSummary(newSummary);
                if (newError !== undefined) setError(newError);
                if (newPageContent !== undefined) {
                    setPageContent(newPageContent);
                } else if (newPageContent === null) {
                    // State was reset, reload page content
                    setPageContent(null);
                    loadPageContent();
                }
            } else if (message.action === 'urlChanged') {
                // URL changed notification from background (handles both traditional and SPA navigation)
                console.log(
                    'URL changed notification from background:',
                    message.url,
                );
                setIsExpanded(false);
                // Longer delay to allow DOM to update, especially for SPAs
                setTimeout(() => {
                    initializeState();
                }, 500);
            }
        };

        // Listen for visibility changes
        const visibilityChangeListener = () => {
            if (!document.hidden) {
                initializeState();
            }
        };

        browser.storage.onChanged.addListener(handleStorageChange);
        browser.runtime.onMessage.addListener(messageListener);
        window.addEventListener('visibilitychange', visibilityChangeListener);

        return () => {
            browser.storage.onChanged.removeListener(handleStorageChange);
            browser.runtime.onMessage.removeListener(messageListener);
            window.removeEventListener(
                'visibilitychange',
                visibilityChangeListener,
            );
        };
    }, []);

    useEffect(() => {
        if (isExpanded && !pageContent) {
            let retryCount = 0;
            const maxRetries = 3;
            const retryDelays = [0, 500, 1000]; // Progressive delays

            const attemptLoad = () => {
                loadPageContent();
                retryCount++;

                if (retryCount < maxRetries) {
                    const timeout = setTimeout(() => {
                        // Check if we still don't have content
                        if (!pageContent) {
                            console.log(
                                `Retrying content extraction (${retryCount}/${maxRetries})...`,
                            );
                            attemptLoad();
                        }
                    }, retryDelays[retryCount]);

                    return timeout;
                }
            };

            const timeout = attemptLoad();

            return () => {
                if (timeout) clearTimeout(timeout);
            };
        }
    }, [isExpanded]);

    const loadSettings = async () => {
        const loadedSettings = await StorageManager.getSettings();
        setSettings(loadedSettings);
        setTheme(loadedSettings.theme);
        setShowFloatingBall(loadedSettings.showFloatingBall);
    };

    const initializeState = async () => {
        try {
            // Get synchronization state first
            // Note: Since this is a content script, we can get state for our own tab ID easily
            // But we need to know our own tab ID? Background handles "sender.tab.id".
            // So calling sendMessage without ID is fine, background knows who we are.
            const state = await browser.runtime.sendMessage({
                action: 'getSummarizationState',
            });

            // Always reset states (important for route changes)
            setLoading(state?.isLoading || false);
            setSummary(state?.summary || null);
            setError(state?.error || null);

            if (state?.pageContent) {
                setPageContent(state.pageContent);
            } else {
                // Clear old content and load new from current page
                setPageContent(null);
                loadPageContent();
            }
        } catch (err) {
            console.error('Failed to initialize state:', err);
            setLoading(false);
            setSummary(null);
            setError(null);
            setPageContent(null);
            loadPageContent();
        }
    };

    const loadPageContent = async () => {
        try {
            const content = extractPageContent();

            // Check if content is meaningful (not empty or too short)
            if (!content.content || content.content.trim().length < 50) {
                console.warn(
                    'Extracted content is too short, page may not be ready',
                );
                // Don't set empty content, let it retry
                return;
            }

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
                height: Math.max(300, Math.min(800, startHeight + deltaY)),
            });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleSummarize = async (
        forceRefresh: boolean = false,
        promptText?: string,
        promptId?: string,
    ) => {
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
                promptText,
                promptId,
            });

            if (response && response.error) {
                setError(response.error);
                setLoading(false);
            } else if (response && response.summary) {
                setSummary(response.summary);
                setMessages([]);
                setLoading(false);
            }
            // Otherwise wait for listener update
        } catch (err: any) {
            console.error('Summarization error:', err);
            setError(err.message || 'Failed to generate summary');
            setLoading(false);
        }
    };

    const handleAskQuestion = async () => {
        if (!question.trim() || !summary || !pageContent) return;

        const userMessage: Message = { role: 'user', content: question };
        setMessages((prev) => [...prev, userMessage]);
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
                const assistantMessage: Message = {
                    role: 'assistant',
                    content: response.answer,
                };
                setMessages((prev) => [...prev, assistantMessage]);
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

        const id =
            Date.now().toString(36) + Math.random().toString(36).substr(2);
        await browser.storage.local.set({ [`fullPageData_${id}`]: data });
        await browser.runtime.sendMessage({
            action: 'openFullPage',
            url: browser.runtime.getURL(`/fullpage.html?id=${id}`),
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
                    <img
                        src={icon}
                        alt="AI Summary"
                        style={{ width: '42px', height: '42px' }}
                    />
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
                    height: `${windowSize.height}px`,
                }}
            >
                <div
                    className="ai-summary-resize-handle"
                    onMouseDown={handleResizeMouseDown}
                    title="Drag to resize"
                />
                <div className="ai-summary-header">
                    <div
                        className="logo-container"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        <img
                            src={icon}
                            alt="AI Summary"
                            className="logo-icon"
                            style={{ width: '24px', height: '24px' }}
                        />
                        <div
                            style={{ display: 'flex', flexDirection: 'column' }}
                        >
                            <h2
                                className="ai-summary-title"
                                style={{ margin: 0, lineHeight: '1.2' }}
                            >
                                AI Summary
                            </h2>
                            <small style={{ fontSize: '10px', opacity: 0.6 }}>
                                v{version}
                            </small>
                        </div>
                    </div>
                    <div className="ai-summary-actions">
                        <button
                            className="settings-btn"
                            onClick={openSettings}
                            title="Settings"
                            style={{ fontSize: '16px' }}
                        >
                            ⚙️
                        </button>
                        <button
                            className="ai-summary-icon-btn"
                            onClick={handleHideFloatingBall}
                            title="Hide Floating Ball"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                            </svg>
                        </button>
                        <button
                            className="ai-summary-icon-btn"
                            onClick={toggleExpand}
                            title="Minimize"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                    </div>
                </div>

                <div
                    className="ai-summary-content"
                    style={{ flex: 1, overflowY: 'auto', padding: '16px' }}
                >
                    {pageContent && (
                        <div className="page-info">
                            <h2
                                style={{
                                    fontSize: '14px',
                                    margin: '0 0 12px 0',
                                }}
                            >
                                {pageContent.title}
                            </h2>
                        </div>
                    )}

                    {error && (
                        <div className="error">
                            <p>⚠️ {error}</p>
                        </div>
                    )}

                    {!summary && (
                        <div style={{ margin: '20px 0' }}>
                            <SplitButton
                                variant="primary"
                                icon="✨"
                                text="Summarize"
                                disabled={!pageContent}
                                loading={loading}
                                loadingText="Summarizing..."
                                settings={settings}
                                onAction={(promptText, promptId) =>
                                    handleSummarize(false, promptText, promptId)
                                }
                                menuPosition="bottom"
                            />
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
                                    {loading && (
                                        <div className="loading-overlay" />
                                    )}
                                </div>
                                <div
                                    className="ai-summary-actions"
                                    style={{
                                        flexDirection: 'column',
                                        gap: '16px',
                                    }}
                                >
                                    <SplitButton
                                        variant="secondary"
                                        icon="🔄"
                                        text="Re-summarize"
                                        loading={loading}
                                        loadingText="..."
                                        settings={settings}
                                        onAction={(promptText, promptId) =>
                                            handleSummarize(
                                                true,
                                                promptText,
                                                promptId,
                                            )
                                        }
                                        menuPosition="top"
                                    />
                                    <button
                                        onClick={openInFullPage}
                                        disabled={loading}
                                        className="primary-btn"
                                        style={{ width: '100%' }}
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
                                            <div
                                                key={idx}
                                                className={`message ${msg.role}`}
                                            >
                                                <div className="message-content markdown-content">
                                                    <ReactMarkdown>
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="input-container">
                                    <input
                                        type="text"
                                        value={question}
                                        onChange={(e) =>
                                            setQuestion(e.target.value)
                                        }
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
