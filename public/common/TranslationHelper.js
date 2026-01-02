/**
 * TranslationHelper.js - Quiz Translation Utility
 *
 * Handles automatic quiz translation based on user's preferred language.
 */

import { fetchWithErrorHandling, log } from './ApiHelpers.js';
import { LanguageHelper } from './LanguageHelper.js';

export const TranslationHelper = {
  /**
   * Translate quiz if user's language differs from quiz language
   * @param {Object} quiz - Quiz data with id and language properties
   * @returns {Promise<Object>} Translation result with translated flag and quiz
   */
  async translateQuizIfNeeded(quiz) {
    const userLang = LanguageHelper.getPreferredLanguage();
    const quizLang = quiz.language || 'de';

    if (userLang === quizLang) {
      return { translated: false, reason: 'Same language', quiz };
    }

    log(`[Translation] Requesting ${quizLang} -> ${userLang}...`);

    try {
      const result = await fetchWithErrorHandling(
        `/api/translate/quiz/${quiz.id}?lang=${userLang}`
      );

      if (result.translated) {
        log(`[Translation] Success: ${result.sourceLang} -> ${result.targetLang}`);
      } else {
        console.warn(`[Translation] Not translated: ${result.reason}`);
      }

      return result;
    } catch (err) {
      console.error('[Translation] Request failed:', err);
      return { translated: false, reason: err.message, quiz };
    }
  }
};
