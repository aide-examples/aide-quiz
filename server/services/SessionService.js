const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { 
  ValidationError,
  InvalidInputError,
  SessionNotFoundError,
  SessionClosedError,
  SessionNotYetOpenError
} = require('../errors');

class SessionService {
  constructor(sessionRepository, quizService) {
    this.sessionRepo = sessionRepository;
    this.quizService = quizService;
  }
  
  createSession(quizId, openFrom = null, openUntil = null) {
    logger.debug('Creating session', { quizId, openFrom, openUntil });
    
    if (!quizId) {
      throw new InvalidInputError('quizId', 'quizId is required');
    }
    
    try {
      // Verify quiz exists
      this.quizService.getQuizMetadata(quizId);
      
      const now = new Date();
      const sessionName = this.generateSessionName(now);
      const id = uuidv4();
      const createdAt = now.toISOString();
      
      this.sessionRepo.create(
        id, 
        sessionName, 
        quizId, 
        null, 
        openFrom || createdAt, 
        openUntil || null, 
        createdAt
      );
      
      logger.info('Session created', { 
        sessionId: id, 
        sessionName, 
        quizId 
      });
      
      return { sessionId: id, sessionName };
    } catch (err) {
      logger.error('Session creation failed', { 
        error: err.message, 
        quizId 
      });
      throw err;
    }
  }
  
  generateSessionName(date) {
    const pad = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}-${pad(date.getMinutes())}`;
  }
  
  getSession(sessionName) {
    logger.debug('Getting session', { sessionName });
    
    // Repository validates sessionName automatically
    
    const session = this.sessionRepo.findByName(sessionName);
    
    if (!session) {
      logger.warn('Session not found', { sessionName });
      throw new SessionNotFoundError(sessionName);
    }
    
    return session;
  }
  
  getSessionQuiz(sessionName, forStat = false) {
    logger.debug('Getting session quiz', { sessionName, forStat });
    
    const session = this.getSession(sessionName);
    
    // Check session timing (unless for statistics)
    if (!forStat) {
      const now = Date.now();
      
      if (session.open_from && Date.parse(session.open_from) > now) {
        logger.warn('Session not yet open', { 
          sessionName, 
          openFrom: session.open_from 
        });
        throw new SessionNotYetOpenError();
      }
      
      if (session.open_until && Date.parse(session.open_until) < now) {
        logger.warn('Session closed', { 
          sessionName, 
          openUntil: session.open_until 
        });
        throw new SessionClosedError();
      }
    }
    
    try {
      const quiz = this.quizService.getStrippedQuiz(session.quiz_id);
      logger.debug('Session quiz retrieved', { 
        sessionName, 
        quizTitle: quiz.title 
      });
      return quiz;
    } catch (err) {
      logger.error('Failed to load session quiz', { 
        sessionName, 
        quizId: session.quiz_id, 
        error: err.message 
      });
      throw err;
    }
  }
  
  isSessionOpen(session) {
    const now = Date.now();
    
    if (session.open_from && Date.parse(session.open_from) > now) {
      return false;
    }
    
    if (session.open_until && Date.parse(session.open_until) < now) {
      return false;
    }
    
    return true;
  }
  
  getAllSessions(limit = 100) {
    logger.debug('Getting all sessions', { limit });
    
    try {
      const sessions = this.sessionRepo.findAll(limit);
      logger.debug('Sessions retrieved', { count: sessions.length });
      return sessions;
    } catch (err) {
      logger.error('Failed to retrieve sessions', { error: err.message });
      throw err;
    }
  }
  
  getCurrentlyOpenSessions() {
    logger.debug('Getting currently open sessions');

    try {
      const sessions = this.sessionRepo.findCurrentlyOpen();
      logger.debug('Currently open sessions retrieved', { count: sessions.length });
      return sessions;
    } catch (err) {
      logger.error('Failed to retrieve currently open sessions', { error: err.message });
      throw err;
    }
  }
  
  updateSessionTimes(sessionId, openFrom, openUntil) {
    logger.debug('Updating session times', { sessionId, openFrom, openUntil });
    
    try {
      const result = this.sessionRepo.update(sessionId, openFrom, openUntil);
      logger.info('Session times updated', { sessionId });
      return result;
    } catch (err) {
      logger.error('Failed to update session times', { 
        sessionId, 
        error: err.message 
      });
      throw err;
    }
  }
  
  deleteSession(sessionId) {
    logger.debug('Deleting session', { sessionId });
    
    try {
      const result = this.sessionRepo.delete(sessionId);
      logger.info('Session deleted', { sessionId });
      return result;
    } catch (err) {
      logger.error('Failed to delete session', { 
        sessionId, 
        error: err.message 
      });
      throw err;
    }
  }
}

module.exports = SessionService;