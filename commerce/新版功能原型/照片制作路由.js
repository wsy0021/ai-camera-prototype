/* Compatibility for old photo preparation/result links inside the new product. */
(()=>{
 const p=new URLSearchParams(location.search);
 if(p.has('editPick')||p.has('moodPick')||p.has('requirementsDemo'))return;
 let task;
 try{task=JSON.parse(localStorage.getItem('camera-photo-tasks-preview-v1')||'[]').find(t=>t.id===(p.get('task')||p.get('retryTask')))}catch{}
 if(task?.mood||task?.mediaType==='video')return;
 const style=task?.styleId||p.get('style')||'golden-hour';
 if(['motion-portrait','studio-glow','city-closeup','city-moment'].includes(style))return;
 if(!['golden-hour','dark-studio','city-film','duo-portrait'].includes(style)&&!/^((retro|hair|transform)-)/.test(style))return;
 const dest=new URL('制作页面_并排配对_v0.1.html',location.href);
 dest.search=p;dest.searchParams.set('style',style);dest.searchParams.set('flow','product');
 location.replace(dest.href);
})();
