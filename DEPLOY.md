# 日日一詩 — 部署指南

## 📁 專案結構

```
dailypoem/
├── index.html              ← 網站主頁（部署到 GitHub Pages）
├── poems.json              ← 詩庫 JSON
├── linebot-vercel/         ← LINE Bot（部署到 Vercel）
│   ├── api/
│   │   ├── webhook.js      ← LINE Webhook 處理
│   │   └── cron.js         ← 每日推播 Cron Job
│   ├── lib/
│   │   └── poems.js        ← 詩庫模組
│   ├── vercel.json         ← Vercel 設定
│   ├── package.json
│   └── .env.example
```

---

## 一、網站部署（GitHub Pages）

### 步驟 1：建立 GitHub Repository

1. 前往 [github.com/new](https://github.com/new)
2. Repository 名稱填 `dailypoem`（或你喜歡的名字）
3. 設為 **Public**
4. 點擊 **Create repository**

### 步驟 2：上傳檔案

在你的電腦開啟終端機：

```bash
cd dailypoem

# 初始化 git
git init
git add index.html
git commit -m "初始化：日日一詩網站"

# 連結到你的 GitHub（把 YOUR_USERNAME 換成你的帳號）
git remote add origin https://github.com/YOUR_USERNAME/dailypoem.git
git branch -M main
git push -u origin main
```

### 步驟 3：啟用 GitHub Pages

1. 進入 Repository → **Settings** → **Pages**
2. Source 選 **Deploy from a branch**
3. Branch 選 `main`，資料夾選 `/ (root)`
4. 點擊 **Save**
5. 等幾分鐘後，網站就會上線在：
   `https://YOUR_USERNAME.github.io/dailypoem/`

---

## 二、LINE Bot 部署（Vercel）

### 步驟 1：建立 LINE Bot 的 GitHub Repository

```bash
cd linebot-vercel

git init
git add .
git commit -m "初始化：日日一詩 LINE Bot"

# 建立另一個 repo（把 YOUR_USERNAME 換成你的帳號）
git remote add origin https://github.com/YOUR_USERNAME/dailypoem-linebot.git
git branch -M main
git push -u origin main
```

### 步驟 2：部署到 Vercel

1. 前往 [vercel.com](https://vercel.com) 並用 GitHub 帳號登入
2. 點擊 **Add New** → **Project**
3. 選擇你剛建立的 `dailypoem-linebot` Repository
4. 框架選 **Other**
5. 點擊 **Deploy**

### 步驟 3：設定環境變數

部署完成後：

1. 進入 Vercel Project → **Settings** → **Environment Variables**
2. 加入以下變數：

| Name | Value |
|------|-------|
| `LINE_CHANNEL_ACCESS_TOKEN` | 從 LINE Developers 取得 |
| `LINE_CHANNEL_SECRET` | 從 LINE Developers 取得 |
| `CRON_SECRET` | 自行設定一組隨機字串（例如 `my-secret-123`） |

3. 設定完後，回到 **Deployments** → 點最新的部署 → **Redeploy**

### 步驟 4：設定 Vercel Cron Secret

為了讓 Cron Job 安全執行：

1. 進入 Vercel Project → **Settings** → **Environment Variables**
2. 確認 `CRON_SECRET` 已設定
3. Cron Job 會在每天台北時間早上 8:00 自動執行推播

---

## 三、LINE Developers 設定

### 設定 Webhook URL

1. 前往 [LINE Developers Console](https://developers.line.biz/console/)
2. 選擇你的 Messaging API Channel
3. 進入 **Messaging API** 分頁
4. 在 **Webhook URL** 填入：
   ```
   https://你的vercel專案.vercel.app/webhook
   ```
   （例如 `https://dailypoem-linebot.vercel.app/webhook`）
5. 點擊 **Verify** 確認連線成功
6. 開啟 **Use webhook** 開關

### 其他建議設定

- **Auto-reply messages**：建議關閉（因為 Bot 已經有自訂回覆）
- **Greeting messages**：建議關閉（Bot 的 follow 事件會自動歡迎）

---

## 四、測試

1. **網站**：打開 `https://YOUR_USERNAME.github.io/dailypoem/` 確認可看到詩
2. **LINE Bot**：
   - 用手機掃描 LINE Bot 的 QR Code 加好友
   - 傳送「今日」→ 應收到今天的詩
   - 傳送「隨機」→ 應收到隨機一首詩
   - 傳送「呼吸」→ 應收到呼吸練習引導
3. **每日推播**：Vercel Cron 會在每天 UTC 0:00（台北 8:00）自動對所有好友廣播

---

## 常見問題

**Q: Webhook Verify 失敗？**
→ 確認 Vercel 部署成功，以及環境變數都已設定。可以先在瀏覽器打開 `https://你的專案.vercel.app/webhook` 看是否回傳 JSON。

**Q: 每日推播沒有收到？**
→ Vercel 免費方案的 Cron Job 每天執行一次。確認 `CRON_SECRET` 環境變數有設定。也可以在 Vercel Dashboard → Logs 查看執行紀錄。

**Q: 想改推播時間？**
→ 修改 `vercel.json` 裡的 cron schedule（UTC 時間）。例如改成台北 9:00 = UTC 1:00：`"schedule": "0 1 * * *"`
