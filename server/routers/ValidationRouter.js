/**
 * Validation Router
 * API endpoints for client-side validation rule queries.
 * @module routers/ValidationRouter
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

let validatorInstance = null;

/**
 * Sets the validator instance (called by app.js)
 * @param {ObjectValidator} validator - The validator instance
 */
function setValidatorInstance(validator) {
  validatorInstance = validator;
}

/**
 * Get All Validation Rules
 * @name GetAllRules
 * @route GET /api/validation/rules
 * @description Returns all registered validation rules for client-side validation.
 *
 * @example
 * // Response 200 OK
 * {
 *   "Quiz": { "title": { "type": "string", "required": true, "maxLength": 200 } },
 *   "Submission": { "userCode": { "type": "string", "pattern": "^[a-zA-Z0-9_-]+$" } }
 * }
 */
router.get('/rules', (req, res) => {
  try {
    if (!validatorInstance) {
      logger.warn('ValidationRouter: No validator instance set');
      return res.status(503).json({
        error: 'Validation service not initialized'
      });
    }

    const allRules = validatorInstance.getAllRules();
    const serializedRules = serializeRules(allRules);
    res.json(serializedRules);

  } catch (error) {
    logger.error('Error fetching validation rules:', error);
    res.status(500).json({
      error: 'Failed to fetch validation rules'
    });
  }
});

/**
 * Serialize rules by converting RegExp to strings
 */
function serializeRules(rules) {
  const serialized = {};

  for (const [entityType, entityRules] of Object.entries(rules)) {
    serialized[entityType] = {};

    for (const [fieldName, fieldRules] of Object.entries(entityRules)) {
      serialized[entityType][fieldName] = { ...fieldRules };

      if (fieldRules.pattern instanceof RegExp) {
        serialized[entityType][fieldName].pattern = fieldRules.pattern.source;
        serialized[entityType][fieldName].patternFlags = fieldRules.pattern.flags;
      }

      if (fieldRules.itemRules && fieldRules.itemRules.pattern instanceof RegExp) {
        serialized[entityType][fieldName].itemRules = { ...fieldRules.itemRules };
        serialized[entityType][fieldName].itemRules.pattern = fieldRules.itemRules.pattern.source;
        serialized[entityType][fieldName].itemRules.patternFlags = fieldRules.itemRules.pattern.flags;
      }
    }
  }

  return serialized;
}

/**
 * Get Rules for Entity Type
 * @name GetEntityRules
 * @route GET /api/validation/rules/:entityType
 * @description Returns validation rules for a specific entity type.
 *
 * @example
 * // Request
 * GET /api/validation/rules/Quiz
 *
 * @example
 * // Response 200 OK
 * {
 *   "title": { "type": "string", "required": true, "maxLength": 200 },
 *   "imagePath": { "type": "string", "pattern": "^[a-zA-Z0-9_-]+$" }
 * }
 *
 * @example
 * // Response 404 Not Found
 * { "error": "No validation rules found for entity type: Unknown" }
 */
router.get('/rules/:entityType', (req, res) => {
  try {
    if (!validatorInstance) {
      return res.status(503).json({
        error: 'Validation service not initialized'
      });
    }

    const { entityType } = req.params;
    const rules = validatorInstance.getRules(entityType);

    if (!rules) {
      return res.status(404).json({
        error: `No validation rules found for entity type: ${entityType}`
      });
    }

    res.json(rules);

  } catch (error) {
    logger.error('Error fetching validation rules:', error);
    res.status(500).json({
      error: 'Failed to fetch validation rules'
    });
  }
});

module.exports = router;
module.exports.setValidatorInstance = setValidatorInstance;
