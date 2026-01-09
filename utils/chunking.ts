import { TOKEN_LIMITS } from './constants';
import { encode } from 'gpt-tokenizer';

/**
 * Estimate token count using gpt-tokenizer
 */
export function estimateTokenCount(text: string): number {
    return encode(text).length;
}

/**
 * Split content into chunks based on token limit
 */
export function splitIntoChunks(
    content: string,
    maxTokens: number
): string[] {
    const estimatedTokens = estimateTokenCount(content);

    // If content fits in one chunk, return it as is
    if (estimatedTokens <= maxTokens) {
        return [content];
    }

    const chunks: string[] = [];
    const maxCharsPerChunk = maxTokens * 4; // Rough estimate

    // Split by paragraphs first
    const paragraphs = content.split(/\n\n+/);
    let currentChunk = '';

    for (const paragraph of paragraphs) {
        // If paragraph itself is too large, split by sentences
        if (paragraph.length > maxCharsPerChunk) {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
            }

            const sentences = paragraph.split(/[.!?]+\s+/);
            for (const sentence of sentences) {
                if ((currentChunk + sentence).length > maxCharsPerChunk) {
                    if (currentChunk) {
                        chunks.push(currentChunk.trim());
                    }
                    currentChunk = sentence;
                } else {
                    currentChunk += (currentChunk ? '. ' : '') + sentence;
                }
            }
        } else {
            // Try to add paragraph to current chunk
            if ((currentChunk + '\n\n' + paragraph).length > maxCharsPerChunk) {
                if (currentChunk) {
                    chunks.push(currentChunk.trim());
                }
                currentChunk = paragraph;
            } else {
                currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
            }
        }
    }

    // Add remaining content
    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }

    // Fallback: if no chunks were created, force split
    if (chunks.length === 0) {
        const chunkSize = maxCharsPerChunk;
        for (let i = 0; i < content.length; i += chunkSize) {
            chunks.push(content.slice(i, i + chunkSize));
        }
    }

    console.log(`Split content into ${chunks.length} chunks`);
    return chunks;
}

/**
 * Get appropriate token limit based on provider
 */
export function getTokenLimit(provider: 'gemini' | 'openai'): number {
    return provider === 'gemini' ? TOKEN_LIMITS.GEMINI_INPUT : TOKEN_LIMITS.OPENAI_INPUT;
}
