// Pipeline (lab, from the "Sales Floor" hand-off): stage tiles (count, $ value,
// days in stage) and a 7-day deadline calendar of IP ends and COE dates for
// open deals, from `pair.deals` (server/deals.js). Same deal rules as the
// needs-attention strip: closed deals have no deadlines left. Closings whose
// COE has passed without the deal reaching Closed show in a Past due column.
// The original card board is still a click-only tab (PipelineView, "Deal board").
import { REPS } from '../data/config.js';
import { PAIRS } from '../data/source.js';
import { formatCompactCurrency } from '../utils/format.js';
import { laToday, addDays, daysInclusive, shortDate } from '../utils/historyRange.js';

const STAGES = [
  { stage: 'under_contract', label: 'Under Contract', color: '#2563eb' },
  { stage: 'dispo', label: 'DISPO Active', color: '#d97706' },
  { stage: 'assigned', label: 'Assigned', color: '#7c3aed' },
  { stage: 'closed', label: 'Closed · month', color: '#059669' },
];
const STAGE_LABEL = Object.fromEntries(STAGES.map((s) => [s.stage, s.label.split(' ·')[0]]));
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PAST_DUE_DAYS = 14; // older misses are stale data, not today's problem
const DAY_MS = 86_400_000;

const short = (addr) => (addr || 'No address').split(',')[0];
const first = (rep) => (rep ? rep.name.split(' ')[0] : '');

function stageNote(stage, list, now = Date.now()) {
  if (stage === 'closed') return 'reached Closed this month';
  const ages = list.filter((d) => d.stageSince).map((d) => (now - d.stageSince) / DAY_MS);
  if (!ages.length) return '';
  const avg = Math.round(ages.reduce((a, b) => a + b, 0) / ages.length);
  return `avg ${avg} day${avg === 1 ? '' : 's'} in stage · oldest ${Math.floor(Math.max(...ages))}`;
}

function Chip({ item }) {
  const { d, kind } = item;
  const cls = kind === 'ip' ? 'bg-violet-600' : kind === 'late' ? 'bg-rose-600' : 'bg-emerald-600';
  const what = kind === 'ip' ? 'IP ends' : kind === 'late' ? `COE was ${shortDate(d.coe)}` : 'Closing';
  return (
    <div className={`rounded-lg px-2.5 py-2 text-white shrink-0 ${cls}`}>
      <div className="text-[11px] font-bold uppercase tracking-wider opacity-90 truncate">{what}</div>
      <div className="text-[min(0.95rem,1.8vh)] font-bold leading-tight truncate">{short(d.address)}</div>
      <div className="text-xs opacity-90 truncate">{[first(d.rep), STAGE_LABEL[d.stage], d.value ? formatCompactCurrency(d.value) : null].filter(Boolean).join(' · ')}</div>
    </div>
  );
}

export default function PipelineCalendarView() {
  const today = laToday();
  const repById = Object.fromEntries(REPS.map((r) => [r.id, r]));
  const all = PAIRS.flatMap((p) => (p.deals || []).map((d) => ({ ...d, rep: repById[p.repId] })));
  const open = all.filter((d) => d.stage !== 'closed');
  const daysOut = (date) => (date ? daysInclusive(today, date) - 1 : null);

  const days = [...Array(7)].map((_, i) => addDays(today, i));
  const pastDue = open
    .filter((d) => d.coe && daysOut(d.coe) < 0 && daysOut(d.coe) >= -PAST_DUE_DAYS)
    .sort((a, b) => a.coe.localeCompare(b.coe))
    .map((d) => ({ d, kind: 'late' }));
  const columns = [
    ...(pastDue.length ? [{ key: 'late', label: 'Past due', items: pastDue, late: true }] : []),
    ...days.map((day, i) => ({
      key: day,
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `${DOW[new Date(`${day}T12:00:00Z`).getUTCDay()]} ${shortDate(day)}`,
      today: i === 0,
      items: open.flatMap((d) => [d.ipEnd === day && { d, kind: 'ip' }, d.coe === day && { d, kind: 'coe' }].filter(Boolean)),
    })),
  ];
  const total = columns.reduce((a, c) => a + (c.late ? 0 : c.items.length), 0);

  return (
    <div className="h-full grid grid-rows-[auto_1fr] gap-4 min-h-0">
      <div className="grid grid-cols-4 gap-4">
        {STAGES.map((s) => {
          const list = all.filter((d) => d.stage === s.stage);
          const val = list.reduce((a, d) => a + (Number(d.value) || 0), 0);
          return (
            <div key={s.stage} className="rounded-2xl bg-white border border-zinc-200 shadow-sm px-5 py-3" style={{ borderTop: `6px solid ${s.color}` }}>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-semibold">{s.label}</div>
              <div className="flex items-baseline justify-between">
                <span className="text-[min(3.75rem,6.5vh)] font-extrabold tabular-nums leading-tight" style={{ color: s.color }}>{list.length}</span>
                <span className="text-2xl font-bold text-emerald-700 tabular-nums">{val ? formatCompactCurrency(val) : '—'}</span>
              </div>
              <div className="text-sm text-zinc-500">{stageNote(s.stage, list)}</div>
            </div>
          );
        })}
      </div>

      <section className="rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col min-h-0">
        <header className="flex items-end justify-between gap-3 px-5 pt-4 pb-2">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500 font-semibold">Next 7 days · {total} deadline{total === 1 ? '' : 's'}</div>
            <h3 className="text-xl font-bold text-zinc-900 leading-tight">Deadline calendar</h3>
          </div>
          <div className="flex items-center gap-4 text-sm text-zinc-600">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-violet-600" />IP ends</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-600" />COE / closing</span>
            {pastDue.length > 0 && <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-rose-600" />COE passed, not closed</span>}
          </div>
        </header>
        <div className="flex-1 min-h-0 px-5 pb-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
          {columns.map((c) => (
            <div
              key={c.key}
              className={`rounded-xl p-2.5 flex flex-col gap-2 min-h-0 overflow-hidden ${
                c.late ? 'bg-rose-50/60 border border-dashed border-rose-300' : c.today ? 'bg-rose-50 ring-2 ring-rose-300' : 'bg-zinc-50'
              }`}
            >
              <div className={`flex justify-between text-sm font-extrabold uppercase tracking-wider ${c.late || c.today ? 'text-rose-700' : 'text-zinc-600'}`}>
                <span className="truncate">{c.label}</span>{c.items.length > 0 && <span className="tabular-nums">{c.items.length}</span>}
              </div>
              {c.items.length === 0 && <div className="text-sm text-zinc-400">—</div>}
              {c.items.map((item, j) => <Chip key={j} item={item} />)}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
