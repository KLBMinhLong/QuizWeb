class Subject {
  constructor() {
    this.name = "";
    this.slug = "";
    this.description = "";
    this.examConfig = { easyCount: 10, mediumCount: 5, hardCount: 5, durationMinutes: 30 };
    this.isActive = true;
    this.tags = [];
  }
}

module.exports = Subject;



