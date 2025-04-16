import { Db, DeleteResult, InsertManyResult, InsertOneResult, UpdateResult } from 'mongodb';

export declare class MongoConnector {
  /**
   * Create a MongoDB instance
   * @param url - Connect to MongoDB using a url
   * @param dbName - MongoDB database name
   */
  constructor(url: string, dbName: string);

  /**
   * Connects to a MongoDB database using the provided URL and database name or the default values if not provided.
   * @param url - The MongoDB connection string URL. Defaults to the value of the `#url` property if not provided.
   * @param dbName - The name of the database to connect to. Defaults to the value of the `#dbName` property if not provided.
   * @returns A promise that resolves when the connection is established.
   */
  connect(url?: string, dbName?: string): Promise<void>;

  /**
   * Returns the current database instance or connects to a specified database if provided.
   * @param dbName - The name of the database to connect to. If provided and different from the current database, a new connection will be established to the specified database.
   * @returns A promise that resolves with the current database instance.
   */
  db(dbName?: string): Promise<Db>;

  /**
   * Creates a new document in the specified collection.
   * @param coll - The name of the collection to insert the document into.
   * @param doc - The document to be inserted.
   * @returns A promise that resolves with the result of the insertion operation.
   */
  create(coll: string, doc: Record<string, any>): Promise<InsertOneResult>;

  /**
   * Creates multiple new documents in the specified collection.
   * @param coll - The name of the collection to insert the documents into.
   * @param docs - An array of documents to be inserted.
   * @returns A promise that resolves with the result of the insertion operation.
   */
  createmany(coll: string, docs: Record<string, any>[]): Promise<InsertManyResult>;

  /**
   * Returns a single document that matches the specified query in the specified collection, sorted in descending order by default.
   * @param coll - The name of the collection to search in.
   * @param query - The query used to search for the document.
   * @param sort - The sort order for the result. Defaults to descending order by `_id`.
   * @returns A promise that resolves with the matching document.
   */
  readone(coll: string, query: Record<string, any>, sort?: Record<string, number>): Promise<Record<string, any> | null>;

  /**
   * Returns the document with the specified ID in the specified collection.
   * @param coll - The name of the collection to search in.
   * @param id - The ID of the document to retrieve.
   * @returns A promise that resolves with the matching document.
   */
  readid(coll: string, id: string): Promise<Record<string, any> | null>;

  /**
   * Returns an array of documents that match the specified query in the specified collection, with optional pagination and sorting.
   * @param coll - The name of the collection to search in.
   * @param query - The query used to search for the documents.
   * @param limit - The maximum number of documents to return. Defaults to all documents.
   * @param skip - The number of documents to skip. Used for pagination.
   * @param sort - The sort order for the result.
   * @returns A promise that resolves with an array of matching documents.
   */
  read(coll: string, query: Record<string, any>, limit?: number, skip?: number, sort?: Record<string, number>): Promise<Record<string, any>[]>;

  /**
   * Updates a single document with the specified ID in the specified collection.
   * @param coll - The name of the collection to update the document in.
   * @param doc - The updated document.
   * @returns A promise that resolves with the result of the update operation.
   */
  update(coll: string, doc: Record<string, any> & { id: string }): Promise<UpdateResult>;

  /**
   * Updates multiple documents that match the query in the specified collection.
   * @param coll - The name of the collection to update the documents in.
   * @param q - The query used to search for the documents to be updated.
   * @param doc - The updated document fields.
   * @returns A promise that resolves with the result of the update operation.
   */
  updatemany(coll: string, q: Record<string, any>, doc: Record<string, any>): Promise<UpdateResult>;

  /**
   * Inserts a new document or updates an existing document in the specified collection, based on a unique key provided in the document.
   * @param coll - The name of the collection to insert or update the document in.
   * @param doc - The document to be inserted or updated. Must contain a "key" field.
   * @returns A promise that resolves with the result of the update operation.
   */
  upsert(coll: string, doc: Record<string, any> & { key: string }): Promise<UpdateResult>;

  /**
   * Deletes a single document with the specified ID in the specified collection.
   * @param coll - The name of the collection to delete the document from.
   * @param id - The ID of the document to be deleted.
   * @returns A promise that resolves with the result of the deletion operation.
   */
  delete(coll: string, id: string): Promise<DeleteResult>;

  /**
   * Deletes all documents that match the specified query in the specified collection.
   * @param coll - The name of the collection to delete the documents from.
   * @param q - The query used to search for the documents to be deleted.
   * @returns A promise that resolves with the result of the deletion operation.
   */
  deletequery(coll: string, q: Record<string, any>): Promise<DeleteResult>;

  /**
   * Returns the number of documents that match the specified query in the specified collection.
   * @param coll - The name of the collection to count the documents in.
   * @param q - The query used to search for the documents.
   * @returns A promise that resolves with the count of matching documents.
   */
  count(coll: string, q: Record<string, any>): Promise<number>;
} 