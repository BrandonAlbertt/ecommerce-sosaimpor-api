// CACHE EN MEMORIA SIMPLE Y RAPIDO.
// Evita peticiones repetidas a Postgres.
class MemoryCache {
  constructor() {
    this.cache = new Map();
  }

  // OBTIENE UN VALOR SI NO HA EXPIRADO.
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  // GUARDA UN VALOR CON TIEMPO DE EXPIRACION (TTL) EN SEGUNDOS.
  set(key, value, ttlSeconds = 300) {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiry });
  }

  // BORRA TODA LA CACHE CUANDO OCURRE UN CAMBIO (INVALIDACION).
  clear() {
    this.cache.clear();
    // console.log("[cache] Cache del sistema limpiada por cambios en la base de datos");
  }
}

export const memoryCache = new MemoryCache();
export default memoryCache;
