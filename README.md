# 🎓 MemED - Educational Material Generator

## 🚀 Overview

MemED is a powerful tool designed to transform any text or PDF into a comprehensive learning experience. It leverages advanced AI to extract concepts, generate knowledge checks, quizzes, and interactive activities.

## 📦 Architecture

The project follows a clean, modular architecture with specialized components:

### Modules

**Utils**:
- `js/utils/ConfigManager.js`: Handles API settings and local storage.
- `js/utils/MarkdownFormatter.js`: Formats AI responses.
- `js/utils/PDFHandler.js`: Extracts text from PDF files.

**LLM Providers**:
- `js/llm/LLMProvider.js`: Base abstract class for providers.
- `js/llm/OpenAIProvider.js`, `js/llm/AnthropicProvider.js`, `js/llm/GoogleProvider.js`: Specific API implementations.
- `js/llm/LLMProviderFactory.js`: Creates the appropriate provider.

**Generators**:
- `js/generators/ConceptExtractor.js`: Breaks text into educational concepts.
- `js/generators/KnowledgeCheckGenerator.js`: Creates contextual questions.
- `js/generators/QuizGenerator.js`: Generates multiple-choice quizzes.
- `js/generators/ActivityGenerator.js`: Proposes active learning tasks.

**Exporters**:
- `js/exporters/SCORMExporter.js`: Packages content for LMS (e.g., Moodle).
- `js/exporters/HTMLExporter.js`: Exports as a standalone web page.
- `js/exporters/PDFExporter.js`: Generates a printable PDF document.

**UI**:
- `js/ui/UIManager.js`: Manages the application interface and states.
- `js/ui/EditManager.js`: Handles real-time editing of generated content.

**Main App**:
- `app.js`: Clean entry point coordinate the flow between modules.

## 🚀 How to Run

1. **Serve the project**: Use any local web server (e.g., `python3 -m http.server`).
2. **Access the app**: Go to `http://localhost:8000` (or your server's URL).
3. **Configure AI**: Click "AI Settings" to add your OpenAI, Google Gemini, or Anthropic API key.

## 📝 File Organization

```
MemED/
├── index.html          ← Application entry point
├── index.css           ← Main styles
├── app.js              ← Main application logic (Module)
├── scorm-api.js        ← SCORM 1.2 API wrapper
├── js/                 ← Modular components
│   ├── utils/          ← Utility functions
│   ├── llm/            ← AI providers
│   ├── generators/     ← Content generation logic
│   ├── exporters/      ← Export formats
│   └── ui/             ← Interface management
└── css/                ← Component-specific styles
```

## 🐛 Troubleshooting

### Module Loading Errors
**Problem**: "Failed to load module"
**Solution**: Ensure you're running the app through a web server (e.g., `http://localhost:8000`), not by opening the file directly in the browser (`file://`).

### AI Configuration
**Problem**: AI generation not working.
**Solution**: 
1. Check if your API key is correct in "AI Settings".
2. Ensure you have credits in your LLM provider account (OpenAI, Google, or Anthropic).
3. Check the browser console for specific error messages (Press F12).

## 📚 Documentation

Detailed guides are available in the `/docs` directory:
- `QUICK-START.md`: Get up and running in minutes.
- `SCORM-EXPORT-GUIDE.md`: How to use MemED activities in your LMS (Moodle, Canvas, etc.).
- `TOKEN-LIMITS.md`: Understanding document size limits for different AI models.
- `USAGE-COST.md`: Estimating the cost of using AI per document.

---

**Project Status**: 🟢 Active and Refactored
**Version**: 2.0.0 (Modular)
