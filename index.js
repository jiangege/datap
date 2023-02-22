const MongoConnector = require("./mongo");

module.exports = (config) => {
  return {
    mongo: config?.mongo ? new MongoConnector(config.mongo) : null,
  };
};
