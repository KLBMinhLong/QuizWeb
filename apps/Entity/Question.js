class Question {
  constructor() {
    this.subjectId = null;
    this.difficulty = "easy";
    this.type = "single_choice";
    this.content = "";
    this.mediaUrl = null;
    this.answers = [];
  }
}

module.exports = Question;



