import React from 'react';
import { ICONS } from '../../lib/data';

export default function Topbar({ view, setView, screen, setScreen, client, amName = 'Maya Levin', amInitials, onSignOut }) {
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
          {ICONS.back} Portfolio
        </button>
      )}
      <nav className="crumbs">
        <span className="sep">/</span>
        {screen.kind === 'dashboard' && <span className="now">Portfolio</span>}
        {screen.kind === 'tracker' && <span className="now">{client?.name}</span>}
        {screen.kind === 'team' && <span className="now">Team</span>}
        {screen.kind === 'plan' && (
          <>
            <span onClick={() => setScreen({ kind: 'tracker', clientId: screen.clientId })} style={{ cursor: 'pointer' }}>{client?.name}</span>
            <span className="sep">/</span>
            <span className="now">60·90·180 plan</span>
          </>
        )}
        {screen.kind === 'client' && <span className="now">{client?.name} — client view</span>}
      </nav>
      <div className="spacer"></div>

      {(screen.kind === 'tracker' || screen.kind === 'client' || screen.kind === 'plan') && (
        <div className="view-toggle">
          <button className={view === 'am' ? 'on' : ''} onClick={() => setView('am')}>AM view</button>
          <button className={view === 'client' ? 'on' : ''} onClick={() => setView('client')}>Client view</button>
        </div>
      )}

      <button className="btn ghost" onClick={() => setScreen({ kind: 'team' })}>Team</button>
      <span className="account-chip">
        <span className="avatar">{initials}</span>
        {amName}
      </span>
      {onSignOut && (
        <button className="btn ghost sm" style={{ marginLeft: 8 }} onClick={onSignOut}>
          Sign out
        </button>
      )}
    </header>
  );
}
