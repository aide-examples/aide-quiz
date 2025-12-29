/**
 * QuizEditor.js - Main orchestrating class for the quiz editor
 */

import { i18n, appReady } from '../../common/i18n.js';
import { validationClient } from '../../common/ValidationClient.js';
import '../../common/AppHeader.js';

import { ChangeTracker } from './ChangeTracker.js';
import { MarkdownPreview } from './MarkdownPreview.js';
import { SessionManager } from './SessionManager.js';
import { DataSync } from './DataSync.js';
import { QuestionNavigator } from './QuestionNavigator.js';
import { QuestionEditor } from './QuestionEditor.js';
import { MediaManager } from './MediaManager.js';

class QuizEditor {
  constructor() {
    // Data state
    this.quizData = { title: '', imagePath: '', questions: [] };
    this.currentQuizId = null;
    this.currentQuestionIdx = 0;
    this.isJsonMode = false;

    // Initialize components
    this.changeTracker = new ChangeTracker(this);
    this.preview = new MarkdownPreview(this);
    this.sessionManager = new SessionManager(this);
    this.dataSync = new DataSync(this);
    this.navigator = new QuestionNavigator(this);
    this.questionEditor = new QuestionEditor(this);
    this.mediaManager = new MediaManager(this);
  }

  /**
   * Initialize the editor
   */
  async init() {
    // Make editor globally accessible for onclick handlers
    window.quizEditor = this;
    
    // Setup media manager drag and drop
    this.mediaManager.setupDragAndDrop();
    
    // DON'T load quiz list yet - wait until after login
    // (SessionManager.login() will call loadQuizList() after successful login)
    
    // Render initial UI
    this.render();
  }

  /**
   * Render the entire editor UI
   */
  render() {
    document.getElementById('quizTitle').value = this.quizData.title || '';
    this.navigator.render();
    this.questionEditor.render();
  }
}

// Initialize editor when app is ready (DOM + i18n)
appReady.then(async () => {
  // Enable login button now that app is ready
  const loginButton = document.getElementById('loginButton');
  if (loginButton) {
    loginButton.disabled = false;
  }

  const editor = new QuizEditor();
  await editor.init();

  // Initialize validation
  try {
    await validationClient.initialize();

    // Setup live validation for Quiz title
    const titleInput = document.getElementById('quizTitle');
    const titleError = document.getElementById('quizTitleError');

    validationClient.setupInputValidation(titleInput, 'Quiz', 'title', {
      onError: (error) => {
        titleError.textContent = error.message;
        titleError.style.display = 'block';
        titleError.classList.add('error');
      },
      onSuccess: () => {
        titleError.style.display = 'none';
        titleError.classList.remove('error');
      }
    });
  } catch (err) {
    console.warn('Validation initialization failed:', err);
    // Non-critical - editor can still work without client-side validation
  }

  // Warn user about unsaved changes when leaving page
  window.addEventListener('beforeunload', (e) => {
    if (editor.changeTracker.hasUnsavedChanges()) {
      e.preventDefault();
      e.returnValue = ''; // Chrome requires returnValue to be set
    }
  });
});