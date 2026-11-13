/* Internal prototype data only: no photo input, upload, or generation service. */
window.CameraPhotoTasks=(()=>{
 const key='camera-photo-tasks-preview-v1';
 const styles={
 'studio-glow':{name:'Studio Glow',image:'../assets/portraits-v3/avatar-portrait.jpg',mediaType:'video'},
 'city-closeup':{name:'City Close-up',image:'../assets/portraits-v3/city-portrait.jpg',mediaType:'video'},
 'motion-portrait':{name:'Motion Portrait',image:'../assets/motion-portrait-cover-v2.jpg',mediaType:'video'},
 'city-moment':{name:'City Moment',image:'../assets/portraits-v3/city-film-still.jpg',mediaType:'video'},
 'duo-portrait':{name:'Together',image:'../assets/portraits-v3/warm-portrait.jpg'},
 'golden-hour':{name:'Golden Hour',image:'../assets/portraits-v3/warm-portrait.jpg'},
 'dark-studio':{name:'Dark Studio',image:'../assets/portraits-v3/studio-portrait.jpg'},
 'city-film':{name:'City Film',image:'../assets/portraits-v3/city-portrait.jpg'}
 };
 function read(){try{const a=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(a)?a.filter(t=>t&&typeof t.id==='string'&&styles[t.styleId]&&['queued','generating','completed','failed','timeout'].includes(t.status)):[]}catch{return []}}
 function write(a){localStorage.setItem(key,JSON.stringify(a));window.dispatchEvent(new Event('camera-task-change'));return a}
 function visible(){
  const tasks=read(),byId=new Map(tasks.map(t=>[t.id,t])),latest=new Map();
  function root(t){const seen=new Set([t.id]);let node=t;while(node.retryOf&&byId.has(node.retryOf)&&!seen.has(node.retryOf)){seen.add(node.retryOf);node=byId.get(node.retryOf)}return node.creationId||node.id}
  for(const t of tasks){const key=root(t),current=latest.get(key);if(!current||t.createdAt>current.createdAt)latest.set(key,t)}
  return [...latest.values()];
 }
 function create(styleId,retryOf){if(!styles[styleId])throw Error('Unknown template');const previous=read().find(t=>t.id===retryOf&&t.styleId===styleId&&t.status==='failed');const task={id:crypto.randomUUID(),styleId,mediaType:styles[styleId].mediaType||'photo',status:'queued',createdAt:Date.now(),attempts:(previous?.attempts||0)+1};task.creationId=previous?.creationId||previous?.id||task.id;if(previous)task.retryOf=previous.id;write([task,...read()]);return task}
 function update(id,changes){let found;write(read().map(t=>{if(t.id!==id)return t;found={...t,...changes};return found}));return found}
 function remove(id){write(read().filter(t=>t.id!==id))}
 function addPreviewTask(task){if(!styles[task.styleId])throw Error('Unknown template');if(!read().some(t=>t.id===task.id))write([task,...read()]);return task}
 return {read,visible,create,update,remove,styles,addPreviewTask};
})();

/* Foreground completion events only; persisted results alone never trigger a toast. */
window.CameraTaskNotices=(()=>{
 const pendingKey='camera-pending-completions',viewedKey='camera-viewed-results';
 let previous=new Map(CameraPhotoTasks.visible().map(t=>[t.id,t.status])),leaving=false;
 const readList=key=>{try{const a=JSON.parse(sessionStorage.getItem(key)||'[]');return Array.isArray(a)?a:[]}catch{return []}};
 const save=(key,a)=>sessionStorage.setItem(key,JSON.stringify(a));
 function viewed(){return readList(viewedKey)}
 function pending(){const tasks=CameraPhotoTasks.visible();return readList(pendingKey).filter(x=>Date.now()-x.at<120000&&tasks.some(t=>t.id===x.id&&t.status==='completed')&&!viewed().includes(x.id))}
 function consume(ids){save(pendingKey,pending().filter(x=>!ids.includes(x.id)))}
 function markViewed(id){save(viewedKey,[...new Set([...viewed(),id])]);consume([id])}
 function observe(){const tasks=CameraPhotoTasks.visible(),fresh=tasks.filter(t=>t.status==='completed'&&previous.has(t.id)&&previous.get(t.id)!=='completed');previous=new Map(tasks.map(t=>[t.id,t.status]));if(document.visibilityState==='visible'&&fresh.length){const a=pending();for(const t of fresh)if(!a.some(x=>x.id===t.id))a.push({id:t.id,at:Date.now()});save(pendingKey,a)}window.dispatchEvent(new Event('camera-notices-change'))}
 window.addEventListener('camera-task-change',observe);
 window.addEventListener('storage',e=>{if(e.key==='camera-photo-tasks-preview-v1')observe()});
 window.addEventListener('pagehide',()=>{leaving=true});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){setTimeout(()=>{if(!leaving){save(pendingKey,[]);window.dispatchEvent(new Event('camera-notices-change'))}},0)}else{previous=new Map(CameraPhotoTasks.visible().map(t=>[t.id,t.status]));window.dispatchEvent(new Event('camera-notices-change'))}});
 return {viewed,pending,consume,markViewed};
})();

/* One return context per task, independent of later browsing in another template. */
window.CameraCreationFlow=(()=>{
 function browseURL(task,background=false){
  const dest=new URL('首页功能探索_v0.1.html',location.href);
  dest.searchParams.set('tab',task?.mediaType==='video'?'videos':'templates');dest.searchParams.set('type',task?.mediaType==='video'?'video':'photo');
  try{const saved=new URL(task?.backgroundReturn||'',location.href);if(saved.origin===dest.origin&&saved.pathname===dest.pathname&&['discover','templates','videos','featured'].includes(saved.searchParams.get('tab')))dest.search=saved.search}catch{}
  if(dest.searchParams.get('tab')==='templates'&&dest.searchParams.get('type')==='video')dest.searchParams.set('tab','videos');dest.searchParams.delete('newTask');dest.searchParams.set('creationReturn','1');
  if(background&&task?.id)dest.searchParams.set('newTask',task.id);
  const origin=task?.browseOrigin;
  sessionStorage.removeItem('camera-browse-return');
  if(origin?.tab===dest.searchParams.get('tab'))sessionStorage.setItem('camera-browse-return',JSON.stringify({tab:origin.tab,type:dest.searchParams.get('type'),category:dest.searchParams.get('category')||'All',position:origin.position}));
  return dest.href;
 }
 function retryURL(task){return '照片准备页_v0.3.html?style='+encodeURIComponent(task.styleId)+'&entry=create&retryTask='+encodeURIComponent(task.id)}
 function videoSource(task){return task?.styleId==='studio-glow'?'../assets/portraits-v3/studio-demo.mp4':['city-moment','city-closeup'].includes(task?.styleId)?'../assets/portraits-v3/city-demo.mp4':task?.styleId==='motion-portrait'?'../assets/portraits-v3/motion-demo.mp4':'../assets/portraits-v3/avatar-demo.mp4'}
 function taskBackURL(task){
  try{const ctx=JSON.parse(sessionStorage.getItem('camera-task-detail-return'));if(ctx&&task&&ctx.taskId===task.id)return browseURL({...ctx,mediaType:task.mediaType})}catch{}
  const dest=new URL('首页功能探索_v0.1.html',location.href);dest.searchParams.set('tab','me');dest.searchParams.set('returnTask','1');dest.searchParams.set('type',task?.mediaType==='video'?'video':'photo');return dest.href;
 }
 return {browseURL,retryURL,videoSource,taskBackURL};
})();

/* Local mood demo completion by timestamp; no real generation service. */
(()=>{
 function tick(){const now=Date.now();for(const t of CameraPhotoTasks.visible())if(t.mood&&['queued','generating'].includes(t.status)&&t.previewFinishAt&&now>=t.previewFinishAt)CameraPhotoTasks.update(t.id,{status:t.previewOutcome==='failed'?'failed':'completed',previewFinishAt:null});}
 if(typeof setInterval==='function')setInterval(tick,500);if(typeof setTimeout==='function')setTimeout(tick,50);
})();
