const store = new Map();

const redis = {
  async get(key) {
    return store.get(key) ?? null;
  },
  async set(key, value) {
    store.set(key, String(value));
    return "OK";
  },
  async setex(key, ttl, value) {
    store.set(key, String(value));
    return "OK";
  },
  async del(...keys) {
    for (const k of keys) store.delete(k);
    return keys.length;
  },
  async keys(pattern) {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    return [...store.keys()].filter((k) => regex.test(k));
  },
  async flushall() {
    store.clear();
    return "OK";
  },
  on() {},
};

redis.__store = store;

module.exports = redis;
