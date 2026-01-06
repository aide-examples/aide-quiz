/**
 * QuizPage.js - Quiz Participation Controller
 *
 * Handles session selection, quiz loading, question navigation,
 * answer collection, and submission.
 */

import { fetchWithErrorHandling, toast } from '../../common/ApiHelpers.js';
import { i18n, appReady } from '../../common/i18n.js';
import { BASE_PATH } from '../../common/BasePath.js';
import { QuizUtils } from '../../common/QuizHelpers.js';
import { renderQuestionWithImages, renderOptionWithImages } from '../../common/ImageRendering.js';
import { validationClient } from '../../common/ValidationClient.js';
import { TranslationHelper } from '../../common/TranslationHelper.js';
import { createQRCodeContainer } from '../../common/QRCodeHelper.js';
import '../../common/AppHeader.js';

/**
 * Quiz page controller
 */
class QuizPage {
  constructor() {
    this.quizData = null;
    this.quizUtil = null;
    this.currentIdx = 0;
    this.answers = [];
    this.sessionName = null;
  }

  /**
   * Initialize the page
   */
  async init() {
    this.translateStaticElements();
    this.generateUserCode();
    await this.initializeValidation();
    await this.loadOpenSessions();
    this.setupEventListeners();
  }

  /**
   * Translate static HTML elements
   */
  translateStaticElements() {
    const t = i18n.t.bind(i18n);

    document.getElementById('quizMainHeading').innerHTML = '\uD83C\uDFAF ' + t('quiz_main_heading');
    document.getElementById('quizSubtitle').textContent = t('quiz_subtitle');
    document.getElementById('sessionLabel').textContent = t('quiz_select_session');
    document.getElementById('nameLabel').textContent = t('quiz_name_label');
    document.getElementById('code').placeholder = t('quiz_name_placeholder');
    document.getElementById('codeInfo').innerHTML = '\uD83D\uDCA1 ' + t('quiz_code_info');
    document.getElementById('joinBtn').innerHTML = t('quiz_btn_start') + ' \uD83D\uDE80';
    document.getElementById('nextBtn').textContent = t('quiz_btn_next');
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    document.getElementById('joinBtn').onclick = () => this.joinQuiz();
    document.getElementById('nextBtn').onclick = () => this.nextQuestion();
  }

  /**
   * Generate random user code (3 pronounceable syllables).
   * 15 consonants × 5 vowels = 75 combinations per syllable.
   * Total: 75³ = 421,875 possible codes (~0.0002% collision probability).
   */
  generateUserCode() {
    let code = '';
    for (let i = 0; i < 3; i++) {
      code += 'bdfghklmnprstwz'.charAt(Math.floor(Math.random() * 15));
      code += 'aeiou'.charAt(Math.floor(Math.random() * 5));
    }
    document.getElementById('code').value = code;
  }

  /**
   * Initialize validation
   */
  async initializeValidation() {
    try {
      await validationClient.initialize();

      const codeInput = document.getElementById('code');
      const codeError = document.getElementById('codeError');

      validationClient.setupInputValidation(codeInput, 'Submission', 'userCode', {
        onError: (error) => {
          codeError.textContent = error.message;
          codeError.style.display = 'block';
          codeError.classList.add('error');
        },
        onSuccess: () => {
          codeError.style.display = 'none';
          codeError.classList.remove('error');
        }
      });
    } catch (err) {
      console.warn('Validation initialization failed:', err);
    }
  }

  /**
   * Load currently open sessions
   */
  async loadOpenSessions() {
    try {
      const data = await fetchWithErrorHandling('/api/sessions/open');
      const now = new Date();
      const activeSessions = data.filter(s => {
        if (!s.open_until) return true;
        return new Date(s.open_until) > now;
      });

      const sel = document.getElementById('sessionSelect');
      sel.innerHTML = '';

      if (activeSessions.length === 0) {
        const opt = document.createElement('option');
        opt.textContent = i18n.t('quiz_no_sessions');
        opt.disabled = true;
        sel.appendChild(opt);
      } else {
        activeSessions.forEach(s => {
          const opt = document.createElement('option');
          opt.value = s.session_name;
          opt.textContent = `${s.title} (${s.session_name})`;
          sel.appendChild(opt);
        });
      }
    } catch (err) {
      const sel = document.getElementById('sessionSelect');
      sel.innerHTML = `<option disabled>\u26A0\uFE0F ${i18n.t('quiz_error_loading')}</option>`;
    }
  }

  /**
   * Join quiz session
   */
  async joinQuiz() {
    const session = document.getElementById('sessionSelect').value.trim();
    const userCode = document.getElementById('code').value.trim();

    if (!session || session.startsWith('\u26A0')) {
      toast.warning(i18n.t('quiz_select_valid_session'));
      return;
    }
    if (!userCode) {
      toast.warning(i18n.t('quiz_enter_name'));
      return;
    }

    try {
      this.quizData = await fetchWithErrorHandling(`/api/session/${encodeURIComponent(session)}/quiz`);

      const translationResult = await TranslationHelper.translateQuizIfNeeded(this.quizData);
      this.quizData = translationResult.quiz;

      this.quizUtil = new QuizUtils(this.quizData.id);
      this.sessionName = session;

      document.getElementById('join').style.display = 'none';
      document.getElementById('quiz').style.display = 'block';
      document.getElementById('quizTitle').innerText = this.quizData.title;

      this.updateProgress();
      this.renderQuestion();

      toast.success(i18n.t('quiz_loaded_success'));
    } catch (err) {
      console.error('Failed to load quiz:', err);
    }
  }

  /**
   * Update progress bar and question info
   */
  updateProgress() {
    const total = this.quizData.questions.length;
    const current = this.currentIdx + 1;
    const percent = (current / total) * 100;
    const keyword = this.quizData.questions[this.currentIdx].keyword;

    const counterEl = document.getElementById('questionCounter');
    counterEl.innerHTML = `${i18n.t('quiz_question_counter', { current, total })} <span class="question-keyword">${keyword}</span>`;
    document.getElementById('progressFill').style.width = `${percent}%`;
  }

  /**
   * Render current question
   */
  renderQuestion() {
    const q = this.quizData.questions[this.currentIdx];
    const el = document.getElementById('questionArea');

    let html = '';

    html += renderQuestionWithImages(q, this.quizData.id, this.quizUtil);

    const isMultiple = q.type === 'multiple' || q.multiple;
    if (isMultiple) {
      html += `
        <div class="multiple-hint">
          <strong>\u26A0\uFE0F ${i18n.t('quiz_multiple_hint_title')}</strong>
          ${i18n.t('quiz_multiple_hint_text')}
        </div>
      `;
    }

    html += '<div class="options-container">';

    const inputType = isMultiple ? 'checkbox' : 'radio';
    q.options.forEach((option, idx) => {
      html += renderOptionWithImages(option, this.quizData.id, this.quizUtil, inputType, idx);
    });

    html += '</div>';
    el.innerHTML = html;

    this.setupOptionHandlers();
  }

  /**
   * Set up option click handlers
   */
  setupOptionHandlers() {
    document.querySelectorAll('.option-item').forEach(item => {
      item.addEventListener('click', function(e) {
        const input = this.querySelector('input');
        if (e.target.tagName !== 'INPUT') {
          if (input.type === 'radio') {
            document.querySelectorAll('.option-item').forEach(i => i.classList.remove('selected'));
            this.classList.add('selected');
            input.checked = true;
          } else {
            input.checked = !input.checked;
            this.classList.toggle('selected', input.checked);
          }
        } else {
          if (input.type === 'radio') {
            document.querySelectorAll('.option-item').forEach(i => i.classList.remove('selected'));
            this.classList.add('selected');
          } else {
            this.classList.toggle('selected', input.checked);
          }
        }
      });
    });
  }

  /**
   * Handle next question button
   */
  nextQuestion() {
    const q = this.quizData.questions[this.currentIdx];
    let chosen = [];

    if (q.multiple) {
      const checks = document.querySelectorAll('input[name="option"]:checked');
      checks.forEach(c => chosen.push(c.value));
    } else {
      const radio = document.querySelector('input[name="option"]:checked');
      if (radio) chosen = [radio.value];
    }

    if (chosen.length === 0 && !q.multiple) {
      toast.warning(i18n.t('quiz_select_answer'));
      return;
    } else if (chosen.length <= 1 && q.multiple) {
      toast.warning(i18n.t('quiz_select_multiple'));
      return;
    }

    this.answers.push({ questionId: q.id, chosen });
    this.currentIdx++;

    if (this.currentIdx >= this.quizData.questions.length) {
      this.submit();
    } else {
      this.updateProgress();
      this.renderQuestion();
      window.scrollTo(0, 0);
    }
  }

  /**
   * Submit quiz
   */
  async submit() {
    const userCode = document.getElementById('code').value.trim();

    try {
      const obj = await fetchWithErrorHandling(`/api/session/${encodeURIComponent(this.sessionName)}/submit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userCode, answers: this.answers })
      });

      const fullUrl = `${window.location.origin}${obj.resultLink}`;

      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal-box">
          <h3>\uD83C\uDF89 ${i18n.t('quiz_completed_title')}</h3>
          <p><strong>${i18n.t('quiz_completed_score', { score: obj.score, maxScore: obj.maxScore })}</strong></p>
          <p>${i18n.t('quiz_completed_link_text')}</p>
          <input type="text"
                value="${fullUrl}"
                onclick="this.select()"
                readonly>
          <p style="font-size: 14px; color: #6c757d;">
            \uD83D\uDCBE ${i18n.t('quiz_completed_save_hint')}
          </p>
          <div id="completionQRCode" class="completion-qr-code"></div>
          <button class="btn btn-primary" onclick="window.location.href='${obj.resultLink}'">
            ${i18n.t('quiz_btn_view_results')}
          </button>
          <button class="btn btn-secondary" onclick="location.reload()" style="margin-left: 8px;">
            ${i18n.t('quiz_btn_new_quiz')}
          </button>
        </div>
      `;

      document.body.appendChild(overlay);

      // Add QR code to completion dialog
      const qrContainer = createQRCodeContainer(fullUrl, 'normal', i18n.t('qr_save_result'));
      if (qrContainer) {
        document.getElementById('completionQRCode').appendChild(qrContainer);
      }
      toast.success(i18n.t('quiz_completed_success'));
    } catch (err) {
      console.error('Submission failed:', err);
    }
  }
}

// Initialize when app is ready
appReady.then(() => new QuizPage().init());
