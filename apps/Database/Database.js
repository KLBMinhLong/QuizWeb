var config = require(global.__basedir + "/Config/Setting.json");

class DatabaseConnection {
  static getMongoClient() {
    const { MongoClient } = require("mongodb");

    const uri = config.mongodb.uri;
    const client = new MongoClient(uri);
    return client;
  }

  static getDatabaseName() {
    return config.mongodb.database;
  }
}

module.exports = DatabaseConnection;



