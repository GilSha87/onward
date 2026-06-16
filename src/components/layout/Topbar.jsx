import React from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../lib/data';
import LanguageSwitcher from '../ui/LanguageSwitcher';

export default function Topbar({ view, setView, screen, setScreen, client, amName = 'Maya Levin', amInitials, onSignOut }) {
  const { t } = useTranslation();
  const initials = amInitials || (amName || 'ML').split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const isSubpage = screen.kind === 'tracker' || screen.kind === 'plan' || screen.kind === 'client';
  return (
    <header className="topbar">
      <a className="brand" onClick={() => setScreen({ kind: 'dashboard' })} style={{ cursor: 'pointer' }}>
        <span className="brand-mark"></span>
        Onward
        <sub>by Duda</sub>
      </a>
      {isSubpage && (
        <button className="btn ghost sm" style={{ marginLeft: 8 }} onClick={() => setScreen({ kind: 'dashboard' })}>
          {ICONS.back} {t('dash.portfolio')}
        </button>
      )}
      <nav className="crumbs">
        <span className="sep">/</span>
        {screen.kind === 'dashboard' && <span className="now">{t('dash.portfolio')}</span>}
        {screen.kind === 'tracker' && <span className="now">{client?.name}</span>}
        {screen.kind === 'team' && <span className="now">{t('topbar.team')}</span>}
        {screen.kind === 'plan' && (
          <>
            <span onClick={() => setScreen({ kind: 'tracker', clientId: screen.clientId })} style={{ cursor: 'pointer' }}>{client?.name}</span>
            <span className="sep">/</span>
            <span className="now">{t('topbar.plan_crumb')}</span>
          </>
        )}
        {screen.kind === 'client' && <span className="now">{t('topbar.client_view_crumb', { name: client?.name })}</span>}
      </nav>
      <div className="spacer"></div>

      {(screen.kind === 'tracker' || screen.kind === 'client' || screen.kind === 'plan') && (
        <div className="view-toggle">
          <button className={view === 'am' ? 'on' : ''} onClick={() => setView('am')}>{t('topbar.am_view')}</button>
          <button className={view === 'client' ? 'on' : ''} onClick={() => setView('client')}>{t('dash.client_view')}</button>
        </div>
      )}

      <button className="btn ghost" onClick={() => setScreen({ kind: 'team' })}>{t('topbar.team')}</button>
      <LanguageSwitcher />
      <span className="account-chip">
        <span className="avatar">{initials}</span>
        {amName}
      </span>
      {onSignOut && (
        <button className="btn ghost sm" style={{ marginLeft: 8 }} onClick={onSignOut}>
          {t('auth.sign_out')}
        </button>
      )}
    </header>
  );
}
