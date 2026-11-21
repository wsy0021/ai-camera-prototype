/* Review-only shell. The product continues to run its own handlers and storage. */
(() => {
'use strict';
const $=s=>document.querySelector(s),data=window.REVIEW_DATA,stages=data.stages,frame=$('#prototype');
let pendingFixture=null;
let current=stages.findIndex(s=>s.id===location.hash.slice(1)),full=false,tab='requirements',lastContext='',lastControls='',size=[402,874];
if(current<0)current=0;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(window.mermaid)mermaid.initialize({startOnLoad:false,theme:'neutral',securityLevel:'strict',flowchart:{htmlLabels:false},themeVariables:{fontFamily:'-apple-system, PingFang SC, sans-serif'}});
async function diagrams(root){if(!window.mermaid)return;const nodes=[...root.querySelectorAll('pre.mermaid:not([data-processed])')];if(nodes.length)try{await mermaid.run({nodes});}catch{nodes.forEach(n=>n.classList.add('diagram-source'));}}
function setTab(value){tab=value;for(const id of ['requirements','checklist']){$('#'+id).hidden=id!==value;const b=$('#'+id+'-tab');b.setAttribute('aria-selected',String(id===value));b.tabIndex=id===value?0:-1;}diagrams($('#'+value));}
function render(){
const s=stages[current];$('#chapters').innerHTML=stages.map((x,i)=>`<button data-module="${i}" aria-current="${current===i}">${escape(x.name)}</button>`).join('');
$('#requirements').innerHTML='<h2>'+escape(s.name)+'</h2>'+s.html;
$('#checklist').innerHTML=`<h2>${escape(s.name)}</h2><h3>评审路径</h3><ol>${s.steps.map(x=>`<li>${escape(x)}</li>`).join('')}</ol><h3>本次核对</h3><p>勾选仅作本页临时记录，不表示验收结果已归档。</p><ul class="check-list">${s.checks.map(x=>`<li><input type="checkbox" aria-label="${escape(x)}"><span>${escape(x)}</span></li>`).join('')}</ul><h3>实现与验收边界</h3><p class="boundary">${escape(s.boundary)}</p>`;
$('#previous').disabled=current===0;$('#next').disabled=current===stages.length-1;$('#position').textContent=`${current+1} / ${stages.length}`;
history.replaceState(null,'','#'+s.id);setTab(tab);
}
function select(i,navigate=true){current=i;render();if(navigate)load();}
function load(){pendingFixture=['generation','result'].includes(stages[current].id)?stages[current].id:null;lastContext='';lastControls='';frame.src=stages[current].url;$('#standalone').href=frame.src;}
function allDocs(){const docs=[];try{const d=frame.contentDocument;if(d?.body){docs.push(d);for(const f of d.querySelectorAll('iframe'))try{if(f.contentDocument?.body)docs.push(f.contentDocument);}catch{}}}catch{}return docs;}
function productDoc(){const ds=allDocs();return ds.find(d=>d.getElementById('previewState'))||ds[0];}
function fixFrame(d,inner=false){
 if(d.getElementById('new-product-review-embed'))return;
 const style=d.createElement('style');style.id='new-product-review-embed';
 style.textContent=`html,body{margin:0!important;padding:0!important;background:#111112!important;min-width:0!important;overflow:hidden!important}body>.stage,main.stage{padding:0!important;gap:0!important;display:block!important}.stage>aside,aside.review,.reviewbar,.reviewtools,.hint,.review>.reviewbar,.review>.reviewtools{display:none!important}.phone{margin:0!important;border:0!important;border-radius:0!important;width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;box-shadow:none!important}main.review{padding:0!important;width:100%!important;max-width:none!important;min-height:0!important}.review>.phone{height:100dvh!important}.phone .phone{border-radius:0!important}.phone[data-product-page=create] .product-studio-host{overflow:hidden!important}`;
 d.head.append(style);
}
function applySize(){
 const [w,h]=size;document.documentElement.style.setProperty('--canvas-width',w+'px');document.documentElement.style.setProperty('--canvas-height',h+'px');frame.width=w;frame.height=h;
 for(const d of allDocs()){
  const phone=d.querySelector('.phone');if(phone){phone.style.setProperty('--w',w+'px');phone.style.setProperty('--h',h+'px');phone.dataset.small=String(h<720);}
 }
}
function context(){
 const d=frame.contentDocument;if(!d?.body)return null;const url=new URL(d.location.href),file=decodeURIComponent(url.pathname.split('/').pop()),p=url.searchParams;
 let id,description='';
 if(file==='首页功能探索_v0.1.html'){
  const page=d.querySelector('.phone')?.dataset.productPage||p.get('tab')||'discover';
  if(page==='create'){
   const studio=productDoc();const edit=studio?.getElementById('tabEdit')?.getAttribute('aria-selected')==='true';id=edit?'edit':'create';description=edit?'Edit工作区':'Create工作区';
  }else if(!d.getElementById('settings-panel')?.hidden&&d.getElementById('settings-panel')){id='settings';description='设置';}
  else{id=({discover:'home',templates:'templates',videos:'templates',events:'events',me:'me'})[page]||'home';description=stages.find(s=>s.id===id)?.name;}
 }else if(file==='制作页面_并排配对_v0.1.html'){
  const state=d.querySelector('.phone')?.dataset.state||'pick';id=state==='success'?'result':['checking','generating','failed','unknown','missing'].includes(state)?'generation':'upload';description=({pick:'上传照片',checking:'检查照片',generating:'生成中',success:'制作成功',failed:'生成失败',unknown:'状态未知',missing:'任务不可用'})[state]||state;
 }else if(file==='index.html'&&url.pathname.includes('/workspace/')){id=d.getElementById('tabEdit')?.getAttribute('aria-selected')==='true'?'edit':'create';description=id;}
 else if(/隐私|权限|反馈/.test(file)){id='settings';description=file.replace(/_v.*$/,'');}
 else if(/生成成功/.test(file)){id='result';description='结果';}
 else if(/任务与结果|照片准备/.test(file)){id='generation';description='视频／兼容制作链路';}
 else {id='templates';description=file.replace(/_v.*$/,'');}
 return{id,description,href:url.href,file};
}
function addSelect(label,options,value,onchange){
 const l=document.createElement('label');l.textContent=label;const s=document.createElement('select');s.setAttribute('aria-label',label);for(const [v,t]of options){const o=document.createElement('option');o.value=v;o.textContent=t;s.append(o);}s.value=value;s.onchange=()=>onchange(s.value);l.append(s);$('#scene-controls').append(l);return s;
}
function mirrorSelect(d,id,label){const el=d.getElementById(id);if(!el)return;addSelect(label,[...el.options].map(o=>[o.value,o.textContent]),el.value,v=>{el.value=v;el.dispatchEvent(new d.defaultView.Event('change',{bubbles:true}));sync(true);});}
function makeControls(force=false){
 const d=productDoc();if(!d)return;let kind=d.getElementById('previewState')?'studio':d.querySelector('[data-count]')?'upload':'page';
 const key=kind+'|'+d.location.href+'|'+(d.querySelector('.phone')?.dataset.state||'');
 if(!force&&key===lastControls)return;lastControls=key;$('#scene-controls').replaceChildren();
 if(kind==='studio'){
  mirrorSelect(d,'previewState','工作区演示状态');mirrorSelect(d,'nextOutcome','下次生成演示结果');
  const b=document.createElement('button');b.className='scene-action';b.textContent='使用示例照片';b.onclick=()=>{d.getElementById('demoPhoto')?.click();sync(true);};$('#scene-controls').append(b);
  const q=d.getElementById('queryFailureControl');if(q)addSelect('状态查询演示',[['0','正常查询'],['1','查询失败']],q.checked?'1':'0',v=>{q.checked=v==='1';q.dispatchEvent(new d.defaultView.Event('change',{bubbles:true}));});
 }else if(kind==='upload'){
  const count=d.querySelector('[data-count][aria-pressed=true]')?.dataset.count||'1';
  addSelect('输入数量（演示）',[['1','单图'],['2','双图']],count,v=>{d.querySelector(`[data-count="${v}"]`)?.click();sync(true);});
  addSelect('制作演示状态',[['empty','未选照片'],['pick','已选照片'],['checking','检查照片'],['checkfailed','检查未通过'],['generating','生成中'],['success','成功结果'],['failed','生成失败'],['unknown','状态未知']],d.querySelector('.phone')?.dataset.state||'empty',v=>{d.querySelector(`button[data-state="${v}"]`)?.click();sync(true);});
  mirrorSelect(d,'check-outcome','照片检查演示');mirrorSelect(d,'outcome','生成演示结果');
 }else{
  const native=d.querySelector('aside.review select');
  // Reuse only actual review-state controls, not product inputs.
  if(native&&native.options&&[...native.options].some(o=>o.value==='loading')){if(native.id)mirrorSelect(d,native.id,'页面演示状态');}
 }
}
function sync(force=false){
 try{
  const docs=allDocs();for(const d of docs)fixFrame(d);if(force)applySize();
  const c=context();if(!c)return;$('#standalone').href=c.href;$('#page-label').textContent=c.description;$('#current-context').textContent='当前：'+c.description;
  const key=c.id+'|'+c.description+'|'+c.href;
  if(key!==lastContext){lastContext=key;
   // Keep overview/decision reading until an actual in-product transition occurs.
   if($('#follow').checked&&!(stages[current].id==='overview'&&c.id==='home')&&stages[current].id!=='decisions'){
    const next=stages.findIndex(s=>s.id===c.id);if(next>=0&&next!==current)select(next,false);
   }
  }
  makeControls(force);
 }catch{$('#current-context').textContent='原型暂不可读取，可独立打开或重新载入本环节。';}
}
function setFull(value){full=value;$('.workspace').hidden=full;$('#full-document').hidden=!full;$('#parallel').setAttribute('aria-pressed',String(!full));$('#full').setAttribute('aria-pressed',String(full));if(full)diagrams($('#full-document'));}
$('#chapters').onclick=e=>{const b=e.target.closest('[data-module]');if(b){setFull(false);select(Number(b.dataset.module));}};
$('#requirements-tab').onclick=()=>setTab('requirements');$('#checklist-tab').onclick=()=>setTab('checklist');
$('.notes-tabs').onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();setTab(e.key==='Home'?'requirements':e.key==='End'?'checklist':tab==='requirements'?'checklist':'requirements');$('#'+tab+'-tab').focus();}};
$('#canvas-size').onchange=e=>{size=e.target.value.split(',').map(Number);applySize();};
$('#reposition').onclick=load;$('#parallel').onclick=()=>setFull(false);$('#full').onclick=()=>setFull(true);$('#print').onclick=()=>window.print();
$('#previous').onclick=()=>{if(current>0)select(current-1);};$('#next').onclick=()=>{if(current<stages.length-1)select(current+1);};
$('#follow').onchange=()=>{lastContext='';sync(true);};
frame.onload=()=>{const d=frame.contentDocument,id=pendingFixture;pendingFixture=null;if(id&&d?.querySelector('[data-count]')&&!new URL(d.location.href).searchParams.has('task')){d.querySelector('button[data-state="'+(id==='result'?'success':'generating')+'"]')?.click();}sync(true);};
$('#full-copy').innerHTML=data.full;$('#decisions-copy').innerHTML=data.decisions;
render();load();setInterval(()=>{if(!full&&!document.hidden)sync();},500);
})();
