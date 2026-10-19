/* 今日行程：由 iPhone Shortcut 寫入 Gist，公開網頁唯讀。 */
(() => {
  "use strict";
  const gistUrl =
    "https://gist.githubusercontent.com/Beidandow/ae9a628b872d72ef0e019324ac6cadae/raw/clockin.json";
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
    ".daily-status h2{font-size:13px;font-weight:500;opacity:.72;margin:0 0 10px}",
    ".daily-status .current-status{font-size:22px;font-weight:700;margin:0}",
    ".daily-status .help{font-size:12px;line-height:1.6;margin:12px 0 0;opacity:.7}"
  ].join("\n");
  document.head.appendChild(style);

  const section = document.createElement("section");
  section.className = "daily-status";
  section.setAttribute("aria-label", "今日行程公告");
  section.innerHTML = [
    '<h2>今日行程公告</h2>',
    '<p class="current-status" id="todayActivityValue" aria-live="polite">讀取中…</p>',
    '<p class="help">由個人 iPhone 捷徑設定 · 訪客僅能查看</p>'
  ].join("");
  anchor.insertAdjacentElement("beforebegin", section);

  const value = section.querySelector("#todayActivityValue");

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

  async function refresh() {
    try {
      const response = await fetch(gistUrl + "?t=" + Date.now(), {cache: "no-store"});
      if (!response.ok) throw new Error("Gist HTTP " + response.status);
      const data = await response.json();
      const activityDate =
        typeof data.activity_date === "string" ? data.activity_date : data.date;
      value.textContent =
        activityDate === todayInTaiwan() &&
        Object.prototype.hasOwnProperty.call(labels, data.activity)
          ? labels[data.activity]
          : "今天尚未公告";
    } catch (error) {
      value.textContent = "公告暫時無法讀取";
      console.error("讀取今日行程失敗：", error);
    }
  }

  refresh();
  setInterval(refresh, 30000);
})();