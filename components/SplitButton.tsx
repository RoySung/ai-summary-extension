import { useState, useEffect, useRef } from 'react';
import { type Settings } from '../utils/constants';
import styles from './SplitButton.module.css';

interface SplitButtonProps {
    className?: string;
    variant: 'primary' | 'secondary';
    icon: string;
    text: string;
    disabled?: boolean;
    loading?: boolean;
    loadingText?: string;
    settings: Settings;
    onAction: (promptText?: string, promptId?: string) => void;
    menuPosition?: 'top' | 'bottom';
}

export default function SplitButton({
    className,
    variant,
    icon,
    text,
    disabled = false,
    loading = false,
    loadingText = 'Loading...',
    settings,
    onAction,
    menuPosition = 'bottom',
}: SplitButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const buttonClass = variant === 'primary' ? 'primary-btn' : 'secondary-btn';

    const defaultPromptName = settings.savedPrompts?.find(
        (p) => p.id === settings.defaultPromptId,
    )?.name;

    // Close menu when clicking outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: Event) => {
            const mouseEvent = event as MouseEvent;
            if (
                menuRef.current &&
                !menuRef.current.contains(mouseEvent.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(mouseEvent.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event: Event) => {
            const keyboardEvent = event as KeyboardEvent;
            if (keyboardEvent.key === 'Escape') {
                setIsOpen(false);
            }
        };

        // Support both regular DOM and shadow DOM contexts
        // In content scripts, components are rendered in shadow DOM
        const rootNode = menuRef.current?.getRootNode();
        const eventTarget =
            rootNode instanceof ShadowRoot || rootNode instanceof Document
                ? rootNode
                : document;

        eventTarget.addEventListener('mousedown', handleClickOutside);
        eventTarget.addEventListener('keydown', handleEscape);

        return () => {
            eventTarget.removeEventListener('mousedown', handleClickOutside);
            eventTarget.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const handleMenuItemClick = (promptText: string, promptId: string) => {
        onAction(promptText, promptId);
        setIsOpen(false);
    };

    return (
        <div className={`actions ${styles.container} ${className || ''}`}>
            <div className={styles.buttonGroup}>
                <button
                    onClick={() => onAction()}
                    disabled={disabled || loading}
                    className={`${buttonClass} ${styles.mainButton}`}
                >
                    {loading ? (
                        <span>{loadingText}</span>
                    ) : (
                        <>
                            <span>
                                {icon} {text}
                            </span>
                            {defaultPromptName && (
                                <span className={styles.promptName}>
                                    ({defaultPromptName})
                                </span>
                            )}
                        </>
                    )}
                </button>

                <button
                    ref={triggerRef}
                    disabled={disabled || loading}
                    className={`${buttonClass} ${styles.triggerButton} ${styles[variant]}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    ▼
                </button>
            </div>

            {isOpen && (
                <div
                    ref={menuRef}
                    className={`${styles.menu} ${styles[menuPosition]}`}
                >
                    {settings.savedPrompts?.map((prompt) => (
                        <button
                            key={prompt.id}
                            onClick={() =>
                                handleMenuItemClick(prompt.content, prompt.id)
                            }
                            className={styles.menuItem}
                        >
                            {prompt.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
