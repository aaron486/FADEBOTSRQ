import { NextRequest, NextResponse } from 'next/server';
import { fetchCalendarEvents, getTokenFromCookies } from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
  const token = getTokenFromCookies(request.headers.get('cookie'));

  if (!token) {
    return NextResponse.json(
      { error: 'Not authenticated with Google Calendar', connected: false },
      { status: 401 }
    );
  }

  try {
    const timeMin = request.nextUrl.searchParams.get('timeMin') || undefined;
    const timeMax = request.nextUrl.searchParams.get('timeMax') || undefined;

    const events = await fetchCalendarEvents(token, timeMin, timeMax);

    return NextResponse.json({ events, connected: true });
  } catch (err) {
    console.error('Calendar fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events', connected: false },
      { status: 500 }
    );
  }
}
