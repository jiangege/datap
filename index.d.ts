import MongoConnector from "./mongo";
import LowDbConnector from "./lowdb";

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

declare function Datap(config?: DatapConfig): void;

declare namespace Datap {
  export let mongo: MongoConnector;
  export let low: LowDbConnector;
}

export default Datap; 