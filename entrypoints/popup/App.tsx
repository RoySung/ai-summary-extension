import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
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
import './App.css';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

function App() {
    const version = browser.runtime.getManifest().version;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [question, setQuestion] = useState('');
    const [pageContent, setPageContent] = useState<any>(null);
    const [theme, setTheme] = useState<Theme>('warm');
    const [showFloatingBall, setShowFloatingBall] = useState(true);
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

    // Get current page content and settings on mount
    useEffect(() => {
        loadSettings();
        initializeState();

        // Listen for state updates from background
        const messageListener = (message: any) => {
            if (
                message.action === 'summarizationStateUpdated' &&
                message.state
            ) {
                const {
                    isLoading,
                    summary: newSummary,
                    error: newError,
                    pageContent: newPageContent,
                } = message.state;
                setLoading(isLoading);
                if (newSummary !== undefined) setSummary(newSummary);
                if (newError !== undefined) setError(newError);
                if (newPageContent && !pageContent)
                    setPageContent(newPageContent);
            } else if (message.action === 'urlChanged') {
                // URL changed notification from background
                console.log('URL changed notification in popup:', message.url);
                initializeState();
            }
        };

        // Listen for popup visibility changes
        const visibilityChangeListener = () => {
            if (!document.hidden) {
                initializeState();
            }
        };

        browser.runtime.onMessage.addListener(messageListener);
        window.addEventListener('visibilitychange', visibilityChangeListener);

        return () => {
            browser.runtime.onMessage.removeListener(messageListener);
            window.removeEventListener(
                'visibilitychange',
                visibilityChangeListener,
            );
        };
    }, []);

    const loadSettings = async () => {
        const loadedSettings = await StorageManager.getSettings();
        setSettings(loadedSettings);
        setTheme(loadedSettings.theme);
        setShowFloatingBall(loadedSettings.showFloatingBall);
    };

    const initializeState = async () => {
        try {
            // Get synchronization state first
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
                // If no content in background state, load it locally
                setPageContent(null); // Clear old content first
                loadPageContent();
            }
        } catch (err) {
            console.error('Failed to initialize state:', err);
            // Reset all states on error
            setLoading(false);
            setSummary(null);
            setError(null);
            setPageContent(null);
            loadPageContent();
        }
    };

    const toggleFloatingBall = async () => {
        const newState = !showFloatingBall;
        await StorageManager.saveSettings({ showFloatingBall: newState });
        setShowFloatingBall(newState);
    };

    const loadPageContent = async () => {
        try {
            const response = await browser.runtime.sendMessage({
                action: 'getContent',
            });
            if (response && response.error) {
                setError(response.error);
            } else if (response) {
                setPageContent(response);
            } else {
                // Fallback or just log if no response (maybe background script didn't reply)
                console.warn('No response from background for getContent');
            }
        } catch (err: any) {
            console.error('Failed to load page content:', err);
            setError(err.message || 'Failed to load page content');
        }
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

        // Optimistically set loading, though background will confirm it
        setLoading(true);
        setError(null);

        try {
            // Just send the message, state updates come via listener
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
                setLoading(false); // Manually turn off if immediate error
            }
            // Do not manually set summary here, wait for event/broadcast
            // But if response immediately contains summary (e.g. from cache), set it
            if (response && response.summary) {
                setSummary(response.summary);
                setLoading(false);
                setMessages([]); // Clear chat on new summary
            }
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
        setLoading(true); // Re-using loading state, or should it be separate?
        // Ideally chat loading is separate, but for now re-using is fine as long as we don't confuse it with summary loading.
        // Actually, the original code used the same `loading` state.
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
        const id =
            Date.now().toString(36) + Math.random().toString(36).substr(2);

        // Store data in browser storage with the unique ID
        await browser.storage.local.set({ [`fullPageData_${id}`]: data });

        // Open the full page with the ID
        browser.tabs.create({ url: `fullpage.html?id=${id}` });
    };

    return (
        <div className="app" data-theme={theme}>
            <header>
                <div className="logo-container">
                    <img src={icon} alt="AI Summary" className="logo-icon" />
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            paddingLeft: '4px',
                        }}
                    >
                        <h1 style={{ margin: 0, lineHeight: '1.2' }}>
                            AI Summary
                        </h1>
                        <small style={{ fontSize: '10px', opacity: 0.6 }}>
                            v{version}
                        </small>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        className="settings-btn"
                        onClick={toggleFloatingBall}
                        title={
                            showFloatingBall
                                ? 'Hide Floating Ball'
                                : 'Show Floating Ball'
                        }
                        style={{ opacity: showFloatingBall ? 1 : 0.5 }}
                    >
                        🔵
                    </button>
                    <button
                        className="settings-btn"
                        onClick={openSettings}
                        title="Settings"
                    >
                        ⚙️
                    </button>
                </div>
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
                            <div
                                className="summary-actions"
                                style={{ flexDirection: 'column', gap: '16px' }}
                            >
                                {/* Re-summarize Split Button */}
                                <SplitButton
                                    variant="secondary"
                                    icon="🔄"
                                    text="Re-summarize"
                                    loading={loading}
                                    loadingText="Re-summarizing..."
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
                                    📄 Open in Full Page
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
