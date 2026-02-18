import type { UserInput, TimelineResponse, ChatResponse, AuthUser, SavedTimeline } from '../types';

const API_BASE = '/api';
const DEFAULT_TIMEOUT = 60_000; // 60s for most requests
const AI_TIMEOUT = 120_000; // 120s for AI generation calls

// --- Token helpers ---
const TOKEN_KEY = 'visapath_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  // Clear all visapath-related localStorage keys
  const keys = Object.keys(localStorage).filter(k => k.startsWith('visapath_'));
  keys.forEach(k => localStorage.removeItem(k));
}

// --- Fetch with timeout ---
function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = DEFAULT_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

// --- Auth fetch wrapper ---
async function authFetch(url: string, options: RequestInit = {}, timeout = DEFAULT_TIMEOUT): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetchWithTimeout(url, { ...options, headers }, timeout);
  // Global 401 handling — session expired
  if (res.status === 401) {
    clearToken();
    throw new Error('Session expired — please log in again.');
  }
  return res;
}

// --- Auth API ---
export async function register(email: string, password: string): Promise<AuthUser> {
  const res = await fetchWithTimeout(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.detail || 'Registration failed');
  }
  const data = await res.json();
  setToken(data.token);
  return data;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await fetchWithTimeout(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.detail || 'Login failed');
  }
  const data = await res.json();
  setToken(data.token);
  return data;
}

export async function demoLogin(): Promise<AuthUser> {
  const res = await fetchWithTimeout(`${API_BASE}/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.detail || 'Demo login failed');
  }
  const data = await res.json();
  setToken(data.token);
  return data;
}

export async function getMe(): Promise<{ id: number; email: string; profile: UserInput | null; cached_timeline: TimelineResponse | null; cached_tax_guide: Record<string, unknown> | null; is_admin?: boolean } | null> {
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
  try {
    const res = await authFetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      body: JSON.stringify({ profile }),
    });
    if (!res.ok) {
      console.warn('Failed to save profile:', res.status);
    }
  } catch (e) {
    // Swallow session-expired errors for background saves
    console.warn('Profile save failed:', e);
  }
}

export async function saveCachedTimeline(timelineResponse: TimelineResponse): Promise<void> {
  try {
    const res = await authFetch(`${API_BASE}/auth/cached-timeline`, {
      method: 'PUT',
      body: JSON.stringify({ timeline_response: timelineResponse }),
    });
    if (!res.ok) {
      console.warn('Failed to cache timeline:', res.status);
    }
  } catch (e) {
    console.warn('Timeline cache save failed:', e);
  }
}

export async function saveCachedTaxGuide(taxGuide: Record<string, unknown>): Promise<void> {
  try {
    const res = await authFetch(`${API_BASE}/auth/cached-tax-guide`, {
      method: 'PUT',
      body: JSON.stringify({ tax_guide: taxGuide }),
    });
    if (!res.ok) {
      console.warn('Failed to cache tax guide:', res.status);
    }
  } catch (e) {
    console.warn('Tax guide cache save failed:', e);
  }
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
    if (!res.ok) return { allowed: true, remaining: -1, limit: -1 }; // -1 = unknown
    return res.json();
  } catch {
    return { allowed: true, remaining: -1, limit: -1 }; // -1 = unknown, still allow attempt
  }
}

// --- Timeline generation (auth required, uses credits) ---
export async function generateTimeline(input: UserInput): Promise<TimelineResponse> {
  let res: Response;
  try {
    // Send user's local date so the AI uses the correct "today"
    const localDate = new Date();
    const userToday = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
    res = await authFetch(`${API_BASE}/generate-timeline`, {
      method: 'POST',
      body: JSON.stringify({ ...input, user_today: userToday }),
    }, AI_TIMEOUT);
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out — the AI service is slow. Please try again.');
    }
    throw new Error('Network error — check your connection and try again.');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    if (res.status === 429) {
      throw new Error(data?.detail || 'No credits remaining. You have 5 timeline generations.');
    }
    throw new Error(data?.detail || `Timeline generation failed (${res.status}). Please try again.`);
  }
  return res.json();
}

export async function sendChatMessage(
  message: string,
  userContext: Partial<UserInput> | null,
): Promise<ChatResponse> {
  const res = await authFetch(`${API_BASE}/chat`, {
    method: 'POST',
    body: JSON.stringify({ message, user_context: userContext }),
  }, AI_TIMEOUT);
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.detail || 'Failed to send message');
  }
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
    body.years_in_us = Math.max(1, Math.round((now.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000)));
  }

  const res = await authFetch(`${API_BASE}/tax-guide`, {
    method: 'POST',
    body: JSON.stringify(body),
  }, AI_TIMEOUT);
  if (!res.ok) {
    if (res.status === 429) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.detail || 'Rate limit reached. Please wait and try again.');
    }
    throw new Error('Failed to get tax guide. Please try again.');
  }
  return res.json();
}

export async function getRequiredDocuments(step?: string) {
  const url = step
    ? `${API_BASE}/required-documents?step=${encodeURIComponent(step)}`
    : `${API_BASE}/required-documents`;
  const res = await authFetch(url);
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}

// --- Admin API ---
export async function adminGetUsers(): Promise<{ users: Array<{ id: number; email: string; credits_used: number; credit_limit: number; is_admin: number; created_at: string }>; total: number }> {
  const res = await authFetch(`${API_BASE}/admin/users`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function adminDeleteUser(userId: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/admin/users/${userId}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.detail || 'Failed to delete user');
  }
}

export async function adminUpdateCredits(userId: number, credits: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/admin/users/${userId}/credits`, {
    method: 'PUT',
    body: JSON.stringify({ credits_used: credits }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.detail || 'Failed to update credits');
  }
}

export async function adminUpdateCreditLimit(userId: number, creditLimit: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/admin/users/${userId}/limit`, {
    method: 'PUT',
    body: JSON.stringify({ credit_limit: creditLimit }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.detail || 'Failed to update credit limit');
  }
}

export async function adminUpdateEmail(userId: number, email: string): Promise<void> {
  const res = await authFetch(`${API_BASE}/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.detail || 'Failed to update email');
  }
}
