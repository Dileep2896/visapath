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

export async function getMe(): Promise<{ id: number; email: string; profile: UserInput | null } | null> {
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

// --- Existing API ---
export async function generateTimeline(input: UserInput): Promise<TimelineResponse> {
  const res = await fetch(`${API_BASE}/generate-timeline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to generate timeline');
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

export async function getRequiredDocuments(step?: string) {
  const url = step
    ? `${API_BASE}/required-documents?step=${step}`
    : `${API_BASE}/required-documents`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}
