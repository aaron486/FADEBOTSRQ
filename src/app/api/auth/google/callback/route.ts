import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/?calendar_error=access_denied', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?calendar_error=no_code', request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const response = NextResponse.redirect(new URL('/?calendar_connected=true', request.url));

    // Store the access token in an HTTP-only cookie
    response.cookies.set('gcal_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in,
      path: '/',
    });

    if (tokens.refresh_token) {
      response.cookies.set('gcal_refresh', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });
    }

    return response;
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(new URL('/?calendar_error=token_exchange_failed', request.url));
  }
}
