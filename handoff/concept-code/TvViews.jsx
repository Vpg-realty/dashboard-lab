// CONCEPT MOCKUP — the four TV screens. Sample numbers.
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
import { REPS, KPI_TARGETS, TEAM_TARGETS, MARKETS } from '../data/config.js';
import { PAIRS, tierTotals } from '../data/source.js';
import { formatCompactCurrency, formatNumber } from '../utils/format.js';
import { laToday, daysInclusive, shortDate } from '../utils/historyRange.js';
import { Card, Delta, PODS, deals, first, paceTone, repById, scoreTone, sum, teamSum, weeklyScore } from './shared.jsx';

// ---------- 1. TODAY: the scoreboard ----------
const LAST_WEEK_SAME_POINT = { convosToday: 118, opps: 69, offers: 26, contracts: 15, revenue: 152000 };

function BigTile({ label, value, target, period, prev, money, sub }) {
  const t = target != null ? paceTone(value, target, period) : null;
  const pct = target ? Math.min(100, (value / target) * 100) : 0;
  const fmt = (v) => (money ? formatCompactCurrency(v) : formatNumber(v));
  return (
    <div className="rounded-2xl bg-white border border-zinc-200 shadow-sm p-5 flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-semibold truncate">{label}</div>
        {t && <span className={`text-[11px] font-extrabold tracking-wider px-2 py-0.5 rounded-full shrink-0 ${t.cls}`}>{t.label}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`${money ? 'text-[2.75rem]' : 'text-6xl'} font-extrabold tabular-nums text-zinc-900 leading-none`}>{fmt(value)}</span>
        {target != null && <span className="text-xl font-bold text-zinc-400 tabular-nums whitespace-nowrap">/ {fmt(target)}</span>}
      </div>
      {target != null && (
        <div className="relative h-2.5 rounded-full bg-zinc-100">
          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, background: t.bar }} />
          <div className="absolute -top-1 -bottom-1 w-[3px] rounded bg-zinc-900" style={{ left: `${Math.min(100, (t.want / target) * 100)}%` }} />
        </div>
      )}
      <div className={`flex ${money ? 'flex-col items-start gap-0.5' : 'items-center justify-between gap-2'} text-sm`}>
        <Delta now={value} prev={prev} money={money} />
        {sub && <span className="text-zinc-500 truncate font-semibold">{sub}</span>}
      </div>
    </div>
  );
}

const WINS = [
  { icon: '🎉', what: 'Closed', rep: 'anthony', addr: '4185 W Palm Ridge Dr', when: '12 min ago', value: 41000 },
  { icon: '🚀', what: 'To DISPO', rep: 'daniel', addr: '6897 Cedar Bluff Ave', when: '48 min ago' },
  { icon: '✍️', what: 'Under contract', rep: 'spencer_brown', addr: '9831 Harbor View Ct', when: '1 hr ago' },
  { icon: '🚀', what: 'To DISPO', rep: 'danni_brown', addr: '2210 Mesa Verde Ln', when: '3 hr ago' },
  { icon: '✍️', what: 'Under contract', rep: 'axel', addr: '7710 Quail Run Rd', when: 'yesterday' },
];

export function TodayView() {
  const today = laToday();
  const daysOut = (d) => (d ? daysInclusive(today, d) - 1 : null);
  const open = deals().filter((d) => d.stage !== 'closed');
  const attention = [
    ...open.filter((d) => daysOut(d.ipEnd) === 0).map((d) => ({ tone: 'red', tag: 'IP ENDS TODAY', d })),
    ...open.filter((d) => d.stage === 'dispo' && [1, 2].includes(daysOut(d.ipEnd))).map((d) => ({ tone: 'red', tag: `DISPO · IP IN ${daysOut(d.ipEnd)}D`, d })),
    ...open.filter((d) => [0, 1].includes(daysOut(d.coe))).map((d) => ({ tone: 'amber', tag: daysOut(d.coe) === 0 ? 'CLOSING TODAY' : 'CLOSING TOMORROW', d })),
    ...open.filter((d) => daysOut(d.ipEnd) === 1 && d.stage !== 'dispo').map((d) => ({ tone: 'amber', tag: 'IP ENDS TOMORROW', d })),
  ].slice(0, 7);
  const quiet = REPS.filter((r) => sum(r.id, 'convosToday') === 0);
  const revenue = teamSum('revenueMonth');
  return (
    <div className="h-full grid grid-rows-[auto_1fr] gap-4 min-h-0">
      <div className="grid grid-cols-5 gap-4">
        <BigTile label="Conversations today" value={teamSum('convosToday')} prev={LAST_WEEK_SAME_POINT.convosToday} sub={`${teamSum('convosWeek')} this week`} />
        <BigTile label="Opps opened · week" value={teamSum('oppsOpenedWeek')} target={TEAM_TARGETS.oppsOpenedPerWeek} period="week" prev={LAST_WEEK_SAME_POINT.opps} />
        <BigTile label="Offers · week" value={teamSum('offersWeek')} target={TEAM_TARGETS.offersPerWeek} period="week" prev={LAST_WEEK_SAME_POINT.offers} />
        <BigTile label="Contracts · month" value={teamSum('contractsMonth')} target={TEAM_TARGETS.contractsPerMonth} period="month" prev={LAST_WEEK_SAME_POINT.contracts} />
        <BigTile label="Revenue · month" value={revenue} target={TEAM_TARGETS.revenuePerMonth} period="month" prev={LAST_WEEK_SAME_POINT.revenue} money sub="Forecast $238.6K · on track to hit goal" />
      </div>
      <div className="grid grid-cols-[1.6fr_1fr] gap-4 min-h-0">
        <Card kicker="Do these first" title="Needs attention today" right={quiet.length ? <span className="font-bold text-zinc-700">No convos yet: {quiet.map(first).join(', ')}</span> : null}>
          <div className="h-full flex flex-col gap-2 overflow-hidden">
            {attention.map(({ tone, tag, d }, i) => {
              const rep = repById(d.repId);
              return (
                <div key={i} className={`flex items-center gap-4 rounded-xl px-4 py-2.5 border-l-[6px] ${tone === 'red' ? 'bg-rose-50 border-rose-500' : 'bg-amber-50 border-amber-400'}`}>
                  <span className={`text-xs font-extrabold tracking-wider w-44 shrink-0 ${tone === 'red' ? 'text-rose-700' : 'text-amber-800'}`}>{tag}</span>
                  <span className="text-lg font-bold text-zinc-900 truncate flex-1">{(d.address || '').split(',')[0]}</span>
                  <span className="inline-flex items-center gap-2 text-base font-semibold text-zinc-700 shrink-0">
                    <span className="w-3 h-3 rounded-full" style={{ background: rep?.color }} />{rep ? first(rep) : ''}
                  </span>
                  <span className="text-sm text-zinc-500 w-36 text-right shrink-0">{d.stage === 'dispo' ? 'DISPO Active' : d.stage === 'assigned' ? 'Assigned' : 'Under Contract'}</span>
                </div>
              );
            })}
          </div>
        </Card>
        <Card kicker="Momentum" title="Latest wins">
          <div className="h-full flex flex-col gap-2 overflow-hidden">
            {WINS.map((w, i) => {
              const rep = repById(w.rep);
              return (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-2.5">
                  <span className="text-3xl">{w.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-bold text-zinc-900 truncate"><span style={{ color: rep?.color }}>{first(rep)}</span> · {w.what}</div>
                    <div className="text-sm text-zinc-500 truncate">{w.addr} · {w.when}</div>
                  </div>
                  {w.value && <span className="text-xl font-extrabold text-emerald-600 tabular-nums">{formatCompactCurrency(w.value)}</span>}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------- 2. LEADERBOARD: weekly score, same weights as the scorecard ----------
const MOVEMENT = { anthony: 2, patrick: -1, daniel: 0, axel: 3, prince_pharrams: -2, sam_mackenzie: 1, spencer_brown: -1, cayden_sicz: 0, danni_brown: 1 };

export function LeaderboardView() {
  const rows = REPS.map((r) => ({ rep: r, ...weeklyScore(r.id) })).sort((a, b) => b.score - a.score);
  const podScore = (pod) => Math.round(pod.reps.reduce((a, id) => a + weeklyScore(id).score, 0) / pod.reps.length);
  return (
    <div className="h-full grid grid-cols-[1fr_22rem] gap-4 min-h-0">
      <Card kicker="This week · same scoring as the Friday scorecard" title="Leaderboard" right="contracts 35 · projected $ 15 · offers 15 · opps 10">
        <div className="h-full flex flex-col min-h-0">
          <div className="grid grid-cols-[3rem_10rem_1fr_5.5rem_5.5rem_5.5rem_7rem_4rem] gap-3 text-[11px] uppercase tracking-[0.15em] text-zinc-500 font-semibold pb-2 border-b border-zinc-200">
            <span>#</span><span>Rep</span><span>Score</span><span className="text-right">Contracts</span><span className="text-right">Offers</span><span className="text-right">Opps</span><span className="text-right">Projected</span><span className="text-right">Move</span>
          </div>
          <div className="flex-1 flex flex-col justify-around min-h-0">
            {rows.map((r, i) => {
              const tone = scoreTone(r.score);
              const mv = MOVEMENT[r.rep.id] || 0;
              return (
                <div key={r.rep.id} className={`grid grid-cols-[3rem_10rem_1fr_5.5rem_5.5rem_5.5rem_7rem_4rem] gap-3 items-center rounded-xl px-1 ${i < 3 ? 'bg-amber-50/60' : ''}`}>
                  <span className="text-3xl font-extrabold text-zinc-300 tabular-nums">{i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span>
                  <span className="flex items-center gap-2 min-w-0"><span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: r.rep.color }} /><span className="text-2xl font-bold text-zinc-900 truncate">{first(r.rep)}</span></span>
                  <div className="flex items-center gap-3">
                    <div className="relative h-7 flex-1 rounded-lg bg-zinc-100 overflow-hidden">
                      <div className="absolute inset-y-0 left-0 rounded-lg" style={{ width: `${r.score}%`, background: r.rep.color }} />
                      <div className="absolute inset-y-0 border-l-2 border-dashed border-zinc-500" style={{ left: '90%' }} />
                    </div>
                    <span className="text-3xl font-extrabold tabular-nums w-14 text-right" style={{ color: tone.c }}>{r.score}</span>
                  </div>
                  <span className="text-2xl font-bold tabular-nums text-right">{r.contracts}</span>
                  <span className="text-2xl font-bold tabular-nums text-right">{r.offers}</span>
                  <span className="text-2xl font-bold tabular-nums text-right">{r.opps}</span>
                  <span className="text-xl font-bold tabular-nums text-right text-emerald-700">{formatCompactCurrency(r.projected)}</span>
                  <span className={`text-lg font-bold text-right ${mv > 0 ? 'text-emerald-600' : mv < 0 ? 'text-rose-600' : 'text-zinc-400'}`}>{mv > 0 ? `▲${mv}` : mv < 0 ? `▼${-mv}` : '–'}</span>
                </div>
              );
            })}
          </div>
          <div className="text-xs text-zinc-500 pt-2 border-t border-zinc-200">┆ dashed line = 90 (STRONG) · no contract this week caps the score at 89 · CRM checklist is scored on the sheet, not here</div>
        </div>
      </Card>
      <div className="flex flex-col gap-4 min-h-0">
        {PODS.map((pod) => {
          const s = podScore(pod);
          const tone = scoreTone(s);
          const lead = repById(pod.lead);
          return (
            <Card key={pod.name} kicker="Pod battle" title={pod.name} right={`lead: ${first(lead)}`} className="flex-1">
              <div className="h-full flex flex-col justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-7xl font-extrabold tabular-nums" style={{ color: tone.c }}>{s}</span>
                  <span className="text-sm font-bold tracking-wider" style={{ color: tone.c }}>{tone.label}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {pod.reps.map((id) => {
                    const rep = repById(id);
                    const sc = weeklyScore(id).score;
                    return (
                      <div key={id} className="flex items-center gap-2">
                        <span className="w-20 text-sm font-semibold truncate">{first(rep)}</span>
                        <div className="flex-1 h-3 rounded bg-zinc-100"><div className="h-full rounded" style={{ width: `${sc}%`, background: rep.color }} /></div>
                        <span className="w-8 text-right text-sm font-bold tabular-nums">{sc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ---------- 3. ACTIVITY: conversations + agents ----------
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const LAST = [62, 71, 58, 66, 54, 18, 9];
const THIS = [70, 78, 61, null, null, null, null];

export function ActivityView() {
  const reps = REPS.map((r) => ({ rep: r, today: sum(r.id, 'convosToday'), week: sum(r.id, 'convosWeek') })).sort((a, b) => b.today - a.today || b.week - a.week);
  const maxT = Math.max(1, ...reps.map((r) => r.today));
  const tiers = tierTotals();
  const active = tiers.filter((t) => t.tier !== 4).reduce((a, t) => a + t.value, 0);
  const states = [...MARKETS].map((m) => ({ m, today: PAIRS.filter((p) => p.marketId === m.id).reduce((a, p) => a + (p.convosToday || 0), 0) })).sort((a, b) => b.today - a.today).slice(0, 10);
  return (
    <div className="h-full grid grid-cols-3 grid-rows-[1fr_auto] gap-4 min-h-0">
      <Card kicker="Conversations" title="Today by rep" right={`${teamSum('convosToday')} total`}>
        <div className="h-full flex flex-col justify-around">
          {reps.map(({ rep, today, week }) => (
            <div key={rep.id} className="grid grid-cols-[6rem_1fr_3rem] items-center gap-2">
              <span className="text-lg font-bold truncate">{first(rep)}</span>
              <div className="h-7 rounded-md bg-zinc-100"><div className="h-full rounded-md" style={{ width: `${(today / maxT) * 100}%`, background: rep.color }} /></div>
              <span className="text-2xl font-extrabold tabular-nums text-right">{today}</span>
              <span />
              <span className="text-xs text-zinc-500 -mt-1">{week} this week</span>
            </div>
          ))}
        </div>
      </Card>
      <Card kicker="Conversations" title="This week vs last week" right={<Delta now={209} prev={191} />}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={DAYS.map((d, i) => ({ d, last: LAST[i], now: THIS[i] }))} margin={{ top: 16, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="d" stroke="#71717a" tick={{ fontSize: 14 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#71717a" tick={{ fontSize: 13 }} axisLine={false} tickLine={false} />
            <ReferenceLine x="Wed" stroke="#a1a1aa" strokeDasharray="2 4" label={{ value: 'today', position: 'top', fill: '#71717a', fontSize: 12 }} />
            <Line dataKey="last" stroke="#a1a1aa" strokeWidth={2} strokeDasharray="6 5" dot={{ r: 4, fill: '#a1a1aa', strokeWidth: 0 }} isAnimationActive={false} />
            <Line dataKey="now" stroke="#2a78d6" strokeWidth={3} dot={{ r: 5, fill: '#2a78d6', strokeWidth: 0 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <Card kicker="Agents" title="Active agent count" right={<Delta now={33} prev={27} />}>
        <div className="h-full flex flex-col justify-center gap-6">
          <div className="flex items-baseline gap-3">
            <span className="text-7xl font-extrabold tabular-nums">{formatNumber(active)}</span>
            <span className="text-lg text-zinc-500">T1+T2+T3</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">+{teamSum('agentsAddedWeek') || 33} added this week</div>
          <div className="flex flex-col gap-3">
            {tiers.map((t) => (
              <div key={t.tier} className="grid grid-cols-[9rem_1fr_4rem] items-center gap-2">
                <span className="text-sm font-semibold">{t.label}</span>
                <div className="h-4 rounded bg-zinc-100"><div className="h-full rounded" style={{ width: `${(t.value / Math.max(...tiers.map((x) => x.value), 1)) * 100}%`, background: t.color }} /></div>
                <span className="text-right font-bold tabular-nums">{formatNumber(t.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
      <div className="col-span-3 grid grid-cols-10 gap-2">
        {states.map(({ m, today }) => (
          <div key={m.id} className="rounded-xl bg-white border border-zinc-200 px-3 py-2 flex items-center justify-between">
            <span className="text-sm font-bold text-zinc-700">{m.id}</span>
            <span className="text-2xl font-extrabold tabular-nums">{today}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- 4. PIPELINE: stage totals + 7-day deadline calendar ----------
const STAGES = [
  { stage: 'under_contract', label: 'Under Contract', color: '#2563eb' },
  { stage: 'dispo', label: 'DISPO Active', color: '#d97706' },
  { stage: 'assigned', label: 'Assigned', color: '#7c3aed' },
  { stage: 'closed', label: 'Closed · month', color: '#059669' },
];

export function PipelineConceptView() {
  const all = deals();
  const today = laToday();
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(`${today}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
  const dayLabel = (s, i) => (i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(`${s}T12:00:00Z`).getUTCDay()]} ${shortDate(s)}`);
  return (
    <div className="h-full grid grid-rows-[auto_1fr] gap-4 min-h-0">
      <div className="grid grid-cols-4 gap-4">
        {STAGES.map((s) => {
          const list = all.filter((d) => d.stage === s.stage);
          const val = list.reduce((a, d) => a + d.value, 0);
          return (
            <div key={s.stage} className="rounded-2xl bg-white border border-zinc-200 shadow-sm p-5" style={{ borderTop: `6px solid ${s.color}` }}>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-semibold">{s.label}</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-6xl font-extrabold tabular-nums" style={{ color: s.color }}>{list.length}</span>
                <span className="text-2xl font-bold text-emerald-700 tabular-nums">{val ? formatCompactCurrency(val) : '—'}</span>
              </div>
              <div className="text-sm text-zinc-500 mt-1">{s.stage === 'dispo' ? 'avg 6 days in DISPO · oldest 14' : s.stage === 'under_contract' ? 'avg 4 days to DISPO' : s.stage === 'assigned' ? 'avg 9 days to close' : 'this month'}</div>
            </div>
          );
        })}
      </div>
      <Card kicker="Next 7 days" title="Deadline calendar" right="■ IP ends   ■ COE / closing">
        <div className="h-full grid grid-cols-7 gap-3 min-h-0">
          {days.map((day, i) => {
            const items = all.flatMap((d) => [d.ipEnd === day && { d, kind: 'ip' }, d.coe === day && { d, kind: 'coe' }].filter(Boolean));
            return (
              <div key={day} className={`rounded-xl p-2.5 flex flex-col gap-2 min-h-0 overflow-hidden ${i === 0 ? 'bg-rose-50 ring-2 ring-rose-300' : 'bg-zinc-50'}`}>
                <div className={`text-sm font-extrabold uppercase tracking-wider ${i === 0 ? 'text-rose-700' : 'text-zinc-600'}`}>{dayLabel(day, i)}</div>
                {items.length === 0 && <div className="text-sm text-zinc-400">—</div>}
                {items.map(({ d, kind }, j) => {
                  const rep = repById(d.repId);
                  return (
                    <div key={j} className={`rounded-lg px-2.5 py-2 text-white ${kind === 'ip' ? 'bg-violet-600' : 'bg-emerald-600'}`}>
                      <div className="text-[11px] font-bold uppercase tracking-wider opacity-90">{kind === 'ip' ? 'IP ends' : 'Closing'}</div>
                      <div className="text-sm font-bold leading-tight truncate">{(d.address || '').split(',')[0]}</div>
                      <div className="text-xs opacity-90 truncate">{rep ? first(rep) : ''}{d.value ? ` · ${formatCompactCurrency(d.value)}` : ''}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
