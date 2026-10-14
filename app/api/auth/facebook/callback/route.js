import { NextResponse } from 'next/server';
import axios from 'axios';
import { getDb, saveDb } from '@/lib/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error_description') || searchParams.get('error');

  const host = req.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/auth/facebook/callback`;

  if (error) {
    return NextResponse.redirect(`${protocol}://${host}/?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${protocol}://${host}/?error=No_code_provided`);
  }

  const db = getDb();
  const appId = db.settings.appId || process.env.FB_APP_ID;
  const appSecret = db.settings.appSecret || process.env.FB_APP_SECRET;

  if (!appId || !appSecret) {
    return NextResponse.redirect(
      `${protocol}://${host}/?error=${encodeURIComponent(
        'Facebook App ID and App Secret must be configured in settings.'
      )}`
    );
  }

  try {
    // 1. Exchange code for User Access Token
    const tokenRes = await axios.get('https://graph.facebook.com/v21.0/oauth/access_token', {
      params: {
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code,
      },
    });

    const userAccessToken = tokenRes.data.access_token;

    // 2. Fetch ALL User Pages with Page Access Tokens
    const accountsRes = await axios.get('https://graph.facebook.com/v21.0/me/accounts', {
      params: {
        fields: 'id,name,picture{url},access_token,followers_count,fan_count',
        access_token: userAccessToken,
        limit: 100,
      },
    });

    const rawPages = accountsRes.data.data;

    if (!rawPages || rawPages.length === 0) {
      return NextResponse.redirect(
        `${protocol}://${host}/?error=${encodeURIComponent(
          'আপনার ফেসবুক আইডিতে কোনো পেজ পাওয়া যায়নি। দয়া করে একটি পেজ তৈরি করুন।'
        )}`
      );
    }

    // Format all pages
    const pagesList = rawPages.map((p) => ({
      pageId: p.id,
      pageName: p.name,
      pageAccessToken: p.access_token,
      pageAvatar: p.picture?.data?.url || '',
      followersCount: p.followers_count || p.fan_count || 0,
    }));

    // Merge new pages with existing pages so multiple Facebook IDs can be connected
    const existingPages = db.settings.pages || [];
    const mergedPagesMap = new Map();
    existingPages.forEach((p) => mergedPagesMap.set(p.pageId, p));
    pagesList.forEach((p) => mergedPagesMap.set(p.pageId, p));
    const allPagesList = Array.from(mergedPagesMap.values());

    // Prefer page with highest followers or active one
    allPagesList.sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0));
    const activePage = allPagesList[0];

    db.settings = {
      ...db.settings,
      userAccessToken,
      pages: allPagesList, // All connected pages from all IDs saved here!
      activePageId: activePage.pageId,
      pageId: activePage.pageId,
      pageName: activePage.pageName,
      pageAccessToken: activePage.pageAccessToken,
      pageAvatar: activePage.pageAvatar,
      followersCount: activePage.followersCount,
      isConnected: true,
      updatedAt: new Date().toISOString(),
    };

    saveDb(db);

    return NextResponse.redirect(
      `${protocol}://${host}/?connected=true&pageCount=${pagesList.length}&pageName=${encodeURIComponent(
        activePage.pageName
      )}`
    );
  } catch (err) {
    console.error('Facebook OAuth Exchange Error:', err.response?.data || err.message);
    const msg = err.response?.data?.error?.message || err.message;
    return NextResponse.redirect(`${protocol}://${host}/?error=${encodeURIComponent(msg)}`);
  }
}
