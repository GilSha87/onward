import React, { useEffect, useState } from 'react';
import { db } from '../lib/supabase';

// Extract our custom invite token from the URL hash, e.g. "#/invite?token=UUID".
function readInviteToken() {
  const hash = window.location.hash || '';
  const qIndex = hash.indexOf('?');
  if (qIndex === -1) return '';
  return new URLSearchParams(hash.slice(qIndex + 1)).get('token') || '';
}

export default function InviteAccept({ onDone }) {
  // Our own invite-token flow. When a token is present we don't need a Supabase
  // session up front — the token authorizes the password set via the
  // accept-invite edge function. This is immune to corporate mail scanners that
  // pre-fetch (and would otherwise consume) one-time email links.
  const [token] = useState(readInviteToken);

  // Session-based fallback flow (Supabase recovery links): we wait for the SDK
  // to establish a session from the URL before showing the form.
  const [ready, setReady] = useState(() => !!readInviteToken());
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (token) return; // token flow doesn't depend on a session
    // Supabase SDK processes recovery tokens from the URL hash automatically.
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
  }, [token]);

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

    if (token) {
      // Token flow: hand the token + chosen password to the edge function, which
      // sets the password and activates the member using the service role.
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/accept-invite`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ token, password }),
          },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not set password.');
        // Sign in with the brand-new credentials so they land straight in the app.
        const { error: signErr } = await db.auth.signInWithPassword({
          email: data.email,
          password,
        });
        if (signErr) {
          // Password was set, but auto sign-in failed — send them to login.
          setError('Password set! Please log in with your email and new password.');
          setLoading(false);
          return;
        }
        onDone();
      } catch (err) {
        setError(err.message || 'Could not set password. Please try again.');
        setLoading(false);
      }
      return;
    }

    // Session-based flow (Supabase recovery link): update the logged-in user.
    const { data, error: err } = await db.auth.updateUser({ password });
    if (err) {
      setError(err.message || 'Could not set password. Please try again.');
      setLoading(false);
      return;
    }
    if (data?.user?.id) {
      await db.from('team_members')
        .update({ status: 'active' })
        .eq('user_id', data.user.id);
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
