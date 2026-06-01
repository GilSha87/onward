// Route inventory for E2E.
//
// NOTE: Onward is a single-page app that uses *state-based* navigation, not
// React Router. There are no server routes like /dashboard or /tracker — every
// path is served index.html (see vercel.json rewrites) and the React app
// decides what to render in memory. These paths therefore exist only to verify
// that the SPA fallback works and the app mounts for any URL a user might land
// on or refresh.
export const ROUTES = [
  '/',
  '/dashboard',
  '/tracker',
  '/client',
  '/plan',
  '/team',
];
