// CONCEPT MOCKUP — manager pages (click-only, never on the TV). Sample numbers.
import { REPS, TEAM_TARGETS } from '../data/config.js';
import { formatCompactCurrency } from '../utils/format.js';
import { Card, deals, first, repById, sum, teamSum } from './shared.jsx';

// ---------- 5. REVENUE & FORECAST ----------
const RATES = { assigned: 0.9, dispo: 0.55, under_contract: 0.3 };
export function RevenueConceptView() {
  const goal = TEAM_TARGETS.revenuePerMonth;
  const closed = teamSum('revenueMonth');
  const all = deals();
  // Mockup: sample pipeline sized like a real month (the test data's deal list is inflated).
  const SAMPLE = { assigned: 24000, dispo: 40000, under_contract: 60000 };
  const stage = (s) => SAMPLE[s];
  const parts = [
    { label: 'Closed', amount: closed, rate: 1, color: '#047857' },
    { label: 'Assigned', amount: stage('assigned'), rate: RATES.assigned, color: '#10b981' },
    { label: 'DISPO Active', amount: stage('dispo'), rate: RATES.dispo, color: '#6ee7b7' },
    { label: 'Under Contract', amount: stage('under_contract'), rate: RATES.under_contract, color: '#bbf7d0' },
  ].map((p) => ({ ...p, expected: p.amount * p.rate }));
  const forecast = parts.reduce((a, p) => a + p.expected, 0);
  const scale = Math.max(goal, forecast) * 1.1;
  const reps = REPS.map((r) => {
    const mine = all.filter((d) => d.repId === r.id);
    const pipe = mine.filter((d) => d.stage !== 'closed').reduce((a, d) => a + d.value * (RATES[d.stage] || 0), 0) * 0.1;
    return { rep: r, closed: sum(r.id, 'revenueMonth'), pipe };
  }).sort((a, b) => b.closed + b.pipe - (a.closed + a.pipe));
  const maxR = Math.max(...reps.map((r) => r.closed + r.pipe), 1);
  return (
    <div className="h-full grid grid-cols-[1.3fr_1fr] gap-4 min-h-0">
      <Card kicker="Revenue · this month" title="Where we'll land" right={`goal ${formatCompactCurrency(goal)}`}>
        <div className="h-full flex flex-col justify-between gap-4">
          <div className="grid grid-cols-3 gap-4">
            {[['Closed so far', closed, 'text-zinc-900'], ['Forecast', forecast, 'text-emerald-700'], ['Gap to goal', Math.max(0, goal - forecast), forecast >= goal ? 'text-emerald-600' : 'text-amber-600']].map(([l, v, c]) => (
              <div key={l} className="rounded-xl bg-zinc-50 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-semibold">{l}</div>
                <div className={`text-5xl font-extrabold tabular-nums ${c}`}>{l === 'Gap to goal' && v === 0 ? 'Hit 🎉' : formatCompactCurrency(Math.round(v))}</div>
              </div>
            ))}
          </div>
          <div className="relative">
            <div className="flex h-16 rounded-xl overflow-hidden bg-zinc-100 gap-[2px]">
              {parts.map((p) => <div key={p.label} style={{ width: `${(p.expected / scale) * 100}%`, background: p.color }} />)}
            </div>
            <div className="absolute -top-2 -bottom-2 w-[3px] bg-zinc-900 rounded" style={{ left: `${(goal / scale) * 100}%` }} />
            <div className="absolute -bottom-7 text-xs font-bold -translate-x-1/2" style={{ left: `${(goal / scale) * 100}%` }}>goal</div>
          </div>
          <table className="w-full text-base mt-4">
            <thead><tr className="text-[11px] uppercase tracking-[0.15em] text-zinc-500"><th className="text-left pb-2">Stage</th><th className="text-right pb-2">In stage</th><th className="text-right pb-2">Usually closes</th><th className="text-right pb-2">Expected</th></tr></thead>
            <tbody>
              {parts.map((p) => (
                <tr key={p.label} className="border-t border-zinc-100">
                  <td className="py-2"><span className="inline-block w-3.5 h-3.5 rounded-sm mr-2 align-middle" style={{ background: p.color }} />{p.label}</td>
                  <td className="text-right tabular-nums">{formatCompactCurrency(p.amount)}</td>
                  <td className="text-right tabular-nums text-zinc-500">{Math.round(p.rate * 100)}%</td>
                  <td className="text-right tabular-nums font-bold">{formatCompactCurrency(Math.round(p.expected))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs text-zinc-500">Close rates learned from your own deal history once there's enough of it; until then, set by you.</div>
        </div>
      </Card>
      <Card kicker="By rep" title="Closed + expected" right="solid = closed · light = pipeline">
        <div className="h-full flex flex-col justify-around">
          {reps.map(({ rep, closed: c, pipe }) => (
            <div key={rep.id} className="grid grid-cols-[6rem_1fr_5rem] items-center gap-2">
              <span className="text-lg font-bold truncate">{first(rep)}</span>
              <div className="flex h-7 rounded-md bg-zinc-100 overflow-hidden gap-[2px]">
                <div style={{ width: `${(c / maxR) * 100}%`, background: rep.color }} />
                <div style={{ width: `${(pipe / maxR) * 100}%`, background: rep.color, opacity: 0.35 }} />
              </div>
              <span className="text-lg font-extrabold tabular-nums text-right">{formatCompactCurrency(Math.round(c + pipe))}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---------- 6. COACHING: conversion by rep + 8-week score trend ----------
const CONV = {
  anthony: [160, 38, 15, 6, 3], patrick: [140, 22, 12, 3, 1], daniel: [120, 31, 6, 2, 1], axel: [150, 28, 13, 5, 2],
  prince_pharrams: [110, 20, 9, 1, 0], sam_mackenzie: [130, 33, 11, 4, 2], spencer_brown: [125, 27, 10, 4, 2],
  cayden_sicz: [90, 15, 8, 3, 1], danni_brown: [145, 36, 14, 5, 2],
};
const TREND = {
  anthony: [72, 80, 77, 91, 85, 88, 94, 89], patrick: [60, 58, 66, 62, 70, 64, 59, 61], daniel: [70, 75, 68, 72, 80, 74, 77, 70],
  axel: [55, 63, 70, 74, 78, 83, 86, 90], prince_pharrams: [68, 64, 61, 57, 60, 52, 55, 49], sam_mackenzie: [77, 79, 81, 76, 84, 82, 80, 83],
  spencer_brown: [80, 84, 79, 88, 86, 90, 87, 85], cayden_sicz: [50, 57, 61, 59, 66, 70, 68, 74], danni_brown: [85, 88, 92, 90, 94, 91, 95, 93],
};
const STEPS = ['Convo → Opp', 'Opp → Offer', 'Offer → Contract', 'Contract → Close'];
const cell = (r, t) => {
  const rel = t ? r / t - 1 : 0;
  if (Math.abs(rel) < 0.15) return { background: '#f4f4f5', color: '#3f3f46' };
  const strong = Math.abs(rel) >= 0.4;
  return rel > 0 ? { background: strong ? '#2a78d6' : '#bfdbfe', color: strong ? '#fff' : '#1e3a8a' } : { background: strong ? '#eb6834' : '#fed7aa', color: strong ? '#fff' : '#7c2d12' };
};
function Spark({ values, color }) {
  const w = 160; const h = 36; const max = 100; const min = 40;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / (max - min)) * h}`).join(' ');
  return (
    <svg width={w} height={h} className="overflow-visible">
      <line x1="0" x2={w} y1={h - ((90 - min) / (max - min)) * h} y2={h - ((90 - min) / (max - min)) * h} stroke="#d4d4d8" strokeDasharray="3 3" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx={w} cy={h - ((values.at(-1) - min) / (max - min)) * h} r="4" fill={color} />
    </svg>
  );
}
export function CoachingView() {
  const ids = Object.keys(CONV);
  const tot = [0, 1, 2, 3, 4].map((i) => ids.reduce((a, id) => a + CONV[id][i], 0));
  const rate = (n, i) => (n[i] ? n[i + 1] / n[i] : 0);
  const team = STEPS.map((_, i) => rate(tot, i));
  const biggestLeak = (n) => {
    const gaps = STEPS.map((s, i) => ({ s, gap: rate(n, i) / (team[i] || 1) }));
    const worst = gaps.sort((a, b) => a.gap - b.gap)[0];
    return worst.gap < 0.85 ? worst.s : '—';
  };
  return (
    <Card className="h-full" kicker="Manager only · this month" title="Coaching: where each rep's funnel leaks" right="cells vs team rate · blue better, orange worse">
      <div className="h-full flex flex-col min-h-0">
        <div className="grid grid-cols-[7rem_repeat(4,1fr)_11rem_12rem] gap-2 text-[11px] uppercase tracking-[0.12em] text-zinc-500 font-semibold pb-2 border-b border-zinc-200 items-end">
          <span>Rep</span>{STEPS.map((s) => <span key={s} className="text-center">{s}</span>)}<span>Biggest leak</span><span>Weekly score · 8 wks</span>
        </div>
        <div className="flex-1 flex flex-col justify-around min-h-0">
          <div className="grid grid-cols-[7rem_repeat(4,1fr)_11rem_12rem] gap-2 items-center">
            <span className="text-lg font-extrabold">Team</span>
            {team.map((r, i) => <span key={i} className="rounded-lg py-3 text-center text-2xl font-extrabold bg-zinc-900 text-white tabular-nums">{Math.round(r * 100)}%</span>)}
            <span /><span />
          </div>
          {ids.map((id) => {
            const rep = repById(id); const n = CONV[id];
            return (
              <div key={id} className="grid grid-cols-[7rem_repeat(4,1fr)_11rem_12rem] gap-2 items-center">
                <span className="flex items-center gap-2 text-lg font-bold truncate"><span className="w-3 h-3 rounded-full shrink-0" style={{ background: rep.color }} />{first(rep)}</span>
                {STEPS.map((_, i) => <span key={i} className="rounded-lg py-3 text-center text-2xl font-bold tabular-nums" style={cell(rate(n, i), team[i])}>{Math.round(rate(n, i) * 100)}%</span>)}
                <span className="text-sm font-semibold text-zinc-700">{biggestLeak(n)}</span>
                <span className="flex items-center gap-2"><Spark values={TREND[id]} color={rep.color} /><b className="tabular-nums">{TREND[id].at(-1)}</b></span>
              </div>
            );
          })}
        </div>
        <div className="text-xs text-zinc-500 pt-2 border-t border-zinc-200">Rates are this month's counts divided stage to stage (not the same deals followed through). Dashed line on each trend = 90 (STRONG on the scorecard).</div>
      </div>
    </Card>
  );
}
