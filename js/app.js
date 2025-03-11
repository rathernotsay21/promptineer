// Prompt Template Manager

// Template storage
class TemplateStorage {
    constructor() {
        this.templates = JSON.parse(localStorage.getItem('promptTemplates')) || [];
    }

    saveTemplates() {
        localStorage.setItem('promptTemplates', JSON.stringify(this.templates));
    }

    getTemplates() {
        return this.templates;
    }

    getTemplateById(id) {
        return this.templates.find(template => template.id === id);
    }

    saveTemplate(template) {
        const existingIndex = this.templates.findIndex(t => t.id === template.id);
        
        if (existingIndex >= 0) {
            this.templates[existingIndex] = template;
        } else {
            this.templates.push(template);
        }
        
        this.saveTemplates();
        return template;
    }

    deleteTemplate(id) {
        this.templates = this.templates.filter(template => template.id !== id);
        this.saveTemplates();
    }
}

// Field types
const FieldTypes = {
    TEXT: 'text',
    LIST: 'list',
    XML: 'xml',
    FILEPATH: 'filepath'
};

// Application logic
class PromptTemplateApp {
    constructor() {
        this.storage = new TemplateStorage();
        this.currentTemplate = null;
        this.nextFieldId = 1;
        
        this.initElements();
        this.attachEventListeners();
        this.loadTemplates();
    }

    initElements() {
        // Main containers
        this.templateList = document.getElementById('template-list');
        this.fieldsContainer = document.getElementById('fields-container');
        this.previewContent = document.getElementById('preview-content');
        
        // Input elements
        this.templateNameInput = document.getElementById('template-name');
        
        // Buttons
        this.newTemplateBtn = document.getElementById('new-template-btn');
        this.saveTemplateBtn = document.getElementById('save-template-btn');
        this.addTextFieldBtn = document.getElementById('add-text-field-btn');
        this.addListFieldBtn = document.getElementById('add-list-field-btn');
        this.addXmlFieldBtn = document.getElementById('add-xml-field-btn');
        this.addFilepathFieldBtn = document.getElementById('add-filepath-field-btn');
        this.inlineCopyBtn = document.getElementById('inline-copy-btn');
    }

    attachEventListeners() {
        this.newTemplateBtn.addEventListener('click', () => this.createNewTemplate());
        this.saveTemplateBtn.addEventListener('click', () => this.saveCurrentTemplate());
        this.addTextFieldBtn.addEventListener('click', () => this.addField(FieldTypes.TEXT));
        this.addListFieldBtn.addEventListener('click', () => this.addField(FieldTypes.LIST));
        this.addXmlFieldBtn.addEventListener('click', () => this.addField(FieldTypes.XML));
        this.addFilepathFieldBtn.addEventListener('click', () => this.addField(FieldTypes.FILEPATH));
        this.inlineCopyBtn.addEventListener('click', () => this.copyToClipboard());
        
        // Live preview - use event delegation for dynamic elements
        this.fieldsContainer.addEventListener('input', () => this.updatePreview());
    }

    loadTemplates() {
        const templates = this.storage.getTemplates();
        this.templateList.innerHTML = '';
        
        if (templates.length === 0) {
            this.templateList.innerHTML = '<div class="empty-list">No templates yet. Create one!</div>';
            return;
        }
        
        templates.forEach(template => {
            const templateElement = document.createElement('div');
            templateElement.className = 'template-item';
            templateElement.textContent = template.name;
            templateElement.dataset.id = template.id;
            
            templateElement.addEventListener('click', () => this.loadTemplate(template.id));
            
            this.templateList.appendChild(templateElement);
        });
    }

    createNewTemplate() {
        this.currentTemplate = {
            id: Date.now().toString(),
            name: 'New Template',
            fields: []
        };
        
        this.templateNameInput.value = this.currentTemplate.name;
        this.fieldsContainer.innerHTML = '';
        this.nextFieldId = 1;
        this.updatePreview();
    }

    loadTemplate(id) {
        this.currentTemplate = this.storage.getTemplateById(id);
        if (!this.currentTemplate) return;
        
        this.templateNameInput.value = this.currentTemplate.name;
        
        this.fieldsContainer.innerHTML = '';
        this.nextFieldId = 1;
        
        this.currentTemplate.fields.forEach(field => {
            this.renderField(field);
            this.nextFieldId = Math.max(this.nextFieldId, parseInt(field.id) + 1);
        });
        
        // Update active class
        const templateItems = this.templateList.querySelectorAll('.template-item');
        templateItems.forEach(item => {
            item.classList.toggle('active', item.dataset.id === id);
        });
        
        this.updatePreview();
    }

    saveCurrentTemplate() {
        if (!this.currentTemplate) return;
        
        this.currentTemplate.name = this.templateNameInput.value || 'Unnamed Template';
        this.currentTemplate.fields = this.collectFieldData();
        
        this.storage.saveTemplate(this.currentTemplate);
        this.loadTemplates();
    }

    collectFieldData() {
        const fields = [];
        const fieldElements = this.fieldsContainer.querySelectorAll('.field');
        
        fieldElements.forEach(fieldElement => {
            const fieldId = fieldElement.dataset.id;
            const fieldType = fieldElement.dataset.type;
            const fieldContentInput = fieldElement.querySelector('.field-content-input');
            
            let fieldData = {
                id: fieldId,
                type: fieldType,
                content: fieldContentInput.value
            };
            
            // Get label for non-Filepath fields
            if (fieldType !== FieldTypes.FILEPATH) {
                const fieldLabelInput = fieldElement.querySelector('.field-label-input');
                fieldData.label = fieldLabelInput.value;
            }
            
            // Additional data for XML fields
            if (fieldType === FieldTypes.XML) {
                const xmlTagInput = fieldElement.querySelector('.xml-tag-input');
                fieldData.xmlTag = xmlTagInput.value;
            }
            
            fields.push(fieldData);
        });
        
        return fields;
    }

    addField(fieldType) {
        if (!this.currentTemplate) {
            this.createNewTemplate();
        }
        
        const fieldId = this.nextFieldId++;
        const field = {
            id: fieldId.toString(),
            type: fieldType,
            label: '',
            content: ''
        };
        
        // Default XML tag if needed
        if (fieldType === FieldTypes.XML) {
            field.xmlTag = 'tag';
        }
        
        this.renderField(field);
        this.updatePreview();
    }

    renderField(field) {
        const fieldElement = document.createElement('div');
        fieldElement.className = 'field';
        fieldElement.dataset.id = field.id;
        fieldElement.dataset.type = field.type;
        
        const headerHTML = `
            <div class="field-header">
                <span class="field-type">${field.type}</span>
            </div>
        `;
        
        let contentHTML;
        
        if (field.type === FieldTypes.FILEPATH) {
            // Filepath fields don't have a label input
            contentHTML = ``;
        } else {
            // Regular fields with label input
            contentHTML = `
                <div class="field-content-wrapper">
                    <div class="field-label-section">
                        <input type="text" class="field-input field-label-input" placeholder="Field Label" value="${field.label || ''}" tabindex="0">
                    </div>
                </div>
            `;
            
            // Additional options for XML fields
            if (field.type === FieldTypes.XML) {
                contentHTML = contentHTML.replace('</div>\n                </div>', `
                    </div>
                    <div class="field-xml-section">
                        <input type="text" class="field-input xml-tag-input" placeholder="XML Tag" value="${field.xmlTag || 'tag'}" tabindex="0">
                    </div>
                </div>`);
            }
        }
        
        contentHTML += `
            <div class="field-content-section">
                <textarea class="field-input field-content-input" placeholder="${this.getContentLabelByType(field.type)}" rows="2" tabindex="0">${field.content || ''}</textarea>
            </div>
        `;
        
        const actionsHTML = `
            <div class="field-actions">
                <button class="btn-icon field-move-up" title="Move Up">▲</button>
                <button class="btn-icon field-move-down" title="Move Down">▼</button>
                <button class="btn-icon field-delete-btn" title="Delete Field">×</button>
            </div>
        `;
        
        fieldElement.innerHTML = headerHTML + contentHTML + actionsHTML;
        
        // Add event listeners for buttons
        const deleteBtn = fieldElement.querySelector('.field-delete-btn');
        const moveUpBtn = fieldElement.querySelector('.field-move-up');
        const moveDownBtn = fieldElement.querySelector('.field-move-down');
        
        // Remove buttons from tab order
        deleteBtn.setAttribute('tabindex', '-1');
        moveUpBtn.setAttribute('tabindex', '-1');
        moveDownBtn.setAttribute('tabindex', '-1');
        
        deleteBtn.addEventListener('click', () => {
            fieldElement.remove();
            this.updatePreview();
        });
        
        moveUpBtn.addEventListener('click', () => this.moveField(fieldElement, 'up'));
        moveDownBtn.addEventListener('click', () => this.moveField(fieldElement, 'down'));
        
        this.fieldsContainer.appendChild(fieldElement);
    }

    getFieldTypeName(type) {
        switch (type) {
            case FieldTypes.TEXT: return 'Text';
            case FieldTypes.LIST: return 'List';
            case FieldTypes.XML: return 'XML';
            case FieldTypes.FILEPATH: return 'Filepath';
            default: return 'Unknown';
        }
    }

    getContentLabelByType(type) {
        switch (type) {
            case FieldTypes.TEXT: return 'Content';
            case FieldTypes.LIST: return 'List Items (one per line)';
            case FieldTypes.XML: return 'Content (will be wrapped in XML tags)';
            case FieldTypes.FILEPATH: return 'Directory or file location';
            default: return 'Content';
        }
    }
    
    moveField(fieldElement, direction) {
        const fieldsContainer = this.fieldsContainer;
        const fields = Array.from(fieldsContainer.querySelectorAll('.field'));
        const index = fields.indexOf(fieldElement);
        
        if (direction === 'up' && index > 0) {
            fieldsContainer.insertBefore(fieldElement, fields[index - 1]);
        } else if (direction === 'down' && index < fields.length - 1) {
            fieldsContainer.insertBefore(fields[index + 1], fieldElement);
        }
        
        this.updatePreview();
    }

    updatePreview() {
        if (!this.currentTemplate) {
            this.previewContent.textContent = '';
            return;
        }
        
        const fields = this.collectFieldData();
        let previewText = '';
        
        fields.forEach(field => {
            if (!field.content.trim()) return;
            
            if (field.label && field.type !== FieldTypes.FILEPATH) {
                previewText += `${field.label}\n\n`;
            }
            
            switch (field.type) {
                case FieldTypes.TEXT:
                    previewText += `${field.content}\n\n`;
                    break;
                    
                case FieldTypes.LIST:
                    const items = field.content.split('\n').filter(item => item.trim());
                    items.forEach((item, index) => {
                        previewText += `${index + 1}. ${item}\n`;
                    });
                    previewText += '\n';
                    break;
                    
                case FieldTypes.XML:
                    const tag = field.xmlTag || 'tag';
                    previewText += `<${tag}>\n${field.content}\n</${tag}>\n\n`;
                    break;
                
                case FieldTypes.FILEPATH:
                    previewText += `Filepath: ${field.content}\n\n`;
                    break;
            }
        });
        
        this.previewContent.textContent = previewText.trim();
    }

    copyToClipboard() {
        const textToCopy = this.previewContent.textContent;
        
        if (!textToCopy) {
            alert('Nothing to copy. Create some content first!');
            return;
        }
        
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                // Visual feedback for inline button
                this.inlineCopyBtn.style.opacity = '1';
                this.inlineCopyBtn.textContent = '✓';
                
                // Reset after delay
                setTimeout(() => {
                    this.inlineCopyBtn.textContent = '';
                    this.inlineCopyBtn.style.opacity = '0.4';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                alert('Failed to copy text. Please try again.');
            });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new PromptTemplateApp();
});
