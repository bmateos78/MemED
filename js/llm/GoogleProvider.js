// Google Gemini Provider
// Handles Google Gemini API calls

import LLMProvider from './LLMProvider.js';

class GoogleProvider extends LLMProvider {
    constructor(apiKey, model = 'gemini-pro') {
        super(apiKey, model);
    }

    getTokenLimit() {
        const limits = {
            'gemini-pro': 30000,
            'gemini-pro-vision': 16000,
            'gemini-1.5-pro-001': 1000000,
            'gemini-1.5-flash-001': 1000000,
            'gemini-2.5-flash': 1000000
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

        // Use proxy in production to avoid CORS issues
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const baseUrl = isLocal ? 'https://generativelanguage.googleapis.com' : '/api/google';

        const response = await fetch(`${baseUrl}/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
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
