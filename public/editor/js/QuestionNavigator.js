/**
 * QuestionNavigator.js - Manages question navigation tabs and drag & drop
 */

import { i18n } from '../../common/i18n.js';

export class QuestionNavigator {
  constructor(editor) {
    this.editor = editor;
    this.draggedQuestionIdx = null;
  }

  /**
   * Render the question navigation bar
   */
  render() {
    const nav = document.getElementById('questionNav');
    nav.innerHTML = '';
    
    this.editor.quizData.questions.forEach((q, idx) => {
      const btn = document.createElement('button');
      btn.className = 'nav-item' + (idx === this.editor.currentQuestionIdx ? ' active' : '');
      btn.textContent = q.keyword || i18n.t('editor_question_fallback', { number: idx + 1 });
      btn.dataset.index = idx;
      btn.draggable = true;
      
      btn.addEventListener('click', (e) => {
        if (!e.target.classList.contains('dragging')) {
          this.selectQuestion(idx);
        }
      });
      
      btn.addEventListener('dragstart', (e) => this.handleDragStart(e));
      btn.addEventListener('dragover', (e) => this.handleDragOver(e));
      btn.addEventListener('drop', (e) => this.handleDrop(e));
      btn.addEventListener('dragend', (e) => this.handleDragEnd(e));
      
      nav.appendChild(btn);
    });
    
    // Only show add button if quiz exists in database
    if (this.editor.currentQuizId) {
      const addBtn = document.createElement('button');
      addBtn.className = 'nav-add-btn';
      addBtn.innerHTML = '+';
      addBtn.title = i18n.t('editor_add_question_title');
      addBtn.onclick = () => this.addQuestion();
      nav.appendChild(addBtn);
    }
  }

  /**
   * Select a question by index
   */
  selectQuestion(idx) {
    // Validate current question before switching
    if (!this.editor.dataSync.validateCurrentQuestion()) {
      return; // Validation failed, don't switch questions
    }
    
    this.editor.currentQuestionIdx = idx;
    this.render();
    this.editor.questionEditor.render();
  }

  /**
   * Scroll navigation left or right
   */
  scroll(direction) {
    const nav = document.getElementById('questionNav');
    nav.scrollBy({ left: direction * 200, behavior: 'smooth' });
  }

  /**
   * Add a new question with 2 default empty options
   */
  addQuestion() {
    this.editor.quizData.questions.push({
      id: 'q' + (this.editor.quizData.questions.length + 1),
      keyword: '',
      text: '',
      reason: '',
      options: [
        { id: 'a', text: '', reason: '', correct: false },
        { id: 'b', text: '', reason: '', correct: false }
      ],
      points: 1
    });
    this.editor.currentQuestionIdx = this.editor.quizData.questions.length - 1;
    this.editor.render();
  }

  /**
   * Delete a question
   */
  deleteQuestion(idx) {
    if (confirm(i18n.t('editor_delete_question_confirm'))) {
      this.editor.quizData.questions.splice(idx, 1);
      if (this.editor.currentQuestionIdx >= this.editor.quizData.questions.length) {
        this.editor.currentQuestionIdx = Math.max(0, this.editor.quizData.questions.length - 1);
      }
      this.editor.render();
    }
  }

  /**
   * Update a question field
   */
  updateQuestion(idx, field, value) {
    this.editor.quizData.questions[idx][field] = value;
  }

  // Drag & Drop handlers for questions
  
  handleDragStart(e) {
    this.draggedQuestionIdx = parseInt(e.currentTarget.dataset.index);
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  }

  handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    
    const target = e.currentTarget;
    if (target.classList.contains('nav-item') && !target.classList.contains('dragging')) {
      const rect = target.getBoundingClientRect();
      const midpoint = rect.left + rect.width / 2;
      
      if (e.clientX < midpoint) {
        target.classList.add('drag-over-left');
        target.classList.remove('drag-over-right');
      } else {
        target.classList.add('drag-over-right');
        target.classList.remove('drag-over-left');
      }
    }
    
    return false;
  }

  handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    
    const target = e.currentTarget;
    const targetIdx = parseInt(target.dataset.index);
    
    if (this.draggedQuestionIdx !== null && targetIdx !== this.draggedQuestionIdx) {
      const [movedQuestion] = this.editor.quizData.questions.splice(this.draggedQuestionIdx, 1);
      const newIdx = this.draggedQuestionIdx < targetIdx ? targetIdx : targetIdx;
      this.editor.quizData.questions.splice(newIdx, 0, movedQuestion);
      
      if (this.editor.currentQuestionIdx === this.draggedQuestionIdx) {
        this.editor.currentQuestionIdx = newIdx;
      } else if (this.draggedQuestionIdx < this.editor.currentQuestionIdx && newIdx >= this.editor.currentQuestionIdx) {
        this.editor.currentQuestionIdx--;
      } else if (this.draggedQuestionIdx > this.editor.currentQuestionIdx && newIdx <= this.editor.currentQuestionIdx) {
        this.editor.currentQuestionIdx++;
      }
      
      this.editor.render();
    }
    
    target.classList.remove('drag-over-left', 'drag-over-right');
    return false;
  }

  handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('drag-over-left', 'drag-over-right');
    });
    
    this.draggedQuestionIdx = null;
  }
}