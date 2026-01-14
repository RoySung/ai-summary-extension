import { GoogleGenAI } from '@google/genai';
import { MODELS } from '../utils/constants';
import { splitIntoChunks } from '../utils/chunking';

/**
 * Gemini API client
 */
export class GeminiAPI {
    private ai: GoogleGenAI;
    private model: string;

    constructor(apiKey: string, model: string = 'gemini-2.5-flash') {
        this.ai = new GoogleGenAI({ apiKey });
        this.model = model;
    }

    /**
     * Generate content using Gemini API
     */
    async generateContent(prompt: string): Promise<string> {
        const modelConfig = MODELS.GEMINI[this.model as keyof typeof MODELS.GEMINI];
        const maxOutputTokens = modelConfig?.maxOutput || 8192;

        try {
            const response = await this.ai.models.generateContent({
                model: this.model,
                contents: prompt,
                config: {
                    temperature: 0.7,
                    maxOutputTokens,
                }
            });

            const text = response.text;
            
            if (!text) {
                throw new Error('No response from Gemini API');
            }

            return text;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Gemini API error: ${error.message}`);
            }
            throw new Error('Unknown Gemini API error');
        }
    }

    /**
     * Check if the response seems truncated
     */
    private checkIfTruncated(text: string): boolean {
        const trimmed = text.trim();

        // Check if ends with incomplete sentence markers
        const endsWithIncomplete = /[^.!?。！？]\s*$/.test(trimmed);

        // Check if ends mid-word or with punctuation that suggests continuation
        const endsWithContinuation = /[:：,，、]$/.test(trimmed);

        // Check if ends with list item indicator without completion
        const endsWithListItem = /^.*[-•*]\s*[^.\n]*$/.test(trimmed.split('\n').pop() || '');

        return endsWithIncomplete || endsWithContinuation || endsWithListItem;
    }


    /**
     * Summarize content with proactive chunking strategy
     * 
     * Gemini 2.5 Flash supports up to 1M token context window.
     * We use 500K as a safe limit to leave room for output and prompt overhead.
     * This means most content will fit in a single request without chunking.
     * 
     * For extremely long content that exceeds 500K tokens:
     * 1. Split into chunks
     * 2. Summarize each chunk
     * 3. Create final summary from all chunk summaries
     */
    async summarize(content: string, customPrompt?: string): Promise<string> {
        const modelConfig = MODELS.GEMINI[this.model as keyof typeof MODELS.GEMINI];
        // Default to conservative 500k if config not found (shouldn't happen)
        const contextWindow = modelConfig?.contextWindow || 1000000;
        // Use 90% of context window as safe limit, leaving room for output and prompt overhead
        const maxInputTokens = Math.floor(contextWindow * 0.9);
        const chunks = splitIntoChunks(content, maxInputTokens);

        // Single chunk - direct summarization
        if (chunks.length === 1) {
            const prompt = customPrompt
                ? customPrompt.replace('{content}', content)
                : `Please provide a concise and comprehensive summary of the following content:\n\n${content}`;

            return await this.generateContent(prompt);
        }

        // Multi-chunk processing (rarely needed with 500K token limit)
        console.log(`📚 Content is exceptionally long (${chunks.length} chunks), processing in parts...`);
        const chunkSummaries: string[] = [];

        for (let i = 0; i < chunks.length; i++) {
            console.log(`📄 Summarizing chunk ${i + 1}/${chunks.length}...`);

            const chunkPrompt = `Please provide a concise summary of the following content (Part ${i + 1} of ${chunks.length}):

${chunks[i]}

Focus on key points, important details, and main ideas. Keep the summary concise but comprehensive.`;

            const chunkSummary = await this.generateContent(chunkPrompt);
            chunkSummaries.push(chunkSummary);

            // Small delay to avoid rate limiting
            if (i < chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        // Final synthesis - combine all chunk summaries into one comprehensive summary
        console.log(`🔄 Creating final comprehensive summary from ${chunkSummaries.length} parts...`);

        const finalPrompt = customPrompt
            ? customPrompt.replace('{content}', chunkSummaries.join('\n\n---\n\n'))
            : `I have summaries of different parts of a document. Please synthesize these into one coherent, comprehensive summary that covers all main points:

${chunkSummaries.map((summary, idx) => `Part ${idx + 1}:\n${summary}`).join('\n\n---\n\n')}

Create a well-structured final summary that:
1. Integrates all key points from the parts
2. Removes redundancy
3. Maintains logical flow
4. Highlights the most important information`;

        const finalSummary = await this.generateContent(finalPrompt);
        console.log('✅ Final summary complete!');

        return finalSummary;
    }


    /**
     * Answer a question based on context
     */
    async answerQuestion(
        context: string,
        summary: string,
        question: string,
        customPrompt?: string
    ): Promise<string> {
        const prompt = customPrompt
            ? customPrompt
                .replace('{context}', context)
                .replace('{summary}', summary)
                .replace('{question}', question)
            : `Based on the following context and summary, please answer the question.

Context:
${context}

Summary:
${summary}

Question: ${question}

Answer:`;

        return await this.generateContent(prompt);
    }
}
