import React, { useEffect, useState } from 'react';
import { db } from '../lib/supabase';

export default function InviteAccept({ onDone }) {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Supabase SDK processes invite tokens from the URL hash automatically.
    // Check for an existing session first, then listen for auth state changes.
    db.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserEmail(session.user?.email || '');
        setReady(true);
      }
    });

    const { data: { subscription } } = db.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUserEmail(session.user?.email || '');
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await db.auth.updateUser({ password });
    if (err) {
      setError(err.message || 'Could not set password. Please try again.');
      setLoading(false);
      return;
    }
    onDone();
  }

  if (!ready) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}>
        <div style={{ fontSize: 14, opacity: 0.6 }}>Verifying invite…</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--paper, #FAF9F7)',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 24px' }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ink, #1A1714)' }}>
            Welcome to Onward
          </div>
          {userEmail && (
            <div style={{ fontSize: 14, color: 'var(--ink-muted, #6B6560)', marginTop: 8 }}>{userEmail}</div>
          )}
          <div style={{ fontSize: 14, color: 'var(--ink-muted, #6B6560)', marginTop: 4 }}>
            Set a password to finish setting up your account.
          </div>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field">
            <label>Password</label>
            <input
              className="input"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="field">
            <label>Confirm password</label>
            <input
              className="input"
              type="password"
              placeholder="Re-enter password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
          </div>
          {error && (
            <p style={{ color: 'var(--crimson, #C0392B)', fontSize: 13, fontWeight: 600, margin: 0 }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            className="btn primary"
            disabled={loading || !password || !confirm}
            style={{ marginTop: 4, width: '100%', justifyContent: 'center' }}
          >
            {loading ? 'Setting up…' : 'Complete setup'}
          </button>
        </form>
      </div>
    </div>
  );
}
