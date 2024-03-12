const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");
class MongoConnector {
  #url = "";
  #dbName = "";
  #mongoClient = null;
  #db = null;
  /** Create a mongodb instance
   * @param {string} url - Connect to MongoDB using a url
   * @param {string} dbName - Mongodb database name
   */
  constructor(url, dbName) {
    this.#url = url;
    this.#dbName = dbName;
  }

  /**
   * Connects to a MongoDB database using the provided URL and database name or the default values if not provided.
   * @async
   * @param {string} [url=this.#url] - The MongoDB connection string URL. Defaults to the value of the `#url` property if not provided.
   * @param {string} [dbName=this.#dbName] - The name of the database to connect to. Defaults to the value of the `#dbName` property if not provided.
   * @returns {Promise<void>} A promise that resolves when the connection is established.
   */
  async connect(url, dbName) {
    this.#mongoClient = await MongoClient.connect(url ?? this.#url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    this.#db = this.#mongoClient.db(dbName ?? this.#dbName);
  }

  /**
   * Returns the current database instance or connects to a specified database if provided.
   * @async
   * @param {string} [dbName] - The name of the database to connect to. If provided and different from the current database, a new connection will be established to the specified database.
   * @returns {Promise<Db>} A promise that resolves with the current database instance.
   */

  async db(dbName) {
    if (this.#mongoClient == null) {
      await this.connect();
    }
    if (dbName && this.#dbName !== dbName) {
      this.#db = this.#mongoClient.db(dbName);
      this.#dbName = dbName;
    }
    return this.#db;
  }

  /**
   * Creates a new document in the specified collection.
   * @async
   * @param {string} coll - The name of the collection to insert the document into.
   * @param {Object} doc - The document to be inserted.
   * @returns {Promise<InsertOneResult>} A promise that resolves with the result of the insertion operation.
   */

  async create(coll, doc) {
    const db = await this.db();
    return db.collection(coll).insertOne({
      ...doc,
    });
  }

  /**
   * Creates multiple new documents in the specified collection.
   * @async
   * @param {string} coll - The name of the collection to insert the documents into.
   * @param {Object[]} docs - An array of documents to be inserted.
   * @returns {Promise<InsertManyResult>} A promise that resolves with the result of the insertion operation.
   */

  async createmany(coll, docs) {
    const db = await this.db();
    const result = await db.collection(coll).insertMany([...docs]);
    if (result?.insertedIds) {
      result.insertedIds = Object.values(result.insertedIds);
    }
    return result;
  }

  /**
   * Returns a single document that matches the specified query in the specified collection, sorted in descending order by default.
   * @async
   * @param {string} coll - The name of the collection to search in.
   * @param {Object} query - The query used to search for the document.
   * @param {Object} [sort={ _id: -1 }] - The sort order for the result. Defaults to descending order by `_id`.
   * @returns {Promise<Object>} A promise that resolves with the matching document.
   */

  async readone(coll, query, sort = { _id: -1 }) {
    const db = await this.db();
    return db.collection(coll).findOne(query, {
      sort,
    });
  }

  /**
   * Returns the document with the specified ID in the specified collection.
   * @async
   * @param {string} coll - The name of the collection to search in.
   * @param {string} id - The ID of the document to retrieve.
   * @returns {Promise<Object>} A promise that resolves with the matching document.
   */
  async readid(coll, id) {
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

  /**
   * Returns an array of documents that match the specified query in the specified collection, with optional pagination and sorting.
   * @async
   * @param {string} coll - The name of the collection to search in.
   * @param {Object} query - The query used to search for the documents.
   * @param {number} [limit=0] - The maximum number of documents to return. Defaults to all documents.
   * @param {number} [skip=0] - The number of documents to skip. Used for pagination.
   * @param {Object} [sort] - The sort order for the result.
   * @returns {Promise<Object[]>} A promise that resolves with an array of matching documents.
   */

  async read(coll, query, limit = 0, skip = 0, sort) {
    const db = await this.db();
    return db
      .collection(coll)
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .toArray();
  }

  /**

  Updates a single document with the specified ID in the specified collection.
  @async
  @param {string} coll - The name of the collection to update the document in.
  @param {Object} doc - The updated document.
  @returns {Promise<UpdateResult>} A promise that resolves with the result of the update operation.
*/

  async update(coll, doc) {
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

  /**
  Updates a single document with the specified ID in the specified collection.
  @async
  @param {string} coll - The name of the collection to update the document in.
  @param {Object} doc - The updated document.
  @returns {Promise<UpdateResult>} A promise that resolves with the result of the update operation.
  */

  async updatemany(coll, q, doc) {
    const db = await this.db();
    return db.collection(coll).updateMany(q, {
      $set: { ...doc },
      $currentDate: {
        lastModified: true,
      },
    });
  }

  /**

Inserts a new document or updates an existing document in the specified collection, based on a unique key provided in the document.
@async
@param {string} coll - The name of the collection to insert or update the document in.
@param {Object} doc - The document to be inserted or updated.
@returns {Promise<UpdateResult>} A promise that resolves with the result of the update operation.
*/

  async upsert(coll, doc) {
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

  /**

Deletes a single document with the specified ID in the specified collection.
@async
@param {string} coll - The name of the collection to delete the document from.
@param {string} id - The ID of the document to be deleted.
@returns {Promise<DeleteResult>} A promise that resolves with the result of the deletion operation.
*/

  async delete(coll, id) {
    const db = await this.db();
    return db.collection(coll).deleteMany({
      _id: new ObjectId(id),
    });
  }

  /**
Deletes all documents that match the specified query in the specified collection.
@async
@param {string} coll - The name of the collection to delete the documents from.
@param {Object} q - The query used to search for the documents to be deleted.
@returns {Promise<DeleteResult>} A promise that resolves with the result of the deletion operation.
*/
  async deletequery(coll, q) {
    const db = await this.db();
    return db.collection(coll).deleteMany(q);
  }

  /**Returns the number of documents that match the specified query in the specified collection.
@async
@param {string} coll - The name of the collection to count the documents in.
@param {Object} q - The query used to search for the documents.
@returns {Promise<number>*/

  async count(coll, q) {
    const db = await this.db();
    return db.collection(coll).count(q);
  }
}

module.exports = MongoConnector;
