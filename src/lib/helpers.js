export function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d;
}

export function fmtDate(d) {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Format a monetary amount with currency. Returns '' for null/undefined.
export function fmtMoney(amount, currency = 'USD') {
  if (amount == null || amount === '' || isNaN(Number(amount))) return '';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `${currency} ${Number(amount).toLocaleString()}`;
  }
}

// Annual Recurring Revenue = MRR × 12.
export function arrFromMrr(mrr) {
  if (mrr == null || mrr === '' || isNaN(Number(mrr))) return null;
  return Number(mrr) * 12;
}

export const PHASE_DAY_RANGES = {
  pre: [0,   10],
  p1:  [10,  28],
  p2:  [28,  56],
  p3:  [56,  80],
  p4:  [80, 180],
};

export function dayInVerdict(client) {
  const [, max] = PHASE_DAY_RANGES[client.phase] || [0, 180];
  const ratio = client.dayIn / max;
  if (ratio <= 0.65) return { kind: 'ok',   label: 'On track' };
  if (ratio <= 0.85) return { kind: 'warn',  label: 'Watch' };
  return { kind: 'bad', label: 'At risk' };
}

export function phaseDates(kickoff) {
  if (!kickoff) return {};
  const result = {};
  for (const [id, [startDay, endDay]] of Object.entries(PHASE_DAY_RANGES)) {
    result[id] = {
      start:    fmtDate(addDays(kickoff, startDay)),
      end:      fmtDate(addDays(kickoff, endDay)),
      startDay,
      endDay,
    };
  }
  return result;
}

export function atRiskReason(client) {
  const verdict = dayInVerdict(client);
  if (verdict.kind === 'ok') return null;
  const [, max] = PHASE_DAY_RANGES[client.phase] || [0, 180];
  const pct = Math.round((client.dayIn / max) * 100);
  return {
    reason: verdict.kind === 'bad' ? 'Behind schedule' : 'Falling behind',
    detail: `Day ${client.dayIn} of ${max} (${pct}%)`,
  };
}

export function nextMilestoneForPhase(phaseId) {
  const map = {
    pre: 'Contracts signed & access granted',
    p1:  'Kickoff call complete',
    p2:  'First template built',
    p3:  'Training session delivered',
    p4:  'First site launched',
  };
  return map[phaseId] || 'Next milestone';
}

// Order steps within a phase by their day value (the "Day N" due) ascending.
// Array#sort is stable, so equal days keep their original (creation) order.
export function sortStepsByDay(steps) {
  return [...(steps || [])].sort((a, b) => (a.due ?? 0) - (b.due ?? 0));
}

export const SORTERS = {
  name:     (a, b) => a.name.localeCompare(b.name),
  dayIn:    (a, b) => b.dayIn - a.dayIn,
  mrr:      (a, b) => (Number(b.mrr) || 0) - (Number(a.mrr) || 0),
  progress: (a, b) => {
    const pa = (a.progress.done / a.progress.total) || 0;
    const pb = (b.progress.done / b.progress.total) || 0;
    return pb - pa;
  },
  phase:    (a, b) => {
    const order = { pre: 0, p1: 1, p2: 2, p3: 3, p4: 4 };
    return (order[a.phase] || 0) - (order[b.phase] || 0);
  },
  risk: (a, b) => {
    const rank = { bad: 0, warn: 1, ok: 2 };
    const ra = rank[dayInVerdict(a).kind] ?? 2;
    const rb = rank[dayInVerdict(b).kind] ?? 2;
    return ra - rb;
  },
};
