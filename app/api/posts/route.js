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
    const sorted = [...(db.posts || [])].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    return NextResponse.json({ success: true, posts: sorted });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      content,
      mediaUrl,
      videoUrl,
      scheduledAt,
      publishNow,
      platforms,
      autoComment,
      autoComments,
      targetPageId,
      postType, // 'FEED' | 'REEL' | 'STORY'
    } = body;

    const actualPostType = postType || 'FEED';

    if (actualPostType === 'FEED' && !content && !mediaUrl) {
      return NextResponse.json(
        { success: false, error: 'Post must contain either text content or an image URL' },
        { status: 400 }
      );
    }

    if (actualPostType === 'STORY' && !mediaUrl) {
      return NextResponse.json(
        { success: false, error: 'Photo Story requires an image URL' },
        { status: 400 }
      );
    }

    if (actualPostType === 'REEL' && !videoUrl && !mediaUrl) {
      return NextResponse.json(
        { success: false, error: 'Reel requires a video URL' },
        { status: 400 }
      );
    }

    const db = getDb();
    const newPostId = `post-${Date.now()}`;
    const now = new Date().toISOString();

    // Determine target page
    let pageId = db.settings.pageId;
    let pageAccessToken = db.settings.pageAccessToken;

    if (targetPageId && db.settings.pages) {
      const selected = db.settings.pages.find((p) => p.pageId === targetPageId);
      if (selected) {
        pageId = selected.pageId;
        pageAccessToken = selected.pageAccessToken;
      }
    }

    // Prepare list of comments
    const commentsList = Array.isArray(autoComments)
      ? autoComments.filter((c) => c && c.trim() !== '')
      : autoComment && autoComment.trim() !== ''
      ? [autoComment.trim()]
      : [];

    let postStatus = 'SCHEDULED';
    let publishedAt = null;
    let fbPostId = null;
    let errorMsg = null;
    let postedComments = [];

    if (publishNow) {
      if (!db.settings.isConnected || !pageAccessToken) {
        return NextResponse.json(
          {
            success: false,
            error: 'Facebook Page is not connected. Please connect your page in Settings first.',
          },
          { status: 400 }
        );
      }

      try {
        if (actualPostType === 'STORY') {
          const res = await publishStoryToFacebook({
            pageId,
            pageAccessToken,
            mediaUrl,
          });
          fbPostId = res.postId;
        } else if (actualPostType === 'REEL') {
          const res = await publishReelToFacebook({
            pageId,
            pageAccessToken,
            videoUrl: videoUrl || mediaUrl,
            caption: content,
          });
          fbPostId = res.postId;
        } else {
          // Standard FEED
          const res = await publishToFacebook({
            pageId,
            pageAccessToken,
            content,
            mediaUrl,
          });
          fbPostId = res.postId;

          if (commentsList.length > 0) {
            postedComments = await postMultipleCommentsToFacebook({
              postId: fbPostId,
              comments: commentsList,
              pageAccessToken,
            });
          }
        }

        postStatus = 'PUBLISHED';
        publishedAt = now;

        // Auto-clean uploaded video/media file from server disk to save space
        try {
          const fileToDelete = videoUrl || mediaUrl;
          if (fileToDelete && typeof fileToDelete === 'string' && fileToDelete.startsWith('/uploads/')) {
            const localFilePath = path.join(process.cwd(), 'public', fileToDelete);
            if (fs.existsSync(localFilePath)) {
              fs.unlinkSync(localFilePath);
              console.log(`[Posts] 🧹 Auto-deleted media file after instant publish: ${fileToDelete}`);
            }
          }
        } catch (cleanupErr) {
          console.warn('[Posts] Cleanup warning:', cleanupErr.message);
        }
      } catch (err) {
        postStatus = 'FAILED';
        errorMsg = err.message;
      }
    } else {
      if (!scheduledAt) {
        return NextResponse.json(
          { success: false, error: 'Scheduled date and time are required' },
          { status: 400 }
        );
      }
    }

    const newPost = {
      id: newPostId,
      content: content || '',
      mediaUrl: mediaUrl || '',
      videoUrl: videoUrl || '',
      postType: actualPostType,
      platforms: platforms || ['facebook'],
      targetPageId: pageId,
      autoComment: commentsList[0] || '',
      autoComments: commentsList,
      postedComments,
      status: postStatus,
      scheduledAt: publishNow ? null : new Date(scheduledAt).toISOString(),
      publishedAt,
      fbPostId,
      error: errorMsg,
      createdAt: now,
    };

    db.posts.unshift(newPost);
    saveDb(db);

    const typeLabel =
      actualPostType === 'REEL' ? 'Reel' : actualPostType === 'STORY' ? 'Photo Story' : 'Post';

    return NextResponse.json({
      success: true,
      post: newPost,
      message: publishNow
        ? postStatus === 'PUBLISHED'
          ? `${typeLabel} published directly to Facebook!`
          : `${typeLabel} failed to publish: ${errorMsg}`
        : `${typeLabel} scheduled successfully!`,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
