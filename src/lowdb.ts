import path from "path";
import { JSONFilePreset } from "lowdb/node";
import { ObjectId } from "mongodb";
import DatabaseConnector, {
  CreateOneResult,
  CreateManyResult,
  UpdateResult,
  DeleteResult,
  UpsertResult,
} from "./connector";

interface LowDbResult {
  data: Record<string, any>[];
  write: () => Promise<void>;
}

interface CollectionMap {
  [key: string]: LowDbResult;
}

export default class LowDbConnector extends DatabaseConnector {
  #collections: CollectionMap = {};
  #dbPath: string = "";

  constructor(dbPath: string) {
    super();
    this.#dbPath = dbPath;
  }

  async connect(): Promise<void> {
    // Connection is handled per database in the collection method
  }

  async collection(name: string): Promise<LowDbResult> {
    if (this.#collections[name]) {
      return this.#collections[name];
    }
    this.#collections[name] = await JSONFilePreset(
      path.join(this.#dbPath, name + ".json"),
      []
    );
    return this.#collections[name];
  }

  async createOne(
    coll: string,
    doc: Record<string, any>
  ): Promise<CreateOneResult> {
    const db = await this.collection(coll);
    const data = db.data || [];
    const now = new Date();
    const newDoc = {
      ...doc,
      _id: doc._id || new ObjectId().toString(),
      createdAt: now,
      updatedAt: now,
    };
    data.push(newDoc);
    db.data = data;
    await db.write();
    return { insertedId: newDoc._id };
  }

  async createMany(
    coll: string,
    docs: Record<string, any>[]
  ): Promise<CreateManyResult> {
    const db = await this.collection(coll);
    const data = db.data || [];
    const insertedIds: string[] = [];
    const now = new Date();

    for (const doc of docs) {
      const newDoc = {
        ...doc,
        _id: doc._id || new ObjectId().toString(),
        createdAt: now,
        updatedAt: now,
      };
      data.push(newDoc);
      insertedIds.push(newDoc._id);
    }

    db.data = data;
    await db.write();
    return { insertedCount: docs.length, insertedIds };
  }

  async findOne(
    coll: string,
    query: Record<string, any>,
    sort: Record<string, 1 | -1> = { _id: -1 }
  ): Promise<Record<string, any> | null> {
    const db = await this.collection(coll);
    const data = db.data || [];

    // Simple implementation of query matching
    const matches = data.filter((item) => this.#matchQuery(item, query));

    if (matches.length === 0) {
      return null;
    }

    // Simple sort implementation
    if (sort) {
      const sortField = Object.keys(sort)[0];
      const sortOrder = sort[sortField];
      matches.sort((a, b) => {
        if (sortOrder === -1) {
          return String(b[sortField]).localeCompare(String(a[sortField]));
        } else {
          return String(a[sortField]).localeCompare(String(b[sortField]));
        }
      });
    }

    return matches[0];
  }

  async findById(
    coll: string,
    id: string
  ): Promise<Record<string, any> | null> {
    const db = await this.collection(coll);
    const data = db.data || [];
    return data.find((item) => item._id === id) || null;
  }

  async find(
    coll: string,
    query: Record<string, any>,
    limit: number = 0,
    skip: number = 0,
    sort?: Record<string, 1 | -1>
  ): Promise<Record<string, any>[]> {
    const db = await this.collection(coll);
    const data = db.data || [];

    // Filter by query
    let results = data.filter((item) => this.#matchQuery(item, query));

    // Sort if specified
    if (sort) {
      const sortField = Object.keys(sort)[0];
      const sortOrder = sort[sortField];
      results.sort((a, b) => {
        if (sortOrder === -1) {
          return String(b[sortField]).localeCompare(String(a[sortField]));
        } else {
          return String(a[sortField]).localeCompare(String(b[sortField]));
        }
      });
    }

    // Skip and limit
    if (skip > 0) {
      results = results.slice(skip);
    }

    if (limit > 0) {
      results = results.slice(0, limit);
    }

    return results;
  }

  async updateOne(
    coll: string,
    doc: Record<string, any> & { _id?: string; id?: string }
  ): Promise<UpdateResult> {
    const db = await this.collection(coll);
    const data = db.data || [];

    const { _id, id, ...restDoc } = doc;
    const documentId = _id || id;

    if (!documentId) {
      throw new Error("Either _id or id must be provided");
    }

    const index = data.findIndex((item) => item._id === documentId);
    if (index === -1) {
      return { matchedCount: 0, modifiedCount: 0 };
    }

    data[index] = {
      ...data[index],
      ...restDoc,
      updatedAt: new Date(),
    };

    db.data = data;
    await db.write();

    return { matchedCount: 1, modifiedCount: 1 };
  }

  async updateMany(
    coll: string,
    query: Record<string, any>,
    doc: Record<string, any>
  ): Promise<UpdateResult> {
    const db = await this.collection(coll);
    const data = db.data || [];
    const now = new Date();

    let modifiedCount = 0;
    for (let i = 0; i < data.length; i++) {
      if (this.#matchQuery(data[i], query)) {
        data[i] = {
          ...data[i],
          ...doc,
          updatedAt: now,
        };
        modifiedCount++;
      }
    }

    db.data = data;
    await db.write();

    return { matchedCount: modifiedCount, modifiedCount };
  }

  async upsertOne(
    coll: string,
    doc: Record<string, any> & { key?: string }
  ): Promise<UpsertResult> {
    const db = await this.collection(coll);
    const data = db.data || [];
    const now = new Date();

    // Check if document has _id
    if (doc._id) {
      const index = data.findIndex((item) => item._id === doc._id);

      if (index !== -1) {
        // Update existing document
        data[index] = {
          ...data[index],
          ...doc,
          updatedAt: now,
        };
        db.data = data;
        await db.write();
        return { matchedCount: 1, modifiedCount: 1 };
      }
    }

    // Check if document has a specified key field for matching
    if (doc.key && doc[doc.key]) {
      const keyField = doc.key;
      const keyValue = doc[keyField];
      const index = data.findIndex((item) => item[keyField] === keyValue);

      if (index !== -1) {
        // Update existing document based on key field
        data[index] = {
          ...data[index],
          ...doc,
          updatedAt: now,
        };
        db.data = data;
        await db.write();
        return { matchedCount: 1, modifiedCount: 1 };
      }
    }

    // Insert new document if no matching document found
    const newDoc = {
      ...doc,
      _id: doc._id || new ObjectId().toString(),
      createdAt: now,
      updatedAt: now,
    };
    data.push(newDoc);
    db.data = data;
    await db.write();
    return {
      upsertedId: newDoc._id,
      upsertedCount: 1,
      matchedCount: 0,
      modifiedCount: 0,
    };
  }

  async deleteOne(coll: string, id: string): Promise<DeleteResult> {
    const db = await this.collection(coll);
    const data = db.data || [];

    const index = data.findIndex((item) => item._id === id);
    if (index === -1) {
      return { deletedCount: 0 };
    }

    data.splice(index, 1);
    db.data = data;
    await db.write();

    return { deletedCount: 1 };
  }

  async deleteMany(
    coll: string,
    query: Record<string, any>
  ): Promise<DeleteResult> {
    const db = await this.collection(coll);
    let data = db.data || [];

    const initialLength = data.length;
    data = data.filter((item) => !this.#matchQuery(item, query));

    const deletedCount = initialLength - data.length;

    db.data = data;
    await db.write();

    return { deletedCount };
  }

  async count(coll: string, query?: Record<string, any>): Promise<number> {
    const db = await this.collection(coll);
    const data = db.data || [];

    if (!query) {
      return data.length;
    }

    return data.filter((item) => this.#matchQuery(item, query)).length;
  }

  async close(): Promise<void> {
    // No connection to close with lowdb, but we'll reset the collections
    this.#collections = {};
  }

  // Helper method to match a document against a query
  #matchQuery(doc: Record<string, any>, query: Record<string, any>): boolean {
    if (!query || Object.keys(query).length === 0) {
      return true;
    }

    for (const [key, value] of Object.entries(query)) {
      // Handle special MongoDB operators
      if (typeof value === "object" && value !== null) {
        if (value.$eq !== undefined && doc[key] !== value.$eq) return false;
        if (value.$ne !== undefined && doc[key] === value.$ne) return false;
        if (value.$gt !== undefined && !(doc[key] > value.$gt)) return false;
        if (value.$gte !== undefined && !(doc[key] >= value.$gte)) return false;
        if (value.$lt !== undefined && !(doc[key] < value.$lt)) return false;
        if (value.$lte !== undefined && !(doc[key] <= value.$lte)) return false;
        if (value.$in !== undefined && !value.$in.includes(doc[key]))
          return false;
        if (value.$nin !== undefined && value.$nin.includes(doc[key]))
          return false;
        if (value.$regex !== undefined) {
          const regex = new RegExp(value.$regex, value.$options || "");
          if (!regex.test(String(doc[key]))) return false;
        }
      } else {
        // Simple equality check
        if (doc[key] !== value) return false;
      }
    }

    return true;
  }
}
