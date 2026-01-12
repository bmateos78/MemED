// Google Gemini Provider
// Handles Google Gemini API calls

import LLMProvider from './LLMProvider.js';

class GoogleProvider extends LLMProvider {
    constructor(apiKey, model = 'gemini-pro') {
        super(apiKey, model);
    }

    getTokenLimit() {
        const limits = {
            'gemini-pro': 25000,
            'gemini-pro-vision': 12000
        };
        return limits[this.model] || 25000;
    }

    async generateCompletion(prompt, systemPrompt = null) {
        const body = {
            contents: [{
                parts: [{ text: prompt }]
            }]
        };

        if (systemPrompt) {
            body.system_instruction = {
                parts: [{ text: systemPrompt }]
            };
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
            throw new Error(`Google API error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }
}

export default GoogleProvider;
