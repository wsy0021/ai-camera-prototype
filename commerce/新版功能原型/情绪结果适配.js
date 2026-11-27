/* Mood uses the common success layout; ordinary template results are untouched. */
if(t?.mood&&t.status==='completed'){
 document.querySelector('aside p:nth-of-type(3)').textContent='情绪探索结果：Explore again保留心情、照片与裁剪，重新匹配后发起独立任务；Continue exploring回Discover。从Me查看时，顶部返回任务列表。';
 const moodExplore=()=>location.href=CameraCreationFlow.browseURL({...t,backgroundReturn:new URL('首页功能探索_v0.1.html?tab=discover',location.href).href});
 $('#details').onclick=moodExplore;$('#explore').onclick=moodExplore;if(!historical)$('#back').onclick=moodExplore;
 $('#remake').textContent='Explore again';$('#remake').onclick=()=>location.href='情绪盲盒页_v0.1.html?again='+encodeURIComponent(t.id);
}
