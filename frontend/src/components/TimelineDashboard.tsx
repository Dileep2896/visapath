import { Clock, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { TimelineResponse } from '../types';
import StatusBadge from './StatusBadge';
import RiskAlerts from './RiskAlerts';

interface TimelineDashboardProps {
  data: TimelineResponse;
}

const urgencyColors: Record<string, string> = {
  critical: 'border-red-500 bg-red-500/5',
  high: 'border-amber-500 bg-amber-500/5',
  medium: 'border-teal-400 bg-teal-400/5',
  low: 'border-slate-600 bg-navy-800',
  none: 'border-slate-600 bg-navy-800',
  passed: 'border-slate-700 bg-navy-900 opacity-50',
};

const urgencyDotColors: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-amber-500',
  medium: 'bg-teal-400',
  low: 'bg-slate-500',
  none: 'bg-slate-500',
  passed: 'bg-slate-600',
};

const typeIcons: Record<string, typeof Clock> = {
  deadline: AlertTriangle,
  milestone: CheckCircle,
  risk: AlertTriangle,
};

export default function TimelineDashboard({ data }: TimelineDashboardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { timeline_events, risk_alerts, current_status } = data;

  // Find the first non-past event to mark as "current"
  const currentIdx = timeline_events.findIndex(e => !e.is_past);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <StatusBadge
        visa={current_status.visa}
        workAuth={current_status.work_auth}
        daysUntilDeadline={current_status.days_until_next_deadline}
        nextDeadline={current_status.next_deadline}
      />

      {risk_alerts.length > 0 && <RiskAlerts alerts={risk_alerts} />}

      <div className="space-y-0">
        <h2 className="text-lg font-semibold text-white font-heading mb-4">Your Timeline</h2>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-navy-700" />

          {timeline_events.map((event, idx) => {
            const Icon = typeIcons[event.type] || Clock;
            const isExpanded = expandedId === event.id;
            const isCurrent = idx === currentIdx;

            return (
              <div key={event.id} className="relative pl-12 pb-6">
                {/* Dot on timeline */}
                <div
                  className={`absolute left-2.5 top-3 w-4 h-4 rounded-full border-2 border-navy-950 ${urgencyDotColors[event.urgency]} ${
                    isCurrent ? 'ring-2 ring-teal-400/50 ring-offset-2 ring-offset-navy-950' : ''
                  }`}
                />

                {/* Card */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : event.id)}
                  className={`w-full text-left rounded-xl border p-4 transition-all cursor-pointer ${urgencyColors[event.urgency]}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Icon size={16} className={`mt-0.5 shrink-0 ${
                        event.urgency === 'critical' ? 'text-red-400' :
                        event.urgency === 'high' ? 'text-amber-400' :
                        'text-slate-400'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-white">{event.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(event.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    {(event.description || event.action_items.length > 0) && (
                      isExpanded
                        ? <ChevronUp size={16} className="text-slate-400 shrink-0" />
                        : <ChevronDown size={16} className="text-slate-400 shrink-0" />
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-sm text-slate-300">{event.description}</p>
                      {event.action_items.length > 0 && (
                        <ul className="mt-3 space-y-1.5">
                          {event.action_items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                              <span className="text-teal-400 mt-0.5">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
