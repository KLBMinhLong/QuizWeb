class User {
  constructor() {
    this.username = "";
    this.normalizedUserName = "";
    this.email = "";
    this.normalizedEmail = "";
    this.passwordHash = "";
    this.fullName = "";
    this.address = "";
    this.dateOfBirth = null;
    this.profilePicture = "";
    this.ngayTao = null;
    this.tichDiem = 0;
    this.trangThai = "active";
    this.createdAt = null;
    this.updatedAt = null;
    this.lastLoginAt = null;
    this.concurrencyStamp = "";
  }
}

module.exports = User;



