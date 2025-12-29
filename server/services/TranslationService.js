const fs = require('fs');
const path = require('path');
const https = require('https');
const { AppError } = require('../errors');
const logger = require('../utils/logger');

/**
 * TranslationService
 * Handles quiz translation using DeepL API with server-side caching
 *
 * Features:
 * - Translates quiz content (questions, options, explanations)
 * - Server-side cache to save API quota and improve performance
 * - Automatic cache invalidation on quiz updates
 * - Supports formality settings (informal "Du" for German)
 */
class TranslationService {
  constructor() {
    this.apiKey = process.env.DEEPL_API_KEY;
    this.cacheDir = path.join(__dirname, '../cache/translations');
    this.apiEndpoint = this.apiKey && this.apiKey.endsWith(':fx')
      ? 'api-free.deepl.com'  // Free tier
      : 'api.deepl.com';       // Pro tier

    // Ensure cache directory exists
    this.ensureCacheDir();
  }

  /**
   * Ensure cache directory exists
   */
  ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Translate a quiz to target language
   * @param {Object} quiz - Quiz object from database
   * @param {string} targetLang - Target language code (de, en, es, etc.)
   * @returns {Promise<Object>} - Translation result with metadata
   *   {
   *     translated: boolean,
   *     cached: boolean,
   *     reason: string (if not translated),
   *     sourceLang: string,
   *     targetLang: string,
   *     quiz: Object
   *   }
   */
  async translateQuiz(quiz, targetLang) {
    const sourceLang = quiz.language || 'de';

    // No translation needed if source and target are the same
    if (sourceLang.toLowerCase() === targetLang.toLowerCase()) {
      return {
        translated: false,
        cached: false,
        reason: 'Source and target language are the same',
        sourceLang: sourceLang,
        targetLang: targetLang,
        quiz: quiz
      };
    }

    // Check cache first
    const cached = this.getFromCache(quiz.id, targetLang);
    if (cached) {
      logger.debug('Translation cache hit', { quizId: quiz.id, targetLang });
      return {
        translated: true,
        cached: true,
        sourceLang: sourceLang,
        targetLang: targetLang,
        quiz: cached
      };
    }

    // No API key? Return original
    if (!this.apiKey) {
      logger.warn('DeepL API key not configured - returning original quiz', {
        quizId: quiz.id,
        targetLang
      });
      return {
        translated: false,
        cached: false,
        reason: 'No DeepL API key configured',
        sourceLang: sourceLang,
        targetLang: targetLang,
        quiz: quiz
      };
    }

    logger.info('Translating quiz', { quizId: quiz.id, sourceLang, targetLang });

    try {
      // Clone quiz to avoid modifying original
      const translatedQuiz = JSON.parse(JSON.stringify(quiz));

      // Collect all texts to translate
      const textsToTranslate = [];
      const textMap = []; // Maps index to location in quiz object

      // Quiz title
      textsToTranslate.push(quiz.title);
      textMap.push({ type: 'title' });

      // Questions
      quiz.questions.forEach((question, qIdx) => {
        // Question text (field can be 'text' or 'question')
        const questionText = question.text || question.question;
        if (questionText) {
          textsToTranslate.push(questionText);
          textMap.push({ type: 'question', qIdx, field: question.text ? 'text' : 'question' });
        }

        // Question explanation/reason (if exists)
        const explanation = question.reason || question.explanation;
        if (explanation) {
          textsToTranslate.push(explanation);
          textMap.push({ type: 'question', qIdx, field: question.reason ? 'reason' : 'explanation' });
        }

        // Question keyword (if exists)
        if (question.keyword) {
          textsToTranslate.push(question.keyword);
          textMap.push({ type: 'question', qIdx, field: 'keyword' });
        }

        // Options
        if (question.options && Array.isArray(question.options)) {
          question.options.forEach((option, oIdx) => {
            // Option can be string or object
            if (typeof option === 'string') {
              textsToTranslate.push(option);
              textMap.push({ type: 'option', qIdx, oIdx, field: 'string' });
            } else if (option.text) {
              textsToTranslate.push(option.text);
              textMap.push({ type: 'option', qIdx, oIdx, field: 'text' });

              // Option explanation (if exists)
              if (option.explanation) {
                textsToTranslate.push(option.explanation);
                textMap.push({ type: 'option', qIdx, oIdx, field: 'explanation' });
              }
            }
          });
        }
      });

      // Translate all texts in batch
      const translations = await this.translateTexts(textsToTranslate, sourceLang, targetLang);

      // Apply translations back to quiz object
      translations.forEach((translation, idx) => {
        const map = textMap[idx];

        if (map.type === 'title') {
          translatedQuiz.title = translation;
        } else if (map.type === 'question') {
          translatedQuiz.questions[map.qIdx][map.field] = translation;
        } else if (map.type === 'option') {
          if (map.field === 'string') {
            // Option is a string, replace directly
            translatedQuiz.questions[map.qIdx].options[map.oIdx] = translation;
          } else {
            // Option is an object, update field
            translatedQuiz.questions[map.qIdx].options[map.oIdx][map.field] = translation;
          }
        }
      });

      // Save to cache
      this.saveToCache(quiz.id, targetLang, translatedQuiz);

      return {
        translated: true,
        cached: false,
        sourceLang: sourceLang,
        targetLang: targetLang,
        quiz: translatedQuiz
      };

    } catch (error) {
      logger.error('Translation failed', {
        quizId: quiz.id,
        sourceLang,
        targetLang,
        error: error.message
      });

      // Return original quiz with error information
      return {
        translated: false,
        cached: false,
        reason: `DeepL API error: ${error.message}`,
        sourceLang: sourceLang,
        targetLang: targetLang,
        quiz: quiz
      };
    }
  }

  /**
   * Translate multiple texts using DeepL API
   * @param {string[]} texts - Array of texts to translate
   * @param {string} sourceLang - Source language code
   * @param {string} targetLang - Target language code
   * @returns {Promise<string[]>} - Array of translated texts
   */
  async translateTexts(texts, sourceLang, targetLang) {
    // DeepL expects uppercase language codes
    const sourceUpper = sourceLang.toUpperCase();
    const targetUpper = targetLang.toUpperCase();

    // Build request body
    const params = new URLSearchParams();
    texts.forEach(text => params.append('text', text));
    params.append('source_lang', sourceUpper);
    params.append('target_lang', targetUpper);

    // Add formality for German (informal = "Du")
    if (targetUpper === 'DE') {
      params.append('formality', 'less'); // "less" = informal (Du)
    }

    const postData = params.toString();

    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.apiEndpoint,
        path: '/v2/translate',
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const result = JSON.parse(data);
              const translations = result.translations.map(t => t.text);
              resolve(translations);
            } catch (error) {
              reject(new Error('Failed to parse DeepL response'));
            }
          } else if (res.statusCode === 456) {
            reject(new Error('DeepL quota exceeded - please check your API key'));
          } else if (res.statusCode === 403) {
            reject(new Error('DeepL API key invalid'));
          } else {
            reject(new Error(`DeepL API error: ${res.statusCode} - ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`DeepL API request failed: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Get translated quiz from cache
   * @param {string} quizId - Quiz ID
   * @param {string} targetLang - Target language
   * @returns {Object|null} - Cached quiz or null
   */
  getFromCache(quizId, targetLang) {
    const cacheFile = path.join(this.cacheDir, `quiz_${quizId}_${targetLang}.json`);

    if (fs.existsSync(cacheFile)) {
      try {
        const cached = fs.readFileSync(cacheFile, 'utf8');
        return JSON.parse(cached);
      } catch (error) {
        logger.warn('Failed to read translation cache', {
          cacheFile,
          error: error.message
        });
        return null;
      }
    }

    return null;
  }

  /**
   * Save translated quiz to cache
   * @param {string} quizId - Quiz ID
   * @param {string} targetLang - Target language
   * @param {Object} translatedQuiz - Translated quiz object
   */
  saveToCache(quizId, targetLang, translatedQuiz) {
    const cacheFile = path.join(this.cacheDir, `quiz_${quizId}_${targetLang}.json`);

    try {
      fs.writeFileSync(cacheFile, JSON.stringify(translatedQuiz, null, 2), 'utf8');
      logger.debug('Translation cached', { quizId, targetLang, cacheFile });
    } catch (error) {
      logger.warn('Failed to write translation cache', {
        cacheFile,
        error: error.message
      });
    }
  }

  /**
   * Clear translation cache for a quiz (called on quiz update)
   * @param {string} quizId - Quiz ID
   */
  clearCache(quizId) {
    try {
      const files = fs.readdirSync(this.cacheDir);
      const pattern = `quiz_${quizId}_`;

      let deleted = 0;
      files.forEach(file => {
        if (file.startsWith(pattern)) {
          fs.unlinkSync(path.join(this.cacheDir, file));
          deleted++;
        }
      });

      if (deleted > 0) {
        logger.info('Translation cache cleared', { quizId, filesDeleted: deleted });
      }
    } catch (error) {
      logger.warn('Failed to clear translation cache', {
        quizId,
        error: error.message
      });
    }
  }

  /**
   * Get usage statistics (if using DeepL Pro)
   * @returns {Promise<Object>} - Usage stats
   */
  async getUsageStats() {
    if (!this.apiKey) {
      return { error: 'No API key configured' };
    }

    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.apiEndpoint,
        path: '/v2/usage',
        method: 'GET',
        headers: {
          'Authorization': `DeepL-Auth-Key ${this.apiKey}`
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              resolve(JSON.parse(data));
            } catch (error) {
              reject(new Error('Failed to parse usage stats'));
            }
          } else {
            reject(new Error(`Failed to get usage stats: ${res.statusCode}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }
}

module.exports = TranslationService;
