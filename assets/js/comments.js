(function () {
  "use strict";
  const host = document.querySelector("[data-comments]");
  if (!host) return;
  const lang = document.documentElement.lang.startsWith("zh") ? "zh" : "en";
  const copy = lang === "zh" ? {
    title: "开放评论", unavailable: "站内评论尚未连接云端服务。您仍可使用 GitHub Discussions 或邮件反馈。",
    nick: "昵称（可选）", email: "邮箱（可选，不公开）", body: "评论", send: "提交评论",
    report: "举报", rules: "评论规则与隐私说明", loading: "正在读取评论……"
  } : {
    title: "Open comments", unavailable: "On-site comments are not connected to the cloud service yet. GitHub Discussions and email remain available.",
    nick: "Name (optional)", email: "Email (optional, never public)", body: "Comment", send: "Post comment",
    report: "Report", rules: "Comment rules and privacy notice", loading: "Loading comments…"
  };
  const config = window.SYNTHESISPE_COMMENTS || {};
  const api = config.enabled ? (config.apiBase || "") : "";
  const page = host.dataset.page || location.pathname;
  host.innerHTML = `<section class="comment-shell"><h2>${copy.title}</h2><div class="comment-list" aria-live="polite">${copy.loading}</div><form class="comment-form"><label>${copy.nick}<input name="nickname" maxlength="50" autocomplete="nickname"></label><label>${copy.email}<input name="email" type="email" maxlength="254" autocomplete="email"></label><label>${copy.body}<textarea name="body" required minlength="2" maxlength="4000"></textarea></label><div class="turnstile-slot"></div><button type="submit">${copy.send}</button></form><p class="comment-fallback" hidden>${copy.unavailable}</p><p><a href="/${lang === "zh" ? "" : "en/"}discussion/">${copy.rules}</a> · <a href="https://github.com/GuangzhuZhang/synthesispe.com/discussions">GitHub Discussions</a> · <a href="mailto:zhangguangzhu1948@gmail.com">Email</a></p></section>`;
  const list = host.querySelector(".comment-list"), form = host.querySelector("form"), fallback = host.querySelector(".comment-fallback");
  function esc(s){ const d=document.createElement("div"); d.textContent=s; return d.innerHTML; }
  function offline(){ list.textContent=""; form.hidden=true; fallback.hidden=false; }
  if (!api) return offline();
  if (config.turnstileSiteKey) {
    const s=document.createElement("script"); s.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"; s.async=true; s.defer=true;
    s.onload=()=>turnstile.render(host.querySelector(".turnstile-slot"),{sitekey:config.turnstileSiteKey,callback:t=>window.turnstileToken=t}); document.head.appendChild(s);
  }
  fetch(`${api}/comments?page=${encodeURIComponent(page)}`, {headers:{Accept:"application/json"}}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{
    list.innerHTML=(data.comments||[]).map(c=>`<article class="comment"><header>${esc(c.nickname||"Anonymous")} · <time>${esc(c.created_at)}</time></header><p>${esc(c.body)}</p><button type="button" data-report="${esc(c.id)}">${copy.report}</button></article>`).join("") || `<p>${lang==="zh"?"暂无评论。":"No comments yet."}</p>`;
  }).catch(offline);
  form.addEventListener("submit", async e=>{e.preventDefault();const fd=new FormData(form);const payload=Object.fromEntries(fd);payload.page=page;payload.turnstileToken=window.turnstileToken||"";const r=await fetch(`${api}/comments`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});if(!r.ok){alert(lang==="zh"?"提交失败，请稍后再试。":"Could not submit. Please try later.");return;} form.reset(); location.reload();});
  list.addEventListener("click", async e=>{const id=e.target.dataset.report;if(!id)return;await fetch(`${api}/reports`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({commentId:id,page})});e.target.disabled=true;});
})();

