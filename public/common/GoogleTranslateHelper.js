/**
 * GoogleTranslateHelper.js - Google Translate Widget Integration
 *
 * Provides utilities for interacting with the Google Translate widget.
 */

import { log } from './ApiHelpers.js';

export const GoogleTranslateHelper = {
  /**
   * Set up listener for Google Translate language changes.
   * Polls for the Google Translate dropdown and attaches a change listener.
   * @param {Function} onLanguageChange - Callback when language changes
   * @param {Object} options - Optional settings
   * @param {number} options.maxAttempts - Max polling attempts (default: 20)
   * @param {number} options.pollInterval - Polling interval in ms (default: 100)
   */
  setupLanguageChangeListener(onLanguageChange, options = {}) {
    const { maxAttempts = 20, pollInterval = 100 } = options;
    let attempts = 0;

    const interval = setInterval(() => {
      attempts++;
      const selectElement = document.querySelector('.goog-te-combo');

      if (selectElement) {
        selectElement.addEventListener('change', onLanguageChange);
        log('[Language Change] Listener attached');
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, pollInterval);
  }
};
