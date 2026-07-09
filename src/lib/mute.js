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
  return storage.getItem(STORAGE_KEY) === 'true';
}

/**
 * Persist the mute state.
 * @param {boolean} muted
 * @param {Storage} [storage] - defaults to window.localStorage if available
 */
export function setStoredMute(muted, storage = safeLocalStorage()) {
  if (!storage) return;
  storage.setItem(STORAGE_KEY, muted ? 'true' : 'false');
}

function safeLocalStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}
