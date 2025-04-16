# MongoDB Connector

A lightweight MongoDB connector for Node.js applications that provides a simplified interface for common database operations.

## Installation

```bash
npm install @jiangege47/datap
```

## Usage

```javascript
// Import the connector factory
const createConnector = require('@jiangege47/datap');

// Initialize with configuration
const connector = createConnector({
  mongo: {
    url: 'mongodb://localhost:27017',
    dbName: 'myDatabase'
  }
});

// Connect to MongoDB
async function main() {
  await connector.mongo.connect();
  
  // Now you can perform database operations
  // ...
}

main().catch(console.error);
```

## Available Methods

The MongoDB connector provides the following methods:

### Connection

- `connect(url, dbName)`: Connect to MongoDB database
- `db(dbName)`: Get database instance or connect to a specific database

### Create Operations

- `create(collection, document)`: Insert a single document
- `createmany(collection, documents)`: Insert multiple documents

### Read Operations

- `readone(collection, query, sort)`: Get a single document matching the query
- `readid(collection, id)`: Get a document by its ID
- `read(collection, query, limit, skip, sort)`: Get documents matching the query with pagination
- `count(collection, query)`: Count documents matching the query

### Update Operations

- `update(collection, document)`: Update a document by ID
- `updatemany(collection, query, document)`: Update multiple documents matching the query
- `upsert(collection, document)`: Insert or update a document based on a key

### Delete Operations

- `delete(collection, id)`: Delete a document by ID
- `deletequery(collection, query)`: Delete documents matching the query

## Examples

### Create a document

```javascript
const result = await connector.mongo.create('users', {
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: new Date()
});
console.log(`Inserted ID: ${result.insertedId}`);
```

### Read documents

```javascript
// Find all active users, limit to 10
const users = await connector.mongo.read('users', { active: true }, 10);
console.log(`Found ${users.length} active users`);

// Find user by ID
const user = await connector.mongo.readid('users', '507f1f77bcf86cd799439011');
```

### Update a document

```javascript
const updateResult = await connector.mongo.update('users', {
  id: '507f1f77bcf86cd799439011',
  active: false
});
console.log(`Modified ${updateResult.modifiedCount} document(s)`);
```

### Delete documents

```javascript
// Delete by ID
await connector.mongo.delete('users', '507f1f77bcf86cd799439011');

// Delete by query
await connector.mongo.deletequery('users', { active: false });
```

## TypeScript Support

This package includes TypeScript definitions, providing autocompletion and type checking even in JavaScript projects in editors that support it (like VSCode).

## Requirements

- Node.js 12.x or higher
- MongoDB 4.x or higher 