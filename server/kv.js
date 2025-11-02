// server/kv.js
import dotenv from 'dotenv';
dotenv.config();

// We'll export a "kv" with the same shape as @vercel/kv.
// If Upstash credentials exist, we use the real service.
// Otherwise we fall back to an in-memory store (good for localhost).

let kv;

try {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const mod = await import('@vercel/kv');
    kv = mod.kv;
    console.log('[KV] Using Vercel KV (Upstash)');
  } else {
    throw new Error('KV env vars not found, using in-memory store');
  }
} catch (e) {
  console.log('[KV] Fallback to in-memory store:', e.message);

  const store = new Map();

  kv = {
    async get(key) {
      return store.get(key);
    },
    async set(key, value) {
      store.set(key, value);
      return 'OK';
    },
    async del(key) {
      store.delete(key);
    },
    async incr(key) {
      const n = (store.get(key) ?? 0) + 1;
      store.set(key, n);
      return n;
    },
    async lpush(key, value) {
      const arr = store.get(key) ?? [];
      arr.unshift(value);
      store.set(key, arr);
      return arr.length;
    },
    async lrange(key, start, end) {
      const arr = store.get(key) ?? [];
      // end is inclusive for KV; emulate that here
      return arr.slice(start, end + 1);
    }
  };
}

export { kv };
