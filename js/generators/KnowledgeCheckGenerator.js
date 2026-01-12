// Knowledge Check Generator
// Generates knowledge check questions and answers

class KnowledgeCheckGenerator {
    constructor(llmProvider = null) {
        this.llmProvider = llmProvider;
    }

    async generate(concept) {
        if (this.llmProvider) {
            try {
                return await this.generateWithLLM(concept);
            } catch (error) {
                console.error('LLM knowledge check generation failed:', error);
                return this.generateLocally(concept);
            }
        }

        return this.generateLocally(concept);
    }

    async generateWithLLM(concept) {
        const conceptType = concept.type || 'Fact';
        const prompt = `Based on the following detailed explanation of "${concept.title}" (Type: ${conceptType}), generate TWO knowledge check questions with detailed answers.

TEXT:
${concept.text}

INSTRUCTIONS:
1. Tailor the questions to the concept type (${conceptType}).
2. For PROCESSES: Ask about the "why" behind specific steps or the output of the process.
3. For TOOLS: Ask about selection criteria or specific use cases.
4. For THEORIES: Ask about the core rationale, critical assumptions, or real-world evidence.
5. For FACTS: Ask about connections to broader themes or the significance of the data.

Respond with this exact JSON format:
{
  "knowledgeChecks": [
    {
      "question": "Question about a key point from the text?",
      "answer": "Detailed answer based on the text content"
    },
    {
      "question": "Question about another important aspect?",
      "answer": "Detailed answer based on the text content"
    }
  ]
}

IMPORTANT:
- Questions MUST be directly based on the text content above
- Answers should reference specific information from the text
- Make questions thought-provoking but answerable from the text`;

        const response = await this.llmProvider.generateCompletion(prompt);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        const content = JSON.parse(jsonMatch ? jsonMatch[0] : response);

        return content.knowledgeChecks || [];
    }

    generateLocally(concept) {
        const keywords = concept.mainKeyword ? [concept.mainKeyword] : [];
        const sentences = concept.sentences || [concept.text];

        return [
            {
                question: `What is the main idea of ${concept.title}?`,
                answer: sentences[0] || concept.text.substring(0, 200)
            },
            {
                question: `What key terms are associated with ${concept.title}?`,
                answer: `Key terms include: ${keywords.join(', ') || 'the main concepts discussed in the text'}.`
            }
        ];
    }
}

export default KnowledgeCheckGenerator;
