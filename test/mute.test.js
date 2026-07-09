import { describe, expect, it, vi } from 'vitest';
import { getStoredMute, setStoredMute } from '../src/lib/mute.js';

function createFakeStorage() {
  const store = new Map();
  return {
    getItem: vi.fn((key) => (store.has(key) ? store.get(key) : null)),
    setItem: vi.fn((key, value) => store.set(key, value)),
  };
}

describe('getStoredMute', () => {
  it('defaults to false when nothing is stored', () => {
    expect(getStoredMute(createFakeStorage())).toBe(false);
  });

  it('returns true only when the stored value is the string "true"', () => {
    const storage = createFakeStorage();
    storage.setItem('cellular-symphony:muted', 'true');
    expect(getStoredMute(storage)).toBe(true);
  });

  it('returns false when storage is unavailable (no window/localStorage)', () => {
    expect(getStoredMute(null)).toBe(false);
  });
});

describe('setStoredMute', () => {
  it('persists true and false as strings', () => {
    const storage = createFakeStorage();
    setStoredMute(true, storage);
    expect(storage.setItem).toHaveBeenCalledWith('cellular-symphony:muted', 'true');
    setStoredMute(false, storage);
    expect(storage.setItem).toHaveBeenCalledWith('cellular-symphony:muted', 'false');
  });

  it('round-trips through getStoredMute', () => {
    const storage = createFakeStorage();
    setStoredMute(true, storage);
    expect(getStoredMute(storage)).toBe(true);
  });

  it('does not throw when storage is unavailable', () => {
    expect(() => setStoredMute(true, null)).not.toThrow();
  });
});
