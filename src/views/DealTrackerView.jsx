// Deal Tracker (lab): every open deal on one screen, one row each, grouped
// by stage in the order deals flow (Under Contract → DISPO → Assigned).
// Per row: address, rep, days in stage, value, IP end and COE countdowns
// (Luke's Pipeline colours, utils/deals.js), a six-week timeline (one week
// back, five ahead) and the single most urgent thing to do about the deal.
// Within a stage, deals needing action come first, then by next deadline.
// Data: `pair.deals` (server/deals.js); closed deals only show in the footer.
import { REPS } from '../data/config.js';
import { PAIRS } from '../data/source.js';
import { formatCompactCurrency } from '../utils/format.js';
import { laToday, addDays, shortDate } from '../utils/historyRange.js';
import { deadlineTone, daysFrom } from '../utils/deals.js';

const STAGES = [
  { stage: 'under_contract', label: 'Under Contract', color: '#2563eb' },
  { stage: 'dispo', label: 'DISPO Active', color: '#d97706' },
  { stage: 'assigned', label: 'Assigned', color: '#7c3aed' },
];
const BACK = 7;   // timeline days shown before today
const AHEAD = 35; // and after
const SPAN = BACK + AHEAD;
const STALE_DAYS = 30; // days in one stage before a deal is called stuck
const DAY_MS = 86_400_000;

const short = (addr) => (addr || 'No address').split(',')[0].trim();
const first = (rep) => (rep ? rep.name.split(' ')[0] : '—');
const daysSince = (ms) => (ms ? Math.floor((Date.now() - ms) / DAY_MS) : null);
const pos = (days) => (Math.min(SPAN, Math.max(0, days + BACK)) / SPAN) * 100;

// The one thing to do about a deal, most urgent first. null = on track.
function action(d) {
  const open = d.stage !== 'assigned';
  if (d.coeDays != null && d.coeDays < 0) return { tone: 'red', text: `COE passed ${shortDate(d.coe)}: close or update` };
  if (open && d.ipDays != null && d.ipDays >= 0 && d.ipDays <= 2) {
    const when = d.ipDays === 0 ? 'today' : d.ipDays === 1 ? 'tomorrow' : 'in 2 days';
    return { tone: 'red', text: d.stage === 'dispo' ? `IP ends ${when}, no buyer yet` : `IP ends ${when}, not in DISPO yet` };
  }
  if (d.coeDays != null && d.coeDays <= 2) return { tone: 'amber', text: `Closing ${d.coeDays === 0 ? 'today' : d.coeDays === 1 ? 'tomorrow' : 'in 2 days'}` };
  if (open && d.ipDays != null && d.ipDays < 0) return { tone: 'amber', text: `Past IP (${shortDate(d.ipEnd)}), still ${d.stage === 'dispo' ? 'in DISPO' : 'under contract'}` };
  if (d.age != null && d.age >= STALE_DAYS) return { tone: 'amber', text: `${d.age} days in ${d.stage === 'dispo' ? 'DISPO' : 'this stage'}` };
  if (!d.coe || (open && !d.ipEnd)) return { tone: 'grey', text: `No ${!d.coe && open && !d.ipEnd ? 'IP end or COE' : !d.coe ? 'COE' : 'IP end'} date in GHL` };
  return null;
}
const RANK = { red: 0, amber: 1, grey: 2 };

function DateChip({ date, days, coe }) {
  if (!date) return <span className="text-zinc-300 text-center">—</span>;
  const t = deadlineTone(days);
  const late = days < 0 && coe;
  const box = late ? 'border-rose-300 bg-rose-50 text-rose-700' : t.box;
  return (
    <span className={`rounded-md border px-1.5 text-center leading-[1.35] tabular-nums truncate ${box}`}>
      <span className="font-bold">{shortDate(date)}</span>
      {days >= 0 && days <= 3 && <span className="font-semibold"> · {days === 0 ? 'today' : days === 1 ? 'tmrw' : `${days}d`}</span>}
      {late && <span className="font-semibold"> · late</span>}
    </span>
  );
}

function Timeline({ d, color }) {
  const end = d.coeDays ?? d.ipDays;
  const start = d.age != null ? -d.age : end;
  return (
    <div className="relative h-full">
      <div className="absolute inset-y-0 border-l-2 border-rose-400/70" style={{ left: `${pos(0)}%` }} />
      {start != null && end != null && end > -BACK && start < AHEAD && (
        <div
          className="absolute top-1/2 -translate-y-1/2 h-[38%] rounded-full opacity-25"
          style={{ left: `${pos(start)}%`, width: `${Math.max(0.8, pos(end) - pos(start))}%`, background: color }}
        />
      )}
      {d.ipDays != null && (
        <span
          title={`IP ends ${d.ipEnd}`}
          className={`absolute top-1/2 w-[0.7em] h-[0.7em] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-violet-600 ${d.ipDays < -BACK || d.ipDays > AHEAD ? 'opacity-35' : ''}`}
          style={{ left: `${pos(d.ipDays)}%` }}
        />
      )}
      {d.coeDays != null && (
        <span
          title={`COE ${d.coe}`}
          className={`absolute top-1/2 w-[0.8em] h-[0.8em] -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white ${d.coeDays < 0 ? 'bg-rose-600' : 'bg-emerald-600'} ${d.coeDays < -BACK || d.coeDays > AHEAD ? 'opacity-35' : ''}`}
          style={{ left: `${pos(d.coeDays)}%` }}
        />
      )}
    </div>
  );
}

const COLS = 'grid-cols-[minmax(0,1.45fr)_6.5rem_4.5rem_5.5rem_7.5rem_7.5rem_minmax(0,2.3fr)_minmax(0,1.6fr)]';

export default function DealTrackerView() {
  const today = laToday();
  const repById = Object.fromEntries(REPS.map((r) => [r.id, r]));
  const deals = PAIRS.flatMap((p) => (p.deals || []).map((d) => {
    const x = {
      ...d,
      rep: repById[p.repId],
      market: p.marketId,
      ipDays: daysFrom(today, d.ipEnd),
      coeDays: daysFrom(today, d.coe),
      age: daysSince(d.stageSince),
    };
    return { ...x, todo: action(x) };
  }));
  const open = deals.filter((d) => d.stage !== 'closed');
  const closed = deals.filter((d) => d.stage === 'closed');
  const nextDeadline = (d) => Math.min(...[d.ipDays, d.coeDays].filter((v) => v != null && v >= 0), 999);
  const groups = STAGES.map((s) => ({
    ...s,
    deals: open
      .filter((d) => d.stage === s.stage)
      .sort((a, b) => (RANK[a.todo?.tone] ?? 3) - (RANK[b.todo?.tone] ?? 3) || nextDeadline(a) - nextDeadline(b)),
  }));
  const urgent = open.filter((d) => d.todo?.tone === 'red').length;
  const ticks = [...Array(SPAN / 7 - 1)].map((_, i) => i * 7); // edges unlabelled so they never crowd

  return (
    <section className="h-full rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col min-h-0 text-[min(0.95rem,1.55vh)]">
      <header className="flex items-end justify-between gap-3 px-5 pt-3 pb-2">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500 font-semibold">Every active deal · what needs doing first</div>
          <h3 className="text-xl font-bold text-zinc-900 leading-tight">Deal Tracker</h3>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold">
          <span className="rounded-full bg-zinc-900 text-white px-3 py-1">{open.length} active</span>
          {urgent > 0 && <span className="rounded-full bg-rose-600 text-white px-3 py-1">{urgent} need action now</span>}
          {STAGES.map((s) => {
            const g = groups.find((x) => x.stage === s.stage);
            const val = g.deals.reduce((a, d) => a + (Number(d.value) || 0), 0);
            return (
              <span key={s.stage} className="rounded-full px-3 py-1 text-white" style={{ background: s.color }}>
                {s.label} {g.deals.length}{val ? ` · ${formatCompactCurrency(val)}` : ''}
              </span>
            );
          })}
        </div>
      </header>

      <div className="px-5 flex-1 min-h-0 flex flex-col">
        <div className={`grid ${COLS} gap-3 items-end text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold pb-1 border-b border-zinc-200`}>
          <span>Property</span><span>Rep</span><span className="text-right">In stage</span><span className="text-right">Value</span>
          <span className="text-center">IP end</span><span className="text-center">COE</span>
          <div className="relative h-4">
            {ticks.map((t) => (
              <span key={t} className={`absolute whitespace-nowrap normal-case tracking-normal text-[11px] -translate-x-1/2 ${t === 0 ? 'text-rose-600 font-bold' : ''}`} style={{ left: `${pos(t)}%` }}>
                {t === 0 ? 'Today' : shortDate(addDays(today, t))}
              </span>
            ))}
          </div>
          <span>Next step</span>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          {groups.map((g) => (
            <div key={g.stage} className="contents">
              <div className="flex items-center gap-2 pt-1.5 pb-0.5 text-xs font-extrabold uppercase tracking-wider" style={{ color: g.color }}>
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: g.color }} />{g.label} · {g.deals.length}
              </div>
              {g.deals.map((d) => (
                <div
                  key={d.id}
                  className={`flex-1 max-h-12 min-h-0 grid ${COLS} gap-3 items-center border-b border-zinc-100 ${d.todo?.tone === 'red' ? 'bg-rose-50/70' : ''}`}
                  style={{ boxShadow: `inset 4px 0 0 ${g.color}` }}
                >
                  <span className="flex items-center gap-2 min-w-0 pl-3">
                    <span className="font-bold text-zinc-900 truncate">{short(d.address)}</span>
                    <span className="shrink-0 text-[11px] font-bold text-zinc-500 bg-zinc-100 rounded px-1">{d.market}</span>
                  </span>
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.rep?.color }} />
                    <span className="font-semibold truncate">{first(d.rep)}</span>
                  </span>
                  <span className={`text-right tabular-nums font-bold ${d.age >= STALE_DAYS ? 'text-amber-600' : 'text-zinc-700'}`}>{d.age != null ? `${d.age}d` : '—'}</span>
                  <span className="text-right tabular-nums font-bold text-emerald-700">{d.value ? formatCompactCurrency(d.value) : <span className="text-zinc-300">—</span>}</span>
                  <DateChip date={d.ipEnd} days={d.ipDays} />
                  <DateChip date={d.coe} days={d.coeDays} coe />
                  <Timeline d={d} color={g.color} />
                  <span className={`truncate font-semibold ${d.todo?.tone === 'red' ? 'text-rose-700' : d.todo?.tone === 'amber' ? 'text-amber-700' : d.todo ? 'text-zinc-400' : 'text-emerald-700'}`}>
                    {d.todo ? d.todo.text : '✓ On track'}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <footer className="flex items-center justify-between gap-4 px-5 py-2 border-t border-zinc-200 text-xs text-zinc-500">
        <span className="truncate">
          <span className="font-bold text-emerald-700">🎉 Closed this month: {closed.length}{closed.length ? ` · ${formatCompactCurrency(closed.reduce((a, d) => a + (Number(d.value) || 0), 0))}` : ''}</span>
          {closed.length > 0 && ` · ${closed.map((d) => `${short(d.address)} (${first(d.rep)})`).join(' · ')}`}
        </span>
        <span className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rotate-45 bg-violet-600" />IP end</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />COE</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-600" />COE passed</span>
          <span>bar = time in current stage · faded = outside the 6 weeks shown</span>
        </span>
      </footer>
    </section>
  );
}
