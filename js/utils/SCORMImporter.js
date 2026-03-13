/**
 * SCORMImporter
 * Handles the extraction and parsing of previously exported MemED SCORM packages.
 */
class SCORMImporter {
    /**
     * Extract JSON from an HTML string for a given script element ID.
     * Uses DOMParser first, then falls back to regex extraction.
     */
    static extractJsonFromHtml(html, scriptId) {
        // Try DOMParser first
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const scriptEl = doc.getElementById(scriptId);

        if (scriptEl && scriptEl.textContent.trim()) {
            try {
                return JSON.parse(scriptEl.textContent);
            } catch (e) {
                console.warn(`DOMParser found #${scriptId} but JSON.parse failed, trying regex fallback`);
            }
        }

        // Regex fallback: extract content between the script tags directly from the raw HTML string.
        // This handles cases where </script> inside the JSON breaks DOMParser.
        const regex = new RegExp(`<script[^>]*id=["']${scriptId}["'][^>]*>([\\s\\S]*?)<\\/script>`, 'i');
        const match = html.match(regex);
        if (match && match[1]) {
            return JSON.parse(match[1]);
        }

        return null;
    }

    static async import(file) {
        if (!file) throw new Error("No file provided");

        console.log("=== Starting SCORM Import ===");
        const zip = await JSZip.loadAsync(file);

        const concepts = [];
        let finalExamQuestions = [];

        const allFiles = Object.keys(zip.files);
        console.log("Files in ZIP:", allFiles);

        // 1. Find all concept files (support root-level or inside a subdirectory)
        const conceptFiles = allFiles.filter(name => {
            const basename = name.split('/').pop();
            return basename.startsWith('concept-') && basename.endsWith('.html');
        });
        // Sort by index to maintain order
        conceptFiles.sort((a, b) => {
            const idxA = parseInt(a.match(/\d+/)[0]);
            const idxB = parseInt(b.match(/\d+/)[0]);
            return idxA - idxB;
        });

        console.log(`Found ${conceptFiles.length} concept files in SCORM zip`);

        // 2. Extract data from each concept file
        for (const filename of conceptFiles) {
            const html = await zip.file(filename).async("string");

            try {
                const concept = this.extractJsonFromHtml(html, 'memed-concept-data');
                if (concept) {
                    concepts.push(concept);
                    console.log(`Parsed concept: ${concept.title}`);
                } else {
                    console.warn(`No memed-concept-data found in ${filename}`);
                }
            } catch (e) {
                console.warn(`Could not parse concept from ${filename}:`, e);
            }
        }

        // 3. Extract final exam data
        const quizPath = allFiles.find(name => name.split('/').pop() === 'quiz.html');
        if (quizPath) {
            const quizHtml = await zip.file(quizPath).async("string");
            try {
                finalExamQuestions = this.extractJsonFromHtml(quizHtml, 'memed-exam-data') || [];
            } catch (e) {
                console.warn("Could not parse final exam data:", e);
            }
        }

        if (concepts.length === 0) {
            throw new Error("The selected file is not a valid MemED SCORM package (no concepts found).");
        }

        console.log(`=== SCORM Import Complete: ${concepts.length} concepts ===`);
        return {
            concepts,
            finalExamQuestions
        };
    }
}

export default SCORMImporter;
