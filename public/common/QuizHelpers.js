/**
 * QuizHelpers.js - Helper functions for quiz frontend
 *
 * Provides utility class for converting relative Markdown image paths
 * to API endpoints.
 */

import { BASE_PATH } from './BasePath.js';

/**
 * Helper class for quiz-related operations
 */
export class QuizUtils {
  /**
   * @param {string} quizId - The ID of the current quiz
   */
  constructor(quizId) {
    this.quizId = quizId;
  }

  /**
   * Processes Markdown text and converts relative image paths
   * to absolute API calls.
   *
   * @param {string} markdownText - The original Markdown text
   * @returns {string} The processed Markdown text
   */
  prepareMarkdown(markdownText) {
    if (!markdownText) return '';

    return markdownText.replace(
      /!\[([^\]]*)\]\(([^)]*)\)/g,
      (match, altText, originalPath) => {
        // Skip if already absolute or API path
        if (originalPath.startsWith('/') || originalPath.includes('?')) {
          return match;
        }

        const filename = originalPath.split('/').pop();
        const basePath = BASE_PATH;
        const newUrl = `${basePath}/api/img?quizId=${this.quizId}&filename=${filename}`;

        return `![${altText}](${newUrl})`;
      }
    );
  }
}
