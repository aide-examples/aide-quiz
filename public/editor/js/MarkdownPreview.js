/**
 * MarkdownPreview.js - Handles markdown preview functionality
 */

import { i18n } from '../../common/i18n.js';
import { QuizUtils } from '../../common/QuizHelpers.js';

export class MarkdownPreview {
  constructor(editor) {
    this.editor = editor;
  }

  /**
   * Toggle between edit and preview mode for a text field
   */
  toggle(textareaId, previewId, buttonId) {
    const textarea = document.getElementById(textareaId);
    const preview = document.getElementById(previewId);
    const button = document.getElementById(buttonId);
    
    if (!textarea || !preview || !button) return;
    
    const isPreviewMode = preview.style.display !== 'none';
    
    if (isPreviewMode) {
      this.switchToEdit(textarea, preview, button);
    } else {
      this.switchToPreview(textarea, preview, button);
    }
  }

  /**
   * Switch to edit mode
   */
  switchToEdit(textarea, preview, button) {
    preview.style.display = 'none';
    textarea.style.display = 'block';
    button.innerHTML = button.classList.contains('btn-preview-small') ? '👁️' : '👁️ ' + i18n.t('editor_preview');
    button.classList.remove('preview-active');
  }

  /**
   * Switch to preview mode
   */
  switchToPreview(textarea, preview, button) {
    const quizUtil = new QuizUtils(this.editor.currentQuizId || 'preview');
    const preparedText = quizUtil.prepareMarkdown(textarea.value);
    const html = marked.parse(preparedText);
    preview.innerHTML = html || `<em style="color: #999;">${i18n.t('editor_preview_empty')}</em>`;
    preview.style.display = 'block';
    textarea.style.display = 'none';
    button.innerHTML = button.classList.contains('btn-preview-small') ? '✏️' : '✏️ ' + i18n.t('editor_edit');
    button.classList.add('preview-active');
  }

  /**
   * Setup auto-resize for a textarea
   */
  setupAutoResize(textarea) {
    if (!textarea) return;
    
    const autoResize = (el) => {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    };
    
    autoResize(textarea);
    textarea.addEventListener('input', function() {
      autoResize(this);
    });
  }
}
