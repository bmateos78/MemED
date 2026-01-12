// Text Formatting Toolbar
// Provides advanced formatting controls for text editing

class FormattingToolbar {
    constructor() {
        this.activeElement = null;
        this.toolbar = null;
    }

    /**
     * Create and show the formatting toolbar
     * @param {HTMLElement} element - The element being edited
     * @returns {HTMLElement} - The toolbar element
     */
    show(element) {
        this.activeElement = element;

        // Remove existing toolbar if any
        this.hide();

        // Create toolbar
        this.toolbar = this.createToolbar();

        // Position toolbar above the element
        this.positionToolbar(element);

        // Add to DOM
        document.body.appendChild(this.toolbar);

        // Load current styles
        this.loadCurrentStyles(element);

        return this.toolbar;
    }

    /**
     * Hide and remove the toolbar
     */
    hide() {
        if (this.toolbar && this.toolbar.parentNode) {
            this.toolbar.parentNode.removeChild(this.toolbar);
        }
        this.toolbar = null;
        this.activeElement = null;
    }

    /**
     * Create the toolbar HTML structure
     * @returns {HTMLElement} - The toolbar element
     */
    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'formatting-toolbar';
        toolbar.innerHTML = `
            <div class="formatting-toolbar-content">
                <div class="formatting-group">
                    <label class="formatting-label">Font Size:</label>
                    <select class="formatting-control" id="format-font-size">
                        <option value="0.875rem">Small (14px)</option>
                        <option value="1rem" selected>Normal (16px)</option>
                        <option value="1.125rem">Medium (18px)</option>
                        <option value="1.25rem">Large (20px)</option>
                        <option value="1.5rem">X-Large (24px)</option>
                        <option value="1.75rem">XX-Large (28px)</option>
                        <option value="2rem">Huge (32px)</option>
                    </select>
                </div>

                <div class="formatting-group">
                    <label class="formatting-label">Font Family:</label>
                    <select class="formatting-control" id="format-font-family">
                        <option value="var(--font-primary)">Inter (Default)</option>
                        <option value="var(--font-display)">Outfit (Display)</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="'Times New Roman', serif">Times New Roman</option>
                        <option value="'Courier New', monospace">Courier New</option>
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="Verdana, sans-serif">Verdana</option>
                    </select>
                </div>

                <div class="formatting-group">
                    <label class="formatting-label">Text Color:</label>
                    <input type="color" class="formatting-control color-picker" id="format-text-color" value="#0f172a">
                </div>

                <div class="formatting-group">
                    <label class="formatting-label">Background:</label>
                    <input type="color" class="formatting-control color-picker" id="format-bg-color" value="#f8fafc">
                </div>

                <div class="formatting-group">
                    <label class="formatting-label">Alignment:</label>
                    <div class="formatting-buttons">
                        <button class="format-btn" data-align="left" title="Align Left">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="17" y1="10" x2="3" y2="10"></line>
                                <line x1="21" y1="6" x2="3" y2="6"></line>
                                <line x1="21" y1="14" x2="3" y2="14"></line>
                                <line x1="17" y1="18" x2="3" y2="18"></line>
                            </svg>
                        </button>
                        <button class="format-btn" data-align="center" title="Align Center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="10" x2="6" y2="10"></line>
                                <line x1="21" y1="6" x2="3" y2="6"></line>
                                <line x1="21" y1="14" x2="3" y2="14"></line>
                                <line x1="18" y1="18" x2="6" y2="18"></line>
                            </svg>
                        </button>
                        <button class="format-btn" data-align="right" title="Align Right">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="21" y1="10" x2="7" y2="10"></line>
                                <line x1="21" y1="6" x2="3" y2="6"></line>
                                <line x1="21" y1="14" x2="3" y2="14"></line>
                                <line x1="21" y1="18" x2="7" y2="18"></line>
                            </svg>
                        </button>
                        <button class="format-btn" data-align="justify" title="Justify">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="21" y1="10" x2="3" y2="10"></line>
                                <line x1="21" y1="6" x2="3" y2="6"></line>
                                <line x1="21" y1="14" x2="3" y2="14"></line>
                                <line x1="21" y1="18" x2="3" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="formatting-group">
                    <label class="formatting-label">Line Height:</label>
                    <select class="formatting-control" id="format-line-height">
                        <option value="1.2">Tight (1.2)</option>
                        <option value="1.4">Snug (1.4)</option>
                        <option value="1.6">Normal (1.6)</option>
                        <option value="1.8" selected>Relaxed (1.8)</option>
                        <option value="2.0">Loose (2.0)</option>
                        <option value="2.5">Extra Loose (2.5)</option>
                    </select>
                </div>

                <div class="formatting-group">
                    <button class="format-btn-primary" id="format-apply">Apply Formatting</button>
                    <button class="format-btn-secondary" id="format-reset">Reset</button>
                </div>
            </div>
        `;

        // Attach event listeners
        this.attachToolbarListeners(toolbar);

        return toolbar;
    }

    /**
     * Position the toolbar relative to the element
     * @param {HTMLElement} element - The element being edited
     */
    positionToolbar(element) {
        const rect = element.getBoundingClientRect();
        this.toolbar.style.position = 'fixed';
        this.toolbar.style.top = `${Math.max(10, rect.top - this.toolbar.offsetHeight - 10)}px`;
        this.toolbar.style.left = `${rect.left}px`;
        this.toolbar.style.zIndex = '10000';
    }

    /**
     * Load current styles from the element
     * @param {HTMLElement} element - The element to read styles from
     */
    loadCurrentStyles(element) {
        const computedStyle = window.getComputedStyle(element);

        // Font size
        const fontSizeSelect = this.toolbar.querySelector('#format-font-size');
        if (fontSizeSelect) {
            fontSizeSelect.value = computedStyle.fontSize;
        }

        // Font family
        const fontFamilySelect = this.toolbar.querySelector('#format-font-family');
        if (fontFamilySelect) {
            const fontFamily = computedStyle.fontFamily;
            // Try to match the font family
            for (let option of fontFamilySelect.options) {
                if (fontFamily.includes(option.value) || option.value.includes(fontFamily.split(',')[0])) {
                    fontFamilySelect.value = option.value;
                    break;
                }
            }
        }

        // Text color
        const textColorInput = this.toolbar.querySelector('#format-text-color');
        if (textColorInput) {
            textColorInput.value = this.rgbToHex(computedStyle.color);
        }

        // Background color
        const bgColorInput = this.toolbar.querySelector('#format-bg-color');
        if (bgColorInput) {
            const bgColor = computedStyle.backgroundColor;
            if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                bgColorInput.value = this.rgbToHex(bgColor);
            }
        }

        // Text alignment
        const alignment = computedStyle.textAlign;
        const alignButtons = this.toolbar.querySelectorAll('[data-align]');
        alignButtons.forEach(btn => {
            if (btn.dataset.align === alignment) {
                btn.classList.add('active');
            }
        });

        // Line height
        const lineHeightSelect = this.toolbar.querySelector('#format-line-height');
        if (lineHeightSelect) {
            const lineHeight = computedStyle.lineHeight;
            // Convert px to unitless if needed
            const lineHeightValue = lineHeight.includes('px')
                ? (parseFloat(lineHeight) / parseFloat(computedStyle.fontSize)).toFixed(1)
                : lineHeight;
            lineHeightSelect.value = lineHeightValue;
        }
    }

    /**
     * Attach event listeners to toolbar controls
     * @param {HTMLElement} toolbar - The toolbar element
     */
    attachToolbarListeners(toolbar) {
        // Font size
        toolbar.querySelector('#format-font-size')?.addEventListener('change', (e) => {
            if (this.activeElement) {
                this.activeElement.style.fontSize = e.target.value;
            }
        });

        // Font family
        toolbar.querySelector('#format-font-family')?.addEventListener('change', (e) => {
            if (this.activeElement) {
                this.activeElement.style.fontFamily = e.target.value;
            }
        });

        // Text color
        toolbar.querySelector('#format-text-color')?.addEventListener('input', (e) => {
            if (this.activeElement) {
                this.activeElement.style.color = e.target.value;
            }
        });

        // Background color
        toolbar.querySelector('#format-bg-color')?.addEventListener('input', (e) => {
            if (this.activeElement) {
                this.activeElement.style.backgroundColor = e.target.value;
            }
        });

        // Alignment buttons
        toolbar.querySelectorAll('[data-align]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const alignment = btn.dataset.align;
                if (this.activeElement) {
                    this.activeElement.style.textAlign = alignment;
                }
                // Update active state
                toolbar.querySelectorAll('[data-align]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Line height
        toolbar.querySelector('#format-line-height')?.addEventListener('change', (e) => {
            if (this.activeElement) {
                this.activeElement.style.lineHeight = e.target.value;
            }
        });

        // Apply button (just closes the toolbar)
        toolbar.querySelector('#format-apply')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.hide();
        });

        // Reset button
        toolbar.querySelector('#format-reset')?.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.activeElement) {
                this.activeElement.style.fontSize = '';
                this.activeElement.style.fontFamily = '';
                this.activeElement.style.color = '';
                this.activeElement.style.backgroundColor = '';
                this.activeElement.style.textAlign = '';
                this.activeElement.style.lineHeight = '';
                this.loadCurrentStyles(this.activeElement);
            }
        });
    }

    /**
     * Convert RGB color to hex
     * @param {string} rgb - RGB color string
     * @returns {string} - Hex color string
     */
    rgbToHex(rgb) {
        if (rgb.startsWith('#')) return rgb;

        const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!match) return '#000000';

        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);

        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }
}

export default FormattingToolbar;
