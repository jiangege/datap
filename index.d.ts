import { MongoConnector } from './mongo';

interface Config {
  mongo?: string | { url: string; dbName: string };
}

declare function createConnector(config?: Config): {
  mongo: MongoConnector | null;
};

export = createConnector; 