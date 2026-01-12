class EditManager {
    constructor(concepts) {
        this.concepts = concepts;
        this.editors = {}; // Store Quill instances
    }

    _ensureResizeModuleRegistered() {
        if (typeof Quill !== 'undefined' && window.QuillResizeModule && !Quill.imports['modules/resize']) {
            Quill.register('modules/resize', window.QuillResizeModule.default || window.QuillResizeModule);
        }
    }

    setConcepts(concepts) {
        this.concepts = concepts;
    }

    attachEditListeners(block, conceptIndex) {
        const editButtons = block.querySelectorAll('.edit-btn');

        editButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const editType = btn.dataset.editType;
                const cIndex = parseInt(btn.dataset.conceptIndex);

                switch (editType) {
                    case 'title':
                        this.editConceptTitle(cIndex);
                        break;
                    case 'text':
                        this.editConceptText(cIndex);
                        break;
                    case 'knowledge-check':
                        this.editKnowledgeCheck(cIndex, parseInt(btn.dataset.checkIndex), btn.dataset.field);
                        break;
                    case 'quiz':
                        this.editQuizQuestion(cIndex, parseInt(btn.dataset.quizIndex), btn.dataset.field);
                        break;
                    case 'activity':
                        this.editActivity(cIndex, parseInt(btn.dataset.activityIndex), btn.dataset.field);
                        break;
                }
            });
        });

        // Also allow clicking directly on the title to edit
        const title = block.querySelector('.concept-title');
        if (title) {
            title.style.cursor = 'pointer';
            title.title = 'Click to edit title';
            title.addEventListener('click', (e) => {
                // If we're already editing, don't trigger another toggle
                if (title.classList.contains('editing') || title.querySelector('.ql-editor')) return;

                const cIndex = parseInt(title.dataset.conceptIndex);
                this.editConceptTitle(cIndex);
            });
        }
    }

    /**
     * Generic method to toggle Quill editor on an element
     */
    async toggleRichEditor(container, button, editorKey, onSave) {
        if (this.editors[editorKey]) {
            // Save and remove editor
            try {
                const quill = this.editors[editorKey];
                const content = quill.root.innerHTML;

                // Cleanup
                const toolbar = container.parentElement.querySelector('.ql-toolbar');
                if (toolbar) toolbar.remove();

                container.innerHTML = content;
                container.classList.remove('editing', 'ql-container', 'ql-snow');

                delete this.editors[editorKey];

                // Update button
                button.innerHTML = button.innerHTML.replace('💾 Save', '✏️ Edit');
                button.classList.remove('save-mode');

                if (onSave) onSave(content);
            } catch (error) {
                console.error('Error saving editor:', error);
            }
        } else {
            // Create editor
            try {
                if (typeof Quill === 'undefined') {
                    throw new Error('Quill library not detected.');
                }

                this._ensureResizeModuleRegistered();

                container.classList.add('editing');
                const initialHTML = container.innerHTML;

                const quill = new Quill(container, {
                    theme: 'snow',
                    modules: {
                        toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'color': [] }, { 'background': [] }],
                            ['link', 'blockquote', 'code-block', 'image'],
                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                            ['clean']
                        ],
                        resize: {
                            showSize: true, // Show image size during resize
                            toolbar: {
                                buttons: ['25%', '50%', '100%'],
                                styles: {
                                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                    border: 'none',
                                    color: 'white'
                                }
                            }
                        }
                    }
                });

                quill.root.innerHTML = initialHTML;
                this.editors[editorKey] = quill;

                button.innerHTML = '💾 Save';
                button.classList.add('save-mode');
                quill.focus();
            } catch (error) {
                console.error('Quill Initialization Failed:', error);
                container.classList.remove('editing');
                alert(`Failed to initialize editor: ${error.message}`);
            }
        }
    }

    async editConceptTitle(conceptIndex) {
        const titleDiv = document.querySelector(`.concept-title[data-concept-index="${conceptIndex}"]`);
        const btn = document.querySelector(`button[data-edit-type="title"][data-concept-index="${conceptIndex}"]`);
        const editorKey = `title-${conceptIndex}`;

        await this.toggleRichEditor(titleDiv, btn, editorKey, (content) => {
            // Titles should be plain text
            const plainTitle = content.replace(/<[^>]*>/g, '').trim();
            this.concepts[conceptIndex].title = plainTitle || "Untitled Concept";
            titleDiv.innerHTML = this.concepts[conceptIndex].title;
        });
    }

    async editConceptText(conceptIndex) {
        const contentDiv = document.querySelector(`.concept-content[data-concept-index="${conceptIndex}"]`);
        const btn = document.querySelector(`button[data-edit-type="text"][data-concept-index="${conceptIndex}"]`);
        const editorKey = `text-${conceptIndex}`;

        await this.toggleRichEditor(contentDiv, btn, editorKey, (content) => {
            this.concepts[conceptIndex].text = content;
        });
    }

    async editKnowledgeCheck(conceptIndex, checkIndex) {
        const container = document.querySelector(`.knowledge-check-container[data-concept-index="${conceptIndex}"][data-check-index="${checkIndex}"]`);
        const btn = container.querySelector('.edit-btn');

        // We handle both question and answer in one go or separate?
        // Let's do them together for simplicity in the card
        const questionDiv = container.querySelector('[data-field="question"]');
        const answerDiv = container.querySelector('[data-field="answer"]');
        const editorKey = `kc-${conceptIndex}-${checkIndex}`;

        if (this.editors[editorKey]) {
            // Save logic
            const qEditor = this.editors[`${editorKey}-q`];
            const aEditor = this.editors[`${editorKey}-a`];

            this.concepts[conceptIndex].knowledgeChecks[checkIndex].question = qEditor.root.innerHTML;
            this.concepts[conceptIndex].knowledgeChecks[checkIndex].answer = aEditor.root.innerHTML;

            // Cleanup
            [questionDiv, answerDiv].forEach(div => {
                const toolbar = div.parentElement.querySelector('.ql-toolbar');
                if (toolbar) toolbar.remove();
                div.innerHTML = div === questionDiv ? qEditor.root.innerHTML : aEditor.root.innerHTML;
                div.classList.remove('editing', 'ql-container', 'ql-snow');
            });

            delete this.editors[`${editorKey}-q`];
            delete this.editors[`${editorKey}-a`];
            delete this.editors[editorKey];

            btn.innerHTML = btn.innerHTML.replace('💾 Save', 'Edit');
            btn.classList.remove('save-mode');
            container.classList.remove('editing-mode');
        } else {
            // Create Editors
            try {
                this._ensureResizeModuleRegistered();
                container.classList.add('editing-mode');

                const modules = {
                    toolbar: [['bold', 'italic', 'image', 'clean']],
                    resize: {
                        showSize: true,
                        toolbar: {
                            buttons: ['25%', '50%', '100%'],
                            styles: { backgroundColor: 'rgba(0,0,0,0.7)', color: 'white' }
                        }
                    }
                };
                const qQuill = new Quill(questionDiv, { theme: 'snow', modules });
                const aQuill = new Quill(answerDiv, { theme: 'snow', modules });

                this.editors[`${editorKey}-q`] = qQuill;
                this.editors[`${editorKey}-a`] = aQuill;
                this.editors[editorKey] = true;

                btn.innerHTML = '💾 Save';
                btn.classList.add('save-mode');
            } catch (e) { alert(e.message); }
        }
    }

    async editQuizQuestion(conceptIndex, quizIndex) {
        const container = document.querySelector(`.quiz-question-container[data-concept-index="${conceptIndex}"][data-quiz-index="${quizIndex}"]`);
        const btn = container.querySelector('.edit-btn');
        const questionData = this.concepts[conceptIndex].quizQuestions[quizIndex];
        const editorKey = `quiz-${conceptIndex}-${quizIndex}`;

        if (questionData.type === 'matching') {
            const titleSpan = container.querySelector('[data-field="title"]');
            const pairsContainer = container.querySelector('.matching-pairs');
            const leftElements = pairsContainer.querySelectorAll('[data-field^="left-"]');
            const rightCorrectElements = pairsContainer.querySelectorAll('[data-field^="right-"]');

            if (this.editors[editorKey]) {
                // Save Logic for Matching
                const titleEditor = this.editors[`${editorKey}-title`];
                questionData.title = titleEditor.root.innerHTML;

                const newPairs = [];
                leftElements.forEach((el, idx) => {
                    const lEditor = this.editors[`${editorKey}-l-${idx}`];
                    const rEditor = this.editors[`${editorKey}-r-${idx}`];

                    const leftText = lEditor.root.innerHTML;
                    const rightText = rEditor.root.innerHTML;

                    newPairs.push({ left: leftText, right: rightText });

                    // Cleanup editors
                    [lEditor, rEditor].forEach(ed => {
                        const toolbar = ed.container.parentElement.querySelector('.ql-toolbar');
                        if (toolbar) toolbar.remove();
                    });

                    el.innerHTML = leftText;
                    el.classList.remove('editing', 'ql-container', 'ql-snow');

                    const rDiv = rightCorrectElements[idx];
                    rDiv.innerHTML = rightText;
                    rDiv.style.display = 'none';
                    rDiv.classList.remove('editing', 'ql-container', 'ql-snow');

                    delete this.editors[`${editorKey}-l-${idx}`];
                    delete this.editors[`${editorKey}-r-${idx}`];
                });

                questionData.pairs = newPairs;
                // Update shuffledRight based on new text
                const rightTexts = newPairs.map(p => p.right);
                questionData.shuffledRight = [...rightTexts].sort(() => Math.random() - 0.5);

                // Update select dropdowns in UI
                const selects = pairsContainer.querySelectorAll('select');
                selects.forEach(select => {
                    const currentValue = select.value;
                    select.innerHTML = '<option value="">Select match...</option>' +
                        questionData.shuffledRight.map((item, iIndex) => `
                            <option value="${iIndex}">${item}</option>
                        `).join('');
                    select.style.display = 'block';
                });

                const tToolbar = titleSpan.parentElement.querySelector('.ql-toolbar');
                if (tToolbar) tToolbar.remove();
                titleSpan.innerHTML = titleEditor.root.innerHTML;
                titleSpan.classList.remove('editing', 'ql-container', 'ql-snow');

                delete this.editors[`${editorKey}-title`];
                delete this.editors[editorKey];

                btn.innerHTML = btn.innerHTML.replace('💾 Save', 'Edit');
                btn.classList.remove('save-mode');
                container.classList.remove('editing');
            } else {
                // Edit Mode Start for Matching
                this._ensureResizeModuleRegistered();
                const toolbarOptions = [['bold', 'italic', 'clean']];

                this.editors[`${editorKey}-title`] = new Quill(titleSpan, { theme: 'snow', modules: { toolbar: toolbarOptions } });

                leftElements.forEach((el, idx) => {
                    this.editors[`${editorKey}-l-${idx}`] = new Quill(el, { theme: 'snow', modules: { toolbar: toolbarOptions } });

                    const rDiv = rightCorrectElements[idx];
                    rDiv.style.display = 'block';
                    this.editors[`${editorKey}-r-${idx}`] = new Quill(rDiv, { theme: 'snow', modules: { toolbar: toolbarOptions } });
                });

                // Hide selects during edit
                pairsContainer.querySelectorAll('select').forEach(s => s.style.display = 'none');

                this.editors[editorKey] = true;
                btn.innerHTML = '💾 Save';
                btn.classList.add('save-mode');
                container.classList.add('editing');
            }
        } else {
            // Original Multiple Choice Logic
            const questionDiv = container.querySelector('.question-text-content');
            const optionLabels = container.querySelectorAll('label[data-field^="option-"]');

            if (this.editors[editorKey]) {
                // Save logic
                const qEditor = this.editors[`${editorKey}-q`];
                questionData.question = qEditor.root.innerHTML;

                optionLabels.forEach((label, idx) => {
                    const optEditor = this.editors[`${editorKey}-opt-${idx}`];
                    questionData.options[idx] = optEditor.root.innerHTML;

                    const toolbar = label.parentElement.querySelector('.ql-toolbar');
                    if (toolbar) toolbar.remove();
                    label.innerHTML = optEditor.root.innerHTML;
                    label.classList.remove('editing', 'ql-container', 'ql-snow');
                    delete this.editors[`${editorKey}-opt-${idx}`];
                });

                const toolbar = questionDiv.parentElement.querySelector('.ql-toolbar');
                if (toolbar) toolbar.remove();
                questionDiv.innerHTML = qEditor.root.innerHTML;
                questionDiv.classList.remove('editing', 'ql-container', 'ql-snow');

                // Correct Answer
                const selectedOption = container.querySelector('input[type="radio"]:checked');
                if (selectedOption) {
                    questionData.correct = parseInt(selectedOption.value);
                }

                delete this.editors[`${editorKey}-q`];
                delete this.editors[editorKey];

                btn.innerHTML = btn.innerHTML.replace('💾 Save', 'Edit');
                btn.classList.remove('save-mode');
                container.classList.remove('editing');
            } else {
                // Create Editors
                this._ensureResizeModuleRegistered();
                const qQuill = new Quill(questionDiv, {
                    theme: 'snow',
                    modules: {
                        toolbar: [['bold', 'italic', 'image', 'clean']],
                        resize: {
                            showSize: true,
                            toolbar: {
                                buttons: ['25%', '50%', '100%'],
                                styles: { backgroundColor: 'rgba(0,0,0,0.7)', color: 'white' }
                            }
                        }
                    }
                });
                this.editors[`${editorKey}-q`] = qQuill;

                optionLabels.forEach((label, idx) => {
                    const optQuill = new Quill(label, { theme: 'snow', modules: { toolbar: [['bold', 'italic', 'clean']] } });
                    this.editors[`${editorKey}-opt-${idx}`] = optQuill;
                });

                this.editors[editorKey] = true;
                btn.innerHTML = '💾 Save';
                btn.classList.add('save-mode');
                container.classList.add('editing');
            }
        }
    }

    async editActivity(conceptIndex, activityIndex) {
        const container = document.querySelector(`.activity-item[data-concept-index="${conceptIndex}"][data-activity-index="${activityIndex}"]`);
        const btn = container.querySelector('.edit-btn');
        const titleDiv = container.querySelector('[data-field="title"]');
        const descDiv = container.querySelector('[data-field="description"]');
        const editorKey = `act-${conceptIndex}-${activityIndex}`;

        if (this.editors[editorKey]) {
            const tEditor = this.editors[`${editorKey}-t`];
            const dEditor = this.editors[`${editorKey}-d`];

            this.concepts[conceptIndex].activities[activityIndex].title = tEditor.root.innerHTML;
            this.concepts[conceptIndex].activities[activityIndex].description = dEditor.root.innerHTML;

            [titleDiv, descDiv].forEach(div => {
                const toolbar = div.parentElement.querySelector('.ql-toolbar');
                if (toolbar) toolbar.remove();
                div.innerHTML = div === titleDiv ? tEditor.root.innerHTML : dEditor.root.innerHTML;
                div.classList.remove('editing', 'ql-container', 'ql-snow');
            });

            delete this.editors[`${editorKey}-t`];
            delete this.editors[`${editorKey}-d`];
            delete this.editors[editorKey];

            btn.innerHTML = btn.innerHTML.replace('💾 Save', 'Edit');
            btn.classList.remove('save-mode');
            container.classList.remove('editing');
        } else {
            this._ensureResizeModuleRegistered();
            const tQuill = new Quill(titleDiv, { theme: 'snow', modules: { toolbar: [['bold', 'italic', 'clean']] } });
            const dQuill = new Quill(descDiv, {
                theme: 'snow',
                modules: {
                    toolbar: [['bold', 'italic', 'image', 'clean']],
                    resize: {
                        showSize: true,
                        toolbar: {
                            buttons: ['25%', '50%', '100%'],
                            styles: { backgroundColor: 'rgba(0,0,0,0.7)', color: 'white' }
                        }
                    }
                }
            });

            this.editors[`${editorKey}-t`] = tQuill;
            this.editors[`${editorKey}-d`] = dQuill;
            this.editors[editorKey] = true;

            btn.innerHTML = '💾 Save';
            btn.classList.add('save-mode');
            container.classList.add('editing');
        }
    }

    async destroyAllEditors() {
        for (const key in this.editors) {
            // Simply refresh the page or clear editors object
            delete this.editors[key];
        }
    }
}

export default EditManager;
