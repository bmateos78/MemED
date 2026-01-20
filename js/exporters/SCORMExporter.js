import { SCORM_API_CONTENT } from '../utils/SCORMAssets.js';

class SCORMExporter {
    constructor(concepts, allQuizData, finalExamQuestions = []) {
        this.concepts = concepts;
        this.allQuizData = allQuizData;
        this.finalExamQuestions = finalExamQuestions;
    }

    async export() {
        const zip = new JSZip();

        // Add SCORM files
        zip.file('imsmanifest.xml', this.generateManifest());
        zip.file('scorm-api.js', SCORM_API_CONTENT);

        // Add concept pages
        this.concepts.forEach((concept, index) => {
            zip.file(`concept-${index}.html`, this.generateConceptHTML(concept, index));
        });

        // Add final quiz page
        zip.file('quiz.html', this.generateQuizHTML());

        // Generate and download
        const blob = await zip.generateAsync({ type: 'blob' });
        this.downloadBlob(blob, 'memed-scorm.zip');
    }

    generateManifest() {
        const conceptItems = this.concepts.map((concept, index) => `
      <item identifier="ITEM-${index}" identifierref="RES-${index}">
        <title>${concept.title}</title>
      </item>`).join('');

        const quizItem = `
      <item identifier="ITEM-QUIZ" identifierref="RES-QUIZ">
        <title>Final Assessment</title>
      </item>`;

        const conceptResources = this.concepts.map((concept, index) => `
    <resource identifier="RES-${index}" type="webcontent" adlcp:scormtype="sco" href="concept-${index}.html">
      <file href="concept-${index}.html"/>
      <file href="scorm-api.js"/>
    </resource>`).join('');

        const quizResource = `
    <resource identifier="RES-QUIZ" type="webcontent" adlcp:scormtype="sco" href="quiz.html">
      <file href="quiz.html"/>
      <file href="scorm-api.js"/>
    </resource>`;

        return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="com.memed.course" version="1.0"
          xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                              http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd
                              http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="ORG-1">
    <organization identifier="ORG-1">
      <title>Content</title>
      ${conceptItems}
      ${quizItem}
    </organization>
  </organizations>
  <resources>
    ${conceptResources}
    ${quizResource}
  </resources>
</manifest>`;
    }

    generateConceptHTML(concept, index) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${concept.title}</title>
    <script src="scorm-api.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 2rem; background: #f5f7fa; line-height: 1.6; color: #2d3748; }
        .container { max-width: 1024px; width: 100%; margin: 0 auto; background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        @media (max-width: 768px) { body { padding: 1rem; } .container { padding: 1rem; } }
        .header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; border-bottom: 2px solid #edf2f7; padding-bottom: 1rem; }
        .number { width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
        .content { margin-bottom: 2rem; white-space: pre-wrap; }
        .section { margin-top: 2rem; }
        .section h3 { margin-bottom: 1rem; color: #4a5568; border-left: 4px solid #667eea; padding-left: 0.75rem; }
        
        /* Flashcard CSS */
        .knowledge-check-container { perspective: 1000px; margin-bottom: 1.5rem; min-height: 150px; cursor: pointer; }
        .flashcard { position: relative; width: 100%; height: 100%; min-height: 150px; transition: transform 0.6s; transform-style: preserve-3d; }
        .knowledge-check-container.flipped .flashcard { transform: rotateY(180deg); }
        .flashcard-front, .flashcard-back { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; display: flex; flex-direction: column; justify-content: center; padding: 1.5rem; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05); background: white; }
        .flashcard-front { background: #f8fafc; z-index: 2; }
        .flashcard-back { background: white; transform: rotateY(180deg); border: 2px solid #667eea; z-index: 1; }
        .flashcard-icon { font-size: 1.2rem; margin-bottom: 0.5rem; text-align: center; }
        .flashcard-label { position: absolute; top: 0.5rem; right: 0.75rem; font-size: 0.6rem; font-weight: 700; text-transform: uppercase; color: #a0aec0; }
        .question-text { font-size: 1rem; font-weight: 600; text-align: center; }
        .answer-text { font-size: 0.95rem; text-align: center; color: #4a5568; }

        .activity-item { background: #f7fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
        .activity-title { font-weight: bold; color: #2d3748; margin-bottom: 0.5rem; }
        .activity-description { font-size: 0.9rem; color: #4a5568; }

        /* Quiz CSS */
        .quiz-question { background: #f8fafc; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid #667eea; }
        .question-title { font-weight: 600; margin-bottom: 0.75rem; }
        .options { display: flex; flex-direction: column; gap: 0.5rem; }
        .option { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem; background: white; border: 1px solid #e2e8f0; border-radius: 4px; }
        .matching-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
        .matching-left { flex: 1; min-width: 200px; background: #edf2f7; padding: 0.5rem; border-radius: 4px; font-size: 0.9rem; }
        .matching-select { flex: 1; min-width: 200px; max-width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid #e2e8f0; font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .matching-select option { white-space: normal; word-wrap: break-word; }
        @media (max-width: 768px) { .matching-row { flex-direction: column; gap: 0.5rem; } .matching-left, .matching-select { width: 100%; min-width: 100%; } }
        .submit-topic-quiz { margin-top: 1rem; background: #667eea; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; }
        .feedback { margin-top: 1rem; padding: 1rem; border-radius: 6px; display: none; }
        .feedback.correct { background: #c6f6d5; color: #22543d; }
        .feedback.incorrect { background: #fed7d7; color: #822727; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="number">${index + 1}</div>
            <h2>${concept.title}</h2>
        </div>
        
        <div class="content">${concept.text}</div>

        <div class="section">
            <h3>🎯 Knowledge Checks</h3>
            ${concept.knowledgeChecks.map(check => `
                <div class="knowledge-check-container" onclick="this.classList.toggle('flipped')">
                    <div class="flashcard">
                        <div class="flashcard-front">
                            <span class="flashcard-label">Question</span>
                            <div class="flashcard-icon">❓</div>
                            <div class="question-text">${check.question}</div>
                        </div>
                        <div class="flashcard-back">
                            <span class="flashcard-label">Answer</span>
                            <div class="flashcard-icon">💡</div>
                            <div class="answer-text">${check.answer}</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h3>📊 Topic Practice</h3>
            <div id="topic-quiz">
            ${concept.quizQuestions.map((q, qIdx) => {
            if (q.type === 'matching') {
                return `
                        <div class="quiz-question" data-id="${q.id}">
                            <div class="question-title">${q.title}</div>
                            ${q.pairs.map((pair, pIdx) => `
                                <div class="matching-row">
                                    <div class="matching-left">${pair.left}</div>
                                    <select class="matching-select" data-pair-index="${pIdx}">
                                        <option value="">Select match...</option>
                                        ${q.shuffledRight.map((text, i) => `<option value="${i}">${text}</option>`).join('')}
                                    </select>
                                </div>
                            `).join('')}
                        </div>`;
            } else {
                return `
                        <div class="quiz-question" data-id="${q.id}">
                            <div class="question-title">${q.question}</div>
                            <div class="options">
                                ${q.options.map((option, i) => `
                                    <label class="option">
                                        <input type="${q.isMultipleAnswer ? 'checkbox' : 'radio'}" name="q-${q.id}" value="${i}">
                                        <span>${option}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>`;
            }
        }).join('')}
            <button class="submit-topic-quiz" onclick="checkTopicQuiz()">Check Answers</button>
            <div id="topic-feedback" class="feedback"></div>
            </div>
        </div>

        
        <div class="section">
            <h3>🚀 Learning Activities</h3>
            ${concept.activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-title">${activity.icon} ${activity.title} (${activity.type})</div>
                    <div class="activity-description">${activity.description}</div>
                </div>
            `).join('')}
        </div>
    </div>

    <script>
        const conceptQuizData = ${JSON.stringify(concept.quizQuestions)};

        function checkTopicQuiz() {
            let correctCount = 0;
            conceptQuizData.forEach(q => {
                if (q.type === 'matching') {
                    let pairsCorrect = 0;
                    q.pairs.forEach((pair, pIndex) => {
                        const select = document.querySelector(\`.quiz-question[data-id="\${q.id}"] .matching-select[data-pair-index="\${pIndex}"]\`);
                        const val = select ? select.value : "";
                        if (val !== "" && q.shuffledRight[parseInt(val)] === pair.right) pairsCorrect++;
                    });
                    if (pairsCorrect === q.pairs.length) correctCount++;
                } else {
                    const inputs = document.querySelectorAll(\`input[name="q-\${q.id}"]:checked\`);
                    if (q.isMultipleAnswer) {
                         const values = Array.from(inputs).map(i => parseInt(i.value));
                         // Note: This logic assumes LLM provides correct as array for multiple answer
                         // If it's a single value from previous sessions, we handle it
                         const correctArr = Array.isArray(q.correct) ? q.correct : [q.correct];
                         if (JSON.stringify(values.sort()) === JSON.stringify(correctArr.sort())) correctCount++;
                    } else {
                         if (inputs.length > 0 && parseInt(inputs[0].value) === q.correct) correctCount++;
                    }
                }
            });

            const feedback = document.getElementById('topic-feedback');
            feedback.style.display = 'block';
            if (correctCount === conceptQuizData.length) {
                feedback.className = 'feedback correct';
                feedback.innerText = 'Excellent! You got all questions right.';
            } else {
                feedback.className = 'feedback incorrect';
                feedback.innerText = \`You got \${correctCount} of \${conceptQuizData.length} correct. Review the text and try again!\`;
            }
        }

        window.addEventListener('load', () => {
            // Force links to open in new tab
            document.querySelectorAll('a').forEach(link => {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            });

            if (window.scormAPI) {
                window.scormAPI.setValue('cmi.core.lesson_status', 'completed');
                window.scormAPI.commit();
            }
        });
    </script>
</body>
</html>`;
    }

    generateQuizHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Final Assessment</title>
    <script src="scorm-api.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 2rem; background: #f5f7fa; color: #2d3748; }
        .container { max-width: 1024px; width: 100%; margin: 0 auto; background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        @media (max-width: 768px) { body { padding: 1rem; } .container { padding: 1rem; } }
        h1 { margin-bottom: 2rem; text-align: center; color: #2d3748; }
        .quiz-question { background: #f8fafc; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid #667eea; }
        .question-title { font-weight: 600; margin-bottom: 1rem; }
        .options { display: flex; flex-direction: column; gap: 0.5rem; }
        .option { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: white; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
        .option:hover { background: #f1f5f9; border-color: #667eea; }
        .matching-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
        .matching-left { flex: 1; min-width: 250px; background: #edf2f7; padding: 0.75rem; border-radius: 6px; font-size: 0.9rem; border: 1px solid #e2e8f0; }
        .matching-select { flex: 1; min-width: 250px; max-width: 100%; padding: 0.75rem; border-radius: 6px; border: 1px solid #e2e8f0; background: white; font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .matching-select option { white-space: normal; word-wrap: break-word; }
        @media (max-width: 768px) { .matching-row { flex-direction: column; gap: 0.5rem; } .matching-left, .matching-select { width: 100%; min-width: 100%; } }
        #submit-btn { width: 100%; background: #667eea; color: white; border: none; padding: 1.25rem; border-radius: 8px; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: background 0.2s; margin-top: 2rem; box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4); }
        #submit-btn:hover { background: #5a67d8; transform: translateY(-1px); }
        .results { display: none; margin-top: 2rem; text-align: center; animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .score-box { font-size: 4rem; font-weight: 800; color: #667eea; margin: 1rem 0; }
        .score-subtext { font-size: 1.1rem; color: #4a5568; margin-bottom: 2rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Final Assessment</h1>
        <p style="text-align: center; margin-bottom: 2rem; color: #4a5568;">Please answer all 10 questions to complete the course.</p>
        <div id="quiz-container">
            ${this.finalExamQuestions.map((q, qIdx) => {
            if (q.type === 'matching') {
                return `
                        <div class="quiz-question" data-id="${q.id}">
                            <div class="question-title">Question ${qIdx + 1} (Matching): ${q.title}</div>
                            <div class="matching-container">
                                ${q.pairs.map((pair, pIndex) => `
                                    <div class="matching-row">
                                        <div class="matching-left">${pair.left}</div>
                                        <select class="matching-select" data-pair-index="${pIndex}">
                                            <option value="">Select match...</option>
                                            ${q.shuffledRight.map((text, i) => `<option value="${i}">${text}</option>`).join('')}
                                        </select>
                                    </div>
                                `).join('')}
                            </div>
                        </div>`;
            } else {
                return `
                        <div class="quiz-question" data-id="${q.id}">
                            <div class="question-title">Question ${qIdx + 1}: ${q.question}</div>
                            <div class="options">
                                ${q.options.map((option, i) => `
                                    <label class="option">
                                        <input type="${q.isMultipleAnswer ? 'checkbox' : 'radio'}" name="q-${q.id}" value="${i}">
                                        <span>${option}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>`;
            }
        }).join('')}
            <button id="submit-btn" onclick="submitFinalQuiz()">Complete Final Assessment</button>
        </div>
        <div id="results" class="results">
            <h3>Assessment Complete</h3>
            <div id="score-display" class="score-box">0%</div>
            <p id="score-text" class="score-subtext"></p>
            <p>Your results have been reported to the system.</p>
        </div>
    </div>

    <script>
        const finalExamData = ${JSON.stringify(this.finalExamQuestions)};
        
        function submitFinalQuiz() {
            let score = 0;
            
            finalExamData.forEach(q => {
                if (q.type === 'matching') {
                    let correctCount = 0;
                    q.pairs.forEach((pair, pIndex) => {
                        const select = document.querySelector(\`.quiz-question[data-id="\${q.id}"] .matching-select[data-pair-index="\${pIndex}"]\`);
                        const val = select ? select.value : "";
                        if (val !== "" && q.shuffledRight[parseInt(val)] === pair.right) {
                            correctCount++;
                        }
                    });
                    if (correctCount === q.pairs.length) score++;
                } else {
                    const inputs = document.querySelectorAll(\`input[name="q-\${q.id}"]:checked\`);
                    const selected = Array.from(inputs).map(i => parseInt(i.value));
                    
                    if (q.isMultipleAnswer) {
                        const correctArr = Array.isArray(q.correct) ? q.correct : [q.correct];
                        if (JSON.stringify(selected.sort()) === JSON.stringify(correctArr.sort())) score++;
                    } else {
                        if (selected.length > 0 && selected[0] === q.correct) score++;
                    }
                }
            });
            
            const total = finalExamData.length;
            const percentage = Math.round((score / total) * 100);
            
            document.getElementById('quiz-container').style.display = 'none';
            document.getElementById('results').style.display = 'block';
            document.getElementById('score-display').innerText = percentage + '%';
            document.getElementById('score-text').innerText = \`Total Score: \${score} out of \${total} questions (\${percentage}%)\`;
            
            if (window.scormAPI) {
                window.scormAPI.setScore(score, 0, total);
                window.scormAPI.setValue('cmi.core.lesson_status', percentage >= 70 ? 'passed' : 'failed');
                window.scormAPI.commit();
            }
        }

        window.addEventListener('load', () => {
            document.querySelectorAll('a').forEach(link => {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            });
        });
    </script>
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

export default SCORMExporter;
