
/* 今日活動公告：訪客唯讀，GitHub Actions 無 Token 更新 */
(() => {
  "use strict";
  const statusFile = "today-status.json";
  const labels = {
    mahjong: "今天打牌",
    gym: "今天健身",
    pass: "今天 PASS"
  };
  const actionLink = "https://github.com/Beidandow/work-time/actions/workflows/set-today-activity.yml";
  const anchor = document.querySelector(".actions");
  if (!anchor) return;

  const style = document.createElement("style");
  style.textContent = [
    ".daily-status{width:min(100%,380px);margin:20px auto 0;padding:18px 14px;border-radius:16px;border:1px solid #8887;background:#8882;color:inherit}",
    ".daily-status h2{font-size:13px;font-weight:500;opacity:.72;margin:0 0 10px}",
    ".daily-status .current-status{font-size:22px;font-weight:700;margin:0}",
    ".daily-status .help,.daily-status .feedback{font-size:12px;line-height:1.6;margin:12px 0 8px}",
    ".daily-status .help{opacity:.75}",
    ".daily-status input{width:100%;min-height:44px;padding:10px;background:#8882;color:inherit;border:1px solid #888a;border-radius:10px;font:inherit}",
    ".daily-status .choices{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}",
    ".daily-status .choices button,.daily-status .open-actions{flex:1 1 72px;min-height:44px;padding:9px 10px;background:#8882;color:inherit;border:1px solid currentColor;border-radius:10px;font:inherit;cursor:pointer}",
    ".daily-status .open-actions{display:block;text-align:center;text-decoration:none}",
    ".daily-status [hidden]{display:none!important}"
  ].join("\n");
  document.head.appendChild(style);

  const section = document.createElement("section");
  section.className = "daily-status";
  section.innerHTML = [
    '<h2>今日行程公告</h2>',
    '<p class="current-status" id="todayActivityValue" aria-live="polite">讀取中…</p>',
    '<div id="todayActivityAdmin" hidden>',
      '<p class="help">輸入管理密碼</p>',
      '<input id="todayActivityPassword" type="password" inputmode="numeric" autocomplete="off" placeholder="管理密碼">',
      '<div class="choices"><button id="todayActivityUnlock" type="button">解鎖活動選單</button></div>',
      '<p class="feedback" id="todayActivityFeedback" role="status" aria-live="polite"></p>',
      '<div id="todayActivityManage" hidden>',
        '<p class="help">按下方按鈕，登入 GitHub 後在 Run workflow 選擇 mahjong（打牌）、gym（健身）或 pass，再按 Run workflow，即會更新所有訪客看到的公告。</p>',
        '<a class="open-actions" href="' + actionLink + '" target="_blank" rel="noopener noreferrer">開啟 GitHub 活動選單 ↗</a>',
      '</div>',
    '</div>'
  ].join("");
  anchor.insertAdjacentElement("beforebegin", section);

  const value = section.querySelector("#todayActivityValue");
  const admin = section.querySelector("#todayActivityAdmin");
  const password = section.querySelector("#todayActivityPassword");
  const feedback = section.querySelector("#todayActivityFeedback");
  const management = section.querySelector("#todayActivityManage");

  function today() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Taipei",
      year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(new Date());
    const p = Object.fromEntries(parts.filter(x => x.type !== "literal").map(x => [x.type, x.value]));
    return [p.year, p.month, p.day].join("-");
  }

  async function refresh() {
    try {
      const response = await fetch("./" + statusFile + "?t=" + Date.now(), {cache: "no-store"});
      if (!response.ok) throw Error("HTTP " + response.status);
      const data = await response.json();
      value.textContent = data && data.date === today() &&
        Object.prototype.hasOwnProperty.call(labels, data.activity)
        ? labels[data.activity] : "今天尚未公告";
    } catch (_) {
      value.textContent = "公告暫時無法讀取";
    }
  }

  if (new URLSearchParams(location.search).get("admin") === "1") {
    admin.hidden = false;
    section.querySelector("#todayActivityUnlock").addEventListener("click", () => {
      if (password.value === "123") {
        feedback.textContent = "已解鎖。";
        password.value = "";
        password.hidden = true;
        section.querySelector("#todayActivityUnlock").hidden = true;
        management.hidden = false;
      } else {
        feedback.textContent = "密碼錯誤";
      }
    });
  }

  refresh();
  setInterval(refresh, 30000);
})();
