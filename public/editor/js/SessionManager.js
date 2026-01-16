/**
 * SessionManager.js - Handles authentication, quiz list, and session creation
 */

import { fetchWithErrorHandling, toast } from '../../common/ApiHelpers.js';
import { i18n, appReady } from '../../common/i18n.js';
import { LanguageHelper } from '../../common/LanguageHelper.js';
import { createQRCodeContainer } from '../../common/QRCodeHelper.js';

export class SessionManager {
  constructor(editor) {
    this.editor = editor;
    this.demoMode = false;
  }

  /**
   * Handle teacher login
   */
  async login() {
    const pw = document.getElementById('passwordInput').value;

    try {
      const result = await fetchWithErrorHandling('/api/teacher/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw })
      });

      // Store demo mode flag
      this.demoMode = result.demoMode === true;

      // Success
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('editorScreen').style.display = 'block';

      // Hide create option in demo mode
      if (this.demoMode) {
        // Disable create quiz button and session creation
        document.getElementById('createBtn')?.setAttribute('disabled', 'disabled');
      }

      await this.loadQuizList();

    } catch (err) {
      // Error already shown as toast by fetchWithErrorHandling
      // Also show inline error
      const errEl = document.getElementById('loginError');
      errEl.textContent = i18n.t('editor_password_wrong');
      errEl.style.display = 'block';
    }
  }

  /**
   * Logout and reload page
   */
  logout() {
    location.reload();
  }

  /**
   * Load available quizzes into dropdown
   */
  async loadQuizList() {
    try {
      // Always wait for app to be ready (DOM + i18n) before using translations
      await appReady;

      const data = await fetchWithErrorHandling('/api/teacher/quizzes');
      const select = document.getElementById('quizSelect');

      // Placeholder option that forces onchange event
      select.innerHTML = `<option value="_placeholder" selected disabled>${i18n.t('quiz_select_placeholder')}</option>`;

      // Hide "create new quiz" option in demo mode
      if (!this.demoMode) {
        select.innerHTML += `<option value="">${i18n.t('quiz_create_new')}</option>`;
      }

      data.forEach(q => {
        const opt = document.createElement('option');
        opt.value = q.id;
        opt.textContent = q.title;
        select.appendChild(opt);
      });
    } catch (err) {
      // Error already shown as toast
      console.error('Error loading quiz list:', err);
    }
  }

  /**
   * Load selected quiz from dropdown
   */
  async loadSelectedQuiz() {
    const id = document.getElementById('quizSelect').value;
    
    // Check for unsaved changes before loading another quiz
    if (!this.editor.changeTracker.confirmDiscardChanges()) {
      // User cancelled, revert dropdown to current quiz
      const currentId = this.editor.currentQuizId || '_placeholder';
      document.getElementById('quizSelect').value = currentId;
      return;
    }
    
    // Show/hide create quiz section based on selection
    const createSection = document.getElementById('createQuizSection');
    const titleField = document.getElementById('quizTitle');
    
    // Placeholder or "Neues Quiz erstellen" selected
    if (!id || id === '_placeholder') {
      // "Neues Quiz erstellen" selected
      this.editor.quizData = { title: '', imagePath: '', questions: [] };
      this.editor.currentQuizId = null;
      this.editor.currentQuestionIdx = 0;
      
      // Clear change tracker for new quiz
      this.editor.changeTracker.clear();
      
      // Hide delete button (no quiz loaded)
      document.getElementById('deleteQuizBtn').classList.remove('visible');
      
      // Show create section only if not placeholder
      if (id === '') {
        createSection.style.display = 'flex';
        titleField.value = '';
        titleField.disabled = false;
      } else {
        // Placeholder - hide create section
        createSection.style.display = 'none';
      }
      
      this.editor.render();
      return;
    }
    
    // Existing quiz selected - hide create section
    createSection.style.display = 'none';
    
    try {
      this.editor.quizData = await fetchWithErrorHandling(`/api/teacher/quiz/${id}`);
      
      // MIGRATION: Convert old format (correct on question) to new format (correct on option)
      if (window.migrateQuizFormat) {
        window.migrateQuizFormat(this.editor.quizData);
      }
      
      this.editor.currentQuizId = id;
      this.editor.currentQuestionIdx = 0;
      
      // Mark as saved after loading
      this.editor.changeTracker.markAsSaved();
      
      // Set title field (hidden but needed for backward compatibility)
      titleField.value = this.editor.quizData.title || '';
      titleField.disabled = true;
      
      // Show delete button (quiz loaded)
      document.getElementById('deleteQuizBtn').classList.add('visible');
      
      this.editor.render();
    } catch (err) {
      // Error already shown as toast
      console.error('Error loading quiz:', err);
      // Reset to placeholder
      document.getElementById('quizSelect').value = '_placeholder';
      document.getElementById('deleteQuizBtn').classList.remove('visible');
    }
  }

  /**
   * Sanitize title for filesystem path
   * Converts umlauts and replaces special characters with underscores
   */
  sanitizeTitleForPath(title) {
    return title
      .trim()
      // Convert umlauts
      .replace(/ä/g, 'ae').replace(/Ä/g, 'Ae')
      .replace(/ö/g, 'oe').replace(/Ö/g, 'Oe')
      .replace(/ü/g, 'ue').replace(/Ü/g, 'Ue')
      .replace(/ß/g, 'ss')
      // Replace all special characters with underscore
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      // Replace multiple underscores with single
      .replace(/_+/g, '_')
      // Remove leading/trailing underscores
      .replace(/^_|_$/g, '');
  }

  /**
   * Create a new quiz in the database
   * This happens before the first save
   */
  async createQuiz() {
    // Block in demo mode
    if (this.demoMode) {
      toast.warning(i18n.t('demo_action_blocked'));
      return;
    }

    // Check for unsaved changes before creating new quiz
    if (!this.editor.changeTracker.confirmDiscardChanges()) {
      return; // User cancelled
    }

    const titleInput = document.getElementById('quizTitle');
    const title = titleInput.value.trim();

    if (!title) {
      this.showMessage(i18n.t('quiz_title_required'), true);
      titleInput.focus();
      return;
    }

    // Generate imagePath from title
    const imagePath = this.sanitizeTitleForPath(title);

    if (!imagePath) {
      this.showMessage(i18n.t('quiz_title_invalid_chars'), true);
      return;
    }

    // Get language from user preference (GT cookie or browser)
    const language = LanguageHelper.getPreferredLanguage();

    try {
      const data = await fetchWithErrorHandling('/api/teacher/createQuiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, imagePath, language })
      });
      
      // Quiz is now in DB!
      this.editor.currentQuizId = data.quizId;
      this.editor.quizData = {
        title: data.title,
        imagePath: data.imagePath,
        language: data.language || 'de',
        questions: [
          {
            id: 'q1',
            keyword: '',
            text: '',
            reason: '',
            options: [
              { id: 'a', text: '', reason: '', correct: false },
              { id: 'b', text: '', reason: '', correct: false }
            ],
            points: 1
          }
        ]
      };
      
      // Set current question to the first (and only) question
      this.editor.currentQuestionIdx = 0;
      
      // Mark as saved after creating
      this.editor.changeTracker.markAsSaved();
      
      // Reload quiz list and select the new quiz
      await this.loadQuizList();
      document.getElementById('quizSelect').value = data.quizId;
      
      // Hide create section
      document.getElementById('createQuizSection').style.display = 'none';
      titleInput.disabled = true;
      
      this.showMessage(i18n.t('quiz_created_success'), false);
      this.editor.render();
      
    } catch (err) {
      // Error is already handled and shown by fetchWithErrorHandling
      console.error('Error creating quiz:', err);
    }
  }

  /**
   * Create a new session for the current quiz
   */
  async createSession() {
    // Block in demo mode
    if (this.demoMode) {
      toast.warning(i18n.t('demo_action_blocked'));
      return;
    }

    if (!this.editor.currentQuizId) {
      this.showMessage(i18n.t('editor_load_or_save_first'), true);
      return;
    }

    let durationInput = prompt(i18n.t('editor_session_prompt'));

    if (!durationInput) durationInput = "10";

    let openUntil;
    const now = new Date();

    if (durationInput.length == 5) {
      const [hours, minutes] = durationInput.split(':').map(Number);
      openUntil = new Date(now);
      openUntil.setHours(hours, minutes, 0, 0);
      if (openUntil <= now) {
        this.showMessage(i18n.t('editor_session_future_required'), true);
        return;
      }
    } else {
      let minutes = Number(durationInput);
      if (isNaN(minutes) || minutes < 0) {
        this.showMessage(i18n.t('session_duration_invalid'), true);
        return;
      }
      // 0 = unlimited demo session (results visible immediately)
      if (minutes === 0) {
        openUntil = null;
      } else {
        openUntil = new Date(now.getTime() + minutes * 60000);
      }
    }

    try {
      const result = await fetchWithErrorHandling('/api/teacher/createSession', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: this.editor.currentQuizId,
          open_until: openUntil ? openUntil.toISOString() : null
        })
      });

      document.getElementById('sessionInfo').style.display = 'block';
      document.getElementById('sessionName').textContent = result.sessionName;

      // Generate quiz URL for participants
      const quizUrl = `${window.location.origin}/quiz/?session=${result.sessionName}`;
      this.renderSessionQRCode(quizUrl);

      const endTime = new Date(openUntil).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      this.showMessage(i18n.t('session_created_until', { endTime }), false);
      
    } catch (err) {
      // Error already shown as toast
      console.error('Error creating session:', err);
    }
  }

  /**
   * Delete quiz with confirmation and backup option
   */
  async deleteQuiz() {
    // Block in demo mode
    if (this.demoMode) {
      toast.warning(i18n.t('demo_action_blocked'));
      return;
    }

    const quizId = this.editor.currentQuizId;

    if (!quizId) {
      toast.warning(i18n.t('editor_no_quiz_loaded'));
      return;
    }

    try {
      // Load quiz for backup display
      const quiz = await fetchWithErrorHandling(`/api/teacher/quiz/${quizId}`);
      
      // Show confirmation with backup option
      const message = i18n.t('quiz_delete_confirm_full', { title: quiz.title });

      if (!confirm(message)) {
        return;
      }
      
      // Copy JSON to clipboard
      try {
        await navigator.clipboard.writeText(JSON.stringify(quiz, null, 2));
        toast.success(i18n.t('quiz_json_copied'));
      } catch (clipErr) {
        console.warn('Could not copy to clipboard:', clipErr);
      }
      
      // Final confirmation
      const finalConfirm = confirm(
        i18n.t('quiz_delete_final_confirm', { title: quiz.title })
      );
      
      if (!finalConfirm) {
        toast.info(i18n.t('quiz_delete_cancelled'));
        return;
      }
      
      // DELETE request
      const result = await fetchWithErrorHandling(`/api/teacher/quiz/${quizId}`, {
        method: 'DELETE'
      });
      
      // Show success message with stats
      const statsMsg = i18n.t('quiz_delete_success_stats', {
        sessions: result.deletionStats.sessions,
        submissions: result.deletionStats.submissions
      });

      alert(statsMsg);
      
      // Reset editor and reload quiz list
      this.editor.currentQuizId = null;
      this.editor.quiz = { title: '', imagePath: '', questions: [] };
      this.editor.changeTracker.clear();
      this.editor.questionEditor.renderQuestions();
      
      // Hide delete button
      document.getElementById('deleteQuizBtn').classList.remove('visible');
      
      await this.loadQuizList();
      
      // Reset dropdown to placeholder
      document.getElementById('quizSelect').value = '_placeholder';

      toast.success(i18n.t('quiz_delete_success_toast'));
      
    } catch (err) {
      console.error('Error deleting quiz:', err);
      // Error already shown as toast by fetchWithErrorHandling
    }
  }

  /**
   * Render QR code for session participation
   */
  renderSessionQRCode(url) {
    const container = document.getElementById('sessionQRCode');
    if (!container) return;

    // Clear previous QR code
    container.innerHTML = '';

    const qrContainer = createQRCodeContainer(
      url,
      'large',
      i18n.t('qr_scan_to_join')
    );

    if (qrContainer) {
      container.appendChild(qrContainer);
    }
  }

  /**
   * Show temporary message
   */
  showMessage(text, isError) {
    const msg = document.getElementById('message');
    msg.textContent = text;
    msg.className = isError ? 'message error' : 'message';
    msg.style.display = 'block';
    setTimeout(() => msg.style.display = 'none', 3000);
  }
}