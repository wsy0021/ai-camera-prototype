/* Uses the existing single-photo picker and cropper, without submitting a task. */
if(params.get('moodPick')&&parent!==window){
 document.body.classList.add('mood-pick-mode');
 const modeStyle=document.createElement('style');modeStyle.textContent='body{background:#202123}main{padding:0!important;display:block!important}.phone{width:100%!important;max-width:none!important;height:100dvh!important;border:0!important;border-radius:0!important}aside{display:none!important}';document.head.append(modeStyle);
 $('#back').setAttribute('aria-label','Cancel photo selection');
 const key=params.get('moodPick');
 const finish=(type,blob)=>parent.postMessage({type,key,blob},location.origin);
 document.addEventListener('click',async e=>{
  const button=e.target.closest('button');if(!button)return;
  if(button.id==='back'){e.preventDefault();e.stopImmediatePropagation();finish('museme-photo-cancel');return}
  if(button.id!=='generate')return;
  e.preventDefault();e.stopImmediatePropagation();
  if(!slots[0]||busy||addingPhoto||choosing)return;
  busy=true;updateCheckButton();
  try{const blob=await cropBlob(slots[0]);if(!await CameraEditorRecovery.save(key,slots,0))throw Error();finish('museme-photo-confirm',blob)}catch{message='Couldn’t prepare this photo. Please try again.';busy=false;render()}
 },true);
 const label=()=>{const text=busy?'Preparing photo…':slots[0]&&!choosing?'Use photo':'Choose a photo';if($('#generate').textContent!==text)$('#generate').textContent=text};
 new MutationObserver(label).observe($('#generate'),{childList:true});label();
}
