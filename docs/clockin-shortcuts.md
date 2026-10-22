# ClockIn 捷徑逐步修改

依既有截圖修改；保留 Gist、+9 小時計算與唯一一次 PATCH。網頁已支援 `activity`、`activity_date`，不必建立另一份公告資料。

## 1. 保存讀取結果，避免選錯「詞典」

原本 GET →「從輸入取得詞典」之後，加入「設定變數」`SavedRecord`，輸入明確選這個解析後的詞典。後續讀取 `date`、`first_clock_in`、`leave_time`，一律指定 `SavedRecord`，不要選到最後組 PATCH 的外層詞典。

建議把原本 raw GET 換成 `https://api.github.com/gists/ae9a628b872d72ef0e019324ac6cadae`，Method 選 GET，公開讀取不用 Authorization。依序「取得詞典值」`files` → `clockin.json` → `content` →「從輸入取得詞典」→ `SavedRecord`。這裡取回的是內層 clockin.json，不能把整個 API 回應當打卡紀錄。若回應有錯、缺少檔案或無法解析，顯示錯誤並停止；不能把讀取失敗視為今日首次打卡。

日期格式維持 `yyyy-MM-dd`，時間維持 `HH:mm`，以台北時間執行（iPhone 時區設為台北）。`TodayText` 是今天日期；`SaveDateText` 是 `SavedRecord.date` 轉成文字。

## 2. 修改「保留第一次打卡」分支（最重要）

在 `If SaveDateText is TodayText` 裡，找到「保留第一次打卡」：

1. 「取得詞典值」：`SavedRecord` 的 `first_clock_in`。
2. 「設定變數」：`SaveClockIn`＝剛取得的值。
3. 「取得詞典值」：`SavedRecord` 的 `leave_time`。
4. 「設定變數」：`SaveLeaveTime`＝剛取得的值。
5. **新增**「設定變數」：`ClockInTime`＝`SaveClockIn`。
6. **新增**「設定變數」：`LeaveTime`＝`SaveLeaveTime`。
7. 原本「顯示文字：今日已打卡」可以保留。
8. **刪除此分支的「停止此捷徑」**，繼續執行下方共用行程選單。其他錯誤處理的停止動作仍保留。

若今日紀錄缺少上、下班時間，請顯示錯誤並停止，不要用本次現在時間補寫。

「手動修改打卡」分支維持原有輸入時間及 +9 小時計算，最後仍設定 `ClockInTime`、`LeaveTime`；這是唯一允許本人刻意改寫今日上班時間的選項。

外層 Otherwise（今天尚未打卡）沿用原本由現在時間計算的 `ClockInTime`、`LeaveTime`。不要在外層 End If 之後再次設定現在時間，否則會覆寫保留值。

## 3. 共用行程選單放置位置

放在**整個日期判斷的 End If 後面、最後 JSON 文字前面**。選單各分支使用「文字」接「設定變數」，明確指定輸入，不要依賴不確定的選單輸出。

| 選單項目 | 「文字」內容 | 下一個動作 |
| --- | --- | --- |
| 打牌 | `mahjong` | 設定變數 `Activity`＝該文字 |
| 健身 | `gym` | 設定變數 `Activity`＝該文字 |
| Pass | `pass` | 設定變數 `Activity`＝該文字 |

Pass 表示公開顯示「今天 PASS」，仍要送出 PATCH；不是跳過上傳。取消選單則結束，不上傳。

```text
取得現在日期 → TodayText / ClockInTime / LeaveTime（+9 小時）
GET Gist → 解析 clockin.json → SavedRecord
If SaveDateText = TodayText
    選單：保留第一次打卡 / 手動修改打卡
        保留：ClockInTime = SaveClockIn；LeaveTime = SaveLeaveTime
        手動：沿用原本輸入、計算與設定變數
    End Menu
Otherwise
    沿用本次首次打卡時間與 +9 小時結果
End If
選單：打牌 / 健身 / Pass → 設定 Activity
End Menu
JSON 文字 → PATCH 詞典 → 原本 Gist PATCH → 驗證回應
```

## 4. 替換最後的 JSON「文字」

下面 `[變數名稱]` 全部必須插入捷徑的彩色變數標籤，不能直接打成方括號文字。前三個欄位不改名稱，只新增最後兩個。

```json
{
  "date": "[TodayText]",
  "first_clock_in": "[ClockInTime]",
  "leave_time": "[LeaveTime]",
  "activity_date": "[TodayText]",
  "activity": "[Activity]"
}
```

把這個文字動作的結果「設定變數」為 `ClockinJSON`。此範本只接受選單固定的三種代碼；若仍保留自訂文字功能，改用「詞典」建立內層資料，再轉成 JSON 文字，避免引號或換行破壞 JSON。

如果實際紀錄還有額外欄位，請從 `SavedRecord` 用「設定詞典值」逐一更新上述五個 key，每一步把回傳詞典重新存回變數，最後轉為 JSON 文字；不要用這個五欄範本丟掉其他欄位。不同日期的新紀錄須清掉前一天的行程。

## 5. 沿用外層 PATCH 詞典

原本「詞典」展開後確認是這個層次；`content` 的類型為**文字**，值選 `ClockinJSON`，不是內層詞典物件，也不是之前「今日已打卡」的顯示文字。

```text
詞典
└─ files（詞典）
   └─ clockin.json（詞典）
      └─ content（文字）＝ ClockinJSON
```

接原本「取得 URL 內容」：

- URL：`https://api.github.com/gists/ae9a628b872d72ef0e019324ac6cadae`
- Method：`PATCH`
- Headers：沿用私有憑證變數的 Authorization；Accept 為 `application/vnd.github+json`。
- Request Body：`JSON`，使用上述 `files → clockin.json → content` 詞典。若介面顯示逐欄輸入，在 JSON 本文建立 `files` 詞典，內容選上述詞典的 files 值；不要把整份 payload 再包進另一層 files。

PATCH 會替換 clockin.json 的**完整內容**，不會自動合併檔案內的欄位，所以不能只上傳 activity。其他 Gist 檔案不需列入。

憑證只由 iPhone 私有憑證來源提供給捷徑變數；本文與網站皆不填入 PAT。不需更動既有有效權限；若出現 403，檢查憑證是否有 Gist 寫入權限。不要把含憑證的捷徑匯出檔、畫面或 Authorization 值放進公開 repo。

## 6. 確認成功再顯示完成

PATCH 後不要立即無條件顯示成功。從回應取 `files → clockin.json → content`，解析成詞典，比對 `date`、`first_clock_in`、`leave_time`、`activity_date`、`activity` 是否等於本次預期值；全部符合才顯示「已同步」。回應錯誤或不符合就顯示失敗並停止，保留目前資料，勿改用現在時間重建後重送。

## 驗收

1. 首次打卡選「打牌」：記錄首次上班時間、+9 小時下班時間及 `mahjong`。
2. 同日再執行，選「保留第一次打卡」→「健身」：兩個時間完全不變，activity 變成 `gym`。
3. 再選 Pass：兩個時間仍不變，網頁顯示「今天 PASS」。
4. 明天首次執行才建立明天的上、下班時間；今天的行程不會沿用到明天。
5. 打開網站按「立即更新」，或保持網頁可見等待約 30 秒（Gist raw/CDN 可能另有延遲）。無需重新部署 Pages 才能更新資料。

避免同時執行兩份 ClockIn；GET 後 PATCH 是完整檔案替換，不能保證多個寫入端的競爭安全。

網頁使用現有 `index.html` 的 `worktime:data` 事件與 `activity.js`，同一份 Gist 同步時間和行程。行程以 textContent 顯示，並依台北日期判斷；本次補上分頁停留跨午夜及離線時過期公告的清除。

參考：[Apple 選單動作](https://support.apple.com/guide/shortcuts/use-the-choose-from-menu-action-apdd7bf369da/ios)、[GitHub 更新 Gist API](https://docs.github.com/en/rest/gists/gists#update-a-gist)。
