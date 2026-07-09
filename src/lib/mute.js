/**
 * Mute state persistence. Guards for environments without localStorage
 * (older browsers with storage disabled, or non-DOM test environments)
 * so a missing storage API degrades to "not muted" instead of throwing.
 */

const STORAGE_KEY = 'cellular-symphony:muted';

/**
 * Read the persisted mute state.
 * @param {Storage} [storage] - defaults to window.localStorage if available
 * @returns {boolean}
 */
export function getStoredMute(storage = safeLocalStorage()) {
  if (!storage) return false;
  try {
    return storage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Persist the mute state.
 * @param {boolean} muted
 * @param {Storage} [storage] - defaults to window.localStorage if available
 */
export function setStoredMute(muted, storage = safeLocalStorage()) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, muted ? 'true' : 'false');
  } catch {
    // Storage present but write rejected (private mode, quota) — the mute
    // toggle still works this session, it just won't persist.
  }
}

function safeLocalStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}
