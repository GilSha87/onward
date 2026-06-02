import React, { useState, useEffect, useRef } from 'react';
import { db } from './lib/supabase';
import { SAMPLE_CLIENTS, SAMPLE_STEPS } from './lib/data';
import { dbRowToClient, clientToDbRow, dbRowToStep, stepToDbRow } from './lib/dbMapper';
import { reportApiError } from './lib/monitoring';
import ToastProvider, { showToast } from './components/ui/Toast';
import { TweaksPanel, TweakSection, TweakToggle, TweakRadio, TweakColor, TweakSelect, useTweaks } from './components/TweaksPanel';
import Topbar from './components/layout/Topbar';
import Dashboard from './pages/Dashboard';
import Tracker from './pages/Tracker';
import PlanView from './pages/PlanView';
import PublicPlanView from './pages/PublicPlanView';
import ClientView from './pages/ClientView'
import TeamPage from './pages/TeamPage';
import Login from './pages/Login';
import AddClientModal from './modals/AddClientModal';
import EditStepModal from './modals/EditStepModal';
import AddTeamModal from './modals/AddTeamModal';
import SharePlanModal from './modals/SharePlanModal';
import { tokenFromPath, setPlanStatus } from './lib/plan';

const TWEAK_DEFAULTS = {
  showLogin: false,
  startScreen: 'dashboard',
  viewMode: 'am',
  density: 'balanced',
  accent: '#FB673E',
  paperTone: 'warm',
};

function userFromSession(session) {
  const u = session?.user;
  if (!u) return { name: '', initials: '—' };
  const name = u.user_metadata?.full_name || u.email || '';
  const parts = name.split(' ').filter(Boolean);
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase() || '—';
  return { name, initials };
}

const DEV = import.meta.env.DEV;

export default function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  // In production, always require a real Supabase session. The showLogin tweak
  // is a dev-only convenience and never bypasses auth in a production build.
  const [authed, setAuthed] = useState(DEV ? !t.showLogin : false);
  const [view, setView] = useState(t.viewMode);
  const [screen, setScreen] = useState(() => {
    if (t.startScreen === 'tracker') return { kind: 'tracker', clientId: 'c1' };
    if (t.startScreen === 'plan') return { kind: 'plan', clientId: 'c1' };
    if (t.startScreen === 'team') return { kind: 'team' };
    if (t.startScreen === 'client') return { kind: 'client', clientId: 'c1' };
    return { kind: 'dashboard' };
  });
  const [modal, setModal] = useState(null);
  const [clients, setClients] = useState([]);
  const [stepsByClient, setStepsByClient] = useState({});
  const [team, setTeam] = useState([]);
  const [currentUser, setCurrentUser] = useState({ name: '', initials: '—' });
  const [loadingClients, setLoadingClients] = useState(true);
  const [apiNotice, setApiNotice] = useState(null);
  const loadedClients = useRef(new Set());

  // Check Supabase auth session on mount
  useEffect(() => {
    db.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuthed(true);
        setCurrentUser(userFromSession(session));
      }
    });
    const { data: { subscription } } = db.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuthed(true);
        setCurrentUser(userFromSession(session));
      } else if (!DEV || t.showLogin) {
        setAuthed(false);
        setCurrentUser({ name: '', initials: '—' });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load clients from Supabase once authenticated
  useEffect(() => {
    if (!authed) return;
    db.from('clients').select('*').then(({ data, error }) => {
      if (error) {
        reportApiError('clients.select', error);
        setApiNotice("We couldn't load your live clients, so you're seeing sample data.");
        setClients(SAMPLE_CLIENTS.map(c => ({ ...c, status: c.status || 'active' })));
      } else if (data && data.length > 0) {
        setClients(data.map(dbRowToClient));
      } else {
        setClients([]);
      }
    }).catch((error) => {
      reportApiError('clients.select', error);
      setApiNotice("We couldn't load your live clients, so you're seeing sample data.");
      setClients(SAMPLE_CLIENTS.map(c => ({ ...c, status: c.status || 'active' })));
    }).finally(() => setLoadingClients(false));
  }, [authed]);

  // Load team members from Supabase
  useEffect(() => {
    if (!authed) return;
    db.from('team_members').select('*').then(({ data, error }) => {
      if (error) {
        reportApiError('team_members.select', error);
      } else {
        setTeam((data || []).map(m => {
          const parts = m.name.split(' ').filter(Boolean);
          const mono = (parts.length >= 2
            ? parts[0][0] + parts[parts.length - 1][0]
            : m.name.slice(0, 2)).toUpperCase();
          return {
            id: m.id,
            name: m.name,
            email: m.email,
            role: m.role,
            status: m.status,
            mono,
            initials: mono,
            clients: 0,
            open: 0,
            resolved: 0,
            color: '#1F3A5F',
          };
        }));
      }
    });
  }, [authed]);

  useEffect(() => { setView(t.viewMode); }, [t.viewMode]);
  useEffect(() => { if (DEV) setAuthed(!t.showLogin); }, [t.showLogin]);

  // Apply density / accent / paper-tone CSS vars
  useEffect(() => {
    const root = document.documentElement;
    if (t.density === 'dense') {
      root.style.setProperty('--s-6', '18px');
      root.style.setProperty('--s-7', '24px');
      root.style.setProperty('--s-8', '32px');
    } else if (t.density === 'airy') {
      root.style.setProperty('--s-6', '32px');
      root.style.setProperty('--s-7', '40px');
      root.style.setProperty('--s-8', '56px');
    } else {
      root.style.removeProperty('--s-6');
      root.style.removeProperty('--s-7');
      root.style.removeProperty('--s-8');
    }
    root.style.setProperty('--accent', t.accent);
    root.style.setProperty('--duda', t.accent);
    if (t.paperTone === 'cool') {
      root.style.setProperty('--paper', '#F0F2F5');
      root.style.setProperty('--paper-soft', '#F7F8FA');
      root.style.setProperty('--hairline', '#E0E3E8');
      root.style.setProperty('--hairline-soft', '#EBEDF1');
    } else if (t.paperTone === 'crisp') {
      root.style.setProperty('--paper', '#FFFFFF');
      root.style.setProperty('--paper-soft', '#FAFAFA');
      root.style.setProperty('--hairline', '#EAEAEA');
      root.style.setProperty('--hairline-soft', '#F2F2F2');
    } else {
      root.style.removeProperty('--paper');
      root.style.removeProperty('--paper-soft');
      root.style.removeProperty('--surface');
      root.style.removeProperty('--hairline');
      root.style.removeProperty('--hairline-soft');
    }
  }, [t.density, t.accent, t.paperTone]);

  // Load steps for a client on demand (once per session per client)
  function loadStepsForClient(clientId) {
    if (loadedClients.current.has(clientId)) return;
    loadedClients.current.add(clientId);
    db.from('steps').select('*').eq('client_id', clientId).then(({ data, error }) => {
      if (error) {
        reportApiError('steps.select', error, { clientId });
        setStepsByClient(prev => ({ ...prev, [clientId]: SAMPLE_STEPS }));
      } else if (data && data.length > 0) {
        setStepsByClient(prev => ({ ...prev, [clientId]: data.map(dbRowToStep) }));
      } else {
        setStepsByClient(prev => ({ ...prev, [clientId]: [] }));
      }
    });
  }

  useEffect(() => {
    if (screen.clientId) loadStepsForClient(screen.clientId);
  }, [screen.clientId]);

  const client = screen.clientId ? clients.find(c => c.id === screen.clientId) : null;

  function editClient(id, updates) {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    const dbUpdates = {};
    if ('dayIn' in updates) dbUpdates.day_in = updates.dayIn;
    if ('progress' in updates) {
      dbUpdates.progress_done = updates.progress.done;
      dbUpdates.progress_total = updates.progress.total;
    }
    if ('contacts' in updates) dbUpdates.contacts = updates.contacts;
    if ('mrr' in updates) dbUpdates.mrr_amount = updates.mrr;
    if ('mrrCurrency' in updates) dbUpdates.mrr_currency = updates.mrrCurrency;
    ['name', 'icp', 'flow', 'touch', 'country', 'flag', 'lang', 'color', 'mono', 'kickoff', 'am', 'phase', 'status'].forEach(k => {
      if (k in updates) dbUpdates[k] = updates[k];
    });
    if ('logoUrl' in updates)    dbUpdates.logo_url      = updates.logoUrl;
    if ('sfId' in updates)       dbUpdates.sf_id         = updates.sfId;
    if ('boxUrl' in updates)     dbUpdates.box_url       = updates.boxUrl;
    if ('goLiveDate' in updates) dbUpdates.go_live_date  = updates.goLiveDate;
    if (Object.keys(dbUpdates).length > 0) {
      db.from('clients').update(dbUpdates).eq('id', id).then(({ error }) => {
        if (error) {
          reportApiError('clients.update', error, { id });
          showToast('Failed to save client changes.', 'error');
        }
      });
    }
  }

  function toggleStep(clientId, stepId) {
    setStepsByClient(prev => {
      const clientSteps = prev[clientId] || [];
      const updated = clientSteps.map(s =>
        s.id === stepId ? { ...s, status: s.status === 'done' ? 'not' : 'done' } : s
      );
      const step = updated.find(s => s.id === stepId);
      if (step) {
        db.from('steps').update({ status: step.status }).eq('id', stepId)
          .then(({ error }) => {
            if (error) {
              reportApiError('steps.toggle', error, { stepId });
              showToast('Failed to update step status.', 'error');
            }
          });
      }
      return { ...prev, [clientId]: updated };
    });
  }

  function saveStep(clientId, updated) {
    if (updated._delete) {
      setStepsByClient(prev => ({
        ...prev,
        [clientId]: (prev[clientId] || []).filter(s => s.id !== updated.id),
      }));
      db.from('steps').delete().eq('id', updated.id)
        .then(({ error }) => { if (error) reportApiError('steps.delete', error, { stepId: updated.id }); });
      return;
    }
    setStepsByClient(prev => ({
      ...prev,
      [clientId]: (prev[clientId] || []).map(s => s.id === updated.id ? updated : s),
    }));
    db.from('steps').update(stepToDbRow(updated, clientId)).eq('id', updated.id)
      .then(({ error }) => { if (error) reportApiError('steps.update', error, { stepId: updated.id }); });
  }

  function deleteMember(id) {
    setTeam(prev => prev.filter(m => m.id !== id));
    db.from('team_members').delete().eq('id', id).then(({ error }) => {
      if (error) {
        reportApiError('team_members.delete', error, { id });
        showToast('Failed to remove team member.', 'error');
      }
    });
  }

  function signOut() {
    db.auth.signOut().then(() => {
      setAuthed(false);
      setCurrentUser({ name: '', initials: '—' });
    });
  }

  async function addMember(member) {
    const name = (member.name || '').trim();
    if (!name) return;
    const parts = name.split(' ').filter(Boolean);
    const mono = (parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : name.slice(0, 2)).toUpperCase();
    const colors = ['#1F3A5F', '#5C6B4A', '#B8543A', '#4F5A66', '#1A1714'];
    const tempId = 't' + Date.now();
    const email = (member.email || '').trim();
    const role = member.role || 'Staff';
    setTeam(prev => [...prev, {
      id: tempId,
      name,
      email,
      role,
      status: 'invited',
      mono,
      initials: mono,
      clients: 0,
      open: 0,
      resolved: 0,
      color: colors[prev.length % colors.length],
    }]);
    // The invite-team-member Edge Function already inserted this row
    // (with user_id + invited_by, which RLS requires). Don't insert again —
    // just reconcile our optimistic row with the canonical DB row.
    const { data, error } = await db.from('team_members')
      .select('id, status')
      .eq('email', email)
      .maybeSingle();
    if (error) {
      reportApiError('team_members.select', error);
    } else if (data) {
      setTeam(prev => prev.map(m => m.id === tempId
        ? { ...m, id: data.id, status: data.status || 'invited' }
        : m));
    }
  }

  // Public, unauthenticated share route: /plan/:token. Rendered before the auth
  // guard so clients can review & approve a plan without an Onward account.
  const publicToken = tokenFromPath();
  if (publicToken) return <PublicPlanView token={publicToken} />;

  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;

  const effectiveScreen = (view === 'client' && screen.kind === 'tracker') ? { ...screen, kind: 'client' }
    : (view === 'am' && screen.kind === 'client') ? { ...screen, kind: 'tracker' } : screen;
  const isClientFacing = effectiveScreen.kind === 'client';
  const clientSteps = client ? (stepsByClient[client.id] || []) : [];

  return (
    <>
      <ToastProvider />
      {apiNotice && (
        <div
          role="status"
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            padding: '8px 16px', fontSize: 13, fontWeight: 500,
            background: '#FFF3E9', color: '#8A3D1E',
            borderBottom: '1px solid #F3D6C2',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          }}
        >
          <span>{apiNotice}</span>
          <button
            onClick={() => setApiNotice(null)}
            aria-label="Dismiss notice"
            style={{ border: 'none', background: 'transparent', color: '#8A3D1E', fontWeight: 700, cursor: 'pointer', fontSize: 15, lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      )}
      {!isClientFacing && (
        <Topbar
          view={view}
          setView={setView}
          screen={effectiveScreen}
          setScreen={setScreen}
          client={client}
          amName={currentUser.name}
          amInitials={currentUser.initials}
          onSignOut={signOut}
        />
      )}
      {isClientFacing && (
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 20, display: 'flex', gap: 8 }}>
          <div className="view-toggle" style={{ boxShadow: '0 4px 16px rgba(26,23,20,.08)' }}>
            <button className={view === 'am' ? 'on' : ''} onClick={() => setView('am')}>AM view</button>
            <button className={view === 'client' ? 'on' : ''} onClick={() => setView('client')}>Client view</button>
          </div>
        </div>
      )}

      {effectiveScreen.kind === 'dashboard' && loadingClients && clients.length === 0 && (
        <div
          role="status"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: '60vh', fontSize: 14, opacity: 0.6,
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          }}
        >
          Loading clients…
        </div>
      )}
      {effectiveScreen.kind === 'dashboard' && !(loadingClients && clients.length === 0) && (
        <Dashboard
          clients={clients}
          setScreen={setScreen}
          onAddClient={() => setModal({ kind: 'addClient' })}
          onEditClient={editClient}
          amName={currentUser.name}
        />
      )}
      {effectiveScreen.kind === 'tracker' && client && (
        <Tracker
          client={client}
          steps={clientSteps}
          setScreen={setScreen}
          onPlanEdit={id => setScreen({ kind: 'plan', clientId: id })}
          onStep={s => setModal({ kind: 'editStep', step: s, clientId: client.id })}
          onToggleStep={stepId => toggleStep(client.id, stepId)}
          onEditClient={editClient}
        />
      )}
      {effectiveScreen.kind === 'plan' && client && (
        <PlanView
          client={client}
          editable={view === 'am'}
          onClose={() => setScreen({ kind: 'tracker', clientId: client.id })}
          onShare={id => setModal({ kind: 'sharePlan', clientId: id })}
          onReopen={async () => {
            const ok = await setPlanStatus(client.id, 'sent').then(() => true, () => false);
            if (ok) {
              setClients(prev => prev.map(c => c.id === client.id
                ? { ...c, planStatus: 'sent', planApprovedAt: null, planApprovedBy: null }
                : c));
            }
          }}
        />
      )}
      {effectiveScreen.kind === 'client' && client && (
        <ClientView
          client={client}
          steps={clientSteps}
          onOpenPlan={() => setScreen({ kind: 'plan', clientId: client.id })}
          onToggleStep={stepId => toggleStep(client.id, stepId)}
        />
      )}
      {effectiveScreen.kind === 'team' && (
        <TeamPage team={team} onAdd={() => setModal({ kind: 'addTeam' })} onDeleteMember={deleteMember} />
      )}

      {modal?.kind === 'addClient' && (
        <AddClientModal
          currentUser={currentUser}
          onClose={() => setModal(null)}
          onSave={async c => {
            const newClient = { ...c, status: 'active' };
            const { data: { session } } = await db.auth.getSession();
            const userId = session?.user?.id;
            const { data, error } = await db.from('clients').insert(clientToDbRow(newClient, userId)).select().single();
            if (error) {
              reportApiError('clients.insert', error);
              showToast('Failed to save client. Please try again.', 'error');
              return;
            }
            const resolvedClient = dbRowToClient(data);
            setClients(prev => [...prev, resolvedClient]);
            const baseSteps = SAMPLE_STEPS.filter(s => {
              if (c.excludedSteps?.includes(s.id)) return false;
              const flowOk = !s.flows || s.flows.includes('All') || s.flows.includes(c.flow);
              const segOk = !s.segments || s.segments.includes('All') || s.segments.includes(c.icp);
              return flowOk && segOk;
            });
            const allSteps = [...baseSteps, ...(c.customSteps || [])];
            const stepsToInsert = allSteps.map(s => stepToDbRow(s, resolvedClient.id, userId));
            if (stepsToInsert.length > 0) {
              const { error: stepsErr } = await db.from('steps').insert(stepsToInsert);
              if (stepsErr) {
                reportApiError('steps.insert', stepsErr, { clientId: resolvedClient.id });
                showToast('Client saved but steps failed to load. Please refresh.', 'warning');
              }
              setStepsByClient(prev => ({ ...prev, [resolvedClient.id]: allSteps }));
            } else {
              setStepsByClient(prev => ({ ...prev, [resolvedClient.id]: [] }));
            }
            loadedClients.current.add(resolvedClient.id);
            setScreen({ kind: 'tracker', clientId: resolvedClient.id });
            setModal(null);
          }}
        />
      )}
      {modal?.kind === 'editStep' && (
        <EditStepModal
          step={modal.step}
          onClose={() => setModal(null)}
          onSave={updated => saveStep(modal.clientId, updated)}
        />
      )}
      {modal?.kind === 'addTeam' && (
        <AddTeamModal
          onClose={() => setModal(null)}
          onSave={member => { addMember(member); setModal(null); }}
        />
      )}
      {modal?.kind === 'sharePlan' && (() => {
        const target = clients.find(c => c.id === modal.clientId) || client;
        return target ? <SharePlanModal client={target} onClose={() => setModal(null)} /> : null;
      })()}

      {DEV && (
      <TweaksPanel title="Tweaks">
        <TweakSection label="Try a screen">
          <TweakSelect value={effectiveScreen.kind} onChange={v => {
            if (v === 'dashboard') setScreen({ kind: 'dashboard' });
            else if (v === 'tracker') setScreen({ kind: 'tracker', clientId: 'c1' });
            else if (v === 'plan') setScreen({ kind: 'plan', clientId: 'c1' });
            else if (v === 'client') setScreen({ kind: 'client', clientId: 'c1' });
            else if (v === 'team') setScreen({ kind: 'team' });
          }} options={[
            { value: 'dashboard', label: 'Portfolio dashboard' },
            { value: 'tracker', label: 'Client tracker' },
            { value: 'plan', label: '60·90·180 plan' },
            { value: 'client', label: 'Client-facing view' },
            { value: 'team', label: 'Team management' },
          ]} />
        </TweakSection>
        <TweakSection label="Login flow">
          <TweakToggle label="Show login screen" value={t.showLogin} onChange={v => setTweak('showLogin', v)} />
        </TweakSection>
        <TweakSection label="Density">
          <TweakRadio value={t.density} onChange={v => setTweak('density', v)} options={[{ value: 'dense', label: 'Dense' }, { value: 'balanced', label: 'Balanced' }, { value: 'airy', label: 'Airy' }]} />
        </TweakSection>
        <TweakSection label="Accent color">
          <TweakColor value={t.accent} onChange={v => setTweak('accent', v)} options={['#FB673E', '#6D5BFF', '#18A672', '#F6BA1A', '#14141A']} />
        </TweakSection>
        <TweakSection label="Paper tone">
          <TweakRadio value={t.paperTone} onChange={v => setTweak('paperTone', v)} options={[{ value: 'warm', label: 'Warm' }, { value: 'crisp', label: 'Crisp' }, { value: 'cool', label: 'Cool' }]} />
        </TweakSection>
      </TweaksPanel>
      )}
    </>
  );
}
