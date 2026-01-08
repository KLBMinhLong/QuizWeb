class SubjectComment {
  constructor() {
    this.subjectId = null;
    this.userId = null;
    this.usernameSnapshot = "";
    this.content = "";
    this.status = "visible";
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}

module.exports = SubjectComment;
