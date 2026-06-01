// Lightweight, dependency-free monitoring for Onward.
//
// This module provides a single place to capture runtime errors and API
// failures. It intentionally avoids any third-party SDK so there is nothing
// to configure and no data leaves the browser by default. If a remote sink is
// ever desired, set `window.__ONWARD_MONITOR_SINK__` to a function and it will
// receive sanitized events.
//
// Privacy (Group 9): every event is passed through `sanitize()` before it is
// logged or forwarded. Auth tokens, emails, and other obvious PII are redacted
// so we never leak credentials or personal data into logs.

const TOKEN_KEYS = /^(.*(token|secret|password|apikey|api_key|authorization|auth|bearer|key|jwt).*)$/i;
const EMAIL_RE = /([a-z0-9._%+-]+)@([a-z0-9.-]+\.[a-z]{2,})/gi;
const JWT_RE = /\beyJ[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,}\b/g;
const BEARER_RE = /\bBearer\s+[A-Za-z0-9._-]+/gi;

function redactString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(JWT_RE, '[redacted-token]')
    .replace(BEARER_RE, 'Bearer [redacted]')
    .replace(EMAIL_RE, (_m, _user, domain) => `[email]@${domain}`);
}

function sanitize(value, depth = 0) {
  if (value == null) return value;
  if (typeof value === 'string') return redactString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (depth > 4) return '[truncated]';

  if (Array.isArray(value)) {
    return value.slice(0, 50).map(v => sanitize(v, depth + 1));
  }
  if (typeof value === 'object') {
    // Error objects: keep name + sanitized message, drop stack details that may
    // embed URLs with tokens.
    if (value instanceof Error) {
      return { name: value.name, message: redactString(value.message) };
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (TOKEN_KEYS.test(k)) {
        out[k] = '[redacted]';
      } else {
        out[k] = sanitize(v, depth + 1);
      }
    }
    return out;
  }
  return String(value);
}

function emit(event) {
  const clean = sanitize(event);
  // eslint-disable-next-line no-console
  console.error('[onward:monitor]', clean);
  const sink = typeof window !== 'undefined' && window.__ONWARD_MONITOR_SINK__;
  if (typeof sink === 'function') {
    try {
      sink(clean);
    } catch {
      // never let the monitor itself throw
    }
  }
}

/**
 * Report an arbitrary runtime error.
 * @param {unknown} error
 * @param {Record<string, unknown>} [context]
 */
export function reportError(error, context) {
  const message = error instanceof Error ? error.message : String(error);
  emit({
    type: 'error',
    message: redactString(message),
    name: error instanceof Error ? error.name : 'Error',
    context: context ? sanitize(context) : undefined,
    at: new Date().toISOString(),
  });
}

/**
 * Report a failed API/database call.
 * @param {string} operation  e.g. 'clients.select'
 * @param {unknown} error      the error returned by the API
 * @param {Record<string, unknown>} [context]
 */
export function reportApiError(operation, error, context) {
  const message = error && typeof error === 'object' && 'message' in error
    ? String(error.message)
    : String(error);
  emit({
    type: 'api_error',
    operation,
    message: redactString(message),
    context: context ? sanitize(context) : undefined,
    at: new Date().toISOString(),
  });
}

let initialized = false;

/**
 * Install global handlers for uncaught errors and unhandled promise
 * rejections. Safe to call more than once.
 */
export function initMonitoring() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  window.addEventListener('error', (e) => {
    reportError(e.error || e.message, { source: 'window.onerror' });
  });

  window.addEventListener('unhandledrejection', (e) => {
    reportError(e.reason, { source: 'unhandledrejection' });
  });
}
