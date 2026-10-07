// CONCEPT MOCKUP — alternative "best practice" layout. Sample numbers.
import { REPS, KPI_TARGETS } from '../data/config.js';
import { PAIRS } from '../data/source.js';
import { paceFraction } from '../utils/pace.js';

export const first = (r) => r.name.split(' ')[0];
export const sum = (repId, k) => PAIRS.filter((p) => p.repId === repId).reduce((a, p) => a + (Number(p[k]) || 0), 0);
export const teamSum = (k) => PAIRS.reduce((a, p) => a + (Number(p[k]) || 0), 0);
export const deals = () => PAIRS.flatMap((p) => (p.deals || []).map((d) => ({ ...d, repId: p.repId, marketId: p.marketId })));
export const repById = (id) => REPS.find((r) => r.id === id);

// Pods from the Friday scorecard sheet.
export const PODS = [
  { name: 'Pod A', lead: 'anthony', reps: ['spencer_brown', 'axel', 'cayden_sicz'] },
  { name: 'Pod B', lead: 'sam_mackenzie', reps: ['danni_brown', 'daniel', 'prince_pharrams'] },
];

// Weekly score with the scorecard sheet's weights (contracts 35, projected $ 15,
// offers 15, opps 10; CRM 25 is manual so it's left out and the rest scaled to
// 100). Zero contracts caps the score at 89, like the sheet.
export function weeklyScore(repId, weekOfMonth = 2) {
  const assigned = deals().filter((d) => d.repId === repId && d.stage === 'assigned').reduce((a, d) => a + d.value, 0);
  const projected = sum(repId, 'revenueMonth') + assigned;
  const c = sum(repId, 'contractsWeek');
  const parts = [
    Math.min(1, c / KPI_TARGETS.contractsPerWeek) * 35,
    Math.min(1, projected / (KPI_TARGETS.revenuePerRepMonth / 4 * weekOfMonth)) * 15,
    Math.min(1, sum(repId, 'offersWeek') / KPI_TARGETS.offersPerWeek) * 15,
    Math.min(1, sum(repId, 'oppsOpenedWeek') / KPI_TARGETS.oppsOpenedPerWeek) * 10,
  ];
  const s = Math.round((parts.reduce((a, b) => a + b, 0) / 75) * 100);
  return { score: c === 0 ? Math.min(89, s) : s, projected, contracts: c, offers: sum(repId, 'offersWeek'), opps: sum(repId, 'oppsOpenedWeek') };
}
export const scoreTone = (s) => (s >= 90 ? { c: '#059669', bg: 'bg-emerald-50', label: 'STRONG' } : s >= 75 ? { c: '#d97706', bg: 'bg-amber-50', label: 'WATCH' } : { c: '#dc2626', bg: 'bg-rose-50', label: 'RED' });

export function paceTone(actual, target, period) {
  const want = target * (period ? paceFraction(period) : 1);
  const r = want > 0 ? actual / want : 1;
  if (r >= 1) return { label: 'ON PACE', cls: 'bg-emerald-500 text-white', bar: '#10b981', want };
  if (r >= 0.8) return { label: 'NEAR PACE', cls: 'bg-amber-400 text-amber-950', bar: '#f59e0b', want };
  return { label: 'BEHIND', cls: 'bg-rose-500 text-white', bar: '#f43f5e', want };
}

export function Delta({ now, prev, money }) {
  const d = now - prev;
  const up = d >= 0;
  const pct = prev > 0 ? Math.round((Math.abs(d) / prev) * 100) : 0;
  const fmt = (v) => (money ? `$${(v / 1000).toFixed(1)}K` : v);
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-bold ${up ? 'text-emerald-600' : 'text-rose-600'}`}>
      {up ? '▲' : '▼'} {fmt(Math.abs(d))} <span className="font-semibold text-zinc-500">({up ? '+' : '−'}{pct}%) vs last wk</span>
    </span>
  );
}

export function Card({ title, kicker, right, className = '', children }) {
  return (
    <section className={`rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col min-h-0 ${className}`}>
      {(title || kicker) && (
        <header className="flex items-end justify-between gap-3 px-5 pt-4 pb-2">
          <div>
            {kicker && <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500 font-semibold">{kicker}</div>}
            {title && <h3 className="text-xl font-bold text-zinc-900 leading-tight">{title}</h3>}
          </div>
          {right && <div className="text-sm text-zinc-500 shrink-0">{right}</div>}
        </header>
      )}
      <div className="flex-1 min-h-0 px-5 pb-4">{children}</div>
    </section>
  );
}
