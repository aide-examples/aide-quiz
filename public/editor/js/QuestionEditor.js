/**
 * QuestionEditor.js - Renders and manages individual questions and their options
 */

import { toast } from '../../common/ApiHelpers.js';
import { i18n } from '../../common/i18n.js';
import { BASE_PATH } from '../../common/BasePath.js';

export class QuestionEditor {
  constructor(editor) {
    this.editor = editor;
    this.draggedElement = null;
  }

  /**
   * Render the current question
   */
  render() {
    const container = document.getElementById('questionsContainer');
    
    if (this.editor.quizData.questions.length === 0) {
      container.innerHTML = `<p style="color: #6c757d; text-align: center; padding: 40px;">${i18n.t('editor_question_empty_state')}</p>`;
      return;
    }
    
    const q = this.editor.quizData.questions[this.editor.currentQuestionIdx];
    const idx = this.editor.currentQuestionIdx;
    const hasReason = q.reason && q.reason.trim() !== '';
    
    container.innerHTML = `
      <div class="question-card" id="question-${idx}">
        <div class="question-header-bar">
          <input type="text"
                 class="keyword-input"
                 value="${q.keyword || ''}"
                 placeholder="${i18n.t('editor_question_keyword_placeholder')}"
                 title="${i18n.t('editor_question_keyword_title')}"
                 onchange="window.quizEditor.navigator.updateQuestion(${idx}, 'keyword', this.value); window.quizEditor.navigator.render();">
          <button class="btn btn-danger" onclick="window.quizEditor.navigator.deleteQuestion(${idx})">🗑️</button>
        </div>
        
        <div class="form-group">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <label style="margin: 0;">${i18n.t('editor_label_question_text')}</label>
            <button id="preview-btn-question-text-${idx}"
                    class="btn-preview"
                    onclick="window.quizEditor.preview.toggle('question-text-input-${idx}', 'question-text-preview-${idx}', 'preview-btn-question-text-${idx}')">
              👁️ ${i18n.t('editor_preview')}
            </button>
          </div>
          <div class="text-with-images-editor">
            <div class="editor-image-dropzone"
                 data-field-type="question-image"
                 data-question-idx="${idx}">
              ${this.renderImagePreview(q.image, this.editor.currentQuizId, 'question-image', idx)}
            </div>
            <textarea id="question-text-input-${idx}"
                 class="question-text-input"
                 placeholder="${i18n.t('editor_question_text_placeholder')}"
                 title="${i18n.t('editor_question_text_title')}"
                 onchange="window.quizEditor.navigator.updateQuestion(${idx}, 'text', this.value)">${this.escapeHtml(q.text || '')}</textarea>
          </div>
          <div id="question-text-preview-${idx}" class="preview-box" style="display: none;"></div>
        </div>
        
        <div class="form-group">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <label style="margin: 0;">${i18n.t('editor_label_question_reason')}</label>
            <div style="display: flex; gap: 8px;">
              <button id="preview-btn-question-reason-${idx}"
                      class="btn-preview ${hasReason ? '' : 'hidden'}"
                      onclick="window.quizEditor.preview.toggle('question-reason-${idx}', 'question-reason-preview-${idx}', 'preview-btn-question-reason-${idx}')">
                👁️ ${i18n.t('editor_preview')}
              </button>
              <button class="btn-toggle-reason" onclick="window.quizEditor.questionEditor.toggleQuestionReason(${idx})">
                ${hasReason ? '▼ ' + i18n.t('editor_question_reason_hide') : '📝 ' + i18n.t('editor_question_reason_add')}
              </button>
            </div>
          </div>
          <div id="question-reason-wrapper-${idx}" class="${hasReason ? '' : 'hidden'}">
            <div class="text-with-images-editor">
              <div class="editor-image-dropzone"
                   data-field-type="question-reason-image"
                   data-question-idx="${idx}">
                ${this.renderImagePreview(q.reasonImage, this.editor.currentQuizId, 'question-reason-image', idx)}
              </div>
              <textarea id="question-reason-${idx}"
                        class="reason-textarea"
                        onchange="window.quizEditor.navigator.updateQuestion(${idx}, 'reason', this.value)"
                        placeholder="${i18n.t('editor_question_reason_placeholder')}">${this.escapeHtml(q.reason || '')}</textarea>
            </div>
            <div id="question-reason-preview-${idx}" class="preview-box" style="display: none;"></div>
          </div>
        </div>
        
        <div class="form-group">
          <div class="options-list" id="options-${idx}"></div>
          <button class="btn btn-secondary" onclick="window.quizEditor.questionEditor.addOption(${idx})">${i18n.t('editor_add_option')}</button>
        </div>
      </div>
    `;
    
    this.renderOptions(idx);
    
    const reasonTextarea = document.getElementById(`question-reason-${idx}`);
    if (reasonTextarea) {
      this.editor.preview.setupAutoResize(reasonTextarea);
    }
    
    // Setup drop zones for images
    this.setupImageDropZones();
  }

  /**
   * Toggle question reason visibility
   */
  toggleQuestionReason(idx) {
    const wrapper = document.getElementById(`question-reason-wrapper-${idx}`);
    const previewBtn = document.getElementById(`preview-btn-question-reason-${idx}`);
    const toggleBtn = event.target;
    
    const isHidden = wrapper.classList.contains('hidden');
    
    if (isHidden) {
      wrapper.classList.remove('hidden');
      previewBtn.classList.remove('hidden');
      toggleBtn.innerHTML = '▼ ' + i18n.t('editor_question_reason_hide');

      const textarea = document.getElementById(`question-reason-${idx}`);
      if (textarea) {
        textarea.focus();
      }
    } else {
      wrapper.classList.add('hidden');
      previewBtn.classList.add('hidden');
      toggleBtn.innerHTML = '📝 ' + i18n.t('editor_question_reason_add');

      const preview = document.getElementById(`question-reason-preview-${idx}`);
      const textarea = document.getElementById(`question-reason-${idx}`);
      if (preview && preview.style.display !== 'none') {
        preview.style.display = 'none';
        textarea.style.display = 'block';
        previewBtn.innerHTML = '👁️ ' + i18n.t('editor_preview');
        previewBtn.classList.remove('preview-active');
      }
    }
  }

  /**
   * Render all options for a question
   */
  renderOptions(qIdx) {
    const container = document.getElementById(`options-${qIdx}`);
    const q = this.editor.quizData.questions[qIdx];
    container.innerHTML = '';
    
    (q.options || []).forEach((c, cIdx) => {
      // NEW FORMAT: correct is on option level
      const isCorrect = (c.correct === true);
      const hasReason = c.reason && c.reason.trim() !== '';
      
      const card = document.createElement('div');
      card.className = 'option-card';
      card.draggable = true;
      card.dataset.index = cIdx;
      card.innerHTML = `
        <div class="option-icons">
          <div class="icon-row">
            <input type="checkbox" ${isCorrect ? 'checked' : ''}
                   onchange="window.quizEditor.questionEditor.toggleCorrect(${qIdx}, '${c.id}', this.checked)"
                   title="${i18n.t('editor_option_correct_title')}">
            <input type="text" class="option-id-input" placeholder="a" value="${c.id || ''}"
                   onchange="window.quizEditor.questionEditor.updateOption(${qIdx}, ${cIdx}, 'id', this.value)" maxlength="1">
          </div>
          <div class="icon-row">
            <button class="icon-btn delete-btn" onclick="window.quizEditor.questionEditor.deleteOption(${qIdx}, ${cIdx})" title="${i18n.t('editor_option_delete_title')}">✕</button>
            <button class="icon-btn reason-btn ${hasReason ? 'has-reason' : ''}"
                    onclick="window.quizEditor.questionEditor.toggleOptionReasonVisibility(${qIdx}, ${cIdx})"
                    title="${hasReason ? i18n.t('editor_option_reason_title_edit') : i18n.t('editor_option_reason_title_add')}">💬</button>
          </div>
        </div>
        <div class="option-inputs">
          <div class="option-text-wrapper">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 12px; color: #6c757d; font-weight: 500;">${i18n.t('editor_label_option_text')}</span>
              <button id="preview-btn-option-text-${qIdx}-${cIdx}"
                      class="btn-preview btn-preview-small"
                      onclick="window.quizEditor.preview.toggle('option-text-${qIdx}-${cIdx}', 'option-text-preview-${qIdx}-${cIdx}', 'preview-btn-option-text-${qIdx}-${cIdx}')">
                👁️
              </button>
            </div>
            <div class="text-with-images-editor">
              <div class="editor-image-dropzone editor-image-dropzone-small"
                   data-field-type="option-image"
                   data-question-idx="${qIdx}"
                   data-option-idx="${cIdx}">
                ${this.renderImagePreview(c.image, this.editor.currentQuizId, 'option-image', qIdx, cIdx)}
              </div>
              <textarea id="option-text-${qIdx}-${cIdx}" class="option-text-textarea"
                        placeholder="${i18n.t('editor_option_text_placeholder')}"
                        onchange="window.quizEditor.questionEditor.updateOption(${qIdx}, ${cIdx}, 'text', this.value)">${this.escapeHtml(c.text || '')}</textarea>
            </div>
            <div id="option-text-preview-${qIdx}-${cIdx}" class="preview-box preview-box-small" style="display: none;"></div>
          </div>

          <div id="option-reason-wrapper-${qIdx}-${cIdx}" class="option-reason-wrapper ${hasReason ? '' : 'hidden'}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 12px; color: #6c757d; font-weight: 500;">${i18n.t('editor_label_option_reason')}</span>
              <button id="preview-btn-option-reason-${qIdx}-${cIdx}"
                      class="btn-preview btn-preview-small"
                      onclick="window.quizEditor.preview.toggle('option-reason-${qIdx}-${cIdx}', 'option-reason-preview-${qIdx}-${cIdx}', 'preview-btn-option-reason-${qIdx}-${cIdx}')">
                👁️
              </button>
            </div>
            <div class="text-with-images-editor">
              <div class="editor-image-dropzone editor-image-dropzone-small"
                   data-field-type="option-reason-image"
                   data-question-idx="${qIdx}"
                   data-option-idx="${cIdx}">
                ${this.renderImagePreview(c.reasonImage, this.editor.currentQuizId, 'option-reason-image', qIdx, cIdx)}
              </div>
              <textarea id="option-reason-${qIdx}-${cIdx}"
                        class="reason-textarea option-reason"
                        onchange="window.quizEditor.questionEditor.updateOption(${qIdx}, ${cIdx}, 'reason', this.value)"
                        placeholder="${i18n.t('editor_option_reason_placeholder')}">${this.escapeHtml(c.reason || '')}</textarea>
            </div>
            <div id="option-reason-preview-${qIdx}-${cIdx}" class="preview-box preview-box-small" style="display: none;"></div>
          </div>
        </div>
      `;
      
      card.addEventListener('dragstart', (e) => this.handleDragStart(e, qIdx));
      card.addEventListener('dragover', (e) => this.handleDragOver(e));
      card.addEventListener('drop', (e) => this.handleDrop(e, qIdx));
      card.addEventListener('dragend', (e) => this.handleDragEnd(e));
      
      card.querySelectorAll('input, button, textarea').forEach(el => {
        el.addEventListener('mousedown', (e) => e.stopPropagation());
      });
      
      container.appendChild(card);
      
      const textTextarea = document.getElementById(`option-text-${qIdx}-${cIdx}`);
      const reasonTextarea = document.getElementById(`option-reason-${qIdx}-${cIdx}`);
      
      if (textTextarea) {
        this.editor.preview.setupAutoResize(textTextarea);
      }
      
      if (reasonTextarea) {
        this.editor.preview.setupAutoResize(reasonTextarea);
      }
    });
  }

  /**
   * Escape HTML for safe insertion
   */
  escapeHtml(text) {
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /**
   * Toggle option reason visibility
   */
  toggleOptionReasonVisibility(qIdx, cIdx) {
    const wrapper = document.getElementById(`option-reason-wrapper-${qIdx}-${cIdx}`);
    const btn = event.target;
    
    const isHidden = wrapper.classList.contains('hidden');
    
    if (isHidden) {
      wrapper.classList.remove('hidden');
      btn.classList.add('has-reason');
      
      const textarea = document.getElementById(`option-reason-${qIdx}-${cIdx}`);
      if (textarea) {
        textarea.focus();
      }
    } else {
      wrapper.classList.add('hidden');
      
      const textarea = document.getElementById(`option-reason-${qIdx}-${cIdx}`);
      if (!textarea.value.trim()) {
        btn.classList.remove('has-reason');
      }
      
      const preview = document.getElementById(`option-reason-preview-${qIdx}-${cIdx}`);
      const previewBtn = document.getElementById(`preview-btn-option-reason-${qIdx}-${cIdx}`);
      if (preview && preview.style.display !== 'none') {
        preview.style.display = 'none';
        textarea.style.display = 'block';
        if (previewBtn) {
          previewBtn.innerHTML = '👁️';
          previewBtn.classList.remove('preview-active');
        }
      }
    }
  }

  /**
   * Add a new option to a question
   */
  addOption(qIdx) {
    const q = this.editor.quizData.questions[qIdx];
    if (!q.options) q.options = [];
    
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const newId = letters[q.options.length] || `${q.options.length + 1}`;
    
    q.options.push({ id: newId, text: '', reason: '' });
    this.renderOptions(qIdx);
  }

  /**
   * Delete a option
   */
  deleteOption(qIdx, cIdx) {
    this.editor.quizData.questions[qIdx].options.splice(cIdx, 1);
    this.updateOptionIds(qIdx);
    this.renderOptions(qIdx);
  }

  /**
   * Update a option field
   */
  updateOption(qIdx, cIdx, field, value) {
    this.editor.quizData.questions[qIdx].options[cIdx][field] = value;
  }

  /**
   * Toggle correct answer
   * NEW FORMAT: Sets correct flag on option level
   */
  toggleCorrect(qIdx, optionId, checked) {
    const q = this.editor.quizData.questions[qIdx];
    const option = q.options.find(c => c.id === optionId);
    
    if (option) {
      option.correct = checked;
    }
  }

  /**
   * Update option IDs alphabetically after reordering
   */
  updateOptionIds(qIdx) {
    const q = this.editor.quizData.questions[qIdx];
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    
    q.options.forEach((option, idx) => {
      const newId = letters[idx] || `${idx + 1}`;
      option.id = newId;
    });
    
    // Note: correct flags are on option level now, no need to update IDs elsewhere
  }

  // Drag & Drop handlers for options

  handleDragStart(e, qIdx) {
    this.draggedElement = e.currentTarget;
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
  }

  handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    
    const target = e.currentTarget;
    if (target.classList.contains('option-card') && target !== this.draggedElement) {
      const rect = target.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      
      if (e.clientY < midpoint) {
        target.classList.add('drag-over-top');
        target.classList.remove('drag-over-bottom');
      } else {
        target.classList.add('drag-over-bottom');
        target.classList.remove('drag-over-top');
      }
    }
    
    return false;
  }

  handleDrop(e, qIdx) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    
    const target = e.currentTarget;
    
    if (this.draggedElement && target !== this.draggedElement) {
      const draggedIdx = parseInt(this.draggedElement.dataset.index);
      const targetIdx = parseInt(target.dataset.index);
      
      const q = this.editor.quizData.questions[qIdx];
      const [movedOption] = q.options.splice(draggedIdx, 1);
      q.options.splice(targetIdx, 0, movedOption);
      
      this.updateOptionIds(qIdx);
      this.renderOptions(qIdx);
    }
    
    target.classList.remove('drag-over-top', 'drag-over-bottom');
    return false;
  }

  handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    
    document.querySelectorAll('.option-card').forEach(card => {
      card.classList.remove('drag-over-top', 'drag-over-bottom');
    });
    
    this.draggedElement = null;
  }

  /**
   * Helper: Remove filename from comma-separated string
   */
  removeFromCommaSeparated(str, toRemove) {
    if (!str) return '';
    return str.split(',')
              .map(s => s.trim())
              .filter(s => s !== toRemove)
              .join(', ');
  }

  /**
   * Render image preview for drop zone
   */
  renderImagePreview(images, quizId, fieldType, qIdx, optIdx = null) {
    if (!images || images.trim() === '') {
      return `
        <div class="dropzone-hint">
          <span class="dropzone-icon">📷</span>
          <span class="dropzone-text">${i18n.t('editor_image_dropzone_hint')}</span>
        </div>
      `;
    }
    
    const imageList = images.split(',').map(s => s.trim()).filter(s => s);
    const basePath = BASE_PATH || '';
    
    return imageList.map(img => `
      <div class="editor-image-item">
        <img src="${basePath}/api/img?quizId=${quizId}&filename=${encodeURIComponent(img)}"
             alt="${img}"
             title="${img}"
             onerror="this.style.display='none'">
        <button class="remove-image-btn"
                onclick="window.quizEditor.questionEditor.removeImageFromField('${fieldType}', ${qIdx}, ${optIdx}, '${img}'); event.stopPropagation();"
                title="${i18n.t('editor_image_remove_title')}">
          ✕
        </button>
      </div>
    `).join('');
  }

  /**
   * Setup drop zones for images
   */
  setupImageDropZones() {
    const dropZones = document.querySelectorAll('.editor-image-dropzone');
    
    dropZones.forEach(zone => {
      // Prevent default drag behaviors
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        zone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
      });
      
      // Highlight on dragover
      zone.addEventListener('dragenter', (e) => {
        zone.classList.add('drag-over');
      });
      
      zone.addEventListener('dragover', (e) => {
        zone.classList.add('drag-over');
      });
      
      zone.addEventListener('dragleave', (e) => {
        // Only remove if leaving the dropzone itself (not child elements)
        if (e.target === zone) {
          zone.classList.remove('drag-over');
        }
      });
      
      // Handle drop
      zone.addEventListener('drop', (e) => {
        zone.classList.remove('drag-over');
        
        // Only accept drops from MediaManager (not external files)
        const filename = e.dataTransfer.getData('application/x-quiz-image');
        if (!filename) {
          toast.error(i18n.t('editor_image_drag_hint'), 3000);
          return;
        }
        
        const fieldType = zone.dataset.fieldType;
        const qIdx = parseInt(zone.dataset.questionIdx);
        const optIdx = zone.dataset.optionIdx ? parseInt(zone.dataset.optionIdx) : null;
        
        this.addImageToField(fieldType, qIdx, optIdx, filename);
      });
    });
  }

  /**
   * Add image to field
   */
  addImageToField(fieldType, qIdx, optIdx, filename) {
    const q = this.editor.quizData.questions[qIdx];
    
    if (fieldType === 'question-image') {
      const current = q.image || '';
      q.image = current ? `${current}, ${filename}` : filename;
    }
    else if (fieldType === 'question-reason-image') {
      const current = q.reasonImage || '';
      q.reasonImage = current ? `${current}, ${filename}` : filename;
    }
    else if (fieldType === 'option-image') {
      const current = q.options[optIdx].image || '';
      q.options[optIdx].image = current ? `${current}, ${filename}` : filename;
    }
    else if (fieldType === 'option-reason-image') {
      const current = q.options[optIdx].reasonImage || '';
      q.options[optIdx].reasonImage = current ? `${current}, ${filename}` : filename;
    }
    
    // Re-render and save
    this.renderQuestion(qIdx);
    this.editor.dataSync.syncFromUI();
    toast.success(i18n.t('editor_image_added', { filename }), 2000);
  }

  /**
   * Remove image from field
   */
  removeImageFromField(fieldType, qIdx, optIdx, filename) {
    const q = this.editor.quizData.questions[qIdx];
    
    if (fieldType === 'question-image') {
      q.image = this.removeFromCommaSeparated(q.image, filename);
    }
    else if (fieldType === 'question-reason-image') {
      q.reasonImage = this.removeFromCommaSeparated(q.reasonImage, filename);
    }
    else if (fieldType === 'option-image') {
      q.options[optIdx].image = this.removeFromCommaSeparated(q.options[optIdx].image, filename);
    }
    else if (fieldType === 'option-reason-image') {
      q.options[optIdx].reasonImage = this.removeFromCommaSeparated(q.options[optIdx].reasonImage, filename);
    }
    
    // Re-render and save
    this.renderQuestion(qIdx);
    this.editor.dataSync.syncFromUI();
    toast.success(i18n.t('editor_image_removed', { filename }), 2000);
  }
}