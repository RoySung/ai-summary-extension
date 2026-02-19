import { CACHE_EXPIRATION_MS, CACHE_KEY_PREFIX } from './constants';

interface CacheEntry {
    summary: string;
    timestamp: number;
    url: string;
    contentHash: string;
}

interface CacheData {
    [key: string]: CacheEntry;
}

/**
 * Simple hash function for content
 */
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
}

/**
 * Cache manager for storing and retrieving summaries
 */
export class CacheManager {
    /**
     * Generate cache key from URL and promptId
     */
    static generateKey(url: string, promptId?: string): string {
        const urlHash = simpleHash(url);
        const key = `${CACHE_KEY_PREFIX}${urlHash}_${promptId || 'default'}`;
        return key;
    }

    /**
     * Get cached summary
     */
    static async get(url: string, promptId?: string): Promise<string | null> {
        const key = this.generateKey(url, promptId);
        const result = await browser.storage.local.get(key);

        if (!result[key]) {
            return null;
        }

        const entry: CacheEntry = result[key];
        const now = Date.now();

        // Check if cache is expired
        if (now - entry.timestamp > CACHE_EXPIRATION_MS) {
            await browser.storage.local.remove(key);
            return null;
        }

        console.log('Cache hit for URL:', url, 'promptId:', promptId);
        return entry.summary;
    }

    /**
     * Set cached summary
     */
    static async set(
        url: string,
        summary: string,
        promptId?: string,
    ): Promise<void> {
        const key = this.generateKey(url, promptId);

        const entry: CacheEntry = {
            summary,
            timestamp: Date.now(),
            url,
            contentHash: '', // Kept for backwards compatibility with existing cache entries
        };

        await browser.storage.local.set({ [key]: entry });
        console.log('Cached summary for URL:', url, 'promptId:', promptId);
    }

    /**
     * Clear cache entries for a specific prompt ID
     */
    static async clearPromptCache(promptId: string): Promise<void> {
        const result = await browser.storage.local.get(null);
        const suffix = `_${promptId}`;
        const keysToRemove = Object.keys(result).filter(
            (key) => key.startsWith(CACHE_KEY_PREFIX) && key.endsWith(suffix),
        );

        if (keysToRemove.length > 0) {
            await browser.storage.local.remove(keysToRemove);
            console.log(
                `Cleared ${keysToRemove.length} cache entries for prompt: ${promptId}`,
            );
        }
    }

    /**
     * Clear all cached summaries
     */
    static async clear(): Promise<void> {
        const result = await browser.storage.local.get(null);
        const keysToRemove = Object.keys(result).filter((key) =>
            key.startsWith(CACHE_KEY_PREFIX),
        );

        if (keysToRemove.length > 0) {
            await browser.storage.local.remove(keysToRemove);
            console.log(`Cleared ${keysToRemove.length} cached entries`);
        }
    }

    /**
     * Clean expired cache entries
     */
    static async cleanExpired(): Promise<void> {
        const result = await browser.storage.local.get(null);
        const now = Date.now();
        const keysToRemove: string[] = [];

        for (const [key, value] of Object.entries(result)) {
            if (key.startsWith(CACHE_KEY_PREFIX)) {
                const entry = value as CacheEntry;
                if (now - entry.timestamp > CACHE_EXPIRATION_MS) {
                    keysToRemove.push(key);
                }
            }
        }

        if (keysToRemove.length > 0) {
            await browser.storage.local.remove(keysToRemove);
            console.log(`Cleaned ${keysToRemove.length} expired cache entries`);
        }
    }
}
