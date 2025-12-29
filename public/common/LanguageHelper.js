/**
 * LanguageHelper.js - Shared Language Detection Utility
 *
 * Detects user's preferred language from various sources.
 */

export const LanguageHelper = {
  /**
   * Get user's preferred language
   * Priority: 1. Google Translate cookie, 2. Browser language, 3. Default 'de'
   * @returns {string} Language code (en, de, or es)
   */
  getPreferredLanguage() {
    // 1. Check Google Translate cookie (user's explicit choice)
    const cookie = document.cookie.split('; ').find(c => c.startsWith('googtrans='));
    if (cookie) {
      const value = cookie.split('=')[1];
      // Format: /de/en (from/to) - we want the target language
      const match = value.match(/\/[a-z]{2}\/([a-z]{2})/);
      if (match) {
        const lang = match[1];
        console.log(`[Language] From GT cookie: ${lang}`);
        return lang;
      }
    }

    // 2. Browser/OS language
    const browserLang = (navigator.language || navigator.userLanguage || 'de').substring(0, 2).toLowerCase();

    // 3. Validate against supported languages
    const supported = ['en', 'de', 'es'];
    const finalLang = supported.includes(browserLang) ? browserLang : 'de';

    console.log(`[Language] From browser: ${browserLang}, using: ${finalLang}`);
    return finalLang;
  }
};
