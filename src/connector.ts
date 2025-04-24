export interface CreateOneResult {
  insertedId: string | any;
}

export interface CreateManyResult {
  insertedCount: number;
  insertedIds: string[] | any[];
}

export interface UpdateResult {
  matchedCount: number;
  modifiedCount: number;
}

export interface UpsertResult extends UpdateResult {
  upsertedId?: string | any;
  upsertedCount?: number;
}

export interface DeleteResult {
  deletedCount: number;
}

export default abstract class DatabaseConnector {
  abstract connect(url?: string, dbName?: string, options?: any): Promise<void>;

  abstract collection(name: string): Promise<any>;

  abstract createOne(
    coll: string,
    doc: Record<string, any>
  ): Promise<CreateOneResult>;

  abstract createMany(
    coll: string,
    docs: Record<string, any>[]
  ): Promise<CreateManyResult>;

  abstract findOne(
    coll: string,
    query: Record<string, any>,
    sort?: Record<string, 1 | -1>
  ): Promise<Record<string, any> | null>;

  abstract findById(
    coll: string,
    id: string
  ): Promise<Record<string, any> | null>;

  abstract find(
    coll: string,
    query: Record<string, any>,
    limit?: number,
    skip?: number,
    sort?: Record<string, 1 | -1>
  ): Promise<Record<string, any>[]>;

  abstract updateOne(
    coll: string,
    doc: Record<string, any> & { _id?: string; id?: string }
  ): Promise<UpdateResult>;

  abstract updateMany(
    coll: string,
    query: Record<string, any>,
    doc: Record<string, any>
  ): Promise<UpdateResult>;

  abstract upsertOne(
    coll: string,
    doc: Record<string, any> & { key?: string }
  ): Promise<UpsertResult>;

  abstract deleteOne(coll: string, id: string): Promise<DeleteResult>;

  abstract deleteMany(
    coll: string,
    query: Record<string, any>
  ): Promise<DeleteResult>;

  abstract count(coll: string, query?: Record<string, any>): Promise<number>;

  abstract close(): Promise<void>;
}
