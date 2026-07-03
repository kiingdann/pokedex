// mmkv's native module isn't available under jest, so this fakes it with
// a plain in-memory store that matches the bits of the API we use
jest.mock('react-native-mmkv', () => {
  const stores = new Map();

  class MMKV {
    constructor(config) {
      this.id = config?.id ?? 'default';
      if (!stores.has(this.id)) {
        stores.set(this.id, new Map());
      }
      this.store = stores.get(this.id);
    }

    set(key, value) {
      this.store.set(key, value);
    }

    getString(key) {
      const value = this.store.get(key);
      return typeof value === 'string' ? value : undefined;
    }

    getNumber(key) {
      const value = this.store.get(key);
      return typeof value === 'number' ? value : undefined;
    }

    getBoolean(key) {
      const value = this.store.get(key);
      return typeof value === 'boolean' ? value : undefined;
    }

    contains(key) {
      return this.store.has(key);
    }

    delete(key) {
      this.store.delete(key);
    }

    clearAll() {
      this.store.clear();
    }

    getAllKeys() {
      return Array.from(this.store.keys());
    }
  }

  return { MMKV };
});
