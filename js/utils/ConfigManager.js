// Configuration Manager
// Handles LLM configuration and settings

class ConfigManager {
    constructor() {
        this.config = this.loadConfig();
    }

    loadConfig() {
        const saved = localStorage.getItem('eduMaterialLLMConfig');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse saved config:', e);
            }
        }

        return {
            provider: 'none',
            apiKey: '',
            model: ''
        };
    }

    saveConfig(config) {
        this.config = config;
        localStorage.setItem('eduMaterialLLMConfig', JSON.stringify(config));
    }

    getConfig() {
        return this.config;
    }

    isLLMConfigured() {
        return this.config.provider !== 'none' && this.config.apiKey;
    }
}

export default ConfigManager;
