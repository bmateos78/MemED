// UI Manager
// Handles all UI updates, rendering, and user interactions

import MarkdownFormatter from '../utils/MarkdownFormatter.js';

class UIManager {
    constructor() {
        this.elements = {
            inputText: document.getElementById('input-text'),
            pdfUpload: document.getElementById('pdf-upload'),
            fileName: document.getElementById('file-name'),
            loadingState: document.getElementById('loading-state'),
            resultsContainer: document.getElementById('results-container'),
            conceptsContainer: document.getElementById('concepts-container'),
            submitQuizBtn: document.getElementById('submit-quiz-btn')
        };
    }

    // ===========================
    // Input Management
    // ===========================

    getInputText() {
        return this.elements.inputText.value.trim();
    }

    setInputText(text) {
        this.elements.inputText.value = text;
    }

    clearInput() {
        this.elements.inputText.value = '';
        this.elements.pdfUpload.value = '';
        this.elements.fileName.classList.add('hidden');
        this.elements.fileName.textContent = '';
        this.elements.resultsContainer.classList.add('hidden');
    }

    // ===========================
    // PDF Upload UI
    // ===========================

    displayPDFResult(result) {
        this.elements.fileName.textContent = `Loaded: ${result.pageCount} pages, ${result.charCount.toLocaleString()} characters`;
        this.elements.fileName.classList.remove('hidden');
        this.setInputText(result.text);
    }

    showPDFError(message) {
        alert(`PDF Error: ${message}`);
        this.elements.fileName.classList.add('hidden');
    }

    // ===========================
    // Loading States
    // ===========================

    showLoading() {
        this.elements.loadingState.classList.remove('hidden');
        this.elements.resultsContainer.classList.add('hidden');
    }

    hideLoading() {
        this.elements.loadingState.classList.add('hidden');
    }

    // ===========================
    // Concept Display
    // ===========================

    displayConcepts(concepts, editManager, provider = null) {
        this.elements.conceptsContainer.innerHTML = '';

        concepts.forEach((concept, index) => {
            const conceptBlock = this.createConceptBlock(concept, index);
            this.elements.conceptsContainer.appendChild(conceptBlock);

            // Attach edit listeners
            if (editManager) {
                editManager.attachEditListeners(conceptBlock, index);
            }
        });

        // Add knowledge check toggle functionality
        this.setupKnowledgeCheckToggles();

        this.elements.resultsContainer.classList.remove('hidden');
        this.elements.submitQuizBtn.classList.remove('hidden');
    }

    setupKnowledgeCheckToggles() {
        // Use event delegation for better performance
        this.elements.conceptsContainer.addEventListener('click', (e) => {
            const checkContainer = e.target.closest('.knowledge-check-container');
            if (checkContainer && !e.target.closest('.edit-btn')) {
                // Don't toggle if clicking the edit button or if already editing
                if (checkContainer.classList.contains('editing-mode')) return;

                checkContainer.classList.toggle('flipped');
                return;
            }

            // Handle selecting correct answer during quiz edit
            const quizOption = e.target.closest('.quiz-option');
            const quizQuestion = e.target.closest('.quiz-question');
            if (quizOption && quizQuestion && quizQuestion.classList.contains('editing')) {
                const radio = quizOption.querySelector('input[type="radio"]');
                if (radio && e.target !== radio) {
                    radio.checked = true;
                }
            }
        });
    }

    createConceptBlock(concept, index) {
        const block = document.createElement('div');
        block.className = 'concept-block';
        block.style.animationDelay = `${index * 0.1}s`;
        block.dataset.conceptIndex = index;

        block.innerHTML = `
            <div class="concept-header">
                <div class="concept-number">${index + 1}</div>
                <div class="concept-title-wrapper" style="flex: 1; display: flex; align-items: center; gap: 1rem;">
                    <h2 class="concept-title" data-concept-index="${index}">${concept.title}</h2>
                    <div class="edit-controls" style="margin: 0;">
                        <button class="edit-btn" data-edit-type="title" data-concept-index="${index}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Edit Title
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="concept-content-wrapper">
                <div class="edit-controls">
                    <button class="edit-btn" data-edit-type="text" data-concept-index="${index}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Edit Summary
                    </button>
                </div>
                <div class="concept-content" data-concept-index="${index}" data-editable="text">
                    ${concept.text}
                </div>
            </div>
            
            
            <div class="concept-section">
                <div class="section-header-with-edit">
                    <h3 class="concept-section-title">
                        <span class="icon">🎯</span>
                        Knowledge Checks
                    </h3>
                </div>
                ${concept.knowledgeChecks.map((check, checkIndex) => `
                    <div class="knowledge-check-container" data-concept-index="${index}" data-check-index="${checkIndex}">
                        <div class="flashcard">
                            <div class="flashcard-front">
                                <div class="flashcard-label">Question</div>
                                <div class="edit-controls">
                                    <button class="edit-btn" data-edit-type="knowledge-check" data-concept-index="${index}" data-check-index="${checkIndex}">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                        Edit
                                    </button>
                                </div>
                                <div class="flashcard-icon">❓</div>
                                <div class="knowledge-check-question" data-field="question">${check.question}</div>
                                <div class="flashcard-hint">Click to flip</div>
                            </div>
                            <div class="flashcard-back">
                                <div class="flashcard-label">Answer</div>
                                <div class="edit-controls">
                                    <button class="edit-btn" data-edit-type="knowledge-check" data-concept-index="${index}" data-check-index="${checkIndex}">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                        Edit
                                    </button>
                                </div>
                                <div class="flashcard-icon">💡</div>
                                <div class="knowledge-check-answer" data-field="answer">${check.answer}</div>
                                <div class="flashcard-hint">Click to reveal question</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="concept-section">
                <div class="section-header-with-edit">
                    <h3 class="concept-section-title">
                        <span class="icon">📊</span>
                        Quiz Questions
                    </h3>
                </div>
                ${concept.quizQuestions.map((q, qIndex) => {
            if (q.type === 'matching') {
                return `
                        <div class="quiz-question-container matching-question" data-question-index="${q.id}" data-concept-index="${index}" data-quiz-index="${qIndex}">
                            <div class="edit-controls">
                                <button class="edit-btn" data-edit-type="quiz" data-concept-index="${index}" data-quiz-index="${qIndex}">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                    Edit
                                </button>
                            </div>
                            <div class="matching-title">
                                <strong>Question ${qIndex + 1}:</strong> <span class="matching-title-content" data-field="title">${q.title}</span>
                            </div>
                            <div class="matching-pairs">
                                ${q.pairs.map((pair, pIndex) => `
                                    <div class="matching-pair">
                                        <div class="matching-left" data-field="left-${pIndex}">${pair.left}</div>
                                        <div class="matching-right">
                                            <div class="matching-right-correct" data-field="right-${pIndex}" style="display:none;">${pair.right}</div>
                                            <select name="matching-${q.id}-${pIndex}">
                                                <option value="">Select match...</option>
                                                ${q.shuffledRight.map((item, iIndex) => `
                                                    <option value="${iIndex}">${item}</option>
                                                `).join('')}
                                            </select>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>`;
            } else {
                return `
                        <div class="quiz-question-container quiz-question" data-question-index="${q.id}" data-concept-index="${index}" data-quiz-index="${qIndex}">
                            <div class="edit-controls">
                                <button class="edit-btn" data-edit-type="quiz" data-concept-index="${index}" data-quiz-index="${qIndex}">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                    Edit
                                </button>
                            </div>
                            <div class="quiz-question-text">
                                <strong>Question ${qIndex + 1}:</strong> <div class="question-text-content" data-field="question">${q.question}</div>
                            </div>
                            <div class="quiz-options">
                                ${q.options.map((option, optIndex) => `
                                    <div class="quiz-option">
                                        <input 
                                            type="radio" 
                                            id="q${q.id}-opt${optIndex}" 
                                            name="question-${q.id}" 
                                            value="${optIndex}"
                                        >
                                        <label for="q${q.id}-opt${optIndex}" data-field="option-${optIndex}">${option}</label>
                                        <span class="correct-badge">Correct Answer</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>`;
            }
        }).join('')}

            
            <div class="concept-section">
                <div class="section-header-with-edit">
                    <h3 class="concept-section-title">
                        <span class="icon">🚀</span>
                        Learning Activities
                    </h3>
                </div>
                ${concept.activities.map((activity, actIndex) => `
                    <div class="activity-item" data-concept-index="${index}" data-activity-index="${actIndex}">
                        <div class="edit-controls">
                            <button class="edit-btn" data-edit-type="activity" data-concept-index="${index}" data-activity-index="${actIndex}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                                Edit
                            </button>
                        </div>
                        <div class="activity-title">
                            <span class="activity-icon">${activity.icon}</span>
                            <div class="activity-title-content" data-field="title">${activity.title}</div>
                            <span class="activity-badge">${activity.type}</span>
                        </div>
                        <div class="activity-description" data-field="description">${activity.description}</div>
                    </div>
                `).join('')}
            </div>
        `;

        return block;
    }



    // ===========================
    // Quiz Results Display
    // ===========================

    displayQuizResults(score, totalQuestions, incorrectQuestions) {
        const percentage = Math.round((score / totalQuestions) * 100);
        const passed = percentage >= 70;

        let resultHTML = `
            <div class="quiz-results ${passed ? 'passed' : 'failed'}">
                <h3>Quiz Results</h3>
                <div class="score-display">
                    <div class="score-circle ${passed ? 'pass' : 'fail'}">
                        <span class="score-percentage">${percentage}%</span>
                        <span class="score-fraction">${score}/${totalQuestions}</span>
                    </div>
                </div>
                <p class="result-message">
                    ${passed
                ? '🎉 Congratulations! You passed the quiz!'
                : '📚 Keep studying! You can retake the quiz.'}
                </p>
                `;

        if (incorrectQuestions.length > 0) {
            resultHTML += `
                    <div class="incorrect-answers">
                        <h4>Review These Questions:</h4>
                    ${incorrectQuestions.map(q => `
                        <div class="incorrect-question">
                            <p><strong>Q:</strong> ${q.question}</p>
                            <p class="your-answer">Your answer: ${q.userAnswer}</p>
                            <p class="correct-answer">Correct answer: ${q.correctAnswer}</p>
                        </div>
                    `).join('')
                }
                </div>
                    `;
        }

        resultHTML += '</div>';

        // Insert results after submit button
        const submitBtn = this.elements.submitQuizBtn;
        const existingResults = document.querySelector('.quiz-results');
        if (existingResults) {
            existingResults.remove();
        }
        submitBtn.insertAdjacentHTML('afterend', resultHTML);
        submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // ===========================
    // Settings Modal
    // ===========================

    initializeSettingsModal(configManager) {
        const modal = document.getElementById('settings-modal');
        const openBtn = document.getElementById('settings-btn');
        const closeBtn = document.getElementById('close-modal-btn'); // Fixed ID
        const cancelBtn = document.getElementById('cancel-settings-btn'); // Added cancel button
        const saveBtn = document.getElementById('save-settings-btn'); // Fixed ID
        const providerSelect = document.getElementById('llm-provider');
        const modelSelect = document.getElementById('model-name'); // Fixed ID
        const apiKeyInput = document.getElementById('api-key');
        const apiConfig = document.getElementById('api-config'); // API config section

        // Check if all elements exist
        if (!modal || !openBtn || !closeBtn || !cancelBtn || !saveBtn || !providerSelect || !modelSelect || !apiKeyInput || !apiConfig) {
            console.error('Settings modal elements not found:', {
                modal: !!modal,
                openBtn: !!openBtn,
                closeBtn: !!closeBtn,
                cancelBtn: !!cancelBtn,
                saveBtn: !!saveBtn,
                providerSelect: !!providerSelect,
                modelSelect: !!modelSelect,
                apiKeyInput: !!apiKeyInput,
                apiConfig: !!apiConfig
            });
            return;
        }

        // IMPORTANT: Ensure modal is hidden on initialization
        // This fixes any stray 'active' class that might be present
        modal.classList.remove('active');

        console.log('Settings modal initialized successfully');

        // Model options for each provider
        const modelOptions = {
            'none': [],
            'openai': [
                { value: 'gpt-4o', label: 'GPT-4o (Recommended)' },
                { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
                { value: 'gpt-4', label: 'GPT-4' },
                { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
            ],
            'anthropic': [
                { value: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet' },
                { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
                { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
                { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' }
            ],
            'google': [
                { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
                { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
                { value: 'gemini-pro', label: 'Gemini 1.0 Pro' }
            ]
        };

        // Helper function to show/hide API config section
        const toggleApiConfig = (provider) => {
            console.log('toggleApiConfig called with provider:', provider);
            console.log('apiConfig element:', apiConfig);
            console.log('apiConfig classes before:', apiConfig.className);

            if (provider === 'none') {
                apiConfig.classList.add('hidden');
                console.log('Added hidden class (provider is none)');
            } else {
                apiConfig.classList.remove('hidden');
                console.log('Removed hidden class (provider is:', provider, ')');
            }

            console.log('apiConfig classes after:', apiConfig.className);
        };

        // Open modal
        openBtn.addEventListener('click', () => {
            console.log('Settings button clicked');
            const config = configManager.getConfig();
            providerSelect.value = config.provider;
            apiKeyInput.value = config.apiKey;
            this.updateModelOptions(modelSelect, modelOptions, config.provider, config.model);
            toggleApiConfig(config.provider); // Show/hide API config based on saved provider
            modal.classList.add('active');
        });

        // Close modal
        closeBtn.addEventListener('click', () => {
            console.log('Close button clicked');
            modal.classList.remove('active');
        });

        // Cancel button (same as close)
        cancelBtn.addEventListener('click', () => {
            console.log('Cancel button clicked');
            modal.classList.remove('active');
        });

        // Update models when provider changes
        providerSelect.addEventListener('change', (e) => {
            console.log('Provider select changed! Event:', e);
            const selectedProvider = e.target.value;
            console.log('Selected provider:', selectedProvider);
            this.updateModelOptions(modelSelect, modelOptions, selectedProvider);
            toggleApiConfig(selectedProvider); // Show/hide API config when provider changes
        });

        // Save settings
        saveBtn.addEventListener('click', () => {
            const config = {
                provider: providerSelect.value,
                apiKey: apiKeyInput.value,
                model: modelSelect.value
            };
            configManager.saveConfig(config);
            modal.classList.remove('active');
            alert('Settings saved successfully!');
        });

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    updateModelOptions(modelSelect, modelOptions, provider, selectedModel = '') {
        modelSelect.innerHTML = '';
        const options = modelOptions[provider] || [];

        if (options.length === 0) {
            modelSelect.innerHTML = '<option value="">No model needed</option>';
            modelSelect.disabled = true;
        } else {
            modelSelect.disabled = false;
            options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.label;
                if (opt.value === selectedModel) {
                    option.selected = true;
                }
                modelSelect.appendChild(option);
            });
        }
    }
}

export default UIManager;
