import React, { useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PHASES, ICONS } from '../lib/data';
import { atRiskReason, dayInVerdict, SORTERS, fmtMoney, PHASE_DAY_RANGES } from '../lib/helpers';
import ClientLogo from '../components/ui/ClientLogo';
import StatusBadge from '../components/ui/StatusBadge';
import MiniJourney from '../components/ui/MiniJourney';
import Dropdown from '../components/ui/Dropdown';
import { usePermissions } from '../hooks/usePermissions';

// Localized season + year for the portfolio eyebrow.
function seasonLabel(t) {
  const m = new Date().getMonth(); // 0 = Jan
  const y = new Date().getFullYear();
  const key = (m >= 2 && m <= 4) ? 'spring' : (m >= 5 && m <= 7) ? 'summer' : (m >= 8 && m <= 10) ? 'fall' : 'winter';
  return `${t('dash.season.' + key)} ${y}`;
}

export default function Dashboard({ clients, setScreen, onAddClient, onEditClient, amName = '' }) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const canCreate = can('clients.create');
  const canEdit = can('clients.edit');
  const canDeleteArchive = can('records.deleteArchive');
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

  // baseWithSearchOnly: all filters except the tab — used to compute per-tab counts
  const baseWithSearchOnly = useMemo(() => {
    return base.filter(c => {
      if (icp !== 'All' && c.icp !== icp) return false;
      if (touch !== 'All' && c.touch !== touch) return false;
      if (flowFilter !== 'All' && c.flow !== flowFilter) return false;
      if (amFilter !== 'All' && c.am !== amFilter) return false;
      if (search !== '' && !`${c.name} ${c.country} ${(c.contacts || []).map(x => x.name).join(' ')}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [base, icp, touch, flowFilter, amFilter, search]);

  const baseFiltered = useMemo(() => {
    return baseWithSearchOnly.filter(c => {
      if (tab === 'setup' && !['p1', 'p2'].includes(c.phase)) return false;
      if (tab === 'launching' && c.phase !== 'p3') return false;
      if (tab === 'scaled' && c.phase !== 'p4') return false;
      if (tab === 'risk' && !atRiskReason(c)) return false;
      if (tab === 'inactive' && c.status !== 'inactive') return false;
      return true;
    });
  }, [baseWithSearchOnly, tab]);

  // Per-tab counts reflecting the active search/filter but not the current tab
  const filteredStats = useMemo(() => ({
    all: baseWithSearchOnly.length,
    inSetup: baseWithSearchOnly.filter(c => ['p1', 'p2'].includes(c.phase)).length,
    launching: baseWithSearchOnly.filter(c => c.phase === 'p3').length,
    launched: baseWithSearchOnly.filter(c => c.phase === 'p4').length,
    inactive: baseWithSearchOnly.filter(c => c.status === 'inactive').length,
    overdue: baseWithSearchOnly.filter(c => atRiskReason(c)).length,
  }), [baseWithSearchOnly]);

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
          <div className="eyebrow">{amName ? t('dash.portfolio_named', { name: amName.split(' ')[0] }) : t('dash.portfolio')} · {seasonLabel(t)}</div>
          <h1 className="display-1" style={{ marginTop: 12 }}>{t('dash.headline')}</h1>
          <p className="lede" style={{ marginTop: 16, maxWidth: 540 }}>
            {t('dash.lede_count', { count: stats.total })}{stats.overdue > 0 ? t('dash.lede_overdue', { count: stats.overdue }) : t('dash.lede_clear')}
          </p>
        </div>
        <div className="dash-stats">
          <div className="dash-stat"><div className="label">{t('dash.in_flight')}</div><div className="value tabnum">{stats.total}</div></div>
          <div className="dash-stat"><div className="label">{t('dash.launched')}</div><div className="value tabnum">{stats.launched}</div><div className="delta">{t('dash.phase_4')}</div></div>
          <div className="dash-stat"><div className="label">{t('dash.in_setup')}</div><div className="value tabnum">{stats.inSetup}</div><div className="delta">{t('dash.phases_1_2')}</div></div>
          <div className="dash-stat">
            <div className="label">{t('dash.at_risk')}</div>
            <div className="value tabnum" style={{ color: stats.overdue > 0 ? 'var(--duda)' : 'var(--ink)' }}>{stats.overdue}</div>
            <div className="delta" style={{ color: stats.overdue > 0 ? 'var(--duda-deep)' : 'var(--ink-muted)' }}>{stats.overdue > 0 ? t('dash.action_needed') : t('dash.all_clear')}</div>
          </div>
          {stats.portfolioMrr > 0 && (
            <div className="dash-stat">
              <div className="label">{t('dash.portfolio_mrr')}</div>
              <div className="value tabnum">{fmtMoney(stats.portfolioMrr, stats.mrrCurrency)}</div>
              <div className="delta">{t('dash.arr')} {fmtMoney(stats.portfolioMrr * 12, stats.mrrCurrency)}</div>
            </div>
          )}
        </div>
      </section>

      {focusClients.length > 0 && (
        <section className="focus-strip">
          <div className="focus-label">
            <div className="eyebrow">{t('dash.today')}</div>
            <div className="h-line">{t('dash.needs_attention')}</div>
          </div>
          <div className="focus-cards">
            {focusClients.map(({ c }) => {
              const v = dayInVerdict(c);
              const max = (PHASE_DAY_RANGES[c.phase] || [0, 180])[1];
              const pct = Math.round((c.dayIn / max) * 100);
              return (
              <div key={c.id} className="focus-card" onClick={() => setScreen({ kind: 'tracker', clientId: c.id })}>
                <div className="focus-top"><ClientLogo client={c} /><div className="focus-name">{c.name}</div></div>
                <div className="focus-reason"><b>{t(v.kind === 'bad' ? 'risk.behind' : 'risk.falling')}</b><div style={{ marginTop: 2, color: 'var(--ink-muted)' }}>{t('risk.detail', { day: c.dayIn, max, pct })}</div></div>
              </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="toolbar">
        <div className="left">
          <span className="search">
            {ICONS.search}
            <input ref={searchRef} placeholder={t('dash.search_placeholder')} value={search} onChange={e => setSearch(e.target.value)} />
            <kbd>⌘K</kbd>
          </span>
          <select className="input" style={{ width: 155 }} value={icp} onChange={e => setIcp(e.target.value)}>
            <option value="All">{t('dash.all')}</option><option value="Agency">Agency</option><option value="SaaS">SaaS</option><option value="Hosting">Hosting</option><option value="Listing / YP">Listing / YP</option><option value="POS / eCommerce">POS / eCommerce</option>
          </select>
          <div className="seg">
            <button className={touch === 'All' ? 'on' : ''} onClick={() => setTouch('All')}>{t('dash.all')}</button>
            <button className={touch === 'High-Touch' ? 'on' : ''} onClick={() => setTouch('High-Touch')}>{t('dash.high')}</button>
            <button className={touch === 'Low-Touch' ? 'on' : ''} onClick={() => setTouch('Low-Touch')}>{t('dash.low')}</button>
          </div>
        </div>
        <div className="right">
          <button className={`btn${showFilters ? ' primary' : ''}`} onClick={() => setShowFilters(f => !f)}>{ICONS.filter} {showFilters ? t('dash.hide_filters') : t('dash.more_filters')}</button>
          {stats.archived > 0 && <button className={`btn sm${showArchived ? ' primary' : ''}`} onClick={() => setShowArchived(v => !v)}>{showArchived ? t('dash.hide_archived') : t('dash.archived_count', { count: stats.archived })}</button>}
          {canCreate && <button className="btn primary" onClick={onAddClient}>{ICONS.plus} {t('dash.new_client')}</button>}
        </div>
      </section>

      {showFilters && (
        <div className="filter-panel">
          <div className="field"><label>{t('dash.build_flow')}</label><select className="input" value={flowFilter} onChange={e => setFlowFilter(e.target.value)}><option value="All">{t('dash.all')}</option><option value="DIY">DIY</option><option value="DIFM">DIFM</option><option value="Hybrid">Hybrid</option></select></div>
          <div className="field"><label>{t('dash.assigned_am')}</label><select className="input" value={amFilter} onChange={e => setAmFilter(e.target.value)}><option value="All">{t('dash.all')}</option>{ams.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
          <div className="flex items-end"><button className="btn sm ghost" onClick={clearFilters}>{t('dash.clear_all_filters')}</button></div>
        </div>
      )}

      <div className="tab-row">
        <button className={tab === 'all' ? 'on' : ''} onClick={() => setTab('all')}>{t('dash.tab_all')} <span className="count">{filteredStats.all}</span></button>
        <button className={tab === 'setup' ? 'on' : ''} onClick={() => setTab('setup')}>{t('dash.tab_in_setup')} <span className="count">{filteredStats.inSetup}</span></button>
        <button className={tab === 'launching' ? 'on' : ''} onClick={() => setTab('launching')}>{t('dash.tab_launching')} <span className="count">{filteredStats.launching}</span></button>
        <button className={tab === 'scaled' ? 'on' : ''} onClick={() => setTab('scaled')}>{t('dash.tab_scaled')} <span className="count">{filteredStats.launched}</span></button>
        {stats.inactive > 0 && <button className={tab === 'inactive' ? 'on' : ''} onClick={() => setTab('inactive')}>{t('dash.tab_inactive')} <span className="count">{filteredStats.inactive}</span></button>}
        <button className={tab === 'risk' ? 'on' : ''} onClick={() => setTab('risk')} style={{ color: tab === 'risk' ? 'var(--duda-deep)' : undefined }}>{t('dash.tab_at_risk')} <span className="count">{filteredStats.overdue}</span></button>
      </div>

      {sorted.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">{ICONS.search}</div>
          <h3>{search ? t('dash.no_matches', { q: search }) : t('dash.no_clients')}</h3>
          <p>{t('dash.empty_hint')}</p>
          <div className="empty-actions">
            <button className="btn" onClick={clearFilters}>{t('dash.clear_filters')}</button>
            {canCreate && <button className="btn primary" onClick={onAddClient}>{ICONS.plus} {t('dash.new_client')}</button>}
          </div>
        </div>
      ) : (
        <div className="client-table">
          <div className="client-row head">
            <div><SortHeader k="name" label={t('dash.col_client')} /></div>
            <div>{t('dash.col_icp_flow')}</div>
            <div><SortHeader k="phase" label={t('dash.col_journey')} /></div>
            <div><SortHeader k="dayIn" label={t('dash.col_day_in')} /></div>
            <div><SortHeader k="mrr" label={t('dash.col_mrr')} /></div>
            <div>{t('dash.col_next_milestone')}</div>
            <div></div>
          </div>
          {sorted.map(c => {
            const pi = PHASES.findIndex(p => p.id === c.phase);
            const prog = (c.progress.done % 4) / 4;
            const risk = atRiskReason(c);
            const verdict = dayInVerdict(c);
            const nextStep = t('milestones.' + c.phase);
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
                      {c.flag} {c.country}{c.contacts?.[0]?.name ? ` · ${c.contacts[0].name}` : ''}
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{c.icp}</div>
                  <div className="client-sub">{c.flow} · {c.touch}</div>
                </div>
                <div>
                  <MiniJourney phaseIdx={pi} progress={prog} />
                  <div className="client-sub" style={{ marginTop: 6 }}>{t('phases.' + (PHASES[pi]?.id || 'pre'))} · {c.progress?.done ?? 0}/{c.progress?.total ?? 0}</div>
                </div>
                <div>
                  <div className="day-counter"><span className="n tabnum">{c.dayIn}</span><span className="l">/180</span></div>
                  <div className={`day-verdict ${verdict.kind}`}>{t('verdict.' + verdict.kind)}</div>
                </div>
                <div>
                  {c.mrr != null && c.mrr !== '' ? (
                    <>
                      <div className="tabnum" style={{ fontSize: 14, fontWeight: 600 }}>{fmtMoney(c.mrr, c.mrrCurrency)}</div>
                      <div className="client-sub" style={{ marginTop: 2 }}>{t('dash.mo_suffix')}</div>
                    </>
                  ) : (
                    <span className="client-sub">—</span>
                  )}
                </div>
                <div><div style={{ fontSize: 13, fontWeight: 500 }}>{nextStep}</div></div>
                <div style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                  <Dropdown items={[
                    { label: t('dash.open_tracker'), onClick: () => setScreen({ kind: 'tracker', clientId: c.id }) },
                    { label: t('dash.client_view'), onClick: () => setScreen({ kind: 'client', clientId: c.id }) },
                    canEdit ? null : undefined,
                    canEdit ? { label: c.status === 'active' || !c.status ? t('dash.mark_inactive') : t('dash.mark_active'), onClick: () => onEditClient(c.id, { status: c.status === 'active' || !c.status ? 'inactive' : 'active' }) } : undefined,
                    canDeleteArchive ? { label: c.status === 'archived' ? t('dash.unarchive') : t('dash.archive'), onClick: () => onEditClient(c.id, { status: c.status === 'archived' ? 'active' : 'archived' }) } : undefined,
                    canDeleteArchive ? null : undefined,
                    canDeleteArchive ? { label: t('dash.delete_permanently'), danger: true, onClick: () => { if (window.confirm(t('dash.delete_confirm', { name: c.name }))) onEditClient(c.id, { status: 'deleted' }); } } : undefined,
                  ].filter(i => i !== undefined)} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
