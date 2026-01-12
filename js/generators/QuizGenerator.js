// Quiz Generator
// Generates multiple-choice quiz questions

class QuizGenerator {
    constructor(llmProvider = null) {
        this.llmProvider = llmProvider;
        this.questionIdCounter = 0;
    }

    async generate(concept, conceptIndex) {
        if (this.llmProvider) {
            try {
                return await this.generateWithLLM(concept, conceptIndex);
            } catch (error) {
                console.error('LLM quiz generation failed:', error);
                return this.generateLocally(concept, conceptIndex);
            }
        }

        return this.generateLocally(concept, conceptIndex);
    }

    async generateWithLLM(concept, conceptIndex) {
        const conceptType = concept.type || 'Fact';
        const prompt = `Based on the following detailed explanation of "${concept.title}" (Type: ${conceptType}), generate educational assessment content.
        
TEXT:
${concept.text}

INSTRUCTIONS:
1. Generate TWO multiple-choice quiz questions with 4 options each.
2. Generate ONE "Concept Matching" question with 4 pairs of linked items (e.g., term and its definition).

Respond with this exact JSON format:
{
  "quizQuestions": [
    {
      "type": "multiple-choice",
      "question": "Question text?",
      "options": ["Correct answer", "Distractor 1", "Distractor 2", "Distractor 3"],
      "correct": 0,
      "isMultipleAnswer": false
    },
    ...
  ],
  "matchingQuestions": [
    {
      "type": "matching",
      "title": "Match each term with its correct description",
      "pairs": [
        {"left": "Term 1", "right": "Definition 1"},
        {"left": "Term 2", "right": "Definition 2"},
        {"left": "Term 3", "right": "Definition 3"},
        {"left": "Term 4", "right": "Definition 4"}
      ]
    }
  ]
}

IMPORTANT:
- All content MUST be directly based on the text provided.
- Use the same language as the provided text.
- For matching questions, ensure 'left' and 'right' items strictly correspond to each other.
- Distractors in multiple-choice must be plausible.`;

        const response = await this.llmProvider.generateCompletion(prompt);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        const content = JSON.parse(jsonMatch ? jsonMatch[0] : response);

        const quizQuestions = (content.quizQuestions || []).map(q => {
            const id = `q${conceptIndex}-${this.questionIdCounter++}`;
            const shuffled = this.shuffleOptions(q.options, q.correct);
            return {
                id,
                type: 'multiple-choice',
                question: q.question,
                options: shuffled.options,
                correct: shuffled.correctIndex,
                isMultipleAnswer: q.isMultipleAnswer || false
            };
        });

        const matchingQuestions = (content.matchingQuestions || []).map(q => {
            const id = `m${conceptIndex}-${this.questionIdCounter++}`;
            const leftItems = q.pairs.map(p => p.left);
            const rightItems = q.pairs.map(p => p.right);
            const shuffledRight = [...rightItems].sort(() => Math.random() - 0.5);

            return {
                id,
                type: 'matching',
                title: q.title,
                pairs: q.pairs,
                shuffledRight: shuffledRight
            };
        });

        return [...quizQuestions, ...matchingQuestions];
    }

    generateLocally(concept, conceptIndex) {
        const mcQuestions = [
            {
                type: 'multiple-choice',
                question: `According to the text, what is ${concept.title}?`,
                options: [
                    concept.text.substring(0, 50) + '...',
                    'An unrelated concept',
                    'A different topic',
                    'Something else entirely'
                ],
                correct: 0
            },
            {
                type: 'multiple-choice',
                question: `Which of the following is related to ${concept.title}?`,
                options: [
                    'Unrelated topic A',
                    concept.mainKeyword || 'Main concept',
                    'Unrelated topic B',
                    'Unrelated topic C'
                ],
                correct: 1
            }
        ].map(q => {
            const id = `q${conceptIndex}-${this.questionIdCounter++}`;
            const shuffled = this.shuffleOptions(q.options, q.correct);
            return {
                id,
                ...q,
                options: shuffled.options,
                correct: shuffled.correctIndex
            };
        });

        const matchingQuestion = {
            id: `m${conceptIndex}-${this.questionIdCounter++}`,
            type: 'matching',
            title: `Match features of ${concept.title}`,
            pairs: [
                { left: 'Key Feature', right: 'Primary function' },
                { left: 'Context', right: 'Where it applies' },
                { left: 'Impact', right: 'The result' },
                { left: 'Requirement', right: 'What is needed' }
            ],
            shuffledRight: ['The result', 'What is needed', 'Primary function', 'Where it applies']
        };

        return [...mcQuestions, matchingQuestion];
    }

    async generateFinalExam(concepts) {
        if (!this.llmProvider) {
            return this.generateFinalExamLocally(concepts);
        }

        try {
            const conceptsSummary = concepts.map(c => `TOPIC: ${c.title}\nCONTENT: ${c.text}`).join('\n\n');
            const prompt = `Based on all the topics below, generate a FINAL EXAM with exactly 10 questions.
            
LIST OF TOPICS:
${conceptsSummary}

INSTRUCTIONS:
1. Generate 10 NEW unique questions that cover all the topics comprehensively.
2. These questions MUST be different from the basic topic-specific questions.
3. Use a MIX of formats:
   - Multiple-choice (single answer)
   - Multiple-choice (multiple correct answers)
   - Concept Matching (at least 2 matching questions)
4. For matching questions, provide 4 pairs.

Respond with this exact JSON format:
{
  "questions": [
    {
      "type": "multiple-choice",
      "question": "Question text?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correct": 0,
      "isMultipleAnswer": false
    },
    {
      "type": "matching",
      "title": "Match the following...",
      "pairs": [
        {"left": "A", "right": "1"},
        {"left": "B", "right": "2"},
        {"left": "C", "right": "3"},
        {"left": "D", "right": "4"}
      ]
    }
  ]
}

IMPORTANT: Ensure all content is in the same language as the source text.`;

            const response = await this.llmProvider.generateCompletion(prompt);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            const content = JSON.parse(jsonMatch ? jsonMatch[0] : response);

            return (content.questions || []).map((q, idx) => {
                const id = `final-${idx}-${Date.now()}`;
                if (q.type === 'matching') {
                    const rightItems = q.pairs.map(p => p.right);
                    const shuffledRight = [...rightItems].sort(() => Math.random() - 0.5);
                    return { id, ...q, shuffledRight };
                } else {
                    const shuffled = this.shuffleOptions(q.options, Array.isArray(q.correct) ? q.correct[0] : q.correct);
                    return {
                        id,
                        ...q,
                        options: shuffled.options,
                        correct: Array.isArray(q.correct) ? q.correct : shuffled.correctIndex
                    };
                }
            });
        } catch (error) {
            console.error('Final exam generation failed:', error);
            return this.generateFinalExamLocally(concepts);
        }
    }

    generateFinalExamLocally(concepts) {
        // Simple local fallback for 10 questions
        const questions = [];
        for (let i = 0; i < 10; i++) {
            const concept = concepts[i % concepts.length];
            questions.push({
                id: `final-local-${i}`,
                type: 'multiple-choice',
                question: `General question about ${concept.title} (Question ${i + 1})`,
                options: ['Correct', 'Wrong 1', 'Wrong 2', 'Wrong 3'],
                correct: 0,
                isMultipleAnswer: false
            });
        }
        return questions;
    }

    shuffleOptions(options, correctIndex) {
        const correctAnswer = options[correctIndex];
        const shuffled = [...options];

        // Fisher-Yates shuffle
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        // Find new index of correct answer
        const newCorrectIndex = shuffled.indexOf(correctAnswer);

        return {
            options: shuffled,
            correctIndex: newCorrectIndex
        };
    }
}

export default QuizGenerator;
