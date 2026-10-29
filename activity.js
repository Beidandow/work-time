/* 今日行程：只由 iPhone Shortcut 寫入 Gist；GitHub Pages 對訪客唯讀。
   使用 index.html 取得的同一份 Gist 資料，不再重複發出網路請求。 */
(() => {
  "use strict";
  const labels = Object.freeze({
    mahjong: "今天打牌",
    gym: "今天健身",
    pass: "今天 PASS"
  });
  const anchor = document.querySelector(".actions");
  if (!anchor) return;

  const style = document.createElement("style");
  style.textContent = [
    ".daily-status{width:min(100%,380px);margin:20px auto 0;padding:18px 14px;border-radius:16px;border:1px solid #8887;background:#8882;color:inherit}",
    ".daily-status h2{font-size:13px;font-weight:600;opacity:.75;margin:0 0 10px}",
    ".daily-status .current-status{font-size:clamp(20px,6vw,26px);font-weight:750;line-height:1.4;margin:0}",
    ".daily-status .help{font-size:12px;line-height:1.6;margin:10px 0 0;opacity:.75}",
    ".daily-status[data-state=active]{border-color:currentColor}",
    ".daily-status[data-state=error] .current-status{font-size:18px;opacity:.85}"
  ].join("\n");
  document.head.appendChild(style);

  const section = document.createElement("section");
  section.className = "daily-status";
  section.dataset.state = "loading";
  section.setAttribute("aria-label", "今日行程公告");
  section.innerHTML = [
    '<h2>今日行程公告</h2>',
    '<p class="current-status" id="todayActivityValue" aria-live="polite">讀取中…</p>',
    '<p class="help" id="activitySync">網頁開啟時每 30 秒自動同步</p>'
  ].join("");
  anchor.insertAdjacentElement("beforebegin", section);

  const value = section.querySelector("#todayActivityValue");
  const sync = section.querySelector("#activitySync");
  let everLoaded = false;
  let lastData = null;

  function todayInTaiwan() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());
    const p = Object.fromEntries(
      parts.filter(x => x.type !== "literal").map(x => [x.type, x.value])
    );
    return [p.year, p.month, p.day].join("-");
  }

  function render(data) {
    if (!data || typeof data !== "object") return;
    everLoaded = true;
    lastData = data;
    const activityDate = typeof data.activity_date === "string"
      ? data.activity_date : data.date;
    // 支援既有預設值 mahjong/gym/pass，也支援捷徑直接送出的自訂文字。
    // 內容一律用 textContent 呈現，避免把使用者輸入當作 HTML 執行。
    const rawActivity = typeof data.activity === "string"
      ? data.activity.replace(/[\u0000-\u001f\u007f]/g, " ").trim()
      : "";
    const isPreset = Object.prototype.hasOwnProperty.call(labels, rawActivity);
    const activityText = isPreset ? labels[rawActivity]
      : (rawActivity.length > 0 && rawActivity.length <= 80 ? rawActivity : "");
    const hasTodayActivity = activityDate === todayInTaiwan() && Boolean(activityText);
    value.textContent = hasTodayActivity ? activityText : "今天尚未公告";
    section.dataset.state = hasTodayActivity ? "active" : "empty";
    const now = new Intl.DateTimeFormat("zh-TW", {
      timeZone:"Asia/Taipei", hour:"2-digit", minute:"2-digit", hourCycle:"h23"
    }).format(new Date());
    sync.textContent = `同步於 ${now}`;
  }

  function showNetworkError() {
    // 即使離線，也不能讓昨天的行程在午夜後繼續顯示。
    if (lastData) render(lastData);
    if (!everLoaded) {
      value.textContent = "公告暫時無法讀取";
      section.dataset.state = "error";
    }
    sync.textContent = everLoaded
      ? "連線中斷，暫時顯示上次同步內容"
      : "請確認網路連線，或點選「立即更新」";
  }

  window.addEventListener("worktime:data", event => render(event.detail));
  window.addEventListener("worktime:network-error", showNetworkError);

  // activity.js 以 defer 載入：避免在腳本下載期間錯過首筆資料。
  if (window.worktimeLastData) render(window.worktimeLastData);
  else if (window.worktimeFetchFailed) showNetworkError();

  function expirePreviousDay() {
    if (!lastData) return;
    const activityDate = typeof lastData.activity_date === "string"
      ? lastData.activity_date : lastData.date;
    if (activityDate !== todayInTaiwan()) {
      value.textContent = "今天尚未公告";
      section.dataset.state = "empty";
    }
  }
  setInterval(expirePreviousDay, 60 * 1000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) expirePreviousDay();
  });
})();
