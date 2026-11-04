/* Mood uses the common success layout; ordinary template results are untouched. */
if(t?.mood&&t.status==='completed'){
 document.querySelector('aside p:nth-of-type(3)').textContent='情绪探索结果：Explore again保留心情、照片与裁剪，重新匹配后发起独立任务；Continue exploring回Discover。从Me查看时，顶部返回任务列表。反馈自愿填写，点击即记录。';
 const moodExplore=()=>location.href=CameraCreationFlow.browseURL({...t,backgroundReturn:new URL('1.0.0一级页面框架_v0.4.html?tab=discover',location.href).href});
 $('#details').onclick=moodExplore;$('#explore').onclick=moodExplore;if(!historical)$('#back').onclick=moodExplore;
 $('#remake').textContent='Explore again';$('#remake').onclick=()=>location.href='情绪盲盒页_v0.1.html?again='+encodeURIComponent(t.id);
 const panel=document.createElement('section');panel.className='mood-result-feedback';panel.setAttribute('aria-label','Result feedback');panel.innerHTML='<p>Do you like this result?</p><div><button aria-label="Like this result" aria-pressed="false" data-mood-feedback="like">👍</button><button aria-label="Dislike this result" aria-pressed="false" data-mood-feedback="dislike">👎</button></div>';
 document.querySelector('.success-caption').append(panel);
 const css=document.createElement('style');css.textContent='.mood-result-feedback{display:flex;align-items:center;justify-content:space-between;margin-top:12px;gap:8px}.mood-result-feedback p{font-size:12px;margin:0}.mood-result-feedback>div{display:flex;gap:6px}.mood-result-feedback button{border:1px solid #ffffff20;border-radius:22px;min-width:44px;font-size:18px}.mood-result-feedback button[aria-pressed=true]{background:#c9aae830;border-color:#c9aae8}.mood-result-feedback button:disabled{cursor:default;opacity:1}';document.head.append(css);
 let answered=false;panel.onclick=e=>{const b=e.target.closest('[data-mood-feedback]');if(!b||answered)return;try{CameraPhotoTasks.update(t.id,{moodFeedback:b.dataset.moodFeedback});answered=true;b.setAttribute('aria-pressed','true');panel.querySelectorAll('button').forEach(el=>el.disabled=true)}catch{/* Feedback never blocks saving or leaving. */}};
 // No selection restoration on revisit. A task that already has feedback accepts no second answer.
 if(t.moodFeedback){answered=true;panel.querySelectorAll('button').forEach(b=>b.disabled=true)}
}
