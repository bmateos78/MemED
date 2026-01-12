// Markdown Formatter
// Converts markdown syntax to HTML

class MarkdownFormatter {
    static format(text) {
        if (!text) return '';

        // Trim leading and trailing whitespace (including tabs)
        text = text.trim();

        let formatted = text;

        // Convert headers (### Header) to <h4>Header</h4>
        formatted = formatted.replace(/^### (.+)$/gm, '<h4>$1</h4>');
        formatted = formatted.replace(/^## (.+)$/gm, '<h3>$1</h3>');
        formatted = formatted.replace(/^# (.+)$/gm, '<h2>$1</h2>');

        // Convert horizontal rules (---) to <hr>
        formatted = formatted.replace(/^---$/gm, '<hr>');

        // Convert blockquotes (> text) to <blockquote>text</blockquote>
        formatted = formatted.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

        // Convert **bold** to <strong>bold</strong>
        formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

        // Convert *italic* to <em>italic</em>
        formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');

        // Convert `code` to <code>code</code>
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Convert [text](url) to <a href="url">text</a>
        formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

        // Convert unordered lists (• item or - item or * item)
        formatted = formatted.replace(/^[•\-*] (.+)$/gm, '<li>$1</li>');

        // Wrap consecutive <li> items in <ul>
        formatted = formatted.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
            return '<ul>' + match + '</ul>';
        });

        // Convert numbered lists (1. item)
        formatted = formatted.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

        // Wrap consecutive numbered <li> items in <ol>
        formatted = formatted.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
            // Only wrap if not already wrapped in <ul>
            if (!match.includes('<ul>')) {
                return '<ol>' + match + '</ol>';
            }
            return match;
        });

        // Line breaks are handled by CSS white-space: pre-wrap
        return formatted;
    }

    static stripFormatting(text) {
        if (!text) return '';

        // Remove HTML tags
        return text.replace(/<[^>]*>/g, '');
    }
}

export default MarkdownFormatter;
