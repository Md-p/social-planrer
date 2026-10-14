import { NextResponse } from 'next/server';
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
