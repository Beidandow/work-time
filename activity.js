
/* 今日活動公告：公開唯讀、GitHub 帳號授權更新 */
(() => {
"use strict";
const file="today-status.json";
const repo="Beidandow/work-time";
const options={mahjong:"今天打牌",gym:"今天健身",pass:"今天 PASS"};
const anchor=document.querySelector(".actions");
if(!anchor)return;

const style=document.createElement("style");
style.textContent=[
".daily-status{width:min(100%,380px);margin:20px auto 0;padding:18px 14px;border-radius:16px;border:1px solid #8887;background:#8882;color:inherit}",
".daily-status h2{font-size:13px;font-weight:500;opacity:.72;margin:0 0 10px}",
".daily-status .current-status{font-size:22px;font-weight:700;margin:0}",
".daily-status .help,.daily-status .feedback{font-size:12px;line-height:1.6;margin:12px 0 8px}",
".daily-status .help{opacity:.75}",
".daily-status input{width:100%;min-height:44px;padding:10px;background:#8882;color:inherit;border:1px solid #888a;border-radius:10px;font:inherit}",
".daily-status .choices{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}",
".daily-status .choices button{flex:1 1 72px;min-height:44px;padding:9px 5px;background:#8882;color:inherit;border:1px solid currentColor;border-radius:10px;font:inherit;cursor:pointer}",
".daily-status .choices button:disabled{opacity:.4}",
".daily-status [hidden]{display:none!important}"
].join("\n");
document.head.appendChild(style);

const section=document.createElement("section");
section.className="daily-status";
section.innerHTML=[
'<h2>今日行程公告</h2>',
'<p class="current-status" id="todayActivityValue" aria-live="polite">讀取中…</p>',
'<div id="todayActivityAdmin" hidden>',
'<p class="help">管理者：輸入只授權本專案的 GitHub Fine-grained Token。Token 只用於這次操作，不會儲存。</p>',
'<input id="todayActivityToken" type="password" autocomplete="off" spellcheck="false" placeholder="GitHub Token">',
'<div class="choices">',
'<button type="button" data-activity="mahjong">打牌</button>',
'<button type="button" data-activity="gym">健身</button>',
'<button type="button" data-activity="pass">PASS</button>',
'</div><p class="feedback" id="todayActivityFeedback" role="status" aria-live="polite"></p>',
'</div>'
].join("");
anchor.insertAdjacentElement("beforebegin",section);

const value=section.querySelector("#todayActivityValue");
const admin=section.querySelector("#todayActivityAdmin");
const input=section.querySelector("#todayActivityToken");
const feedback=section.querySelector("#todayActivityFeedback");
const buttons=[...section.querySelectorAll("button[data-activity]")];
const api="https://api.github.com/repos/"+repo+"/contents/"+file;
let saving=false,holdUntil=0;

function today(){
  const d=new Intl.DateTimeFormat("en-CA",{
    timeZone:"Asia/Taipei",year:"numeric",month:"2-digit",day:"2-digit"
  }).formatToParts(new Date());
  const p=Object.fromEntries(d.filter(x=>x.type!=="literal").map(x=>[x.type,x.value]));
  return [p.year,p.month,p.day].join("-");
}
function display(data){
  const valid=data&&data.date===today()&&Object.hasOwn(options,data.activity);
  value.textContent=valid?options[data.activity]:"今天尚未公告";
}
async function refresh(){
  if(saving||Date.now()<holdUntil)return;
  try{
    const r=await fetch("./"+file+"?t="+Date.now(),{cache:"no-store"});
    if(!r.ok)throw Error(String(r.status));
    display(await r.json());
  }catch(e){value.textContent="公告暫時無法讀取";}
}
if(new URLSearchParams(location.search).get("admin")==="1"){
  admin.hidden=false;
  for(const button of buttons)button.addEventListener("click",async()=>{
    if(saving)return;
    const token=input.value.trim();
    if(!token){feedback.textContent="請輸入你的 GitHub Token。";return;}
    saving=true;
    buttons.forEach(b=>b.disabled=true);
    feedback.textContent="驗證身分並儲存中…";
    const headers={
      Accept:"application/vnd.github+json",
      Authorization:"Bearer "+token,
      "X-GitHub-Api-Version":"2022-11-28"
    };
    try{
      const r=await fetch("https://api.github.com/user",{headers,cache:"no-store"});
      if(!r.ok)throw Error("GitHub Token 無效或已過期");
      const account=await r.json();
      if((account.login||"").toLowerCase()!=="beidandow")
        throw Error("只有 Beidandow 帳號可以修改");
      const current=await fetch(api,{headers,cache:"no-store"});
      if(!current.ok)throw Error("讀取狀態檔失敗 HTTP "+current.status);
      const {sha}=await current.json();
      const obj={date:today(),activity:button.dataset.activity,updated_at:new Date().toISOString()};
      const bytes=new TextEncoder().encode(JSON.stringify(obj,null,2)+"\n");
      let binary="";
      for(const b of bytes)binary+=String.fromCharCode(b);
      const saved=await fetch(api,{
        method:"PUT",headers:{...headers,"Content-Type":"application/json"},
        body:JSON.stringify({
          message:"Update daily activity: "+obj.activity,
          content:btoa(binary),sha:sha
        })
      });
      if(!saved.ok){
        const detail=await saved.json().catch(()=>({}));
        throw Error(detail.message||"儲存失敗 HTTP "+saved.status);
      }
      display(obj);
      input.value="";
      holdUntil=Date.now()+120000;
      feedback.textContent="更新成功！訪客等 GitHub Pages 部署完成即可看到。";
    }catch(e){feedback.textContent="更新失敗："+e.message;}
    finally{saving=false;buttons.forEach(b=>b.disabled=false);}
  });
}
refresh();
setInterval(refresh,30000);
})();
