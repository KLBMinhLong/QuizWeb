var config = require(global.__basedir + "/Config/Setting.json");

class DatabaseConnection {
  static getMongoClient() {
    const { MongoClient } = require("mongodb");

    const uri = process.env.MONGODB_URI || config.mongodb.uri;
    const client = new MongoClient(uri);
    return client;
  }

  static getDatabaseName() {
    return process.env.MONGODB_DB || config.mongodb.database;
  }
}

module.exports = DatabaseConnection;



