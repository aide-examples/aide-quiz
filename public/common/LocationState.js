/**
 * LocationState - Save and restore location across language changes
 *
 * Saves the current URL path and modal state before Google Translate
 * changes the language (which may reload the page), then restores
 * the state after reload.
 */

const STORAGE_KEY = 'aide_location_state';

export const LocationState = {
  // References to modal instances (set by modals during init)
  helpModal: null,
  techDocsModal: null,

  /**
   * Register modal instances for state management
   */
  registerModals(helpModal, techDocsModal) {
    this.helpModal = helpModal;
    this.techDocsModal = techDocsModal;
  },

  /**
   * Get current location state
   * @returns {Object} Current state
   */
  getCurrentState() {
    const state = {
      path: window.location.pathname + window.location.search,
      modal: null,
      page: null
    };

    // Check which modal is open
    if (this.techDocsModal?.isOpen) {
      state.modal = 'techDocs';
      state.page = this.techDocsModal.currentPage || 'INDEX.md';
    } else if (this.helpModal?.isOpen) {
      state.modal = 'help';
    }

    return state;
  },

  /**
   * Save current state to sessionStorage
   * Called before language change
   */
  saveState() {
    const state = this.getCurrentState();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    console.log('[LocationState] Saved:', state);
  },

  /**
   * Check if there's a saved state to restore
   * @returns {Object|null} Saved state or null
   */
  getSavedState() {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    try {
      return JSON.parse(saved);
    } catch (e) {
      return null;
    }
  },

  /**
   * Clear saved state
   */
  clearState() {
    sessionStorage.removeItem(STORAGE_KEY);
  },

  /**
   * Restore state after page load
   * Should be called after modals are initialized
   */
  restoreState() {
    const state = this.getSavedState();
    if (!state) return;

    // Clear immediately to prevent loops
    this.clearState();

    console.log('[LocationState] Restoring:', state);

    // Check if we need to navigate to a different path
    const currentPath = window.location.pathname + window.location.search;
    if (state.path && state.path !== currentPath) {
      // Need to navigate - save modal state for after navigation
      if (state.modal) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
          path: state.path,
          modal: state.modal,
          page: state.page
        }));
      }
      window.location.href = state.path;
      return;
    }

    // Same path - just restore modal state
    this.restoreModalState(state);
  },

  /**
   * Restore modal state
   * @param {Object} state - State with modal and page info
   */
  restoreModalState(state) {
    // Small delay to ensure modals are fully initialized
    setTimeout(() => {
      if (state.modal === 'techDocs' && this.techDocsModal) {
        this.techDocsModal.open(state.page || 'INDEX.md');
      } else if (state.modal === 'help' && this.helpModal) {
        this.helpModal.open();
      }
    }, 100);
  },

  /**
   * Hook into Google Translate widget to save state before language change
   */
  hookGoogleTranslate() {
    // Method 1: Watch for changes to the GT select element
    const observer = new MutationObserver(() => {
      const gtSelect = document.querySelector('.goog-te-combo');
      if (gtSelect && !gtSelect._locationStateHooked) {
        gtSelect._locationStateHooked = true;

        // Save state BEFORE the change event propagates
        gtSelect.addEventListener('mousedown', () => {
          this.saveState();
        });

        gtSelect.addEventListener('change', () => {
          // State already saved on mousedown
          // GT will handle the language change
        });

        console.log('[LocationState] Hooked GT widget');
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also check immediately
    const gtSelect = document.querySelector('.goog-te-combo');
    if (gtSelect && !gtSelect._locationStateHooked) {
      gtSelect._locationStateHooked = true;
      gtSelect.addEventListener('mousedown', () => {
        this.saveState();
      });
    }
  },

  /**
   * Initialize LocationState
   * Call this once after modals are created
   */
  init(helpModal, techDocsModal) {
    this.registerModals(helpModal, techDocsModal);
    this.hookGoogleTranslate();

    // Restore state if coming back from language change
    // Small delay to let everything initialize
    setTimeout(() => {
      this.restoreState();
    }, 200);
  }
};
