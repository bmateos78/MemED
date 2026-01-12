// Activity Generator
// Generates learning activities

class ActivityGenerator {
    constructor(llmProvider = null) {
        this.llmProvider = llmProvider;
    }

    async generate(concept) {
        if (this.llmProvider) {
            try {
                return await this.generateWithLLM(concept);
            } catch (error) {
                console.error('LLM activity generation failed:', error);
                return this.generateLocally(concept);
            }
        }

        return this.generateLocally(concept);
    }

    async generateWithLLM(concept) {
        const conceptType = concept.type || 'Fact';
        const prompt = `Based on the following detailed explanation of "${concept.title}", generate TWO highly engaging and actionable learning activities.

CONCEPT TYPE: ${conceptType}
TEXT:
${concept.text}

INSTRUCTIONS:
1. One activity MUST be optimized for a ${conceptType} concept.
2. For PROCESSES or TOOLS: One activity MUST be a "Step-by-Step Practical Guide" using HTML tags (<ul>, <ol>, <li>) in the description.
3. For THEORIES: Propose a "Case Study Analysis", "Debate", or "Critical Critique".
4. For FACTS/CONCEPTS: Propose an "Impact Assessment", "Mind Map Creation", or "Creative Visualization".

Respond with this exact JSON format:
{
  "activities": [
    {
      "icon": "icon_emoji",
      "title": "Action-oriented Title",
      "type": "Practical/Analysis/Case Study/etc",
      "description": "DETAILED, ACTIONABLE instruction. Use HTML tags (<ul>, <ol>, <li>, <strong>) for formatting if it makes it clearer."
    }
  ]
}

IMPORTANT:
- Focus on ACTIVE learning (doing) rather than passive learning (reading).
- Descriptions must be clear and complete.
- Use variety in activity types.
- Use appropriate icons: 🛠️ (practical), 📋 (process), 📝 (writing), 🔬 (analysis), 👥 (discussion), 💡 (innovation).`;

        const response = await this.llmProvider.generateCompletion(prompt);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        const content = JSON.parse(jsonMatch ? jsonMatch[0] : response);

        return content.activities || [];
    }

    generateLocally(concept) {
        const activities = [
            {
                icon: '🛠️',
                title: 'Implementation Roadmap',
                type: 'Practical',
                description: `Develop a 5-step implementation plan for applying <strong>${concept.title}</strong> in your department or study group.`
            },
            {
                icon: '🔬',
                title: 'Critique & Improve',
                type: 'Analysis',
                description: `Identify three potential weaknesses or limitations of <strong>${concept.title}</strong> as described in the text and propose solutions for each.`
            }
        ];

        return activities;
    }
}

export default ActivityGenerator;
