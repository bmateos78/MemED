// PDF Handler
// Handles PDF file upload and text extraction

class PDFHandler {
    static async extractText(file) {
        if (!file || file.type !== 'application/pdf') {
            throw new Error('Invalid PDF file');
        }

        // Read PDF file
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = '';

        // Extract text from all pages
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n\n';
        }

        // Clean up the text
        fullText = fullText.trim();

        if (fullText.length === 0) {
            throw new Error('No text found in PDF');
        }

        return {
            text: fullText,
            pageCount: pdf.numPages,
            charCount: fullText.length
        };
    }
}

export default PDFHandler;
