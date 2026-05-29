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
    phase:    row.phase,
    status:   row.status || 'active',
    contacts: row.contacts || [],
    progress: { done: row.progress_done || 0, total: row.progress_total || 20 },
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
export function stepToDbRow(step, clientId) {
  return {
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
}

// Map app client shape to DB columns (for insert/update)
export function clientToDbRow(c) {
  return {
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
  };
}
