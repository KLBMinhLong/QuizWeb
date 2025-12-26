class ExamAttempt {
  constructor() {
    this.userId = null;
    this.subjectId = null;
    this.startedAt = new Date();
    this.finishedAt = null;
    this.durationMinutes = 0;
    this.score = null;
    this.totalQuestions = 0;
    this.questionsSnapshot = [];
    this.userAnswers = {};
  }
}

module.exports = ExamAttempt;
