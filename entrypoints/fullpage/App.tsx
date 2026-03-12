import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { StorageManager } from '../../utils/storage';
import {
    type Theme,
    type Settings,
    DEFAULT_SETTINGS,
    STORAGE_KEYS,
} from '../../utils/constants';
import { translate } from '../../utils/i18n';
import { useTranslate } from '../../hooks/useTranslate';
import SplitButton from '../../components/SplitButton';
import icon from '../../assets/icon.png';
import '../../assets/theme.css';
import '../../assets/common.css';
import './style.css';
import { RiRefreshLine, RiSendPlane2Fill } from 'react-icons/ri';

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
    isSelection?: boolean;
}

export default function FullPage() {
    const version = browser.runtime.getManifest().version;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [question, setQuestion] = useState('');
    const [pageContent, setPageContent] = useState<any>(null);
    const [pageTitle, setPageTitle] = useState('');
    const [pageUrl, setPageUrl] = useState('');
    const [theme, setTheme] = useState<Theme>('warm');
    const [isSelection, setIsSelection] = useState(false);
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const t = useTranslate(settings.language);

    useEffect(() => {
        if (pageTitle) {
            document.title = `AskWeb AI: ${pageTitle}`;
        }
    }, [pageTitle]);

    useEffect(() => {
        loadSettings();
        // Get data from browser storage

        const handleStorageChange = (changes: Record<string, unknown>) => {
            const settingKeys = Object.values(STORAGE_KEYS);
            if (Object.keys(changes).some((key) => settingKeys.includes(key))) {
                loadSettings();
            }
        };

        const loadData = async () => {
            try {
                const currentSettings = await StorageManager.getSettings();

                // Get ID from URL
                const params = new URLSearchParams(window.location.search);
                const id = params.get('id');
                const auto = params.get('auto');
                const storageKey = id ? `fullPageData_${id}` : 'fullPageData';

                const result = await browser.storage.local.get(storageKey);
                const data = result[storageKey];

                if (data) {
                    setPageContent(data.pageContent);
                    setPageTitle(data.pageTitle);
                    setPageUrl(data.pageUrl);
                    if (data.isSelection) setIsSelection(true);
                    if (data.messages) {
                        setMessages(data.messages);
                    }

                    if (data.summary) {
                        setSummary(data.summary);
                    } else if (auto === 'true' && data.pageContent) {
                        // Auto summarize if requested and no summary exists
                        performSummarize(
                            data.pageContent.content,
                            data.pageUrl,
                            data.pageTitle,
                        );
                    }
                } else {
                    setError(
                        translate(currentSettings.language, 'noDataFound'),
                    );
                }
            } catch (err) {
                console.error('Failed to load data:', err);
                const currentSettings = await StorageManager.getSettings();
                setError(
                    translate(
                        currentSettings.language,
                        'failedToLoadSummaryData',
                    ),
                );
            }
        };
        browser.storage.onChanged.addListener(handleStorageChange as any);
        loadData();

        return () => {
            browser.storage.onChanged.removeListener(
                handleStorageChange as any,
            );
        };
    }, []);

    const performSummarize = async (
        content: string,
        url: string,
        title: string,
        forceRefresh: boolean = false,
        promptText?: string,
        promptId?: string,
    ) => {
        setLoading(true);
        setError(null);

        try {
            const response = await browser.runtime.sendMessage({
                action: 'summarize',
                content: content,
                url: url,
                title: title,
                forceRefresh: forceRefresh,
                promptText,
                promptId,
            });

            if (response.error) {
                setError(response.error);
            } else {
                setSummary(response.summary);
                setMessages([]);

                // Update storage with new summary
                const params = new URLSearchParams(window.location.search);
                const id = params.get('id');
                if (id) {
                    const storageKey = `fullPageData_${id}`;
                    const result = await browser.storage.local.get(storageKey);
                    const data = result[storageKey];
                    if (data) {
                        await browser.storage.local.set({
                            [storageKey]: {
                                ...data,
                                summary: response.summary,
                            },
                        });
                    }
                }
            }
        } catch (err: any) {
            console.error('Summarization error:', err);
            setError(err.message || t('failedToGenerateSummary'));
        } finally {
            setLoading(false);
        }
    };

    const loadSettings = async () => {
        const loadedSettings = await StorageManager.getSettings();
        setSettings(loadedSettings);
        setTheme(loadedSettings.theme);
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
                context: pageContent.content.slice(0, 5000),
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
            setError(err.message || t('failedToGetAnswer'));
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

    const handleSummarize = async (promptText?: string, promptId?: string) => {
        if (!pageContent) {
            setError(t('noPageContentAvailable'));
            return;
        }
        await performSummarize(
            pageContent.content,
            pageUrl,
            pageTitle,
            true,
            promptText,
            promptId,
        );
    };

    return (
        <div className="fullpage-app" data-theme={theme}>
            <header className="fullpage-header">
                <div className="header-content">
                    <div className="logo-container">
                        <img src={icon} alt="AskWeb AI" className="logo-icon" />
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                            }}
                        >
                            <h1 style={{ margin: 0, lineHeight: '1.2' }}>
                                AskWeb AI
                            </h1>
                            <small style={{ fontSize: '12px', opacity: 0.6 }}>
                                v{version}
                            </small>
                        </div>
                    </div>
                    {pageUrl && (
                        <a
                            href={pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="page-link"
                        >
                            {t('visitOriginalPage')}
                        </a>
                    )}
                </div>
            </header>

            <main className="fullpage-content">
                <div className="page-info-full">
                    <h2>{pageTitle || t('loading')}</h2>
                    {pageUrl && <p className="page-url">{pageUrl}</p>}
                </div>

                {/* Show source text if it's a selection summary */}
                {isSelection && pageContent && (
                    <div
                        className="source-content-section"
                        style={{
                            marginBottom: '20px',
                            padding: '15px',
                            background: 'var(--bg-secondary)',
                            borderRadius: '8px',
                        }}
                    >
                        <h3 style={{ marginTop: 0, fontSize: '1.1em' }}>
                            {t('sourceText')}
                        </h3>
                        <div
                            style={{
                                maxHeight: '200px',
                                overflowY: 'auto',
                                whiteSpace: 'pre-wrap',
                                fontSize: '0.9em',
                                opacity: 0.8,
                            }}
                        >
                            {pageContent.content}
                        </div>
                    </div>
                )}

                {error && (
                    <div className="error">
                        <p>⚠️ {error}</p>
                    </div>
                )}

                {summary && (
                    <>
                        <div className="summary-full">
                            <div className="section-header">
                                <h3>{t('summary')}</h3>
                                <SplitButton
                                    className="resummarize-btn"
                                    variant="secondary"
                                    icon={<RiRefreshLine aria-hidden="true" />}
                                    text={t('reSummarize')}
                                    loading={loading}
                                    loadingText={t('reSummarizing')}
                                    settings={settings}
                                    onAction={(promptText, promptId) =>
                                        handleSummarize(promptText, promptId)
                                    }
                                    menuPosition="bottom"
                                />
                            </div>
                            <div className="summary-content-wrapper">
                                <div className="summary-content markdown-content">
                                    <ReactMarkdown>{summary}</ReactMarkdown>
                                </div>
                                {loading && <div className="loading-overlay" />}
                            </div>
                        </div>

                        <div className="chat-full">
                            <h3>{t('askQuestions')}</h3>
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

                            <div className="input-container-full">
                                <input
                                    type="text"
                                    value={question}
                                    onChange={(e) =>
                                        setQuestion(e.target.value)
                                    }
                                    onKeyPress={handleKeyPress}
                                    placeholder={t(
                                        'askQuestionPagePlaceholder',
                                    )}
                                    disabled={loading}
                                    className="question-input"
                                />
                                <button
                                    onClick={handleAskQuestion}
                                    disabled={loading || !question.trim()}
                                    className="send-btn"
                                >
                                    {loading ? (
                                        '...'
                                    ) : (
                                        <RiSendPlane2Fill aria-hidden="true" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {!summary && !error && (
                    <div className="no-summary">
                        <p>{t('loadingSummary')}</p>
                    </div>
                )}
            </main>
        </div>
    );
}
