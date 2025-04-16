import path from "path";
import { JSONFilePreset } from "lowdb/node";
import { ObjectId } from "mongodb";

class LowDbConnector {
  #collections = {};
  #dbPath = "";

  constructor(dbPath) {
    this.#dbPath = dbPath;
  }

  async connect() {
    // Connection is handled per database in the db method
  }

  async collection(name) {
    if (this.#collections[name]) {
      return this.#collections[name];
    }
    this.#collections[name] = await JSONFilePreset(
      path.join(this.#dbPath, name + ".json")
    );
    return this.#collections[name];
  }

  async createOne(coll, doc) {
    const db = await this.collection(coll);
    const data = db.data || [];
    const newDoc = {
      ...doc,
      _id: doc._id || new ObjectId().toString(),
    };
    data.push(newDoc);
    db.data = data;
    await db.write();
    return { insertedId: newDoc._id };
  }

  async createMany(coll, docs) {
    const db = await this.collection(coll);
    const data = db.data || [];
    const insertedIds = [];

    for (const doc of docs) {
      const newDoc = {
        ...doc,
        _id: doc._id || new ObjectId().toString(),
      };
      data.push(newDoc);
      insertedIds.push(newDoc._id);
    }

    db.data = data;
    await db.write();
    return { insertedCount: docs.length, insertedIds };
  }

  async findOne(coll, query, sort = { _id: -1 }) {
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

  async findById(coll, id) {
    const db = await this.collection(coll);
    const data = db.data || [];
    return data.find((item) => item._id === id) || null;
  }

  async find(coll, query, limit = 0, skip = 0, sort) {
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

  async updateOne(coll, doc) {
    const db = await this.collection(coll);
    const data = db.data || [];
    const { _id, ...restDoc } = doc;

    const index = data.findIndex((item) => item._id === _id);
    if (index === -1) {
      return { matchedCount: 0, modifiedCount: 0 };
    }

    data[index] = {
      ...data[index],
      ...restDoc,
      lastModified: new Date(),
    };

    db.data = data;
    await db.write();

    return { matchedCount: 1, modifiedCount: 1 };
  }

  async updateMany(coll, q, doc) {
    const db = await this.collection(coll);
    const data = db.data || [];

    let modifiedCount = 0;
    for (let i = 0; i < data.length; i++) {
      if (this.#matchQuery(data[i], q)) {
        data[i] = {
          ...data[i],
          ...doc,
          lastModified: new Date(),
        };
        modifiedCount++;
      }
    }

    db.data = data;
    await db.write();

    return { matchedCount: modifiedCount, modifiedCount };
  }

  async upsertOne(coll, doc) {
    const db = await this.collection(coll);
    const data = db.data || [];

    // Check if document has _id
    if (doc._id) {
      const index = data.findIndex((item) => item._id === doc._id);

      if (index !== -1) {
        // Update existing document
        data[index] = {
          ...data[index],
          ...doc,
          lastModified: new Date(),
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
          lastModified: new Date(),
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
      lastModified: new Date(),
    };
    data.push(newDoc);
    db.data = data;
    await db.write();
    return { upsertedId: newDoc._id, upsertedCount: 1 };
  }

  async deleteOne(coll, id) {
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

  async deleteMany(coll, q) {
    const db = await this.collection(coll);
    let data = db.data || [];

    const initialLength = data.length;
    data = data.filter((item) => !this.#matchQuery(item, q));

    const deletedCount = initialLength - data.length;

    db.data = data;
    await db.write();

    return { deletedCount };
  }

  async count(coll, q) {
    const db = await this.collection(coll);
    const data = db.data || [];

    if (!q) {
      return data.length;
    }

    return data.filter((item) => this.#matchQuery(item, q)).length;
  }

  async close() {
    // No connection to close with lowdb, but we'll reset the collections
    this.#collections = {};
  }

  // Helper method to match a document against a query
  #matchQuery(doc, query) {
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
      } else {
        // Simple equality check
        if (doc[key] !== value) return false;
      }
    }

    return true;
  }
}

export default LowDbConnector;
