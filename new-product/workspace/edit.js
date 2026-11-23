/* Scene chats: background/hair samples; local fixed filters render actual pixels. */
(() => {
  'use strict';
  window.AgentEdit={create(host){
    const $=id=>document.getElementById(id), el=host.element, btn=host.button;
    const portrait='assets/source-portraits/2.jpg';
    const scenes={
      background:{name:'Background',greeting:'Choose a background or describe your own.',placeholder:'Describe a new background…',cover:'assets/edit-beach.svg',styles:[
        {id:'beach',name:'Coastline',cover:'assets/edit-beach.svg',prompt:'Replace the background with a quiet beach in soft afternoon light. Keep the person, outfit, and pose unchanged.'},
        {id:'studio',name:'Soft studio',cover:'assets/edit-studio.svg',prompt:'Replace the background with a warm, minimal studio. Keep the person, outfit, and pose unchanged.'},
        {id:'garden',name:'In bloom',cover:'assets/edit-garden.svg',prompt:'Replace the background with a garden of soft green leaves and white flowers. Keep the person, outfit, and pose unchanged.'}
      ]},
      hairstyle:{name:'Hairstyle',greeting:'Try a different you.',placeholder:'Describe the hair you have in mind…',cover:'assets/edit-waves.svg',styles:[
        {id:'bob',name:'Soft bob',cover:'assets/edit-bob.svg',prompt:'Give the person a chin-length bob with a soft side part. Keep their face, expression, outfit, and background unchanged.'},
        {id:'waves',name:'Loose waves',cover:'assets/edit-waves.svg',prompt:'Give the person shoulder-length, loose waves in their current hair color. Keep their face, expression, outfit, and background unchanged.'},
        {id:'pixie',name:'Pixie cut',cover:'assets/edit-pixie.svg',prompt:'Give the person a short, softly textured pixie cut. Keep their face, expression, outfit, and background unchanged.'}
      ]},
      filters:{name:'Filters',greeting:'Find your kind of light.',placeholder:'Describe the mood you’re going for…',cover:portrait,styles:[
        {id:'warm',name:'Warm film',cover:portrait,filter:'sepia(.3) saturate(.8)',prompt:'Give this photo warm film tones, soft contrast, and subtle grain. Keep the scene and facial features unchanged.'},
        {id:'mono',name:'Soft mono',cover:portrait,filter:'grayscale(1)',prompt:'Give this photo a soft black-and-white look with gentle highlights. Keep the scene and facial features unchanged.'},
        {id:'faded',name:'Faded light',cover:portrait,filter:'saturate(.6) contrast(.85) brightness(1.08)',prompt:'Give this photo a faded, airy color palette with soft highlights. Keep the scene and facial features unchanged.'}
      ]}
    };
    let currentScene=null,nextChat=4,nextTask=1,notice=null,toolsOpen=false;
    let current={background:1,hairstyle:2,filters:3};
    const makeChat=(id,scene)=>({id,scene,title:'New chat',createdAt:Date.now(),updatedAt:0,descriptions:{free:''},scrollTop:0,revision:0,draft:{prompt:'',selected:null,photo:null,sourceTaskId:null,intensity:70}});
    let previewRevision=0;
    let chats=[makeChat(1,'background'),makeChat(2,'hairstyle'),makeChat(3,'filters')],tasks=[];
    const active=()=>tasks.find(t=>['processing','unknown'].includes(t.status));
    const chat=()=>chats.find(c=>c.id===current[currentScene]);
    const draft=()=>chat().draft;
    const template=(scene,key)=>scenes[scene].styles.find(t=>t.id===key);
    const remember=()=>{if(!currentScene)return;const c=chat();c.draft.prompt=$('editPrompt').value;c.descriptions[c.draft.selected||'free']=c.draft.prompt;c.scrollTop=$('editScroll').scrollTop;if(!tasks.some(t=>t.chatId===c.id))c.title=title(c.draft.prompt)||'New chat';};
    const changed=(touch=false)=>{if(touch&&currentScene)chat().updatedAt=Date.now();host.save();host.updateRunControl();};
    function error(text,action){$('editError').textContent=text||'';$('editError').hidden=!text;$('editPending').hidden=!action;$('editPending').onclick=action||null;}
    function syncPending(){if(!host.pending()&&!$('editPending').hidden)error('');}
    function title(text){const clean=text.trim().replace(/\s+/g,' ');return clean.length>42?clean.slice(0,42).replace(/\s+\S*$/,'')+'…':clean;}
    function image(url,alt,className){const node=el('img',className);node.src=url;node.alt=alt;return node;}
    function makeHome(){
      const home=$('editHome');home.replaceChildren();home.append(el('h2','','A little change. A whole new look.'));
      const list=el('div','editscenes');
      Object.entries(scenes).forEach(([key,s])=>{
        const b=btn('',()=>enter(key),'editscenecard');b.dataset.editScene=key;
        const cover=image(s.cover,'','editscenecover');if(key==='filters')cover.style.filter='sepia(.25)';
        b.append(cover,el('span','editscenename',s.name),el('span','editscenearrow','↗'));list.append(b);
      });home.append(list);
      const starters=el('div','editstarters');
      [['background','Take me somewhere new','A quiet beach at sunset'],['hairstyle','Try a shorter cut','Give me a soft, chin-length bob'],['filters','Find my film look','Warm film at 60%']].forEach(([scene,label,prompt])=>{
        const b=btn(label,()=>{enter(scene);draft().prompt=prompt;renderDraft();changed(true);},'editstarter');starters.append(b);
      });home.append(starters);
      const recent=chats.filter(c=>c.draft.photo||c.draft.prompt||Object.values(c.descriptions).some(text=>text.trim())||tasks.some(t=>t.chatId===c.id)).sort((a,b)=>(b.updatedAt||b.id)-(a.updatedAt||a.id));
      if(recent.length){
        const section=el('section','recentsection');section.setAttribute('aria-label','Recent edits');
        const heading=el('div','recenthead');heading.append(el('h3','recentheading','Recent edits'));
        const all=btn('View all',()=>$('history').click(),'recentall');all.dataset.editViewAll='';all.setAttribute('aria-label','View all '+recent.length+' edits');heading.append(all);section.append(heading);const rail=el('div','recentrail');rail.setAttribute('role','group');rail.setAttribute('aria-label','Recent edit chats');section.append(rail);home.append(section);
        recent.slice(0,3).forEach(c=>{
        const own=tasks.filter(t=>t.chatId===c.id),t=own.at(-1),pending=own.find(t=>['processing','unknown'].includes(t.status)),d=c.draft;
        const matches=t&&d.photo?.url===t.photo?.url&&d.selected===t.selected&&(c.scene==='filters'?(d.intensity??70)===(t.intensity??70):d.prompt===t.prompt);
        const status=pending?({processing:'Editing…',unknown:'Check status'})[pending.status]:!matches?'Draft':({success:'Ready',failed:'Failed'})[t.status]||'Draft';
        const b=btn('',()=>enter(c.scene,c.id),'recentedit');b.dataset.recentChat=String(c.id);
        const photo=matches&&t?.status==='success'?t.result.url:d.photo?.url||t?.photo?.url;
        if(photo){const cover=image(photo,'','');cover.onerror=()=>cover.replaceWith(el('span','recentplaceholder','▧'));b.append(cover);}else b.append(el('span','recentplaceholder','▧'));
        const text=el('span','recentcopy'),top=el('span','recenttop');top.append(el('strong','',scenes[c.scene].name));
        if(c.updatedAt){const date=new Date(c.updatedAt),stamp=el('time','recenttime',date.toDateString()===new Date().toDateString()?date.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}):date.toLocaleDateString('en-US',{month:'short',day:'numeric'}));stamp.dateTime=date.toISOString();top.append(stamp);}
        text.append(top);const description=d.prompt||c.title;if(description&&description!==scenes[c.scene].name)text.append(el('span','recentdescription',description));
        text.append(el('small','recentstatus',status));b.append(text);rail.append(b);
      });}

    }
    function syncHeader(){host.editHeader(Boolean(currentScene));}
    function show(){syncHeader();if(currentScene)render();else{ makeHome();$('editHome').hidden=false;$('editRoom').hidden=true; }}
    function fresh(scene){const next=makeChat(nextChat++,scene);chats.push(next);current[scene]=next.id;return next;}
    function enter(scene,id){
      if(!scenes[scene])return;remember();previewRevision++;toolsOpen=false;
      if(id&&chats.some(c=>c.id===id&&c.scene===scene))current[scene]=id;
      else if(currentScene!==scene){
        const initial=chats.find(c=>c.id===current[scene]);
        // Only the pristine initial visit can consume a scene's initial slot.
        if(currentScene||initial.visited||initial.draft.photo||initial.draft.prompt||tasks.some(t=>t.chatId===initial.id))fresh(scene);
      }
      currentScene=scene;chat().visited=true;host.showEdit();render();changed();
    }
    function home(){remember();previewRevision++;toolsOpen=false;currentScene=null;makeHome();$('editHome').hidden=false;$('editRoom').hidden=true;syncHeader();changed();}
    function choose(key){
      remember();const d=draft();d.selected=key==='free'?null:key;
      d.prompt=chat().descriptions[d.selected||'free']??(currentScene==='filters'?'':template(currentScene,d.selected)?.prompt)??'';
      chat().descriptions[d.selected||'free']=d.prompt;error('');renderDraft();changed(true);
    }
    function renderDraft(){
      const d=draft(),s=scenes[currentScene];$('editPrompt').value=d.prompt;$('editPrompt').placeholder=s.placeholder;
      const source=$('editAttachment'),background=currentScene==='background';
      source.replaceChildren();source.hidden=!d.photo;source.className='background-source composer-source';
      $('editRoom').dataset.scene=currentScene;
      $('editChips').prepend(source);$('editRoom').insertBefore($('editStyles'),$('editForm'));
      if(d.photo){
        if(d.photo.url&&!d.photo.unavailable){
          const preview=btn('',()=>{
            const body=host.openDialog('Current photo');body.append(image(d.photo.url,'Current photo to edit','resultlarge'));
            if(!background){const remove=btn('Remove photo',()=>{chat().revision++;d.photo=null;d.sourceTaskId=null;$('dialog').close();renderDraft();error('');changed(true);},'inlineaction');body.append(remove);}
          },'background-source-preview');
          preview.setAttribute('aria-label','Preview current photo');preview.append(image(d.photo.url,'Current photo to edit',''));source.append(preview);
        }
        const meta=el('div','background-source-actions');
        if(d.photo.unavailable)meta.append(el('span','','Photo unavailable'));
        const name=el('span','sr-only',d.photo.name),replace=btn('',()=>background?chooseBackgroundPhoto():$('editFile').click(),'background-replace');
        replace.setAttribute('aria-label',d.photo.unavailable?'Choose photo':'Replace photo');replace.title=replace.getAttribute('aria-label');
        replace.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M19 9a7 7 0 0 0-12-3L4 9m0-5v5h5M5 15a7 7 0 0 0 12 3l3-3m0 5v-5h-5"/></svg>';
        meta.append(name,replace);source.append(meta);
      }
      $('editPhoto').hidden=Boolean(d.photo);
      $('editPhoto').setAttribute('aria-label',d.photo?'Replace photo to edit':'Add photo to edit');
      $('editPhoto').innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="m3 17 6-6 5 5 3-3 4 4"/></svg>';
      if(background){$('editGreeting').hidden=true;}
      const list=$('editStyles'),toggle=$('backgroundStylesToggle');
      const expanded=d.showStyles??!tasks.some(t=>t.chatId===chat().id);
      const panelVisible=toolsOpen||expanded;
      $('editTools').onclick=openTools;
      $('editTitle').textContent=s.name;
      toggle.hidden=!panelVisible;toggle.setAttribute('aria-expanded',String(panelVisible));
      toggle.setAttribute('aria-controls',toolsOpen?'editToolPanel':'editStyles');
      toggle.setAttribute('aria-label','Collapse panel');toggle.title='Collapse panel';
      toggle.onclick=()=>{remember();toolsOpen=false;d.showStyles=false;renderDraft();changed();};
      const reopen=$('editStylesOpen');reopen.hidden=panelVisible;
      reopen.setAttribute('aria-label','Show '+s.name.toLowerCase()+' styles');reopen.title=reopen.getAttribute('aria-label');
      reopen.onclick=()=>{remember();toolsOpen=false;d.showStyles=true;renderDraft();changed();};
      list.hidden=toolsOpen||!expanded;list.replaceChildren();renderTools();
      const own=btn('',()=>choose('free'),'editstyle editown');own.hidden=currentScene==='filters'||currentScene==='background';own.dataset.editStyle='free';own.append(el('span','free','+'),el('span','','Your idea'));own.setAttribute('aria-pressed',String(d.selected===null));list.append(own);
      s.styles.forEach(style=>{
        const b=btn('',()=>choose(style.id),'editstyle');b.dataset.editStyle=style.id;b.setAttribute('aria-pressed',String(d.selected===style.id));
        const cover=image(currentScene==='filters'?(d.photo?.url||portrait):style.cover,'','');
        if(currentScene==='filters'&&d.photo&&!d.photo.unavailable){const source=d.photo.url;window.AgentFilters.render({...d.photo},style.id,100,160).then(r=>{if(cover.isConnected&&currentScene==='filters'&&draft().photo?.url===source)cover.src=r.url;}).catch(()=>{});}else if(style.filter)cover.style.filter=style.filter;
        b.append(cover,el('span','editstylename',style.name));list.append(b);
      });
      const context=$('editContext');context.replaceChildren();context.hidden=!d.selected;
      if(d.selected){context.append(el('span','source-name',template(currentScene,d.selected).name));const clear=btn('×',()=>choose('free'),'source-remove');clear.setAttribute('aria-label','Switch to your own edit idea');context.append(clear);}
      const filtering=currentScene==='filters';
      const submit=$('editForm').querySelector('[type="submit"]');submit.setAttribute('aria-label',filtering?'Apply filter':'Generate');submit.title=filtering?'Apply filter':'Generate';
      $('editPrompt').placeholder=filtering?'Choose a filter or describe the look…':background?'Choose a background or describe your own…':s.placeholder;
      updateFilterPreview();resizePrompt();
    }
    function openTools(){
      remember();if(toolsOpen){toolsOpen=false;draft().showStyles=false;}else toolsOpen=true;renderDraft();changed();
    }
    function renderTools(){
      const panel=$('editToolPanel'),trigger=$('editTools');
      panel.hidden=!toolsOpen;trigger.setAttribute('aria-expanded',String(toolsOpen));
      panel.replaceChildren();if(!toolsOpen)return;
      const photo=draft().photo;
      const icons={
        background:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 3-3 6 6"/>',
        hairstyle:'<path d="M5 16V9a7 7 0 0 1 14 0v7M5 12c5 0 8-3 9-6 0 4 2 6 5 6M8 15v2a4 4 0 0 0 8 0v-2"/>',
        filters:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>'
      };
      Object.entries(scenes).forEach(([scene,s])=>{
        const activeScene=scene===currentScene;
        const b=btn('',()=>{
          remember();toolsOpen=false;
          if(activeScene){draft().showStyles=true;renderDraft();changed();return;}
          fresh(scene);currentScene=scene;chat().visited=true;
          draft().photo=photo?{...photo}:null;host.showEdit();render();changed(true);
        },'edit-tool-card');
        b.dataset.editTool=scene;b.setAttribute('aria-current',String(activeScene));
        const icon=el('span','edit-tool-icon');icon.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[scene]+'</svg>';
        b.append(icon,el('span','',s.name));panel.append(b);
      });
    }
    const photoRequests=new Map();let nextPhotoRequest=0;
    function chooseBackgroundPhoto(){
      if(parent===window){$('editFile').click();return;}
      const token='replace-'+(++nextPhotoRequest),owner=chat();
      photoRequests.set(token,{owner,revision:owner.revision});
      parent.postMessage({type:'product-edit-photo-request',token},location.origin);
    }
    function finishPhotoReplacement(token,photo){
      const pending=photoRequests.get(token);photoRequests.delete(token);if(!pending)return;if(!photo){if(currentScene&&chat()===pending.owner)$('editAttachment').querySelector('.background-replace')?.focus();return;}if(pending.owner.revision!==pending.revision)return;
      const owner=pending.owner;owner.revision++;owner.draft.photo=photo;owner.draft.sourceTaskId=null;owner.updatedAt=Date.now();host.trackURL(photo.url);
      if(currentScene&&chat()===owner){renderDraft();error('');}changed(true);
    }
    function resizePrompt(){const p=$('editPrompt'),min=24;p.style.height=min+'px';p.style.height=Math.max(min,Math.min(132,p.scrollHeight))+'px';p.style.overflowY=p.scrollHeight>132?'auto':'hidden';}
    function render(){
      if(!currentScene)return;const c=chat();$('editHome').hidden=true;$('editRoom').hidden=false;$('editTitle').textContent=scenes[currentScene].name;
      $('editGreeting').textContent=scenes[currentScene].greeting;$('editGreeting').hidden=true;
      $('editTasks').replaceChildren(...tasks.filter(t=>t.chatId===c.id).map(renderTask));renderDraft();error('');$('editScroll').scrollTop=c.scrollTop;syncHeader();
    }
    function action(label,name,fn,className='resultaction'){const b=btn(label,fn,className);b.dataset.editAction=name;return b;}
    function preview(t){
      const body=host.openDialog('Preview');
      const tabs=el('div','editcomparetabs');let after=true;
      const photo=image(t.result.url,'Edited photo','resultlarge');
      const buttons=['Before','After'].map((label,i)=>{const b=btn(label,()=>{after=Boolean(i);photo.src=after?t.result.url:t.photo.url;photo.alt=after?'Edited photo':'Photo used for this edit';buttons.forEach((item,j)=>item.setAttribute('aria-pressed',String(j===i)));});b.setAttribute('aria-pressed',String(i===1));tabs.append(b);return b;});
      body.append(tabs,photo,action('Download','download',()=>download(t)));
    }
    async function download(t){
      try{const response=await fetch(t.result.url);if(!response.ok)throw new Error('Unavailable');const blob=await response.blob();const url=URL.createObjectURL(blob);host.trackURL(url);const a=document.createElement('a');a.href=url;a.download=t.result.actual?'edited-'+t.selected+'-'+t.intensity+'.jpg':'sample-not-ai-edit-'+t.scene+'.jpg';a.click();host.toast(t.result.actual?'Download started.':'Sample download started.');setTimeout(()=>URL.revokeObjectURL(url),30000);}
      catch{host.toast('This download couldn’t start. Please try again.');}
    }
    function useResult(t){
      const body=host.openDialog('Continue editing');
      const choices=el('div','continuechoices');
      Object.entries(scenes).forEach(([scene,s])=>{
        const b=btn(s.name,()=>{
          $('dialog').close();
          if(scene===t.scene){enter(t.scene,t.chatId);}
          else{remember();fresh(scene);currentScene=scene;chat().visited=true;host.showEdit();render();}
          chat().revision++;draft().photo={name:'Selected result',url:t.result.url};draft().sourceTaskId=t.id;
          renderDraft();changed(true);$('editPrompt').focus();
        },'continuechoice');b.dataset.continueScene=scene;choices.append(b);
      });body.append(choices);
    }
    function restoreInputs(t){
      if(!currentScene||t.chatId!==chat().id)locate(t);
      const d=draft(),different=d.prompt!==t.prompt||d.selected!==t.selected||d.photo?.url!==t.photo?.url;
      if(different&&(d.prompt||d.photo)&&!confirm('Replace your current edit draft with the inputs from this edit?'))return;
      chat().revision++;chat().draft={prompt:t.prompt,photo:t.photo?{...t.photo}:null,selected:t.selected,sourceTaskId:t.id,intensity:t.intensity??70};chat().descriptions[t.selected||'free']=t.prompt;renderDraft();error('');changed(true);$('editPrompt').focus();
    }
    function renderTask(t){
      const article=el('article','task edittask');article.dataset.editTask=String(t.id);article.dataset.status=t.status;
      const request=el('div','requestbubble');
      if(t.photo?.url&&!t.photo.unavailable)request.append(image(t.photo.url,'Photo used for this edit','requestphoto'));else request.classList.add('withoutphoto');
      request.append(el('p','',t.scene==='filters'?template('filters',t.selected)?.name:t.prompt),el('small','',scenes[t.scene].name+(t.selected?' · '+template(t.scene,t.selected).name:'')));
      if(t.scene==='filters')request.querySelector('small')?.remove();
      const response=el('div','responsebubble');article.append(request,response);
      const actions=el('div','resultactions editresultactions');
      if(t.status==='processing'){const p=el('p','taskstatus','Working on your edit…');const indicator=el('span','statusindicator');indicator.setAttribute('aria-hidden','true');p.prepend(indicator);response.append(p);}
      else if(t.status==='unknown'){
        response.append(el('p','taskstatus',t.checking?'Checking your edit…':'We couldn’t confirm the status.'));
        if(t.checkError)response.append(el('small','',t.checkError));const b=action('Check status','check',()=>check(t));b.disabled=Boolean(t.checking);actions.append(b);response.append(actions);
      }else if(t.status==='failed'){
        response.append(el('p','taskstatus',t.failureKind==='input'?'This needs a quick change':'Couldn’t finish this edit'));
        if(t.failureKind!=='input')actions.append(action('Try again','retry',()=>run(t,t.chatId)));
        actions.append(action('Edit idea','edit',()=>restoreInputs(t)));response.append(actions);
      }else{
        const p=action('','preview',()=>preview(t),'resultpreview');p.setAttribute('aria-label','View edit result');p.append(image(t.result.url,'Edited photo','taskimage'));response.append(p);
        actions.append(action('Continue editing','use',()=>useResult(t)));
        const down=action('','download',()=>download(t));down.innerHTML=host.icon('<path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4"/>');down.setAttribute('aria-label',t.result.actual?'Download edited photo':'Download sample edit');down.title='Download';actions.append(down);response.append(actions);
      }return article;
    }
    function rerenderTasks(){if(!currentScene)return;$('editTasks').replaceChildren(...tasks.filter(t=>t.chatId===chat().id).map(renderTask));$('editGreeting').hidden=currentScene==='background'||tasks.some(t=>t.chatId===chat().id);renderDraft();}
    function locate(t){
      if($('dialog').open)$('dialog').close();if($('historyDrawer').open)host.closeHistory();
      enter(t.scene,t.chatId);const item=$('editTasks').querySelector('[data-edit-task="'+t.id+'"]');item?.scrollIntoView({block:'nearest',behavior:'auto'});if(notice?.id===t.id)notice=null;host.clearNotice(t);
    }
    function block(){const pending=host.pending();if(!pending)return false;error(pending.task.status==='unknown'?'Check the status of your current creation before starting another.':'Please wait for your current creation to finish. You can keep editing.',()=>pending.kind==='edit'?locate(pending.task):host.locateCreate(pending.task));return true;}
    function run(snapshot,chatId=chat().id){
      if(block())return;const owner=chats.find(c=>c.id===chatId);if(!owner)return;
      if(!snapshot.photo||snapshot.photo.unavailable){error('Add a photo to edit.');return;}
      const t={id:nextTask++,scene:owner.scene,chatId,prompt:snapshot.prompt,selected:snapshot.selected,photo:{...snapshot.photo},parentId:snapshot.sourceTaskId||snapshot.id||null,status:'processing',intensity:snapshot.intensity??70,filterVersion:owner.scene==='filters'?window.AgentFilters.version:null,outcome:$('nextOutcome').value};
      tasks.push(t);owner.updatedAt=Date.now();owner.title=title(tasks.find(item=>item.chatId===chatId&&item.prompt.trim())?.prompt||'')||'New chat';rerenderTasks();error('');changed();
      if(t.scene==='filters')renderFilterTask(t);else setTimeout(()=>{if(t.status==='processing')finish(t,t.outcome);},3200);return t;
    }
    function finish(t,outcome){
      t.checking=false;t.status=outcome==='unknown'?'unknown':['failed','needs-changes'].includes(outcome)?'failed':'success';t.failureKind=outcome==='needs-changes'?'input':'temporary';
      if(t.status==='success'&&!t.result)t.result={url:t.scene==='background'?'assets/source-portraits/0.jpg':t.scene==='hairstyle'?'assets/studio-portrait.jpg':portrait};
      rerenderTasks();if(currentScene&&chat().id===t.chatId)error('');
      if(host.visible()&&currentScene&&chat().id===t.chatId&&!$('historyDrawer').open&&!$('dialog').open){const node=$('editTasks').lastElementChild;node?.scrollIntoView({block:'nearest',behavior:'auto'});}
      else{notice=t;host.notify(t,t.status==='success'?'Your '+scenes[t.scene].name.toLowerCase()+' edit is ready.':'Your edit needs attention.');}
      if(!currentScene)makeHome();
      if($('historyDrawer').open&&host.visible())history($('historyBody'));changed();
    }
    function check(t){if(t.checking)return;t.checking=true;t.checkError='';rerenderTasks();setTimeout(()=>{t.checking=false;if($('queryFailure').checked){t.checkError='We couldn’t check right now. Try again.';rerenderTasks();changed();}else if(t.scene==='filters'){t.checking=true;rerenderTasks();renderFilterTask(t);}else finish(t,'success');},900);}
    function routeRequest(prompt){
      // Deliberately bounded demo matching; keep/preserve clauses are not edit requests.
      const request=prompt.replace(/(?:keep|preserve|leave|don[’']?t change)[^.]*[.]?/gi,'');
      if(/(?:change|try|give|make|switch|换|改|染)[\s\S]*(?:hair|bob|pixie|bangs|curls|waves|发型|头发)/i.test(request))return 'hairstyle';
      if(/(?:change|replace|swap|换|改)[\s\S]*(?:background|backdrop|背景)/i.test(request))return 'background';
      if(/(?:warm film|soft mono|faded light|black.and.white|filter|滤镜)/i.test(request))return 'filters';
      return null;
    }
    function offerRoute(scene,prompt){
      const source=chat(),photo=source.draft.photo?{...source.draft.photo}:null,sourceId=source.draft.sourceTaskId;
      error('This edit belongs in '+scenes[scene].name+'.');
      const b=btn('Go to '+scenes[scene].name,()=>{
        remember();fresh(scene);currentScene=scene;chat().visited=true;
        chat().draft={...chat().draft,photo,prompt,sourceTaskId:sourceId};host.showEdit();render();changed(true);
      },'inlineaction');b.dataset.routeScene=scene;$('editError').append(b);
    }
    function submit(event){
      event.preventDefault();remember();error('');const d=draft();d.prompt=d.prompt.trim();
      const request=d.prompt.replace(/(?:keep|preserve|leave|don[’']?t change)[^.]*[.]?/gi,'');
      const requests=[/(?:change|try|give|make|switch)[\s\S]*(?:hair|bob|pixie|bangs|curls|waves)/i.test(request),/(?:change|replace|swap)[\s\S]*(?:background|backdrop)/i.test(request),/(?:warm film|soft mono|faded light|black.and.white|filter)/i.test(request)];
      if(requests.filter(Boolean).length>1){error('Choose one edit first: background, hairstyle, or filters.');return;}
      const target=routeRequest(d.prompt);if(target&&target!==currentScene){offerRoute(target,d.prompt);return;}
      if(currentScene==='filters'){if(block())return;if(d.prompt&&!filterRequest())return;applyFilter();return;}
      if(block())return;
      if(!d.prompt){error('Describe your edit or choose a style.');$('editPrompt').focus();return;}
      if(/remove (?:an? )?(?:object|person)|retouch|upscale|remove blemishes/i.test(d.prompt)){error('You can change backgrounds, try hairstyles, or apply filters here.');return;}
      if(/^(?:make it better|improve it|do something|surprise me)[.!]?$/i.test(d.prompt)){error(currentScene==='background'?'What background would you like? Try a beach, garden, or studio.':'What would you like to change: color, length, curls, or bangs?');return;}
      if(!d.photo||d.photo.unavailable){error('Add a photo to edit.');$('editPhoto').focus();return;}const submitted=run(d);if(submitted&&currentScene==='background'){d.prompt='';d.selected=null;d.showStyles=false;chat().descriptions.free='';renderDraft();changed();}
    }
    function filterRequest(){
      const d=draft(),text=d.prompt.toLowerCase();
      if(/relight|rebuild|exposure|remove|retouch|光线重构/i.test(text)){error('Filters adjust the overall color. Choose Warm film, Soft mono, or Faded light.');return false;}
      const found=scenes.filters.styles.find(s=>text.includes(s.name.toLowerCase())||text.includes(s.id));
      const percent=text.match(/(\d{1,3})\s*%/),less=/\b(?:less|softer|reduce|lighter)\b/i.test(text),more=/\b(?:more|stronger|increase)\b/i.test(text);
      if(percent&&Number(percent[1])>100){error('Choose an intensity from 0% to 100%.');return false;}
      if(!found&&!percent&&!less&&!more){error('Try “Warm film at 60%,” “Soft mono,” or “less intense.”');return false;}
      if(!found&&!d.selected){error('Choose a filter first: Warm film, Soft mono, or Faded light.');return false;}
      if(found)d.selected=found.id;
      if(percent)d.intensity=Number(percent[1]);else if(less)d.intensity=Math.max(0,(d.intensity??70)-15);else if(more)d.intensity=Math.min(100,(d.intensity??70)+15);
      renderDraft();changed(true);return true;
    }
    function updateFilterPreview(){
      const panel=$('filterPreview'),token=++previewRevision;
      const c=chat(),d=c.draft;panel.hidden=currentScene!=='filters';if(panel.hidden)return;
      panel.replaceChildren();const frame=el('div','filterframe');panel.append(frame);
      if(!d.photo||d.photo.unavailable){frame.append(el('p','','Add a photo to find your look.'));return;}
      const photo=image(d.photo.url,'Current photo preview','filterphoto');frame.append(photo);
      if(!d.selected){panel.append(el('p','previewcaption','Choose a filter to preview.'));return;}
      const caption=el('p','previewcaption','Updating preview…');panel.append(caption);
      window.AgentFilters.render({...d.photo},d.selected,d.intensity??70,960).then(result=>{
        if(token!==previewRevision||currentScene!=='filters'||chat().id!==c.id)return;
        photo.src=result.url;caption.textContent=template('filters',d.selected).name;
      }).catch(()=>{if(token===previewRevision){caption.textContent='Preview unavailable. Replace the photo or try again.';const retry=btn('Try again',updateFilterPreview,'inlineaction');caption.append(retry);}});
    }
    async function renderFilterTask(t){
      try{const result=await window.AgentFilters.render(t.photo,t.selected,t.intensity,2048);if(t.status!=='processing'&&t.status!=='unknown')return;t.result=result;finish(t,'success');}
      catch{t.result=null;finish(t,'failed');}
    }
    function applyFilter(){
      if(!currentScene||currentScene!=='filters'||block())return;
      remember();const d=draft();if(!d.photo||d.photo.unavailable){error('Add a photo to edit.');return;}if(!d.selected){error('Choose a filter to preview.');return;}
      // Render from the click snapshot, never from a potentially stale preview.
      run({...d,prompt:d.prompt||template('filters',d.selected).name});
    }
    async function upload(event){
      const file=event.target.files[0];if(!file||!currentScene)return;const owner=chat(),revision=++owner.revision;
      if(!file.type.startsWith('image/')){error('Choose an image file.');return;}
      const url=URL.createObjectURL(file),pic=new Image();pic.src=url;
      try{await pic.decode();if(owner.revision!==revision){URL.revokeObjectURL(url);return;}window.ProductPhotos?.add(file,file.name).catch(()=>{});host.trackURL(url);owner.draft.photo={name:file.name,url,file};owner.draft.sourceTaskId=null;owner.updatedAt=Date.now();if(currentScene&&chat().id===owner.id){renderDraft();error('');}changed();}
      catch{URL.revokeObjectURL(url);if(currentScene&&chat().id===owner.id)error('This photo couldn’t be opened. Try another one.');}
    }
    function newConversation(){
      if(!currentScene)return;remember();const c=chat();if(!c.draft.prompt&&!c.draft.photo&&!Object.values(c.descriptions).some(text=>text.trim())&&!tasks.some(t=>t.chatId===c.id)){$('editPrompt').focus();return;}
      const next=makeChat(nextChat++,currentScene);chats.push(next);current[currentScene]=next.id;render();changed();$('editPrompt').focus();
    }
    function history(body){
      remember();body.replaceChildren();
      chats.slice().sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)||b.id-a.id).filter(c=>c.draft.prompt.trim()||c.draft.photo||Object.values(c.descriptions).some(text=>text.trim())||tasks.some(t=>t.chatId===c.id)).forEach(c=>{
        const own=tasks.filter(t=>t.chatId===c.id),summary=c.draft.prompt.trim()||own.slice().reverse().find(t=>t.prompt.trim())?.prompt||'';
        const b=host.historyRow(c,summary,()=>{enter(c.scene,c.id);host.closeHistory();},currentScene===c.scene&&current[c.scene]===c.id,scenes[c.scene].name);
        b.dataset.editHistoryChat=String(c.id);body.append(b);
      });
      if(!body.children.length)body.append(el('p','sheetnote','No conversations yet.'));
    }
    function snapshot(savePhoto){remember();return {version:1,currentScene,current:{...current},chats:chats.map(c=>({...c,revision:0,draft:{...c.draft,photo:savePhoto(c.draft.photo)}})),tasks:tasks.map(({checking,...t})=>({...t,photo:savePhoto(t.photo)}))};}
    function valid(state){
      if(!state||state.version!==1||!Array.isArray(state.chats)||!state.chats.length||!Array.isArray(state.tasks)||!state.current||!(state.currentScene===null||scenes[state.currentScene]))return false;
      const ids=state.chats.map(c=>c.id);const draftValid=(d,scene)=>d&&typeof d.prompt==='string'&&(d.selected===null||Boolean(template(scene,d.selected)))&&(d.intensity===undefined||Number.isFinite(d.intensity)&&d.intensity>=0&&d.intensity<=100);
      return new Set(ids).size===ids.length&&Object.keys(scenes).every(scene=>state.chats.some(c=>c.id===state.current[scene]&&c.scene===scene))&&state.chats.every(c=>Number.isInteger(c.id)&&Boolean(scenes[c.scene])&&typeof c.title==='string'&&c.descriptions&&draftValid(c.draft,c.scene))&&state.tasks.every(t=>Number.isInteger(t.id)&&state.chats.some(c=>c.id===t.chatId&&c.scene===t.scene)&&draftValid(t,t.scene)&&['processing','unknown','failed','success'].includes(t.status)&&(t.status!=='success'||t.result&&typeof t.result.url==='string'));
    }
    function restore(state,revive){
      if(!state)return;currentScene=state.currentScene;current={...state.current};
      chats=state.chats.map(c=>({...c,revision:0,scrollTop:c.scrollTop||0,draft:{...c.draft,photo:revive(c.draft.photo)}}));
      tasks=state.tasks.map(t=>({...t,photo:revive(t.photo),status:t.status==='processing'?'unknown':t.status,checking:false}));
      chats.forEach(c=>{c.title=title(tasks.find(t=>t.chatId===c.id&&t.prompt.trim())?.prompt||c.draft.prompt)||'New chat';});
      nextChat=Math.max(...chats.map(c=>c.id))+1;nextTask=Math.max(0,...tasks.map(t=>t.id))+1;show();
    }
    function samplePhoto(){if(!currentScene){host.toast('Choose an edit first.');return;}chat().revision++;draft().photo={name:'sample-photo.jpg',url:portrait};draft().sourceTaskId=null;renderDraft();error('');changed(true);}
    function fixture(name){
      if(name==='edit-history'){fixture('edit-result');enter('hairstyle');draft().prompt='Try a soft bob in dark brown';samplePhoto();home();host.showEdit();return;}
      if(name==='edit'){home();host.showEdit();return;}
      const scene=name==='edit-result'?'background':name.replace('edit-','');if(!scenes[scene])return;
      enter(scene);choose(scenes[scene].styles[0].id);samplePhoto();
      if(name==='edit-result'){const t={id:nextTask++,chatId:chat().id,scene,prompt:draft().prompt,photo:{...draft().photo},selected:draft().selected,status:'success',result:{url:'assets/source-portraits/0.jpg'}};tasks.push(t);render();}
    }
    makeHome();$('editPrompt').oninput=()=>{draft().prompt=$('editPrompt').value;chat().descriptions[draft().selected||'free']=draft().prompt;chat().updatedAt=Date.now();error('');resizePrompt();};$('editPhoto').onclick=()=>currentScene==='background'?chooseBackgroundPhoto():$('editFile').click();$('editFile').onchange=upload;$('editForm').onsubmit=submit;
    return {finishPhotoReplacement,importPhoto(photo){if(!currentScene)enter('background');chat().revision++;draft().photo=photo;draft().sourceTaskId=null;renderDraft();error('');changed(true);},show,home,enter,activeTask:active,newConversation,history,snapshot,valid,restore,samplePhoto,locate,fixture,hasScene:()=>Boolean(currentScene),syncPending,remember};
  }};
})();
