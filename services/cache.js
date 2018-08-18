const mongoose = require('mongoose');
const redis = require('redis');
const { promisify } = require('util');
const keys = require('../config/keys');

const client = redis.createClient(keys.redisUrl);
client.hget = promisify(client.hget);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function(options = {}) {
  this.useCache = true;
  this.cacheKey = JSON.stringify(options.key || '');
  return this;
};

mongoose.Query.prototype.exec = async function() {
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }
  const key = JSON.stringify({
    ...this.getQuery(),
    collection: this.mongooseCollection.name,
  });

  const cache = await client.hget(this.cacheKey, key);

  if (cache) {
    console.log('HITTING CACHE');
    const doc = JSON.parse(cache);

    return Array.isArray(doc)
      ? doc.map(d => new this.model(d))
      : new this.model(doc);
  }

  console.log('HITTING MONGO');
  const result = await exec.apply(this, arguments);

  client.hset(this.cacheKey, key, JSON.stringify(result));

  return result;
};

module.exports = {
  clearCache(hashKey) {
    client.del(JSON.stringify(hashKey));
  },
};
