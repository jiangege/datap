import {
  Db,
  Document,
  MongoClient,
  MongoClientOptions,
  ObjectId,
} from "mongodb";
import DatabaseConnector, {
  CreateOneResult,
  CreateManyResult,
  UpdateResult,
  DeleteResult,
  UpsertResult,
} from "./connector";

export default class MongoConnector extends DatabaseConnector {
  #url: string = "";
  #dbName: string = "";
  #mongoClient: MongoClient | null = null;
  #db: Db | null = null;
  #options: MongoClientOptions = {};

  constructor(url: string, dbName: string, options?: MongoClientOptions) {
    super();
    this.#url = url;
    this.#dbName = dbName;
    this.#options = options || {};
  }

  async connect(
    url?: string,
    dbName?: string,
    options?: MongoClientOptions
  ): Promise<void> {
    this.#mongoClient = await MongoClient.connect(url ?? this.#url, {
      ...(options ?? this.#options),
    });
    this.#db = this.#mongoClient.db(dbName ?? this.#dbName);
  }

  async db(dbName?: string): Promise<Db> {
    if (this.#mongoClient == null) {
      await this.connect(this.#url, this.#dbName, this.#options);
    }
    if (dbName && this.#dbName !== dbName) {
      this.#db = this.#mongoClient!.db(dbName);
      this.#dbName = dbName;
    }
    return this.#db!;
  }

  async collection(name: string): Promise<any> {
    const db = await this.db();
    return db.collection(name);
  }

  async createOne(
    coll: string,
    doc: Record<string, any>
  ): Promise<CreateOneResult> {
    const db = await this.db();
    const now = new Date();
    return db.collection(coll).insertOne({
      ...doc,
      createdAt: now,
      updatedAt: now,
    }) as unknown as CreateOneResult;
  }

  async createMany(
    coll: string,
    docs: Record<string, any>[]
  ): Promise<CreateManyResult> {
    const db = await this.db();
    const now = new Date();
    const docsWithTimestamps = docs.map((doc) => ({
      ...doc,
      createdAt: now,
      updatedAt: now,
    }));
    const result = await db.collection(coll).insertMany(docsWithTimestamps);
    const convertedResult: CreateManyResult = {
      insertedCount: result.insertedCount,
      insertedIds: Object.values(result.insertedIds),
    };
    return convertedResult;
  }

  async findOne(
    coll: string,
    query: Record<string, any>,
    sort?: Record<string, 1 | -1>
  ): Promise<Document | null> {
    const db = await this.db();
    return db.collection(coll).findOne(query, {
      sort: sort || { _id: -1 },
    });
  }

  async findById(coll: string, id: string): Promise<Document | null> {
    const db = await this.db();
    return db.collection(coll).findOne(
      {
        _id: new ObjectId(id),
      },
      {
        sort: { _id: -1 },
      }
    );
  }

  async find(
    coll: string,
    query: Record<string, any>,
    limit: number = 0,
    skip: number = 0,
    sort?: Record<string, 1 | -1>
  ): Promise<Document[]> {
    const db = await this.db();
    const cursor = db.collection(coll).find(query).skip(skip).limit(limit);

    if (sort) {
      cursor.sort(sort);
    }

    return cursor.toArray();
  }

  async updateOne(
    coll: string,
    doc: Record<string, any> & { id?: string; _id?: string }
  ): Promise<UpdateResult> {
    const db = await this.db();
    const { id, _id, ...restDoc } = doc;
    const documentId = id || _id;

    if (!documentId) {
      throw new Error("Either id or _id must be provided");
    }

    return db.collection(coll).updateOne(
      {
        _id: new ObjectId(documentId),
      },
      {
        $set: {
          ...restDoc,
          updatedAt: new Date(),
        },
      }
    ) as unknown as UpdateResult;
  }

  async updateMany(
    coll: string,
    query: Record<string, any>,
    doc: Record<string, any>
  ): Promise<UpdateResult> {
    const db = await this.db();
    return db.collection(coll).updateMany(query, {
      $set: {
        ...doc,
        updatedAt: new Date(),
      },
    }) as unknown as UpdateResult;
  }

  async upsertOne(
    coll: string,
    doc: Record<string, any> & { key?: string }
  ): Promise<UpsertResult> {
    const db = await this.db();
    const now = new Date();

    if (!doc.key || !doc[doc.key]) {
      throw new Error("Key field is required for upsert operation");
    }

    return db.collection(coll).updateOne(
      {
        [doc.key]: doc[doc.key],
      },
      [
        {
          $set: {
            ...doc,
            updatedAt: now,
            createdAt: {
              $cond: {
                if: { $eq: ["$_id", null] },
                then: now,
                else: "$createdAt",
              },
            },
          },
        },
      ],
      {
        upsert: true,
      }
    ) as unknown as UpsertResult;
  }

  async deleteOne(coll: string, id: string): Promise<DeleteResult> {
    const db = await this.db();
    return db.collection(coll).deleteOne({
      _id: new ObjectId(id),
    }) as unknown as DeleteResult;
  }

  async deleteMany(
    coll: string,
    query: Record<string, any>
  ): Promise<DeleteResult> {
    const db = await this.db();
    return db.collection(coll).deleteMany(query) as unknown as DeleteResult;
  }

  async count(coll: string, query?: Record<string, any>): Promise<number> {
    const db = await this.db();
    return db.collection(coll).countDocuments(query || {});
  }

  async close(): Promise<void> {
    if (this.#mongoClient) {
      await this.#mongoClient.close();
      this.#mongoClient = null;
      this.#db = null;
    }
  }
}
