// Leaderboard (lab, from the "Sales Floor" hand-off): reps ranked by this
// week's score with the Friday scorecard's weights (utils/scorecard.js),
// medals for the top 3, rank movement vs last week's final ranking, and the
// Pod A vs Pod B battle (pod score = average of its reps).
import { REPS } from '../data/config.js';
import { PAIRS, historyEntries } from '../data/source.js';
import { laToday } from '../utils/historyRange.js';
import { formatCompactCurrency } from '../utils/format.js';
import { PODS, rankReps, lastWeekRanks, scoreTone, weekOfMonth } from '../utils/scorecard.js';

const first = (rep) => rep.name.split(' ')[0];
const COLS = 'grid-cols-[3rem_9rem_1fr_6rem_5rem_5rem_7rem_4rem]';

function Card({ kicker, title, right, className = '', children }) {
  return (
    <section className={`rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col min-h-0 ${className}`}>
      <header className="flex items-end justify-between gap-3 px-5 pt-4 pb-2">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500 font-semibold">{kicker}</div>
          <h3 className="text-xl font-bold text-zinc-900 leading-tight">{title}</h3>
        </div>
        {right && <div className="text-sm text-zinc-500 shrink-0">{right}</div>}
      </header>
      <div className="flex-1 min-h-0 px-5 pb-4">{children}</div>
    </section>
  );
}

function Move({ was, now }) {
  if (was == null) return <span className="text-lg font-bold text-right text-zinc-300">·</span>;
  const mv = was - now;
  const cls = mv > 0 ? 'text-emerald-600' : mv < 0 ? 'text-rose-600' : 'text-zinc-400';
  return <span className={`text-lg font-bold text-right ${cls}`}>{mv > 0 ? `▲${mv}` : mv < 0 ? `▼${-mv}` : '–'}</span>;
}

export default function LeaderboardView() {
  const today = laToday();
  const wom = weekOfMonth(today);
  const rows = rankReps(REPS, PAIRS, wom);
  const byId = Object.fromEntries(rows.map((r) => [r.rep.id, r]));
  const prevRank = lastWeekRanks(REPS, historyEntries(), today);

  const pods = PODS.map((pod) => {
    const members = pod.reps.map((id) => byId[id]).filter(Boolean);
    const avg = members.length ? Math.round(members.reduce((a, r) => a + r.score, 0) / members.length) : 0;
    return { ...pod, members, score: avg, lead: REPS.find((r) => r.id === pod.lead) };
  });
  const [a, b] = pods;
  const gap = a && b ? a.score - b.score : 0;

  return (
    <div className="h-full grid grid-cols-[1fr_24rem] gap-4 min-h-0">
      <Card
        kicker="This week · same scoring as the Friday scorecard"
        title="Leaderboard"
        right={`contracts 35 · projected $ 15 · offers 15 · opps 10 · week ${wom} of month`}
      >
        <div className="h-full flex flex-col min-h-0">
          <div className={`grid ${COLS} gap-3 text-[11px] uppercase tracking-[0.15em] text-zinc-500 font-semibold pb-2 border-b border-zinc-200`}>
            <span>#</span><span>Rep</span><span>Score</span>
            <span className="text-right">Contracts</span><span className="text-right">Offers</span>
            <span className="text-right">Opps</span><span className="text-right">Projected</span>
            <span className="text-right">Move</span>
          </div>
          <div className="flex-1 flex flex-col justify-around min-h-0">
            {rows.map((r, i) => {
              const tone = scoreTone(r.score);
              return (
                <div key={r.rep.id} className={`grid ${COLS} gap-3 items-center rounded-xl px-1 py-0.5 ${i < 3 ? 'bg-amber-50/70' : ''}`}>
                  <span className="text-[min(1.875rem,3.4vh)] font-extrabold text-zinc-300 tabular-nums leading-none">
                    {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                  </span>
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: r.rep.color }} />
                    <span className="text-[min(1.5rem,2.8vh)] font-bold text-zinc-900 truncate">{first(r.rep)}</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="relative h-[min(1.75rem,3vh)] flex-1 rounded-lg bg-zinc-100 overflow-hidden">
                      <div className="absolute inset-y-0 left-0 rounded-lg" style={{ width: `${r.score}%`, background: r.rep.color }} />
                      <div className="absolute inset-y-0 border-l-2 border-dashed border-zinc-500" style={{ left: '90%' }} />
                    </div>
                    <span className="text-[min(1.875rem,3.4vh)] font-extrabold tabular-nums w-14 text-right" style={{ color: tone.color }}>{r.score}</span>
                  </div>
                  <span className="text-[min(1.5rem,2.8vh)] font-bold tabular-nums text-right">{r.contracts}</span>
                  <span className="text-[min(1.5rem,2.8vh)] font-bold tabular-nums text-right">{r.offers}</span>
                  <span className="text-[min(1.5rem,2.8vh)] font-bold tabular-nums text-right">{r.opps}</span>
                  <span className="text-[min(1.25rem,2.4vh)] font-bold tabular-nums text-right text-emerald-700">{formatCompactCurrency(r.projected)}</span>
                  <Move was={prevRank?.[r.rep.id]} now={i + 1} />
                </div>
              );
            })}
          </div>
          <div className="text-xs text-zinc-500 pt-2 border-t border-zinc-200">
            Dashed line = 90 (STRONG) · no contract this week caps the score at 89 · projected = revenue closed this month + Assigned deals ·
            CRM checklist is scored on the sheet, not here · ▲▼ = places moved vs last week's final ranking
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-4 min-h-0">
        {pods.map((pod) => {
          const tone = scoreTone(pod.score);
          const other = pod === a ? b : a;
          const leading = other && pod.score > other.score;
          return (
            <Card
              key={pod.name}
              kicker="Pod battle"
              title={pod.name}
              right={`lead: ${pod.lead ? first(pod.lead) : '—'}`}
              className={`flex-1 ${leading ? 'ring-2 ring-emerald-400' : ''}`}
            >
              <div className="h-full flex flex-col justify-around gap-3">
                <div className="flex items-baseline gap-3">
                  <span className="text-7xl font-extrabold tabular-nums leading-none" style={{ color: tone.color }}>{pod.score}</span>
                  <span className="text-sm font-bold tracking-wider" style={{ color: tone.color }}>{tone.label}</span>
                  {leading && (
                    <span className="ml-auto text-sm font-extrabold tracking-wider text-emerald-700 bg-emerald-50 rounded-full px-3 py-1">
                      🏆 LEADS BY {Math.abs(gap)}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-[min(1rem,1.5vh)]">
                  {pod.members.map((r) => (
                    <div key={r.rep.id} className="grid grid-cols-[6rem_1fr_3rem] items-center gap-2">
                      <span className="text-[min(1.25rem,2.4vh)] font-bold truncate">{first(r.rep)}</span>
                      <div className="h-[min(1.5rem,2.4vh)] rounded bg-zinc-100 overflow-hidden">
                        <div className="h-full rounded" style={{ width: `${r.score}%`, background: r.rep.color }} />
                      </div>
                      <span className="text-right text-[min(1.5rem,2.6vh)] font-extrabold tabular-nums" style={{ color: scoreTone(r.score).color }}>{r.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
