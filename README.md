# 日日一詩 — 與文字呼吸

一個文青風的每日一詩網站，搭配呼吸放鬆功能與 LINE 每日推播。

---

## 專案結構

```
dailypoem/
├── index.html          ← 網站主頁（可直接開啟）
├── README.md           ← 本文件
└── linebot/            ← LINE Bot 伺服器
    ├── server.js       ← 主程式
    ├── poems.js        ← 詩庫資料
    ├── package.json    ← Node.js 套件設定
    └── .env.example    ← 環境變數範例
```

---

## 一、網站功能

直接用瀏覽器開啟 `index.html` 即可使用：

- **每日一詩**：依日期自動輪替，收錄 14 首古詩詞與現代詩
- **呼吸練習**：4-4-4-4 方塊呼吸法，有圓圈膨脹動畫引導
- **分享功能**：一鍵分享詩句到 LINE、複製詩句
- **響應式設計**：手機和電腦都能舒適閱讀

---

## 二、LINE Bot 設定教學

### Step 1：建立 LINE Bot

1. 前往 [LINE Developers Console](https://developers.line.biz/console/)
2. 建立 Provider → 建立 Messaging API Channel
3. 記下 **Channel Secret**（在 Basic settings 頁面）
4. 在 Messaging API 頁面，點「Issue」產生 **Channel Access Token**

### Step 2：安裝與設定

```bash
cd linebot
npm install
cp .env.example .env
```

編輯 `.env`，填入你的 Token：

```
LINE_CHANNEL_ACCESS_TOKEN=你的_access_token
LINE_CHANNEL_SECRET=你的_channel_secret
```

### Step 3：啟動伺服器

```bash
npm start
```

伺服器會在 port 3000 啟動。

### Step 4：設定 Webhook

你需要一個公開的 HTTPS URL。推薦使用以下方式：

**方法 A：ngrok（開發測試用）**
```bash
ngrok http 3000
```
把產生的 https URL 複製起來。

**方法 B：部署到雲端（正式使用）**

推薦平台：
- **Railway**：`railway up`（最簡單）
- **Render**：連結 GitHub repo 自動部署
- **Fly.io**：`fly launch && fly deploy`

### Step 5：LINE Developers Console 設定 Webhook

1. 回到 LINE Developers Console
2. 在 Messaging API 頁面
3. 設定 Webhook URL 為：`https://你的網域/webhook`
4. 開啟「Use webhook」
5. 關閉「Auto-reply messages」（在 LINE Official Account Manager）

### Step 6：完成！

掃描 QR Code 加入好友，傳送「開始」就能啟用每日推播。

---

## 三、LINE Bot 指令

| 指令 | 功能 |
|------|------|
| `開始` | 啟用每日推播 |
| `停止` | 取消每日推播 |
| `今日` | 查看今天的詩 |
| `隨機` | 隨機抽一首詩 |
| `呼吸` | 呼吸練習引導 |
| `說明` | 查看使用指南 |

---

## 四、自訂詩庫

編輯 `linebot/poems.js`（以及 `index.html` 中的 poems 陣列），新增你喜歡的詩：

```javascript
{
  title: "詩名",
  author: "作者",
  body: "第一行\n第二行\n第三行",
  note: "一段溫柔的小語"
}
```

---

## 五、連結網站與 LINE Bot

在 `index.html` 中找到 `line-add-btn`，把 `href="#"` 改成你的 LINE 官方帳號加好友連結：

```html
<a href="https://line.me/R/ti/p/@你的帳號ID" class="line-btn" id="line-add-btn">
```

---

願文字成為你的呼吸 🍃
