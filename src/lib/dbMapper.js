// Valid phase IDs (mirrors PHASES in lib/data.jsx). Any other value is legacy/invalid.
const VALID_PHASES = ['pre', 'p1', 'p2', 'p3', 'p4'];

// Normalize a stored phase to a valid id, falling back to 'pre' for legacy values
// like the display label "Phase 00" that older code paths persisted.
export function normalizePhase(phase) {
  return VALID_PHASES.includes(phase) ? phase : 'pre';
}

// Map DB row (snake_case flat) to app client shape (camelCase nested)
export function dbRowToClient(row) {
  return {
    id:       row.id,
    name:     row.name,
    icp:      row.icp,
    flow:     row.flow,
    touch:    row.touch,
    country:  row.country,
    flag:     row.flag,
    lang:     row.lang,
    color:    row.color,
    mono:     row.mono,
    kickoff:  row.kickoff,
    am:       row.am,
    dayIn:    row.day_in,
    phase:    normalizePhase(row.phase),
    status:   row.status || 'active',
    contacts: row.contacts || [],
    progress: { done: row.progress_done || 0, total: row.progress_total || 20 },
    mrr:         row.mrr_amount ?? null,
    mrrCurrency: row.mrr_currency || 'USD',
    planStatus:     row.plan_status || 'draft',
    planApprovedAt: row.plan_approved_at || null,
    planApprovedBy: row.plan_approved_by || null,
    logoUrl:    row.logo_url || null,
    sfId:       row.sf_id || null,
    boxUrl:     row.box_url || null,
    goLiveDate: row.go_live_date || null,
  };
}

// Map DB step row to app step shape
export function dbRowToStep(row) {
  return {
    id:       row.id,
    clientId: row.client_id,
    phase:    row.phase,
    title:    row.title,
    why:      row.why || '',
    owner:    row.owner,
    prio:     row.prio,
    status:   row.status || 'not',
    start:    row.start || 0,
    due:      row.due || 0,
  };
}

// Map app step shape to DB columns (for insert/update)
export function stepToDbRow(step, clientId, userId = null) {
  const row = {
    client_id: clientId,
    phase:     step.phase,
    title:     step.title,
    why:       step.why || '',
    owner:     step.owner,
    prio:      step.prio,
    status:    step.status || 'not',
    start:     step.start || 0,
    due:       step.due || 0,
  };
  if (userId) row.user_id = userId;
  return row;
}

// Map app client shape to DB columns (for insert/update)
export function clientToDbRow(c, userId = null) {
  const row = {
    name:           c.name,
    icp:            c.icp,
    flow:           c.flow,
    touch:          c.touch,
    country:        c.country,
    flag:           c.flag,
    lang:           c.lang,
    color:          c.color,
    mono:           c.mono,
    kickoff:        c.kickoff,
    am:             c.am,
    day_in:         c.dayIn,
    phase:          c.phase,
    status:         c.status || 'active',
    contacts:       c.contacts || [],
    progress_done:  c.progress?.done  || 0,
    progress_total: c.progress?.total || 20,
    mrr_amount:     c.mrr ?? null,
    mrr_currency:   c.mrrCurrency || 'USD',
    logo_url:       c.logoUrl ?? null,
    sf_id:          c.sfId ?? null,
    box_url:        c.boxUrl ?? null,
    go_live_date:   c.goLiveDate ?? null,
  };
  if (userId) row.user_id = userId;
  return row;
}
