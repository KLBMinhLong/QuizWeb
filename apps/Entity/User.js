class User {
  constructor() {
    // Thông tin cơ bản
    this.username = "";
    this.normalizedUserName = "";
    this.email = "";
    this.normalizedEmail = "";
    this.passwordHash = "";
    
    // Thông tin cá nhân (giống ASP.NET Identity)
    this.fullName = "";
    this.address = "";
    this.dateOfBirth = null;
    this.profilePicture = "";
    
    // Thông tin hệ thống
    this.ngayTao = null; // Ngày tạo
    this.tichDiem = 0; // Tích điểm
    this.trangThai = "active"; // active, blocked, inactive
    
    // Timestamps
    this.createdAt = null;
    this.updatedAt = null;
    this.lastLoginAt = null;
    
    // Concurrency
    this.concurrencyStamp = "";
  }
}

module.exports = User;



