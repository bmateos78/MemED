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
import UIManager from './js/ui/UIManager.js';
import EditManager from './js/ui/EditManager.js';
import SCORMExporter from './js/exporters/SCORMExporter.js';
import HTMLExporter from './js/exporters/HTMLExporter.js';
import PDFExporter from './js/exporters/PDFExporter.js';

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
            this.uiManager.displayConcepts(this.concepts, this.editManager, llmProvider);

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
    // Utility Functions
    // ===========================

    clearInput() {
        if (confirm('Are you sure you want to clear all input and generated content?')) {
            this.uiManager.clearInput();
            this.concepts = [];
            this.allQuizData = [];
            document.querySelector('.quiz-results')?.remove();
        }
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
