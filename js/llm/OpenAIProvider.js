// OpenAI Provider
// Handles OpenAI API calls

import LLMProvider from './LLMProvider.js';

class OpenAIProvider extends LLMProvider {
    constructor(apiKey, model = 'gpt-4') {
        super(apiKey, model);
    }

    getTokenLimit() {
        const limits = {
            'gpt-4': 6000,
            'gpt-4-turbo': 100000,
            'gpt-3.5-turbo': 12000
        };
        return limits[this.model] || 6000;
    }

    async generateCompletion(prompt, systemPrompt = null) {
        const defaultSystemPrompt = 'You are an expert educational content creator. Always respond with valid JSON.';
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt || defaultSystemPrompt
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
            throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }
}

export default OpenAIProvider;
