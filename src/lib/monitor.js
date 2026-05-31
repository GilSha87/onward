/**
 * monitor.js — runtime error and API failure instrumentation
 *
 * Installs three listeners:
 *   1. window.onerror           — uncaught JS errors
 *   2. unhandledrejection        — unhandled Promise rejections
 *   3. fetch monkey-patch        — logs failed API calls (non-2xx or network error)
 *
 * In production forward these to a real service (Sentry, Datadog, LogRocket, etc.).
 * Here the events are written to window.__onwardErrors so Playwright tests can assert
 * on them, and logged to console.error with a recognisable prefix.
 */

const LOG_PREFIX = '[Onward Monitor]';

/** Central sink - extend to forward to Sentry/Datadog. */
function report(type, detail) {
  const entry = { type, detail, ts: new Date().toISOString() };

  // In-memory log accessible to Playwright tests via page.evaluate
  if (typeof window !== 'undefined') {
    window.__onwardErrors = window.__onwardErrors || [];
    window.__onwardErrors.push(entry);
  }

  // eslint-disable-next-line no-console
  console.error(LOG_PREFIX, type, JSON.stringify(detail, null, 2));

  // TODO: forward to real monitoring service, e.g.:
  // Sentry.captureException(detail.error ?? new Error(detail.message));
}

/** 1. Uncaught synchronous errors */
function installGlobalErrorListener() {
  window.addEventListener('error', (event) => {
    report('uncaught_error', {
      message: event.message,
      source:  event.filename,
      line:    event.lineno,
      col:     event.colno,
    });
  });
}

/** 2. Unhandled Promise rejections */
function installRejectionListener() {
  window.addEventListener('unhandledrejection', (event) => {
    report('unhandled_rejection', {
      message: String(event.reason),
    });
  });
}

/** 3. Failed fetch / API calls */
function installFetchMonitor() {
  const originalFetch = window.fetch;

  window.fetch = async function monitoredFetch(input, init) {
    const url = typeof input === 'string' ? input : input?.url ?? String(input);
    try {
      const response = await originalFetch(input, init);
      if (!response.ok) {
        report('api_error', {
          url,
          status:     response.status,
          statusText: response.statusText,
          method:     (init && init.method) ? init.method : 'GET',
        });
      }
      return response;
    } catch (networkError) {
      report('network_error', {
        url,
        message: networkError.message,
        method:  (init && init.method) ? init.method : 'GET',
      });
      throw networkError;
    }
  };
}

/**
 * Call once from main.jsx before rendering the React tree.
 *
 * @example
 *   import { initMonitor } from './lib/monitor';
 *   initMonitor();
 */
export function initMonitor() {
  if (typeof window === 'undefined') return; // SSR safety

  installGlobalErrorListener();
  installRejectionListener();
  installFetchMonitor();

  // eslint-disable-next-line no-console
  console.info(LOG_PREFIX, 'Instrumentation active');
}
