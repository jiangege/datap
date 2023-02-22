/**
 * todo
 */

class JSONConnector {
  #filePath;
  #client = null;
  constructor(filePath) {
    this.#filePath = filePath;
  }

  async connect(filePath) {
    this.#client = new JSONdb(filePath ?? this.#filePath, {
      asyncWrite: true,
    });
  }

  async db() {
    if (this.#client == null) {
      this.connect();
    }
    return this.#client;
  }

  async create(coll, doc) {
    const db = await this.db();
    let docs = db.get(coll);
    if (!Array.isArray(docs)) {
      docs = [];
    }
    docs.push({
      _id: _.uniqueId(Date.now()),
      ...doc,
    });
    db.set(coll, docs);
    db.sync();
    return;
  }

  async readone(coll, query) {
    const db = await this.db();
    const docs = db.get(coll);
    return _.chain(docs).orderBy(["_id"], ["desc"]).find(query).value();
  }

  async read(coll, query, limit, skip, sort = [["_id"], ["desc"]]) {
    const db = await this.db();
    const docs = db.get(coll);

    return _.chain(docs)
      .filter(_.isEmpty(query) ? () => true : query)
      .orderBy(...sort)
      .slice(skip ?? 0, skip + limit)
      .value();
  }

  async update(coll, query) {
    const db = await this.db();
    const docs = db.get(coll);
    const foundObj = _.find(docs, (doc) => doc._id === query.id);
    _.merge(
      foundObj,
      {
        lastModified: new Date(),
      },
      _.omit(query, "id")
    );

    db.set(coll, docs);
    db.sync();
  }

  async updatemany(coll, q, doc) {
    const db = await this.db();
    const docs = db.get(coll);

    _.filter(docs, q).forEach((d) => {
      _.merge(
        d,
        {
          lastModified: new Date(),
        },
        doc
      );
    });

    db.set(coll, docs);
    db.sync();
  }

  async upsert(coll, doc) {
    const db = await this.db();
    const docs = db.get(coll);
    const foundDoc = _.find(docs, {
      [doc["key"]]: doc[doc["key"]],
    });

    if (foundDoc) {
      _.merge(
        foundDoc,
        {
          lastModified: new Date(),
        },
        _.omit(doc, "key")
      );
    } else {
      docs.push({
        _id: _.uniqueId(Date.now()),
        ...doc,
      });
    }

    db.set(coll, docs);
    db.sync();
  }

  async delete(coll, id) {
    return this.deletequery(coll, { _id: id });
  }

  async deletequery(coll, q) {
    const db = await this.db();
    const docs = db.get(coll);
    const removedDocs = _.reject(docs, q);
    db.set(coll, removedDocs);
    db.sync();
  }

  async count(coll, q) {
    const db = await this.db();
    const docs = db.get(coll);
    return docs.length;
  }
}

module.exports = JSONConnector;
