import React from 'react';
import { ICONS } from '../lib/data';
import Dropdown from '../components/ui/Dropdown';

export default function TeamPage({ team, onAdd, onDeleteMember }) {
  const [deleteId, setDeleteId] = React.useState(null);

  return (
    <main className="canvas">
      <section style={{ paddingBottom: 24, borderBottom: '1px solid var(--hairline)', marginBottom: 32 }}>
        <div className="eyebrow">Onboarding org</div>
        <div className="flex items-end justify-between" style={{ marginTop: 8 }}>
          <h1 className="display-2">The team.</h1>
          <button className="btn primary" onClick={onAdd}>{ICONS.plus} Add member</button>
        </div>
      </section>

      <div className="eyebrow" style={{ marginBottom: 16 }}>All members ({team.length})</div>
      <div className="team-grid">
        {team.map(t => (
          <div key={t.id} className="team-card">
            <div className="top">
              <span className="client-logo" style={{ background: t.color }}>{t.mono}</span>
              <div style={{ flex: 1 }}>
                <div className="name">{t.name}</div>
                <div className="role">{t.role === 'Staff' ? 'AM · Account Manager' : t.role === 'Executive' ? 'Executive · Read-only org view' : 'Admin · Full access'}</div>
              </div>
              {t.role !== 'Staff' && <span className="tag">{t.role === 'Admin' ? 'ADMIN' : 'EXEC'}</span>}
              <Dropdown items={[
                { label: 'Remove from team', danger: true, onClick: () => setDeleteId(t.id) },
              ]} />
            </div>
            {deleteId === t.id && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0 2px', borderTop: '1px solid var(--hairline-soft)', marginTop: 8 }}>
                <span className="text-xs muted" style={{ flex: 1 }}>Remove {t.name}?</span>
                <button
                  className="btn sm"
                  style={{ color: 'var(--duda)', borderColor: 'var(--duda)' }}
                  onClick={() => { onDeleteMember(t.id); setDeleteId(null); }}
                >
                  Remove
                </button>
                <button className="btn sm ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              </div>
            )}
            <div className="stats">
              <div className="stat"><div className="n tabnum">{t.clients}</div><div className="l">Clients</div></div>
              <div className="stat"><div className="n tabnum">{t.open}</div><div className="l">Open</div></div>
              <div className="stat"><div className="n tabnum">{t.resolved}</div><div className="l">Done</div></div>
            </div>
            {t.role !== 'Staff' && (
              <p className="text-sm muted" style={{ marginTop: 12, lineHeight: 1.55, paddingTop: 12, borderTop: '1px solid var(--hairline-soft)' }}>
                {t.role === 'Executive' ? 'Sees every client across all AMs. Can comment but not edit.' : 'Full access: team management, billing, integrations, plus everything an AM can do.'}
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
