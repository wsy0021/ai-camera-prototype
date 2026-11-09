/* Requirements viewer only: observe the same-origin preview without changing product pages. */
(function(global){
 'use strict';
 function resolve(href,doc){
  let url;try{url=new URL(href)}catch{return null}
  const page=decodeURIComponent(url.pathname).split('/').pop(),q=url.searchParams,has=s=>!!doc.querySelector(s);
  let stage=null,state='page',scene=null;
  if(page==='情绪盲盒页_v0.1.html'){stage=8;state=has('#waiting:not([hidden])')?'mood-generating':has('#picker:not([hidden])')?'mood-photo':'mood-preparing'}
  else if(page==='照片准备页_v0.3.html'){
   scene=q.get('style')==='duo-portrait'?'duo':'single';
   if(has('.photo-guide-layer:not([hidden]),.device-flow.system-permission-layer:not([hidden]),#permission-dialog[open]')){stage=2;state='permission-guide'}
   else if(has('.phone.editor-waiting')){stage=5;state='generating'}
   else if(has('.phone.is-submitting')||has('.issue-marker')||/^(Check again|Retry check)$/.test(doc.querySelector('#generate')?.textContent.trim()||'')){stage=4;state='checking'}
   else{stage=3;state=q.has('retryTask')?'retry-editing':'selection-editing'}
  }else if(/^1\.0\.0一级页面框架_v0\.[1-4]\.html$/.test(page)){
   if(has('#intro:not([hidden])')){stage=0;state='onboarding'}
   else if(has('#settings-panel:not([hidden]),#saved-templates:not([hidden])')){stage=7;state='settings-saved'}
   else{
    const tab=doc.querySelector('#nav [aria-current="page"]')?.dataset.tab||q.get('tab')||'discover';
    stage=['me','creations'].includes(tab)?7:['templates','videos'].includes(tab)?1:0;state='tab-'+tab;
   }
  }else if(['应用启动页_v0.1.html','新人介绍页_v0.2.html','新人介绍页_v0.1.html','主题合集页_v0.1.html','模板详情页_v0.2.html','视频模板详情页_v0.1.html'].includes(page))stage=0;
  else if(page==='图片上传示例页_v0.1.html')stage=2;
  else if(page==='生成承接页_v0.1.html')stage=5;
  else if(['生成成功页_v0.1.html','图片任务与结果_v0.1.html','视频任务与结果_v0.1.html'].includes(page))stage=6;
  else if(['反馈页_v0.1.html','隐私与数据页_v0.1.html','权限管理页_v0.1.html','账户登录流程_v0.1.html'].includes(page))stage=7;
  if(stage===null)return null;
  return {stage,scene,state,href:url.href,key:[page,stage,scene,state,url.search].join('|')};
 }
 function connect(frame,onContext){
  let cleanup=()=>{},lastKey=null;
  function attach(){
   cleanup();lastKey=null;
   try{
    const win=frame.contentWindow,doc=frame.contentDocument;
    if(!win||!doc||!doc.body)return;
    // Reading location enforces the browser's origin boundary.
    void win.location.href;
    let disposed=false;
    const check=()=>{if(disposed)return;try{const context=resolve(win.location.href,doc);if(context&&context.key!==lastKey){lastKey=context.key;onContext(context)}}catch{}};
    const observer=new global.MutationObserver(check);
    observer.observe(doc.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','open','aria-current'],characterData:true});
    win.addEventListener('popstate',check);win.addEventListener('hashchange',check);
    cleanup=()=>{disposed=true;observer.disconnect();win.removeEventListener('popstate',check);win.removeEventListener('hashchange',check)};
    check();
   }catch{/* Unknown or external preview: keep the manually selected chapter. */}
  }
  frame.addEventListener('load',attach);attach();
  return ()=>{cleanup();frame.removeEventListener('load',attach)};
 }
 global.CameraRequirementsFollow={resolve,connect};
})(window);
