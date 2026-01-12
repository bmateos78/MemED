// LLM Provider Factory
// Creates appropriate LLM provider based on configuration

import OpenAIProvider from './OpenAIProvider.js';
import AnthropicProvider from './AnthropicProvider.js';
import GoogleProvider from './GoogleProvider.js';

class LLMProviderFactory {
    static create(config) {
        const { provider, apiKey, model } = config;

        switch (provider) {
            case 'openai':
                return new OpenAIProvider(apiKey, model);
            case 'anthropic':
                return new AnthropicProvider(apiKey, model);
            case 'google':
                return new GoogleProvider(apiKey, model);
            case 'none':
            default:
                return null;
        }
    }
}

export default LLMProviderFactory;
