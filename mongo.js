import { MongoClient, ObjectId } from "mongodb";
class MongoConnector {
  #url = "";
  #dbName = "";
  #mongoClient = null;
  #db = null;
  #options = {};

  constructor(url, dbName, options) {
    this.#url = url;
    this.#dbName = dbName;
    this.#options = options;
  }

  async connect(url, dbName, options) {
    this.#mongoClient = await MongoClient.connect(url ?? this.#url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      ...(options ?? this.#options)
    });
    this.#db = this.#mongoClient.db(dbName ?? this.#dbName);
  }

  async db(dbName) {
    if (this.#mongoClient == null) {
      await this.connect(this.#url, this.#dbName, this.#options);
    }
    if (dbName && this.#dbName !== dbName) {
      this.#db = this.#mongoClient.db(dbName);
      this.#dbName = dbName;
    }
    return this.#db;
  }

  async createOne(coll, doc) {
    const db = await this.db();
    return db.collection(coll).insertOne({
      ...doc,
    });
  }

  async createMany(coll, docs) {
    const db = await this.db();
    const result = await db.collection(coll).insertMany([...docs]);
    if (result?.insertedIds) {
      result.insertedIds = Object.values(result.insertedIds);
    }
    return result;
  }

  async findOne(coll, query, sort = { _id: -1 }) {
    const db = await this.db();
    return db.collection(coll).findOne(query, {
      sort,
    });
  }

  async findById(coll, id) {
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

  async find(coll, query, limit = 0, skip = 0, sort) {
    const db = await this.db();
    return db
      .collection(coll)
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .toArray();
  }

  async updateOne(coll, doc) {
    const db = await this.db();
    const { id, ...restDoc } = doc;
    return db.collection(coll).updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: { ...restDoc },
        $currentDate: {
          lastModified: true,
        },
      }
    );
  }
  
  async updateMany(coll, q, doc) {
    const db = await this.db();
    return db.collection(coll).updateMany(q, {
      $set: { ...doc },
      $currentDate: {
        lastModified: true,
      },
    });
  }
  
  async upsertOne(coll, doc) {
    const db = await this.db();
    return db.collection(coll).updateOne(
      {
        [doc["key"]]: doc[doc["key"]],
      },
      {
        $set: { ...doc },
        $currentDate: {
          lastModified: true,
        },
      },
      {
        upsert: true,
      }
    );
  }
  
  async deleteOne(coll, id) {
    const db = await this.db();
    return db.collection(coll).deleteOne({
      _id: new ObjectId(id),
    });
  }

  async deleteMany(coll, q) {
    const db = await this.db();
    return db.collection(coll).deleteMany(q);
  }

  async count(coll, q) {
    const db = await this.db();
    return db.collection(coll).countDocuments(q);
  }

  async close() {
    if (this.#mongoClient) {
      await this.#mongoClient.close();
      this.#mongoClient = null;
      this.#db = null;
    }
  }
}

export default MongoConnector;