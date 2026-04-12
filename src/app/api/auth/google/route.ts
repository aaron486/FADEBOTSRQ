import { NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/google-calendar';

export async function GET() {
  try {
    const authUrl = getGoogleAuthUrl();
    return NextResponse.redirect(authUrl);
  } catch {
    return NextResponse.json(
      { error: 'Google Calendar not configured. Add GOOGLE_CLIENT_ID to .env.local' },
      { status: 500 }
    );
  }
}
