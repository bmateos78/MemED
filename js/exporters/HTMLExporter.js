// HTML Exporter
// Exports content as standalone HTML file

class HTMLExporter {
    constructor(concepts) {
        this.concepts = concepts;
    }

    export() {
        const html = this.generateHTML();
        const blob = new Blob([html], { type: 'text/html' });
        this.downloadBlob(blob, 'memed-material.html');
    }

    generateHTML() {
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
                        <div class="knowledge-check-container" onclick="this.classList.toggle('flipped')">
                            <div class="flashcard">
                                <div class="flashcard-front">
                                    <div class="flashcard-label">Question</div>
                                    <div class="flashcard-icon">❓</div>
                                    <div class="knowledge-check-question">${check.question}</div>
                                    <div class="flashcard-hint">Click to flip</div>
                                </div>
                                <div class="flashcard-back">
                                    <div class="flashcard-label">Answer</div>
                                    <div class="flashcard-icon">💡</div>
                                    <div class="knowledge-check-answer">${check.answer}</div>
                                    <div class="flashcard-hint">Click to reveal question</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="concept-section">
                    <h3>📊 Quiz Questions</h3>
                    ${concept.quizQuestions.map((q, qIndex) => {
            if (q.type === 'matching') {
                return `
                            <div class="matching-question">
                                <div class="question"><strong>Question ${qIndex + 1}:</strong> ${q.title}</div>
                                <div class="matching-display">
                                    ${q.pairs.map(pair => `
                                        <div class="matching-row">
                                            <div class="matching-col left">${pair.left}</div>
                                            <div class="matching-col icon">↔</div>
                                            <div class="matching-col right">${pair.right}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>`;
            } else {
                return `
                            <div class="quiz-question">
                                <div class="question"><strong>Question ${qIndex + 1}:</strong> ${q.question}</div>
                                <div class="options">
                                    ${q.options.map((option, optIndex) => `
                                        <div class="option ${optIndex === q.correct ? 'correct' : ''}">
                                            ${optIndex === q.correct ? '✓' : '○'} ${option}
                                        </div>
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
                            <div class="activity-title">${activity.icon} <strong>${activity.title}</strong> <span class="badge">${activity.type}</span></div>
                            <div class="activity-description">${activity.description}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MemED - Educational Material</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            padding: 2rem; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: white; margin-bottom: 2rem; text-align: center; font-size: 2.5rem; }
        .concept-block { 
            background: white; 
            border-radius: 16px; 
            padding: 2rem; 
            margin-bottom: 2rem; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .concept-header { 
            display: flex; 
            align-items: center; 
            gap: 1rem; 
            margin-bottom: 1.5rem; 
            padding-bottom: 1rem;
            border-bottom: 2px solid #e2e8f0;
        }
        .concept-number { 
            width: 50px; 
            height: 50px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-weight: bold; 
            font-size: 1.5rem;
        }
        .concept-content { 
            line-height: 1.8; 
            margin-bottom: 2rem; 
            color: #2d3748;
        }
        .concept-section { 
            margin-top: 2rem; 
            padding-top: 1.5rem;
            border-top: 1px solid #e2e8f0;
        }
        .concept-section h3 { 
            margin-bottom: 1rem; 
            color: #2d3748; 
            font-size: 1.3rem;
        }
        .knowledge-check-item, .quiz-question, .activity-item { 
            background: #f7fafc; 
            padding: 1.5rem; 
            border-radius: 12px; 
            margin-bottom: 1rem;
            border-left: 4px solid #667eea;
        }
        
        /* Flashcard CSS */
        .knowledge-check-container { perspective: 1000px; margin-bottom: 2rem; min-height: 200px; cursor: pointer; }
        .flashcard { position: relative; width: 100%; height: 100%; min-height: 200px; transition: transform 0.8s; transform-style: preserve-3d; }
        .knowledge-check-container.flipped .flashcard { transform: rotateY(180deg); }
        .flashcard-front, .flashcard-back { position: absolute; width:100%; height:100%; -webkit-backface-visibility: hidden; backface-visibility: hidden; display: flex; flex-direction: column; justify-content: center; padding: 1.5rem; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.05); background: white; }
        .flashcard-front { background: #f8fafc; z-index: 2; }
        .flashcard-back { background: #fff; transform: rotateY(180deg); border: 2px solid #667eea; z-index: 1; }
        .flashcard-icon { font-size: 1.5rem; margin-bottom: 0.5rem; text-align: center; }
        .flashcard-label { position: absolute; top: 0.75rem; right: 0.75rem; font-size: 0.6rem; font-weight: 700; text-transform: uppercase; color: #a0aec0; }
        .knowledge-check-question { font-size: 1.1rem; font-weight: 600; color: #2d3748; text-align: center; }
        .knowledge-check-answer { font-size: 1rem; color: #4a5568; text-align: center; }
        .flashcard-hint { position: absolute; bottom: 0.75rem; left: 0; right: 0; text-align: center; font-size: 0.7rem; color: #a0aec0; font-style: italic; }

        .question { font-weight: 600; margin-bottom: 0.5rem; color: #2d3748; }
        .answer { color: #4a5568; margin-top: 0.5rem; }
        .options { margin-top: 1rem; }
        .option { 
            padding: 0.75rem; 
            margin: 0.5rem 0; 
            background: white;
            border-radius: 8px;
            border: 2px solid #e2e8f0;
        }
        .option.correct { 
            background: #c6f6d5; 
            border-color: #48bb78;
            font-weight: 600;
        }

        .matching-question {
            background: #f7fafc;
            padding: 1.5rem;
            border-radius: 12px;
            margin-bottom: 1rem;
            border-left: 4px solid #667eea;
        }
        .matching-display {
            margin-top: 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        .matching-row {
            display: grid;
            grid-template-columns: 1fr 40px 1fr;
            align-items: center;
            background: white;
            padding: 0.75rem;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        .matching-col.left { font-weight: 600; color: #667eea; }
        .matching-col.icon { text-align: center; color: #a0aec0; }
        .matching-col.right { color: #4a5568; }
        .activity-title { 
            font-weight: 600; 
            margin-bottom: 0.75rem; 
            color: #2d3748;
        }
        .badge { 
            background: #667eea; 
            color: white; 
            padding: 0.25rem 0.75rem; 
            border-radius: 12px; 
            font-size: 0.85rem;
            margin-left: 0.5rem;
        }
        .activity-description { color: #4a5568; line-height: 1.6; }
        .activity-description ul, .activity-description ol { margin: 0.5rem 0 0.5rem 1.5rem; }
        .activity-description li { margin-bottom: 0.25rem; }
        .activity-description strong { color: #2d3748; }
        @media print {
            body { background: white; }
            .concept-block { box-shadow: none; border: 1px solid #e2e8f0; page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📚 MemED</h1>
        ${conceptsHTML}
    </div>
</body>
</html>`;
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

export default HTMLExporter;
