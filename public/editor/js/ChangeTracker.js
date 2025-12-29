/**
 * ChangeTracker.js - Detects unsaved changes in quiz data
 *
 * Uses JSON string comparison for reliable change detection.
 */

import { i18n } from '../../common/i18n.js';

export class ChangeTracker {
  constructor(editor) {
    this.editor = editor;
    this.savedState = null;
  }

  /**
   * Mark current state as saved
   * Call this after successful save or after loading a quiz
   */
  markAsSaved() {
    this.savedState = JSON.stringify(this.editor.quizData);
  }

  /**
   * Check if there are unsaved changes
   * @returns {boolean} - True if changes exist, false otherwise
   */
  hasUnsavedChanges() {
    // No saved state yet (fresh start)
    if (!this.savedState) {
      return false;
    }
    
    // No quiz loaded (shouldn't happen, but safe)
    if (!this.editor.currentQuizId) {
      return false;
    }
    
    // Sync UI to data before comparison
    this.editor.dataSync.syncUIToData();
    
    // Compare current state with saved state
    const currentState = JSON.stringify(this.editor.quizData);
    return this.savedState !== currentState;
  }

  /**
   * Ask user to confirm discarding changes
   * @returns {boolean} - True if user confirms (or no changes), false if user cancels
   */
  confirmDiscardChanges() {
    if (!this.hasUnsavedChanges()) {
      return true; // No changes, can proceed
    }
    
    return confirm(i18n.t('editor_unsaved_changes'));
  }

  /**
   * Clear saved state
   * Call this when starting a completely new quiz
   */
  clear() {
    this.savedState = null;
  }
}