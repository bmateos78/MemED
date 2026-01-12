// Base LLM Provider Class
// Abstract class for all LLM providers

class LLMProvider {
    constructor(apiKey, model) {
        this.apiKey = apiKey;
        this.model = model;
    }

    async generateCompletion(prompt, systemPrompt = null) {
        throw new Error('generateCompletion must be implemented by subclass');
    }

    getTokenLimit() {
        throw new Error('getTokenLimit must be implemented by subclass');
    }

    estimateTokens(text) {
        // Rough estimate: 1 token ≈ 4 characters
        return Math.ceil(text.length / 4);
    }

    checkTokenLimit(text) {
        const estimatedTokens = this.estimateTokens(text);
        const limit = this.getTokenLimit();

        if (estimatedTokens > limit * 0.6) {
            const maxChars = Math.floor(limit * 0.6 * 4);
            return {
                withinLimit: false,
                estimatedTokens,
                limit,
                maxChars,
                shouldTruncate: estimatedTokens > limit
            };
        }

        return {
            withinLimit: true,
            estimatedTokens,
            limit
        };
    }
}

export default LLMProvider;
