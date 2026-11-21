/* Local prototype task integration. No AI service or server job is involved. */
window.CameraPhotoCreation=(()=>{
 const page='制作页面_并排配对_v0.1.html';
 function url(task,entry='history'){return page+'?'+new URLSearchParams({flow:'product',style:task.styleId,task:task.id,entry})}
 function context(params){
  let origin=null,collection=null;
  try{collection=JSON.parse(sessionStorage.getItem('camera-collection-origin-'+params.get('collection')));origin=JSON.parse(sessionStorage.getItem('camera-creation-origin'))}catch{}
  if(params.get('collection')&&collection)return collection;
  const tab=['discover','templates','videos','events'].includes(origin?.tab)?origin.tab:'discover';
  const dest=new URL('首页功能探索_v0.1.html',location.href);dest.searchParams.set('tab',tab);dest.searchParams.set('type','photo');
  if(tab==='templates'&&origin?.category)dest.searchParams.set('category',origin.category);
  return {backgroundReturn:dest.href,browseOrigin:origin};
 }
 function detailURL(params,styleId){
  let page='模板详情页_v0.2.html',p=new URLSearchParams({style:styleId});
  if(params.get('avatarEntry')==='1'){page='AI头像工作室_v0.1.html';p.set('detail','1')}
  else if(params.get('hairEntry')==='1'){page='发型详情页_v0.1.html';p.set('filter',params.get('filter')||'bob')}
  else if(params.get('retroEntry')==='1'){page='主题合集页_v0.1.html';p.set('collection','back-to-80s');p.set('filter',params.get('filter')||'film80');p.set('filterCategory',params.get('filterCategory')||'all')}
  else if(params.get('transformEntry')==='1'){page='创作功能预览_v0.1.html';p.set('feature','transform');p.set('look',params.get('look')||'rose')}
  if(['events','discover'].includes(params.get('sourceTab')))p.set('entry',params.get('sourceTab'));
  for(const key of ['collection','group'])if(params.has(key))p.set(key,params.get(key));
  return page+'?'+p;
 }
 function tick(){
  for(const t of CameraPhotoTasks.read())if(t.photoFlow&&t.previewFinishAt&&['queued','generating'].includes(t.status)&&Date.now()>=t.previewFinishAt){
   CameraPhotoTasks.update(t.id,{status:t.previewOutcome==='failed'?'failed':t.previewOutcome==='unknown'?'timeout':'completed',previewFinishAt:null});
  }
 }
 tick();setInterval(tick,400);
 return {url,context,detailURL,tick};
})();
