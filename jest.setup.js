// mmkv's native module isn't available under jest, so this fakes it with
// a plain in-memory store that matches the bits of the API we use
jest.mock('react-native-mmkv', () => {
  const stores = new Map();

  function createMMKV(config) {
    const id = config?.id ?? 'mmkv.default';
    if (!stores.has(id)) {
      stores.set(id, new Map());
    }
    const store = stores.get(id);

    return {
      id,
      set(key, value) {
        store.set(key, value);
      },
      getString(key) {
        const value = store.get(key);
        return typeof value === 'string' ? value : undefined;
      },
      getNumber(key) {
        const value = store.get(key);
        return typeof value === 'number' ? value : undefined;
      },
      getBoolean(key) {
        const value = store.get(key);
        return typeof value === 'boolean' ? value : undefined;
      },
      contains(key) {
        return store.has(key);
      },
      remove(key) {
        return store.delete(key);
      },
      clearAll() {
        store.clear();
      },
      getAllKeys() {
        return Array.from(store.keys());
      },
    };
  }

  return { createMMKV };
});
