// ============================================================
// GAIA — HTTP helper
// Wrapper minimalista para fetch com tratamento de erro e timeout.
// ============================================================

const DEFAULT_TIMEOUT = 15000;

/**
 * GET de JSON com timeout e mensagens de erro legíveis.
 * @param {string} url
 * @param {{timeout?: number, headers?: Record<string,string>}} opts
 */
export async function getJSON(url, opts = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeout ?? DEFAULT_TIMEOUT);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', ...(opts.headers || {}) },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} em ${url}`);
    }
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Timeout (${opts.timeout ?? DEFAULT_TIMEOUT}ms) em ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
