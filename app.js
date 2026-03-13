// ===========================
// MemED Generator
// Main Application Entry Point
// ===========================

import ConfigManager from './js/utils/ConfigManager.js';
import PDFHandler from './js/utils/PDFHandler.js';
import LLMProviderFactory from './js/llm/LLMProviderFactory.js';
import ConceptExtractor from './js/generators/ConceptExtractor.js';
import KnowledgeCheckGenerator from './js/generators/KnowledgeCheckGenerator.js';
import QuizGenerator from './js/generators/QuizGenerator.js';
import ActivityGenerator from './js/generators/ActivityGenerator.js';
import UIManager from './js/ui/UIManager.js?v=3';
import EditManager from './js/ui/EditManager.js';
import SCORMExporter from './js/exporters/SCORMExporter.js';
import HTMLExporter from './js/exporters/HTMLExporter.js';
import PDFExporter from './js/exporters/PDFExporter.js';
import SCORMImporter from './js/utils/SCORMImporter.js';
import InfographicGenerator from './js/generators/InfographicGenerator.js';

class MemED {
    constructor() {
        // Initialize managers
        this.configManager = new ConfigManager();
        this.uiManager = new UIManager();
        this.editManager = new EditManager([]);

        // Data storage
        this.concepts = [];
        this.allQuizData = [];
        this.finalExamQuestions = [];

        // Initialize app
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.uiManager.initializeSettingsModal(this.configManager);
        console.log('MemED initialized');
    }

    // ===========================
    // Event Listeners
    // ===========================

    setupEventListeners() {
        // Main buttons
        document.getElementById('generate-btn').addEventListener('click', () => this.generateMaterial());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearInput());
        document.getElementById('submit-quiz-btn').addEventListener('click', () => this.submitQuiz());

        // Export buttons
        document.getElementById('export-pdf-btn').addEventListener('click', () => this.exportAsPDF());
        document.getElementById('export-html-btn').addEventListener('click', () => this.exportAsHTML());
        document.getElementById('export-scorm-btn').addEventListener('click', () => this.exportAsSCORM());

        // Import SCORM
        const scormImport = document.getElementById('scorm-import');
        document.getElementById('import-scorm-btn').addEventListener('click', () => {
            console.log('Import button clicked, triggering file dialog...');
            scormImport.click();
        });
        scormImport.addEventListener('change', (e) => {
            this.handleSCORMImport(e.target.files[0]).catch(err => {
                console.error('SCORM import failed:', err);
                alert(`Error importing SCORM: ${err.message}`);
                this.uiManager.hideLoading();
            });
        });

        // PDF upload
        const pdfUpload = document.getElementById('pdf-upload');
        pdfUpload.addEventListener('change', (e) => this.handlePDFUpload(e.target.files[0]));

        // Drag and drop
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const fileUploadArea = document.getElementById('file-upload-area');
        const fileUploadLabel = fileUploadArea.querySelector('.file-upload-label');

        fileUploadLabel.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUploadLabel.classList.add('drag-over');
        });

        fileUploadLabel.addEventListener('dragleave', () => {
            fileUploadLabel.classList.remove('drag-over');
        });

        fileUploadLabel.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUploadLabel.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type === 'application/pdf') {
                this.handlePDFUpload(file);
            } else {
                alert('Please upload a PDF file');
            }
        });
    }

    // ===========================
    // PDF Upload
    // ===========================

    async handlePDFUpload(file) {
        if (!file) return;

        try {
            const result = await PDFHandler.extractText(file);
            this.uiManager.displayPDFResult(result);
        } catch (error) {
            console.error('PDF upload error:', error);
            this.uiManager.showPDFError(error.message);
        }
    }

    // ===========================
    // Content Generation
    // ===========================

    async generateMaterial() {
        const inputText = this.uiManager.getInputText();

        if (!inputText) {
            alert('Please enter some text or upload a PDF to generate educational material.');
            return;
        }

        console.log('=== Starting Content Generation ===');
        console.log('Input text length:', inputText.length);

        this.uiManager.showLoading();

        try {
            // 1. Extract concepts
            const config = this.configManager.getConfig();
            console.log('LLM Config:', config);

            const llmProvider = LLMProviderFactory.create(config);
            console.log('LLM Provider created:', llmProvider ? llmProvider.constructor.name : 'null');

            const conceptExtractor = new ConceptExtractor(llmProvider);
            console.log('Extracting concepts...');

            this.concepts = await conceptExtractor.extract(inputText);
            console.log('Concepts extracted:', this.concepts.length);

            // 2. Generate content for each concept
            for (let i = 0; i < this.concepts.length; i++) {
                console.log(`Generating content for concept ${i + 1}/${this.concepts.length}: ${this.concepts[i].title}`);
                await this.generateConceptContent(this.concepts[i], i, llmProvider);
            }

            // 3. Generate Final Exam (10 unique questions)
            const quizGenerator = new QuizGenerator(llmProvider);
            this.finalExamQuestions = await quizGenerator.generateFinalExam(this.concepts);
            console.log('Final exam questions generated:', this.finalExamQuestions.length);

            // 4. Collect all quiz data
            this.collectQuizData();
            console.log('Total quiz questions:', this.allQuizData.length);

            // 5. Display results
            this.editManager.setConcepts(this.concepts);
            this.editManager.setFinalExamQuestions(this.finalExamQuestions);
            this.uiManager.displayConcepts(this.concepts, this.editManager, this._deleteCallbacks(), this.finalExamQuestions, config.provider);

            console.log('=== Content Generation Complete ===');

        } catch (error) {
            console.error('Generation error:', error);
            alert(`Error generating content: ${error.message}`);
        } finally {
            this.uiManager.hideLoading();
        }
    }

    async generateConceptContent(concept, index, llmProvider) {
        // Generate knowledge checks
        const kcGenerator = new KnowledgeCheckGenerator(llmProvider);
        concept.knowledgeChecks = await kcGenerator.generate(concept);

        // Generate quiz questions
        const quizGenerator = new QuizGenerator(llmProvider);
        concept.quizQuestions = await quizGenerator.generate(concept, index);

        // Generate activities
        const activityGenerator = new ActivityGenerator(llmProvider);
        concept.activities = await activityGenerator.generate(concept);
    }

    collectQuizData() {
        this.allQuizData = [];
        this.concepts.forEach(concept => {
            concept.quizQuestions.forEach(q => {
                this.allQuizData.push({
                    ...q,
                    conceptTitle: concept.title
                });
            });
        });
    }

    // ===========================
    // Quiz Submission
    // ===========================

    submitQuiz() {
        this.collectQuizData(); // Sync any edits
        let score = 0;
        const incorrectQuestions = [];

        this.allQuizData.forEach(q => {
            if (q.type === 'matching') {
                let allCorrect = true;
                const userMappings = [];
                const correctMappings = q.pairs.map(p => `${p.left} → ${p.right}`).join('<br>');

                q.pairs.forEach((pair, pIndex) => {
                    const select = document.querySelector(`select[name="matching-${q.id}-${pIndex}"]`);
                    const selectedValue = select ? select.value : "";
                    const selectedText = selectedValue !== "" ? q.shuffledRight[parseInt(selectedValue)] : "Not selected";

                    userMappings.push(`${pair.left} → ${selectedText}`);
                    if (selectedText !== pair.right) {
                        allCorrect = false;
                    }
                });

                if (allCorrect) {
                    score++;
                } else {
                    incorrectQuestions.push({
                        question: q.title,
                        userAnswer: userMappings.join('<br>'),
                        correctAnswer: correctMappings
                    });
                }
            } else {
                const selected = document.querySelector(`input[name="question-${q.id}"]:checked`);

                if (selected && parseInt(selected.value) === q.correct) {
                    score++;
                } else {
                    incorrectQuestions.push({
                        question: q.question,
                        userAnswer: selected ? q.options[parseInt(selected.value)] : 'Not answered',
                        correctAnswer: q.options[q.correct]
                    });
                }
            }
        });

        this.uiManager.displayQuizResults(score, this.allQuizData.length, incorrectQuestions);
    }

    // ===========================
    // Export Functions
    // ===========================

    exportAsPDF() {
        if (this.concepts.length === 0) {
            alert('Please generate content first before exporting.');
            return;
        }

        const exporter = new PDFExporter(this.concepts);
        exporter.export();
    }

    exportAsHTML() {
        if (this.concepts.length === 0) {
            alert('Please generate content first before exporting.');
            return;
        }

        this.collectQuizData(); // Sync any edits
        const exporter = new HTMLExporter(this.concepts);
        exporter.export();
    }

    async exportAsSCORM() {
        if (this.concepts.length === 0) {
            alert('Please generate content first before exporting.');
            return;
        }

        try {
            this.collectQuizData(); // Sync any edits
            const exporter = new SCORMExporter(this.concepts, this.allQuizData, this.finalExamQuestions);
            await exporter.export();
        } catch (error) {
            console.error('SCORM export error:', error);
            alert(`Error exporting SCORM: ${error.message}`);
        }
    }

    // ===========================
    // Content Import
    // ===========================

    async handleSCORMImport(file) {
        if (!file) return;

        this.uiManager.showLoading();
        // Update loading message
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) loadingText.textContent = 'Importing SCORM package...';

        try {
            const data = await SCORMImporter.import(file);

            this.concepts = data.concepts;
            this.finalExamQuestions = data.finalExamQuestions;

            this.collectQuizData();
            this.editManager.setConcepts(this.concepts);
            this.editManager.setFinalExamQuestions(this.finalExamQuestions);
            this.editManager.destroyAllEditors();

            this.uiManager.displayConcepts(this.concepts, this.editManager, this._deleteCallbacks(), this.finalExamQuestions, this.configManager.getConfig().provider);

            // Re-set default loading text
            if (loadingText) loadingText.textContent = 'Analyzing text and extracting concepts with AI...';

            console.log('=== SCORM Import Success ===');
            alert('SCORM package loaded successfully. You can now edit and re-export.');

        } catch (error) {
            console.error('Import error:', error);
            alert(`Error importing SCORM: ${error.message}`);
        } finally {
            this.uiManager.hideLoading();
            // Reset file input
            document.getElementById('scorm-import').value = '';
        }
    }

    // ===========================
    // Utility Functions
    // ===========================

    clearInput() {
        if (confirm('Are you sure you want to clear all input and generated content?')) {
            this.uiManager.clearInput();
            this.concepts = [];
            this.allQuizData = [];
            this.editManager.destroyAllEditors();
            document.querySelector('.quiz-results')?.remove();
        }
    }

    // ===========================
    // Concept Management
    // ===========================

    deleteConcept(index) {
        if (!confirm(`Are you sure you want to delete "${this.concepts[index].title}"?`)) {
            return;
        }

        console.log(`Deleting concept at index ${index}: ${this.concepts[index].title}`);
        this.concepts.splice(index, 1);
        this._refreshDisplay();
    }

    deleteKnowledgeCheck(conceptIndex, checkIndex) {
        const concept = this.concepts[conceptIndex];
        const check = concept.knowledgeChecks[checkIndex];
        const label = check.question.replace(/<[^>]*>/g, '').substring(0, 50);
        if (!confirm(`Delete knowledge check: "${label}"?`)) return;

        concept.knowledgeChecks.splice(checkIndex, 1);
        this._refreshDisplay();
    }

    deleteQuizQuestion(conceptIndex, quizIndex) {
        const concept = this.concepts[conceptIndex];
        const q = concept.quizQuestions[quizIndex];
        const label = (q.type === 'matching' ? q.title : q.question).replace(/<[^>]*>/g, '').substring(0, 50);
        if (!confirm(`Delete quiz question: "${label}"?`)) return;

        concept.quizQuestions.splice(quizIndex, 1);
        this._refreshDisplay();
    }

    deleteActivity(conceptIndex, activityIndex) {
        const concept = this.concepts[conceptIndex];
        const activity = concept.activities[activityIndex];
        const label = activity.title.replace(/<[^>]*>/g, '').substring(0, 50);
        if (!confirm(`Delete activity: "${label}"?`)) return;

        concept.activities.splice(activityIndex, 1);
        this._refreshDisplay();
    }

    _refreshDisplay() {
        this.editManager.setConcepts(this.concepts);
        this.editManager.setFinalExamQuestions(this.finalExamQuestions);
        this.editManager.destroyAllEditors();
        this.collectQuizData();
        this.uiManager.displayConcepts(this.concepts, this.editManager, this._deleteCallbacks(), this.finalExamQuestions, this.configManager.getConfig().provider);
    }

    deleteFinalExamQuestion(questionIndex) {
        const q = this.finalExamQuestions[questionIndex];
        const label = (q.type === 'matching' ? q.title : q.question).replace(/<[^>]*>/g, '').substring(0, 50);
        if (!confirm(`Delete final exam question: "${label}"?`)) return;

        this.finalExamQuestions.splice(questionIndex, 1);
        this._refreshDisplay();
    }

    async generateInfographic(conceptIndex) {
        const config = this.configManager.getConfig();
        if (config.provider !== 'openai' && config.provider !== 'google') {
            alert('Image generation is only available with OpenAI or Google providers.');
            return;
        }

        const container = document.querySelector(`.infographic-container[data-concept-index="${conceptIndex}"]`);
        const btn = container.querySelector('.generate-infographic-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Generating...';
        btn.disabled = true;

        try {
            const styleInput = container.querySelector('.infographic-style-prompt');
            const stylePrompt = styleInput && styleInput.value.trim() ? styleInput.value.trim() : null;
            const sizeSelect = container.querySelector('.infographic-size-select');
            const aspectRatio = sizeSelect ? sizeSelect.value : '1:1';
            const generator = new InfographicGenerator();
            const dataUri = await generator.generate(this.concepts[conceptIndex], config, stylePrompt, aspectRatio);
            this.concepts[conceptIndex].infographic = dataUri;

            const wrapper = container.querySelector('.infographic-image-wrapper');
            const img = container.querySelector('.infographic-image');
            img.src = dataUri;
            wrapper.style.display = '';
            btn.textContent = 'Regenerate Infographic';
        } catch (error) {
            console.error('Infographic generation error:', error);
            alert(`Error generating infographic: ${error.message}`);
            btn.textContent = originalText;
        } finally {
            btn.disabled = false;
        }
    }

    _deleteCallbacks() {
        return {
            concept: (idx) => this.deleteConcept(idx),
            knowledgeCheck: (ci, ki) => this.deleteKnowledgeCheck(ci, ki),
            quizQuestion: (ci, qi) => this.deleteQuizQuestion(ci, qi),
            activity: (ci, ai) => this.deleteActivity(ci, ai),
            finalExamQuestion: (qi) => this.deleteFinalExamQuestion(qi),
            generateInfographic: (ci) => this.generateInfographic(ci)
        };
    }
}

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.memedApp = new MemED();
    });
} else {
    window.memedApp = new MemED();
}
