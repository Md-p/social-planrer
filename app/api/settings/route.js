import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { testFacebookConnection } from '@/lib/fb';

export async function GET() {
  try {
    const db = getDb();
    const settings = { ...db.settings };
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { pageId, pageAccessToken, appId, appSecret, telegramBotToken, telegramChatId } = body;

    const db = getDb();

    // If saving Telegram Bot settings
    if (telegramBotToken !== undefined || telegramChatId !== undefined) {
      db.settings = {
        ...db.settings,
        telegramBotToken: telegramBotToken !== undefined ? telegramBotToken.trim() : (db.settings.telegramBotToken || ''),
        telegramChatId: telegramChatId !== undefined ? telegramChatId.trim() : (db.settings.telegramChatId || ''),
      };
      saveDb(db);
    }

    // If saving App ID & Secret for Direct OAuth Login
    if (appId || appSecret) {
      db.settings = {
        ...db.settings,
        appId: appId || db.settings.appId || '',
        appSecret: appSecret || db.settings.appSecret || '',
      };
      saveDb(db);
    }

    if (!pageId || !pageAccessToken) {
      saveDb(db);
      return NextResponse.json({
        success: true,
        message: 'Settings updated!',
        settings: db.settings,
      });
    }

    // Test with Facebook Graph API
    let pageInfo;
    try {
      pageInfo = await testFacebookConnection(pageId.trim(), pageAccessToken.trim());
    } catch (fbErr) {
      return NextResponse.json(
        { success: false, error: fbErr.message },
        { status: 400 }
      );
    }

    db.settings = {
      ...db.settings,
      pageId: pageInfo.pageId,
      pageAccessToken: pageAccessToken.trim(),
      pageName: pageInfo.pageName,
      pageAvatar: pageInfo.pageAvatar,
      followersCount: pageInfo.followersCount,
      isConnected: true,
      updatedAt: new Date().toISOString(),
    };
    saveDb(db);

    return NextResponse.json({
      success: true,
      message: `Successfully connected to ${pageInfo.pageName}!`,
      settings: db.settings,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
