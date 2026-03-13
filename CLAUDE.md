# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

MemED is a pure frontend app using ES Modules — it must be served over HTTP (not opened as `file://`):

```bash
python3 -m http.server
# Then open http://localhost:8000
```

There is no build step, no package manager, and no test suite. All dependencies are loaded via CDN in `index.html` (Quill.js, JSZip, PDF.js).

## Deployment (AWS EC2)

See `PUBLISH.md` for the full AWS CLI deployment workflow. The EC2 instance runs Nginx as a reverse proxy for all three LLM APIs to avoid CORS issues. The proxy routes are:
- `/api/openai/` → `https://api.openai.com/`
- `/api/anthropic/` → `https://api.anthropic.com/`
- `/api/google/` → `https://generativelanguage.googleapis.com/`

To update a live deployment:
```bash
scp -i memed-key.pem -r ./* ec2-user@$PUBLIC_IP:/usr/share/nginx/html/
```

## Architecture

The app is a single-page application with no framework. `app.js` is the ES Module entry point and orchestrates the full flow:

1. **Text/PDF input** → `PDFHandler` extracts text from uploaded PDFs
2. **Concept extraction** → `ConceptExtractor` calls the LLM to break input into educational concepts
3. **Per-concept generation** → for each concept, three generators run in sequence: `KnowledgeCheckGenerator`, `QuizGenerator`, `ActivityGenerator`
4. **Final exam** → `QuizGenerator.generateFinalExam()` creates 10 cross-concept questions
5. **Display & edit** → `UIManager` renders results; `EditManager` manages Quill.js rich-text editors for in-place editing
6. **Export** → `SCORMExporter` (ZIP with `imsmanifest.xml`), `HTMLExporter`, `PDFExporter`
7. **Import** → `SCORMImporter` re-loads a previously exported SCORM ZIP to allow re-editing

### LLM Provider System

`LLMProvider.js` is the abstract base class. Subclasses (`OpenAIProvider`, `AnthropicProvider`, `GoogleProvider`) implement `generateCompletion(prompt, systemPrompt)` and `getTokenLimit()`. `LLMProviderFactory.create(config)` selects the right one. Config (provider, apiKey, model) is persisted in `localStorage` under key `eduMaterialLLMConfig`.

The token limit check at 60% of the model's limit is a soft warning; truncation happens only above 100%.

### SCORM Export

`SCORMExporter` uses JSZip (loaded from CDN) to create a SCORM 1.2-compliant package. Each concept becomes a separate `concept-N.html` SCO. The `scorm-api.js` file (embedded as a string constant in `js/utils/SCORMAssets.js`) is bundled into the ZIP. `SCORMImporter` reverses this by parsing the HTML files in the ZIP to reconstruct the concept data structure.

### Data Flow for Concepts

Each concept object grows through the pipeline:
```js
{
  title: string,
  explanation: string,
  knowledgeChecks: [...],  // added by KnowledgeCheckGenerator
  quizQuestions: [...],    // added by QuizGenerator
  activities: [...]        // added by ActivityGenerator
}
```
`app.js` holds the authoritative `this.concepts[]` array. `EditManager` holds a reference to it and syncs edits back. `collectQuizData()` flattens quiz questions across all concepts into `this.allQuizData[]` before export or quiz submission.

### CDN Dependencies

Versions are pinned in `index.html` — changing them may break functionality:
- **Quill.js 2.0.2** + **quill-resize-module 2.0.8** — rich-text editing. Quill is loaded as a global (`window.Quill`), not as an ES module. `EditManager` registers the resize module on first use.
- **PDF.js 3.11.174** — PDF text extraction. Worker is also loaded from CDN.
- **JSZip 3.10.1** — ZIP creation/reading for SCORM export/import.

### EditManager Editor Keys

`EditManager.editors` is a flat dictionary keyed by strings like `title-{i}`, `text-{i}`, `kc-{i}-{j}-q`, `quiz-{i}-{j}-q`, `quiz-{i}-{j}-opt-{k}`, `act-{i}-{j}-t`. A truthy sentinel at the base key (e.g., `kc-{i}-{j}`) indicates that group is in edit mode. `destroyAllEditors()` simply resets this dictionary — it does not call Quill cleanup APIs.

### Global Access

The app instance is assigned to `window.memedApp` for browser console debugging.
