/**
 * StatsPage.js - Statistics Page Controller
 *
 * Handles session selection, statistics loading, chart rendering,
 * and question analysis display.
 */

import { fetchWithErrorHandling, toast, log } from '../../common/ApiHelpers.js';
import { i18n, appReady } from '../../common/i18n.js';
import { BASE_PATH } from '../../common/BasePath.js';
import { QuizUtils } from '../../common/QuizHelpers.js';
import { renderQuestionWithImages } from '../../common/ImageRendering.js';
import { TranslationHelper } from '../../common/TranslationHelper.js';
import { GoogleTranslateHelper } from '../../common/GoogleTranslateHelper.js';
import '../../common/AppHeader.js'; // Auto-initializes header

/**
 * Statistics page controller
 */
class StatsPage {
  constructor() {
    this.statsData = null;
    this.quizData = null;
    this.currentFilter = 'all';
    this.overviewChart = null;
  }

  /**
   * Initialize the page
   */
  async init() {
    await this.loadAllSessions();
    this.setupEventListeners();
    this.setupLanguageChangeListener();
    this.translateStaticElements();
  }

  /**
   * Translate static HTML elements
   */
  translateStaticElements() {
    const t = i18n.t.bind(i18n);

    document.getElementById('statsMainHeading').innerHTML = '📊 ' + t('stats_main_heading');
    document.getElementById('statsSubtitle').textContent = t('stats_subtitle');
    document.getElementById('sessionLabel').textContent = t('stats_select_session');
    document.getElementById('loadBtn').textContent = t('stats_btn_open');
    document.getElementById('chartTitle').textContent = t('stats_chart_title');
    document.getElementById('detailedHeader').innerHTML = '📝 ' + t('stats_detailed_header');
    document.getElementById('filterAll').textContent = t('stats_filter_all');
    document.getElementById('filterDifficult').textContent = t('stats_filter_difficult');
    document.getElementById('filterEasy').textContent = t('stats_filter_easy');
    document.getElementById('loadingText').textContent = t('stats_loading');
    document.getElementById('noDataText').textContent = t('stats_no_data');
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    document.getElementById('loadBtn').onclick = () => this.loadStatistics();

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter;
        if (this.statsData) this.displayQuestionList();
      });
    });
  }

  /**
   * Load all sessions into dropdown
   */
  async loadAllSessions() {
    try {
      const data = await fetchWithErrorHandling('/api/sessions/all?limit=100');
      const sel = document.getElementById('sessionSelect');
      sel.innerHTML = '';

      if (!data.sessions || data.sessions.length === 0) {
        const opt = document.createElement('option');
        opt.textContent = i18n.t('stats_no_sessions');
        opt.disabled = true;
        sel.appendChild(opt);
        toast.info(i18n.t('stats_no_sessions_found'), 5000);
      } else {
        data.sessions.forEach(s => {
          const opt = document.createElement('option');
          opt.value = s.session_name;
          opt.textContent = `${s.title} (${s.session_name})`;
          sel.appendChild(opt);
        });
      }
    } catch (err) {
      console.warn('Failed to load all sessions, trying open sessions:', err);
      try {
        const data = await fetchWithErrorHandling('/api/sessions/open');
        const sel = document.getElementById('sessionSelect');
        sel.innerHTML = '';
        if (data && Array.isArray(data)) {
          data.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.session_name;
            opt.textContent = `${s.title} (${s.session_name})`;
            sel.appendChild(opt);
          });
        }
      } catch (fallbackErr) {
        const sel = document.getElementById('sessionSelect');
        sel.innerHTML = `<option disabled>${i18n.t('stats_error_loading')}</option>`;
      }
    }
  }

  /**
   * Load and display statistics
   */
  async loadStatistics() {
    const session = document.getElementById('sessionSelect').value.trim();

    if (!session) {
      toast.warning(i18n.t('stats_select_valid_session'));
      return;
    }

    document.getElementById('loading').style.display = 'block';
    document.getElementById('statsContent').style.display = 'none';
    document.getElementById('noData').style.display = 'none';

    try {
      this.statsData = await fetchWithErrorHandling(`/api/session/${encodeURIComponent(session)}/stats`);
      this.quizData = await fetchWithErrorHandling(`/api/session/${encodeURIComponent(session)}/quiz?forStat=true`);

      const translationResult = await TranslationHelper.translateQuizIfNeeded(this.quizData);
      this.quizData = translationResult.quiz;

      this.displayStatistics(session);

      document.getElementById('loading').style.display = 'none';
      document.getElementById('statsContent').style.display = 'block';

      this.triggerGoogleTranslateRefresh();
      toast.success(i18n.t('stats_loaded_success'), 3000);
    } catch (err) {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('noData').style.display = 'block';
      console.error('Failed to load statistics:', err);
    }
  }

  /**
   * Display all statistics sections
   */
  displayStatistics(session) {
    if (!this.statsData) return;

    this.displayOverviewCards();
    this.displayOverviewChart();
    this.displayQuestionList();
  }

  /**
   * Display overview cards
   */
  displayOverviewCards() {
    const overview = document.getElementById('statsOverview');
    const totalQuestions = this.statsData.questionStats.length;
    const totalParticipants = this.statsData.participants;

    let totalCorrect = 0;
    let totalAnswers = 0;
    this.statsData.questionStats.forEach(q => {
      totalCorrect += q.correctCount;
      totalAnswers += q.total;
    });
    const avgSuccess = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;

    let mostDifficult = null;
    let lowestRate = 100;
    this.statsData.questionStats.forEach(q => {
      const rate = q.total > 0 ? (q.correctCount / q.total) * 100 : 0;
      if (rate < lowestRate) {
        lowestRate = rate;
        mostDifficult = q;
      }
    });

    // Get translated keyword for most difficult question
    let mostDifficultKeyword = i18n.t('stats_na');
    if (mostDifficult && this.quizData && this.quizData.questions) {
      const translatedQ = this.quizData.questions.find(
        qq => qq.id === mostDifficult.id || qq.keyword === mostDifficult.keyword
      );
      mostDifficultKeyword = translatedQ ? translatedQ.keyword : mostDifficult.keyword;
    }

    overview.innerHTML = `
      <div class="stat-card info">
        <div class="stat-label">${i18n.t('stats_participants')}</div>
        <div class="stat-value">${totalParticipants}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${i18n.t('stats_questions')}</div>
        <div class="stat-value">${totalQuestions}</div>
      </div>
      <div class="stat-card ${avgSuccess >= 70 ? 'success' : avgSuccess >= 50 ? 'warning' : ''}">
        <div class="stat-label">${i18n.t('stats_average')}</div>
        <div class="stat-value">${avgSuccess}%</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-label">${i18n.t('stats_most_difficult')}</div>
        <div class="stat-value">${mostDifficult ? Math.round(lowestRate) : 0}%</div>
        <div style="font-size: 12px; margin-top: 4px;">${mostDifficultKeyword}</div>
      </div>
    `;
  }

  /**
   * Display overview chart
   */
  displayOverviewChart() {
    const ctx = document.getElementById('overviewChart').getContext('2d');

    if (this.overviewChart) {
      this.overviewChart.destroy();
    }

    const labels = this.statsData.questionStats.map(q => {
      if (this.quizData && this.quizData.questions) {
        const translatedQ = this.quizData.questions.find(qq => qq.id === q.id || qq.keyword === q.keyword);
        return translatedQ ? translatedQ.keyword : q.keyword;
      }
      return q.keyword;
    });

    const successRates = this.statsData.questionStats.map(q => {
      return q.total > 0 ? Math.round((q.correctCount / q.total) * 100) : 0;
    });

    const backgroundColors = successRates.map(rate => {
      if (rate >= 80) return 'rgba(40, 167, 69, 0.8)';
      if (rate >= 50) return 'rgba(255, 193, 7, 0.8)';
      return 'rgba(220, 53, 69, 0.8)';
    });

    this.overviewChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: i18n.t('stats_success_rate'),
          data: successRates,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(c => c.replace('0.8', '1')),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                const q = this.statsData.questionStats[context.dataIndex];
                return [
                  i18n.t('stats_tooltip_success_rate', { rate: context.parsed.y }),
                  i18n.t('stats_tooltip_correct_of', { correct: q.correctCount, total: q.total })
                ];
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: (value) => value + '%'
            }
          }
        }
      }
    });
  }

  /**
   * Display question list
   */
  displayQuestionList() {
    const list = document.getElementById('questionList');
    list.innerHTML = '';

    if (!this.quizData || !this.quizData.questions) {
      list.innerHTML = `<div class="no-data">${i18n.t('stats_question_data_unavailable')}</div>`;
      return;
    }

    const quizUtil = new QuizUtils(this.quizData.id);
    const basePath = BASE_PATH || '';

    this.statsData.questionStats.forEach((q, idx) => {
      const successRate = q.total > 0 ? Math.round((q.correctCount / q.total) * 100) : 0;

      if (this.currentFilter === 'difficult' && successRate >= 50) return;
      if (this.currentFilter === 'easy' && successRate <= 80) return;

      const fullQuestion = this.quizData.questions.find(qq => qq.id === q.id || qq.keyword === q.keyword);

      const questionDiv = document.createElement('div');
      questionDiv.className = 'question-item';
      questionDiv.dataset.index = idx;

      // Extract correct answer IDs - supports both formats
      let correctAnswers = [];

      // NEW FORMAT: fullQuestion.options[].correct = true/false
      if (fullQuestion && fullQuestion.options && Array.isArray(fullQuestion.options)) {
        correctAnswers = fullQuestion.options
          .filter(option => typeof option === 'object' && option.correct === true)
          .map(option => option.id);
      }
      // OLD FORMAT fallback: q.correct from stats data
      if (correctAnswers.length === 0 && q.correct) {
        correctAnswers = Array.isArray(q.correct) ? q.correct : [q.correct];
      }

      const optionEntries = [];
      if (fullQuestion && fullQuestion.options) {
        fullQuestion.options.forEach((option, optionIdx) => {
          const optionId = typeof option === 'string'
            ? String.fromCharCode(97 + optionIdx)
            : option.id;
          const optionText = typeof option === 'string' ? option : option.text;
          const counts = q.optionCounts || {};
          const count = counts[optionId] || 0;
          optionEntries.push([optionId, count, optionText, option]);
        });
      } else {
        Object.entries(q.optionCounts || {}).forEach(([id, count]) => {
          optionEntries.push([id, count, null, null]);
        });
      }

      let questionHtml = '';
      if (fullQuestion && fullQuestion.text) {
        questionHtml = renderQuestionWithImages(fullQuestion, this.quizData.id, quizUtil);
      } else {
        questionHtml = `<div class="question-text-only">${i18n.t('stats_no_question_text')}</div>`;
      }

      const translatedKeyword = fullQuestion ? fullQuestion.keyword : q.keyword;
      questionDiv.innerHTML = `
        <div class="question-item-header">
          <div class="question-keyword">${translatedKeyword}</div>
          <div class="question-stats">
            <div class="question-stat">
              <span class="question-stat-icon">${successRate >= 70 ? '\u2705' : successRate >= 50 ? '\u26A0\uFE0F' : '\u274C'}</span>
              <span>${successRate}%</span>
            </div>
            <div class="question-stat">
              <span class="question-stat-icon">\uD83D\uDC65</span>
              <span>${q.correctCount}/${q.total}</span>
            </div>
          </div>
        </div>

        ${questionHtml}

        <div class="answer-distribution">
          <div class="answer-distribution-title">${i18n.t('stats_answer_distribution')}</div>
          ${optionEntries.map(([optionId, count, optionText, optionObj]) => {
            const percentage = q.total > 0 ? Math.round((count / q.total) * 100) : 0;
            const isCorrect = correctAnswers.includes(optionId);
            const colorClass = isCorrect ? 'correct' : 'incorrect';

            let renderedOptionHtml = '';
            if (optionObj && typeof optionObj === 'object') {
              const text = optionObj.text || '';
              const images = optionObj.image || '';

              let imagesHtml = '';
              if (images) {
                const imageList = images.split(/,\s*/).filter(img => img);
                imagesHtml = imageList.map(img =>
                  `<img src="${basePath}/api/img?quizId=${this.quizData.id}&filename=${encodeURIComponent(img)}"
                        alt="${img}"
                        style="max-height: 60px; max-width: 90px; margin-right: 8px; border-radius: 4px; vertical-align: middle;"
                        loading="lazy">`
                ).join('');
              }

              if (text) {
                const preparedText = quizUtil.prepareMarkdown(text);
                renderedOptionHtml = imagesHtml + marked.parse(preparedText).replace(/<\/?p[^>]*>/g, '').trim();
              } else {
                renderedOptionHtml = imagesHtml;
              }
            } else if (optionText) {
              const preparedText = quizUtil.prepareMarkdown(optionText);
              renderedOptionHtml = marked.parse(preparedText).replace(/<\/?p[^>]*>/g, '').trim();
            }

            return `
              <div class="answer-bar-container">
                <div class="answer-bar-label">
                  <span><strong>${optionId}</strong> ${isCorrect ? '\u2713 ' + i18n.t('stats_correct') : ''}</span>
                  <span>${count} (${percentage}%)</span>
                </div>
                ${renderedOptionHtml ? `<div class="answer-text">${renderedOptionHtml}</div>` : ''}
                <div class="answer-bar-wrapper">
                  <div class="answer-bar-fill ${colorClass}" style="width: ${percentage}%">
                    ${percentage > 10 ? percentage + '%' : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;

      list.appendChild(questionDiv);
    });

    if (list.children.length === 0) {
      list.innerHTML = `<div class="no-data">${i18n.t('stats_no_questions_filter')}</div>`;
    }
  }

  /**
   * Force Google Translate to re-scan DOM
   */
  triggerGoogleTranslateRefresh() {
    const gtFrame = document.querySelector('.goog-te-banner-frame');
    if (!gtFrame) return;

    log('[GT-Trigger] Refreshing Google Translate...');

    setTimeout(() => {
      const trigger = document.createElement('span');
      trigger.style.display = 'none';
      trigger.textContent = 'gt-trigger';
      document.body.appendChild(trigger);

      setTimeout(() => {
        document.body.removeChild(trigger);
      }, 50);
    }, 100);
  }

  /**
   * Watch for language changes via Google Translate
   */
  setupLanguageChangeListener() {
    GoogleTranslateHelper.setupLanguageChangeListener(() => {
      if (this.statsData && this.quizData) {
        toast.info(i18n.t('stats_language_changed'), 2000);
        this.loadStatistics();
      }
    });
  }
}

// Initialize when app is ready
appReady.then(() => new StatsPage().init());
