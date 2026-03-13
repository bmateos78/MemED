// UI Manager
// Handles all UI updates, rendering, and user interactions



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

    displayConcepts(concepts, editManager, deleteCallbacks = null, finalExamQuestions = [], provider = 'none') {
        this.elements.conceptsContainer.innerHTML = '';

        concepts.forEach((concept, index) => {
            const conceptBlock = this.createConceptBlock(concept, index, provider);
            this.elements.conceptsContainer.appendChild(conceptBlock);

            // Attach edit listeners
            if (editManager) {
                editManager.attachEditListeners(conceptBlock, index);
            }
        });

        // Render final exam section after all concepts
        if (finalExamQuestions && finalExamQuestions.length > 0) {
            const finalExamBlock = this.createFinalExamBlock(finalExamQuestions);
            this.elements.conceptsContainer.appendChild(finalExamBlock);

            if (editManager) {
                editManager.attachFinalExamEditListeners(finalExamBlock);
            }
        }

        // Event delegation for all delete buttons
        if (deleteCallbacks) {
            if (this._deleteAbortController) this._deleteAbortController.abort();
            this._deleteAbortController = new AbortController();

            this.elements.conceptsContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.delete-btn');
                if (!btn) return;
                const type = btn.dataset.deleteType;
                const ci = parseInt(btn.dataset.conceptIndex);
                if (type === 'concept') deleteCallbacks.concept(ci);
                else if (type === 'knowledge-check') deleteCallbacks.knowledgeCheck(ci, parseInt(btn.dataset.checkIndex));
                else if (type === 'quiz') deleteCallbacks.quizQuestion(ci, parseInt(btn.dataset.quizIndex));
                else if (type === 'activity') deleteCallbacks.activity(ci, parseInt(btn.dataset.activityIndex));
                else if (type === 'final-exam') deleteCallbacks.finalExamQuestion(parseInt(btn.dataset.finalExamIndex));
            }, { signal: this._deleteAbortController.signal });

            // Infographic generation button delegation
            if (deleteCallbacks.generateInfographic) {
                this.elements.conceptsContainer.addEventListener('click', (e) => {
                    const btn = e.target.closest('.generate-infographic-btn');
                    if (!btn || btn.disabled) return;
                    const ci = parseInt(btn.dataset.conceptIndex);
                    deleteCallbacks.generateInfographic(ci);
                }, { signal: this._deleteAbortController.signal });
            }
        }

        // Add knowledge check toggle functionality
        this.setupKnowledgeCheckToggles();

        this.elements.resultsContainer.classList.remove('hidden');
        this.elements.submitQuizBtn.classList.remove('hidden');
    }

    setupKnowledgeCheckToggles() {
        // Use event delegation for better performance
        this.elements.conceptsContainer.addEventListener('click', (e) => {
            const checkContainer = e.target.closest('.knowledge-check-container');
            if (checkContainer && !e.target.closest('.edit-btn') && !e.target.closest('.delete-btn')) {
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

    createConceptBlock(concept, index, provider = 'none') {
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
                        <button class="delete-btn" data-delete-type="concept" data-concept-index="${index}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                            </svg>
                            Delete
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

            <div class="concept-section infographic-section">
                <div class="section-header-with-edit">
                    <h3 class="concept-section-title">
                        <span class="icon">🎨</span>
                        Infographic
                    </h3>
                </div>
                <div class="infographic-container" data-concept-index="${index}">
                    <div class="infographic-image-wrapper" ${concept.infographic ? '' : 'style="display:none;"'}>
                        <img class="infographic-image" src="${concept.infographic || ''}" alt="Concept infographic">
                    </div>
                    <div class="infographic-controls">
                        <input type="text" class="infographic-style-prompt" data-concept-index="${index}"
                            placeholder="Style prompt (e.g. watercolor, isometric 3D, hand-drawn sketch...)"
                            value="">
                        <select class="infographic-size-select" data-concept-index="${index}">
                            <option value="1:1">Square (1:1)</option>
                            <option value="16:9">Landscape (16:9)</option>
                            <option value="9:16">Portrait (9:16)</option>
                            <option value="4:3">Wide (4:3)</option>
                            <option value="3:4">Tall (3:4)</option>
                        </select>
                    </div>
                    <button class="generate-infographic-btn" data-concept-index="${index}"
                        ${provider === 'anthropic' || provider === 'none' ? 'disabled title="Image generation is not available for the current LLM provider"' : ''}>
                        ${concept.infographic ? 'Regenerate Infographic' : 'Generate Infographic'}
                    </button>
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
                        <div class="kc-item-controls">
                            <button class="delete-btn" data-delete-type="knowledge-check" data-concept-index="${index}" data-check-index="${checkIndex}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                                </svg>
                                Delete
                            </button>
                        </div>
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
                                <button class="delete-btn" data-delete-type="quiz" data-concept-index="${index}" data-quiz-index="${qIndex}">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                                    </svg>
                                    Delete
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
                                <button class="delete-btn" data-delete-type="quiz" data-concept-index="${index}" data-quiz-index="${qIndex}">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                                    </svg>
                                    Delete
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
            </div>


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
                            <button class="delete-btn" data-delete-type="activity" data-concept-index="${index}" data-activity-index="${actIndex}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                                </svg>
                                Delete
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

    createFinalExamBlock(finalExamQuestions) {
        const block = document.createElement('div');
        block.className = 'concept-block final-exam-block';
        block.innerHTML = `
            <div class="concept-header">
                <div class="concept-number" style="background: linear-gradient(135deg, #e74c3c, #c0392b);">FE</div>
                <div class="concept-title-wrapper" style="flex: 1; display: flex; align-items: center; gap: 1rem;">
                    <h2 class="concept-title">Final Exam</h2>
                </div>
            </div>
            <div class="concept-section">
                <div class="section-header-with-edit">
                    <h3 class="concept-section-title">
                        <span class="icon">📝</span>
                        Final Exam Questions
                    </h3>
                </div>
                ${finalExamQuestions.map((q, qIndex) => {
            if (q.type === 'matching') {
                return `
                        <div class="quiz-question-container matching-question" data-question-index="${q.id}" data-final-exam-index="${qIndex}">
                            <div class="edit-controls">
                                <button class="edit-btn" data-edit-type="final-exam" data-final-exam-index="${qIndex}">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                    Edit
                                </button>
                                <button class="delete-btn" data-delete-type="final-exam" data-final-exam-index="${qIndex}">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                                    </svg>
                                    Delete
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
                        <div class="quiz-question-container quiz-question" data-question-index="${q.id}" data-final-exam-index="${qIndex}">
                            <div class="edit-controls">
                                <button class="edit-btn" data-edit-type="final-exam" data-final-exam-index="${qIndex}">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                    Edit
                                </button>
                                <button class="delete-btn" data-delete-type="final-exam" data-final-exam-index="${qIndex}">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                                    </svg>
                                    Delete
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
                                            id="fe-q${q.id}-opt${optIndex}"
                                            name="question-${q.id}"
                                            value="${optIndex}"
                                        >
                                        <label for="fe-q${q.id}-opt${optIndex}" data-field="option-${optIndex}">${option}</label>
                                        <span class="correct-badge">Correct Answer</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>`;
            }
        }).join('')}
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
        const closeBtn = document.getElementById('close-modal-btn');
        const cancelBtn = document.getElementById('cancel-settings-btn');
        const saveBtn = document.getElementById('save-settings-btn');
        const providerSelect = document.getElementById('llm-provider');
        const modelSelect = document.getElementById('model-name');
        const imageModelSelect = document.getElementById('image-model-name');
        const apiKeyInput = document.getElementById('api-key');
        const apiConfig = document.getElementById('api-config');

        if (!modal || !openBtn || !closeBtn || !cancelBtn || !saveBtn || !providerSelect || !modelSelect || !apiKeyInput || !apiConfig) {
            console.error('Settings modal elements not found');
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
                { value: 'gpt-4o', label: 'GPT-4o (Most Intelligent)' },
                { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Cheap)' },
                { value: 'o1-preview', label: 'o1 Preview' },
                { value: 'o1-mini', label: 'o1 Mini' },
                { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' }
            ],
            'anthropic': [
                { value: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet' },
                { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
                { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' }
            ],
            'google': [
                { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
                { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
                { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' }
            ]
        };

        const imageModelOptions = {
            'none': [],
            'openai': [
                { value: 'gpt-image-1', label: 'GPT Image 1 (Recommended)' },
                { value: 'dall-e-3', label: 'DALL-E 3 (Legacy)' }
            ],
            'anthropic': [],
            'google': [
                { value: 'imagen-4.0-generate-001', label: 'Imagen 4 Standard (Recommended)' },
                { value: 'imagen-4.0-fast-generate-001', label: 'Imagen 4 Fast' },
                { value: 'imagen-4.0-ultra-generate-001', label: 'Imagen 4 Ultra' },
                { value: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image' },
                { value: 'gemini-3.1-flash-image-preview', label: 'Gemini 3.1 Flash Image (Latest)' },
                { value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro Image (Professional)' }
            ]
        };

        const imageModelGroup = document.getElementById('image-model-group');

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
            const config = configManager.getConfig();
            providerSelect.value = config.provider;
            apiKeyInput.value = config.apiKey;
            this.updateModelOptions(modelSelect, modelOptions, config.provider, config.model);
            if (imageModelSelect) {
                this.updateModelOptions(imageModelSelect, imageModelOptions, config.provider, config.imageModel);
                imageModelGroup.style.display = (imageModelOptions[config.provider] || []).length > 0 ? '' : 'none';
            }
            toggleApiConfig(config.provider);
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
            const selectedProvider = e.target.value;
            this.updateModelOptions(modelSelect, modelOptions, selectedProvider);
            if (imageModelSelect) {
                this.updateModelOptions(imageModelSelect, imageModelOptions, selectedProvider);
                imageModelGroup.style.display = (imageModelOptions[selectedProvider] || []).length > 0 ? '' : 'none';
            }
            toggleApiConfig(selectedProvider);
        });

        // Save settings
        saveBtn.addEventListener('click', () => {
            const config = {
                provider: providerSelect.value,
                apiKey: apiKeyInput.value,
                model: modelSelect.value,
                imageModel: imageModelSelect ? imageModelSelect.value : ''
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
