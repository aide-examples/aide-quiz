const logger = require('../utils/logger');

class ExportService {
  constructor(submissionRepository, sessionService, quizService) {
    this.submissionRepo = submissionRepository;
    this.sessionService = sessionService;
    this.quizService = quizService;
  }
  
  exportSessionCSV(sessionName) {
    logger.debug('Exporting session to CSV', { sessionName });
    
    const session = this.sessionService.getSession(sessionName);
    const quiz = this.quizService.loadQuiz(session.quiz_id);
    const submissions = this.submissionRepo.findBySessionName(sessionName);
    
    try {
      let csv = '';
      const header = ['userCode', 'questionId', 'keyword', 'correct', 'chosen', 'points', 'maxPoints'];
      csv += header.join(';') + '\n';
      
      const qMap = {};
      for (const q of quiz.questions) {
        qMap[q.id] = q.keyword || q.text.replace(/\n/g, ' ').slice(0, 50);
      }
      
      for (const submission of submissions) {
        const answers = JSON.parse(submission.answers_json);
        for (const answer of answers) {
          const row = [
            submission.user_code,
            answer.questionId,
            `"${(qMap[answer.questionId] || '').replace(/"/g, '""')}"`,
            (answer.correct || []).join(','),
            (answer.chosen || []).join(','),
            answer.points,
            answer.maxPoints
          ];
          csv += row.join(';') + '\n';
        }
      }
      
      logger.info('CSV export successful', {
        sessionName,
        participants: submissions.length
      });
      
      return {
        content: csv,
        filename: `${sessionName}_results.csv`,
        contentType: 'text/csv'
      };
    } catch (err) {
      logger.error('CSV export failed', {
        sessionName,
        error: err.message
      });
      throw err;
    }
  }
  
  exportSessionStats(sessionName) {
    logger.debug('Exporting session stats', { sessionName });
    
    const session = this.sessionService.getSession(sessionName);
    const quiz = this.quizService.loadQuiz(session.quiz_id);
    const submissions = this.submissionRepo.findBySessionName(sessionName);
    
    try {
      const qstats = {};
      
      for (const q of quiz.questions) {
        qstats[q.id] = {
          id: q.id,
          keyword: q.keyword || q.text.slice(0, 30),
          total: 0,
          correctCount: 0,
          optionCounts: {}
        };
        for (const c of q.options) {
          qstats[q.id].optionCounts[c.id] = 0;
        }
      }
      
      for (const submission of submissions) {
        const answers = JSON.parse(submission.answers_json);
        for (const answer of answers) {
          if (!qstats[answer.questionId]) continue;
          
          qstats[answer.questionId].total += 1;
          
          for (const option of (answer.chosen || [])) {
            if (qstats[answer.questionId].optionCounts[option] !== undefined) {
              qstats[answer.questionId].optionCounts[option] += 1;
            }
          }
          
          const correctSet = new Set(answer.correct || []);
          qstats[answer.questionId].correct = [...correctSet];
          
          const chosenSet = new Set(answer.chosen || []);
          const isEqual = (correctSet.size === chosenSet.size) 
            && [...correctSet].every(x => chosenSet.has(x));
          
          if (isEqual) qstats[answer.questionId].correctCount += 1;
        }
      }
      
      logger.info('Stats export successful', {
        sessionName,
        participants: submissions.length
      });
      
      return {
        sessionName,
        quizTitle: quiz.title,
        participants: submissions.length,
        questionStats: Object.values(qstats)
      };
    } catch (err) {
      logger.error('Stats export failed', {
        sessionName,
        error: err.message
      });
      throw err;
    }
  }
  
  exportQuizJSON(quizId) {
    logger.debug('Exporting quiz to JSON', { quizId });
    
    const quiz = this.quizService.loadQuiz(quizId);
    
    try {
      logger.info('JSON export successful', { quizId, title: quiz.title });
      
      return {
        content: JSON.stringify(quiz, null, 2),
        filename: `${quiz.title || 'quiz'}_${quizId}.json`,
        contentType: 'application/json'
      };
    } catch (err) {
      logger.error('JSON export failed', { quizId, error: err.message });
      throw err;
    }
  }
}

module.exports = ExportService;