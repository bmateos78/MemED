// Anthropic Provider
// Handles Anthropic Claude API calls

import LLMProvider from './LLMProvider.js';

class AnthropicProvider extends LLMProvider {
    constructor(apiKey, model = 'claude-3-sonnet-20240229') {
        super(apiKey, model);
    }

    getTokenLimit() {
        // All Claude 3 models have 200K context
        return 150000;
    }

    async generateCompletion(prompt, systemPrompt = null) {
        const body = {
            model: this.model,
            max_tokens: 4096,
            messages: [
                { role: 'user', content: prompt }
            ]
        };

        if (systemPrompt) {
            body.system = systemPrompt;
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
            throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.content[0].text;
    }
}

export default AnthropicProvider;
