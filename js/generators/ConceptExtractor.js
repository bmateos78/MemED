// Concept Extractor
// Extracts main concepts from text using LLM or local semantic analysis

class ConceptExtractor {
    constructor(llmProvider = null) {
        this.llmProvider = llmProvider;
    }

    async extract(text) {
        if (this.llmProvider) {
            try {
                return await this.extractWithLLM(text);
            } catch (error) {
                console.error('LLM extraction failed:', error);
                alert('LLM extraction failed. Using local extraction as fallback.');
                return this.extractLocally(text);
            }
        }

        return this.extractLocally(text);
    }

    async extractWithLLM(text) {
        // Check token limits
        const tokenCheck = this.llmProvider.checkTokenLimit(text);

        if (!tokenCheck.withinLimit && tokenCheck.shouldTruncate) {
            alert(`⚠️ Document is very large (${text.length.toLocaleString()} characters).\n\n` +
                `Current limit: ~${tokenCheck.limit.toLocaleString()} tokens\n\n` +
                `The document will be truncated to the first ${tokenCheck.maxChars.toLocaleString()} characters.\n\n` +
                `Tip: Use a model with higher limits (Claude 3, GPT-4 Turbo)`);

            text = text.substring(0, tokenCheck.maxChars);
        }

        const prompt = this.buildPrompt(text);
        const response = await this.llmProvider.generateCompletion(prompt);

        return this.parseResponse(response);
    }

    buildPrompt(text) {
        return `Analyze the following text and identify the main concepts (maximum 10 concepts). For each concept:

1. Provide a clear, concise title (2-6 words)

2. Write a COMPREHENSIVE and WELL-FORMATTED explanation in HTML format that:
   
   FORMATTING REQUIREMENTS:
   ✅ Use the language of the text for the outcome text
   ✅ Use <p> tags for each paragraph
   ✅ Use <h2>, <h3>, <h4> tags for headers
   ✅ Use <ul> and <li> for bullet points
   ✅ Use <ol> and <li> for numbered lists
   ✅ Use <strong> for important terms
   ✅ Use <em> for secondary emphasis
   ✅ Use <code> for technical terms, formulas, or variables
   ✅ Use <pre><code>...</code></pre> for multi-line code snippets
   ✅ Use <blockquote> for important definitions or notes
   ✅ Use <hr> to separate major sections
   ✅ Use inline styles or <mark> tags if specific highlighting is needed for key educational terms
   ✅ Include relevant emojis (💡 🎯 📊 🔬 🌟 ⚡ 🎓 etc.) within the HTML tags
   ✅ Use <a href="url">links</a> for external references when relevant
   
   CONTENT REQUIREMENTS:
   📚 Provide 4 to 7 paragraphs of detailed explanation
   🔗 Include related concepts and connections
   🌍 Add real-world applications and examples
   📖 Provide background information when relevant
   💭 Explain WHY the concept is important
   📈 Include specific details, data, or facts
   🎨 Use analogies or comparisons
   👀 Cover different perspectives

3. Categorize the concept as one of the following TYPES:
   - "Process": A series of steps or actions to achieve a goal.
   - "Tool": A specific software, hardware, or method used to perform a task.
   - "Theory": An explanation of an aspect of the natural world or a systemic idea.
   - "Fact": A specific piece of information, history, or data point.

4. Identify the main keyword for the concept.

Text to analyze:
${text}

Respond with a JSON array of concept objects with this exact format:
[
  {
    "title": "Concept Title",
    "type": "Process/Tool/Theory/Fact",
    "text": "<p>Well-formatted <strong>explanation</strong> with paragraphs, lists, and emojis 💡.</p>",
    "mainKeyword": "keyword"
  }
]

CRITICAL REQUIREMENTS:
- Use EXCLUSIVELY HTML for the "text" field
- Maximum 10 concepts
- Each concept MUST have 4 to 7 paragraphs
- Include relevant emojis throughout
- Make text scannable and visually appealing
- Keep educational value and depth
- Ensure concepts are semantically meaningful and distinct`;
    }

    parseResponse(response) {
        // Try to extract JSON from the response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        const jsonStr = jsonMatch ? jsonMatch[0] : response;

        const concepts = JSON.parse(jsonStr);

        if (!Array.isArray(concepts) || concepts.length === 0) {
            throw new Error('LLM returned invalid concepts');
        }

        // Format concepts
        return concepts.slice(0, 10).map((concept, index) => ({
            title: concept.title || `Concept ${index + 1}`,
            type: concept.type || 'Fact',
            text: concept.text || '',
            mainKeyword: concept.mainKeyword || 'concept',
            sentences: [concept.text || ''],
            knowledgeChecks: [],
            quizQuestions: [],
            activities: []
        }));
    }

    extractLocally(text) {
        // Local semantic extraction (simplified version)
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

        if (sentences.length === 0) {
            return [{
                title: 'Main Concept',
                text: `<p>${text}</p>`,
                sentences: [text],
                mainKeyword: 'topic',
                knowledgeChecks: [],
                quizQuestions: [],
                activities: []
            }];
        }

        // Extract keywords from each sentence
        const sentenceData = sentences.map(sentence => ({
            text: sentence.trim(),
            keywords: this.extractKeywords(sentence)
        }));

        // Identify main topics based on keyword frequency
        const allKeywords = sentenceData.flatMap(s => s.keywords);
        const keywordFrequency = {};
        allKeywords.forEach(keyword => {
            keywordFrequency[keyword] = (keywordFrequency[keyword] || 0) + 1;
        });

        const topKeywords = Object.entries(keywordFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15)
            .map(([keyword]) => keyword);

        // Group sentences by semantic similarity
        const concepts = [];
        const usedSentences = new Set();

        for (const mainKeyword of topKeywords) {
            if (concepts.length >= 10) break;

            const relatedSentences = sentenceData.filter((s, idx) =>
                !usedSentences.has(idx) && s.keywords.includes(mainKeyword)
            );

            if (relatedSentences.length === 0) continue;

            const sentenceIndices = relatedSentences.map(rs =>
                sentenceData.findIndex(s => s.text === rs.text)
            );

            if (sentenceIndices.length < 2) continue;

            sentenceIndices.forEach(idx => usedSentences.add(idx));

            const conceptSentences = sentenceIndices.map(idx => sentenceData[idx].text);
            const conceptText = `<p>${conceptSentences.join(' ')}</p>`;
            const title = this.generateTitle(conceptSentences, mainKeyword);

            concepts.push({
                title,
                text: conceptText,
                sentences: conceptSentences,
                mainKeyword,
                type: 'Fact',
                knowledgeChecks: [],
                quizQuestions: [],
                activities: []
            });
        }

        // Ensure at least one concept
        if (concepts.length === 0) {
            concepts.push({
                title: 'Main Concept',
                text: `<p>${text}</p>`,
                sentences: sentences,
                mainKeyword: topKeywords[0] || 'topic',
                type: 'Fact',
                knowledgeChecks: [],
                quizQuestions: [],
                activities: []
            });
        }

        // Sort by appearance order
        concepts.sort((a, b) => {
            const aIndex = sentences.findIndex(s => s.trim() === a.sentences[0].trim());
            const bIndex = sentences.findIndex(s => s.trim() === b.sentences[0].trim());
            return aIndex - bIndex;
        });

        return concepts.slice(0, 10);
    }

    extractKeywords(sentence) {
        const words = sentence.toLowerCase().match(/\b[a-z]+\b/g) || [];
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
            'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'could', 'should', 'may', 'might', 'can', 'that', 'this', 'these',
            'those', 'it', 'its', 'they', 'them', 'their'
        ]);

        return words
            .filter(word => !stopWords.has(word) && word.length > 3)
            .filter((word, index, self) => self.indexOf(word) === index);
    }

    generateTitle(sentences, mainKeyword) {
        const firstSentence = sentences[0].trim();
        const patterns = [
            /^([A-Z][a-z]+(?:\s+[a-z]+){0,3})\s+(?:is|are|was|were|refers to|means)/i,
            /^The\s+([a-z]+(?:\s+[a-z]+){0,3})/i,
            /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/
        ];

        for (const pattern of patterns) {
            const match = firstSentence.match(pattern);
            if (match && match[1]) {
                return match[1].trim().split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
            }
        }

        return mainKeyword.charAt(0).toUpperCase() + mainKeyword.slice(1);
    }
}

export default ConceptExtractor;
