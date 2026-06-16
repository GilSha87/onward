import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../lib/supabase';

export default function Login({ onSuccess }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');
    const { error: authError } = await db.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (authError) {
      setError(t('login.error_invalid'));
    } else {
      onSuccess();
    }
  }

  return (
    <div className="login-shell">
      <div className="login-poster">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="brand" style={{ marginBottom: 48 }}>
            <span className="brand-mark"></span>
            Onward <sub>by Duda</sub>
          </div>
          <div className="brand-big">{t('login.poster_a')}<br/><em>{t('login.poster_b')}</em></div>
        </div>
        <p className="lede" style={{ position: 'relative', zIndex: 1, maxWidth: 400 }}>
          {t('login.tagline')}
        </p>
      </div>
      <div className="login-form">
        <div className="eyebrow" style={{ marginBottom: 12 }}>{t('login.welcome_back')}</div>
        <h2 className="display-3">{t('auth.sign_in')}</h2>
        <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>{t('login.subtitle')}</p>
        <form onSubmit={handleSubmit} style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label>{t('auth.email')}</label>
            <input
              className="input"
              type="email"
              placeholder={t('login.email_ph')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
              disabled={loading}
            />
          </div>
          <div className="field">
            <label>{t('auth.password')}</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          {error && <p style={{ color: 'var(--crimson)', fontSize: 13, fontWeight: 600 }}>{error}</p>}
          <button className="btn primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? t('auth.signing_in') : t('auth.sign_in')}
          </button>
        </form>
      </div>
    </div>
  );
}
