import MongoConnector from "./mongo.js";
import LowDbConnector from "./lowdb.js";

export default function Datap(config = {}) {
  if (config.mongo) { 
    Datap.mongo = new MongoConnector(config.mongo.url, config.mongo.dbName, config.mongo.options);
  }
  if (config.lowdb) {
    Datap.low = new LowDbConnector(config.lowdb.dbPath);
  }
}