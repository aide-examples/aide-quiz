const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const Constants = require('../config/constants');
const GradingValidationService = require('./GradingValidationService');
const {
  ValidationError,
  InvalidInputError,
  DuplicateSubmissionError,
  SubmissionNotFoundError,
  SessionClosedError,
  SessionNotYetOpenError
} = require('../errors');

class GradingService {
  constructor(submissionRepository, quizService, sessionService, txManager) {
    if (!txManager) {
      throw new Error('GradingService requires TransactionManager');
    }
    
    this.submissionRepo = submissionRepository;
    this.quizService = quizService;
    this.sessionService = sessionService;
    this.txManager = txManager;
  }
  
  submitAnswers(sessionName, userCode, answers) {
    logger.info('Submission attempt', { sessionName, userCode });
    
    // Validate answers structure
    answers = GradingValidationService.validateAnswers(answers);
    
    // userCode is validated by SubmissionRepository
    
    // Get session (throws if not found)
    const session = this.sessionService.getSession(sessionName);
    
    // Check if session is open (throws if not)
    if (!this.sessionService.isSessionOpen(session)) {
      const now = Date.now();
      if (session.open_from && Date.parse(session.open_from) > now) {
        throw new SessionNotYetOpenError();
      }
      if (session.open_until && Date.parse(session.open_until) < now) {
        throw new SessionClosedError();
      }
    }
    
    // Load quiz
    const quiz = this.quizService.loadQuiz(session.quiz_id);
    
    // Wrap critical section in transaction for atomicity
    const executeSubmission = () => {
      // Check for duplicate submission (inside transaction for atomicity)
      const existing = this.submissionRepo.findBySessionAndUser(sessionName, userCode);
      if (existing) {
        logger.warn('Duplicate submission attempt', { sessionName, userCode });
        throw new DuplicateSubmissionError(userCode, sessionName);
      }
      
      try {
        // Grade answers
        const keyMap = this.createAnswerKeyMap(quiz);
        const { perQuestion, total, maxTotal } = this.gradeAnswers(answers, keyMap);
        
        // Save submission
        const submissionId = uuidv4();
        const resultLink = submissionId;
        const createdAt = new Date().toISOString();
        
        this.submissionRepo.create(
          submissionId,
          session.id,
          sessionName,
          userCode,
          resultLink,
          JSON.stringify(perQuestion),
          total,
          maxTotal,
          createdAt
        );
        
        logger.info('Submission successful', {
          sessionName,
          userCode,
          score: total,
          maxScore: maxTotal,
          submissionId
        });
        
        // Build result link with BASE_PATH support
        const basePath = Constants.BASE_PATH || '';
        const resultUrl = `${basePath}/result/?id=${resultLink}`;
        
        return {
          resultLink: resultUrl,
          score: total,
          maxScore: maxTotal
        };
      } catch (err) {
        logger.error('Submission failed', {
          sessionName,
          userCode,
          error: err.message
        });
        throw err;
      }
    };
    
    return this.txManager.transaction(executeSubmission, 'SubmitAnswers');
  }
  
  /**
   * Create answer key map from quiz
   * NEW FORMAT: Extracts correct IDs from options[].correct
   */
  createAnswerKeyMap(quiz) {
    const keyMap = {};
    
    for (const q of quiz.questions) {
      let correct = [];
      
      // NEW FORMAT: Extract from options[].correct
      if (q.options && Array.isArray(q.options)) {
        correct = q.options
          .filter(option => typeof option === 'object' && option.correct === true)
          .map(option => option.id);
      }
      // OLD FORMAT fallback: use q.correct array
      else if (q.correct) {
        correct = Array.isArray(q.correct) ? q.correct : [q.correct];
      }
      
      keyMap[q.id] = {
        correct: correct.filter(x => x !== undefined),
        points: q.points || 1,
        multiple: !!q.multiple
      };
    }
    
    return keyMap;
  }
  
  gradeAnswers(answers, keyMap) {
    let total = 0;
    let maxTotal = 0;
    const perQuestion = [];
    
    for (const answer of answers) {
      const qid = answer.questionId;
      const chosen = Array.isArray(answer.chosen) 
        ? answer.chosen 
        : (answer.chosen ? [answer.chosen] : []);
      
      const key = keyMap[qid];
      
      if (!key) {
        logger.warn('Unknown question in submission', { questionId: qid });
        perQuestion.push({
          questionId: qid,
          error: 'unknown question',
          points: 0,
          maxPoints: 0
        });
        continue;
      }
      
      // Check if answer is correct
      const correctSet = new Set(key.correct);
      const chosenSet = new Set(chosen);
      const isEqual = (correctSet.size === chosenSet.size) 
        && [...correctSet].every(x => chosenSet.has(x));
      
      const pts = isEqual ? key.points : 0;
      total += pts;
      maxTotal += key.points;
      
      perQuestion.push({
        questionId: qid,
        correct: key.correct,
        chosen: chosen,
        points: pts,
        maxPoints: key.points
      });
      
      logger.debug('Question graded', {
        questionId: qid,
        isCorrect: isEqual,
        points: pts
      });
    }
    
    return { perQuestion, total, maxTotal };
  }
  
  /**
   * Calculate per-question statistics for a session
   * @private
   */
  _calculateQuestionStats(sessionName) {
    const submissions = this.submissionRepo.findBySessionName(sessionName);
    const stats = {};

    for (const sub of submissions) {
      const answers = JSON.parse(sub.answers_json);
      for (const a of answers) {
        if (!stats[a.questionId]) {
          stats[a.questionId] = { total: 0, correctCount: 0 };
        }
        stats[a.questionId].total++;
        if (a.points > 0) {
          stats[a.questionId].correctCount++;
        }
      }
    }

    return stats;
  }

  getResult(resultId) {
    logger.debug('Getting result', { resultId });

    const submission = this.submissionRepo.findById(resultId);

    if (!submission) {
      logger.warn('Result not found', { resultId });
      throw new SubmissionNotFoundError(resultId);
    }

    const session = this.sessionService.getSession(submission.session_name);

    // Check if results should be shown yet
    if (session.open_until && Date.parse(session.open_until) > Date.now()) {
      logger.debug('Result access - session still open', {
        resultId,
        openUntil: session.open_until
      });
      return { open_after: session.open_until };
    }

    const quiz = this.quizService.loadQuiz(session.quiz_id);

    // Build question map
    const qmap = {};
    for (const q of quiz.questions) {
      qmap[q.id] = q;
    }

    // Get per-question statistics for comparison
    const questionStats = this._calculateQuestionStats(submission.session_name);

    // Enrich submission data with question details and average stats
    const perQ = JSON.parse(submission.answers_json).map(p => {
      const originalQuestion = qmap[p.questionId] || {};
      const stat = questionStats[p.questionId] || { total: 0, correctCount: 0 };
      return {
        questionId: p.questionId,
        keyword: originalQuestion.keyword || p.questionId,
        text: originalQuestion.text,
        options: originalQuestion.options,
        reason: originalQuestion.reason,
        correct: p.correct || [],
        chosen: p.chosen || [],
        points: p.points || 0,
        maxPoints: p.maxPoints || 0,
        avgCorrectPercent: stat.total > 0
          ? Math.round(100 * stat.correctCount / stat.total)
          : null
      };
    });

    logger.debug('Result retrieved', {
      resultId,
      score: submission.score,
      maxScore: submission.max_score
    });

    return {
      quizId: session.quiz_id,
      quizTitle: quiz.title,
      sessionName: submission.session_name,
      userCode: submission.user_code,
      score: submission.score,
      maxScore: submission.max_score,
      created_at: submission.created_at,
      details: perQ,
      open_after: true
    };
  }
  
  getSessionSubmissions(sessionName) {
    logger.debug('Getting session submissions', { sessionName });
    
    const fetchSubmissions = () => {
      try {
        const subs = this.submissionRepo.findSummaryBySessionName(sessionName);
        
        const detailed = subs.map(s => {
          const row = this.submissionRepo.findById(s.id);
          const details = JSON.parse(row.answers_json);
          return Object.assign({}, s, { details });
        });
        
        logger.debug('Session submissions retrieved', {
          sessionName,
          count: detailed.length
        });
        
        return detailed;
      } catch (err) {
        logger.error('Failed to retrieve submissions', {
          sessionName,
          error: err.message
        });
        throw err;
      }
    };
    
    // Use read-only transaction for consistent snapshot
    return this.txManager.readTransaction(fetchSubmissions, 'GetSessionSubmissions');
  }
}

module.exports = GradingService;