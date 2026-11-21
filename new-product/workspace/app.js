(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const requestedDemo=new URLSearchParams(location.search).get('demo');
  const demo=requestedDemo==='idea'?'start':requestedDemo||'start';
  const imageRoot = 'assets/source-portraits/';
  const materials = [
    {name:'Golden Hour', type:'Image', image:imageRoot+'0.jpg', prompt:'Create a natural portrait of the person in the photo in warm golden-hour light, with soft shadows and a subtle film look. Preserve their facial features.'},
    {name:'City Stroll', type:'Image', image:imageRoot+'1.jpg', prompt:'Create a candid city-stroll portrait of the person in the photo, with soft colors and a relaxed feel. Preserve their facial features.'},
    {name:'Soft Light', type:'Image', image:imageRoot+'2.jpg', prompt:'Create a softly lit portrait of the person in the photo, with a simple background, gentle shadows, and a natural expression.'},
    {name:'Everyday Film', type:'Image', image:imageRoot+'3.jpg', prompt:'Create a casual film-style snapshot of the person in the photo, with a natural expression and an everyday setting.'},
    {name:'City Moments', type:'Video', image:'assets/city-film-still.jpg', video:'assets/city-demo.mp4', duration:4, prompt:'Create a short city-inspired video featuring the person in the photo, with a slow camera push-in. Preserve their facial features.'},
    {name:'Moving Portrait', type:'Video', image:'assets/studio-portrait.jpg', video:'assets/motion-demo.mp4', duration:4, prompt:'Create a softly lit video portrait of the person in the photo, with a gentle camera push-in. Preserve their facial features.'},
    {name:'Studio Light', type:'Video', image:'assets/dark-studio-still.jpg', video:'assets/studio-demo.mp4', duration:4, prompt:'Create a short studio video featuring the person in the photo, with soft lighting and slow camera movement.'}
  ];
  // Demonstration configuration, not a real model capability contract.
  const supportedRatios = {Image:['3:4','1:1','4:3','9:16'], Video:['9:16','16:9','1:1']};
  const tasks = [], objectURLs = new Set();
  let materialBrowserState=demo.startsWith('styles-')?demo.slice(7):'ready';
  let nextChatId = 2, nextTaskId = 1, currentChatId = 1, workspace = 'create';
  let historyView = 'Chats', historyFilter = 'All', noticeTask = null, noticeEditTask = null, editor = null, toastTimer;
  function newChat(id) {
    return {id, title:'New chat', descriptions:{free:''}, browseType:'Image', showMaterials:false, templatesOnDemand:true, scrollTop:0, photoRevision:0, idea:null,
      draft:{prompt:'', selected:null, photo:null, mode:'Image', ratio:'3:4', sourceTaskId:null,styleUnavailable:false}};
  }
  const chats = [newChat(1)];
  const chat = () => chats.find(c => c.id === currentChatId);
  const draft = () => chat().draft;
  const key = selected => selected === null ? 'free' : String(selected);
  const activeTask = () => tasks.find(t => ['submitting','processing','unknown'].includes(t.status));
  const pendingTask = () => activeTask() ? {kind:'create',task:activeTask()} : editor?.activeTask() ? {kind:'edit',task:editor.activeTask()} : null;
  const icon = paths => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths+'</svg>';
  const icons = {
    download:'<path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4"/>',
    edit:'<path d="m15 4 5 5M4 20l5-1L20 8a3.5 3.5 0 0 0-5-5L4 14Z"/>',
    retry:'<path d="M20 7v5h-5M20 12a8 8 0 1 0-2 6"/>',
    check:'<path d="M20 7v5h-5M20 12a8 8 0 1 0-2 6"/>',
    reload:'<path d="M20 7v5h-5M20 12a8 8 0 1 0-2 6"/>',
    play:'<path d="m9 6 9 6-9 6Z"/>'
  };
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function button(label, action, className='') {
    const b = element('button', className, label);
    b.type = 'button'; b.onclick = action; return b;
  }
  function error(text, task=null) {
    $('error').textContent = text; $('error').style.display = text ? 'block' : 'none';
    $('activeTaskLink').hidden = !task;
    $('activeTaskLink').dataset.taskId = task ? String(task.id) : '';
    $('activeTaskLink').onclick = task ? () => locateTask(task) : null;
  }
  function toast(text) {
    clearTimeout(toastTimer); $('toast').textContent = text; $('toast').hidden = false;
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4500);
  }
  function saveDescription(c=chat()) { c.descriptions[key(c.draft.selected)] = c.draft.prompt; }
  let storageLoading=false, storageEnabled=false, saveTimer, saveChain=Promise.resolve();
  const isolatedDemo=demo!=='start';
  function savedPhoto(p) {
    if(!p)return null;
    const value={...p};
    if(value.file)value.url=null;
    else if(value.url?.startsWith('blob:')){value.url=null;value.unavailable=true;}
    return value;
  }
  function snapshotWorkspace() {
    remember();
    return {version:1,savedAt:Date.now(),currentChatId,nextChatId,nextTaskId,workspace,edit:editor?.snapshot(savedPhoto),
      chats:chats.map(c=>({...c,draft:{...c.draft,photo:savedPhoto(c.draft.photo)}})),
      tasks:tasks.map(({element:node,checking,...t})=>({...t,photo:savedPhoto(t.photo)}))};
  }
  function validWorkspace(value) {
    const draftValid=d=>d&&typeof d.prompt==='string'&&['Image','Video'].includes(d.mode)&&typeof d.ratio==='string'&&(d.selected===null||Number.isInteger(d.selected)&&Boolean(materials[d.selected]));
    if(!value||value.version!==1||!Array.isArray(value.chats)||!value.chats.length||!Array.isArray(value.tasks)||(value.edit&&!editor.valid(value.edit)))return false;
    const ids=value.chats.map(c=>c.id);
    return new Set(ids).size===ids.length&&ids.includes(value.currentChatId)&&value.chats.every(c=>Number.isInteger(c.id)&&typeof c.title==='string'&&c.descriptions&&draftValid(c.draft))&&
      value.tasks.every(t=>Number.isInteger(t.id)&&ids.includes(t.chatId)&&draftValid(t)&&['submitting','processing','unknown','success','failed'].includes(t.status)&&(t.status!=='success'||t.result&&typeof t.result.url==='string'&&typeof t.result.poster==='string'&&['Image','Video'].includes(t.result.kind)));
  }
  function applyWorkspace(value) {
    const photoURLs=new WeakMap();
    function revivePhoto(p) {
      if(!p)return null;
      const next={...p};
      if(p.file instanceof Blob){
        if(!photoURLs.has(p.file)){const url=URL.createObjectURL(p.file);photoURLs.set(p.file,url);objectURLs.add(url);}
        next.url=photoURLs.get(p.file);next.unavailable=false;
      }else if(!p.url||p.url.startsWith('blob:')){next.url=null;next.unavailable=true;}
      return next;
    }
    chats.splice(0,chats.length,...value.chats.map(c=>({...c,photoRevision:0,scrollTop:c.scrollTop||0,idea:c.idea||null,draft:{...c.draft,photo:revivePhoto(c.draft.photo)}})));
    tasks.splice(0,tasks.length,...value.tasks.map(raw=>{
      const t={...raw,photo:revivePhoto(raw.photo),checking:false,element:element('article','task')};
      if(['submitting','processing'].includes(t.status)){t.status='unknown';t.checkError='Check this creation to pick up where you left off.';}
      t.element.dataset.taskId=String(t.id);renderTask(t);return t;
    }));
    editor.restore(value.edit,revivePhoto);
    currentChatId=value.currentChatId;nextChatId=Math.max(...chats.map(c=>c.id))+1;nextTaskId=Math.max(0,...tasks.map(t=>t.id))+1;
    $('tasks').replaceChildren(...tasks.filter(t=>t.chatId===currentChatId).map(t=>t.element));
    renderDraft();invalidateIdea();switchWorkspace(value.workspace==='edit'?'edit':'create');updateRunControl();
    document.querySelector('.scroll').scrollTop=chat().scrollTop;
    const editPending=editor.activeTask();if(editPending){noticeEditTask=editPending;noticeTask=null;$('noticeText').textContent='Check your previous edit.';$('completionNotice').hidden=false;}
    const pending=activeTask();if(pending&&(pending.chatId!==currentChatId||workspace!=='create')){noticeTask=pending;$('noticeText').textContent='Check your previous creation.';$('completionNotice').hidden=false;}
  }
  function persistWorkspace() {
    if(!storageEnabled||storageLoading||isolatedDemo)return Promise.resolve();
    clearTimeout(saveTimer);const value=snapshotWorkspace();$('storageStatus').textContent='正在保存到当前浏览器…';
    saveChain=saveChain.then(()=>window.AgentDraftStore.write(value)).then(()=>{
      $('storageStatus').textContent='已保存到当前浏览器，不支持跨设备同步。';
      document.dispatchEvent(new CustomEvent('agent:stored'));
    }).catch(()=>{
      storageEnabled=false;$('storageStatus').textContent='无法保存当前修改，请保持页面打开以继续操作。';
      toast('Your changes couldn’t be saved on this device. Keep this page open.');
      document.dispatchEvent(new CustomEvent('agent:storage-error'));
    });
    return saveChain;
  }
  function scheduleSave() {
    if(!storageEnabled||storageLoading||isolatedDemo)return;
    clearTimeout(saveTimer);saveTimer=setTimeout(persistWorkspace,200);
  }
  async function initializeStorage() {
    const ready=()=>{document.documentElement.dataset.ready='true';document.querySelector('.phone').inert=false;$('demoPhoto').disabled=false;$('resetPreview').disabled=false;document.querySelector('.phone').removeAttribute('aria-busy');};
    if(isolatedDemo){$('storageStatus').textContent='当前为独立演示状态，操作不会覆盖正常工作区的记录。';ready();return;}
    if(!window.AgentDraftStore?.available){$('storageStatus').textContent='当前浏览器无法保存原型，修改仅在本次页面内保留。';ready();return;}
    storageLoading=true;document.querySelector('.phone').inert=true;document.querySelector('.phone').setAttribute('aria-busy','true');$('demoPhoto').disabled=true;$('resetPreview').disabled=true;
    try{
      const saved=await window.AgentDraftStore.read();
      if(saved&&!validWorkspace(saved))throw new Error('Saved preview is incompatible');
      if(saved)applyWorkspace(saved);
      storageEnabled=true;$('storageStatus').textContent=saved?'已恢复当前浏览器的记录，不支持跨设备同步。':'本地原型，记录仅保存在当前浏览器。';
    }catch{$('storageStatus').textContent='无法打开已保存的原型记录，原记录未被覆盖。可重置演示后重新开始。';}
    finally{storageLoading=false;ready();if(storageEnabled)scheduleSave();}
  }
  function remember() {
    draft().prompt = $('prompt').value; saveDescription();
    chat().scrollTop = document.querySelector('.scroll').scrollTop;
    if (!tasks.some(t => t.chatId === currentChatId)) {
      chat().title = chatTitle(draft().prompt) || (draft().photo ? 'Photo idea' : 'New chat');
    }
  }
  function chatTitle(text) {
    const title = text.trim().replace(/\s+/g, ' ');
    return title.length > 48 ? title.slice(0,48).replace(/\s+\S*$/, '')+'…' : title;
  }
  function invalidateIdea() { chat().idea = null; }
  function resizePrompt() {
    $('prompt').style.height = '44px';
    $('prompt').style.height = Math.min(132, Math.max(44, $('prompt').scrollHeight))+'px';
    $('prompt').style.overflowY = $('prompt').scrollHeight > 132 ? 'auto' : 'hidden';
  }
  function showMaterials(show) {
    chat().showMaterials = show;
    document.querySelector('.phone').classList.toggle('showmaterials', show);
    $('showMaterials').setAttribute('aria-expanded', String(show));$('materialPanel').hidden=!show;$('toggleStylePanel').setAttribute('aria-expanded',String(show));$('toggleStylePanel').setAttribute('aria-label',show?'Hide styles':'Show styles');$('toggleStylePanel').innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="'+(show?'m6 15 6-6 6 6':'m6 9 6 6 6-6')+'"/></svg>';
  }
  function showReference() {
    const d = draft(), c = $('context'); c.replaceChildren();
    c.hidden = d.selected === null;
    if (d.selected !== null) {
      const m = materials[d.selected];
      c.append(element('span', 'source-name', m.name));
      const clear=button('',clearTemplate,'source-remove');clear.id='clearTemplate';clear.setAttribute('aria-label','Clear template');clear.title='Clear template';clear.innerHTML=icon('<path d="m7 7 10 10M17 7 7 17"/>');c.append(clear);

    }
    document.querySelectorAll('.tile').forEach(tile => {
      const selected = tile.dataset.index === (d.selected === null ? 'free' : String(d.selected));
      tile.classList.toggle('active',selected);
      const control = tile.querySelector('.styleselect');
      if (control) control.setAttribute('aria-pressed',String(selected));
    });
  }
  function compatibility() {
    const d = draft();
    if(d.styleUnavailable)return {message:'This saved style isn’t available. Choose a style again to continue.',action:'Browse styles',fix:()=>showMaterials(true)};
    if (d.selected !== null && materials[d.selected].type !== d.mode) {
      return {message:'This style creates '+materials[d.selected].type.toLowerCase()+'s. Choose a matching output or another style.', action:'Use '+materials[d.selected].type.toLowerCase(), fix:() => {draft().mode=materials[draft().selected].type;syncSpec();}};
    }
    if (!supportedRatios[d.mode].includes(d.ratio)) {
      return {message:d.ratio+' isn’t available for this '+d.mode.toLowerCase()+'.', action:'Change size', fix:settingsPanel};
    }
    return null;
  }
  function syncSpec() {
    $('specSummary').replaceChildren();const type=element('span',draft().selected===null?'':'sr-only',draft().mode+' · ');$('specSummary').append(type,document.createTextNode(draft().ratio));
    $('settings').hidden=false;
    $('settings').setAttribute('aria-label','Aspect ratio: '+draft().ratio);
    const issue=draft().selected===null?null:compatibility(); $('compatibility').replaceChildren(); $('compatibility').hidden=!issue;
    if (issue) $('compatibility').append(element('span','',issue.message),button(issue.action,issue.fix,'inlineaction'));
  }
  function renderAttachment() {
    const p = draft().photo;
    $('attachment').hidden=!p;$('attachment').style.display = p ? 'flex' : 'none';
    if(p){const image=$('attachment').querySelector('img');image.hidden=Boolean(p.unavailable);if(p.url)image.src=p.url;else image.removeAttribute('src');$('attachment').querySelector('span').textContent=p.unavailable?'Original photo unavailable':p.name;}
    else {$('attachment').querySelector('img').removeAttribute('src');$('file').value='';}
    $('photo').setAttribute('aria-label',p?'Replace photo':'Add photo');$('photo').title=p?'Replace photo':'Add photo';
  }
  function renderDraft() {
    closeSettings();
    if(!chat().templatesOnDemand){chat().showMaterials=false;chat().templatesOnDemand=true;}
    // Template type is fixed, including drafts restored from older prototype sessions.
    if(draft().selected!==null)draft().mode=materials[draft().selected].type;
    $('prompt').value = draft().prompt;
    $('prompt').placeholder = tasks.some(t=>t.chatId===currentChatId) ? 'What would you like to create next?' : 'Describe your idea…';
    $('materialType').value = chat().browseType;
    renderMaterials(); renderAttachment(); syncSpec(); showMaterials(chat().showMaterials); resizePrompt();
  }
  function choose(index) {
    if(!Number.isInteger(index)||!materials[index])return;
    remember(); saveDescription();
    const d=draft();d.selected=index;d.sourceTaskId=null;d.styleUnavailable=false;
    d.prompt=chat().descriptions[key(index)] ?? (index===null ? '' : materials[index].prompt);
    if(index!==null)d.mode=materials[index].type;
    // Photos and ratio belong to the current draft, not to a template description.
    saveDescription(); invalidateIdea(); error('');showMaterials(true);renderDraft();
  }
  function clearTemplate() {
    remember();const d=draft();if(d.selected===null)return;
    const unchanged=d.prompt.trim()===materials[d.selected].prompt.trim();
    d.selected=null;d.sourceTaskId=null;d.styleUnavailable=false;
    if(unchanged)d.prompt='';
    saveDescription();invalidateIdea();error('');renderDraft();scheduleSave();$('prompt').focus();
  }
  function renderMaterials() {
    [['templatePhotos','Image'],['templateVideos','Video']].forEach(([id,media])=>{const active=chat().browseType===media;$(id).setAttribute('aria-selected',String(active));$(id).tabIndex=active?0:-1;});
    $('strip').replaceChildren();
    if(materialBrowserState!=='ready'){
      const state=element('div','stylefeedback');state.setAttribute('role','status');
      state.append(element('p','',materialBrowserState==='loading'?'Loading styles…':materialBrowserState==='empty'?'No styles here yet.':'Styles couldn’t load.'));
      if(materialBrowserState==='error')state.append(button('Try again',()=>{materialBrowserState='ready';renderMaterials();},'inlineaction'));

      $('strip').append(state);showReference();return;
    }
    materials.forEach((m,i)=>{
      if(m.type!==chat().browseType)return;
      const tile=element('div','tile');tile.dataset.index=String(i);
      const select=button('',()=>choose(i),'styleselect'); select.setAttribute('aria-label','Use '+m.name);
      const image=element('img');image.src=m.image;image.alt='';select.append(image,element('span','tilename',m.name));
      if(m.video){select.append(element('span','videotime','▷ '+m.duration+'s'));}
      tile.append(select);
      if(m.video){const preview=button('▷',()=>previewMaterial(i),'tilepreview');preview.setAttribute('aria-label','Preview '+m.name);tile.append(preview);}
      $('strip').append(tile);
    });
    $('materialPanel').setAttribute('aria-label',chat().browseType+' styles');showReference();
  }
  function closeSettings() {
    $('createSettings').hidden=true;
    $('settings').setAttribute('aria-expanded','false');
  }
  function settingsPanel() {
    const body=$('createSettings');
    if(!body.hidden){closeSettings();return;}
    body.replaceChildren();
    function group(title,values,current,apply){
      const section=element('section','settinggroup');section.append(element('h4','',title));
      const row=element('div','settingchoices');
      values.forEach(value=>{
        const b=button(value,()=>{apply(value);invalidateIdea();syncSpec();closeSettings();$('settings').focus();},'settingchoice');
        b.setAttribute('aria-pressed',String(value===current));row.append(b);
      });
      section.append(row);body.append(section);
    }

    if(draft().selected===null)group('Output',['Image','Video'],draft().mode,value=>{draft().mode=value;});
    group('Aspect ratio',supportedRatios[draft().mode],draft().ratio,value=>{draft().ratio=value;});
    body.hidden=false;$('settings').setAttribute('aria-expanded','true');
  }
  document.addEventListener('click',event=>{
    if(!event.target.closest('#createSettings')&&!event.target.closest('#settings'))closeSettings();
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!$('createSettings').hidden){closeSettings();$('settings').focus();}
  });
  function stopPreview() {
    $('dialogbody').querySelectorAll('video').forEach(video=>{video.pause();video.removeAttribute('src');video.load();});
  }
  function openDialog(title) {
    stopPreview();$('dialogbody').replaceChildren(element('h3','',title));
    if(!$('dialog').open)$('dialog').showModal();
    return $('dialogbody');
  }
  function samplePlayer(body,src,poster) {
    const video=element('video','materialpreview');video.src=src;video.poster=poster;
    video.controls=true;video.muted=true;video.playsInline=true;video.preload='metadata';
    const problem=element('p','sheetnote');problem.hidden=true;
    const play=()=>{problem.hidden=true;video.play().catch(()=>{problem.textContent='Press play to watch the sample.';problem.hidden=false;});};
    video.onerror=()=>{problem.replaceChildren(element('span','','This video couldn’t load. '),button('Try again',()=>{video.load();play();},'inlineaction'));problem.hidden=false;};
    body.append(video,problem);play();return video;
  }
  function previewMaterial(i) {
    const m=materials[i],body=openDialog(m.name);samplePlayer(body,m.video,m.image);
    body.append(element('p','sheetnote','Sample clip · not an AI-generated result.'));
    body.append(button('Use this style',()=>{choose(i);$('dialog').close();},'usevideo'));
  }
  function scrollToTask(task) {
    if(task.element.isConnected)task.element.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
  }
  function taskAction(container,label,action,handler) {
    const b=button('',()=>handler(b),'resultaction'); b.dataset.action=action;
    b.setAttribute('aria-label',label);b.title=label;
    b.innerHTML=icon(icons[action]);b.append(element('span','',label));container.append(b);return b;
  }
  function sampleResult(t) {
    const material=materials[t.selected] || materials[t.mode==='Video'?4:2];
    const videoMaterial=material.type==='Video'?material:materials[4];
    const m=t.mode==='Video'?videoMaterial:material;
    return {kind:t.mode,url:t.mode==='Video'?m.video:m.image,poster:m.image,
      name:'sample-not-ai-output-'+m.name.toLowerCase().replace(/\s+/g,'-')+(t.mode==='Video'?'.mp4':'.jpg'),mime:t.mode==='Video'?'video/mp4':'image/jpeg'};
  }
  async function exportFile(t) {
    const response=await fetch(t.result.url);if(!response.ok)throw new Error('Media unavailable');
    const blob=await response.blob();return new File([blob],t.result.name,{type:t.result.mime});
  }
  async function download(t,b) {
    b.disabled=true;
    try {
      const file=await exportFile(t),url=URL.createObjectURL(file);objectURLs.add(url);
      const a=document.createElement('a');a.href=url;a.download=t.result.name;a.click();
      toast('Sample download started.');
      setTimeout(()=>{URL.revokeObjectURL(url);objectURLs.delete(url);},30000);
    } catch {toast('This download couldn’t start. Please try again.');}
    finally {b.disabled=false;}
  }
  async function reloadResult(t,b) {
    b.disabled=true;
    try {await exportFile(t);t.result.unavailable=false;renderTask(t);if($('dialog').open)viewResult(t);scheduleSave();}
    catch {toast('This preview couldn’t load. Please try again.');b.disabled=false;}
  }
  function deliveryActions(container,t) {
    taskAction(container,'Download','download',b=>download(t,b));
  }
  function viewResult(t) {
    const body=openDialog('Preview');
    if(t.result.unavailable){body.append(element('p','sheetnote','This preview is unavailable. Your creation is still here.'));const row=element('div','resultactions');taskAction(row,'Reload preview','reload',b=>reloadResult(t,b));body.append(row);return;}
    if(t.result.kind==='Video')samplePlayer(body,t.result.url,t.result.poster);
    else {const img=element('img','resultlarge');img.src=t.result.url;img.alt='Sample image, not an AI-generated result';img.onerror=()=>toast('This preview couldn’t load. Close and try again.');body.append(img);}
    body.append(element('p','sheetnote',t.result.kind==='Video'?'Sample video · not an AI-generated result.':'Sample image · not an AI-generated result.'));
    const actions=element('div','resultactions');deliveryActions(actions,t);body.append(actions);
  }
  function restoreTask(t) {
    // S05: recommended four-A workflow is authorized for this review, pending final decisions.
    if(t.chatId!==currentChatId)switchChat(t.chatId);
    const d=draft(),different=d.prompt!==t.prompt||d.photo?.url!==t.photo?.url||d.selected!==t.selected||d.mode!==t.mode||d.ratio!==t.ratio;
    if(different&&(d.prompt||d.photo)&&!confirm('Replace your current draft with the inputs from this creation?'))return;
    remember();saveDescription();chat().photoRevision++;
    chat().draft={prompt:t.prompt,photo:t.photo?{...t.photo}:null,selected:t.selected,mode:t.mode,ratio:t.ratio,sourceTaskId:t.id,styleUnavailable:Boolean(t.styleUnavailable)};
    saveDescription();invalidateIdea();switchWorkspace('create');renderDraft();error(draft().photo?.unavailable?'The original photo is unavailable. Add another photo to continue.':'');$('prompt').focus();
  }
  function renderTask(t) {
    const wrapper=t.element;wrapper.replaceChildren();wrapper.dataset.status=t.status;
    const request=element('div','requestbubble');if(!t.photo)request.classList.add('withoutphoto');
    if(t.photo&&!t.photo.unavailable){const image=element('img','requestphoto');image.src=t.photo.url;image.alt='Photo used for this creation';request.append(image);}
    else if(t.photo){const missing=element('span','missingphoto','◇');missing.setAttribute('aria-label','Original photo unavailable');request.append(missing);}
    const description=element('p','',t.prompt);description.title=t.prompt;
    request.append(description,element('small','',t.mode+' · '+t.ratio+(t.selected===null?'':' · '+materials[t.selected].name)));
    const response=element('div','responsebubble is-'+t.status);wrapper.append(request,response);
    if(['submitting','processing'].includes(t.status)){
      const status=element('p','taskstatus',t.status==='submitting'?'Starting your creation…':'Creating your '+t.mode.toLowerCase()+'…');
      const indicator=element('span','statusindicator');indicator.setAttribute('aria-hidden','true');status.prepend(indicator);response.append(status);return;
    }
    const actions=element('div','resultactions');
    if(t.status==='unknown'){
      response.append(element('p','taskstatus',t.checking?'Checking your creation…':'We couldn’t confirm the status.'),element('small','',t.checkError||'Check before starting another creation.'));
      const check=taskAction(actions,'Check status','check',()=>checkStatus(t));check.disabled=Boolean(t.checking);
    }else if(t.status==='failed'){
      response.append(element('p','taskstatus',t.failureKind==='input'?'This needs a quick change':'Couldn’t create this'),element('small','',t.failureKind==='input'?(t.failureMessage||'Try a clear photo with one person. Your idea is still here.'):'Your inputs are still here. You can try again.'));
      if(t.failureKind!=='input')taskAction(actions,'Try again','retry',()=>retryTask(t));
    }else if(t.result.unavailable){
      response.append(element('p','taskstatus','Preview unavailable'));taskAction(actions,'Reload preview','reload',b=>reloadResult(t,b));
    }else{
      const preview=button('',()=>viewResult(t),'resultpreview');preview.setAttribute('aria-label',t.mode==='Video'?'Play sample video':'View sample image');
      const image=element('img','taskimage');image.src=t.result.poster;image.alt=t.mode==='Video'?'Sample video cover':'Sample result layout';preview.append(image);
      if(t.mode==='Video'){preview.classList.add('videoresult');const play=element('span','resultplay');play.innerHTML=icon(icons.play);preview.append(play);}
      response.append(preview);deliveryActions(actions,t);
    }
    const edit=taskAction(actions,'Edit idea','edit',()=>restoreTask(t));
    if(t.status==='success'&&!t.result.unavailable){
      actions.classList.add('compactresultactions');
      actions.prepend(edit);
      for(const action of ['download'])actions.querySelector('[data-action="'+action+'"]').querySelector('span').classList.add('sr-only');
    }
    response.append(actions);
  }
  function updateRunControl() {
    const active=pendingTask();if(!active&&!$('activeTaskLink').hidden)error('');editor?.syncPending();$('submit').setAttribute('aria-label',active?'Generate — another creation is in progress':'Generate');
    $('submit').title=active?'A creation is in progress':'Generate';$('submit').classList.toggle('has-active-task',Boolean(active));
  }
  function retryTask(t) {
    if(t.photo?.unavailable||t.styleUnavailable){t.failureKind='input';t.failureMessage=t.photo?.unavailable?'The original photo is unavailable. Add another photo to continue.':'Choose an available style to continue.';renderTask(t);scheduleSave();return;}
    run({...t,sourceTaskId:t.id},t.chatId);
  }
  function blockedByPending() {
    const pending=pendingTask();if(!pending)return false;
    if(pending.kind==='create')blockedByTask(pending.task);
    else{error(pending.task.status==='unknown'?'Check the status of your current edit before starting another.':'Please wait for your current edit to finish. You can keep editing.');$('activeTaskLink').hidden=false;$('activeTaskLink').onclick=()=>editor.locate(pending.task);}
    return true;
  }
  function blockedByTask(t) {
    error(t.status==='unknown'?'Check the status of your current creation before starting another.':'Please wait for your current creation to finish. You can keep editing.',t);
  }
  function checkStatus(t) {
    if(t.status!=='unknown'||t.checking)return;
    t.checking=true;t.checkError='';renderTask(t);
    setTimeout(()=>{
      t.checking=false;
      if($('queryFailure').checked){t.checkError='We couldn’t check right now. Try again.';renderTask(t);scheduleSave();}
      else finishTask(t,'success');
    },900);
  }
  function finishTask(t,outcome=t.outcome||(t.fail?'failed':'success')) {
    const scroll=document.querySelector('.scroll'),nearBottom=scroll.scrollHeight-scroll.scrollTop-scroll.clientHeight<96;
    t.status=outcome==='unknown'?'unknown':['failed','needs-changes'].includes(outcome)?'failed':'success';
    t.failureKind=outcome==='needs-changes'?'input':'temporary';t.checking=false;
    if(t.status==='success')t.result=sampleResult(t);renderTask(t);updateRunControl();
    if($('activeTaskLink').dataset.taskId===String(t.id))error('');
    if(t.chatId!==currentChatId||workspace!=='create'||$('historyDrawer').open||$('dialog').open){
      noticeTask=t;noticeEditTask=null;$('noticeText').textContent=t.status==='success'?'Your '+t.mode.toLowerCase()+' is ready.':'Your creation needs attention.';$('completionNotice').hidden=false;
    }else if(nearBottom){scrollToTask(t);}
    if($('historyDrawer').open)renderHistory();scheduleSave();
  }
  function run(snapshot,chatId=currentChatId,delay=4500) {
    if(blockedByPending())return null;
    const owner=chats.find(c=>c.id===chatId);if(!owner)return null;
    const t={id:nextTaskId++,chatId,parentId:snapshot.sourceTaskId??null,prompt:snapshot.prompt,photo:snapshot.photo?{...snapshot.photo}:null,
      selected:snapshot.selected,mode:snapshot.mode,ratio:snapshot.ratio,status:'submitting',element:element('article','task'),fail:$('fail').checked,outcome:$('fail').checked?'failed':$('nextOutcome').value,styleUnavailable:Boolean(snapshot.styleUnavailable)};
    t.element.dataset.taskId=String(t.id);tasks.push(t);owner.title=chatTitle(tasks.find(item=>item.chatId===chatId).prompt);
    renderTask(t);if(chatId===currentChatId){$('tasks').append(t.element);showMaterials(false);error('');scrollToTask(t);}
    updateRunControl();setTimeout(()=>{if(t.status==='submitting'){t.status='processing';renderTask(t);scheduleSave();}},600);setTimeout(()=>{if(['submitting','processing'].includes(t.status))finishTask(t);},delay);scheduleSave();return t;
  }
  function submit(event) {
    event.preventDefault();remember();error('');
    if(blockedByPending())return;
    const d=draft();d.prompt=d.prompt.trim();saveDescription();
    if(!d.prompt){error('Describe what you’d like to create.');$('prompt').focus();return;}
    const issue=compatibility();if(issue){error(issue.message);$('settings').focus();return;}
    // Each template requires a reference photo in this prototype.
    if((d.selected!==null&&!d.photo)||d.photo?.unavailable){error('Add a photo to create this look.');$('photo').focus();return;}
    invalidateIdea();run({...d});
  }
  function switchWorkspace(view) {
    if(workspace==='edit'&&view!=='edit')editor?.remember();workspace=view;const edit=view==='edit';$('creationPanel').hidden=edit;$('editingPanel').hidden=!edit;$('new').hidden=edit&&!editor?.hasScene();$('new').setAttribute('aria-label',edit?'Choose editing tool':'New chat');$('new').title=edit?'Choose editing tool':'New chat';
    if(edit)editor?.show();
    [['tabCreate',!edit],['tabEdit',edit]].forEach(([id,active])=>{$(id).setAttribute('aria-selected',String(active));$(id).tabIndex=active?0:-1;});
  }
  function switchChat(id) {
    if(!chats.some(c=>c.id===id))return;
    remember();currentChatId=id;switchWorkspace('create');
    $('tasks').replaceChildren(...tasks.filter(t=>t.chatId===id).map(t=>t.element));
    renderDraft();invalidateIdea();error('');document.querySelector('.scroll').scrollTop=chat().scrollTop;
  }
  function locateTask(t) {
    if($('dialog').open)$('dialog').close();if($('historyDrawer').open)closeHistory();
    switchChat(t.chatId);scrollToTask(t);
    if(noticeTask?.id===t.id){$('completionNotice').hidden=true;noticeTask=null;}
  }
  function startNewChat() {
    remember();
    if(!tasks.some(t=>t.chatId===currentChatId)&&!draft().prompt&&!draft().photo&&draft().selected===null&&!Object.values(chat().descriptions).some(text=>text.trim())){$('prompt').focus();return;}
    const next=newChat(nextChatId++);chats.push(next);switchChat(next.id);$('prompt').focus();
  }
  function positionHistory() {
    const bounds=document.querySelector('.phone').getBoundingClientRect(),drawer=$('historyDrawer');
    Object.assign(drawer.style,{left:bounds.left+'px',top:bounds.top+'px',width:bounds.width+'px',height:bounds.height+'px'});
  }
  function closeHistory() {$('historyDrawer').close();$('history').setAttribute('aria-expanded','false');}
  function renderHistory() {
    const body=$('historyBody');if(workspace==='edit'){editor.history(body);return;}body.replaceChildren();const tabs=element('div','historytabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','History views');
    const panel=element('div');panel.id='historyPanel';panel.setAttribute('role','tabpanel');
    ['Chats','Creations'].forEach((name,i)=>{
      const b=button(name,()=>{historyView=name;renderHistory();$('historyTab'+i).focus();},'historytab');b.id='historyTab'+i;b.setAttribute('role','tab');b.setAttribute('aria-selected',String(name===historyView));b.setAttribute('aria-controls','historyPanel');b.tabIndex=name===historyView?0:-1;
      b.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();historyView=(e.key==='Home'?0:e.key==='End'?1:1-i)?'Creations':'Chats';renderHistory();$('historyTab'+(historyView==='Chats'?0:1)).focus();}};
      tabs.append(b);if(name===historyView)panel.setAttribute('aria-labelledby',b.id);
    });
    if(historyView==='Chats'){
      chats.slice().reverse().forEach(c=>{
        const ownTasks=tasks.filter(t=>t.chatId===c.id),pending=ownTasks.find(t=>['submitting','processing','unknown'].includes(t.status));
        const row=button('',()=>{switchChat(c.id);closeHistory();},'chatrow');row.dataset.chatId=String(c.id);row.setAttribute('aria-current',String(c.id===currentChatId));
        row.append(element('strong','',c.title),element('span','',pending?(pending.status==='unknown'?'Check status':'Creating…'):ownTasks.length?ownTasks.length+(ownTasks.length===1?' creation':' creations'):c.draft.prompt||c.draft.photo?'Draft':'New chat'));panel.append(row);
      });
    }else{
      const filters=element('div','filters');
      ['All','Images','Videos','Failed'].forEach(name=>{const b=button(name,()=>{historyFilter=name;renderHistory();});b.classList.toggle('chosen',name===historyFilter);b.setAttribute('aria-pressed',String(name===historyFilter));filters.append(b);});
      panel.append(filters);
      const rows=tasks.filter(t=>historyFilter==='All'||historyFilter==='Images'&&t.mode==='Image'||historyFilter==='Videos'&&t.mode==='Video'||historyFilter==='Failed'&&t.status==='failed');
      if(!rows.length)panel.append(element('p','sheetnote','No creations here yet.'));
      rows.slice().reverse().forEach(t=>{
        const row=button('',()=>locateTask(t),'workrow');
        row.append(element('strong','',t.selected===null?'Your idea':materials[t.selected].name),element('span','',t.mode+' · '+t.ratio+' · '+({submitting:'Starting…',processing:'Creating…',unknown:'Check status',failed:'Failed',success:'Ready'}[t.status])),element('small','',t.prompt));panel.append(row);
      });
    }
    body.append(tabs,panel);
  }
  editor=window.AgentEdit.create({element,button,icon,toast,openDialog,closeHistory,
    save:scheduleSave,updateRunControl,pending:pendingTask,locateCreate:locateTask,
    showEdit:()=>switchWorkspace('edit'),visible:()=>workspace==='edit',
    trackURL:url=>objectURLs.add(url),
    editHeader:inScene=>{if(workspace==='edit')$('new').hidden=!inScene;},
    clearNotice:task=>{if(noticeEditTask?.id===task.id){noticeEditTask=null;$('completionNotice').hidden=true;}},
    notify:(task,message)=>{noticeEditTask=task;noticeTask=null;$('noticeText').textContent=message;$('completionNotice').hidden=false;}
  });
  $('prompt').oninput=()=>{draft().prompt=$('prompt').value;saveDescription();invalidateIdea();error('');resizePrompt();};
  $('photo').onclick=()=>$('file').click();
  $('replaceAttachment').onclick=()=>$('file').click();
  $('previewAttachment').onclick=()=>{const p=draft().photo;if(!p||p.unavailable){error('Replace the unavailable photo.');return;}const body=openDialog('Current photo'),img=element('img','resultlarge');img.src=p.url;img.alt='Attached photo';body.append(img);};
  $('file').onchange=async event=>{
    const file=event.target.files[0];if(!file)return;const owner=chat(),revision=++owner.photoRevision;
    if(!file.type.startsWith('image/')){error('Choose an image file.');return;}
    const url=URL.createObjectURL(file),image=new Image();image.src=url;
    try{
      await image.decode();
      if(owner.photoRevision!==revision){URL.revokeObjectURL(url);return;}
      window.ProductPhotos?.add(file,file.name).catch(()=>{});objectURLs.add(url);owner.draft.photo={name:file.name,url,file};scheduleSave();
      if(owner.id===currentChatId){renderAttachment();error('');}
    }catch{URL.revokeObjectURL(url);if(owner.id===currentChatId)error('This photo couldn’t be opened. Try another one.');}
  };
  $('remove').onclick=()=>{chat().photoRevision++;draft().photo=null;renderAttachment();error('');};
  $('form').onsubmit=submit;$('settings').onclick=settingsPanel;
  $('showMaterials').onclick=()=>showMaterials(!chat().showMaterials);$('toggleStylePanel').onclick=()=>showMaterials(!chat().showMaterials);
  $('materialType').onchange=event=>{chat().browseType=event.target.value;renderMaterials();showMaterials(true);};
  ['templatePhotos','templateVideos'].forEach((id,i)=>{
    $(id).onclick=()=>{closeSettings();$('materialType').value=i?'Video':'Image';$('materialType').dispatchEvent(new Event('change'));};
    $(id).onkeydown=event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?1:1-i;$(next?'templateVideos':'templatePhotos').click();$(next?'templateVideos':'templatePhotos').focus();}};
  });
  $('new').onclick=()=>workspace==='edit'?editor.home():startNewChat();
  ['tabCreate','tabEdit'].forEach((id,i)=>{
    $(id).onclick=()=>switchWorkspace(i?'edit':'create');
    $(id).onkeydown=event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?1:1-i;$(next?'tabEdit':'tabCreate').click();$(next?'tabEdit':'tabCreate').focus();}};
  });
  $('close').onclick=()=>$('dialog').close();$('dialog').addEventListener('close',stopPreview);$('dialog').addEventListener('cancel',stopPreview);
  $('dialog').onclick=event=>{if(event.target===$('dialog')){const r=$('dialog').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)$('dialog').close();}};
  $('history').onclick=()=>{remember();historyView='Chats';historyFilter='All';renderHistory();positionHistory();$('historyDrawer').showModal();$('history').setAttribute('aria-expanded','true');};
  $('closeHistory').onclick=closeHistory;$('historyBackdrop').onclick=closeHistory;
  $('historyDrawer').addEventListener('close',()=>$('history').setAttribute('aria-expanded','false'));
  $('historyDrawer').addEventListener('cancel',()=>$('history').setAttribute('aria-expanded','false'));
  $('noticeView').onclick=()=>{if(noticeEditTask){editor.locate(noticeEditTask);noticeEditTask=null;$('completionNotice').hidden=true;}else if(noticeTask)locateTask(noticeTask);};$('noticeDismiss').onclick=()=>{$('completionNotice').hidden=true;noticeTask=null;noticeEditTask=null;};
  $('demoPhoto').onclick=()=>{if(workspace==='edit'){editor.samplePhoto();return;}chat().photoRevision++;draft().photo={name:'sample-photo.jpg',url:materials[2].image};renderAttachment();error('');};
  $('previewState').onchange=event=>{const url=new URL(location.href);url.searchParams.delete('demo');if(event.target.value!=='start')url.searchParams.set('demo',event.target.value);url.searchParams.set('v','review-zh-20261119');location.href=url.href;};
  window.addEventListener('resize',()=>{if($('historyDrawer').open)positionHistory();});
  window.addEventListener('scroll',()=>{if($('historyDrawer').open)positionHistory();},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)$('dialogbody').querySelectorAll('video').forEach(v=>v.pause());});
  document.addEventListener('input',scheduleSave);document.addEventListener('change',scheduleSave);document.addEventListener('click',scheduleSave);
  document.querySelector('.scroll').addEventListener('scroll',scheduleSave,{passive:true});
  $('editScroll').addEventListener('scroll',scheduleSave,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)persistWorkspace();});
  window.addEventListener('pagehide',()=>persistWorkspace());
  $('queryFailureControl').onchange=event=>{$('queryFailure').checked=event.target.checked;};
  $('resetPreview').onclick=async()=>{
    if(isolatedDemo){location.reload();return;}
    if(!confirm('确定清除当前浏览器中本原型保存的对话、照片和草稿吗？'))return;
    try{storageEnabled=false;clearTimeout(saveTimer);await saveChain;await window.AgentDraftStore.clear();location.reload();}
    catch{toast('重置演示失败，当前页面内容仍然保留。');}
  };
  window.addEventListener('beforeunload',()=>objectURLs.forEach(url=>URL.revokeObjectURL(url)));
  $('previewState').value=['start','waiting','result','video','failed','needs-changes','unknown','missing-photo','unavailable-style','expired-result','styles-loading','styles-error','styles-empty','edit','edit-history','edit-background','edit-hairstyle','edit-filters','edit-result'].includes(demo)?demo:'start';
  renderDraft();
  if(['result','video','waiting','failed','needs-changes','unknown','missing-photo','unavailable-style','expired-result'].includes(demo)){
    const i=demo==='video'?4:2;
    draft().selected=i;draft().mode=materials[i].type;draft().ratio=demo==='video'?'9:16':'3:4';
    draft().prompt=materials[i].prompt;draft().photo={name:'sample-photo.jpg',url:materials[i].image};saveDescription();renderDraft();
    if(demo==='waiting')run({...draft()},currentChatId,10000);
    else{
      const t={id:nextTaskId++,chatId:currentChatId,parentId:null,prompt:draft().prompt,photo:{...draft().photo},selected:i,mode:draft().mode,ratio:draft().ratio,
        status:demo==='unknown'?'unknown':['failed','needs-changes'].includes(demo)?'failed':'success',failureKind:demo==='needs-changes'?'input':'temporary',element:element('article','task'),fail:demo==='failed',styleUnavailable:demo==='unavailable-style'};
      t.element.dataset.taskId=String(t.id);if(demo==='missing-photo')t.photo={name:'original-photo.jpg',url:null,unavailable:true};if(t.status==='success'){t.result=sampleResult(t);if(demo==='expired-result')t.result.unavailable=true;}tasks.push(t);chat().title=materials[i].name;renderTask(t);$('tasks').append(t.element);
      // Fixture starts with an empty next draft; live completions never mutate drafts.
      chat().draft={...draft(),prompt:'',selected:null,photo:null};renderDraft();requestAnimationFrame(()=>scrollToTask(t));
    }
  }
  if(materialBrowserState==='loading')setTimeout(()=>{materialBrowserState='ready';renderMaterials();},1500);
  if(demo==='edit'||demo.startsWith('edit-'))editor.fixture(demo);
  updateRunControl();
  window.ProductWorkspace={
    editState(){return editor.snapshot(p=>p);},
    finishPhotoReplacement(token,photo){editor.finishPhotoReplacement(token,photo);},
    usePhoto(photo,edit=false){if(edit)editor.importPhoto(photo);else{chat().photoRevision++;draft().photo=photo;renderAttachment();error('');scheduleSave();}},
    openCreate(index){switchWorkspace('create');if(Number.isInteger(index))choose(index);},
    openEdit(scene){switchWorkspace('edit');if(scene)editor.enter(scene);else editor.home();},
    list(){return [
      ...tasks.map(t=>({id:'create-'+t.id,title:materials[t.selected]?.name||'Your idea',status:t.status,type:t.mode,url:t.result?.url,poster:t.result?.poster||materials[t.selected]?.image,origin:'create',sourceId:t.id})),
      ...editor.snapshot(p=>p).tasks.map(t=>({id:'edit-'+t.id,title:({background:'Background',hairstyle:'Hairstyle',filters:'Filters'})[t.scene],status:t.status,type:'Image',url:t.result?.url,poster:t.result?.url||t.photo?.url,origin:'edit',sourceId:t.id}))
    ];},
    locate(origin,id){if(origin==='create'){const t=tasks.find(t=>t.id===id);if(t)locateTask(t);}else{const t=editor.snapshot(p=>p).tasks.find(t=>t.id===id);if(t)editor.locate(t);}}
  };
  initializeStorage();
})();
