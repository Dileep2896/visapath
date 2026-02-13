export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  type: 'deadline' | 'milestone' | 'risk';
  urgency: 'critical' | 'high' | 'medium' | 'low' | 'none' | 'passed';
  description: string;
  action_items: string[];
  is_past: boolean;
}

export interface RiskAlert {
  type: string;
  severity: 'critical' | 'high' | 'warning' | 'info';
  message: string;
  recommendation: string;
}

export interface CurrentStatus {
  visa: string;
  work_auth: string;
  days_until_next_deadline?: number;
  next_deadline?: string;
}

export interface TimelineResponse {
  timeline_events: TimelineEvent[];
  risk_alerts: RiskAlert[];
  current_status: CurrentStatus;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  has_sources?: boolean;
}

export interface ChatResponse {
  response: string;
  has_sources: boolean;
}

export interface DocumentItem {
  name: string;
  description: string;
  where_to_get: string;
}

export interface DocumentStep {
  step: string;
  documents: DocumentItem[];
}

export interface UserInput {
  visa_type: string;
  degree_level: string;
  is_stem: boolean;
  program_start: string;
  expected_graduation: string;
  cpt_months_used: number;
  currently_employed: boolean;
  career_goal: string;
  country: string;
}

export type AppView = 'onboarding' | 'timeline' | 'chat' | 'documents';
