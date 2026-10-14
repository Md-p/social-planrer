import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDb, saveDb } from '@/lib/db';
import {
  publishToFacebook,
  publishStoryToFacebook,
  publishReelToFacebook,
  postMultipleCommentsToFacebook,
} from '@/lib/fb';

export async function GET() {
  try {
    const db = getDb();
    if (!db.settings.isConnected) {
      return NextResponse.json({
        success: false,
        message: 'Facebook is not connected. Scheduler skipped.',
      });
    }

    const now = new Date();
    let publishedCount = 0;
    let failedCount = 0;
    const results = [];

    for (let i = 0; i < db.posts.length; i++) {
      const post = db.posts[i];
      if (post.status === 'SCHEDULED' && post.scheduledAt) {
        const scheduledTime = new Date(post.scheduledAt);
        if (scheduledTime <= now) {
          let pageId = post.targetPageId || db.settings.pageId;
          let pageAccessToken = db.settings.pageAccessToken;

          if (db.settings.pages && post.targetPageId) {
            const matched = db.settings.pages.find((p) => p.pageId === post.targetPageId);
            if (matched) {
              pageAccessToken = matched.pageAccessToken;
            }
          }

          try {
            if (post.postType === 'STORY') {
              const res = await publishStoryToFacebook({
                pageId,
                pageAccessToken,
                mediaUrl: post.mediaUrl,
              });
              post.fbPostId = res.postId;
            } else if (post.postType === 'REEL') {
              const res = await publishReelToFacebook({
                pageId,
                pageAccessToken,
                videoUrl: post.videoUrl || post.mediaUrl,
                caption: post.content,
              });
              post.fbPostId = res.postId;

              const commentsToPost = post.autoComments || (post.autoComment ? [post.autoComment] : []);
              if (commentsToPost.length > 0 && res.postId) {
                post.postedComments = await postMultipleCommentsToFacebook({
                  postId: res.postId,
                  comments: commentsToPost,
                  pageAccessToken,
                });
              }
            } else {
              const pubResult = await publishToFacebook({
                pageId,
                pageAccessToken,
                content: post.content,
                mediaUrl: post.mediaUrl,
              });
              post.fbPostId = pubResult.postId;

              const commentsToPost = post.autoComments || (post.autoComment ? [post.autoComment] : []);
              if (commentsToPost.length > 0) {
                post.postedComments = await postMultipleCommentsToFacebook({
                  postId: pubResult.postId,
                  comments: commentsToPost,
                  pageAccessToken,
                });
              }
            }

            post.status = 'PUBLISHED';
            post.publishedAt = now.toISOString();
            post.error = null;

            // Auto-clean uploaded video/media file from server disk to save space
            try {
              const fileToDelete = post.videoUrl || post.mediaUrl;
              if (fileToDelete && typeof fileToDelete === 'string' && fileToDelete.startsWith('/uploads/')) {
                const localFilePath = path.join(process.cwd(), 'public', fileToDelete);
                if (fs.existsSync(localFilePath)) {
                  fs.unlinkSync(localFilePath);
                  console.log(`[Scheduler] 🧹 Auto-deleted media file after successful post: ${fileToDelete}`);
                }
              }
            } catch (cleanupErr) {
              console.warn('[Scheduler] Cleanup warning:', cleanupErr.message);
            }

            // Send Telegram Alert
            try {
              const tgToken = db.settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
              const tgChatId = db.settings.telegramChatId || process.env.TELEGRAM_CHAT_ID;
              if (tgToken && tgChatId) {
                const targetPageName =
                  db.settings.pages?.find((p) => p.pageId === pageId)?.pageName || db.settings.pageName;
                const postUrl = post.fbPostId ? `https://facebook.com/${post.fbPostId}` : '';
                const tgMsg =
                  `🚀 <b>Facebook Auto-Publisher Alert</b>\n\n` +
                  `✅ <b>${post.postType || 'FEED'}</b> সফলভাবে পাবলিশ হয়েছে!\n` +
                  `📄 পেইজ: <b>${targetPageName}</b>\n` +
                  (post.content ? `📝 ক্যাপশন: <i>${post.content.slice(0, 90)}...</i>\n` : '') +
                  (postUrl ? `🔗 <a href="${postUrl}">পোস্টটি ফেসবুকে দেখুন</a>\n` : '') +
                  `⏰ সময়: ${new Date().toLocaleString()}`;

                fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ chat_id: tgChatId, text: tgMsg, parse_mode: 'HTML' }),
                }).catch(() => {});
              }
            } catch (tgErr) {}

            publishedCount++;
            results.push({ id: post.id, status: 'PUBLISHED', type: post.postType || 'FEED' });
          } catch (err) {
            post.status = 'FAILED';
            post.error = err.message;
            failedCount++;
            results.push({ id: post.id, status: 'FAILED', error: err.message });
          }
        }
      }
    }

    if (publishedCount > 0 || failedCount > 0) {
      saveDb(db);
    }

    return NextResponse.json({
      success: true,
      publishedCount,
      failedCount,
      results,
      checkedAt: now.toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
