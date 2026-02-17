import { useState, useEffect } from 'react';
import { Shield, Calendar, FileSearch, Sparkles, CheckCircle2 } from 'lucide-react';
import Logo from './Logo';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />;
}

const TIMELINE_STEPS = [
  { icon: FileSearch, text: 'Analyzing your visa status' },
  { icon: Calendar, text: 'Calculating key deadlines' },
  { icon: Shield, text: 'Evaluating risk factors' },
  { icon: Sparkles, text: 'Building your personalized timeline' },
];

const FAKE_NODES = [
  { label: 'OPT Application Window', type: 'milestone' },
  { label: 'EAD Card Processing', type: 'deadline' },
  { label: 'H-1B Registration', type: 'deadline' },
  { label: 'Cap-Gap Extension', type: 'milestone' },
  { label: 'STEM OPT Extension', type: 'milestone' },
];

const FUN_FACTS = [
  'The H-1B visa was created by the Immigration Act of 1990',
  'Over 780,000 international students study in the US each year',
  'STEM OPT gives you up to 36 months of work authorization',
  'The H-1B lottery selection rate is around 25-30%',
  'F-1 students can work on-campus up to 20 hours per week',
  'Cap-exempt employers can hire H-1B workers year-round',
];

export function TimelineSkeleton() {
  const [activeStep, setActiveStep] = useState(0);
  const [visibleNodes, setVisibleNodes] = useState(0);
  const [progress, setProgress] = useState(0);
  const [factIdx, setFactIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep(prev => (prev < TIMELINE_STEPS.length - 1 ? prev + 1 : prev));
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleNodes(prev => (prev < FAKE_NODES.length ? prev + 1 : prev));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 92) return prev;
        return prev + (92 - prev) * 0.03 + 0.2;
      });
    }, 100);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setFactIdx(prev => (prev + 1) % FUN_FACTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-navy-950 flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-teal-400/[0.03] blur-[100px]" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-teal-400/20 particle-float"
            style={{
              left: `${12 + (i * 11) % 76}%`,
              top: `${18 + (i * 15) % 64}%`,
              animationDelay: `${i * 1.2}s`,
              animationDuration: `${5 + (i % 3) * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-3xl px-6">
        {/* Logo */}
        <div className="flex justify-center mb-8 animate-fade-in-up">
          <Logo size="default" />
        </div>

        {/* Central card */}
        <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="relative bg-navy-900/70 border border-navy-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
            {/* Top glow bar */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-teal-400/60 to-transparent" />

            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-white font-heading mb-1">
                  Generating Your Timeline
                </h2>
                <p className="text-sm text-slate-400">
                  Our AI is crafting your personalized immigration roadmap
                </p>
              </div>

              {/* Two columns: steps + timeline preview */}
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Left: Steps */}
                <div className="flex-1 space-y-2">
                  {TIMELINE_STEPS.map((step, i) => {
                    const done = i < activeStep;
                    const active = i === activeStep;
                    const Icon = step.icon;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all duration-700 ${
                          active
                            ? 'bg-teal-400/10 border border-teal-400/25'
                            : done
                              ? 'bg-navy-800/40 border border-navy-700/40'
                              : 'border border-transparent opacity-30'
                        }`}
                      >
                        <div className={`shrink-0 transition-all duration-500 ${
                          active ? 'text-teal-400' : done ? 'text-teal-400/50' : 'text-slate-600'
                        }`}>
                          {done ? <CheckCircle2 size={16} /> : <Icon size={16} className={active ? 'animate-pulse' : ''} />}
                        </div>
                        <span className={`text-[13px] transition-all duration-500 ${
                          active ? 'text-teal-400 font-medium' : done ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          {step.text}
                        </span>
                        {active && (
                          <div className="ml-auto flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1 h-1 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1 h-1 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Right: Mini timeline preview */}
                <div className="flex-1">
                  <div className="relative bg-navy-800/40 border border-navy-700/40 rounded-xl p-4 overflow-hidden">
                    {/* Scanning line */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      <div className="timeline-scan-line" />
                    </div>

                    <div className="relative">
                      {/* Mini timeline line */}
                      <div className="absolute left-[7px] top-1 bottom-1 w-[2px] bg-gradient-to-b from-teal-400/30 via-teal-400/15 to-transparent rounded-full" />

                      <div className="space-y-3">
                        {FAKE_NODES.map((node, i) => {
                          const visible = i < visibleNodes;
                          return (
                            <div
                              key={i}
                              className={`flex items-center gap-2.5 pl-5 relative transition-all duration-700 ${
                                visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-3'
                              }`}
                            >
                              {/* Dot */}
                              <div className={`absolute left-[3.5px] w-[9px] h-[9px] rounded-full border-2 border-navy-800 transition-all duration-500 ${
                                visible
                                  ? node.type === 'deadline'
                                    ? 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.4)]'
                                    : 'bg-teal-400 shadow-[0_0_6px_rgba(0,212,170,0.4)]'
                                  : 'bg-navy-700'
                              }`} />

                              {/* Card */}
                              <div className={`flex-1 rounded-md border px-3 py-2 transition-all duration-500 ${
                                visible
                                  ? 'bg-navy-800/50 border-navy-700/50'
                                  : 'bg-navy-800/20 border-navy-800/20'
                              }`}>
                                {visible ? (
                                  <>
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <span className={`text-[8px] font-bold uppercase px-1 py-0.5 rounded ${
                                        node.type === 'deadline'
                                          ? 'bg-amber-500/10 text-amber-400'
                                          : 'bg-teal-500/10 text-teal-400'
                                      }`}>
                                        {node.type === 'deadline' ? 'Deadline' : 'Milestone'}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-300 font-medium">{node.label}</p>
                                  </>
                                ) : (
                                  <>
                                    <div className="skeleton h-2 w-1/3 mb-1.5 rounded" />
                                    <div className="skeleton h-2 w-full rounded" />
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-slate-500">Analyzing & generating...</span>
                  <span className="text-[11px] text-teal-400 font-medium tabular-nums">{Math.round(progress)}%</span>
                </div>
                <div className="h-1 bg-navy-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 via-teal-400 to-teal-300 rounded-full transition-all duration-300 ease-out relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Fun fact ticker at bottom */}
            <div className="border-t border-navy-700/40 px-6 sm:px-8 py-3 bg-navy-800/30">
              <p className="text-[11px] text-slate-500 text-center transition-all duration-500">
                <span className="text-teal-400/60 mr-1.5">Did you know?</span>
                {FUN_FACTS[factIdx]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DocumentSkeleton() {
  return (
    <div className="divide-y divide-navy-700">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-start gap-4 p-4">
          <Skeleton className="w-5 h-5 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
