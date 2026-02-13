import { useState } from 'react';
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import type { UserInput } from '../types';

interface OnboardingFormProps {
  onSubmit: (data: UserInput) => void;
  loading: boolean;
}

const VISA_TYPES = [
  { value: 'F-1', label: 'F-1 Student Visa' },
  { value: 'OPT', label: 'Post-Completion OPT' },
  { value: 'H-1B', label: 'H-1B Work Visa' },
  { value: 'J-1', label: 'J-1 Exchange Visitor' },
  { value: 'H-4', label: 'H-4 Dependent' },
  { value: 'L-1', label: 'L-1 Intracompany Transfer' },
];

const DEGREE_LEVELS = ["Bachelor's", "Master's", 'PhD'];

const CAREER_GOALS = [
  { value: 'stay_us_longterm', label: 'Stay in the US long-term' },
  { value: 'return_home', label: 'Return to home country' },
  { value: 'undecided', label: 'Not sure yet' },
];

const COUNTRIES = [
  'India', 'China', 'South Korea', 'Taiwan', 'Japan', 'Brazil',
  'Mexico', 'Nigeria', 'Canada', 'United Kingdom', 'Germany',
  'France', 'Vietnam', 'Nepal', 'Bangladesh', 'Pakistan',
  'Philippines', 'Colombia', 'Turkey', 'Iran', 'Other',
];

const TOTAL_STEPS = 4;

export default function OnboardingForm({ onSubmit, loading }: OnboardingFormProps) {
  const [step, setStep] = useState(1);
  const [slideDir, setSlideDir] = useState<'right' | 'left'>('right');
  const [animKey, setAnimKey] = useState(0);
  const [data, setData] = useState<UserInput>({
    visa_type: 'F-1',
    degree_level: "Master's",
    is_stem: true,
    program_start: '',
    expected_graduation: '',
    cpt_months_used: 0,
    currently_employed: false,
    career_goal: 'stay_us_longterm',
    country: 'India',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update(field: keyof UserInput, value: string | number | boolean) {
    setData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  }

  function validateStep(): boolean {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!data.visa_type) newErrors.visa_type = 'Please select your visa type';
      if (!data.country) newErrors.country = 'Please select your country';
    }

    if (step === 2) {
      if (!data.degree_level) newErrors.degree_level = 'Please select your degree level';
    }

    if (step === 3) {
      if (!data.program_start) newErrors.program_start = 'Please enter your program start date';
      if (!data.expected_graduation) newErrors.expected_graduation = 'Please enter your expected graduation date';
      if (data.program_start && data.expected_graduation && data.program_start >= data.expected_graduation) {
        newErrors.expected_graduation = 'Graduation must be after program start';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    if (!validateStep()) return;
    if (step < TOTAL_STEPS) {
      setSlideDir('right');
      setAnimKey(k => k + 1);
      setStep(step + 1);
    } else {
      onSubmit(data);
    }
  }

  function handleBack() {
    setSlideDir('left');
    setAnimKey(k => k + 1);
    setStep(step - 1);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      {/* Background gradient accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-teal-400/5 rounded-full blur-3xl pointer-events-none" />
      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-10 h-10 rounded-xl bg-teal-400 flex items-center justify-center text-navy-950 font-extrabold text-lg">
              VP
            </span>
          </div>
          <h1 className="text-3xl font-bold font-heading text-white">
            Welcome to VisaPath
          </h1>
          <p className="text-slate-400 mt-2">
            Tell us about your situation and we'll build your personalized immigration timeline
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className="flex-1 flex items-center gap-2">
              <div
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i + 1 <= step ? 'bg-teal-400' : 'bg-navy-700'
                }`}
              />
            </div>
          ))}
          <span className="text-xs text-slate-500 ml-2">
            {step}/{TOTAL_STEPS}
          </span>
        </div>

        <div className="bg-navy-900 rounded-2xl border border-navy-700 p-8 overflow-hidden">
          <div key={animKey} className={slideDir === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left'}>
          {/* Step 1: Visa & Country */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white font-heading">
                Visa Status & Nationality
              </h2>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Current Visa Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {VISA_TYPES.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => update('visa_type', value)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-all border cursor-pointer ${
                        data.visa_type === value
                          ? 'bg-teal-400/10 border-teal-400 text-teal-400'
                          : 'bg-navy-800 border-navy-700 text-slate-300 hover:border-navy-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {errors.visa_type && <p className="text-red-400 text-xs mt-1">{errors.visa_type}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Country of Citizenship
                </label>
                <select
                  value={data.country}
                  onChange={e => update('country', e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-400 transition-colors"
                >
                  {COUNTRIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.country && <p className="text-red-400 text-xs mt-1">{errors.country}</p>}
              </div>
            </div>
          )}

          {/* Step 2: Academic Info */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white font-heading">
                Academic Information
              </h2>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Degree Level
                </label>
                <div className="flex gap-2">
                  {DEGREE_LEVELS.map(level => (
                    <button
                      key={level}
                      onClick={() => update('degree_level', level)}
                      className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all border cursor-pointer ${
                        data.degree_level === level
                          ? 'bg-teal-400/10 border-teal-400 text-teal-400'
                          : 'bg-navy-800 border-navy-700 text-slate-300 hover:border-navy-600'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                {errors.degree_level && <p className="text-red-400 text-xs mt-1">{errors.degree_level}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Is your major STEM-designated?
                </label>
                <div className="flex gap-2">
                  {[true, false].map(val => (
                    <button
                      key={String(val)}
                      onClick={() => update('is_stem', val)}
                      className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all border cursor-pointer ${
                        data.is_stem === val
                          ? 'bg-teal-400/10 border-teal-400 text-teal-400'
                          : 'bg-navy-800 border-navy-700 text-slate-300 hover:border-navy-600'
                      }`}
                    >
                      {val ? 'Yes, STEM' : 'No, Non-STEM'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Months of full-time CPT used
                </label>
                <input
                  type="number"
                  min={0}
                  max={36}
                  value={data.cpt_months_used}
                  onChange={e => update('cpt_months_used', parseInt(e.target.value) || 0)}
                  className="w-full bg-navy-800 border border-navy-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-400 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Step 3: Program Dates */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white font-heading">
                Program Dates
              </h2>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Program Start Date
                </label>
                <input
                  type="date"
                  value={data.program_start}
                  onChange={e => update('program_start', e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-400 transition-colors [color-scheme:dark]"
                />
                {errors.program_start && <p className="text-red-400 text-xs mt-1">{errors.program_start}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Expected Graduation Date
                </label>
                <input
                  type="date"
                  value={data.expected_graduation}
                  onChange={e => update('expected_graduation', e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-400 transition-colors [color-scheme:dark]"
                />
                {errors.expected_graduation && <p className="text-red-400 text-xs mt-1">{errors.expected_graduation}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Are you currently employed?
                </label>
                <div className="flex gap-2">
                  {[true, false].map(val => (
                    <button
                      key={String(val)}
                      onClick={() => update('currently_employed', val)}
                      className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all border cursor-pointer ${
                        data.currently_employed === val
                          ? 'bg-teal-400/10 border-teal-400 text-teal-400'
                          : 'bg-navy-800 border-navy-700 text-slate-300 hover:border-navy-600'
                      }`}
                    >
                      {val ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Career Goals */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white font-heading">
                Career Goals
              </h2>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  What's your long-term plan?
                </label>
                <div className="space-y-2">
                  {CAREER_GOALS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => update('career_goal', value)}
                      className={`w-full px-4 py-4 rounded-lg text-sm font-medium transition-all border text-left cursor-pointer ${
                        data.career_goal === value
                          ? 'bg-teal-400/10 border-teal-400 text-teal-400'
                          : 'bg-navy-800 border-navy-700 text-slate-300 hover:border-navy-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          </div>
          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-navy-700">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={handleNext}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-teal-400 text-navy-950 rounded-lg font-semibold text-sm hover:bg-teal-500 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Building Timeline...
                </>
              ) : step < TOTAL_STEPS ? (
                <>
                  Continue
                  <ChevronRight size={16} />
                </>
              ) : (
                'Generate My Timeline'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
