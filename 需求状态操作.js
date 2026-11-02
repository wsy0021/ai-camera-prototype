/* Presentation controls mirror the loaded page; original handlers own all state. */
(function(global){
 'use strict';
 function connect(frame,panel){
  let dispose=()=>{};
  function attach(){
   dispose();panel.replaceChildren();
   try{
    const win=frame.contentWindow,doc=frame.contentDocument;
    if(!doc?.body)return;
    void win.location.href;
    const style=doc.createElement('style');
    style.textContent='body{margin:0!important}main{display:block!important;padding:0!important;max-width:none!important}main>aside{display:none!important}main>.phone{width:390px!important;max-width:100%!important;height:100dvh!important;min-height:0!important;margin:0 auto!important;border:0!important;border-radius:0!important}';
    doc.head.append(style);
    let bindings=[],stopped=false,rendered=false;
    function sync(){
     if(stopped)return;
     const originals=[...doc.querySelectorAll('main>aside select,main>aside input,main>aside button')];
     if(!rendered||originals.length!==bindings.length||originals.some((el,i)=>el!==bindings[i].original)){
      panel.replaceChildren();rendered=true;
      bindings=originals.map(original=>{
       const row=panel.ownerDocument.createElement(original.tagName==='BUTTON'?'div':'label');row.className='prototype-control';
       const proxy=original.cloneNode(true);proxy.removeAttribute('id');proxy.removeAttribute('onclick');proxy.removeAttribute('onchange');
       const label=original.labels?.[0];
       if(original.tagName==='SELECT'){
        const title=panel.ownerDocument.createElement('span');
        title.textContent=label?label.textContent.replace(original.textContent,'').trim():original.getAttribute('aria-label')||'状态';
        proxy.setAttribute('aria-label',title.textContent);row.append(title,proxy);
       }else if(original.tagName==='INPUT'){
        row.append(proxy,panel.ownerDocument.createTextNode(label?.textContent.trim()||original.getAttribute('aria-label')||'选项'));
       }else{proxy.setAttribute('aria-label',original.textContent.trim());row.append(proxy);}
       if(original.tagName==='BUTTON'){proxy.addEventListener('click',()=>{original.click();sync()})}
       else proxy.addEventListener('change',()=>{
        if(original.type==='checkbox'||original.type==='radio')original.checked=proxy.checked;
        else original.value=proxy.value;
        original.dispatchEvent(new win.Event('input',{bubbles:true}));
        original.dispatchEvent(new win.Event('change',{bubbles:true}));sync();
       });
       panel.append(row);return {original,proxy,row};
      });
      if(!bindings.length){const empty=panel.ownerDocument.createElement('p');empty.textContent='当前页面没有状态切换项。';panel.append(empty)}
     }
     for(const {original,proxy,row} of bindings){
      row.hidden=!!original.closest('[hidden]')||original.hidden;
      proxy.disabled=original.disabled;
      if(original.tagName==='SELECT'){if(proxy.innerHTML!==original.innerHTML)proxy.innerHTML=original.innerHTML;proxy.value=original.value;}
      else if(original.tagName==='INPUT'){proxy.value=original.value;proxy.checked=original.checked}
      else proxy.textContent=original.textContent;
     }
    }
    const observer=new global.MutationObserver(sync);
    observer.observe(doc.body,{subtree:true,childList:true,attributes:true,characterData:true});
    doc.addEventListener('change',sync,true);
    dispose=()=>{stopped=true;observer.disconnect();doc.removeEventListener('change',sync,true);style.remove()};
    sync();
   }catch{panel.textContent='此页面无法读取状态操作。'}
  }
  frame.addEventListener('load',attach);
  return ()=>{dispose();frame.removeEventListener('load',attach);panel.replaceChildren()};
 }
 global.CameraRequirementsControls={connect};
})(window);
