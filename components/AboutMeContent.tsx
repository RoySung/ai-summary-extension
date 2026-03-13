import { useTranslate } from '../hooks/useTranslate';
import { type Language } from '../utils/constants';
import './AboutMeContent.css';

const PROFILE_IMAGE_URL =
    'https://avatars.githubusercontent.com/u/10613432?v=4';

const ABOUT_ME_LINKS = [
    {
        href: 'https://chromewebstore.google.com/detail/askweb-ai-summarize-chat/hdbcgnpajflneeoeiagefmfgbcgdmojj?authuser=0&hl=zh-TW',
        labelKey: 'aboutMeStoreLinkLabel',
        descriptionKey: 'aboutMeStoreLinkDescription',
        url: 'chromewebstore.google.com',
    },
    {
        href: 'https://github.com/RoySung/ai-summary-extension',
        labelKey: 'aboutMeGithubLinkLabel',
        descriptionKey: 'aboutMeGithubLinkDescription',
        url: 'github.com/RoySung/ai-summary-extension',
    },
    {
        href: 'https://roysung.notion.site/',
        labelKey: 'aboutMeProfileLinkLabel',
        descriptionKey: 'aboutMeProfileLinkDescription',
        url: 'roysung.notion.site',
    },
] as const;

interface AboutMeContentProps {
    language: Language;
}

export default function AboutMeContent({ language }: AboutMeContentProps) {
    const t = useTranslate(language);

    return (
        <div className="about-me-shell">
            <div className="about-me-card">
                <div className="about-me-hero">
                    <img
                        src={PROFILE_IMAGE_URL}
                        alt={t('aboutMeProfileImageAlt')}
                        className="about-me-avatar"
                        referrerPolicy="no-referrer"
                    />

                    <div className="about-me-intro">
                        <span className="about-me-eyebrow">
                            {t('aboutMeEyebrow')}
                        </span>
                        <h2 className="about-me-title">{t('aboutMeTitle')}</h2>
                        <p className="about-me-text">{t('aboutMeContent')}</p>
                    </div>
                </div>

                <div className="about-me-links">
                    {ABOUT_ME_LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="about-me-link-card"
                        >
                            <span className="about-me-link-label">
                                {t(link.labelKey)}
                            </span>
                            <span className="about-me-link-description">
                                {t(link.descriptionKey)}
                            </span>
                            <span className="about-me-link-url">
                                {link.url}
                            </span>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
