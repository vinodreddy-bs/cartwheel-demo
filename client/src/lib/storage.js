// localStorage can be missing (SSR/tests) or throw (private mode, blocked storage).
export function readJSON(key, fallback) {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable: the cart still works for this page view.
  }
}
