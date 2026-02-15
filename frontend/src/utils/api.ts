import type { UserInput, TimelineResponse, ChatResponse, AuthUser, SavedTimeline } from '../types';

const API_BASE = '/api';

// --- Token helpers ---
const TOKEN_KEY = 'visapath_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// --- Auth fetch wrapper ---
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
}

// --- Auth API ---
export async function register(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.detail || 'Registration failed');
  }
  const data = await res.json();
  setToken(data.token);
  return data;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.detail || 'Login failed');
  }
  const data = await res.json();
  setToken(data.token);
  return data;
}

export async function getMe(): Promise<{ id: number; email: string; profile: UserInput | null; cached_timeline: TimelineResponse | null; cached_tax_guide: Record<string, unknown> | null } | null> {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await authFetch(`${API_BASE}/auth/me`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function saveProfile(profile: UserInput): Promise<void> {
  await authFetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    body: JSON.stringify({ profile }),
  });
}

export async function saveCachedTimeline(timelineResponse: TimelineResponse): Promise<void> {
  await authFetch(`${API_BASE}/auth/cached-timeline`, {
    method: 'PUT',
    body: JSON.stringify({ timeline_response: timelineResponse }),
  });
}

export async function saveCachedTaxGuide(taxGuide: Record<string, unknown>): Promise<void> {
  await authFetch(`${API_BASE}/auth/cached-tax-guide`, {
    method: 'PUT',
    body: JSON.stringify({ tax_guide: taxGuide }),
  });
}

export async function saveTimeline(
  userInput: UserInput,
  timelineResponse: TimelineResponse,
): Promise<SavedTimeline> {
  const res = await authFetch(`${API_BASE}/auth/save-timeline`, {
    method: 'POST',
    body: JSON.stringify({ user_input: userInput, timeline_response: timelineResponse }),
  });
  if (!res.ok) throw new Error('Failed to save timeline');
  return res.json();
}

export async function getMyTimelines(): Promise<SavedTimeline[]> {
  const res = await authFetch(`${API_BASE}/auth/my-timelines`);
  if (!res.ok) throw new Error('Failed to fetch timelines');
  const data = await res.json();
  return data.timelines;
}

// --- Credit pre-check ---
export async function checkRateLimit(): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  try {
    const res = await authFetch(`${API_BASE}/credits`);
    if (!res.ok) return { allowed: true, remaining: 999, limit: 999 }; // fail-open
    return res.json();
  } catch {
    return { allowed: true, remaining: 999, limit: 999 }; // fail-open on network error
  }
}

// --- Timeline generation (auth required, uses credits) ---
export async function generateTimeline(input: UserInput): Promise<TimelineResponse> {
  let res: Response;
  try {
    res = await authFetch(`${API_BASE}/generate-timeline`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error('Network error — check your connection and try again.');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    if (res.status === 429) {
      throw new Error(data?.detail || 'No credits remaining. You have 5 timeline generations.');
    }
    if (res.status === 401) {
      throw new Error('Session expired — please log out and log back in.');
    }
    throw new Error(data?.detail || `Timeline generation failed (${res.status}). Please try again.`);
  }
  return res.json();
}

export async function sendChatMessage(
  message: string,
  userContext: Partial<UserInput> | null,
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, user_context: userContext }),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}

export async function getTaxGuide(userContext: UserInput) {
  const body = {
    visa_type: userContext.visa_type,
    country: userContext.country,
    has_income: userContext.currently_employed || false,
    income_types: userContext.currently_employed ? ['wages'] : [],
    years_in_us: 1,
  };

  // Estimate years in US from program_start
  if (userContext.program_start) {
    const start = new Date(userContext.program_start);
    const now = new Date();
    body.years_in_us = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000)));
  }

  const res = await fetch(`${API_BASE}/tax-guide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    if (res.status === 429) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.detail || 'Rate limit reached \u2014 free tier allows 20 AI requests/day. Please wait and try again.');
    }
    throw new Error('Failed to get tax guide. Please try again.');
  }
  return res.json();
}

export async function getRequiredDocuments(step?: string) {
  const url = step
    ? `${API_BASE}/required-documents?step=${step}`
    : `${API_BASE}/required-documents`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}
