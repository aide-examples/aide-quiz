/**
 * DataSync.js - Handles data synchronization between UI and JSON, save/load
 */

import { fetchWithErrorHandling, toast, log } from '../../common/ApiHelpers.js';
import { i18n } from '../../common/i18n.js';
import { validationClient } from '../../common/ValidationClient.js';

export class DataSync {
  constructor(editor) {
    this.editor = editor;
    this.codeMirrorEditor = null; // Will be initialized on first JSON mode switch
  }

  /**
   * Get teacher's selected language from Google Translate cookie
   * @returns {string} Language code (e.g., 'de', 'en', 'es')
   */
  getTeacherLanguage() {
    // Google Translate stores language in cookie: googtrans=/de/en (from/to)
    const cookie = document.cookie.split('; ').find(c => c.startsWith('googtrans='));
    if (!cookie) return 'de'; // Default to German

    const value = cookie.split('=')[1];
    const match = value.match(/\/[a-z]{2}\/([a-z]{2})/);
    return match ? match[1] : 'de';
  }

  /**
   * Initialize CodeMirror editor (CodeMirror 5)
   */
  initCodeMirror() {
    if (this.codeMirrorEditor) return; // Already initialized
    
    const textarea = document.getElementById('jsonEditor');
    
    this.codeMirrorEditor = CodeMirror.fromTextArea(textarea, {
      mode: { name: 'javascript', json: true },
      theme: 'dracula',
      lineNumbers: true,
      indentUnit: 2,
      tabSize: 2,
      lineWrapping: true,
      matchBrackets: true,
      autoCloseBrackets: true,
      foldGutter: true,
      gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter']
    });
    
    // Refresh CodeMirror on window resize (for mobile orientation changes)
    window.addEventListener('resize', () => {
      if (this.codeMirrorEditor && this.editor.isJsonMode) {
        this.codeMirrorEditor.refresh();
      }
    });
  }

  /**
   * Get JSON content from CodeMirror
   */
  getJsonContent() {
    if (this.codeMirrorEditor) {
      return this.codeMirrorEditor.getValue();
    }
    return '';
  }

  /**
   * Set JSON content in CodeMirror
   */
  setJsonContent(content) {
    if (this.codeMirrorEditor) {
      this.codeMirrorEditor.setValue(content);
    }
  }

  /**
   * Toggle between UI and JSON mode
   */
  toggleMode() {
    this.editor.isJsonMode = !this.editor.isJsonMode;
    
    if (this.editor.isJsonMode) {
      this.switchToJsonMode();
    } else {
      this.switchToUiMode();
    }
  }

  /**
   * Switch to JSON editing mode
   */
  switchToJsonMode() {
    // Validate current question before switching
    if (!this.validateCurrentQuestion()) {
      return; // Validation failed, don't switch modes
    }
    
    this.syncUIToData();
    
    // Initialize CodeMirror on first use
    this.initCodeMirror();
    
    document.getElementById('uiMode').style.display = 'none';
    document.getElementById('jsonMode').style.display = 'flex'; // Changed from 'block' to 'flex'
    document.getElementById('modeToggleText').textContent = i18n.t('editor_mode_ui');
    
    // Set content in CodeMirror
    this.setJsonContent(JSON.stringify(this.editor.quizData, null, 2));
    
    // Refresh CodeMirror to calculate correct size
    setTimeout(() => {
      if (this.codeMirrorEditor) {
        this.codeMirrorEditor.refresh();
      }
    }, 10);
  }

  /**
   * Switch to UI editing mode
   */
  switchToUiMode() {
    try {
      // Get content from CodeMirror
      const jsonContent = this.getJsonContent();
      this.editor.quizData = JSON.parse(jsonContent);
      this.editor.currentQuestionIdx = Math.min(
        this.editor.currentQuestionIdx, 
        Math.max(0, this.editor.quizData.questions.length - 1)
      );
    } catch (e) {
      this.editor.sessionManager.showMessage(i18n.t('editor_json_invalid', { message: e.message }), true);
      return;
    }

    document.getElementById('uiMode').style.display = 'block';
    document.getElementById('jsonMode').style.display = 'none';
    document.getElementById('modeToggleText').textContent = i18n.t('editor_mode_json');
    this.editor.render();
  }

  /**
   * Apply JSON changes in JSON mode
   */
  applyJSON() {
    try {
      // Get content from CodeMirror
      const jsonContent = this.getJsonContent();
      this.editor.quizData = JSON.parse(jsonContent);
      this.editor.currentQuestionIdx = 0;
      this.editor.render();
      this.editor.sessionManager.showMessage(i18n.t('editor_json_applied'), false);
    } catch (e) {
      this.editor.sessionManager.showMessage(i18n.t('editor_json_invalid', { message: e.message }), true);
    }
  }

  /**
   * Sync UI inputs to quizData before switching modes or saving
   */
  syncUIToData() {
    this.editor.quizData.title = document.getElementById('quizTitle').value;
    
    if (this.editor.quizData.questions.length > 0 && 
        this.editor.currentQuestionIdx < this.editor.quizData.questions.length) {
      
      const q = this.editor.quizData.questions[this.editor.currentQuestionIdx];
      const idx = this.editor.currentQuestionIdx;
      
      const keywordInput = document.querySelector('.keyword-input');
      if (keywordInput) {
        q.keyword = keywordInput.value;
      }
      
      const questionTextInput = document.getElementById(`question-text-input-${idx}`);
      if (questionTextInput) {
        q.text = questionTextInput.value;
      }
      
      const questionReasonTextarea = document.getElementById(`question-reason-${idx}`);
      if (questionReasonTextarea) {
        q.reason = questionReasonTextarea.value;
      }
      
      q.options.forEach((option, cIdx) => {
        const textTextarea = document.getElementById(`option-text-${idx}-${cIdx}`);
        const reasonTextarea = document.getElementById(`option-reason-${idx}-${cIdx}`);
        
        if (textTextarea) {
          option.text = textTextarea.value;
        }
        if (reasonTextarea) {
          option.reason = reasonTextarea.value;
        }
      });
    }
  }

  /**
   * Validate that a question has at least one correct answer
   * @param {number} questionIdx - Index of question to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  validateQuestion(questionIdx) {
    const q = this.editor.quizData.questions[questionIdx];
    
    // No options yet - valid (question is being created)
    if (!q.options || q.options.length === 0) {
      return true;
    }
    
    // NEW FORMAT: Check if at least one option has correct=true
    const hasCorrectAnswer = q.options.some(option => 
      typeof option === 'object' && option.correct === true
    );
    
    return hasCorrectAnswer;
  }

  /**
   * Validate current question before leaving it
   * Shows error message if invalid
   * @returns {boolean} - True if valid, false if invalid
   */
  validateCurrentQuestion() {
    if (this.editor.quizData.questions.length === 0) {
      return true; // No questions to validate
    }
    
    if (this.editor.currentQuestionIdx >= this.editor.quizData.questions.length) {
      return true; // Invalid index
    }
    
    // Sync UI to data first
    this.syncUIToData();
    
    if (!this.validateQuestion(this.editor.currentQuestionIdx)) {
      this.editor.sessionManager.showMessage(i18n.t('editor_validation_mark_correct'), true);
      return false;
    }
    
    return true;
  }

  /**
   * Validate all questions in the quiz
   * @returns {Array} - Array of invalid question indices
   */
  validateAllQuestions() {
    const invalidQuestions = [];
    
    for (let i = 0; i < this.editor.quizData.questions.length; i++) {
      const q = this.editor.quizData.questions[i];
      
      // Skip questions without options (empty questions)
      if (!q.options || q.options.length === 0) {
        continue;
      }
      
      if (!this.validateQuestion(i)) {
        invalidQuestions.push(i);
      }
    }
    
    return invalidQuestions;
  }

  /**
   * Comprehensive validation using ValidationClient
   * Validates entire quiz against schema rules before saving
   * @returns {Object} - { valid: boolean, errors: Array<string> }
   */
  async validateQuizBeforeSave() {
    const errors = [];
    
    // Auto-generate imagePath from title if missing
    if (!this.editor.quizData.imagePath && this.editor.quizData.title) {
      this.editor.quizData.imagePath = this.editor.sessionManager.sanitizeTitleForPath(
        this.editor.quizData.title
      );
    }
    
    // Check if validationClient is available and initialized
    if (!validationClient || !validationClient.rulesLoaded) {
      console.warn('ValidationClient not available, skipping schema validation');
      // Fall back to basic validation
      if (this.editor.quizData.questions.length === 0) {
        errors.push(i18n.t('editor_validation_min_questions'));
      }
      return { valid: errors.length === 0, errors };
    }
    
    // Validate quiz metadata
    try {
      validationClient.validate('Quiz', {
        id: this.editor.quizData.id || this.editor.currentQuizId,
        title: this.editor.quizData.title,
        imagePath: this.editor.quizData.imagePath,
        description: this.editor.quizData.description,
        questions: this.editor.quizData.questions
      });
    } catch (err) {
      // Extract readable error message
      const errorMsg = err.message || String(err);
      errors.push(i18n.t('editor_validation_quiz_metadata', { error: errorMsg }));
      console.error('Quiz metadata validation failed:', err);
    }

    // Check minimum questions
    if (this.editor.quizData.questions.length === 0) {
      errors.push(i18n.t('editor_validation_add_question'));
      return { valid: false, errors }; // Stop here if no questions
    }
    
    // Validate each question
    for (let i = 0; i < this.editor.quizData.questions.length; i++) {
      const q = this.editor.quizData.questions[i];
      const questionNum = i + 1;
      
      // Ensure question has an ID (auto-generate if missing - user doesn't see this field)
      if (!q.id) {
        q.id = `q${i + 1}`;
      }
      
      // Check for empty question text
      if (!q.text || q.text.trim().length === 0) {
        errors.push(i18n.t('editor_validation_question_text_empty', { num: questionNum }));
        continue; // Skip further validation for this question
      }
      
      // Ensure 'type' field exists (default to 'single' if missing)
      if (!q.type) {
        q.type = q.multiple ? 'multiple' : 'single';
      }
      
      try {
        // Validate question structure (uses 'options' as per existing format)
        validationClient.validate('Question', q);
      } catch (err) {
        // Extract readable error message
        const errorMsg = err.message || String(err);
        
        // Skip ID-related errors - user doesn't control this field
        if (errorMsg.toLowerCase().includes('id') || errorMsg.toLowerCase().includes('feld "id"')) {
          console.warn(`Question ${questionNum} ID issue (auto-fixed):`, errorMsg);
          continue; // Don't show ID errors to user
        }
        
        errors.push(i18n.t('editor_validation_question_error', { num: questionNum, error: errorMsg }));
        console.error(`Question ${questionNum} validation failed:`, err);
        continue; // Continue to check other questions
      }

      // Check minimum options
      const options = q.options || [];
      if (options.length < 2) {
        errors.push(i18n.t('editor_validation_min_options', { num: questionNum }));
        continue;
      }
      
      // Validate each option
      for (let j = 0; j < options.length; j++) {
        const option = options[j];
        
        // Skip legacy string options
        if (typeof option === 'string') {
          // Check if string is empty
          if (!option || option.trim().length === 0) {
            errors.push(i18n.t('editor_validation_option_text_empty', { qNum: questionNum, oNum: j + 1 }));
          }
          continue;
        }
        
        // Ensure option has an ID (auto-generate if missing - user doesn't see this field)
        if (!option.id) {
          const letters = 'abcdefghijklmnopqrstuvwxyz';
          option.id = letters[j] || `option_${j + 1}`;
        }
        
        // Check for empty text before validation
        if (!option.text || option.text.trim().length === 0) {
          errors.push(i18n.t('editor_validation_option_text_empty', { qNum: questionNum, oNum: j + 1 }));
          continue; // Skip validation if text is empty
        }
        
        try {
          validationClient.validate('Option', option);
        } catch (err) {
          // Extract readable error message
          const errorMsg = err.message || String(err);
          
          // Skip ID-related errors - user doesn't control this field
          if (errorMsg.toLowerCase().includes('id') || errorMsg.toLowerCase().includes('feld "id"')) {
            console.warn(`Option ${j + 1} ID issue (auto-fixed):`, errorMsg);
            continue; // Don't show ID errors to user
          }
          
          errors.push(i18n.t('editor_validation_option_error', { qNum: questionNum, oNum: j + 1, error: errorMsg }));
          console.error(`Question ${questionNum}, Option ${j + 1} validation failed:`, err);
        }
      }

      // NEW FORMAT: Check at least one correct answer on option level
      const hasCorrect = options.some(option =>
        typeof option === 'object' && option.correct === true
      );

      if (!hasCorrect) {
        errors.push(i18n.t('editor_validation_no_correct', { num: questionNum }));
      }
    }
    
    // Log all errors for debugging
    if (errors.length > 0) {
      console.warn('Quiz validation failed with errors:', errors);
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Save quiz to server
   */
  async saveQuiz() {
    this.syncUIToData();
    
    // NEW: Comprehensive validation before save
    const validation = await this.validateQuizBeforeSave();
    
    if (!validation.valid) {
      console.error('Validation failed with errors:', validation.errors);
      
      // Show first error in status bar
      this.editor.sessionManager.showMessage(validation.errors[0], true);
      
      // Show all errors in toast with better formatting
      const errorCount = validation.errors.length;
      let toastMessage = i18n.t('editor_validation_problems_found', { count: errorCount }) + '\n\n';

      // Show all errors (not just first 5) for better debugging
      validation.errors.forEach((err, idx) => {
        toastMessage += `${idx + 1}. ${err}\n`;
      });

      // Add hint
      toastMessage += '\n💡 ' + i18n.t('editor_validation_fix_hint');
      
      // Try toast first, fallback to alert
      try {
        if (typeof toast !== 'undefined' && toast.error) {
          toast.error(toastMessage, 0); // 0 = no auto-dismiss
        } else {
          throw new Error('Toast not available');
        }
      } catch (toastErr) {
        // Fallback to alert if toast fails
        console.warn('Toast not available, using alert:', toastErr);
        alert(toastMessage);
      }
      
      console.warn('Quiz validation failed. Errors:', validation.errors);
      return; // Block save
    }

    try {
      // Auto-detect and add language field from teacher's Google Translate setting
      const detectedLanguage = this.getTeacherLanguage();
      this.editor.quizData.language = detectedLanguage;
      log(`Quiz language set to: ${detectedLanguage}`);

      const result = await fetchWithErrorHandling('/api/teacher/saveQuiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: this.editor.currentQuizId,
          quiz: this.editor.quizData
        })
      });
      
      // Success
      this.editor.currentQuizId = result.quizId;
      
      // Mark as saved after successful save
      this.editor.changeTracker.markAsSaved();

      this.editor.sessionManager.showMessage(i18n.t('editor_quiz_saved_msg'), false);
      toast.success(i18n.t('editor_quiz_saved_toast'), 3000);
      
      if (!document.getElementById('quizSelect').value) {
        await this.editor.sessionManager.loadQuizList();
      }
    } catch (err) {
      // Error already shown to user by fetchWithErrorHandling
      this.editor.sessionManager.showMessage('Error saving', true);
      console.error('Failed to save quiz:', err);
    }
  }
}