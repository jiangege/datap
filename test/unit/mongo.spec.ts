import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import MongoConnector from "../../src/mongo";
import { MongoClient, MongoClientOptions, ObjectId } from "mongodb";

// Mock MongoDB modules
vi.mock("mongodb", async () => {
  const actual = await vi.importActual("mongodb");
  return {
    ...actual,
    MongoClient: {
      connect: vi.fn().mockResolvedValue({
        db: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue({
            findOne: vi.fn(),
            find: vi.fn().mockReturnValue({
              sort: vi.fn().mockReturnThis(),
              skip: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              toArray: vi.fn().mockResolvedValue([]),
            }),
            insertOne: vi.fn().mockReturnValue({ insertedId: "mock-id" }),
            insertMany: vi.fn().mockReturnValue({
              insertedCount: 2,
              insertedIds: { "0": "id1", "1": "id2" },
            }),
            updateOne: vi.fn(),
            updateMany: vi.fn(),
            deleteOne: vi.fn(),
            deleteMany: vi.fn(),
            countDocuments: vi.fn(),
          }),
        }),
        close: vi.fn(),
      }),
    },
    ObjectId: vi.fn((id) => {
      return {
        toString: () => id?.toString() || "mock-object-id",
      };
    }),
  };
});

describe("MongoConnector", () => {
  let connector: MongoConnector;
  const testUrl = "mongodb://localhost:27017";
  const testDbName = "test-db";

  beforeEach(() => {
    vi.clearAllMocks();
    connector = new MongoConnector(testUrl, testDbName);
  });

  afterEach(async () => {
    await connector.close();
  });

  describe("Connection methods", () => {
    it("should connect to MongoDB with the provided URL and database name", async () => {
      await connector.connect();
      expect(MongoClient.connect).toHaveBeenCalledWith(testUrl, {});
    });

    it("should connect with custom options when provided", async () => {
      const options = { serverSelectionTimeoutMS: 3000 } as MongoClientOptions;
      await connector.connect(testUrl, testDbName, options);
      expect(MongoClient.connect).toHaveBeenCalledWith(testUrl, options);
    });

    it("should connect if not already connected when accessing db()", async () => {
      await connector.db();
      expect(MongoClient.connect).toHaveBeenCalled();
    });
  });

  describe("CRUD operations", () => {
    beforeEach(async () => {
      await connector.connect();
    });

    it("should create one document with timestamps", async () => {
      const doc = { name: "Test User" };
      await connector.createOne("users", doc);

      // Get the mock connection and verify call arguments
      const mockCollection = (await MongoClient.connect())
        .db(testDbName)
        .collection("users");
      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test User",
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      );
    });

    it("should create many documents with timestamps", async () => {
      const docs = [{ name: "User 1" }, { name: "User 2" }];
      await connector.createMany("users", docs);

      const mockCollection = (await MongoClient.connect())
        .db(testDbName)
        .collection("users");
      expect(mockCollection.insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: "User 1",
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          }),
          expect.objectContaining({
            name: "User 2",
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          }),
        ])
      );
    });

    it("should find one document with query and sort", async () => {
      const query = { name: "Test User" };
      const sort = { createdAt: -1 as const };
      await connector.findOne("users", query, sort);

      const mockCollection = (await MongoClient.connect())
        .db(testDbName)
        .collection("users");
      expect(mockCollection.findOne).toHaveBeenCalledWith(query, { sort });
    });

    it("should find a document by ID", async () => {
      const id = "123456789012";
      await connector.findById("users", id);

      const mockCollection = (await MongoClient.connect())
        .db(testDbName)
        .collection("users");
      expect(mockCollection.findOne).toHaveBeenCalledWith(
        { _id: expect.any(Object) },
        { sort: { _id: -1 } }
      );
    });
  });
});
