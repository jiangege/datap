# Datap

Datap is a lightweight database abstraction layer for Node.js that provides a unified API for both MongoDB and LowDB. It allows you to easily switch between databases or use both simultaneously with minimal code changes.

## Features

- 🌐 MongoDB support for cloud or local server-based applications
- 📁 LowDB support for file-based JSON storage
- 🔄 Consistent API across both database types
- 🔍 Simple query interface with MongoDB-like syntax
- ⚙️ Easy configuration and setup
- 📝 Written in TypeScript with full type definitions
- 🛠️ Built with tsup for optimal bundling

## Installation

```bash
npm install @jiangege47/datap
```

## Configuration

```typescript
import Datap from "@jiangege47/datap";

// Initialize with MongoDB
Datap({
  mongo: {
    url: "mongodb://localhost:27017",
    dbName: "myDatabase",
    options: {
      /* MongoDB client options */
    },
  },
});

// Initialize with LowDB
Datap({
  lowdb: {
    dbPath: "./data", // Directory to store JSON files
  },
});

// Or use both
Datap({
  mongo: {
    url: "mongodb://localhost:27017",
    dbName: "myDatabase",
  },
  lowdb: {
    dbPath: "./data",
  },
});
```

## Usage Examples

### MongoDB Operations

```typescript
import Datap from "@jiangege47/datap";

// Configure MongoDB connection
Datap({
  mongo: {
    url: "mongodb://localhost:27017",
    dbName: "myDatabase",
  },
});

// Create a document
await Datap.mongo.createOne("users", {
  name: "John Doe",
  email: "john@example.com",
});

// Find documents
const users = await Datap.mongo.find("users", { name: "John Doe" });

// Update a document
await Datap.mongo.updateOne("users", {
  id: "60d21b4667d0d8992e610c85",
  email: "john.updated@example.com",
});

// Delete a document
await Datap.mongo.deleteOne("users", "60d21b4667d0d8992e610c85");
```

### LowDB Operations

```typescript
import Datap from "@jiangege47/datap";

// Configure LowDB
Datap({
  lowdb: {
    dbPath: "./data",
  },
});

// Create a document
await Datap.low.createOne("users", {
  name: "Jane Doe",
  email: "jane@example.com",
});

// Find documents
const users = await Datap.low.find("users", { name: "Jane Doe" });

// Update a document
await Datap.low.updateOne("users", {
  _id: "60d21b4667d0d8992e610c85",
  email: "jane.updated@example.com",
});

// Delete a document
await Datap.low.deleteOne("users", "60d21b4667d0d8992e610c85");
```

## API Reference

Both MongoDB and LowDB connectors support the following methods:

| Method                                       | Description                      |
| -------------------------------------------- | -------------------------------- |
| `createOne(collection, document)`            | Create a single document         |
| `createMany(collection, documents)`          | Create multiple documents        |
| `findOne(collection, query, sort)`           | Find a single document           |
| `findById(collection, id)`                   | Find a document by ID            |
| `find(collection, query, limit, skip, sort)` | Find multiple documents          |
| `updateOne(collection, document)`            | Update a single document         |
| `updateMany(collection, query, update)`      | Update multiple documents        |
| `upsertOne(collection, document)`            | Insert or update a document      |
| `deleteOne(collection, id)`                  | Delete a single document         |
| `deleteMany(collection, query)`              | Delete multiple documents        |
| `count(collection, query)`                   | Count documents matching a query |
| `close()`                                    | Close database connection        |

## Timestamps

All document operations (create, update, upsert) automatically manage the following timestamp fields:

- `createdAt`: Set when a document is first created
- `updatedAt`: Updated whenever a document is modified

## Development

### Building the Project

The project uses [tsup](https://github.com/egoist/tsup) for building:

```bash
# Install dependencies
npm install

# Development build with watch mode
npm run dev

# Production build
npm run build

# Type checking
npm run typecheck
```

## Type Definitions

Full TypeScript declarations are available for all APIs.

## License

MIT
