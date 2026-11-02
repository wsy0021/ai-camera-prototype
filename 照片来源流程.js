/* Native device pages are simulated for the prototype; no system permission is requested. */
let cameraAccess='unknown';
const deviceAccessKey='camera-device-access-preview-v1';
try{const saved=JSON.parse(localStorage.getItem(deviceAccessKey)||'null');if(saved){if(['unknown','granted','denied'].includes(saved.camera))cameraAccess=saved.camera;if(['unknown','full','limited','denied'].includes(saved.photos))photoAccess=saved.photos;if(Array.isArray(saved.allowed))allowedPhotos=saved.allowed.filter(src=>typeof src==='string'&&src.startsWith('assets/'))}}catch{}
function saveDeviceAccess(){try{localStorage.setItem(deviceAccessKey,JSON.stringify({camera:cameraAccess,photos:photoAccess,allowed:allowedPhotos}))}catch{}}

const sourceFlow={page:'',source:'',picked:[],album:'recents',front:true,settingsReturn:'',settingsCamera:'',settingsPhotos:''};
const flowLayer=document.createElement('section');
flowLayer.className='device-flow';flowLayer.hidden=true;flowLayer.setAttribute('role','dialog');flowLayer.setAttribute('aria-modal','true');
document.querySelector('.phone').append(flowLayer);
const closeIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
const flipIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9a8 8 0 0 1 14-3l2 3M20 3v6h-6M20 15a8 8 0 0 1-14 3l-2-3M4 21v-6h6"/></svg>';
const sourceAssets=()=>[...new Set(library.map(f=>'assets/'+f))];
let sourceFocus=null;
function openPhotoSource(source){sourceFocus=document.activeElement;sourceFlow.source=source;sourceFlow.picked=[];sourceFlow.album='recents';sourceFlow.page=source==='camera'?(cameraAccess==='unknown'?'camera-permission':cameraAccess==='denied'?'camera-denied':'camera'):'picker';renderSourceFlow()}
function openAlbumAccess(){sourceFocus=document.activeElement;sourceFlow.source='access';sourceFlow.picked=[];sourceFlow.album='recents';if(photoAccess==='denied'){sourceFlow.settingsReturn='gallery';sourceFlow.page='settings';sourceFlow.settingsPhotos=photoAccess;sourceFlow.settingsCamera=cameraAccess}else if(photoAccess==='limited'){sourceFlow.page='access-select';sourceFlow.picked=[...allowedPhotos]}else if(photoAccess==='full'){sourceFlow.settingsReturn='gallery';sourceFlow.page='settings';sourceFlow.settingsPhotos=photoAccess;sourceFlow.settingsCamera=cameraAccess}else sourceFlow.page='photo-permission';renderSourceFlow()}
function closePhotoSource(){flowLayer.hidden=true;flowLayer.innerHTML='';document.querySelectorAll('.phone > :not(.device-flow)').forEach(el=>el.inert=false);if(sourceFocus?.isConnected)sourceFocus.focus();if(pendingTips)openPhotoGuide()}
function syncAccess(){saveDeviceAccess();document.querySelector('#permission-state').value=photoAccess;document.querySelector('#camera-access-state').value=cameraAccess;render()}
function sourceHeader(title,action='',actionLabel=''){return `<div class="status">9:41</div><div class="device-top"><button data-flow="close" aria-label="Cancel ${title}">${closeIcon}</button><h2 id="source-flow-title">${title}</h2>${action?`<button class="done" data-flow="${action}" ${sourceFlow.picked.length?'':'disabled'}>${actionLabel}</button>`:'<span style="width:44px"></span>'}</div>`}
function sourcePrompt(icon,title,description,buttons){return `<div class="device-body"><div class="device-prompt">${icon}<h2>${title}</h2><p>${description}</p>${buttons}</div></div>`}
function sourceButton(action,label,primary=false){return `<button class="${primary?'device-primary':'quiet'}" data-flow="${action}">${label}</button>`}
function systemPermission(title,description,buttons){return `<div class="system-permission"><h2 id="source-flow-title">${title}</h2><p>${description}</p><div class="system-permission-actions">${buttons}</div></div>`}
function renderSourceFlow(){
 const f=sourceFlow;let html='';
 if(f.page==='camera-permission')html=systemPermission('“AI Camera” Would Like to Access the Camera','Take photos to use with your templates.',sourceButton('allow-camera','Allow',true)+sourceButton('deny-camera','Don’t allow'));
 if(f.page==='camera-denied')html=sourceHeader('Camera access')+sourcePrompt(cameraIcon,'Enable your camera','Turn on camera access in Settings to take a photo.',sourceButton('camera-settings','Open settings',true)+sourceButton('picker','Choose from photos'));
 if(f.page==='photo-permission')html=systemPermission('Allow “AI Camera” to Access Your Photos?','Choose the photos this app can access.',sourceButton('select-access','Select photos…',true)+sourceButton('allow-all','Allow full access')+sourceButton('deny-photos','Don’t allow'));
 if(f.page==='camera'||f.page==='capture'){
  const captured=f.page==='capture',src=f.front?'assets/portraits-v3/selfie-portrait.jpg':'assets/portraits-v3/studio-portrait.jpg';
  html=sourceHeader(captured?'Use this photo?':'Camera')+`<div class="device-body device-camera"><div class="camera-view"><img src="${src}" alt="${captured?'Captured portrait':'Camera preview'}">${captured?'':'<div class="camera-guide"></div><div class="camera-caption">Keep your face inside the guide</div>'}</div></div>`+(captured?`<div class="device-bottom">${sourceButton('retake','Retake')}${sourceButton('use-capture','Use photo',true)}</div>`:`<div class="device-bottom camera-controls"><button class="camera-side" data-flow="picker" aria-label="Choose from photos">${albumIcon}</button><button class="shutter" data-flow="capture" aria-label="Take photo"></button><button class="camera-side" data-flow="flip" aria-label="Switch camera" aria-pressed="${!f.front}">${flipIcon}</button></div>`);
 }
 if(f.page==='picker'||f.page==='access-select'){
  const access=f.page==='access-select',all=sourceAssets(),albums={recents:all,favorites:[all[1],all[3],all[6]],selfies:[all[0],all[4],all[5]],weekend:[all[2],all[6]]},images=albums[f.album]||all;
  html=sourceHeader(access?'Select photos':'Photos',access?'confirm-access':'use-picked',access?'Allow':'Use photo')+`<div class="picker-toolbar"><select id="source-picker-album" aria-label="Picker album">${Object.entries({recents:'Recents',favorites:'Favorites',selfies:'Selfies',weekend:'Weekend'}).map(([id,name])=>`<option value="${id}" ${f.album===id?'selected':''}>${name}</option>`).join('')}</select></div>${access?`<p class="picker-note">${f.picked.length?f.picked.length+' selected':'Select photos to share with AI Camera.'}</p>`:''}<div class="device-body"><div class="device-grid">${images.map((src,i)=>`<button data-pick-src="${src}" aria-label="${access?'Allow':'Select'} photo ${i+1}" aria-pressed="${f.picked.includes(src)}"><img src="${src}" alt="Portrait photo"><span class="selection-dot" aria-hidden="true">${f.picked.includes(src)?'✓':''}</span></button>`).join('')}</div></div>`;
 }
 if(f.page==='settings')html=sourceHeader('App settings')+`<div class="device-body device-settings"><h2>AI Camera</h2><div class="settings-row"><label for="settings-camera">Camera</label><select id="settings-camera"><option value="denied" ${f.settingsCamera!=='granted'?'selected':''}>Off</option><option value="granted" ${f.settingsCamera==='granted'?'selected':''}>On</option></select></div><div class="settings-row"><label for="settings-photos">Photos</label><select id="settings-photos">${Object.entries({denied:'None',limited:'Selected photos',full:'All photos'}).map(([id,name])=>`<option value="${id}" ${f.settingsPhotos===id?'selected':''}>${name}</option>`).join('')}</select></div><p class="settings-note">Changes apply when you return to the app.</p></div><div class="device-bottom">${sourceButton('save-settings','Return to app',true)}</div>`;
 flowLayer.classList.toggle('photo-picker-layer',['picker','access-select'].includes(f.page));flowLayer.classList.toggle('system-permission-layer',['camera-permission','photo-permission'].includes(f.page));flowLayer.innerHTML=html;flowLayer.hidden=false;flowLayer.setAttribute('aria-labelledby','source-flow-title');document.querySelectorAll('.phone > :not(.device-flow)').forEach(el=>el.inert=true);flowLayer.querySelector('button:not(:disabled)')?.focus();
}
flowLayer.addEventListener('change',e=>{if(e.target.id==='source-picker-album'){sourceFlow.album=e.target.value;renderSourceFlow()}if(e.target.id==='settings-camera')sourceFlow.settingsCamera=e.target.value;if(e.target.id==='settings-photos')sourceFlow.settingsPhotos=e.target.value});
flowLayer.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b)return;
 const f=sourceFlow,action=b.dataset.flow;
 if(b.dataset.pickSrc){const src=b.dataset.pickSrc;f.picked=f.page==='access-select'?(f.picked.includes(src)?f.picked.filter(s=>s!==src):[...f.picked,src]):[src];renderSourceFlow();return}
 if(action==='close'){closePhotoSource();return}
 if(action==='allow-camera'){cameraAccess='granted';syncAccess();f.page='camera'}
 if(action==='deny-camera'){cameraAccess='denied';syncAccess();f.page='camera-denied'}
 if(action==='camera-settings'){f.settingsReturn='camera';f.settingsCamera=cameraAccess;f.settingsPhotos=photoAccess;f.page='settings'}
 if(action==='save-settings'){cameraAccess=f.settingsCamera;photoAccess=f.settingsPhotos;syncAccess();if(f.settingsReturn==='camera')f.page=cameraAccess==='granted'?'camera':'camera-denied';else{closePhotoSource();return}}
 if(action==='picker'){f.page='picker';f.album='recents';f.picked=[]}
 if(action==='capture')f.page='capture';
 if(action==='retake')f.page='camera';
 if(action==='flip')f.front=!f.front;
 if(action==='select-access'){f.page='access-select';f.picked=photoAccess==='limited'?[...allowedPhotos]:[]}
 if(action==='deny-photos'){photoAccess='denied';syncAccess();closePhotoSource();return}
 if(action==='allow-all'){photoAccess='full';syncAccess();closePhotoSource();return}
 if(action==='confirm-access'&&f.picked.length){allowedPhotos=[...f.picked];photoAccess='limited';syncAccess();closePhotoSource();return}
 if(action==='native-album'){document.querySelector('#album').value='';document.querySelector('#album').click();return}
 if(action==='use-capture'||action==='use-picked'){
  const src=action==='use-capture'?(f.front?'assets/portraits-v3/selfie-portrait.jpg':'assets/portraits-v3/studio-portrait.jpg'):f.picked[0];if(!src)return;closePhotoSource();await addPhoto(src,action==='use-capture'?'Camera photo':'Selected photo');return;
 }
 renderSourceFlow();
});
flowLayer.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closePhotoSource()}if(e.key==='Tab'){const controls=[...flowLayer.querySelectorAll('button:not(:disabled),select')];if(!controls.length)return;const first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
document.querySelector('#camera-access-state').addEventListener('change',e=>{cameraAccess=e.target.value;saveDeviceAccess()});
document.querySelector('#permission-state').addEventListener('change',saveDeviceAccess);

// Permission appears over the photo selection page, after navigation.
try{sessionStorage.removeItem('camera-entry-photo-access')}catch{}
syncAccess();
if(params.get('guideDemo')==='first'&&!activeTaskId&&!params.get('retryTask')){photoAccess='unknown';syncAccess();const clean=new URL(location.href);clean.searchParams.delete('guideDemo');history.replaceState(history.state,'',clean)}
if(params.get('entry')==='create'&&!activeTaskId&&!params.get('retryTask')&&photoAccess==='unknown'){openAlbumAccess()}else if(pendingTips)openPhotoGuide()

// Review control replays first entry without clearing photos or other app data.
document.querySelector('#replay-first-selection').onclick=()=>{
 if(activeTaskId||params.get('retryTask')){const url=new URL(location.href);url.searchParams.delete('task');url.searchParams.delete('retryTask');url.searchParams.set('entry','create');url.searchParams.set('guideDemo','first');location.href=url.href;return}
 if(!photoGuide.hidden)closePhotoGuide();
 pendingTips=true;photoAccess='unknown';syncAccess();openAlbumAccess();
};
