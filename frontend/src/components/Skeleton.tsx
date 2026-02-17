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
  { icon: FileSearch, text: 'Analyzing your visa status...' },
  { icon: Calendar, text: 'Calculating key deadlines...' },
  { icon: Shield, text: 'Evaluating risk factors...' },
  { icon: Sparkles, text: 'Building your personalized timeline...' },
];

// Fake timeline nodes that "appear" as the animation progresses
const FAKE_NODES = [
  { label: 'OPT Application Window', type: 'milestone' },
  { label: 'EAD Card Processing', type: 'deadline' },
  { label: 'H-1B Registration', type: 'deadline' },
  { label: 'Cap-Gap Extension', type: 'milestone' },
  { label: 'STEM OPT Extension', type: 'milestone' },
  { label: 'I-140 Filing', type: 'deadline' },
];

export function TimelineSkeleton() {
  const [activeStep, setActiveStep] = useState(0);
  const [visibleNodes, setVisibleNodes] = useState(0);
  const [progress, setProgress] = useState(0);

  // Progress steps
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep(prev => (prev < TIMELINE_STEPS.length - 1 ? prev + 1 : prev));
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  // Timeline nodes appearing
  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleNodes(prev => (prev < FAKE_NODES.length ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  // Smooth progress bar
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 92) return prev;
        return prev + (92 - prev) * 0.04 + 0.3;
      });
    }, 100);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-navy-950 flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-teal-400/[0.03] blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-teal-400/[0.02] blur-[100px]" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-teal-400/30 particle-float"
            style={{
              left: `${10 + (i * 7.5) % 80}%`,
              top: `${15 + (i * 13) % 70}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${4 + (i % 3) * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-2xl px-6">
        {/* Logo */}
        <div className="flex justify-center mb-10 animate-fade-in-up">
          <Logo size="default" />
        </div>

        {/* Main content area */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left: Steps */}
          <div className="flex-1 w-full">
            <h2 className="text-xl font-bold text-white font-heading mb-1 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              Generating Your Timeline
            </h2>
            <p className="text-sm text-slate-400 mb-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              Our AI is crafting your personalized immigration roadmap
            </p>

            <div className="space-y-3">
              {TIMELINE_STEPS.map((step, i) => {
                const done = i < activeStep;
                const active = i === activeStep;
                const Icon = step.icon;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-700 animate-fade-in-up ${
                      active
                        ? 'bg-teal-400/10 border border-teal-400/30'
                        : done
                          ? 'bg-navy-800/50 border border-navy-700/50'
                          : 'border border-transparent opacity-30'
                    }`}
                    style={{ animationDelay: `${400 + i * 100}ms` }}
                  >
                    <div className={`shrink-0 transition-all duration-500 ${
                      active ? 'text-teal-400' : done ? 'text-teal-400/60' : 'text-slate-600'
                    }`}>
                      {done ? <CheckCircle2 size={18} /> : <Icon size={18} className={active ? 'animate-pulse' : ''} />}
                    </div>
                    <span className={`text-sm transition-all duration-500 ${
                      active ? 'text-teal-400 font-medium' : done ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {step.text}
                    </span>
                    {active && (
                      <div className="ml-auto flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Animated timeline preview */}
          <div className="flex-1 w-full animate-fade-in-up" style={{ animationDelay: '600ms' }}>
            <div className="relative bg-navy-900/60 border border-navy-700/50 rounded-2xl p-5 overflow-hidden backdrop-blur-sm">
              {/* Scanning line effect */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="timeline-scan-line" />
              </div>

              <div className="relative">
                {/* Mini timeline line */}
                <div className="absolute left-[9px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-teal-400/40 via-teal-400/20 to-transparent rounded-full" />

                <div className="space-y-4">
                  {FAKE_NODES.map((node, i) => {
                    const visible = i < visibleNodes;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-3 pl-6 relative transition-all duration-700 ${
                          visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                        }`}
                      >
                        {/* Dot */}
                        <div className={`absolute left-[5px] w-[10px] h-[10px] rounded-full border-2 border-navy-900 transition-all duration-500 ${
                          visible
                            ? node.type === 'deadline'
                              ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                              : 'bg-teal-400 shadow-[0_0_8px_rgba(0,212,170,0.4)]'
                            : 'bg-navy-700'
                        }`} />

                        {/* Skeleton card */}
                        <div className={`flex-1 rounded-lg border p-3 transition-all duration-500 ${
                          visible
                            ? 'bg-navy-800/60 border-navy-700/60'
                            : 'bg-navy-800/20 border-navy-800/30'
                        }`}>
                          {visible ? (
                            <>
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded border ${
                                  node.type === 'deadline'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                                }`}>
                                  {node.type === 'deadline' ? 'Deadline' : 'Milestone'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 font-medium">{node.label}</p>
                              <div className="skeleton h-2 w-2/3 mt-1.5 rounded" />
                            </>
                          ) : (
                            <>
                              <div className="skeleton h-3 w-1/3 mb-2 rounded" />
                              <div className="skeleton h-2.5 w-full rounded" />
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
        <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '800ms' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">Analyzing & generating...</span>
            <span className="text-xs text-teal-400 font-medium tabular-nums">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-navy-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 via-teal-400 to-teal-300 rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 rounded-full" />
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
