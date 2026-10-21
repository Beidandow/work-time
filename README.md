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
- `activity`：`mahjong`（打牌）、`gym`（健身）、`pass`（PASS），或直接填寫 1～80 個字元的自訂行程。自訂內容會原樣顯示，不需再新增 `activity_text` 欄位。

頁面只顯示當天公告；同時支援跨午夜的下班倒數。

## 互動方式

- 「立即更新」同時更新下班時間與今日行程。
- 「下個風格」逐一切換；「選擇風格」可直接從 6 種主題中選擇。
- 「分享連結」使用 iPhone 原生分享介面，沒有分享 API 時退回複製。
- 頁面可見時每 30 秒同步一次；切回分頁或網路恢復時再讀取。
- 只有 iPhone 捷徑能編輯資料，朋友開啟 GitHub Pages 僅能查看。


## iPhone 捷徑：選擇或手動輸入今日行程

在原有捷徑的 Gist PATCH 前新增「從選單中選擇」，包含四個項目：

1. **打牌**：加入「文字」動作，內容填 `mahjong`，再「設定變數」`Activity`。
2. **健身**：文字填 `gym`，設定 `Activity`。
3. **PASS**：文字填 `pass`，設定 `Activity`。
4. **手動輸入**：加入「詢問輸入」（輸入類型：文字，提示「請輸入今天的行程」），把輸入結果設定到 `Activity`。

四個分支完成後，統一使用 `Activity` 變數作為 `clockin.json` 的 `activity` 值，另把當天日期 `yyyy-MM-dd` 寫入 `activity_date`。不必額外建立新的 Gist 或 GitHub Repository。

完整邏輯應是：
```text
讀取原本 clockin.json
  ├─ 今天首次打卡：紀錄 first_clock_in，計算 leave_time（+9 小時）
  └─ 今天已經打卡：沿用 first_clock_in 和 leave_time（不可覆蓋）
      ↓
「從選單中選擇」：打牌／健身／PASS／手動輸入
      ↓
設定 Activity 與 activity_date
      ↓
原本的「文字(JSON) → 詞典 → 取得 URL 內容(PATCH)」
      ↓
Gist：files → clockin.json → content
```

**重要：** 原本只允許「首次打卡」時執行的 PATCH，若要支援當天反覆修改行程，需移到第一次打卡判斷的後方，讓每次執行均可更新行程；只有首次打卡時間的計算保留在首次條件內。捷徑的 GitHub Token 仍放在捷徑內，不能放到 GitHub Pages 的公開 HTML/JavaScript。

例如手動輸入「18:30 聚餐」，Gist 中的 `activity` 儲存「18:30 聚餐」，網頁直接顯示「18:30 聚餐」。若文字有引號或換行，建議用捷徑的詞典資料產生有效 JSON 字串，避免手動拼接 JSON 導致格式錯誤。

## 維護與安全

- 修改版面：編輯 `index.html`。
- 修改今日公告呈現：編輯 `activity.js`。
- 修改資料內容：從原本的 iPhone 捷徑更新 Gist，**不用每次 Git commit**。
- `today-status.json` 是舊版公告資料，**目前網站沒有讀取此檔案**。
- 切勿把 GitHub Token 或管理密碼寫入公開 HTML/JavaScript；前端輸入的固定密碼無法實現可靠權限控管。
