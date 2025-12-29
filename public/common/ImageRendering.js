/**
 * ImageRendering.js - Image Rendering Helpers
 *
 * Functions to render questions, options, and reasons with optional image arrays.
 */

import { BASE_PATH } from './BasePath.js';

/**
 * Render images array as HTML
 * @param {string} imagesText - Comma-separated image filenames
 * @param {string} quizId - Quiz ID for image URL
 * @param {string} containerClass - CSS class for container
 * @returns {string} HTML string
 */
export function renderImages(imagesText, quizId, containerClass = 'question-images') {
  if (!imagesText) {
    return '';
  }
  const images = imagesText.split(/,\s*/);
  const basePath = BASE_PATH;

  let html = `<div class="${containerClass}">`;
  images.forEach(filename => {
    const imageUrl = `${basePath}/api/img?quizId=${quizId}&filename=${encodeURIComponent(filename)}`;
    html += `<img src="${imageUrl}" alt="${filename}" onerror="this.classList.add('error')" loading="lazy">`;
  });
  html += '</div>';

  return html;
}

/**
 * Render question with optional images
 * @param {object} question - Question object
 * @param {string} quizId - Quiz ID
 * @param {object} quizUtil - QuizUtils instance for markdown processing
 * @returns {string} HTML string
 */
export function renderQuestionWithImages(question, quizId, quizUtil) {
  const preparedText = quizUtil.prepareMarkdown(question.text);
  const textHtml = marked.parse(preparedText);

  const hasImages = question.image && question.image.length > 0;

  if (!hasImages) {
    return `<div class="question-text-only">${textHtml}</div>`;
  }

  const imagesHtml = renderImages(question.image, quizId, 'question-images');

  return `
    <div class="question-with-images">
      ${imagesHtml}
      <div class="question-text">${textHtml}</div>
    </div>
  `;
}

/**
 * Render option with optional images
 * @param {object|string} option - Option object or string
 * @param {string} quizId - Quiz ID
 * @param {object} quizUtil - QuizUtils instance
 * @param {string} inputType - 'radio' or 'checkbox'
 * @param {number} index - Option index
 * @returns {string} HTML string
 */
export function renderOptionWithImages(option, quizId, quizUtil, inputType, index) {
  const isString = typeof option === 'string';
  const optionId = isString ? String.fromCharCode(97 + index) : option.id;
  const text = isString ? option : option.text;
  const images = isString ? null : option.image;

  const preparedText = quizUtil.prepareMarkdown(text);
  const textHtml = marked.parse(preparedText).replace(/<\/?p[^>]*>/g, '').trim();

  const hasImages = images && images.length > 0;

  if (!hasImages) {
    return `
      <label class="option-item option-text-only" data-option="${optionId}">
        <input type="${inputType}" name="option" value="${optionId}" class="option-checkbox">
        <div class="option-content option-text">
          <span class="option-id">${optionId}:</span>
          ${textHtml}
        </div>
      </label>
    `;
  }

  const imagesHtml = renderImages(images, quizId, 'option-images');

  return `
    <label class="option-item option-with-images" data-option="${optionId}">
      <input type="${inputType}" name="option" value="${optionId}" class="option-checkbox">
      ${imagesHtml}
      <div class="option-text">
        <span class="option-id">${optionId}:</span>
        ${textHtml}
      </div>
    </label>
  `;
}

/**
 * Render reason with optional images
 * @param {string} reasonText - Reason text (markdown)
 * @param {string[]} reasonImages - Array of image filenames
 * @param {string} quizId - Quiz ID
 * @param {object} quizUtil - QuizUtils instance
 * @returns {string} HTML string
 */
export function renderReasonWithImages(reasonText, reasonImages, quizId, quizUtil) {
  if (!reasonText) return '';

  const preparedText = quizUtil.prepareMarkdown(reasonText);
  const textHtml = marked.parse(preparedText);

  const hasImages = reasonImages && reasonImages.length > 0;

  if (!hasImages) {
    return `<div class="reason-text-only">${textHtml}</div>`;
  }

  const imagesHtml = renderImages(reasonImages, quizId, 'reason-images');

  return `
    <div class="reason-with-images">
      ${imagesHtml}
      <div class="reason-text">${textHtml}</div>
    </div>
  `;
}
