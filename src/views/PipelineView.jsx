import { useEffect, useRef } from 'react';
import { REPS, MARKETS } from '../data/config.js';
import { PAIRS } from '../data/source.js';
import { formatCurrency } from '../utils/format.js';
import { laToday, daysInclusive, shortDate } from '../utils/historyRange.js';

// Pipeline tab (Luke, Sept 29): every deal currently in Under Contract, Dispo
// Active or Assigned, plus deals that reached Closed this month. Cards show
// property address, market, rep, value, and the IP end / COE dates coloured
// by how close they are. Deals come from `pair.deals` (server/deals.js),
// refreshed with every deploy like the rest of the data.
//
// Lab, Oct 8 (Luke): compact one-glance cards so ~2x fit before scrolling;
// each stage is run off one date (KEY_DATE: IP end for Under Contract and
// Dispo, COE for Assigned). That date gets the deadline colours and turns red
// LATE once it has passed; the other date stays grey. Late deals sort to the
// top. Headers show count, $ (when there is any) and late / due-soon chips.
// Closed is narrower but still lists the month's closings.

const COLUMNS = [
  { stage: 'under_contract', title: 'Under Contract', color: '#2563eb' },
  { stage: 'dispo', title: 'Dispo Active', color: '#d97706' },
  { stage: 'assigned', title: 'Assigned', color: '#7c3aed' },
  { stage: 'closed', title: 'Closed', color: '#059669' },
];

// The date each open stage is run off (Luke, Oct 8).
const KEY_DATE = { under_contract: 'ip', dispo: 'ip', assigned: 'coe' };

const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Deadline colours (Luke, Sept 29): 3 days out light blue, 2 days light
// yellow, 1 day light red, day-of dark red. Further out stays plain; dates
// already behind us are greyed.
function deadlineTone(daysOut) {
  if (daysOut == null) return { box: 'border-zinc-200 bg-white text-zinc-400', label: 'text-zinc-400', rel: null };
  if (daysOut < 0) return { box: 'border-zinc-200 bg-zinc-50 text-zinc-400', label: 'text-zinc-400', rel: 'passed' };
  if (daysOut === 0) return { box: 'border-red-800 bg-red-700 text-white', label: 'text-red-100', rel: 'today' };
  if (daysOut === 1) return { box: 'border-red-300 bg-red-100 text-red-800', label: 'text-red-600', rel: 'tmrw' };
  if (daysOut === 2) return { box: 'border-yellow-300 bg-yellow-100 text-yellow-900', label: 'text-yellow-700', rel: '2d' };
  if (daysOut === 3) return { box: 'border-sky-300 bg-sky-100 text-sky-900', label: 'text-sky-700', rel: '3d' };
  return { box: 'border-zinc-200 bg-white text-zinc-800', label: 'text-zinc-500', rel: `${daysOut}d` };
}

const daysFrom = (today, date) => (date ? daysInclusive(today, date) - 1 : null);

export default function PipelineView() {
  const today = laToday();
  const repById = Object.fromEntries(REPS.map((r) => [r.id, r]));
  const marketById = Object.fromEntries(MARKETS.map((m) => [m.id, m]));

  const deals = PAIRS.flatMap((p) => (p.deals || []).map((d) => {
    const ipDays = daysFrom(today, d.ipEnd);
    const coeDays = daysFrom(today, d.coe);
    const keyDays = KEY_DATE[d.stage] === 'ip' ? ipDays : KEY_DATE[d.stage] === 'coe' ? coeDays : null;
    return {
      ...d,
      rep: repById[p.repId],
      market: marketById[p.marketId],
      ipDays,
      coeDays,
      keyDays,
      late: keyDays != null && keyDays < 0,
      soon: keyDays != null && keyDays >= 0 && keyDays <= 1,
    };
  }));

  // Sub-accounts whose address / COE / IP custom fields couldn't be read —
  // named in a note so blank fields aren't mistaken for "no date set".
  const fieldIssues = PAIRS.filter((p) => !p._unconfigured && (p.dealFieldsError || p.dealFieldsMissing?.length));

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_0.72fr] gap-3 flex-1 min-h-0">
        {COLUMNS.map((col) => (
          <StageColumn
            key={col.stage}
            col={col}
            deals={sortDeals(deals.filter((d) => d.stage === col.stage), col.stage)}
            today={today}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-zinc-600 shrink-0">
        <Key className="border-rose-700 bg-rose-600" label="Late" />
        <Key className="border-red-800 bg-red-700" label="Day of" />
        <Key className="border-red-300 bg-red-100" label="1 day out" />
        <Key className="border-yellow-300 bg-yellow-100" label="2 days out" />
        <Key className="border-sky-300 bg-sky-100" label="3 days out" />
        <span>· Coloured date = the one each stage runs on: IP end for Under Contract &amp; Dispo, COE for Assigned · late and soonest first · left stripe = rep colour · Closed empties on the 1st</span>
        {fieldIssues.length > 0 && (
          <span
            className="text-orange-600"
            title={fieldIssues.map((p) => `${p.repId} · ${p.marketId}: ${p.dealFieldsError || `missing ${p.dealFieldsMissing.join(', ')}`}`).join('\n')}
          >
            · Address / COE / IP fields unavailable for {fieldIssues.length} sub-account{fieldIssues.length === 1 ? '' : 's'}
          </span>
        )}
      </div>
    </div>
  );
}

// Late first (most overdue at the top), then the stage's key date soonest
// first, then deals with no key date, by value. Closed: most recent first.
function sortDeals(list, stage) {
  if (stage === 'closed') return [...list].sort((a, b) => (b.stageSince || 0) - (a.stageSince || 0));
  const key = (d) => (d.keyDays == null ? Infinity : d.keyDays);
  return [...list].sort((a, b) => key(a) - key(b) || b.value - a.value);
}

function StageColumn({ col, deals, today }) {
  const total = deals.reduce((a, d) => a + d.value, 0);
  const closed = col.stage === 'closed';
  const title = closed ? `Closed · ${MONTHS_LONG[+today.slice(5, 7) - 1]}` : col.title;
  const late = deals.filter((d) => d.late).length;
  const soon = deals.filter((d) => d.soon).length;
  return (
    <section className="rounded-xl border border-zinc-300 bg-white flex flex-col min-h-0 overflow-hidden">
      <div className="px-4 pt-2.5 pb-2 border-b border-zinc-200 shrink-0" style={{ borderTop: `5px solid ${col.color}` }}>
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-xl font-bold text-zinc-900 truncate">{title}</h3>
          <span className="text-3xl font-extrabold tabular-nums leading-none" style={{ color: col.color }}>{deals.length}</span>
        </div>
        <div className="flex items-center gap-2 mt-1 min-h-[1.5rem] text-sm">
          {total > 0 && <span className="font-bold text-emerald-700 tabular-nums">{formatCurrency(total)}</span>}
          {closed && <span className="text-zinc-500">resets on the 1st</span>}
          {late > 0 && <span className="rounded-full bg-rose-600 text-white text-xs font-bold px-2 py-0.5">{late} late</span>}
          {soon > 0 && <span className="rounded-full bg-amber-400 text-amber-950 text-xs font-bold px-2 py-0.5">{soon} due today / tmrw</span>}
        </div>
      </div>
      <AutoScroll className="p-2 flex flex-col gap-1.5">
        {deals.length === 0 && <div className="text-sm text-zinc-400 text-center py-6">No deals in this stage</div>}
        {deals.map((d) => <DealCard key={d.id} deal={d} closed={closed} />)}
      </AutoScroll>
    </section>
  );
}

function DealCard({ deal, closed }) {
  const key = KEY_DATE[deal.stage];
  return (
    <div
      className={`rounded-lg border px-3 py-2 shrink-0 ${deal.late ? 'border-rose-300 bg-rose-50' : 'border-zinc-200 bg-zinc-50/60'}`}
      style={{ borderLeft: `4px solid ${deal.rep?.color || '#a1a1aa'}` }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[16px] font-bold text-zinc-900 leading-snug truncate">{deal.address || 'No address'}</span>
        {deal.value > 0 && <span className="text-[17px] font-extrabold text-emerald-700 tabular-nums shrink-0">{formatCurrency(deal.value)}</span>}
      </div>
      <div className="flex items-center justify-between gap-2 mt-1">
        <span className="flex items-center gap-1.5 min-w-0 text-[13px] text-zinc-600">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: deal.rep?.color || '#a1a1aa' }} />
          <span className="truncate">{deal.rep?.name || '—'} · {deal.market?.name || '—'}</span>
        </span>
        {closed ? (
          <span className="shrink-0 text-xs font-semibold text-emerald-700">
            ✓ Closed {deal.stageSince ? shortDate(new Date(deal.stageSince).toISOString().slice(0, 10)) : ''}
          </span>
        ) : (
          <span className="flex gap-1 shrink-0">
            <DateChip label="IP" date={deal.ipEnd} daysOut={deal.ipDays} isKey={key === 'ip'} />
            <DateChip label="COE" date={deal.coe} daysOut={deal.coeDays} isKey={key === 'coe'} />
          </span>
        )}
      </div>
    </div>
  );
}

// The stage's key date gets the deadline colours (red LATE once passed); the
// other date is shown for reference in grey.
function DateChip({ label, date, daysOut, isKey }) {
  let box = 'border-zinc-200 bg-white text-zinc-400';
  let rel = null;
  if (isKey && date) {
    if (daysOut < 0) {
      box = 'border-rose-700 bg-rose-600 text-white';
      rel = `late ${-daysOut}d`;
    } else {
      const t = deadlineTone(daysOut);
      box = t.box;
      rel = t.rel;
    }
  }
  return (
    <span className={`rounded-md border px-1.5 py-0.5 text-[12px] leading-none whitespace-nowrap tabular-nums ${box}`}>
      <span className="font-semibold opacity-80">{label}</span>{' '}
      <span className="font-bold">{date ? shortDate(date) : '—'}</span>
      {rel && <span className="font-bold"> · {rel}</span>}
    </span>
  );
}

function Key({ className, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-6 h-3.5 rounded border ${className}`} />
      {label}
    </span>
  );
}

// A column that's taller than the screen scrolls itself slowly so the office
// TV shows every deal: glide down, pause at the bottom, jump back to the top.
function AutoScroll({ className, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let pauseUntil = Date.now() + 3000;
    const timer = setInterval(() => {
      if (Date.now() < pauseUntil || el.scrollHeight <= el.clientHeight) return;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
        el.scrollTop = 0;
        pauseUntil = Date.now() + 3000;
      } else {
        el.scrollTop += 1;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) pauseUntil = Date.now() + 3000;
      }
    }, 40);
    return () => clearInterval(timer);
  }, []);
  return <div ref={ref} className={`flex-1 min-h-0 overflow-y-auto ${className}`}>{children}</div>;
}
