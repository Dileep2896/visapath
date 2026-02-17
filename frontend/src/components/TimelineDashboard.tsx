import { Clock, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TimelineResponse, TimelineEvent } from '../types';
import StatusBadge from './StatusBadge';

interface TimelineDashboardProps {
  data: TimelineResponse;
}

const urgencyColors: Record<string, string> = {
  critical: 'border-red-500/40 bg-red-500/5',
  high: 'border-amber-500/40 bg-amber-500/5',
  medium: 'border-teal-400/30 bg-teal-400/5',
  low: 'border-slate-600 bg-navy-800',
  none: 'border-slate-600 bg-navy-800',
  passed: 'border-slate-700/50 bg-navy-900/50',
};

const urgencyHoverGlow: Record<string, string> = {
  critical: 'hover:shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:border-red-500/60',
  high: 'hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:border-amber-500/60',
  medium: 'hover:shadow-[0_0_12px_rgba(0,212,170,0.12)] hover:border-teal-400/50',
  low: 'hover:border-slate-500',
  none: 'hover:border-slate-500',
  passed: '',
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

const typeBadge: Record<string, { label: string; class: string }> = {
  deadline: { label: 'Deadline', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  milestone: { label: 'Milestone', class: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
  risk: { label: 'Risk', class: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

const severityConfig: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  critical: { bg: 'bg-red-500/8', border: 'border-red-500/25', text: 'text-red-400', dot: 'bg-red-400' },
  high: { bg: 'bg-amber-500/8', border: 'border-amber-500/25', text: 'text-amber-400', dot: 'bg-amber-400' },
  warning: { bg: 'bg-amber-500/8', border: 'border-amber-500/25', text: 'text-amber-300', dot: 'bg-amber-300' },
  info: { bg: 'bg-blue-500/8', border: 'border-blue-500/25', text: 'text-blue-400', dot: 'bg-blue-400' },
};

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr + 'T00:00:00');
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays === -1) return 'yesterday';
  if (diffDays > 0 && diffDays <= 30) return `in ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -30) return `${Math.abs(diffDays)} days ago`;
  if (diffDays > 30 && diffDays <= 365) {
    const months = Math.round(diffDays / 30);
    return `in ${months} month${months > 1 ? 's' : ''}`;
  }
  if (diffDays < -30 && diffDays >= -365) {
    const months = Math.round(Math.abs(diffDays) / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
  if (diffDays > 365) {
    const years = Math.round(diffDays / 365);
    return `in ${years} year${years > 1 ? 's' : ''}`;
  }
  const years = Math.round(Math.abs(diffDays) / 365);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

function groupByMonth(events: TimelineEvent[]): { key: string; label: string; events: TimelineEvent[] }[] {
  const groups: Map<string, TimelineEvent[]> = new Map();
  for (const event of events) {
    const d = new Date(event.date + 'T00:00:00');
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
    const existing = groups.get(key);
    if (existing) {
      existing.push(event);
    } else {
      groups.set(key, [event]);
    }
  }
  return Array.from(groups.entries()).map(([key, evts]) => {
    const d = new Date(evts[0].date + 'T00:00:00');
    return {
      key,
      label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      events: evts,
    };
  });
}

export default function TimelineDashboard({ data }: TimelineDashboardProps) {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);

  // Recalculate is_past and urgency from current date (timeline may have been cached days ago)
  const timeline_events = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return data.timeline_events.map(e => {
      const eventDate = new Date(e.date + 'T00:00:00');
      const isPast = eventDate < today;
      const diffDays = Math.round((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      let urgency = e.urgency;
      if (isPast) {
        urgency = 'passed';
      } else if (diffDays <= 7) {
        urgency = 'critical';
      } else if (diffDays <= 30) {
        urgency = 'high';
      } else if (diffDays <= 90) {
        urgency = 'medium';
      } else {
        urgency = 'low';
      }
      return { ...e, is_past: isPast, urgency } as TimelineEvent;
    });
  }, [data.timeline_events]);

  const { current_status, risk_alerts } = data;

  const currentIdx = timeline_events.findIndex(e => !e.is_past);
  const pastCount = timeline_events.filter(e => e.is_past).length;

  // Split into past and active events
  const activeEvents = useMemo(() => {
    if (showPast) return timeline_events;
    return timeline_events.filter(e => !e.is_past);
  }, [timeline_events, showPast]);

  const monthGroups = useMemo(() => groupByMonth(activeEvents), [activeEvents]);

  // Top risk alerts (max 3)
  const topAlerts = risk_alerts?.slice(0, 3) ?? [];

  // Track a running event index for animation delay
  let globalEventIdx = 0;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Status Badge — recalculate countdown from current date */}
      <div className="animate-fade-in-up">
        <StatusBadge
          visa={current_status.visa}
          workAuth={current_status.work_auth}
          daysUntilDeadline={(() => {
            const upcoming = timeline_events.find(e => e.type === 'deadline' && !e.is_past);
            if (!upcoming) return current_status.days_until_next_deadline;
            const now = new Date(); now.setHours(0, 0, 0, 0);
            return Math.round((new Date(upcoming.date + 'T00:00:00').getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          })()}
          nextDeadline={
            timeline_events.find(e => e.type === 'deadline' && !e.is_past)?.title
            ?? current_status.next_deadline
          }
        />
      </div>

      {/* Risk Alerts Summary */}
      {topAlerts.length > 0 && (
        <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          {topAlerts.map((alert, idx) => {
            const config = severityConfig[alert.severity] || severityConfig.info;
            return (
              <div
                key={idx}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${config.bg} ${config.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
                <p className={`text-xs font-medium flex-1 ${config.text}`}>{alert.message}</p>
              </div>
            );
          })}
          {risk_alerts.length > 3 && (
            <button
              onClick={() => navigate('/alerts')}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-400 transition-colors pl-4 cursor-pointer"
            >
              View all {risk_alerts.length} alerts
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-0">
        <h2
          className="text-lg font-semibold text-white font-heading mb-4 animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          Your Timeline
        </h2>

        {/* Past events toggle */}
        {pastCount > 0 && !showPast && (
          <button
            onClick={() => setShowPast(true)}
            className="flex items-center gap-2 mb-4 ml-12 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer group"
          >
            <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
            Show {pastCount} past event{pastCount > 1 ? 's' : ''}
          </button>
        )}
        {pastCount > 0 && showPast && (
          <button
            onClick={() => setShowPast(false)}
            className="flex items-center gap-2 mb-4 ml-12 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer group"
          >
            <ChevronUp size={14} className="group-hover:-translate-y-0.5 transition-transform" />
            Hide past events
          </button>
        )}

        <div className="relative">
          {/* Enhanced timeline line */}
          <div className="absolute left-[17px] top-0 bottom-0 w-[3px] rounded-full timeline-line-enhanced" />

          {monthGroups.map((group) => (
            <div key={group.key}>
              {/* Month divider */}
              <div className="month-divider relative pl-12 pb-2 pt-1">
                <div className="absolute left-[12px] top-1/2 -translate-y-1/2 w-[13px] h-[1px] bg-navy-600" />
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                  {group.label}
                </span>
              </div>

              {group.events.map((event) => {
                const Icon = typeIcons[event.type] || Clock;
                const isExpanded = expandedId === event.id;
                const isCurrent = timeline_events.indexOf(event) === currentIdx;
                const badge = typeBadge[event.type] || typeBadge.milestone;
                const animIdx = globalEventIdx++;

                return (
                  <div
                    key={event.id}
                    className={`relative pl-12 pb-3 animate-fade-in-up ${event.is_past && !isCurrent ? 'opacity-50' : ''}`}
                    style={{ animationDelay: `${300 + animIdx * 80}ms` }}
                  >
                    {/* Dot on timeline */}
                    <div
                      className={`absolute top-3 z-10 ${
                        isCurrent
                          ? 'w-[22px] h-[22px] left-[7.5px]'
                          : 'w-4 h-4 left-[10.5px]'
                      } rounded-full border-2 border-navy-950 ${urgencyDotColors[event.urgency]} ${
                        isCurrent ? 'animate-pulse-glow ring-2 ring-teal-400/40 ring-offset-2 ring-offset-navy-950 current-dot-glow' : ''
                      }`}
                    />

                    {/* Card */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : event.id)}
                      className={`w-full text-left rounded-xl border p-4 transition-all duration-300 cursor-pointer hover:scale-[1.01] active:scale-[0.995] ${urgencyColors[event.urgency]} ${urgencyHoverGlow[event.urgency]}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <Icon size={16} className={`mt-0.5 shrink-0 ${
                            event.urgency === 'critical' ? 'text-red-400' :
                            event.urgency === 'high' ? 'text-amber-400' :
                            'text-slate-400'
                          }`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <p className="text-sm font-medium text-white">{event.title}</p>
                              {isCurrent && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-400/15 text-teal-400 font-bold uppercase tracking-wider border border-teal-400/20">
                                  Up Next
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${badge.class}`}>
                                {badge.label}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                              <span className={`text-[10px] font-medium ${
                                event.is_past ? 'text-slate-500' :
                                event.urgency === 'critical' ? 'text-red-400' :
                                event.urgency === 'high' ? 'text-amber-400' :
                                'text-slate-400'
                              }`}>
                                {getRelativeTime(event.date)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {(event.description || event.action_items.length > 0) && (
                          <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                            <ChevronDown size={16} className="text-slate-400 shrink-0" />
                          </div>
                        )}
                      </div>

                      <div
                        className={`grid transition-all duration-300 ease-in-out ${
                          isExpanded ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="pt-3 border-t border-white/10">
                            <p className="text-sm text-slate-300 leading-relaxed">{event.description}</p>
                            {event.action_items.length > 0 && (
                              <ul className="mt-3 space-y-2">
                                {event.action_items.map((item, i) => (
                                  <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                                    <span className="w-1 h-1 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
