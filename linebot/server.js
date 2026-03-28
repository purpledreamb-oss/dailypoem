/**
 * 日日一詩 — LINE Bot 伺服器
 *
 * 功能：
 * 1. Webhook 接收使用者訊息
 * 2. 回覆「今日詩」給使用者
 * 3. 每日定時推播（cron job）
 * 4. 使用者管理（訂閱/取消訂閱）
 */

require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const cron = require('node-cron');
const { getTodayPoem, poems } = require('./poems');

const app = express();

// ===== 設定 =====
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const PORT = process.env.PORT || 3000;
const PUSH_HOUR = process.env.PUSH_HOUR || 8;
const PUSH_MINUTE = process.env.PUSH_MINUTE || 0;

// ===== 簡易使用者儲存（正式環境請改用資料庫）=====
const subscribers = new Set();

// ===== LINE API Helper =====
async function callLineAPI(endpoint, body) {
  const res = await fetch(`https://api.line.me/v2/bot/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.channelAccessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error(`LINE API Error [${endpoint}]:`, error);
  }
  return res;
}

function replyMessage(replyToken, messages) {
  return callLineAPI('message/reply', { replyToken, messages });
}

function pushMessage(to, messages) {
  return callLineAPI('message/push', { to, messages });
}

// ===== 驗證 LINE Signature =====
function validateSignature(body, signature) {
  const hash = crypto
    .createHmac('SHA256', config.channelSecret)
    .update(body)
    .digest('base64');
  return hash === signature;
}

// ===== 格式化詩的訊息 =====
function formatPoemMessage(poem) {
  const divider = '─'.repeat(16);

  return [
    {
      type: 'text',
      text: `📖 今日一詩\n${divider}\n\n${poem.title}\n${poem.author}\n\n${poem.body}\n\n${divider}\n\n💭 ${poem.note}`,
    },
    {
      type: 'text',
      text: `🌿 呼吸提醒\n\n花一分鐘，試試方塊呼吸法：\n\n吸氣 4 秒 → 屏息 4 秒\n吐氣 4 秒 → 屏息 4 秒\n\n重複 3 次，感受身體的放鬆。\n\n願文字成為你的呼吸 ✨`,
    },
  ];
}

function formatRandomPoemMessage() {
  const randomIndex = Math.floor(Math.random() * poems.length);
  const poem = poems[randomIndex];
  const divider = '─'.repeat(16);

  return [
    {
      type: 'text',
      text: `🎲 隨機一詩\n${divider}\n\n${poem.title}\n${poem.author}\n\n${poem.body}\n\n${divider}\n\n💭 ${poem.note}`,
    },
  ];
}

function getHelpMessage() {
  return [
    {
      type: 'text',
      text: `📖 日日一詩 使用指南\n${'─'.repeat(16)}\n\n傳送以下文字來互動：\n\n✦「開始」— 啟用每日推播\n✦「停止」— 取消每日推播\n✦「今日」— 查看今天的詩\n✦「隨機」— 隨機抽一首詩\n✦「呼吸」— 呼吸練習引導\n✦「說明」— 查看使用指南\n\n每天早上 ${PUSH_HOUR} 點\n會自動推送一首詩給你 🌅`,
    },
  ];
}

function getBreatheMessage() {
  return [
    {
      type: 'text',
      text: `🌿 方塊呼吸練習\n${'─'.repeat(16)}\n\n找一個舒服的姿勢，開始：\n\n1️⃣ 吸氣（數 1、2、3、4）\n   讓空氣慢慢充滿\n\n2️⃣ 屏息（數 1、2、3、4）\n   穩穩地停在這裡\n\n3️⃣ 吐氣（數 1、2、3、4）\n   輕輕地放掉一切\n\n4️⃣ 屏息（數 1、2、3、4）\n   安靜地等待下一次\n\n🔁 重複 3–5 次\n\n你做得很好。\n此刻，你只需要呼吸。✨`,
    },
  ];
}

// ===== 處理使用者訊息 =====
async function handleMessage(event) {
  const userId = event.source.userId;
  const text = event.message.text?.trim();

  if (!text) return;

  switch (text) {
    case '開始':
    case '訂閱':
    case '啟用':
      subscribers.add(userId);
      console.log(`✅ 新訂閱：${userId}（目前 ${subscribers.size} 人）`);
      return replyMessage(event.replyToken, [
        {
          type: 'text',
          text: `🌅 歡迎加入日日一詩！\n\n從明天起，每天早上 ${PUSH_HOUR} 點\n你會收到一首為你挑選的詩\n搭配一段呼吸的時光\n\n願文字成為你的呼吸 ✨\n\n（傳「說明」查看更多功能）`,
        },
      ]);

    case '停止':
    case '取消':
      subscribers.delete(userId);
      console.log(`❌ 取消訂閱：${userId}（目前 ${subscribers.size} 人）`);
      return replyMessage(event.replyToken, [
        {
          type: 'text',
          text: '已取消每日推播。\n\n隨時傳「開始」就能再次啟用。\n願你一切安好 🍃',
        },
      ]);

    case '今日':
    case '今天':
    case '今日的詩':
      return replyMessage(event.replyToken, formatPoemMessage(getTodayPoem()));

    case '隨機':
    case '再一首':
    case '抽詩':
      return replyMessage(event.replyToken, formatRandomPoemMessage());

    case '呼吸':
    case '放鬆':
      return replyMessage(event.replyToken, getBreatheMessage());

    case '說明':
    case '幫助':
    case '選單':
    case 'help':
      return replyMessage(event.replyToken, getHelpMessage());

    default:
      // 對於不認識的文字，回覆溫柔的引導
      return replyMessage(event.replyToken, [
        {
          type: 'text',
          text: `謝謝你的文字 🍂\n\n試試傳「今日」看今天的詩\n或傳「呼吸」來一段放鬆練習\n\n（傳「說明」查看完整功能）`,
        },
      ]);
  }
}

// ===== 處理追蹤事件 =====
async function handleFollow(event) {
  const userId = event.source.userId;
  subscribers.add(userId);
  console.log(`🆕 新好友加入：${userId}`);

  return replyMessage(event.replyToken, [
    {
      type: 'text',
      text: `🌿 歡迎來到「日日一詩」\n\n這裡，每天有一首詩等著你\n還有一段呼吸的時光\n\n傳送「開始」啟用每日推播\n或傳送「今日」立即閱讀今天的詩\n\n願文字成為你的呼吸 ✨`,
    },
  ]);
}

// ===== Webhook Endpoint =====
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  // 驗證簽章
  const signature = req.headers['x-line-signature'];
  if (!validateSignature(req.body, signature)) {
    console.error('❌ 簽章驗證失敗');
    return res.status(403).send('Invalid signature');
  }

  const body = JSON.parse(req.body);
  const events = body.events || [];

  // 處理所有事件
  const results = await Promise.allSettled(
    events.map(async (event) => {
      switch (event.type) {
        case 'message':
          if (event.message.type === 'text') {
            return handleMessage(event);
          }
          break;
        case 'follow':
          return handleFollow(event);
        case 'unfollow':
          subscribers.delete(event.source.userId);
          console.log(`👋 使用者取消好友：${event.source.userId}`);
          break;
      }
    })
  );

  // 記錄錯誤
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(`Event ${i} failed:`, result.reason);
    }
  });

  res.status(200).json({ ok: true });
});

// ===== 健康檢查 =====
app.get('/', (req, res) => {
  res.json({
    name: '日日一詩 LINE Bot',
    status: 'running',
    subscribers: subscribers.size,
    todayPoem: getTodayPoem().title,
  });
});

// ===== 每日定時推播 =====
cron.schedule(`${PUSH_MINUTE} ${PUSH_HOUR} * * *`, async () => {
  const poem = getTodayPoem();
  const messages = formatPoemMessage(poem);

  console.log(`\n🌅 開始每日推播 — ${poem.title}（${poem.author}）`);
  console.log(`📤 推播對象：${subscribers.size} 人\n`);

  for (const userId of subscribers) {
    try {
      await pushMessage(userId, messages);
      console.log(`  ✅ ${userId}`);
    } catch (err) {
      console.error(`  ❌ ${userId}:`, err.message);
      // 如果推播失敗（使用者已封鎖），移除訂閱
      if (err.message?.includes('Invalid reply token') || err.message?.includes('User not found')) {
        subscribers.delete(userId);
      }
    }
  }

  console.log(`\n✨ 推播完成\n`);
}, {
  timezone: 'Asia/Taipei',
});

// ===== 啟動伺服器 =====
app.listen(PORT, () => {
  console.log(`\n🌿 日日一詩 LINE Bot 已啟動`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`⏰ 每日推播時間: ${PUSH_HOUR}:${String(PUSH_MINUTE).padStart(2, '0')} (Asia/Taipei)`);
  console.log(`🔗 Webhook URL: https://your-domain.com/webhook\n`);
});
