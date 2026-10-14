import axios from 'axios';
import fs from 'fs';
import path from 'path';

const GRAPH_API_VERSION = 'v21.0';

function isLocalUpload(url) {
  return url && (url.startsWith('/uploads/') || url.includes('public/uploads') || url.includes('public\\uploads'));
}

function getLocalFilePath(url) {
  if (url.startsWith('/uploads/')) {
    return path.join(process.cwd(), 'public', url);
  }
  return url;
}

/**
 * Test Facebook credentials and fetch Page Details
 */
export async function testFacebookConnection(pageId, pageAccessToken) {
  if (!pageId || !pageAccessToken) {
    throw new Error('Page ID and Page Access Token are required');
  }

  try {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}`;
    const response = await axios.get(url, {
      params: {
        fields: 'id,name,picture{url},followers_count,fan_count,link',
        access_token: pageAccessToken,
      },
      timeout: 10000,
    });

    const data = response.data;
    return {
      success: true,
      pageId: data.id,
      pageName: data.name,
      pageAvatar: data.picture?.data?.url || '',
      followersCount: data.followers_count || data.fan_count || 0,
      link: data.link || `https://facebook.com/${data.id}`,
    };
  } catch (error) {
    const fbError = error.response?.data?.error?.message || error.message;
    throw new Error(`Facebook API Error: ${fbError}`);
  }
}

/**
 * Publish standard feed post (text, local file, or remote image)
 */
export async function publishToFacebook({ pageId, pageAccessToken, content, mediaUrl }) {
  if (!pageId || !pageAccessToken) {
    throw new Error('Page ID and Access Token are missing');
  }

  try {
    // 1. Direct Local File Upload (from PC / Phone)
    if (mediaUrl && isLocalUpload(mediaUrl)) {
      const localFilePath = getLocalFilePath(mediaUrl);
      if (fs.existsSync(localFilePath)) {
        const fileBuffer = fs.readFileSync(localFilePath);
        const blob = new Blob([fileBuffer]);
        const formData = new FormData();
        formData.append('source', blob, path.basename(localFilePath));
        formData.append('caption', content || '');
        formData.append('access_token', pageAccessToken);

        const uploadRes = await fetch(
          `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/photos`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const data = await uploadRes.json();
        if (data.error) throw new Error(data.error.message);
        return { success: true, postId: data.id || data.post_id };
      }
    }

    // 2. Remote URL Photo
    if (mediaUrl && mediaUrl.trim() !== '') {
      const photoUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/photos`;
      const response = await axios.post(photoUrl, null, {
        params: {
          url: mediaUrl.trim(),
          caption: content || '',
          access_token: pageAccessToken,
        },
        timeout: 25000,
      });
      return { success: true, postId: response.data.id || response.data.post_id };
    }

    // 3. Text Only Post
    const feedUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/feed`;
    const response = await axios.post(feedUrl, null, {
      params: {
        message: content || '',
        access_token: pageAccessToken,
      },
      timeout: 20000,
    });

    const postId = response.data.id || response.data.post_id;
    return { success: true, postId };
  } catch (error) {
    const fbError = error.response?.data?.error?.message || error.message;
    throw new Error(`Publish failed: ${fbError}`);
  }
}

/**
 * Publish a Photo Story to Facebook Page Stories (local file or URL)
 */
export async function publishStoryToFacebook({ pageId, pageAccessToken, mediaUrl }) {
  if (!pageId || !pageAccessToken || !mediaUrl) {
    throw new Error('Page ID, Access Token and Media URL are required for Story');
  }

  try {
    if (isLocalUpload(mediaUrl)) {
      const localFilePath = getLocalFilePath(mediaUrl);
      if (fs.existsSync(localFilePath)) {
        const fileBuffer = fs.readFileSync(localFilePath);
        const blob = new Blob([fileBuffer]);
        const formData = new FormData();
        formData.append('photo', blob, path.basename(localFilePath));
        formData.append('access_token', pageAccessToken);

        const res = await fetch(
          `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/photo_stories`,
          {
            method: 'POST',
            body: formData,
          }
        );
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return { success: true, postId: data.id || data.post_id || 'story-published' };
      }
    }

    // Remote URL story
    const storyUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/photo_stories`;
    const response = await axios.post(storyUrl, null, {
      params: {
        photo_url: mediaUrl.trim(),
        access_token: pageAccessToken,
      },
      timeout: 20000,
    });

    return {
      success: true,
      postId: response.data.id || response.data.post_id || 'story-published',
    };
  } catch (error) {
    const fbError = error.response?.data?.error?.message || error.message;
    throw new Error(`Story Publish failed: ${fbError}`);
  }
}

/**
 * Publish a Reel (vertical video, local file or URL) to Facebook Page Reels
 */
export async function publishReelToFacebook({ pageId, pageAccessToken, videoUrl, caption }) {
  if (!pageId || !pageAccessToken || !videoUrl) {
    throw new Error('Page ID, Access Token and Video URL are required for Reel');
  }

  try {
    // Direct local video file upload (from PC / Phone)
    if (isLocalUpload(videoUrl)) {
      const localFilePath = getLocalFilePath(videoUrl);
      if (fs.existsSync(localFilePath)) {
        const fileBuffer = fs.readFileSync(localFilePath);
        const blob = new Blob([fileBuffer]);
        const formData = new FormData();
        formData.append('source', blob, path.basename(localFilePath));
        formData.append('description', caption || '');
        formData.append('access_token', pageAccessToken);

        const res = await fetch(
          `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/videos`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return { success: true, postId: data.id || 'reel-published' };
      }
    }

    // Remote URL Video
    const fallbackUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/videos`;
    const fallbackRes = await axios.post(fallbackUrl, null, {
      params: {
        file_url: videoUrl.trim(),
        description: caption || '',
        access_token: pageAccessToken,
      },
      timeout: 30000,
    });
    return { success: true, postId: fallbackRes.data.id };
  } catch (error) {
    const fbError = error.response?.data?.error?.message || error.message;
    throw new Error(`Reel Publish failed: ${fbError}`);
  }
}

/**
 * Post single or multiple sequential comments (e.g. Story Part 2, Part 3)
 */
export async function postMultipleCommentsToFacebook({ postId, comments, pageAccessToken }) {
  if (!postId || !comments || !pageAccessToken) {
    return [];
  }

  const commentList = Array.isArray(comments)
    ? comments.filter((c) => c && c.trim() !== '')
    : [comments].filter((c) => c && c.trim() !== '');

  if (commentList.length === 0) return [];

  const results = [];
  for (let i = 0; i < commentList.length; i++) {
    const commentText = commentList[i];
    try {
      const commentUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${postId}/comments`;
      const response = await axios.post(commentUrl, null, {
        params: {
          message: commentText.trim(),
          access_token: pageAccessToken,
        },
        timeout: 15000,
      });

      results.push({ success: true, commentId: response.data?.id });

      if (i < commentList.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    } catch (error) {
      console.error(`Auto comment ${i + 1} failed:`, error.response?.data || error.message);
      results.push({ success: false, error: error.message });
    }
  }

  return results;
}

export async function postCommentToFacebook({ postId, commentText, pageAccessToken }) {
  return postMultipleCommentsToFacebook({ postId, comments: [commentText], pageAccessToken });
}
