const http = require('http');
const https = require('https');

console.log('[Scheduler Worker] Active 24/7 background scheduler initialized...');

function sendTelegramAlert(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(
    message
  )}&parse_mode=HTML`;
  https.get(url, () => {}).on('error', () => {});
}

function checkSchedule() {
  const port = process.env.PORT || 3000;
  const req = http.get(`http://localhost:${port}/api/scheduler`, (res) => {
    let raw = '';
    res.on('data', (chunk) => (raw += chunk));
    res.on('end', () => {
      try {
        const json = JSON.parse(raw);
        if (json.publishedCount > 0) {
          console.log(`[Scheduler Worker] ✅ Automatically published ${json.publishedCount} post(s) to Facebook!`);
          sendTelegramAlert(
            `🚀 <b>Facebook Auto-Publisher Alert</b>\n\n✅ <b>${json.publishedCount}</b> scheduled post(s) successfully published to Facebook!\n⏰ Time: ${new Date().toLocaleString()}`
          );
        }
      } catch (e) {}
    });
  });

  req.on('error', () => {
    // Server might be compiling or starting up
  });
}

// Run immediately and every 20 seconds
checkSchedule();
setInterval(checkSchedule, 20000);
