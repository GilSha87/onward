import React, { useState, useRef, useMemo } from 'react';
import { PHASES, ICONS } from '../lib/data';
import { atRiskReason, dayInVerdict, nextMilestoneForPhase, SORTERS, fmtMoney } from '../lib/helpers';
import ClientLogo from '../components/ui/ClientLogo';
import StatusBadge from '../components/ui/StatusBadge';
import MiniJourney from '../components/ui/MiniJourney';
import Dropdown from '../components/ui/Dropdown';

export default function Dashboard({ clients, setScreen, onAddClient, onEditClient, amName = 'Maya Levin' }) {
  const [icp, setIcp] = useState('All');
  const [touch, setTouch] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: 'risk', dir: 'desc' });
  const [tab, setTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [flowFilter, setFlowFilter] = useState('All');
  const [amFilter, setAmFilter] = useState('All');
  const [showArchived, setShowArchived] = useState(false);

  const searchRef = useRef(null);
  React.useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); searchRef.current?.focus(); searchRef.current?.select();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const base = clients.filter(c => c.status !== 'deleted' && (showArchived || c.status !== 'archived'));

  const baseFiltered = useMemo(() => {
    return base.filter(c => {
      if (icp !== 'All' && c.icp !== icp) return false;
      if (touch !== 'All' && c.touch !== touch) return false;
      if (flowFilter !== 'All' && c.flow !== flowFilter) return false;
      if (amFilter !== 'All' && c.am !== amFilter) return false;
      if (search !== '' && !`${c.name} ${c.country} ${c.contacts.map(x => x.name).join(' ')}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (tab === 'setup' && !['p1', 'p2'].includes(c.phase)) return false;
      if (tab === 'launching' && c.phase !== 'p3') return false;
      if (tab === 'scaled' && c.phase !== 'p4') return false;
      if (tab === 'risk' && !atRiskReason(c)) return false;
      if (tab === 'inactive' && c.status !== 'inactive') return false;
      return true;
    });
  }, [base, icp, touch, flowFilter, amFilter, search, tab]);

  const sorted = useMemo(() => {
    const sorter = SORTERS[sort.key] || SORTERS.name;
    const s = [...baseFiltered].sort((a, b) => sort.dir === 'asc' ? sorter(a, b) : sorter(b, a));
    if (sort.key === 'risk') return s;
    const ar = s.filter(c => atRiskReason(c));
    const rest = s.filter(c => !atRiskReason(c));
    return [...ar, ...rest];
  }, [baseFiltered, sort]);

  const stats = useMemo(() => ({
    total: base.length,
    launched: base.filter(c => c.phase === 'p4').length,
    inSetup: base.filter(c => c.phase === 'p2' || c.phase === 'p1').length,
    launching: base.filter(c => c.phase === 'p3').length,
    overdue: base.filter(c => atRiskReason(c)).length,
    inactive: clients.filter(c => c.status === 'inactive').length,
    archived: clients.filter(c => c.status === 'archived').length,
    portfolioMrr: base.reduce((sum, c) => sum + (Number(c.mrr) || 0), 0),
    mrrCurrency: (base.find(c => c.mrr != null && c.mrr !== '')?.mrrCurrency) || 'USD',
  }), [base, clients]);

  const focusClients = useMemo(() => base.map(c => ({ c, risk: atRiskReason(c) })).filter(x => x.risk).slice(0, 4), [base]);
  const ams = [...new Set(clients.map(c => c.am))];

  function toggleSort(key) { setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }); }
  function clearFilters() { setSearch(''); setIcp('All'); setTouch('All'); setTab('all'); setFlowFilter('All'); setAmFilter('All'); }

  function SortHeader({ k, label }) {
    const active = sort.key === k;
    return (
      <span className={`sortable ${active ? 'active' : ''} ${active && sort.dir === 'desc' ? 'desc' : ''}`} onClick={() => toggleSort(k)}>
        {label} <span className="arrow">▲</span>
      </span>
    );
  }

  return (
    <main className="canvas canvas-wide">
      <section className="dash-hero">
        <div>
          <div className="eyebrow">{amName.split(' ')[0]}'s Portfolio · Spring 2026</div>
          <h1 className="display-1" style={{ marginTop: 12 }}>Onboarding, <em>at a glance.</em></h1>
          <p className="lede" style={{ marginTop: 16, maxWidth: 540 }}>
            {stats.total} accounts in flight.{stats.overdue > 0 ? ` ${stats.overdue} need a decision today.` : ' Everything green.'}
          </p>
        </div>
        <div className="dash-stats">
          <div className="dash-stat"><div className="label">In flight</div><div className="value tabnum">{stats.total}</div><div className="delta">+1 this month</div></div>
          <div className="dash-stat"><div className="label">Launched</div><div className="value tabnum">{stats.launched}</div><div className="delta">Phase 4</div></div>
          <div className="dash-stat"><div className="label">In setup</div><div className="value tabnum">{stats.inSetup}</div><div className="delta">Phases 1–2</div></div>
          <div className="dash-stat">
            <div className="label">At risk</div>
            <div className="value tabnum" style={{ color: stats.overdue > 0 ? 'var(--duda)' : 'var(--ink)' }}>{stats.overdue}</div>
            <div className="delta" style={{ color: stats.overdue > 0 ? 'var(--duda-deep)' : 'var(--ink-muted)' }}>{stats.overdue > 0 ? 'Action needed' : 'All clear'}</div>
          </div>
          {stats.portfolioMrr > 0 && (
            <div className="dash-stat">
              <div className="label">Portfolio MRR</div>
              <div className="value tabnum">{fmtMoney(stats.portfolioMrr, stats.mrrCurrency)}</div>
              <div className="delta">ARR {fmtMoney(stats.portfolioMrr * 12, stats.mrrCurrency)}</div>
            </div>
          )}
        </div>
      </section>

      {focusClients.length > 0 && (
        <section className="focus-strip">
          <div className="focus-label">
            <div className="eyebrow">Today</div>
            <div className="h-line">Needs your attention</div>
          </div>
          <div className="focus-cards">
            {focusClients.map(({ c, risk }) => (
              <div key={c.id} className="focus-card" onClick={() => setScreen({ kind: 'tracker', clientId: c.id })}>
                <div className="focus-top"><ClientLogo client={c} /><div className="focus-name">{c.name}</div></div>
                <div className="focus-reason"><b>{risk.reason}</b><div style={{ marginTop: 2, color: 'var(--ink-muted)' }}>{risk.detail}</div></div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="toolbar">
        <div className="left">
          <span className="search">
            {ICONS.search}
            <input ref={searchRef} placeholder="Search clients, contacts…" value={search} onChange={e => setSearch(e.target.value)} />
            <kbd>⌘K</kbd>
          </span>
          <select className="input" style={{ width: 155 }} value={icp} onChange={e => setIcp(e.target.value)}>
            <option>All</option><option>Agency</option><option>SaaS Platform</option><option>Hosting</option><option>Listing / YP</option><option>POS / eCommerce</option>
          </select>
          <div className="seg">
            <button className={touch === 'All' ? 'on' : ''} onClick={() => setTouch('All')}>All</button>
            <button className={touch === 'High-Touch' ? 'on' : ''} onClick={() => setTouch('High-Touch')}>High</button>
            <button className={touch === 'Low-Touch' ? 'on' : ''} onClick={() => setTouch('Low-Touch')}>Low</button>
          </div>
        </div>
        <div className="right">
          <button className={`btn${showFilters ? ' primary' : ''}`} onClick={() => setShowFilters(f => !f)}>{ICONS.filter} {showFilters ? 'Hide filters' : 'More filters'}</button>
          {stats.archived > 0 && <button className={`btn sm${showArchived ? ' primary' : ''}`} onClick={() => setShowArchived(v => !v)}>{showArchived ? 'Hide archived' : `Archived (${stats.archived})`}</button>}
          <button className="btn primary" onClick={onAddClient}>{ICONS.plus} New client</button>
        </div>
      </section>

      {showFilters && (
        <div className="filter-panel">
          <div className="field"><label>Build flow</label><select className="input" value={flowFilter} onChange={e => setFlowFilter(e.target.value)}><option>All</option><option>DIFM</option><option>DIY</option><option>Hybrid</option><option>Migration</option><option>Marketplace</option></select></div>
          <div className="field"><label>Assigned AM</label><select className="input" value={amFilter} onChange={e => setAmFilter(e.target.value)}><option>All</option>{ams.map(a => <option key={a}>{a}</option>)}</select></div>
          <div className="flex items-end"><button className="btn sm ghost" onClick={clearFilters}>Clear all filters</button></div>
        </div>
      )}

      <div className="tab-row">
        <button className={tab === 'all' ? 'on' : ''} onClick={() => setTab('all')}>All <span className="count">{base.length}</span></button>
        <button className={tab === 'setup' ? 'on' : ''} onClick={() => setTab('setup')}>In setup <span className="count">{stats.inSetup}</span></button>
        <button className={tab === 'launching' ? 'on' : ''} onClick={() => setTab('launching')}>Launching <span className="count">{stats.launching}</span></button>
        <button className={tab === 'scaled' ? 'on' : ''} onClick={() => setTab('scaled')}>Scaled <span className="count">{stats.launched}</span></button>
        {stats.inactive > 0 && <button className={tab === 'inactive' ? 'on' : ''} onClick={() => setTab('inactive')}>Inactive <span className="count">{stats.inactive}</span></button>}
        <button className={tab === 'risk' ? 'on' : ''} onClick={() => setTab('risk')} style={{ color: tab === 'risk' ? 'var(--duda-deep)' : undefined }}>At risk <span className="count">{stats.overdue}</span></button>
      </div>

      {sorted.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">{ICONS.search}</div>
          <h3>{search ? `No matches for "${search}"` : 'No clients in this view'}</h3>
          <p>Adjust filters or add a new client.</p>
          <div className="empty-actions">
            <button className="btn" onClick={clearFilters}>Clear filters</button>
            <button className="btn primary" onClick={onAddClient}>{ICONS.plus} New client</button>
          </div>
        </div>
      ) : (
        <div className="client-table">
          <div className="client-row head">
            <div><SortHeader k="name" label="Client" /></div>
            <div>ICP · Flow</div>
            <div><SortHeader k="phase" label="Journey" /></div>
            <div><SortHeader k="dayIn" label="Day in" /></div>
            <div>Next milestone</div>
            <div></div>
          </div>
          {sorted.map(c => {
            const pi = PHASES.findIndex(p => p.id === c.phase);
            const prog = (c.progress.done % 4) / 4;
            const risk = atRiskReason(c);
            const verdict = dayInVerdict(c);
            const nextStep = nextMilestoneForPhase(c.phase);
            const isInactive = c.status === 'inactive' || c.status === 'archived';
            return (
              <div key={c.id} className={`client-row ${risk ? 'at-risk' : ''}`} style={{ opacity: isInactive ? 0.6 : 1 }} onClick={() => setScreen({ kind: 'tracker', clientId: c.id })}>
                <div className="client-id">
                  <ClientLogo client={c} />
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="client-name">{c.name}</div>
                      {c.status && c.status !== 'active' && <StatusBadge status={c.status} />}
                    </div>
                    <div className="client-sub">
                      {c.flag} {c.country} · {c.contacts[0]?.name}
                      {c.mrr != null && c.mrr !== '' && <span> · {fmtMoney(c.mrr, c.mrrCurrency)}/mo</span>}
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{c.icp}</div>
                  <div className="client-sub">{c.flow} · {c.touch}</div>
                </div>
                <div>
                  <MiniJourney phaseIdx={pi} progress={prog} />
                  <div className="client-sub" style={{ marginTop: 6 }}>{PHASES[pi]?.name} · {c.progress.done}/{c.progress.total}</div>
                </div>
                <div>
                  <div className="day-counter"><span className="n tabnum">{c.dayIn}</span><span className="l">/180</span></div>
                  <div className={`day-verdict ${verdict.kind}`}>{verdict.label}</div>
                </div>
                <div><div style={{ fontSize: 13, fontWeight: 500 }}>{nextStep}</div></div>
                <div style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                  <Dropdown items={[
                    { label: 'Open tracker', onClick: () => setScreen({ kind: 'tracker', clientId: c.id }) },
                    { label: 'Client view', onClick: () => setScreen({ kind: 'client', clientId: c.id }) },
                    null,
                    { label: c.status === 'active' || !c.status ? 'Mark inactive' : 'Mark active', onClick: () => onEditClient(c.id, { status: c.status === 'active' || !c.status ? 'inactive' : 'active' }) },
                    { label: c.status === 'archived' ? 'Unarchive' : 'Archive', onClick: () => onEditClient(c.id, { status: c.status === 'archived' ? 'active' : 'archived' }) },
                    null,
                    { label: 'Delete permanently', danger: true, onClick: () => { if (window.confirm('Delete ' + c.name + '?')) onEditClient(c.id, { status: 'deleted' }); } },
                  ]} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
