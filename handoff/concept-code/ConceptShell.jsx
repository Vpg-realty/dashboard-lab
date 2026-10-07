import { useState } from 'react';
import { TodayView, LeaderboardView, ActivityView, PipelineConceptView } from './TvViews.jsx';
import { RevenueConceptView, CoachingView } from './ManagerViews.jsx';
import AdvancedView from '../views/AdvancedView.jsx';
import { useDataUpdates } from '../data/source.js';

export const CONCEPT_TABS = [
  { id: 'today', label: 'Today', group: 'tv', C: TodayView },
  { id: 'leaderboard', label: 'Leaderboard', group: 'tv', C: LeaderboardView },
  { id: 'activity', label: 'Activity', group: 'tv', C: ActivityView },
  { id: 'pipeline', label: 'Pipeline', group: 'tv', C: PipelineConceptView },
  { id: 'revenue', label: 'Revenue & Forecast', group: 'mgr', C: RevenueConceptView },
  { id: 'coaching', label: 'Coaching', group: 'mgr', C: CoachingView },
  { id: 'advanced', label: 'Advanced', group: 'mgr', C: AdvancedView },
];

export default function ConceptShell({ initial = 'today' }) {
  useDataUpdates();
  const [tab, setTab] = useState(initial);
  const T = CONCEPT_TABS.find((t) => t.id === tab) || CONCEPT_TABS[0];
  const btn = (t) => (
    <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-1.5 rounded-lg text-sm font-semibold uppercase tracking-wider ${tab === t.id ? (t.group === 'tv' ? 'bg-zinc-900 text-white' : 'bg-blue-600 text-white') : 'text-zinc-600 hover:bg-zinc-100'}`}>{t.label}</button>
  );
  return (
    <div className="h-screen flex flex-col bg-zinc-100">
      <header className="flex items-center gap-4 px-6 py-3 bg-white border-b border-zinc-200">
        <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xl font-extrabold tracking-tight">VPG <span className="text-zinc-400 font-semibold">Sales Floor</span></span>
        <nav className="flex items-center gap-1 ml-6">
          <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 mr-1">TV ▸</span>
          {CONCEPT_TABS.filter((t) => t.group === 'tv').map(btn)}
          <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 ml-4 mr-1">Manager ▸</span>
          {CONCEPT_TABS.filter((t) => t.group === 'mgr').map(btn)}
        </nav>
        <span className="ml-auto text-sm text-zinc-500">Wed Oct 7 · 11:00 AM · rotates every 20s</span>
      </header>
      <main className="flex-1 min-h-0 p-5"><T.C /></main>
    </div>
  );
}
