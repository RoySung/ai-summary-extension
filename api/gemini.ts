import { GEMINI_API_ENDPOINT } from '../utils/constants';
import { splitIntoChunks } from '../utils/chunking';

export interface GeminiResponse {
    candidates: Array<{
        content: {
            parts: Array<{
                text: string;
            }>;
        };
    }>;
}

/**
 * Gemini API client
 */
export class GeminiAPI {
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model: string = 'gemini-2.0-flash-exp') {
        this.apiKey = apiKey;
        this.model = model;
    }

    /**
     * Generate content using Gemini API
     */
    async generateContent(prompt: string): Promise<string> {
        const url = `${GEMINI_API_ENDPOINT}/${this.model}:generateContent?key=${this.apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 8192, // Increased token limit
                },
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${error}`);
        }

        const data: GeminiResponse = await response.json();

        if (!data.candidates || data.candidates.length === 0) {
            throw new Error('No response from Gemini API');
        }

        return data.candidates[0].content.parts[0].text;
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
     * 1. Check content length
     * 2. If too long, split into chunks
     * 3. Summarize each chunk
     * 4. Create final summary from all chunk summaries
     */
    async summarize(content: string, customPrompt?: string): Promise<string> {
        // Conservative token limit to avoid truncation
        const maxInputTokens = 6000; // Leave room for response
        const chunks = splitIntoChunks(content, maxInputTokens);

        // Single chunk - direct summarization
        if (chunks.length === 1) {
            const prompt = customPrompt
                ? customPrompt.replace('{content}', content)
                : `Please provide a concise and comprehensive summary of the following content:\n\n${content}`;

            return await this.generateContent(prompt);
        }

        // Multi-chunk processing with progress reporting
        console.log(`📚 Content is long, splitting into ${chunks.length} chunks for processing...`);
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
