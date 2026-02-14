import { useState } from 'react';
import { SlidersHorizontal, ChevronDown, RotateCcw, Zap } from 'lucide-react';
import type { UserInput } from '../types';
import DatePicker from './DatePicker';

interface WhatIfPanelProps {
  baseProfile: UserInput;
  onSimulate: (modified: UserInput) => void;
  onReset: () => void;
  loading: boolean;
  isModified: boolean;
}

export default function WhatIfPanel({ baseProfile, onSimulate, onReset, loading, isModified }: WhatIfPanelProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<UserInput>({ ...baseProfile });

  function update<K extends keyof UserInput>(key: K, value: UserInput[K]) {
    setDraft(prev => ({ ...prev, [key]: value }));
  }

  function handleSimulate() {
    onSimulate(draft);
  }

  function handleReset() {
    setDraft({ ...baseProfile });
    onReset();
  }

  return (
    <div className="rounded-xl border border-navy-700 bg-navy-900/80 overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-navy-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-teal-400" />
          <span className="text-sm font-medium text-white">What-If Scenarios</span>
          {isModified && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium uppercase tracking-wider">
              Modified
            </span>
          )}
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Collapsible body */}
      <div className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-1 border-t border-navy-700/50 space-y-4">
            <p className="text-xs text-slate-400">
              Tweak these parameters to see how changes affect your timeline.
            </p>

            {/* Graduation date */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Expected Graduation</label>
              <DatePicker
                value={draft.expected_graduation}
                onChange={v => update('expected_graduation', v)}
                placeholder="Select date"
              />
            </div>

            {/* Two-column grid for toggles */}
            <div className="grid grid-cols-2 gap-3">
              {/* STEM */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">STEM Major</label>
                <div className="flex gap-1.5">
                  {([true, false] as const).map(val => (
                    <button
                      key={String(val)}
                      onClick={() => update('is_stem', val)}
                      className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                        draft.is_stem === val
                          ? 'bg-teal-400/10 border-teal-400 text-teal-400'
                          : 'bg-navy-800 border-navy-700 text-slate-400 hover:border-navy-600'
                      }`}
                    >
                      {val ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Job offer */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Job Offer</label>
                <div className="flex gap-1.5">
                  {([true, false] as const).map(val => (
                    <button
                      key={String(val)}
                      onClick={() => update('has_job_offer', val)}
                      className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                        draft.has_job_offer === val
                          ? 'bg-teal-400/10 border-teal-400 text-teal-400'
                          : 'bg-navy-800 border-navy-700 text-slate-400 hover:border-navy-600'
                      }`}
                    >
                      {val ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Currently employed */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Employed</label>
                <div className="flex gap-1.5">
                  {([true, false] as const).map(val => (
                    <button
                      key={String(val)}
                      onClick={() => update('currently_employed', val)}
                      className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                        draft.currently_employed === val
                          ? 'bg-teal-400/10 border-teal-400 text-teal-400'
                          : 'bg-navy-800 border-navy-700 text-slate-400 hover:border-navy-600'
                      }`}
                    >
                      {val ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Program extended */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Program Extended</label>
                <div className="flex gap-1.5">
                  {([true, false] as const).map(val => (
                    <button
                      key={String(val)}
                      onClick={() => update('program_extended', val)}
                      className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                        draft.program_extended === val
                          ? 'bg-teal-400/10 border-teal-400 text-teal-400'
                          : 'bg-navy-800 border-navy-700 text-slate-400 hover:border-navy-600'
                      }`}
                    >
                      {val ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* CPT months */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Full-Time CPT Months Used: <span className="text-white font-semibold">{draft.cpt_months_used}</span>
              </label>
              <input
                type="range"
                min={0}
                max={36}
                value={draft.cpt_months_used}
                onChange={e => update('cpt_months_used', parseInt(e.target.value))}
                className="w-full accent-teal-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>0</span>
                <span className={draft.cpt_months_used >= 12 ? 'text-red-400 font-medium' : ''}>
                  12 (OPT cutoff)
                </span>
                <span>36</span>
              </div>
            </div>

            {/* H-1B attempts */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                H-1B Lottery Attempts: <span className="text-white font-semibold">{draft.h1b_attempts ?? 0}</span>
              </label>
              <input
                type="range"
                min={0}
                max={6}
                value={draft.h1b_attempts ?? 0}
                onChange={e => update('h1b_attempts', parseInt(e.target.value))}
                className="w-full accent-teal-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>0</span>
                <span>3</span>
                <span>6</span>
              </div>
            </div>

            {/* OPT status */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">OPT Status</label>
              <div className="flex gap-1.5 flex-wrap">
                {(['none', 'applied', 'active', 'expired'] as const).map(val => (
                  <button
                    key={val}
                    onClick={() => update('opt_status', val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                      draft.opt_status === val
                        ? 'bg-teal-400/10 border-teal-400 text-teal-400'
                        : 'bg-navy-800 border-navy-700 text-slate-400 hover:border-navy-600'
                    }`}
                  >
                    {val === 'none' ? 'Not applied' : val === 'applied' ? 'Pending' : val === 'active' ? 'Active (EAD)' : 'Expired'}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSimulate}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-teal-400/10 border border-teal-400 text-teal-400 hover:bg-teal-400/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Zap size={14} />
                {loading ? 'Recalculating...' : 'Recalculate Timeline'}
              </button>
              {isModified && (
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-navy-800 border border-navy-700 text-slate-400 hover:text-white hover:border-navy-600 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw size={14} />
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
