// MOCKUP — Advanced rework (Luke, Oct 7): one table, every rep's KPIs side by
// side, expandable into that rep's markets; flip to "By market" to see each
// state with its reps underneath. Period picker stays (the real version
// totals any week / month / custom range from history.json per rep × market,
// the same engine the current Advanced tab uses).
import { useState } from 'react';
import { REPS, MARKETS, KPI_TARGETS } from '../data/config.js';
import { PAIRS } from '../data/source.js';
import { formatCompactCurrency } from '../utils/format.js';
import { STATE_DOT } from '../utils/marketShade.js';

const COLS = [
  { key: 'convosWeek', label: 'Convos', group: 'Activity' },
  { key: 'agentsAddedWeek', label: 'Agents +', group: 'Activity' },
  { key: 'oppsOpenedWeek', label: 'Opps', group: 'Pipeline', target: KPI_TARGETS.oppsOpenedPerWeek },
  { key: 'offersWeek', label: 'Offers', group: 'Pipeline', target: KPI_TARGETS.offersPerWeek },
  { key: 'contractsWeek', label: 'Contracts', group: 'Pipeline', target: KPI_TARGETS.contractsPerWeek },
  { key: 'dealsClosedWeek', label: 'Closed', group: 'Results' },
  { key: 'revenueWeek', label: 'Revenue', group: 'Results', money: true },
  { key: 'abandoned', label: 'Aban', group: 'Fallout', muted: true },
  { key: 'lost', label: 'Lost', group: 'Fallout', muted: true },
];
const GRID = { gridTemplateColumns: '19rem repeat(2, minmax(0,1fr)) 0.5rem repeat(3, minmax(0,1fr)) 0.5rem repeat(2, minmax(0,1fr)) 0.5rem repeat(2, minmax(0,0.7fr))' };
const SEP_AFTER = new Set([1, 4, 6]);

const total = (pairs, k) => pairs.reduce((a, p) => a + (Number(p[k]) || 0), 0);

function Cell({ col, value, scale = 1, sub }) {
  const t = col.target ? col.target * scale : null;
  const pct = t ? Math.min(100, (value / t) * 100) : 0;
  const tone = !t ? null : value >= t ? '#10b981' : value >= t * 0.6 ? '#f59e0b' : '#f43f5e';
  return (
    <div className="min-w-0 text-right">
      <div className={`tabular-nums leading-none ${sub ? 'text-lg font-semibold' : 'text-2xl font-bold'} ${col.muted ? 'text-zinc-400' : t && value >= t ? 'text-emerald-600' : 'text-zinc-900'}`}>
        {col.money ? formatCompactCurrency(value) : value}
        {t && !sub && <span className="text-xs font-semibold text-zinc-400"> /{t}</span>}
      </div>
      {t && (
        <div className="h-1.5 mt-1.5 rounded-full bg-zinc-100 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: tone }} />
        </div>
      )}
    </div>
  );
}

function Row({ label, dot, pairs, scale, sub, open, onToggle, count, targets }) {
  return (
    <div
      className={`grid items-center gap-x-3 px-3 ${sub ? 'py-1.5 bg-zinc-50/80' : 'py-2.5 border-t border-zinc-200 cursor-pointer hover:bg-blue-50/40'}`}
      style={GRID}
      onClick={onToggle}
    >
      <div className={`flex items-center gap-2 min-w-0 ${sub ? 'pl-8' : ''}`}>
        {!sub && <span className="text-zinc-400 w-4 text-sm">{open ? '▾' : '▸'}</span>}
        <span className="rounded-full shrink-0" style={{ width: sub ? 8 : 12, height: sub ? 8 : 12, background: dot }} />
        <span className="min-w-0 leading-tight">
          <span className={`block truncate ${sub ? 'text-base text-zinc-700' : 'text-lg font-bold text-zinc-900'}`}>{label}</span>
          {count != null && !sub && <span className="block text-xs text-zinc-400">{count}</span>}
        </span>
      </div>
      {COLS.map((c, i) => [
        <Cell key={c.key} col={targets ? c : { ...c, target: undefined }} value={total(pairs, c.key)} scale={scale} sub={sub} />,
        SEP_AFTER.has(i) ? <span key={`s${i}`} /> : null,
      ])}
    </div>
  );
}

export default function AdvancedMock({ initialMode = 'rep', initialOpen = ['anthony', 'danni_brown'] }) {
  const [mode, setMode] = useState(initialMode);
  const [open, setOpen] = useState(new Set(initialOpen));
  const toggle = (id) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const groups = mode === 'rep'
    ? REPS.map((r) => ({
        id: r.id, label: r.name, dot: r.color, scale: 1, count: `${r.markets.length} markets`,
        pairs: PAIRS.filter((p) => p.repId === r.id),
        children: r.markets.map((m) => ({ id: m, label: MARKETS.find((x) => x.id === m)?.name || m, dot: STATE_DOT, pairs: PAIRS.filter((p) => p.repId === r.id && p.marketId === m) })),
      }))
    : MARKETS.map((m) => {
        const reps = REPS.filter((r) => r.markets.includes(m.id));
        return {
          id: m.id, label: m.name, dot: STATE_DOT, scale: reps.length, count: `${reps.length} rep${reps.length > 1 ? 's' : ''}`,
          pairs: PAIRS.filter((p) => p.marketId === m.id),
          children: reps.map((r) => ({ id: r.id, label: r.name, dot: r.color, pairs: PAIRS.filter((p) => p.repId === r.id && p.marketId === m.id) })),
        };
      });
  const sortKey = mode === 'rep' ? 'oppsOpenedWeek' : 'convosWeek';
  const sorted = [...groups].sort((a, b) => total(b.pairs, sortKey) - total(a.pairs, sortKey));

  return (
    <div className="h-full flex flex-col gap-3 min-h-0">
      <div className="flex items-center gap-3 flex-wrap rounded-xl border border-zinc-300/80 bg-white px-4 py-3">
        <div className="inline-flex rounded-lg bg-zinc-100 p-1">
          {[['rep', 'By rep'], ['market', 'By market']].map(([v, l]) => (
            <button key={v} onClick={() => setMode(v)} className={`px-4 py-1.5 rounded-md text-sm font-bold ${mode === v ? 'bg-white shadow text-zinc-900' : 'text-zinc-500'}`}>{l}</button>
          ))}
        </div>
        <label className="text-xs uppercase tracking-[0.15em] text-zinc-500 ml-3">Period</label>
        <select className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-semibold" defaultValue="wk">
          <option value="wk">This week (Oct 5 – now)</option>
          <option>This month</option><option>Last week (Sep 28 – Oct 4)</option><option>September</option><option>Custom range…</option>
        </select>
        <span className="text-sm text-zinc-500">{mode === 'rep' ? 'Rep rows show progress vs target (scaled to the period); market rows show the split' : 'Targets are per rep, so states show counts only'} · click a row to {mode === 'rep' ? 'see its markets' : 'see its reps'}</span>
        <button className="ml-auto text-sm font-semibold text-blue-600" onClick={() => setOpen(new Set(open.size ? [] : groups.map((g) => g.id)))}>{open.size ? 'Collapse all' : 'Expand all'}</button>
      </div>

      <div className="flex-1 min-h-0 rounded-xl border border-zinc-300/80 bg-white flex flex-col overflow-hidden">
        <div className="grid gap-x-3 px-3 pt-3 text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400" style={GRID}>
          <span />
          <span className="col-span-2 border-b-2 border-violet-300 pb-1 text-violet-600">Activity</span><span />
          <span className="col-span-3 border-b-2 border-blue-300 pb-1 text-blue-600">{mode === 'rep' ? 'Pipeline · vs weekly target' : 'Pipeline'}</span><span />
          <span className="col-span-2 border-b-2 border-emerald-300 pb-1 text-emerald-600">Results</span><span />
          <span className="col-span-2 border-b-2 border-zinc-300 pb-1">Fallout · mo</span>
        </div>
        <div className="grid gap-x-3 px-3 py-2 text-[11px] uppercase tracking-[0.15em] font-semibold text-zinc-500" style={GRID}>
          <span>{mode === 'rep' ? 'Rep' : 'Market'}</span>
          {COLS.map((c, i) => [<span key={c.key} className="text-right">{c.label}</span>, SEP_AFTER.has(i) ? <span key={`s${i}`} /> : null])}
        </div>
        {/* Team row */}
        <div className="grid items-center gap-x-3 px-3 py-2.5 bg-zinc-900 text-white" style={GRID}>
          <span className="text-lg font-extrabold pl-6">Team total</span>
          {COLS.map((c, i) => [
            <div key={c.key} className="text-right text-2xl font-extrabold tabular-nums">{c.money ? formatCompactCurrency(total(PAIRS, c.key)) : total(PAIRS, c.key)}{c.target ? <span className="text-xs text-zinc-400"> /{c.target * REPS.length}</span> : null}</div>,
            SEP_AFTER.has(i) ? <span key={`s${i}`} /> : null,
          ])}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          {sorted.map((g) => (
            <div key={g.id}>
              <Row label={g.label} dot={g.dot} pairs={g.pairs} scale={g.scale} count={g.count} targets={mode === 'rep'} open={open.has(g.id)} onToggle={() => toggle(g.id)} />
              {open.has(g.id) && g.children.map((c) => <Row key={c.id} sub label={c.label} dot={c.dot} pairs={c.pairs} scale={1} />)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
