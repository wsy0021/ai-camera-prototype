/* Review-only controls live outside the mobile product canvas. */
(() => {
  const aside=document.querySelector('aside.review');
  const panel=document.createElement('section');panel.className='product-state-review';
  panel.innerHTML='<h2>原型状态选择</h2><p>切换状态后可直接操作。示例状态与正常记录隔离；结果均为演示素材。</p><div id="studio-state-list"></div><h3>交互模拟</h3><button id="review-sample-photo">使用示例照片</button><label>下次生成结果<select id="review-outcome"><option value="success">成功</option><option value="failed">生成失败</option><option value="needs-changes">输入需修改</option><option value="unknown">状态未知</option></select></label><label class="check"><input type="checkbox" id="review-query-failure">状态查询失败</label><button id="review-reload">重新载入当前状态</button><p id="review-state-note" role="status"></p>';
  aside.prepend(panel);
  // Replace stale architecture commentary, retaining the existing page review tools.
  [...aside.children].filter(n=>n!==panel&&n.tagName==='P'&&!n.id).forEach(n=>n.remove());
  const oldTitle=aside.querySelector(':scope>h1');if(oldTitle)oldTitle.remove();
  const groups=[['Create · 初始与素材',['start','styles-loading','styles-error','styles-empty']],['Create · 生成与结果',['waiting','result','video']],['异常与恢复',['failed','needs-changes','unknown','missing-photo','unavailable-style','expired-result']],['Edit · 页面与历史',['edit','edit-history','edit-background','edit-hairstyle','edit-filters','edit-result']]];
  let current=new URL(location.href).searchParams.get('studioState')||'start';
  function load(value){
    current=value;
    if(tab!=='create')go('create');
    if(!productFrame)return;
    const url=new URL('../workspace/index.html',location.href);url.searchParams.set('v','me-tabs-full-74');url.searchParams.set('demo',value);
    productFrame.src=url.href;
    const outer=new URL(location.href);outer.searchParams.set('studioState',value);history.replaceState(history.state,'',outer);
    document.querySelectorAll('[data-studio-state]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.studioState===value)));
  }
  function sync(){
    const doc=productFrame?.contentDocument;if(!doc?.getElementById('previewState'))return;
    const labels=new Map([...doc.getElementById('previewState').options].map(o=>[o.value,o.textContent]));
    const list=panel.querySelector('#studio-state-list');list.replaceChildren();
    groups.forEach(([title,values])=>{
      const group=document.createElement('section'),heading=document.createElement('h3'),grid=document.createElement('div');heading.textContent=title;grid.className='state-grid';group.append(heading,grid);
      values.filter(value=>labels.has(value)).forEach(value=>{const b=document.createElement('button');b.textContent=value==='start'?'正常工作区（本地记录）':labels.get(value);b.dataset.studioState=value;b.setAttribute('aria-pressed',String(value===current));b.onclick=()=>load(value);grid.append(b);});list.append(group);
    });
    panel.querySelector('#review-state-note').textContent=current==='start'?'当前：正常工作区，保留本地记录。':'当前：'+(labels.get(current)||current)+'，独立演示。';
    panel.querySelector('#review-outcome').value=doc.getElementById('nextOutcome').value;
    panel.querySelector('#review-query-failure').checked=doc.getElementById('queryFailureControl').checked;
  }
  const getDoc=()=>productFrame?.contentDocument;
  panel.querySelector('#review-sample-photo').onclick=()=>getDoc()?.getElementById('demoPhoto').click();
  panel.querySelector('#review-outcome').onchange=e=>{const c=getDoc()?.getElementById('nextOutcome');if(c){c.value=e.target.value;c.dispatchEvent(new Event('change',{bubbles:true}));}};
  panel.querySelector('#review-query-failure').onchange=e=>{const c=getDoc()?.getElementById('queryFailureControl');if(c){c.checked=e.target.checked;c.dispatchEvent(new Event('change',{bubbles:true}));}};
  panel.querySelector('#review-reload').onclick=()=>load(current);
  function attach(){if(!productFrame)return;productFrame.addEventListener('load',sync);sync();}
  if(productFrame)attach();
  else{panel.querySelector('#review-state-note').textContent='打开中间创作入口后显示全部Studio状态。';const observer=new MutationObserver(()=>{if(productFrame){attach();observer.disconnect();}});observer.observe(document.querySelector('.phone'),{childList:true,subtree:true});}
  if(current!=='start')load(current);
})();
