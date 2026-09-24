import { OPENAI_API_ENDPOINT, MODELS } from '../utils/constants';
import { splitIntoChunks } from '../utils/chunking';

type PromptVariables = Record<string, string | undefined>;

const DEFAULT_MAX_COMPLETION_TOKENS = 4096;
const SUMMARY_MAX_COMPLETION_TOKENS = 8192;
const PROMPT_TOKEN_HEADROOM = 4096;

export interface OpenAIMessage {
    role: 'developer' | 'system' | 'user' | 'assistant';
    content: string;
}

export interface OpenAIResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

/**
 * OpenAI API client
 */
export class OpenAIAPI {
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model: string = 'gpt-6-luna') {
        this.apiKey = apiKey;
        this.model = model;
    }

    private withLanguageInstruction(
        content: string,
        responseLanguageInstruction?: string,
    ): string {
        if (!responseLanguageInstruction) {
            return content;
        }

        return `${content}\n\n${responseLanguageInstruction}`;
    }

    private applyPromptVariables(
        prompt: string,
        variables: PromptVariables,
    ): string {
        return Object.entries(variables).reduce(
            (result, [key, value]) =>
                result.replaceAll(`{${key}}`, value ?? ''),
            prompt,
        );
    }

    /**
     * Generate content using OpenAI API
     */
    async generateContent(
        messages: OpenAIMessage[],
        maxCompletionTokens: number = DEFAULT_MAX_COMPLETION_TOKENS,
    ): Promise<string> {
        const modelConfig =
            MODELS.OPENAI[this.model as keyof typeof MODELS.OPENAI];
        const maxTokens = Math.min(
            maxCompletionTokens,
            modelConfig?.maxOutput || DEFAULT_MAX_COMPLETION_TOKENS,
        );

        const requestBody = {
            model: this.model,
            messages,
            max_completion_tokens: maxTokens,
            ...(modelConfig?.reasoningEffort && {
                reasoning_effort: modelConfig.reasoningEffort,
            }),
            ...(modelConfig?.supportsTemperature !== false && {
                temperature: 0.7,
            }),
        };

        const response = await fetch(OPENAI_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error: ${response.status} - ${error}`);
        }

        const data: OpenAIResponse = await response.json();

        if (!data.choices || data.choices.length === 0) {
            throw new Error('No response from OpenAI API');
        }

        return data.choices[0].message.content;
    }

    /**
     * Summarize content with proactive chunking strategy
     * 1. Check content length
     * 2. If too long, split into chunks
     * 3. Summarize each chunk
     * 4. Create final summary from all chunk summaries
     */
    async summarize(
        content: string,
        url?: string,
        customPrompt?: string,
        responseLanguageInstruction?: string,
    ): Promise<string> {
        const modelConfig =
            MODELS.OPENAI[this.model as keyof typeof MODELS.OPENAI];
        // Default to conservative 5000 if config not found (shouldn't happen)
        const contextWindow = modelConfig?.maxInput || 128000;
        // Reserve space for generated/reasoning tokens and prompt framing while
        // retaining the existing 10% safety margin for tokenizer differences.
        const maxInputTokens = Math.max(
            1,
            Math.min(
                Math.floor(contextWindow * 0.9),
                contextWindow -
                    SUMMARY_MAX_COMPLETION_TOKENS -
                    PROMPT_TOKEN_HEADROOM,
            ),
        );
        const chunks = splitIntoChunks(content, maxInputTokens);

        // Single chunk - direct summarization
        if (chunks.length === 1) {
            const userMessage = customPrompt
                ? this.applyPromptVariables(customPrompt, {
                      content,
                      url,
                  })
                : `Please provide a concise and comprehensive summary of the following content:\n\n${content}`;

            return await this.generateContent(
                [
                    {
                        role: 'developer',
                        content: this.withLanguageInstruction(
                            'You are a helpful assistant that provides clear and concise summaries.',
                            responseLanguageInstruction,
                        ),
                    },
                    { role: 'user', content: userMessage },
                ],
                SUMMARY_MAX_COMPLETION_TOKENS,
            );
        }

        // Multi-chunk processing with progress reporting
        console.log(
            `📚 Content is long, splitting into ${chunks.length} chunks for processing...`,
        );
        const chunkSummaries: string[] = [];

        for (let i = 0; i < chunks.length; i++) {
            console.log(`📄 Summarizing chunk ${i + 1}/${chunks.length}...`);

            const summary = await this.generateContent(
                [
                    {
                        role: 'developer',
                        content: this.withLanguageInstruction(
                            'You are a helpful assistant that summarizes content.',
                            responseLanguageInstruction,
                        ),
                    },
                    {
                        role: 'user',
                        content: `Please provide a concise summary of the following content (Part ${
                            i + 1
                        } of ${chunks.length}):\n\n${
                            chunks[i]
                        }\n\nFocus on key points, important details, and main ideas.`,
                    },
                ],
                SUMMARY_MAX_COMPLETION_TOKENS,
            );
            chunkSummaries.push(summary);

            // Small delay to avoid rate limiting
            if (i < chunks.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
        }

        // Final synthesis - combine all chunk summaries into one comprehensive summary
        console.log(
            `🔄 Creating final comprehensive summary from ${chunkSummaries.length} parts...`,
        );

        const combinedContent = customPrompt
        ? this.applyPromptVariables(customPrompt, {
            content: chunkSummaries.join('\n\n---\n\n'),
            url,
          })
            : chunkSummaries
                  .map((summary, idx) => `Part ${idx + 1}:\n${summary}`)
                  .join('\n\n---\n\n');

        const finalPrompt = customPrompt
            ? combinedContent
            : `I have summaries of different parts of a document. Please synthesize these into one coherent, comprehensive summary that covers all main points:\n\n${combinedContent}\n\nCreate a well-structured final summary that:\n1. Integrates all key points from the parts\n2. Removes redundancy\n3. Maintains logical flow\n4. Highlights the most important information`;

        const finalSummary = await this.generateContent(
            [
                {
                    role: 'developer',
                    content: this.withLanguageInstruction(
                        'You are a helpful assistant that synthesizes information.',
                        responseLanguageInstruction,
                    ),
                },
                { role: 'user', content: finalPrompt },
            ],
            SUMMARY_MAX_COMPLETION_TOKENS,
        );

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
        customPrompt?: string,
        responseLanguageInstruction?: string,
    ): Promise<string> {
        const userMessage = customPrompt
            ? customPrompt
                  .replace('{context}', context)
                  .replace('{summary}', summary)
                  .replace('{question}', question)
            : `Based on the following context and summary, please answer the question.

Context:
${context}

Summary:
${summary}

Question: ${question}`;

        return await this.generateContent([
            {
                role: 'developer',
                content: this.withLanguageInstruction(
                    'You are a helpful assistant that answers questions based on provided context.',
                    responseLanguageInstruction,
                ),
            },
            { role: 'user', content: userMessage },
        ]);
    }

    /**
     * Continue conversation with message history
     */
    async chat(messages: OpenAIMessage[]): Promise<string> {
        return await this.generateContent(messages);
    }
}
