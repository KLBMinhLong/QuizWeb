var config = require(global.__basedir + "/Config/Setting.json");

class DatabaseConnection {
  static getMongoClient() {
    const { MongoClient } = require("mongodb");

    // Ưu tiên đọc từ biến môi trường (an toàn hơn), fallback về config nếu không có
    const uri = process.env.MONGODB_URI || config.mongodb.uri;
    const client = new MongoClient(uri);
    return client;
  }

  static getDatabaseName() {
    // Cho phép override tên DB qua biến môi trường 
    return process.env.MONGODB_DB || config.mongodb.database;
  }
}

module.exports = DatabaseConnection;



