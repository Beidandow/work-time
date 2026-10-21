# Work Time｜打卡與今日行程公告

GitHub Pages： https://beidandow.github.io/work-time/

## 架構

```text
iPhone 捷徑（唯一寫入端）
  └─ GitHub Gist API PATCH（憑證只留在捷徑）
      └─ clockin.json（資料來源）
          └─ GitHub Pages：index.html（每 30 秒讀一次）
              ├─ 下班時間／倒數／首次打卡
              └─ activity.js（使用同一筆資料，不額外抓取 Gist）
                    └─ 今日行程公告（訪客唯讀）
```

## Gist 資料格式

```json
{
  "date": "2026-10-21",
  "first_clock_in": "08:30",
  "leave_time": "17:30",
  "activity_date": "2026-10-21",
  "activity": "gym"
}
```

- `date`：打卡日期（臺灣時間，YYYY-MM-DD）。
- `first_clock_in`：當日第一次打卡，捷徑需保留原始值。
- `leave_time`：預計下班時間（目前捷徑以首次打卡後 +9 小時計算）。
- `activity_date`：公告所屬日期。若省略，網頁用 `date`。
- `activity`：`mahjong`（打牌）、`gym`（健身）、`pass`（PASS）。

頁面只顯示當天公告；同時支援跨午夜的下班倒數。

## 互動方式

- 「立即更新」同時更新下班時間與今日行程。
- 「下個風格」逐一切換；「選擇風格」可直接從 6 種主題中選擇。
- 「分享連結」使用 iPhone 原生分享介面，沒有分享 API 時退回複製。
- 頁面可見時每 30 秒同步一次；切回分頁或網路恢復時再讀取。
- 只有 iPhone 捷徑能編輯資料，朋友開啟 GitHub Pages 僅能查看。

## 維護與安全

- 修改版面：編輯 `index.html`。
- 修改今日公告呈現：編輯 `activity.js`。
- 修改資料內容：從原本的 iPhone 捷徑更新 Gist，**不用每次 Git commit**。
- `today-status.json` 是舊版公告資料，**目前網站沒有讀取此檔案**。
- 切勿把 GitHub Token 或管理密碼寫入公開 HTML/JavaScript；前端輸入的固定密碼無法實現可靠權限控管。
