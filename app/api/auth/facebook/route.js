import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const db = getDb();

  const host = req.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';

  const appId = searchParams.get('app_id') || db.settings.appId || process.env.FB_APP_ID;
  const redirectUri = `${protocol}://${host}/api/auth/facebook/callback`;

  if (!appId) {
    return NextResponse.redirect(
      `${protocol}://${host}/?error=${encodeURIComponent(
        'দয়া করে প্রথমে আপনার Meta App ID এবং App Secret বক্সে বসিয়ে সেভ করুন।'
      )}`
    );
  }

  const scope = [
    'public_profile',
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts',
  ].join(',');

  const fbAuthUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${encodeURIComponent(scope)}&response_type=code`;

  return NextResponse.redirect(fbAuthUrl);
}
