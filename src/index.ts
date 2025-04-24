import MongoConnector from "./mongo.js";
import LowDbConnector from "./lowdb.js";

interface MongoConfig {
  url: string;
  dbName: string;
  options?: Record<string, any>;
}

interface LowDbConfig {
  dbPath: string;
}

interface DatapConfig {
  mongo?: MongoConfig;
  lowdb?: LowDbConfig;
}

function Datap(config: DatapConfig = {}): void {
  if (config.mongo) {
    Datap.mongo = new MongoConnector(
      config.mongo.url,
      config.mongo.dbName,
      config.mongo.options
    );
  }
  if (config.lowdb) {
    Datap.low = new LowDbConnector(config.lowdb.dbPath);
  }
}

// Add static properties to the function
namespace Datap {
  export let mongo: MongoConnector;
  export let low: LowDbConnector;
}

export default Datap;
