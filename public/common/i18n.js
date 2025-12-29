/**
 * i18n.js - Internationalization Manager
 *
 * Centralized i18n manager using Polyglot.js for translations.
 * Also provides appReady promise for coordinated initialization.
 */

import { BASE_PATH } from './BasePath.js';
import { LanguageHelper } from './LanguageHelper.js';
import { log } from './ApiHelpers.js';

/**
 * Centralized i18n manager for the entire application
 */
export class I18nManager {
  constructor() {
    this.polyglot = null;
    this.currentLang = null;
    this.fallbackLang = 'de';
    this.isReady = false;
    this.readyPromise = null;
  }

  /**
   * Initialize i18n with language-specific translations
   * @param {string} lang - Language code (de, en, es)
   * @returns {Promise<void>}
   */
  async init(lang) {
    const supportedLanguages = ['de', 'en', 'es'];
    if (!supportedLanguages.includes(lang)) {
      console.warn(`[i18n] Unsupported language: ${lang}, falling back to ${this.fallbackLang}`);
      lang = this.fallbackLang;
    }

    this.currentLang = lang;

    try {
      const basePath = BASE_PATH;
      const response = await fetch(`${basePath}/locales/${lang}.json`);

      if (!response.ok) {
        throw new Error(`Failed to load translations: ${response.status}`);
      }

      const phrases = await response.json();

      this.polyglot = new Polyglot({
        phrases,
        locale: lang,
        allowMissing: true,
        onMissingKey: (key) => {
          console.warn(`[i18n] Missing translation key: ${key}`);
          return key;
        }
      });

      this.isReady = true;
      log(`[i18n] Initialized with language: ${lang} (${Object.keys(phrases).length} keys)`);
    } catch (err) {
      console.error(`[i18n] Failed to load translations for ${lang}:`, err);

      if (lang !== this.fallbackLang) {
        log(`[i18n] Retrying with fallback language: ${this.fallbackLang}`);
        return this.init(this.fallbackLang);
      }

      throw err;
    }
  }

  /**
   * Translate a key with optional parameters
   * @param {string} key - Translation key
   * @param {Object} params - Named parameters for interpolation
   * @returns {string} Translated text
   */
  t(key, params = {}) {
    if (!this.polyglot) {
      console.error('[i18n] Not initialized! Call init() first.');
      return key;
    }

    return this.polyglot.t(key, params);
  }

  /**
   * Get current language
   * @returns {string} Current language code
   */
  getLanguage() {
    return this.currentLang;
  }

  /**
   * Switch to a different language
   * @param {string} lang - New language code
   * @returns {Promise<void>}
   */
  async switchLanguage(lang) {
    if (lang === this.currentLang) {
      log(`[i18n] Already using language: ${lang}`);
      return;
    }

    log(`[i18n] Switching language: ${this.currentLang} -> ${lang}`);
    await this.init(lang);
  }
}

// Create global instance
export const i18n = new I18nManager();

// Auto-initialize with user's preferred language
i18n.readyPromise = (async function autoInitI18n() {
  try {
    if (typeof Polyglot === 'undefined') {
      throw new Error('Polyglot.js not loaded - check script order in HTML');
    }

    const preferredLang = LanguageHelper.getPreferredLanguage();
    await i18n.init(preferredLang);
  } catch (err) {
    console.error('[i18n] Auto-initialization failed:', err);
  }
})();

/**
 * Global application ready promise
 * Combines DOM ready + i18n ready
 */
export const appReady = Promise.all([
  new Promise(resolve => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve);
    } else {
      resolve();
    }
  }),
  i18n.readyPromise
]).then(() => {
  log('[App] Ready - DOM and i18n initialized');
});
