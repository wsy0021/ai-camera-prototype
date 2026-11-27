/* Uses the existing single-photo picker and cropper, without submitting a task. */
if(params.get('editPick')==='background'&&parent!==window){
 const key=params.get('moodPick');
 const css=document.createElement('style');css.textContent='body{background:#111112}main{padding:0!important;display:block!important}.phone{width:100%!important;max-width:none!important;height:100dvh!important;border:0!important;border-radius:0!important;background:#111112}aside,.footer{display:none!important}#content{flex:1;min-height:0;padding-bottom:20px!important}';document.head.append(css);
 addPhoto=async function(src,name,objectUrl=''){
   if(addingPhoto)return;addingPhoto=true;message='';
   try{
     const response=await fetch(src);if(!response.ok)throw Error();const blob=await response.blob();
     if(!blob.type.startsWith('image/')||!blob.size)throw Error();
     const image=new Image();image.src=src;await image.decode();
     parent.postMessage({type:'museme-photo-confirm',key,blob,name},location.origin);
   }catch{addingPhoto=false;message='Couldn’t open this photo. Choose another.';render();}
   finally{if(objectUrl)URL.revokeObjectURL(objectUrl);}
 };
 document.addEventListener('click',e=>{if(e.target.closest('#back')){e.preventDefault();e.stopImmediatePropagation();parent.postMessage({type:'museme-photo-cancel',key},location.origin);}},true);
 $('#back').setAttribute('aria-label','Back to Home');
 if(typeof closePhotoGuide==='function'&&!photoGuide.hidden)closePhotoGuide();
}
else if(params.get('moodPick')&&parent!==window){
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
 const label=()=>{const text=busy?'Preparing photo…':slots[0]&&!choosing?(params.get('editPick')==='background'?'Continue editing':'Use photo'):'Choose a photo';if($('#generate').textContent!==text)$('#generate').textContent=text};
 new MutationObserver(label).observe($('#generate'),{childList:true});label();
}
