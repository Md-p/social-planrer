import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'store.json');

const DEFAULT_DATA = {
  settings: {
    pageId: '',
    pageAccessToken: '',
    pageName: 'Facebook Page',
    pageAvatar: '',
    isConnected: false,
    updatedAt: null,
  },
  posts: [
    {
      id: 'sample-1',
      content: '🚀 স্বাগতম Blogbio Social Planner-এ! এখান থেকে আপনি সহজেই ফেসবুক ও ইনস্টাগ্রাম পোস্ট শিডিউল করতে পারবেন।',
      mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      platforms: ['facebook'],
      status: 'PUBLISHED',
      scheduledAt: new Date(Date.now() - 3600000).toISOString(),
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      fbPostId: 'sample-post-id',
      error: null,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'sample-2',
      content: '✨ নতুন প্রডাক্ট লঞ্চ হতে যাচ্ছে আগামী সপ্তাহে। স্টে টিউনড! #announcement #brand',
      mediaUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
      platforms: ['facebook'],
      status: 'SCHEDULED',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      publishedAt: null,
      fbPostId: null,
      error: null,
      createdAt: new Date().toISOString(),
    }
  ]
};

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DATA, null, 2), 'utf-8');
  }
}

export function getDb() {
  ensureDb();
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading DB, restoring default:', err);
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DATA, null, 2), 'utf-8');
    return DEFAULT_DATA;
  }
}

export function saveDb(data) {
  ensureDb();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}
