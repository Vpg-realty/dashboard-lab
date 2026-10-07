import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import Panel from '../components/Panel.jsx';
import { REPS } from '../data/config.js';
import { formatCompactCurrency } from '../utils/format.js';

// MOCKUP ONLY — sample numbers. Four ideas from the dashboard review.

// 1. Conversations: this week vs last week, by day (team total).
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const LAST = [62, 71, 58, 66, 54, 18, 9];
const THIS = [70, 78, 61, null, null, null, null]; // Wednesday afternoon
const trend = DAYS.map((d, i) => ({ day: d, last: LAST[i], this: THIS[i] }));
const thisSoFar = THIS.filter((v) => v != null).reduce((a, b) => a + b, 0);
const lastSamePoint = LAST.slice(0, 3).reduce((a, b) => a + b, 0);

// 2. Week-over-week tiles: this week so far vs last week at the same point.
const WOW = [
  { label: 'Conversations', now: thisSoFar, prev: lastSamePoint, weeks: [212, 248, 230, 265, 241, 270, 255, 209] },
  { label: 'Opps opened', now: 34, prev: 29, weeks: [61, 70, 66, 74, 58, 81, 77, 34] },
  { label: 'Offers', now: 10, prev: 14, weeks: [24, 31, 22, 28, 35, 30, 27, 10] },
  { label: 'Contracts', now: 4, prev: 3, weeks: [6, 9, 5, 8, 7, 10, 9, 4] },
];

// 3. Revenue forecast: closed + open pipeline weighted by how often each
//    stage has historically closed.
const GOAL = 225000;
const FORECAST = [
  { key: 'closed', label: 'Closed', amount: 96000, rate: 1, color: '#047857' },
  { key: 'assigned', label: 'Assigned', amount: 58000, rate: 0.9, color: '#10b981' },
  { key: 'dispo', label: 'DISPO Active', amount: 84000, rate: 0.55, color: '#6ee7b7' },
  { key: 'uc', label: 'Under Contract', amount: 120000, rate: 0.3, color: '#bbf7d0' },
];

// 4. Conversion by rep (this month).
const CONV = [
  ['anthony', 160, 38, 15, 6, 3], ['patrick', 140, 22, 12, 3, 1], ['daniel', 120, 31, 6, 2, 1],
  ['axel', 150, 28, 13, 5, 2], ['prince_pharrams', 110, 20, 9, 1, 0], ['sam_mackenzie', 130, 33, 11, 4, 2],
  ['spencer_brown', 125, 27, 10, 4, 2], ['cayden_sicz', 90, 15, 8, 3, 1], ['danni_brown', 145, 36, 14, 5, 2],
];
const STEPS = ['Convo → Opp', 'Opp → Offer', 'Offer → Contract', 'Contract → Close'];

export default function IdeasView() {
  return (
    <div className="grid grid-cols-2 grid-rows-[auto_1fr] gap-4 h-full min-h-0">
      <WowRow />
      <div className="col-span-2 grid grid-cols-3 gap-4 min-h-0">
        <TrendPanel />
        <ForecastPanel />
        <ConversionPanel />
      </div>
    </div>
  );
}

function Delta({ now, prev }) {
  const d = now - prev;
  const pct = prev > 0 ? Math.round((d / prev) * 100) : 0;
  const up = d >= 0;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-bold ${up ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
      {up ? '▲' : '▼'} {Math.abs(d)} ({up ? '+' : '−'}{Math.abs(pct)}%)
    </span>
  );
}

function WowRow() {
  return (
    <div className="col-span-2 grid grid-cols-4 gap-4">
      {WOW.map((t) => {
        const max = Math.max(...t.weeks);
        return (
          <div key={t.label} className="rounded-xl border border-zinc-300/80 bg-white p-4">
            <div className="flex items-start justify-between">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-600">{t.label} · this week</div>
              <Delta now={t.now} prev={t.prev} />
            </div>
            <div className="flex items-end justify-between mt-2 gap-4">
              <div>
                <div className="text-5xl font-bold tabular-nums text-zinc-900">{t.now}</div>
                <div className="text-xs text-zinc-500 mt-1">vs <b className="text-zinc-700">{t.prev}</b> at this point last week</div>
              </div>
              {/* last 8 weeks, this week (so far) darkest */}
              <div className="flex items-end gap-[3px] h-12" title="Last 8 weeks">
                {t.weeks.map((v, i) => (
                  <div key={i} className="w-3 rounded-t-[3px]" style={{ height: `${(v / max) * 100}%`, background: i === t.weeks.length - 1 ? '#2a78d6' : '#cbd5e1' }} />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TrendPanel() {
  const pct = Math.round(((thisSoFar - lastSamePoint) / lastSamePoint) * 100);
  return (
    <Panel className="min-h-0 flex flex-col" accent="Conversations · 7-day" title="This week vs last week" subtitle={`${thisSoFar} vs ${lastSamePoint} by Wed · ${pct >= 0 ? '+' : ''}${pct}%`}>
      <div className="h-full flex flex-col min-h-0">
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 16, right: 16, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="#71717a" tick={{ fontSize: 14 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#71717a" tick={{ fontSize: 13 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <ReferenceLine x="Wed" stroke="#a1a1aa" strokeDasharray="2 4" label={{ value: 'today', position: 'top', fill: '#71717a', fontSize: 12 }} />
              <Line dataKey="last" name="Last week" stroke="#a1a1aa" strokeWidth={2} strokeDasharray="6 5" dot={{ r: 4, fill: '#a1a1aa', strokeWidth: 0 }} />
              <Line dataKey="this" name="This week" stroke="#2a78d6" strokeWidth={3} dot={{ r: 5, fill: '#2a78d6', strokeWidth: 0 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-5 text-xs text-zinc-600 pt-2">
          <span className="inline-flex items-center gap-1.5"><span className="w-5 h-[3px] bg-[#2a78d6] rounded" /> This week</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-5 border-t-2 border-dashed border-zinc-400" /> Last week</span>
          <span className="text-zinc-400">team total per day · replaces the 10-line chart</span>
        </div>
      </div>
    </Panel>
  );
}

function ForecastPanel() {
  const parts = FORECAST.map((f) => ({ ...f, expected: f.amount * f.rate }));
  const forecast = parts.reduce((a, p) => a + p.expected, 0);
  const scale = Math.max(GOAL, forecast) * 1.08;
  return (
    <Panel className="min-h-0 flex flex-col" accent="Revenue · this month" title="Month-end forecast" subtitle={`goal ${formatCompactCurrency(GOAL)}`}>
      <div className="h-full flex flex-col justify-between min-h-0 gap-3">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Expected by month-end</div>
            <div className="text-5xl font-extrabold tabular-nums text-emerald-700">{formatCompactCurrency(Math.round(forecast))}</div>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-bold ${forecast >= GOAL ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
            {Math.round((forecast / GOAL) * 100)}% of goal
          </span>
        </div>
        <div className="relative">
          <div className="flex h-12 rounded-lg overflow-hidden bg-zinc-100 gap-[2px]">
            {parts.map((p) => (
              <div key={p.key} style={{ width: `${(p.expected / scale) * 100}%`, background: p.color }} title={`${p.label}: ${formatCompactCurrency(p.expected)}`} />
            ))}
          </div>
          <div className="absolute -top-2 -bottom-2 w-[3px] bg-zinc-900 rounded" style={{ left: `${(GOAL / scale) * 100}%` }} />
          <div className="absolute -bottom-6 text-[11px] font-bold text-zinc-700 -translate-x-1/2" style={{ left: `${(GOAL / scale) * 100}%` }}>goal</div>
        </div>
        <table className="w-full text-sm mt-3">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.15em] text-zinc-500">
              <th className="text-left font-semibold pb-1">Stage</th>
              <th className="text-right font-semibold pb-1">In stage</th>
              <th className="text-right font-semibold pb-1">Usually closes</th>
              <th className="text-right font-semibold pb-1">Expected</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p) => (
              <tr key={p.key} className="border-t border-zinc-100">
                <td className="py-1.5"><span className="inline-block w-3 h-3 rounded-sm mr-2 align-middle" style={{ background: p.color }} />{p.label}</td>
                <td className="text-right tabular-nums">{formatCompactCurrency(p.amount)}</td>
                <td className="text-right tabular-nums text-zinc-500">{Math.round(p.rate * 100)}%</td>
                <td className="text-right tabular-nums font-bold">{formatCompactCurrency(Math.round(p.expected))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-[11px] text-zinc-500">“Usually closes” would come from your own history: the share of deals in each stage that went on to close.</div>
      </div>
    </Panel>
  );
}

// Diverging shading vs the team rate: blue = better than team, orange =
// worse, grey = about the same (within ±15% of the team rate).
function cellStyle(rate, team) {
  if (team === 0) return { background: '#f4f4f5' };
  const rel = rate / team - 1;
  if (Math.abs(rel) < 0.15) return { background: '#f4f4f5', color: '#3f3f46' };
  const strong = Math.abs(rel) >= 0.4;
  return rel > 0
    ? { background: strong ? '#2a78d6' : '#bfdbfe', color: strong ? '#fff' : '#1e3a8a' }
    : { background: strong ? '#eb6834' : '#fed7aa', color: strong ? '#fff' : '#7c2d12' };
}

function ConversionPanel() {
  const rows = CONV.map(([id, ...n]) => ({ rep: REPS.find((r) => r.id === id), n }));
  const tot = [0, 1, 2, 3, 4].map((i) => rows.reduce((a, r) => a + r.n[i], 0));
  const rate = (n, i) => (n[i] > 0 ? n[i + 1] / n[i] : 0);
  const teamRates = STEPS.map((_, i) => rate(tot, i));
  return (
    <Panel className="min-h-0 flex flex-col" accent="Conversion · this month" title="Where each rep's funnel leaks" subtitle="vs team rate">
      <div className="h-full flex flex-col min-h-0">
        <div className="grid grid-cols-[5.5rem_repeat(4,1fr)] gap-1 text-center flex-1 min-h-0 content-between">
          <span />
          {STEPS.map((s) => <span key={s} className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 leading-tight self-end">{s}</span>)}
          <span className="text-left text-sm font-extrabold text-zinc-900 self-center">Team</span>
          {teamRates.map((r, i) => <span key={i} className="rounded-md py-1.5 text-base font-extrabold tabular-nums bg-zinc-900 text-white">{Math.round(r * 100)}%</span>)}
          {rows.map(({ rep, n }) => [
            <span key={rep.id} className="text-left text-sm font-bold text-zinc-800 truncate self-center">{rep.name.split(' ')[0]}</span>,
            ...STEPS.map((_, i) => {
              const r = rate(n, i);
              return <span key={`${rep.id}${i}`} className="rounded-md py-1.5 text-base font-bold tabular-nums" style={cellStyle(r, teamRates[i])}>{Math.round(r * 100)}%</span>;
            }),
          ])}
        </div>
        <div className="flex items-center justify-center gap-3 text-[11px] text-zinc-600 pt-2">
          <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#2a78d6]" /> well above team</span>
          <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#bfdbfe]" /> above</span>
          <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-zinc-100 border border-zinc-200" /> about team</span>
          <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#fed7aa]" /> below</span>
          <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#eb6834]" /> well below</span>
        </div>
      </div>
    </Panel>
  );
}
