// Infographic Generator
// Generates flowchart-style educational diagrams using image generation APIs

const DEFAULT_STYLE_PROMPT = 'Style: minimal, black and white with subtle accent colors, clear labels, arrows showing flow and relationships, no photorealism, no people, professional educational infographic, flowchart layout. All elements must fit entirely within the image boundaries with generous padding around all edges. Keep the diagram compact and centered, leaving clear margins on all sides. No text or shapes should be cropped or cut off at the edges.';

class InfographicGenerator {
    constructor() {
        this.stylePrompt = DEFAULT_STYLE_PROMPT;
    }

    async generate(concept, config, stylePrompt = null, aspectRatio = '1:1') {
        if (stylePrompt !== null) {
            this.stylePrompt = stylePrompt;
        }
        this.aspectRatio = aspectRatio;
        const { provider, apiKey, imageModel } = config;
        console.log(`Generating infographic for concept "${concept.title}" using provider: ${provider}, imageModel: ${imageModel || 'auto'}, aspectRatio: ${aspectRatio}`);

        if (provider === 'openai') {
            return await this._generateOpenAI(concept, apiKey, imageModel);
        } else if (provider === 'google') {
            return await this._generateGoogle(concept, apiKey, imageModel);
        } else {
            throw new Error(`Image generation is not supported for provider: ${provider}`);
        }
    }

    _getOpenAISize() {
        const sizeMap = {
            '1:1': '1024x1024',
            '16:9': '1536x1024',
            '9:16': '1024x1536',
            '4:3': '1536x1024',
            '3:4': '1024x1536'
        };
        return sizeMap[this.aspectRatio] || '1024x1024';
    }

    _buildPrompt(concept) {
        const plainText = concept.text.replace(/<[^>]*>/g, '').substring(0, 500);
        return `Create a simple, clean flowchart-style educational diagram about "${concept.title}". The diagram should illustrate the key relationships and steps described: ${plainText}. ${this.stylePrompt}`;
    }

    _getBaseUrl(proxyPath) {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        return isLocal ? null : proxyPath;
    }

    _handleHttpError(status, errorData, providerName) {
        const apiMessage = errorData.error?.message || '';
        if (status === 403) {
            throw new Error(`Your API key doesn't have access to ${providerName} image generation. Check your billing plan and API permissions.\n\nAPI response: ${apiMessage}`);
        } else if (status === 429) {
            throw new Error(`Rate limit exceeded for ${providerName} image generation. Please wait a moment and try again.`);
        }
        // For 404 and others, return false to signal fallback should be attempted
        return false;
    }

    // ===========================
    // OpenAI
    // ===========================

    async _generateOpenAI(concept, apiKey, imageModel) {
        const model = imageModel || 'gpt-image-1';
        const proxyBase = this._getBaseUrl('/api/openai');
        const url = proxyBase
            ? `${proxyBase}/v1/images/generations`
            : 'https://api.openai.com/v1/images/generations';

        try {
            return await this._callOpenAI(concept, apiKey, model, url);
        } catch (error) {
            // If the configured model failed with 404, try dall-e-3 as fallback
            if (error._status === 404 && model !== 'dall-e-3') {
                console.warn(`OpenAI model "${model}" not available, falling back to dall-e-3...`);
                return await this._callOpenAI(concept, apiKey, 'dall-e-3', url);
            }
            throw error;
        }
    }

    async _callOpenAI(concept, apiKey, model, url) {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                prompt: this._buildPrompt(concept),
                size: this._getOpenAISize(),
                n: 1
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const handled = this._handleHttpError(response.status, errorData, 'OpenAI');
            if (!handled) {
                const err = new Error(`OpenAI image generation failed (${model}): ${errorData.error?.message || response.statusText}`);
                err._status = response.status;
                throw err;
            }
        }

        const data = await response.json();
        const base64 = data.data[0].b64_json;
        return `data:image/png;base64,${base64}`;
    }

    // ===========================
    // Google — Imagen (predict endpoint)
    // ===========================

    async _generateGoogle(concept, apiKey, imageModel) {
        const model = imageModel || 'imagen-4.0-generate-001';

        // If a Gemini model is explicitly selected, go straight to native generation
        if (model.startsWith('gemini')) {
            return await this._callGeminiNative(concept, apiKey, model);
        }

        // Try Imagen first
        try {
            return await this._callImagen(concept, apiKey, model);
        } catch (error) {
            // If Imagen model not found or not accessible, fall back to Gemini native
            if (error._status === 404 || error._status === 400) {
                console.warn(`Google Imagen model "${model}" not available (${error._status}), falling back to Gemini 2.0 Flash native image generation...`);
                return await this._callGeminiNative(concept, apiKey, 'gemini-2.5-flash-image');
            }
            throw error;
        }
    }

    async _callImagen(concept, apiKey, model) {
        const proxyBase = this._getBaseUrl('/api/google');
        const baseUrl = proxyBase || 'https://generativelanguage.googleapis.com';
        const url = `${baseUrl}/v1beta/models/${model}:predict`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
                instances: [{ prompt: this._buildPrompt(concept) }],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: this.aspectRatio
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const handled = this._handleHttpError(response.status, errorData, 'Google Imagen');
            if (!handled) {
                const err = new Error(`Google Imagen failed (${model}): ${errorData.error?.message || response.statusText}`);
                err._status = response.status;
                throw err;
            }
        }

        const data = await response.json();
        const prediction = data.predictions[0];
        const base64 = prediction.bytesBase64Encoded;
        const mimeType = prediction.mimeType || 'image/png';
        return `data:${mimeType};base64,${base64}`;
    }

    // ===========================
    // Google — Gemini Native (generateContent endpoint)
    // ===========================

    async _callGeminiNative(concept, apiKey, model) {
        const proxyBase = this._getBaseUrl('/api/google');
        const baseUrl = proxyBase || 'https://generativelanguage.googleapis.com';
        const url = `${baseUrl}/v1beta/models/${model}:generateContent`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: this._buildPrompt(concept) }] }],
                generationConfig: {
                    responseModalities: ['IMAGE'],
                    imageConfig: {
                        aspectRatio: this.aspectRatio
                    }
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            this._handleHttpError(response.status, errorData, 'Gemini');
            throw new Error(`Gemini image generation failed (${model}): ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const parts = data.candidates[0].content.parts;
        // Find the part that contains image data
        const imagePart = parts.find(p => p.inline_data);
        if (!imagePart) {
            throw new Error('Gemini returned no image data. The model may not support image generation with your current API plan.');
        }

        const base64 = imagePart.inline_data.data;
        const mimeType = imagePart.inline_data.mime_type || 'image/png';
        return `data:${mimeType};base64,${base64}`;
    }
}

export default InfographicGenerator;
