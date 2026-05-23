const store = new Map();

const activationStore = {
  get(key) {
    return store.get(String(key));
  },
  set(key, value) {
    store.set(String(key), value);
  },
  delete(key) {
    return store.delete(String(key));
  },
  has(key) {
    return store.has(String(key));
  },
  clear() {
    store.clear();
  },
};

module.exports = activationStore;
