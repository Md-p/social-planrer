import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import {
  publishToFacebook,
  publishStoryToFacebook,
  publishReelToFacebook,
  postMultipleCommentsToFacebook,
} from '@/lib/fb';

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    const db = getDb();
    const initialLen = db.posts.length;
    db.posts = db.posts.filter((p) => p.id !== id);

    if (db.posts.length === initialLen) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    saveDb(db);
    return NextResponse.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { id } = params;
    const db = getDb();
    const postIndex = db.posts.findIndex((p) => p.id === id);

    if (postIndex === -1) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    const post = db.posts[postIndex];

    let pageId = post.targetPageId || db.settings.pageId;
    let pageAccessToken = db.settings.pageAccessToken;

    if (db.settings.pages && post.targetPageId) {
      const matched = db.settings.pages.find((p) => p.pageId === post.targetPageId);
      if (matched) {
        pageAccessToken = matched.pageAccessToken;
      }
    }

    if (!db.settings.isConnected || !pageAccessToken) {
      return NextResponse.json(
        { success: false, error: 'Facebook Page is not connected' },
        { status: 400 }
      );
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
        const result = await publishToFacebook({
          pageId,
          pageAccessToken,
          content: post.content,
          mediaUrl: post.mediaUrl,
        });
        post.fbPostId = result.postId;

        const commentsToPost = post.autoComments || (post.autoComment ? [post.autoComment] : []);
        if (commentsToPost.length > 0) {
          post.postedComments = await postMultipleCommentsToFacebook({
            postId: result.postId,
            comments: commentsToPost,
            pageAccessToken,
          });
        }
      }

      post.status = 'PUBLISHED';
      post.publishedAt = new Date().toISOString();
      post.error = null;

      db.posts[postIndex] = post;
      saveDb(db);

      return NextResponse.json({
        success: true,
        message: `${post.postType || 'Post'} published successfully to Facebook!`,
        post,
      });
    } catch (fbErr) {
      post.status = 'FAILED';
      post.error = fbErr.message;
      db.posts[postIndex] = post;
      saveDb(db);

      return NextResponse.json(
        { success: false, error: fbErr.message, post },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
