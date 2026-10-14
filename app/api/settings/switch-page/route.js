import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

export async function POST(req) {
  try {
    const { pageId } = await req.json();
    const db = getDb();

    if (!db.settings.pages || db.settings.pages.length === 0) {
      return NextResponse.json({ success: false, error: 'No pages found in settings' }, { status: 400 });
    }

    const targetPage = db.settings.pages.find((p) => p.pageId === pageId);

    if (!targetPage) {
      return NextResponse.json({ success: false, error: 'Selected page not found' }, { status: 404 });
    }

    db.settings = {
      ...db.settings,
      activePageId: targetPage.pageId,
      pageId: targetPage.pageId,
      pageName: targetPage.pageName,
      pageAccessToken: targetPage.pageAccessToken,
      pageAvatar: targetPage.pageAvatar,
      followersCount: targetPage.followersCount,
      isConnected: true,
      updatedAt: new Date().toISOString(),
    };

    saveDb(db);

    return NextResponse.json({
      success: true,
      message: `Active page switched to ${targetPage.pageName}`,
      settings: db.settings,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
