// PDF Exporter
// Exports content as PDF using browser print

class PDFExporter {
    constructor(concepts) {
        this.concepts = concepts;
    }

    export() {
        // Create a print-friendly version
        const printWindow = window.open('', '_blank');
        printWindow.document.write(this.generatePrintHTML());
        printWindow.document.close();

        // Wait for content to load, then print
        printWindow.onload = () => {
            printWindow.print();
        };
    }

    generatePrintHTML() {
        const conceptsHTML = this.concepts.map((concept, index) => `
            <div class="concept-block">
                <div class="concept-header">
                    <div class="concept-number">${index + 1}</div>
                    <h2>${concept.title}</h2>
                </div>
                <div class="concept-content">${concept.text}</div>
                
                <div class="concept-section">
                    <h3>🎯 Knowledge Checks</h3>
                    ${concept.knowledgeChecks.map(check => `
                        <div class="knowledge-check-item">
                            <div><strong>Q:</strong> ${check.question}</div>
                            <div><strong>A:</strong> ${check.answer}</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="concept-section">
                    <h3>📊 Quiz Questions</h3>
                    ${concept.quizQuestions.map((q, qIndex) => {
            if (q.type === 'matching') {
                return `
                            <div class="matching-question">
                                <div><strong>Question ${qIndex + 1}:</strong> ${q.title}</div>
                                <div class="matching-list">
                                    ${q.pairs.map(pair => `
                                        <div class="matching-row">
                                            <span class="left">${pair.left}</span>
                                            <span class="icon"> ── </span>
                                            <span class="right">${pair.right}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>`;
            } else {
                return `
                            <div class="quiz-question">
                                <div><strong>Question ${qIndex + 1}:</strong> ${q.question}</div>
                                <div class="options">
                                    ${q.options.map((option, optIndex) => `
                                        <div>${optIndex === q.correct ? '✓' : '○'} ${option}</div>
                                    `).join('')}
                                </div>
                            </div>`;
            }
        }).join('')}
                </div>
                
                <div class="concept-section">
                    <h3>🚀 Learning Activities</h3>
                    ${concept.activities.map(activity => `
                        <div class="activity-item">
                            <div><strong>${activity.icon} ${activity.title}</strong> (${activity.type})</div>
                            <div>${activity.description}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>MemED - PDF Export</title>
    <style>
        @page { margin: 2cm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Georgia', serif; 
            font-size: 12pt; 
            line-height: 1.6;
            color: #000;
        }
        h1 { 
            text-align: center; 
            margin-bottom: 2cm; 
            font-size: 24pt;
            page-break-after: avoid;
        }
        .concept-block { 
            page-break-inside: avoid; 
            margin-bottom: 1.5cm;
            border-bottom: 2pt solid #ccc;
            padding-bottom: 1cm;
        }
        .concept-header { 
            display: flex; 
            align-items: center; 
            gap: 0.5cm; 
            margin-bottom: 0.5cm;
            page-break-after: avoid;
        }
        .concept-number { 
            width: 1.5cm; 
            height: 1.5cm; 
            border: 2pt solid #000; 
            border-radius: 50%; 
            display: inline-flex; 
            align-items: center; 
            justify-content: center; 
            font-weight: bold;
        }
        h2 { font-size: 18pt; page-break-after: avoid; }
        h3 { 
            font-size: 14pt; 
            margin-top: 0.75cm; 
            margin-bottom: 0.5cm;
            page-break-after: avoid;
        }
        .concept-content { 
            margin-bottom: 0.75cm; 
            text-align: justify;
        }
        .concept-section { 
            margin-top: 0.75cm;
            page-break-inside: avoid;
        }
        .knowledge-check-item, .quiz-question, .activity-item { 
            margin-bottom: 0.5cm; 
            padding: 0.3cm;
            border-left: 3pt solid #666;
            padding-left: 0.5cm;
        }
        .options { margin-top: 0.25cm; margin-left: 0.5cm; }
        .options div { margin: 0.15cm 0; }
        .matching-question { margin-bottom: 0.5cm; padding: 0.3cm; border-left: 3pt solid #666; padding-left: 0.5cm; }
        .matching-list { margin-top: 0.25cm; margin-left: 0.5cm; }
        .matching-row { margin: 0.15cm 0; }
        .matching-row .left { font-weight: bold; }
        .matching-row .right { font-style: italic; color: #444; }
    </style>
</head>
<body>
    <h1>📚 MemED</h1>
    ${conceptsHTML}
</body>
</html>`;
    }
}

export default PDFExporter;
