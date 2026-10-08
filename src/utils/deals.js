// Deadline helpers shared by the Pipeline card board and the Deal Tracker.
import { daysInclusive } from './historyRange.js';

// Deadline colours (Luke, Sept 29): 3 days out light blue, 2 days light
// yellow, 1 day light red, day-of dark red. Further out stays plain; dates
// already behind us are greyed.
export function deadlineTone(daysOut) {
  if (daysOut == null) return { box: 'border-zinc-200 bg-white text-zinc-400', label: 'text-zinc-400', rel: null };
  if (daysOut < 0) return { box: 'border-zinc-200 bg-zinc-50 text-zinc-400', label: 'text-zinc-400', rel: 'passed' };
  if (daysOut === 0) return { box: 'border-red-800 bg-red-700 text-white', label: 'text-red-100', rel: 'TODAY' };
  if (daysOut === 1) return { box: 'border-red-300 bg-red-100 text-red-800', label: 'text-red-600', rel: 'TOMORROW' };
  if (daysOut === 2) return { box: 'border-yellow-300 bg-yellow-100 text-yellow-900', label: 'text-yellow-700', rel: '2 days' };
  if (daysOut === 3) return { box: 'border-sky-300 bg-sky-100 text-sky-900', label: 'text-sky-700', rel: '3 days' };
  return { box: 'border-zinc-200 bg-white text-zinc-800', label: 'text-zinc-500', rel: `${daysOut} days` };
}

export const daysFrom = (today, date) => (date ? daysInclusive(today, date) - 1 : null);
