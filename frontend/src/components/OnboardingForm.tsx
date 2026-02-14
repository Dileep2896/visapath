import { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Loader2, Minus, Plus, Search } from 'lucide-react';
import type { UserInput } from '../types';
import Logo from './Logo';
import DatePicker from './DatePicker';

interface OnboardingFormProps {
  onSubmit: (data: UserInput) => void;
  loading: boolean;
  initialData?: UserInput | null;
  initialStep?: number;
  onSaveDraft?: (data: UserInput, step: number) => void;
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

const OPT_STATUSES = [
  { value: 'none', label: 'Not applied yet' },
  { value: 'applied', label: 'Applied (pending)' },
  { value: 'active', label: 'Active (have EAD)' },
  { value: 'expired', label: 'Expired' },
];

const COMMON_MAJORS = [
  'Computer Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Data Science',
  'Information Technology',
  'Software Engineering',
  'Biomedical Engineering',
  'Mathematics',
  'Statistics',
  'Physics',
  'Biology',
  'Chemistry',
  'Business Administration',
  'Finance',
  'Accounting',
  'Economics',
  'Marketing',
  'Management',
  'Public Health',
  'Nursing',
  'Pharmacy',
  'Psychology',
  'Education',
  'Architecture',
  'Environmental Science',
  'Political Science',
  'Communications',
  'Graphic Design',
];

function Stepper({ value, min, max, onChange, suffix }: {
  value: number; min: number; max: number; onChange: (v: number) => void; suffix?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-10 h-10 rounded-lg bg-navy-800 border border-navy-700 flex items-center justify-center text-slate-300 hover:border-teal-400 hover:text-teal-400 transition-all disabled:opacity-30 disabled:hover:border-navy-700 disabled:hover:text-slate-300 cursor-pointer"
      >
        <Minus size={16} />
      </button>
      <div className="flex-1 text-center bg-navy-800 border border-navy-700 rounded-lg py-2.5 px-4">
        <span className="text-lg font-semibold text-white">{value}</span>
        {suffix && <span className="text-sm text-slate-400 ml-1">{suffix}</span>}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-10 h-10 rounded-lg bg-navy-800 border border-navy-700 flex items-center justify-center text-slate-300 hover:border-teal-400 hover:text-teal-400 transition-all disabled:opacity-30 disabled:hover:border-navy-700 disabled:hover:text-slate-300 cursor-pointer"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

function MajorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = COMMON_MAJORS.filter(m =>
    m.toLowerCase().includes((search || value).toLowerCase())
  );

  function select(major: string) {
    onChange(major);
    setSearch('');
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Major / Field of Study
      </label>
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={open ? search : value}
          onChange={e => { setSearch(e.target.value); onChange(e.target.value); if (!open) setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search or type your major..."
          className="w-full bg-navy-800 border border-navy-700 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 transition-colors"
        />
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-navy-800 border border-navy-700 rounded-lg shadow-2xl shadow-black/40 max-h-48 overflow-y-auto">
          {filtered.length > 0 ? filtered.map(major => (
            <button
              key={major}
              type="button"
              onClick={() => select(major)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                value === major
                  ? 'bg-teal-400/10 text-teal-400'
                  : 'text-slate-300 hover:bg-navy-700'
              }`}
            >
              {major}
            </button>
          )) : (
            <div className="px-4 py-3 text-xs text-slate-500">
              No matches — your custom entry will be used
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const DEFAULTS: UserInput = {
  visa_type: 'F-1',
  degree_level: "Master's",
  is_stem: true,
  program_start: '',
  expected_graduation: '',
  cpt_months_used: 0,
  currently_employed: false,
  career_goal: 'stay_us_longterm',
  country: 'India',
  major_field: '',
  opt_status: 'none',
  program_extended: false,
  original_graduation: '',
  h1b_attempts: 0,
  unemployment_days: 0,
  has_job_offer: false,
};

export default function OnboardingForm({ onSubmit, loading, initialData, initialStep, onSaveDraft }: OnboardingFormProps) {
  const isEditing = !!initialData;
  const [step, setStep] = useState(initialStep ?? 1);
  const [slideDir, setSlideDir] = useState<'right' | 'left'>('right');
  const [animKey, setAnimKey] = useState(0);
  const [data, setData] = useState<UserInput>(initialData ?? DEFAULTS);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const showOPTStep = data.visa_type === 'F-1' || data.visa_type === 'OPT';
  const totalSteps = showOPTStep ? 5 : 4;

  // Map display step to logical step
  // Steps: 1=Visa/Country, 2=Academic, 3=Dates/Employment, 4=OPT(conditional), 5(or 4)=Career Goals
  function getLogicalStep() {
    if (!showOPTStep && step >= 4) return 'career';
    if (showOPTStep && step === 4) return 'opt';
    if (showOPTStep && step === 5) return 'career';
    if (step === 1) return 'visa';
    if (step === 2) return 'academic';
    if (step === 3) return 'dates';
    return 'career';
  }

  const logicalStep = getLogicalStep();

  function update(field: keyof UserInput, value: string | number | boolean) {
    setData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  }

  function validateStep(): boolean {
    const newErrors: Record<string, string> = {};

    if (logicalStep === 'visa') {
      if (!data.visa_type) newErrors.visa_type = 'Please select your visa type';
      if (!data.country) newErrors.country = 'Please select your country';
    }

    if (logicalStep === 'academic') {
      if (!data.degree_level) newErrors.degree_level = 'Please select your degree level';
    }

    if (logicalStep === 'dates') {
      if (!data.program_start) newErrors.program_start = 'Please enter your program start date';
      if (!data.expected_graduation) newErrors.expected_graduation = 'Please enter your expected graduation date';
      if (data.program_start && data.expected_graduation && data.program_start >= data.expected_graduation) {
        newErrors.expected_graduation = 'Graduation must be after program start';
      }
      if (data.program_extended && !data.original_graduation) {
        newErrors.original_graduation = 'Please enter your original graduation date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    if (!validateStep()) return;
    if (step < totalSteps) {
      const nextStep = step + 1;
      setSlideDir('right');
      setAnimKey(k => k + 1);
      setStep(nextStep);
      onSaveDraft?.(data, nextStep);
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
        <div className="flex flex-col items-center mb-10">
          <div className="mb-4">
            <Logo size="default" />
          </div>
          <p className="text-slate-400 mt-2">
            Tell us about your situation and we'll build your personalized immigration timeline
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i + 1 <= step ? 'bg-teal-400' : 'bg-navy-700'
                }`}
              />
            </div>
          ))}
          <span className="text-xs text-slate-500 ml-2">
            {step}/{totalSteps}
          </span>
        </div>

        <div className="bg-navy-900 rounded-2xl border border-navy-700 p-8 overflow-visible">
          <div key={animKey} className={slideDir === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left'}>
          {/* Step 1: Visa & Country */}
          {logicalStep === 'visa' && (
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
          {logicalStep === 'academic' && (
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
              <MajorPicker value={data.major_field || ''} onChange={v => update('major_field', v)} />
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Months of full-time CPT used
                </label>
                <Stepper
                  value={data.cpt_months_used}
                  min={0}
                  max={36}
                  onChange={v => update('cpt_months_used', v)}
                  suffix={data.cpt_months_used === 1 ? ' month' : ' months'}
                />
              </div>
            </div>
          )}

          {/* Step 3: Program Dates & Employment */}
          {logicalStep === 'dates' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white font-heading">
                Program Dates & Employment
              </h2>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Program Start Date
                </label>
                <DatePicker
                  value={data.program_start}
                  onChange={v => update('program_start', v)}
                  placeholder="Select start date"
                />
                {errors.program_start && <p className="text-red-400 text-xs mt-1">{errors.program_start}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Expected Graduation Date
                </label>
                <DatePicker
                  value={data.expected_graduation}
                  onChange={v => update('expected_graduation', v)}
                  placeholder="Select graduation date"
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
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Was your program extended?
                </label>
                <div className="flex gap-2">
                  {[true, false].map(val => (
                    <button
                      key={String(val)}
                      onClick={() => update('program_extended', val)}
                      className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all border cursor-pointer ${
                        data.program_extended === val
                          ? 'bg-teal-400/10 border-teal-400 text-teal-400'
                          : 'bg-navy-800 border-navy-700 text-slate-300 hover:border-navy-600'
                      }`}
                    >
                      {val ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>
              {data.program_extended && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Original Graduation Date (before extension)
                  </label>
                  <DatePicker
                    value={data.original_graduation || ''}
                    onChange={v => update('original_graduation', v)}
                    placeholder="Select original date"
                  />
                  {errors.original_graduation && <p className="text-red-400 text-xs mt-1">{errors.original_graduation}</p>}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Do you have a job or job offer?
                </label>
                <div className="flex gap-2">
                  {[true, false].map(val => (
                    <button
                      key={String(val)}
                      onClick={() => update('has_job_offer', val)}
                      className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all border cursor-pointer ${
                        data.has_job_offer === val
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

          {/* Step 4 (OPT-specific): OPT Status, Unemployment, H-1B Attempts */}
          {logicalStep === 'opt' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white font-heading">
                OPT & H-1B Details
              </h2>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Current OPT Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {OPT_STATUSES.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => update('opt_status', value)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-all border cursor-pointer ${
                        data.opt_status === value
                          ? 'bg-teal-400/10 border-teal-400 text-teal-400'
                          : 'bg-navy-800 border-navy-700 text-slate-300 hover:border-navy-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Unemployment days used (during OPT)
                </label>
                <Stepper
                  value={data.unemployment_days || 0}
                  min={0}
                  max={data.is_stem ? 150 : 90}
                  onChange={v => update('unemployment_days', v)}
                  suffix={data.unemployment_days === 1 ? ' day' : ' days'}
                />
                <p className="text-xs text-slate-500 mt-2">
                  Max {data.is_stem ? '150' : '90'} days allowed ({data.is_stem ? 'STEM OPT' : 'regular OPT'})
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Prior H-1B lottery attempts
                </label>
                <Stepper
                  value={data.h1b_attempts || 0}
                  min={0}
                  max={10}
                  onChange={v => update('h1b_attempts', v)}
                  suffix={data.h1b_attempts === 1 ? ' attempt' : ' attempts'}
                />
              </div>
            </div>
          )}

          {/* Career Goals (final step) */}
          {logicalStep === 'career' && (
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
              ) : step < totalSteps ? (
                <>
                  Continue
                  <ChevronRight size={16} />
                </>
              ) : isEditing ? (
                'Update & Regenerate Timeline'
              ) : (
                'Generate My Timeline'
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          VisaPath provides general immigration information only. Always consult your DSO or an immigration attorney for legal advice.
        </p>
      </div>
    </div>
  );
}
