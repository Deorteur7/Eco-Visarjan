// In-memory store with the same interface as the DynamoDB store.
// Used for a zero-setup local try-out. Data is lost when the process stops.
import { TABLE_KEYS } from './tables.js';

export function createMemoryStore() {
  const tables = new Map(TABLE_KEYS.map((key) => [key, new Map()]));

  const table = (key) => {
    const found = tables.get(key);
    if (!found) throw new Error(`Unknown table key: ${key}`);
    return found;
  };

  return {
    kind: 'memory',
    async ensureTables() {},
    async list(key) {
      return structuredClone([...table(key).values()]);
    },
    async get(key, id) {
      const item = table(key).get(id);
      return item ? structuredClone(item) : null;
    },
    async put(key, item) {
      table(key).set(item.id, structuredClone(item));
    },
    async putMany(key, items) {
      for (const item of items) table(key).set(item.id, structuredClone(item));
    },
    async count(key) {
      return table(key).size;
    },
    async health() {
      return { ok: true, kind: 'memory' };
    },
  };
}
