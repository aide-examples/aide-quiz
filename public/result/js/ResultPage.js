/**
 * ResultPage.js - Quiz Result Display Controller
 *
 * Handles loading and displaying quiz results with translation support.
 */

import { fetchWithErrorHandling, toast } from '../../common/ApiHelpers.js';
import { i18n, appReady } from '../../common/i18n.js';
import { BASE_PATH } from '../../common/BasePath.js';
import { QuizUtils } from '../../common/QuizHelpers.js';
import { renderQuestionWithImages, renderImages, renderReasonWithImages } from '../../common/ImageRendering.js';
import { GoogleTranslateHelper } from '../../common/GoogleTranslateHelper.js';
import { TranslationHelper } from '../../common/TranslationHelper.js';
import '../../common/AppHeader.js';

/**
 * Result page controller
 */
class ResultPage {
  constructor() {
    this.resultId = null;
    this.resultLoaded = false;
  }

  /**
   * Initialize the page
   */
  async init() {
    this.translateStaticElements();

    const params = new URLSearchParams(window.location.search);
    this.resultId = params.get('id');

    if (!this.resultId) {
      document.getElementById('title').innerText = i18n.t('result_error');
      document.getElementById('content').innerText = i18n.t('result_no_id');
      toast.error(i18n.t('result_no_link'), 0);
    } else {
      await this.loadResult();
      this.setupLanguageChangeListener();
    }
  }

  /**
   * Translate static HTML elements
   */
  translateStaticElements() {
    document.getElementById('title').textContent = i18n.t('result_loading');
  }

  /**
   * Translate result if user's language differs from quiz language.
   * Uses TranslationHelper for the API call, then maps translations to result details.
   */
  async translateResultIfNeeded(resultData) {
    const translationResult = await TranslationHelper.translateQuizIfNeeded({
      id: resultData.quizId,
      language: resultData.quizLanguage || 'de'
    });

    if (!translationResult.translated) {
      return resultData;
    }

    // Map translated quiz data to result details
    const translatedQuiz = translationResult.quiz;
    resultData.details.forEach(detail => {
      const translatedQuestion = translatedQuiz.questions.find(
        q => q.id === detail.questionId || q.keyword === detail.keyword
      );

      if (translatedQuestion) {
        detail.keyword = translatedQuestion.keyword || detail.keyword;
        detail.text = translatedQuestion.text || translatedQuestion.question;
        detail.reason = translatedQuestion.reason || translatedQuestion.explanation;

        if (translatedQuestion.options && detail.options) {
          detail.options = detail.options.map((option, idx) => {
            const translatedOption = translatedQuestion.options[idx];
            if (typeof option === 'string' && typeof translatedOption === 'string') {
              return translatedOption;
            } else if (typeof option === 'object' && typeof translatedOption === 'object') {
              return {
                ...option,
                text: translatedOption.text || option.text,
                reason: translatedOption.reason || option.reason
              };
            }
            return option;
          });
        }
      }
    });

    if (translatedQuiz.title) {
      resultData.quizTitle = translatedQuiz.title;
    }

    return resultData;
  }

  /**
   * Load and display result
   */
  async loadResult() {
    try {
      let data = await fetchWithErrorHandling('/api/result/' + this.resultId);

      if (data.open_after && data.open_after !== true) {
        this.displayNotYetAvailable(data.open_after);
        return;
      }

      data = await this.translateResultIfNeeded(data);
      this.displayResult(data);
      this.resultLoaded = true;

    } catch (err) {
      document.getElementById('title').innerText = i18n.t('result_error_loading');
      document.getElementById('content').innerHTML = `
        <div style="text-align:center; padding:50px;">
          <h2>\u26A0\uFE0F ${i18n.t('result_could_not_load')}</h2>
          <p>${i18n.t('result_check_link')}</p>
        </div>
      `;
      console.error('Failed to load result:', err);
    }
  }

  /**
   * Display "not yet available" message
   */
  displayNotYetAvailable(openAfter) {
    const openDate = new Date(openAfter);
    document.getElementById('title').innerText = '\u23F0 ' + i18n.t('result_session_active');
    document.getElementById('content').innerHTML = `
      <div style="text-align:center; padding:50px;">
        <h2>${i18n.t('result_not_yet_available')}</h2>
        <p style="font-size:1.2em;">${i18n.t('result_available_from', { time: openDate.toLocaleString() })}</p>
        <p style="margin-top:30px;">\uD83D\uDCA1 <strong>Tip:</strong> ${i18n.t('result_save_link_tip')}</p>
        <p style="word-break:break-all; background:#f0f0f0; padding:10px; border-radius:5px;">${window.location.href}</p>
      </div>
    `;
    toast.info(i18n.t('result_available_toast', { time: openDate.toLocaleTimeString() }), 8000);
  }

  /**
   * Display the result
   */
  displayResult(data) {
    document.getElementById('title').innerText = data.quizTitle || i18n.t('result_fallback_title');

    const quizUtil = new QuizUtils(data.quizId);
    const basePath = BASE_PATH || '';
    let html = '';

    data.percentage = Math.round(data.score * 100 / data.maxScore);

    html += `<div class="result-header">
      <div class="student-name">
        \uD83D\uDC64 ${data.userCode} \u00A0 \u2014 \u00A0 ${data.score} / ${data.maxScore} ${i18n.t('result_points')} \u00A0 ( ${data.percentage} % )
      </div>
    </div>`;

    html += `<h4 class="section-title">\uD83D\uDCCA ${i18n.t('result_summary')}</h4>`;
    html += this.renderSummaryTable(data);

    html += `<h4 class="section-title">\uD83D\uDCDD ${i18n.t('result_detailed')}</h4>`;
    html += this.renderDetailedResults(data, quizUtil, basePath);

    document.getElementById('content').innerHTML = html;

    this.showCompletionToast(data.percentage);
  }

  /**
   * Render summary table
   */
  renderSummaryTable(data) {
    let html = `<div class="summary-table"><table>
      <tr>
        <th>${i18n.t('result_table_keyword')}</th>
        <th>${i18n.t('result_table_correct')}</th>
        <th>${i18n.t('result_table_your_answer')}</th>
        <th>${i18n.t('result_table_points')}</th>
        <th>${i18n.t('result_table_average')}</th>
      </tr>`;

    for (const d of data.details) {
      const right = (d.correct || []).join(', ');
      const chosen = (d.chosen || []).join(', ');
      const avg = d.avgCorrectPercent !== null ? `${d.avgCorrectPercent}%` : '\u2014';
      html += `<tr>
        <td><strong>${d.keyword}</strong></td>
        <td>${right}</td>
        <td>${chosen || '\u2014'}</td>
        <td><strong>${d.points}</strong> / ${d.maxPoints}</td>
        <td>${avg}</td>
      </tr>`;
    }

    html += `</table></div>`;
    return html;
  }

  /**
   * Render detailed results
   */
  renderDetailedResults(data, quizUtil, basePath) {
    let html = '';

    for (const d of data.details) {
      const correctIds = new Set(d.correct || []);
      const chosenIds = new Set(d.chosen || []);
      const isFullyCorrect = (d.points === d.maxPoints) && (d.maxPoints > 0);
      const isPartial = d.points > 0 && d.points < d.maxPoints;

      const cardClass = isFullyCorrect ? 'correct' : 'incorrect';
      const pointsClass = isFullyCorrect ? 'full' : (isPartial ? 'partial' : 'zero');

      html += `<div class="question-card ${cardClass}">`;

      html += `<div class="question-header">
        <div class="question-keyword">${d.keyword}</div>
        <div class="points-badge ${pointsClass}">
          ${d.points} / ${d.maxPoints} ${i18n.t('result_points')}
        </div>
      </div>`;

      const questionObj = { text: d.text, image: d.image || [] };
      html += renderQuestionWithImages(questionObj, data.quizId, quizUtil);

      html += `<div class="answers-label">${i18n.t('result_answers')}</div>`;

      for (let i = 0; i < (d.options || []).length; i++) {
        const option = d.options[i];
        const optionId = this.getOptionId(option, i);

        const isChosen = chosenIds.has(optionId);
        const isCorrect = correctIds.has(optionId);

        let cssClass = 'answer-not-chosen';
        let marker = '';

        if (isChosen && isCorrect) {
          cssClass = 'answer-chosen-correct';
          marker = '\u2705';
        } else if (isChosen && !isCorrect) {
          cssClass = 'answer-chosen-wrong';
          marker = '\u274C';
        } else if (!isChosen && isCorrect) {
          cssClass = 'answer-correct';
          marker = '\uD83D\uDCA1';
        }

        const rawText = typeof option === 'string' ? option : option.text;
        const optionImages = (typeof option === 'object' && option.image) ? option.image : null;

        html += `<div class="answer-item ${cssClass}">
          <span class="answer-label">${optionId}:</span>`;

        if (optionImages && optionImages.length > 0) {
          const imagesHtml = renderImages(optionImages, data.quizId, 'option-images');
          const preparedText = quizUtil.prepareMarkdown(rawText);
          const textHtml = marked.parse(preparedText).replace(/<\/?p[^>]*>/g, '').trim();
          html += `${imagesHtml}<div class="option-text">${textHtml}</div>`;
        } else {
          const preparedText = quizUtil.prepareMarkdown(rawText);
          const textHtml = marked.parse(preparedText).replace(/<\/?p[^>]*>/g, '').trim();
          html += textHtml;
        }

        html += `<span class="answer-marker">${marker}</span>`;

        const reason = (typeof option === 'object') ? option.reason : null;
        const reasonImages = (typeof option === 'object') ? option.reasonImage : null;

        if (reason && (isChosen || isCorrect)) {
          html += renderReasonWithImages(reason, reasonImages, data.quizId, quizUtil);
        }

        html += `</div>`;
      }

      if (d.reason) {
        html += `<div class="question-reason">
          <strong>\u2139\uFE0F ${i18n.t('result_explanation')}</strong>
          <div class="question-reason-content">`;
        html += renderReasonWithImages(d.reason, d.reasonImage, data.quizId, quizUtil);
        html += `</div></div>`;
      }

      html += `</div>`;
    }

    return html;
  }

  /**
   * Get option ID
   */
  getOptionId(option, index) {
    if (typeof option === 'string') return String.fromCharCode(65 + index);
    return option.id || String.fromCharCode(65 + index);
  }

  /**
   * Show completion toast based on percentage
   */
  showCompletionToast(percentage) {
    if (percentage >= 80) {
      toast.success(i18n.t('result_excellent', { percentage }) + ' \uD83C\uDF89', 5000);
    } else if (percentage >= 60) {
      toast.success(i18n.t('result_well_done', { percentage }) + ' \uD83D\uDC4D', 5000);
    } else {
      toast.info(i18n.t('result_keep_practicing', { percentage }) + ' \uD83D\uDCDA', 5000);
    }
  }

  /**
   * Watch for language changes via Google Translate
   */
  setupLanguageChangeListener() {
    GoogleTranslateHelper.setupLanguageChangeListener(() => {
      if (this.resultLoaded && this.resultId) {
        toast.info(i18n.t('result_language_changed'), 2000);
        this.loadResult();
      }
    });
  }
}

// Initialize when app is ready
appReady.then(() => new ResultPage().init());
