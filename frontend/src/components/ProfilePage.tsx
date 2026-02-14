import { User, GraduationCap, Calendar, Briefcase, Target, Pencil } from 'lucide-react';
import type { UserInput } from '../types';
import EmptyState from './EmptyState';

interface ProfilePageProps {
  profile: UserInput | null;
  onEdit: () => void;
  onStartOnboarding: () => void;
}

const VISA_LABELS: Record<string, string> = {
  'F-1': 'F-1 Student Visa',
  'OPT': 'Post-Completion OPT',
  'H-1B': 'H-1B Work Visa',
  'J-1': 'J-1 Exchange Visitor',
  'H-4': 'H-4 Dependent',
  'L-1': 'L-1 Intracompany Transfer',
};

const CAREER_LABELS: Record<string, string> = {
  stay_us_longterm: 'Stay in the US long-term',
  return_home: 'Return to home country',
  undecided: 'Not sure yet',
};

const OPT_LABELS: Record<string, string> = {
  none: 'Not applied yet',
  applied: 'Applied (pending)',
  active: 'Active (have EAD)',
  expired: 'Expired',
};

function Field({ label, value }: { label: string; value: string | number | boolean | undefined }) {
  if (value === undefined || value === '') return null;
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  return (
    <div>
      <dt className="text-xs text-slate-500 mb-0.5">{label}</dt>
      <dd className="text-sm text-slate-200">{display}</dd>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <div className="bg-navy-900 rounded-xl border border-navy-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} className="text-teal-400" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
        {children}
      </dl>
    </div>
  );
}

export default function ProfilePage({ profile, onEdit, onStartOnboarding }: ProfilePageProps) {
  if (!profile) {
    return (
      <EmptyState
        icon={<User size={22} className="text-slate-500" />}
        title="No profile yet"
        description="Complete the onboarding form to set up your immigration profile."
        action={{ label: 'Start Onboarding', onClick: onStartOnboarding }}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white font-heading">Your Profile</h2>
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border cursor-pointer bg-navy-800 border-navy-700 text-slate-300 hover:border-teal-400 hover:text-teal-400"
        >
          <Pencil size={14} />
          Edit Profile
        </button>
      </div>

      <Section title="Visa & Nationality" icon={User}>
        <Field label="Visa Type" value={VISA_LABELS[profile.visa_type] || profile.visa_type} />
        <Field label="Country" value={profile.country} />
      </Section>

      <Section title="Academic" icon={GraduationCap}>
        <Field label="Degree Level" value={profile.degree_level} />
        <Field label="STEM Designated" value={profile.is_stem} />
        <Field label="Major / Field" value={profile.major_field} />
        <Field label="CPT Months Used" value={profile.cpt_months_used} />
      </Section>

      <Section title="Dates & Employment" icon={Calendar}>
        <Field label="Program Start" value={profile.program_start} />
        <Field label="Expected Graduation" value={profile.expected_graduation} />
        <Field label="Currently Employed" value={profile.currently_employed} />
        <Field label="Program Extended" value={profile.program_extended} />
        {profile.program_extended && (
          <Field label="Original Graduation" value={profile.original_graduation} />
        )}
        <Field label="Has Job Offer" value={profile.has_job_offer} />
      </Section>

      {(profile.visa_type === 'F-1' || profile.visa_type === 'OPT') && (
        <Section title="OPT & H-1B" icon={Briefcase}>
          <Field label="OPT Status" value={OPT_LABELS[profile.opt_status || ''] || profile.opt_status} />
          <Field label="Unemployment Days" value={profile.unemployment_days} />
          <Field label="H-1B Lottery Attempts" value={profile.h1b_attempts} />
        </Section>
      )}

      <Section title="Career Goals" icon={Target}>
        <Field label="Long-term Plan" value={CAREER_LABELS[profile.career_goal] || profile.career_goal} />
      </Section>
    </div>
  );
}
