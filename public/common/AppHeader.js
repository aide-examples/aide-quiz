/**
 * AppHeader.js - Shared App Header with Language Selector
 *
 * Automatically added to all pages. Includes Google Translate widget.
 */

import { BASE_PATH } from './BasePath.js';
import { LanguageHelper } from './LanguageHelper.js';
import { log } from './ApiHelpers.js';

/**
 * Set initial language in Google Translate widget
 */
function setInitialLanguage() {
  const preferredLang = LanguageHelper.getPreferredLanguage();
  log(`[GT Widget] Setting initial language to: ${preferredLang}`);

  let attempts = 0;
  const maxAttempts = 20;

  const interval = setInterval(() => {
    attempts++;

    const selectElement = document.querySelector('.goog-te-combo');

    if (selectElement) {
      if (selectElement.value !== preferredLang) {
        log(`[GT Widget] Found select, setting value to: ${preferredLang}`);
        selectElement.value = preferredLang;

        const event = new Event('change', { bubbles: true });
        selectElement.dispatchEvent(event);

        log(`[GT Widget] Language set successfully`);
      } else {
        log(`[GT Widget] Already set to ${preferredLang}`);
      }
      clearInterval(interval);
    } else if (attempts >= maxAttempts) {
      console.warn('[GT Widget] Could not find language selector (.goog-te-combo)');
      clearInterval(interval);
    }
  }, 100);
}

/**
 * Initialize the app header
 */
export function initAppHeader() {
  if (document.querySelector('.app-header')) return;

  const basePath = BASE_PATH;

  const header = document.createElement('div');
  header.className = 'app-header';
  header.innerHTML = `
    <div class="app-header-content">
      <div class="app-logo">
        <a href="${basePath}/">AIDE Quiz</a>
      </div>
      <div class="app-header-actions">
        <div id="help-button-container" class="help-button-header"></div>
        <div id="arch-button-container" class="arch-button-header"></div>
        <div id="google_translate_element" class="language-selector"></div>
      </div>
    </div>
  `;

  document.body.prepend(header);

  // Load Google Translate
  if (!window.googleTranslateElementInit) {
    window.googleTranslateElementInit = function() {
      new google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'en,de,es',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false
      }, 'google_translate_element');

      setInitialLanguage();
    };

    const script = document.createElement('script');
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.head.appendChild(script);
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAppHeader);
} else {
  initAppHeader();
}
