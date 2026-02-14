import { useState } from 'react';
import { CheckCircle, Circle, Calendar, AlertTriangle } from 'lucide-react';
import type { TimelineEvent } from '../types';

interface ActionItemsProps {
  events: TimelineEvent[];
}

interface ActionEntry {
  task: string;
  eventTitle: string;
  date: string;
  urgency: string;
}

const urgencyOrder: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  none: 4,
  passed: 5,
};

const urgencyBadge: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Urgent' },
  high: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Soon' },
  medium: { bg: 'bg-teal-400/10', text: 'text-teal-400', label: 'Upcoming' },
  low: { bg: 'bg-slate-500/10', text: 'text-slate-400', label: 'Later' },
  none: { bg: 'bg-slate-500/10', text: 'text-slate-400', label: 'Later' },
};

export default function ActionItems({ events }: ActionItemsProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  // Extract action items from future events only
  const items: ActionEntry[] = events
    .filter(e => !e.is_past && e.action_items.length > 0)
    .sort((a, b) => (urgencyOrder[a.urgency] ?? 4) - (urgencyOrder[b.urgency] ?? 4))
    .flatMap(event =>
      event.action_items.map(task => ({
        task,
        eventTitle: event.title,
        date: event.date,
        urgency: event.urgency,
      }))
    );

  function toggleCheck(key: string) {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const completedCount = checked.size;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white font-heading">Action Items</h2>
        <p className="text-sm text-slate-400 mt-1">Your prioritized to-do list based on upcoming deadlines</p>
      </div>

      {/* Progress bar */}
      <div className="bg-navy-900 rounded-xl border border-navy-700 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-300">{completedCount} of {totalCount} completed</span>
          <span className="text-sm font-medium text-teal-400">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-navy-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Action items list */}
      {items.length === 0 ? (
        <div className="bg-navy-900 rounded-xl border border-navy-700 p-8 text-center">
          <CheckCircle size={32} className="text-teal-400 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">All caught up!</p>
          <p className="text-sm text-slate-500 mt-1">No pending action items right now.</p>
        </div>
      ) : (
        <div className="bg-navy-900 rounded-xl border border-navy-700 divide-y divide-navy-700">
          {items.map((item, idx) => {
            const key = `${item.eventTitle}-${idx}`;
            const isChecked = checked.has(key);
            const badge = urgencyBadge[item.urgency] || urgencyBadge.none;

            return (
              <div
                key={key}
                className={`flex items-start gap-4 p-4 transition-colors animate-fade-in-up ${
                  isChecked ? 'opacity-50' : 'hover:bg-navy-800/50'
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <button
                  onClick={() => toggleCheck(key)}
                  className="mt-0.5 shrink-0 cursor-pointer"
                >
                  {isChecked ? (
                    <CheckCircle size={20} className="text-teal-400" />
                  ) : (
                    <Circle size={20} className="text-slate-600" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    isChecked ? 'text-slate-500 line-through' : 'text-white'
                  }`}>
                    {item.task}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar size={10} />
                      {new Date(item.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-xs text-slate-600">for</span>
                    <span className="text-xs text-slate-400 truncate">{item.eventTitle}</span>
                  </div>
                </div>
                <span className={`shrink-0 text-xs px-2 py-1 rounded-full font-medium ${badge.bg} ${badge.text}`}>
                  {badge.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
