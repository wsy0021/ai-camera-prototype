/* Interactive prototype only. Input stays in this browser; generation is simulated. */
(()=>{
 const $=s=>document.querySelector(s),query=new URLSearchParams(location.search),R=CameraMoodRules;
 let selected=-1,photo=null,thumbURL='',busy=false,activeId=null,retryId=null,previous=null,pickerKey=null;
 const draft='mood-draft-'+crypto.randomUUID();
 const current=()=>CameraPhotoTasks.read().find(t=>t.id===activeId);
 const message=text=>$('#message').textContent=text;
 function prepare(){
  $('#moods').innerHTML=R.options.map((o,i)=>`<button class="mood" data-mood="${i}" aria-pressed="${i===selected}" ${busy||retryId?'disabled':''}><span aria-hidden="true">${o[0]}</span>${o[1]}</button>`).join('');
  $('#open').disabled=busy||selected<0||!photo;$('#open').textContent=busy?'Checking photo…':retryId?'Try again':'Find my muse';
  $('#photo').disabled=busy;$('#remove-photo').hidden=!photo;$('#remove-photo').disabled=busy;
 }
 function setPhoto(p,blob){photo=p;if(thumbURL)URL.revokeObjectURL(thumbURL);thumbURL=blob?URL.createObjectURL(blob):p.src;$('#thumb').replaceChildren(Object.assign(document.createElement('img'),{src:thumbURL,alt:'Selected photo'}));$('#photo-title').textContent='Your photo is ready';$('#photo-sub').textContent='Tap to change';prepare()}
 $('#moods').onclick=e=>{const b=e.target.closest('[data-mood]');if(!b||busy||retryId)return;selected=Number(b.dataset.mood);message('');prepare()};
 function closePicker(){$('#picker').hidden=true;$('#photo-frame').removeAttribute('src');$('.scroll').inert=false;$('#dock').inert=false;$('#activity').inert=false;$('#photo').focus()}
 $('#photo').onclick=async()=>{
  if(busy)return;pickerKey=draft+'-pick-'+crypto.randomUUID();
  const url=new URL('照片准备页_v0.3.html',location.href);url.searchParams.set('style','golden-hour');url.searchParams.set('entry','create');url.searchParams.set('moodPick',pickerKey);
  $('#photo-frame').src=url.href;$('#picker').hidden=false;$('.scroll').inert=true;$('#dock').inert=true;$('#activity').inert=true;
 };
 window.addEventListener('message',async e=>{
  if(e.origin!==location.origin||e.source!==$('#photo-frame').contentWindow||e.data?.key!==pickerKey)return;
  if(e.data.type==='museme-photo-cancel'){closePicker();return}
  if(e.data.type==='museme-photo-confirm'){
   const saved=await CameraEditorRecovery.load(pickerKey);if(!saved?.photos[0]){closePicker();message('Couldn’t open this photo. Choose another.');return}
   setPhoto(saved.photos[0],e.data.blob);message('');closePicker();
  }
 });
 $('#remove-photo').onclick=()=>{photo=null;if(thumbURL)URL.revokeObjectURL(thumbURL);thumbURL='';$('#thumb').textContent='＋';$('#photo-title').textContent='Add your photo';$('#photo-sub').textContent='One photo. All you.';message('');prepare()};
 function wait(){
  const t=current();if(!t)return;
  if(t.status==='completed'){if(document.visibilityState==='visible')location.replace('生成成功页_v0.1.html?task='+encodeURIComponent(t.id));return}
  if(t.status==='failed'){
   retryId=t.id;activeId=null;busy=false;$('#waiting').hidden=true;$('.scroll').inert=false;$('#dock').inert=false;$('#activity').inert=false;message('Adjust your photo and try again.');prepare();
   const url=new URL(location.href);url.search='?retryTask='+encodeURIComponent(t.id);history.replaceState(null,'',url);return;
  }
  $('#waiting').hidden=false;$('.scroll').inert=true;$('#dock').inert=true;$('#activity').inert=true;$('#wait-title').textContent=t.status==='timeout'?'This is taking a little longer.':'Your muse is taking shape.';$('#background').focus();
 }
 async function submit(){
  if(busy||selected<0||!photo)return;
  busy=true;message('');prepare();
  try{
   const outcome=$('#check-demo').value,prior=CameraPhotoTasks.read().find(t=>t.id===retryId);
   const styleId=outcome==='empty'?null:prior?.styleId||R.pick(R.candidates(selected),previous);
   if(!styleId){message('No looks available for this mood. Try another.');return}
   await new Promise(r=>setTimeout(r,900));
   if(outcome==='check-failed'){message('Adjust your photo and try again.');return}
   // Persist input before creating a task, so a failed local save cannot create a ghost task.
   const inputKey=draft+'-submit';if(!await CameraEditorRecovery.save(inputKey,[photo],0))throw Error();
   const task=CameraPhotoTasks.create(styleId,retryId);
   if(!await CameraEditorRecovery.save(task.id,[photo],0)){CameraPhotoTasks.remove(task.id);throw Error()}
   CameraPhotoTasks.update(task.id,{mood:{index:selected,label:R.options[selected][1]},inputCount:1,backgroundReturn:new URL('1.0.0一级页面框架_v0.4.html?tab=discover',location.href).href,previewFinishAt:Date.now()+12000,previewOutcome:outcome==='failed'?'failed':'completed'});
   activeId=task.id;retryId=null;CameraPhotoTasks.update(task.id,{status:'generating'});
   const url=new URL(location.href);url.search='?task='+encodeURIComponent(task.id);history.replaceState(null,'',url);wait();
  }catch{message('Couldn’t start your creation. Please try again.')}finally{busy=false;prepare()}
 }
 $('#open').onclick=submit;
 $('#background').onclick=()=>{const t=current();if(t)location.href=CameraCreationFlow.browseURL(t,true)};
 window.addEventListener('camera-task-change',()=>{if(activeId)wait()});window.addEventListener('storage',()=>{if(activeId)wait()});document.addEventListener('visibilitychange',()=>{if(activeId&&document.visibilityState==='visible')wait()});
 $('#demo-complete').onclick=()=>{if(activeId)CameraPhotoTasks.update(activeId,{status:'completed',previewFinishAt:null});else message('Start a creation first.')};
 $('#demo-fail').onclick=()=>{if(activeId)CameraPhotoTasks.update(activeId,{status:'failed',previewFinishAt:null});else message('Start a creation first.')};
 function reset(){location.href='情绪盲盒页_v0.1.html'}$('#reset').onclick=reset;$('#activity').onclick=reset;
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#picker').hidden)closePicker()});
 // A normal entry is always fresh. Only explicit task / retry / again links restore input.
 async function init(){
  const id=query.get('again')||query.get('retryTask')||query.get('task');
  if(!id){prepare();return}
  busy=true;prepare();
  const t=CameraPhotoTasks.read().find(t=>t.id===id&&t.mood);
  if(!t){busy=false;message('This task is no longer available. Start a new exploration.');prepare();return}
  selected=t.mood.index;const saved=await CameraEditorRecovery.load(id);if(saved?.photos[0])setPhoto(saved.photos[0]);
  busy=false;
  if(query.has('again')){previous=t.styleId;prepare();if(photo)await submit();else message('Add your photo to explore again.');return}
  if(t.status==='completed'){activeId=t.id;prepare();wait();return}
  if(t.status==='failed'){retryId=t.id;message('Adjust your photo and try again.');prepare();return}
  activeId=t.id;prepare();wait();
 }
 window.addEventListener('pageshow',e=>{if(e.persisted&&!new URLSearchParams(location.search).has('task')&&!new URLSearchParams(location.search).has('retryTask')&&!new URLSearchParams(location.search).has('again'))reset()});
 init();
})();
