const CACHE_TTL_MS = 2 * 60 * 1000;
const memoryCache = new Map();

function ahora() {
  return Date.now();
}

function leerSessionStorage(clave) {
  try {
    const bruto = sessionStorage.getItem(clave);
    if (!bruto) {
      return null;
    }
    const parsed = JSON.parse(bruto);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function guardarSessionStorage(clave, valor) {
  try {
    sessionStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Ignorar errores de storage (quota/modo privado).
  }
}

export function getPortfolioCache(clave) {
  if (!clave) {
    return null;
  }

  const cacheEnMemoria = memoryCache.get(clave);
  if (cacheEnMemoria && cacheEnMemoria.expiresAt > ahora()) {
    return cacheEnMemoria.data;
  }

  const cachePersistido = leerSessionStorage(clave);
  if (!cachePersistido) {
    return null;
  }

  if (cachePersistido.expiresAt <= ahora()) {
    sessionStorage.removeItem(clave);
    return null;
  }

  memoryCache.set(clave, cachePersistido);
  return cachePersistido.data;
}

export function setPortfolioCache(clave, data, ttlMs = CACHE_TTL_MS) {
  if (!clave) {
    return;
  }

  const payload = {
    data,
    expiresAt: ahora() + ttlMs,
  };

  memoryCache.set(clave, payload);
  guardarSessionStorage(clave, payload);
}
