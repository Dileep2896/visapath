import type { UserInput, TimelineResponse, ChatResponse } from '../types';

const API_BASE = '/api';

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
