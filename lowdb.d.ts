import { ObjectId } from "mongodb";

interface LowDbResult {
  data: Record<string, any>[];
  write: () => Promise<void>;
}

declare class LowDbConnector {
  constructor(dbPath: string);
  
  connect(): Promise<void>;
  collection(name: string): Promise<LowDbResult>;
  
  createOne(coll: string, doc: Record<string, any>): Promise<{
    insertedId: string;
  }>;
  
  createMany(coll: string, docs: Record<string, any>[]): Promise<{
    insertedCount: number;
    insertedIds: string[];
  }>;
  
  findOne(coll: string, query: Record<string, any>, sort?: Record<string, number>): Promise<Record<string, any> | null>;
  findById(coll: string, id: string): Promise<Record<string, any> | null>;
  
  find(
    coll: string, 
    query: Record<string, any>, 
    limit?: number, 
    skip?: number, 
    sort?: Record<string, number>
  ): Promise<Record<string, any>[]>;
  
  updateOne(coll: string, doc: Record<string, any> & { _id: string }): Promise<{
    matchedCount: number;
    modifiedCount: number;
  }>;
  
  updateMany(
    coll: string, 
    q: Record<string, any>, 
    doc: Record<string, any>
  ): Promise<{
    matchedCount: number;
    modifiedCount: number;
  }>;
  
  upsertOne(coll: string, doc: Record<string, any> & { key?: string }): Promise<{
    upsertedId?: string;
    upsertedCount?: number;
    matchedCount?: number;
    modifiedCount?: number;
  }>;
  
  deleteOne(coll: string, id: string): Promise<{
    deletedCount: number;
  }>;
  
  deleteMany(coll: string, q: Record<string, any>): Promise<{
    deletedCount: number;
  }>;
  
  count(coll: string, q?: Record<string, any>): Promise<number>;
  
  close(): Promise<void>;
  
  private matchQuery(doc: Record<string, any>, query: Record<string, any>): boolean;
}

export default LowDbConnector; 