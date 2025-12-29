/**
 * ValidationClient.js - Client-side Validation
 *
 * Loads validation rules from server and provides local validation.
 */

import { BASE_PATH } from './BasePath.js';
import { log } from './ApiHelpers.js';

/**
 * Client-side validation manager
 */
export class ValidationClient {
  constructor() {
    this.validator = null;
    this.rulesLoaded = false;
    this.loadPromise = null;
  }

  /**
   * Initialize validation (loads all rules from server)
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this._loadRules();
    return this.loadPromise;
  }

  /**
   * Load validation rules from server
   * @private
   */
  async _loadRules() {
    try {
      if (!window.ObjectValidator || !window.ValidationError) {
        throw new Error('ObjectValidator and ValidationError must be loaded');
      }

      this.validator = new ObjectValidator();

      const basePath = BASE_PATH;
      const url = `${basePath}/api/validation/rules`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load validation rules: ${response.status}`);
      }

      const rules = await response.json();
      const deserializedRules = this._deserializeRules(rules);

      this.validator.loadRules(deserializedRules);
      this.rulesLoaded = true;

      log('Validation rules loaded:', Object.keys(rules));
    } catch (error) {
      console.error('Failed to initialize validation:', error);
      throw error;
    }
  }

  /**
   * Deserialize rules by converting pattern strings back to RegExp
   * @private
   */
  _deserializeRules(rules) {
    const deserialized = {};

    for (const [entityType, entityRules] of Object.entries(rules)) {
      deserialized[entityType] = {};

      for (const [fieldName, fieldRules] of Object.entries(entityRules)) {
        deserialized[entityType][fieldName] = { ...fieldRules };

        if (typeof fieldRules.pattern === 'string') {
          const flags = fieldRules.patternFlags || '';
          deserialized[entityType][fieldName].pattern = new RegExp(fieldRules.pattern, flags);
          delete deserialized[entityType][fieldName].patternFlags;
        }

        if (fieldRules.itemRules && typeof fieldRules.itemRules.pattern === 'string') {
          deserialized[entityType][fieldName].itemRules = { ...fieldRules.itemRules };
          const flags = fieldRules.itemRules.patternFlags || '';
          deserialized[entityType][fieldName].itemRules.pattern = new RegExp(fieldRules.itemRules.pattern, flags);
          delete deserialized[entityType][fieldName].itemRules.patternFlags;
        }
      }
    }

    return deserialized;
  }

  /**
   * Validate a complete object
   * @param {string} entityType - Entity type
   * @param {Object} obj - Object to validate
   * @returns {Object} Validated object
   * @throws {ValidationError}
   */
  validate(entityType, obj) {
    this._ensureInitialized();
    return this.validator.validate(entityType, obj);
  }

  /**
   * Validate a single field
   * @param {string} entityType - Entity type
   * @param {string} fieldName - Field name
   * @param {*} value - Value
   * @throws {ValidationError}
   */
  validateField(entityType, fieldName, value) {
    this._ensureInitialized();
    return this.validator.validateField(entityType, fieldName, value);
  }

  /**
   * Get a specific rule
   * @param {string} entityType - Entity type
   * @param {string} fieldName - Field name
   * @param {string} ruleName - Rule name
   * @returns {*}
   */
  getRule(entityType, fieldName, ruleName) {
    this._ensureInitialized();
    return this.validator.getRule(entityType, fieldName, ruleName);
  }

  /**
   * Get all rules for a field
   * @param {string} entityType - Entity type
   * @param {string} fieldName - Field name
   * @returns {Object|null}
   */
  getFieldRules(entityType, fieldName) {
    this._ensureInitialized();
    const rules = this.validator.getRules(entityType);
    return rules ? rules[fieldName] : null;
  }

  /**
   * Set up an input element for live validation
   * @param {HTMLInputElement} inputElement - Input element
   * @param {string} entityType - Entity type
   * @param {string} fieldName - Field name
   * @param {Object} options - Options
   */
  setupInputValidation(inputElement, entityType, fieldName, options = {}) {
    this._ensureInitialized();

    const rules = this.getFieldRules(entityType, fieldName);
    if (!rules) {
      console.warn(`No validation rules found for ${entityType}.${fieldName}`);
      return;
    }

    if (rules.maxLength) {
      inputElement.setAttribute('maxlength', rules.maxLength);
    }

    if (rules.required) {
      inputElement.setAttribute('required', 'required');
    }

    inputElement.addEventListener('input', (e) => {
      let value = e.target.value;

      if (rules.trim && typeof value === 'string') {
        value = value.trim();
      }

      try {
        this.validateField(entityType, fieldName, value);
        inputElement.classList.remove('validation-error');
        inputElement.classList.add('validation-success');

        if (options.onSuccess) {
          options.onSuccess(value);
        }
      } catch (error) {
        if (error.isValidationError) {
          inputElement.classList.remove('validation-success');
          inputElement.classList.add('validation-error');

          if (options.onError) {
            options.onError(error.errors[0]);
          }
        }
      }
    });

    inputElement.addEventListener('blur', (e) => {
      let value = e.target.value;

      if (rules.trim && typeof value === 'string') {
        value = value.trim();
      }

      if (value === '' && rules.required) {
        inputElement.classList.add('validation-error');

        if (options.onError) {
          options.onError({
            field: fieldName,
            code: 'REQUIRED',
            message: `Field "${fieldName}" is required`
          });
        }
      }
    });
  }

  /**
   * Show validation errors as toast
   * @param {ValidationError} error - Validation error
   */
  showValidationErrors(error) {
    if (!error.isValidationError) {
      console.error('Not a validation error:', error);
      return;
    }

    error.errors.forEach(err => {
      this._showToast(err.message, 'error');
    });
  }

  /**
   * Show a toast
   * @private
   */
  _showToast(message, type = 'info') {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
    } else {
      log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  /**
   * Check if validation is initialized
   * @private
   */
  _ensureInitialized() {
    if (!this.rulesLoaded) {
      throw new Error('ValidationClient not initialized. Call initialize() first.');
    }
  }
}

// Global instance
export const validationClient = new ValidationClient();
