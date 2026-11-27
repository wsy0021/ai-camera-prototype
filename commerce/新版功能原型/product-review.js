/* Review tools remain outside the product canvas. */
(() => {
const aside=document.querySelector('aside.review');if(!aside)return;
const panel=document.createElement('section');panel.className='product-state-review';panel.innerHTML='<h2>带货创作原型</h2><p>创作页：四个功能入口：视频卖货、剧情带货、AI写真、AI照片编辑。带货接共享制作任务；照片侧展示方案与本地固定滤镜。当前为本地流程演示，未接入真实AI。</p><button id="commerce-review-create">打开创作助手</button><p>历史对话和草稿仅保存在当前浏览器；发送需求不会直接创建视频任务。</p>';
aside.prepend(panel);[...aside.children].filter(n=>n!==panel&&n.tagName==='P'&&!n.id).forEach(n=>n.remove());aside.querySelector(':scope>h1')?.remove();panel.querySelector('button').onclick=()=>go('create');
})();
