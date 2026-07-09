/**
 * URL <-> app-state serialization for shareable, reproducible patterns.
 * Pure and DOM-free: it operates on query strings (or URLSearchParams), not
 * on `window.location`, so the round-trip is unit testable. The whole point
 * is determinism — a link carrying rule+seed+scale+root+tempo reproduces the
 * exact same visual pattern and note sequence on any load (Story 8), because
 * the seed deterministically expands into the initial row (see random.js).
 *
 * Parsing is defensive: any missing, malformed, or out-of-range field is
 * dropped (or, for tempo, clamped) rather than throwing, so a hand-edited or
 * hostile URL degrades to app defaults instead of a blank screen.
 */

import { NOTE_NAMES, SCALE_NAMES } from './scale.js';
import { RULE_MAX, RULE_MIN, clampRule } from './rule.js';
import { clampTempo } from './tempo.js';

const UINT32_MAX = 0xffffffff;

/**
 * Strictly parse a base-10 integer from a query value: only an optional sign
 * followed by digits is accepted. Returns null for null/undefined, empty,
 * whitespace-padded junk, floats, hex, or `Number`-coercion quirks like ''.
 * @param {string|null} value
 * @returns {number|null}
 */
function parseIntStrict(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^-?\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return Number.isSafeInteger(n) ? n : null;
}

/**
 * Normalize input into a URLSearchParams. Accepts an existing
 * URLSearchParams, or a string with or without a leading '?'/'#'.
 * @param {string|URLSearchParams} query
 * @returns {URLSearchParams}
 */
function toParams(query) {
  if (query instanceof URLSearchParams) return query;
  if (typeof query !== 'string') return new URLSearchParams();
  return new URLSearchParams(query.replace(/^[?#]/, ''));
}

/**
 * Parse a query string into a partial state object, including ONLY the
 * fields that were present and valid. Unknown params are ignored; invalid
 * rule/seed are dropped; tempo is clamped into range.
 * @param {string|URLSearchParams} query - e.g. location.search
 * @returns {{rule?: number, seed?: number, scale?: string, root?: string, tempo?: number}}
 */
export function parseState(query) {
  const params = toParams(query);
  const result = {};

  const rule = parseIntStrict(params.get('rule'));
  if (rule !== null && rule >= RULE_MIN && rule <= RULE_MAX) {
    result.rule = clampRule(rule);
  }

  const seed = parseIntStrict(params.get('seed'));
  if (seed !== null && seed >= 0 && seed <= UINT32_MAX) {
    result.seed = seed >>> 0;
  }

  const scale = params.get('scale');
  if (scale !== null && SCALE_NAMES.includes(scale)) {
    result.scale = scale;
  }

  const root = params.get('root');
  if (root !== null && NOTE_NAMES.includes(root)) {
    result.root = root;
  }

  const tempo = parseIntStrict(params.get('tempo'));
  if (tempo !== null) {
    result.tempo = clampTempo(tempo);
  }

  return result;
}

/**
 * Serialize the shareable slice of app state into a query string (no leading
 * '?'). Field order is fixed so equal states produce byte-identical strings.
 * @param {{rule: number, seed: number, scale: string, root: string, tempo: number}} state
 * @returns {string}
 */
export function serializeState(state) {
  const params = new URLSearchParams();
  params.set('rule', String(clampRule(state.rule)));
  params.set('seed', String(state.seed >>> 0));
  params.set('scale', state.scale);
  params.set('root', state.root);
  params.set('tempo', String(clampTempo(state.tempo)));
  return params.toString();
}
