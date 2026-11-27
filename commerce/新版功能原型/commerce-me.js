/* Unified commerce library. Reads only commerce storage; camera records stay isolated. */
(() => {
let readError=false;
const read=(key,fallback)=>{try{const raw=localStorage.getItem(key);if(raw===null)return fallback;const value=JSON.parse(raw);if(!Array.isArray(value))throw Error('Invalid records');if(key==='commerce-tasks-v1')value.forEach(t=>{if(t?.state==='unknown')t.state='running'});return value}catch{readError=true;return fallback}};
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const query=new URLSearchParams(location.search);
if(query.has('meStatus')){const u=new URL(location.href);u.searchParams.delete('meStatus');history.replaceState(history.state,'',u)}
let section=query.get('meSection')==='favorites'?'favorites':'works';
let preview=query.get('mePreview')==='1';if(preview)pageStates.me='normal';
const position={works:0,favorites:0};
try{Object.assign(position,JSON.parse(sessionStorage.getItem('commerce-library-position-v1')||'{}'))}catch{}
function remember(){if(tab!=='me')return;position[section]=view.scrollTop;mem.me={top:view.scrollTop,rails:[]};try{sessionStorage.setItem('commerce-library-position-v1',JSON.stringify(position))}catch{}}
view.addEventListener('scroll',remember,{passive:true});
function readFailure(){return `<div class="cm-empty"><h2>暂时无法读取记录</h2><p>请重试，已有记录不会被清除</p><button class="primary" data-cm-reload>重新读取</button></div>`}

function records(){
 if(pageStates.me==='empty')return [];
 if(preview)return [
  {id:'preview-running',template:'c-skin',name:'晨间护肤的仪式感',image:commerceItems[0].img,state:'running',started:Date.now()-2000},
  {id:'preview-failed',template:'c-coffee',name:'下班后的第一杯咖啡',image:commerceItems[1].img,state:'failed',drama:true,started:Date.now()-3600000},
  {id:'preview-done',template:'c-perfume',name:'把香气拍成一段故事',image:commerceItems[2].img,state:'done',started:Date.now()-7200000}
 ];
 const tasks=read('commerce-tasks-v1',[]).filter(t=>t&&typeof t.id==='string'&&commerceItems.some(i=>i.id===t.template));
 let changed=false;tasks.forEach(t=>{if(t.state==='running'&&Date.now()-(t.resumeAt||t.started)>=8000&&['success','input','failed'].includes(t.outcome)){t.state=t.outcome==='success'?'done':'failed';if(t.outcome==='input')t.failureKind='input';changed=true}});
 if(changed)try{localStorage.setItem('commerce-tasks-v1',JSON.stringify(tasks))}catch{}
 return tasks.sort((a,b)=>(Number(b.started)||0)-(Number(a.started)||0));
}
function empty(title,copy){return `<div class="cm-empty"><span aria-hidden="true">${section==='favorites'?'♡':'▷'}</span><h2>${title}</h2><p>${copy}</p><button class="primary" data-cm-browse>去选模板</button></div>`}
function workCard(t){
 const title=t.name==='图中商品'?(t.templateTitle||'我的带货视频'):t.name;
 const labels={running:'生成中',done:'生成完成',failed:'生成失败'};
 const date=new Date(t.started),state=['running','done','failed'].includes(t.state)?t.state:'running';
 const symbol=state==='running'?'<span class="cm-glow" aria-hidden="true">✦</span>':state==='failed'?'<span class="cm-failure-icon" aria-hidden="true">!</span>':'';
 const hint=state==='running'?'点击查看进度':state==='failed'?'修改后重新生成':'';
 return `<button class="cm-work" data-cm-task="${escape(t.id)}" aria-label="${escape(title)}，${labels[state]}"><div class="cm-cover ${state}"><img src="${escape(t.image||commerceItems.find(i=>i.id===t.template)?.img)}" alt="${escape(title)}参考封面">${symbol}<span class="cm-task-status ${state}"><strong>${state==='done'?'✓ ':''}${labels[state]}</strong>${hint?`<small>${hint} ›</small>`:!t.resultImage&&!t.resultVideo&&!t.videoUrl?'<small>示例素材</small>':''}</span></div><strong>${escape(title)}</strong><small>${t.drama?'剧情带货':'视频卖货'}<span>${Number.isFinite(date.getTime())?`${date.getMonth()+1}月${date.getDate()}日`:''}</span></small></button>`
}

function favorites(){readError=false;const ids=pageStates.me==='empty'?[]:read('commerce-favorites-v1',[]),items=commerceItems.filter(t=>ids.includes(t.id));if(readError)return readFailure();return items.length?`<p class="cm-count">收藏的模板 <span>${items.length}</span></p><div class="cm-grid">${items.map(t=>`<article class="cm-favorite">${commerceTile(t)}<button class="cm-unfavorite" data-cm-remove="${escape(t.id)}" aria-label="取消收藏${escape(t.title)}">♥</button></article>`).join('')}</div>`:empty('还没有收藏的模板','喜欢的模板先收藏，下次在这里找。')}
function account(){let signed=false;try{signed=sessionStorage.getItem('commerce-login-demo')==='signed'}catch{}return `<button class="cm-account" data-cm-login><span class="cm-avatar" aria-hidden="true">${signed?'✓':'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="16" cy="11" r="5"/><path d="M6 28v-3a10 10 0 0 1 20 0v3"/></svg>'}</span><span><strong>${signed?'创作用户':'登录／注册'}</strong><small>${signed?'已登录 · 演示账号':'开启你的创作记录'}</small></span></button>`}
function library(){readError=false;const tasks=records(),failed=readError;return `<section class="commerce-library"><div class="cm-account-row">${account()}<button class="icon cm-settings" data-route="settings" aria-label="设置"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" aria-hidden="true"><path d="M6 7h12M6 12h12M6 17h12"/></svg></button></div><div class="cm-tabs" role="tablist" aria-label="我的内容">${[['works','作品与任务'],['favorites','我的收藏']].map(([id,title])=>`<button role="tab" data-cm-section="${id}" aria-selected="${section===id}">${title}</button>`).join('')}</div><div role="tabpanel" aria-label="${section==='works'?'作品与任务':'我的收藏'}">${section==='favorites'?favorites():failed?readFailure():tasks.length?`<div class="cm-grid">${tasks.map(workCard).join('')}</div>`:`<div class="cm-empty"><h2>还没有作品与任务</h2><p>试试新的创作，把想法变成作品</p><button class="primary" data-cm-create>去创作</button></div>`}</div></section>`}

const baseContent=content,baseHeader=header;
content=function(){if(tab!=='me')return baseContent();if(pageStates.me==='loading')return '<div class="state" role="status"><span class="spinner"></span><p>正在加载</p></div>';if(pageStates.me==='error')return emptyView('暂时无法加载','请重试，你的记录不会被清除。','重试','retry');return library()};
header=function(){return tab==='me'?'':baseHeader()};
function persistView(){const url=new URL(location.href);url.searchParams.set('meSection',section);if(preview)url.searchParams.set('mePreview','1');else url.searchParams.delete('mePreview');url.searchParams.delete('meStatus');history.replaceState(history.state,'',url)}
function redraw(){persistView();render();view.scrollTop=position[section]||0}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if('cmLogin'in d){e.stopImmediatePropagation();remember();persistView();try{if(sessionStorage.getItem('commerce-login-demo')==='signed'){openSettings('account');return}}catch{}location.href='手机号登录_v0.1.html?return='+encodeURIComponent(location.href);return}
 if(d.cmSection){e.stopImmediatePropagation();remember();section=d.cmSection;redraw();document.querySelector(`[data-cm-section="${section}"]`)?.focus({preventScroll:true});return}
 if('cmReload'in d){e.stopImmediatePropagation();render();return}
 if('cmCreate'in d){e.stopImmediatePropagation();go('create');return}
 if('cmBrowse'in d){e.stopImmediatePropagation();type='photo';go('templates');return}
 if(d.cmRemove){e.stopImmediatePropagation();readError=false;const ids=read('commerce-favorites-v1',[]).filter(id=>id!==d.cmRemove);if(readError){notify('收藏读取失败，未更改记录');return}try{localStorage.setItem('commerce-favorites-v1',JSON.stringify(ids));render();document.querySelector('[data-cm-section="favorites"]')?.focus({preventScroll:true});notify('已取消收藏')}catch{notify('保存失败，请重试')}return}
 if(d.cmTask){e.stopImmediatePropagation();remember();const t=records().find(t=>t.id===d.cmTask);if(!t)return;persistView();const u=new URL('带货模板与制作_v0.1.html',location.href);u.searchParams.set('stage','task');u.searchParams.set('id',t.template);if(preview){u.searchParams.set('taskPreview',t.state);u.searchParams.set('previewName',t.name);u.searchParams.set('previewDrama',t.drama?'1':'0')}else u.searchParams.set('task',t.id);if(t.draftSlot)u.searchParams.set('draft',t.draftSlot);u.searchParams.set('entry','me');u.searchParams.set('return',location.href);location.href=u;return}
 if('cmPreview'in d){preview=!preview;if(preview)pageStates.me='normal';persistView();b.textContent=preview?'切换为本机实际记录':'预览混合任务状态';if(tab!=='me')go('me');else render();return}
},true);
// Keep the Me page fresh after returning from another tab or window.
window.addEventListener('focus',()=>{if(tab==='me'){const top=view.scrollTop;render();view.scrollTop=top}});
window.addEventListener('pageshow',()=>{if(tab==='me'){view.scrollTop=Number(position[section])||0;mem.me={top:view.scrollTop,rails:[]}}});
document.addEventListener('click',e=>{if(tab==='me'&&e.target.closest('[data-commerce-template]')){remember();persistView()}},true);
window.addEventListener('storage',e=>{if(tab==='me'&&['commerce-tasks-v1','commerce-favorites-v1'].includes(e.key))render()});
setInterval(()=>{if(tab==='me'&&!preview&&read('commerce-tasks-v1',[]).some(t=>t.state==='running'&&Date.now()-(t.resumeAt||t.started)>=8000&&['success','input','failed'].includes(t.outcome))){const top=view.scrollTop;render();view.scrollTop=top}},1000);
window.addEventListener('load',()=>{const panel=document.querySelector('.review');if(panel){const b=document.createElement('button');b.dataset.cmPreview='';b.textContent=preview?'切换为本机实际记录':'预览混合任务状态';panel.append(b);const p=document.createElement('p');p.textContent='评审示意记录不会写入本机任务；已完成项使用示例图片或视频预览。';panel.append(p)}});
})();
