// Onboarding-plan milestones + secure public share/approval flow.
// Metadata in Postgres (plan_milestones, plan_share_tokens) and approval
// fields on `clients`. All calls degrade gracefully in demo mode: reads fall
// back to the static PLAN constant, writes become no-ops that report via
// monitoring, so the UI keeps working without a connected database.
import { db } from './supabase';
import { PLAN } from './data';
import { reportApiError } from './monitoring';

export const PHASES = ['60', '90', '180'];
export const PLAN_STATUSES = ['draft', 'sent', 'approved', 'locked'];

const isDemo = () => !import.meta.env.VITE_SUPABASE_URL;

// Map a DB row to the app's milestone shape (camelCase).
function rowToMilestone(row) {
  return {
    id:        row.id,
    clientId:  row.client_id,
    phase:     row.phase,
    title:     row.title,
    detail:    row.detail || '',
    sortOrder: row.sort_order ?? 0,
    isCustom:  !!row.is_custom,
  };
}

// Derive editable milestones from the static PLAN demo data, keyed by phase.
// Used as a read-only fallback when there is no database.
export function staticMilestones() {
  const out = [];
  const blocks = { 60: PLAN.d60, 90: PLAN.d90, 180: PLAN.d180 };
  PHASES.forEach(phase => {
    (blocks[phase]?.milestones || []).forEach((m, i) => {
      out.push({
        id:        `${phase}-${i}`,
        phase,
        title:     m.text,
        detail:    '',
        sortOrder: i,
        isCustom:  false,
        // Seed milestones are ALWAYS uncompleted with kickoff-relative day
        // labels (e.g. "Day 14"). We deliberately drop the demo's `done` flag
        // and hardcoded `completed` calendar dates so a freshly created client
        // never shows pre-checked milestones or dates before its kickoff.
        done:      false,
        owner:     m.owner,
        due:       m.due,
      });
    });
  });
  return out;
}

// Group a flat milestone list into { '60': [...], '90': [...], '180': [...] },
// each sorted by sortOrder.
export function groupByPhase(milestones) {
  const g = { 60: [], 90: [], 180: [] };
  (milestones || []).forEach(m => { (g[m.phase] || g[60]).push(m); });
  PHASES.forEach(p => g[p].sort((a, b) => a.sortOrder - b.sortOrder));
  return g;
}

// Load milestones for a client. Falls back to the static demo plan.
export async function loadMilestones(clientId) {
  if (isDemo() || !clientId) return { milestones: staticMilestones(), source: 'static' };
  try {
    const { data, error } = await db
      .from('plan_milestones')
      .select('*')
      .eq('client_id', clientId)
      .order('phase', { ascending: true })
      .order('sort_order', { ascending: true });
    if (error) throw error;
    const rows = (data || []).map(rowToMilestone);
    // First time on a real client with no rows yet: seed from the static plan
    // so the AM has something to edit instead of a blank page.
    if (rows.length === 0) return { milestones: staticMilestones(), source: 'static' };
    return { milestones: rows, source: 'db' };
  } catch (error) {
    reportApiError('plan.loadMilestones', error, { clientId });
    return { milestones: staticMilestones(), source: 'static' };
  }
}

// Persist a full set of milestones for a client (used when leaving edit mode).
// Replaces the client's rows with the supplied list. No-op in demo mode.
export async function saveMilestones(clientId, milestones) {
  if (isDemo() || !clientId) return false;
  const { data: userData, error: userErr } = await db.auth.getUser();
  if (userErr || !userData?.user) {
    throw new Error('You must be signed in to edit the plan.');
  }
  const uid = userData.user.id;
  try {
    const { error: delErr } = await db.from('plan_milestones').delete().eq('client_id', clientId);
    if (delErr) throw delErr;
    const rows = (milestones || []).map((m, i) => ({
      client_id:  clientId,
      user_id:    uid,
      phase:      PHASES.includes(String(m.phase)) ? String(m.phase) : '60',
      title:      (m.title || '').trim() || 'Untitled milestone',
      detail:     m.detail || '',
      sort_order: m.sortOrder ?? i,
      is_custom:  m.isCustom ?? true,
    }));
    if (rows.length) {
      const { error: insErr } = await db.from('plan_milestones').insert(rows);
      if (insErr) throw insErr;
    }
    return true;
  } catch (error) {
    reportApiError('plan.saveMilestones', error, { clientId });
    throw error;
  }
}

// ---- Share tokens -------------------------------------------------------

function rowToToken(row) {
  return {
    id:         row.id,
    token:      row.token,
    clientId:   row.client_id,
    expiresAt:  row.expires_at,
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
    revokedAt:  row.revoked_at,
    createdAt:  row.created_at,
  };
}

// Build the public share URL for a token.
export function shareUrl(token) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/plan/${token}`;
}

// List live (non-revoked, non-expired) share tokens for a client, newest first.
export async function listShareTokens(clientId) {
  if (isDemo() || !clientId) return [];
  try {
    const { data, error } = await db
      .from('plan_share_tokens')
      .select('*')
      .eq('client_id', clientId)
      .is('revoked_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(rowToToken);
  } catch (error) {
    reportApiError('plan.listShareTokens', error, { clientId });
    return [];
  }
}

// Create a share token for a client and mark the plan as 'sent'.
export async function createShareToken(clientId) {
  if (isDemo()) {
    throw new Error('Sharing requires a connected database. Running in demo mode.');
  }
  const { data: userData, error: userErr } = await db.auth.getUser();
  if (userErr || !userData?.user) {
    throw new Error('You must be signed in to share the plan.');
  }
  const uid = userData.user.id;
  try {
    const { data, error } = await db
      .from('plan_share_tokens')
      .insert({ client_id: clientId, created_by: uid })
      .select()
      .single();
    if (error) throw error;
    // Best-effort: move the plan to 'sent' (ignore if it was already further along).
    await db.from('clients')
      .update({ plan_status: 'sent' })
      .eq('id', clientId)
      .in('plan_status', ['draft'])
      .then(() => {}, () => {});
    return rowToToken(data);
  } catch (error) {
    reportApiError('plan.createShareToken', error, { clientId });
    throw error;
  }
}

// Revoke a share token (soft — sets revoked_at).
export async function revokeShareToken(id) {
  if (isDemo() || !id) return false;
  try {
    const { error } = await db
      .from('plan_share_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    reportApiError('plan.revokeShareToken', error, { tokenId: id });
    return false;
  }
}

// ---- Status changes (AM side) ------------------------------------------

// Set the plan status on a client (e.g. reopen an approved plan back to 'sent',
// or 'locked'). Clears approval fields when reopening to 'draft'/'sent'.
export async function setPlanStatus(clientId, status) {
  if (isDemo() || !clientId) return false;
  if (!PLAN_STATUSES.includes(status)) throw new Error(`Invalid plan status: ${status}`);
  const patch = { plan_status: status };
  if (status === 'draft' || status === 'sent') {
    patch.plan_approved_at = null;
    patch.plan_approved_by = null;
  }
  try {
    const { error } = await db.from('clients').update(patch).eq('id', clientId);
    if (error) throw error;
    return true;
  } catch (error) {
    reportApiError('plan.setPlanStatus', error, { clientId, status });
    throw error;
  }
}

// ---- Public (anon) token flow ------------------------------------------

// Load a plan for the public approval page by its share token (anon read).
// Returns { client, milestones, token } or null if the link is invalid/expired.
export async function loadPlanByToken(token) {
  if (!token) return null;
  if (isDemo()) {
    // Demo: synthesise a plan so the public page is previewable without a DB.
    return {
      token: { token, approvedAt: null, approvedBy: null, expiresAt: null },
      client: { id: 'demo', name: 'Acme Co', contacts: [] },
      milestones: staticMilestones(),
      demo: true,
    };
  }
  try {
    const { data: tok, error: tErr } = await db
      .from('plan_share_tokens')
      .select('*')
      .eq('token', token)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    if (tErr) throw tErr;
    if (!tok) return null;

    const { data: cli, error: cErr } = await db
      .from('clients')
      .select('*')
      .eq('id', tok.client_id)
      .maybeSingle();
    if (cErr) throw cErr;
    if (!cli) return null;

    const { data: ms, error: mErr } = await db
      .from('plan_milestones')
      .select('*')
      .eq('client_id', tok.client_id)
      .order('phase', { ascending: true })
      .order('sort_order', { ascending: true });
    if (mErr) throw mErr;

    const milestones = (ms || []).length ? (ms || []).map(rowToMilestone) : staticMilestones();
    return { token: rowToToken(tok), client: cli, milestones };
  } catch (error) {
    reportApiError('plan.loadPlanByToken', error, {});
    return null;
  }
}

// Record a client's approval (anon). Marks the token approved once and flips
// the client's plan to 'approved'. Returns true on success.
export async function approvePlanByToken(token, clientId, approverName) {
  if (isDemo()) {
    throw new Error('Approval requires a connected database. Running in demo mode.');
  }
  const now = new Date().toISOString();
  const name = (approverName || '').trim() || 'Client';
  try {
    const { error: tErr } = await db
      .from('plan_share_tokens')
      .update({ approved_at: now, approved_by: name })
      .eq('token', token)
      .is('approved_at', null);
    if (tErr) throw tErr;

    const { error: cErr } = await db
      .from('clients')
      .update({ plan_status: 'approved', plan_approved_at: now, plan_approved_by: name })
      .eq('id', clientId);
    if (cErr) throw cErr;
    return true;
  } catch (error) {
    reportApiError('plan.approvePlanByToken', error, { clientId });
    throw error;
  }
}

// Read /plan/:token out of the current path. Returns the token or null.
export function tokenFromPath() {
  if (typeof window === 'undefined') return null;
  const m = window.location.pathname.match(/^\/plan\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}
