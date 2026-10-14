import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import axios from 'axios';

export async function POST(req) {
  try {
    const body = await req.json();
    const db = getDb();

    const token = body.telegramBotToken || db.settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = body.telegramChatId || db.settings.telegramChatId || process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return NextResponse.json(
        { success: false, error: 'Telegram Bot Token এবং Chat ID উভয়ই প্রয়োজন!' },
        { status: 400 }
      );
    }

    const message = `🤖 <b>Social Planner — Telegram Bot Test</b>\n\n✅ অভিনন্দন! আপনার টেলিগ্রাম বট সফলভাবে কানেক্ট হয়েছে।\n\n📌 পেজে পোস্ট বা রিল শিডিউল অনুযায়ী পাবলিশ হলেই আপনি সাথে সাথে নোটিফিকেশন পাবেন।\n⏰ সময়: ${new Date().toLocaleString()}`;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    });

    if (res.data.ok) {
      return NextResponse.json({ success: true, message: 'টেলিগ্রামে টেস্ট মেসেজ সফলভাবে পাঠানো হয়েছে!' });
    } else {
      return NextResponse.json({ success: false, error: 'Telegram API Error' }, { status: 400 });
    }
  } catch (error) {
    const msg = error.response?.data?.description || error.message;
    return NextResponse.json({ success: false, error: `Telegram Error: ${msg}` }, { status: 500 });
  }
}
