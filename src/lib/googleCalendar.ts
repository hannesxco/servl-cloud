import { CalendarEvent, CalendarCategory } from '@/types';
import { getEvents, saveEvents, getCalendars, saveCalendars } from '@/lib/store';

const FUNC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const STORAGE_KEY = 'gc_tokens';

interface GCTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export function getGCTokens(): GCTokens | null {
  try {
    const d = localStorage.getItem(STORAGE_KEY);
    return d ? JSON.parse(d) : null;
  } catch { return null; }
}

export function saveGCTokens(t: GCTokens) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
}

export function clearGCTokens() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isGCConnected(): boolean {
  return !!getGCTokens();
}

async function callFunc(body: Record<string, unknown>) {
  const res = await fetch(FUNC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export async function startGoogleAuth() {
  const redirect_uri = window.location.origin + '/kalender';
  const data = await callFunc({ action: 'get_auth_url', redirect_uri });
  window.location.href = data.auth_url;
}

export async function handleAuthCallback(code: string): Promise<GCTokens> {
  const redirect_uri = window.location.origin + '/kalender';
  const data = await callFunc({ action: 'exchange_code', code, redirect_uri });
  if (!data.access_token) throw new Error('No access token received');
  const tokens: GCTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || getGCTokens()?.refresh_token,
    expires_at: Date.now() + (data.expires_in || 3600) * 1000,
  };
  saveGCTokens(tokens);
  return tokens;
}

async function ensureValidToken(): Promise<string> {
  const tokens = getGCTokens();
  if (!tokens) throw new Error('Not connected to Google Calendar');
  if (Date.now() < tokens.expires_at - 60000) return tokens.access_token;
  
  const data = await callFunc({ action: 'refresh_token', refresh_token: tokens.refresh_token });
  const updated: GCTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || tokens.refresh_token,
    expires_at: Date.now() + (data.expires_in || 3600) * 1000,
  };
  saveGCTokens(updated);
  return updated.access_token;
}

export async function fetchGoogleEvents(timeMin: string, timeMax: string): Promise<CalendarEvent[]> {
  const access_token = await ensureValidToken();
  const data = await callFunc({
    action: 'fetch_events',
    access_token,
    time_min: timeMin,
    time_max: timeMax,
  });

  const calendars = getCalendars();
  let gcCal = calendars.find(c => c.name === 'Google Calendar');
  if (!gcCal) {
    gcCal = { id: 'cal-google', name: 'Google Calendar', color: 'hsl(217, 91%, 60%)' };
    saveCalendars([...calendars, gcCal]);
  }

  return (data.items || [])
    .filter((item: any) => item.start?.dateTime || item.start?.date)
    .map((item: any) => {
      const start = item.start.dateTime ? new Date(item.start.dateTime) : new Date(item.start.date);
      const end = item.end?.dateTime ? new Date(item.end.dateTime) : start;
      const dateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
      const startTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
      const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
      return {
        id: `gc-${item.id}`,
        title: item.summary || '(Kein Titel)',
        date: dateStr,
        startTime,
        endTime,
        color: gcCal!.color,
        description: item.description || '',
        calendarId: gcCal!.id,
        googleEventId: item.id,
      } as CalendarEvent;
    });
}

export async function syncGoogleCalendar(): Promise<CalendarEvent[]> {
  const now = new Date();
  const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const timeMax = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();
  
  const googleEvents = await fetchGoogleEvents(timeMin, timeMax);
  
  const localEvents = getEvents().filter(e => !e.id.startsWith('gc-'));
  const merged = [...localEvents, ...googleEvents];
  saveEvents(merged);
  return merged;
}
