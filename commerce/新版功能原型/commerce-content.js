/* Domestic commerce content placeholders; no generation service is implied. */
// Shared data replaces camera examples on the landing page, while preserving its layout.
const commerceLegacy=['golden-hour','dark-studio','city-film','soft-light','demo-profile','demo-instant','demo-studio-print','demo-photo-strip','duo-portrait','motion-portrait','city-moment','studio-glow','city-closeup'];
commerceLegacy.forEach((id,i)=>{const t=templates.find(t=>t.id===id),c=commerceItems[i%8];if(t){Object.assign(t,{title:c.title,img:c.img,sub:c.sub,commerceId:c.id});delete t.preview;}});
Object.values(previewBadges).forEach(b=>b.label=b.kind==='new'?'上新':'精选');
Object.assign(labels,{discover:'推荐',templates:'带货',videos:'灵感',create:'创作',featured:'探索',tools:'功能',events:'活动',me:'我的'});
templateTopics.photo=commerceCategories;templateTopics.video=commerceCategories;
catalogueCategories.templates='recommend';catalogueCategories.videos='recommend';
const commerceBaseCatalogue=catalogue;
function commerceTile(t){return `<article class="topic-tile commerce-tile"><button data-commerce-template="${t.id}" aria-label="查看${t.title}"><img src="${t.img}" alt="${t.sub}封面占位" loading="lazy"><span>${t.title}</span></button><small class="commerce-card-type">${t.sub}</small></article>`;}
function commerceFeed(){const key=selectedTopic(),items=commerceItems.filter(t=>key==='recommend'||t.group===key);return `<div class="theme-catalogue commerce-explore">${tab==='templates'?commerceSellingHero():''}${templateNavigation()}<div class="topic-content"><div class="topic-template-groups"><div class="topic-dual">${items.map(commerceTile).join('')}</div></div></div></div>`;}
themedCatalogue=commerceFeed;aiVideos=commerceFeed;
// The home feed keeps its existing section shapes, with commerce images and titles.
catalogue=function(media=type,homepage=false){if(!homepage)return commerceFeed();return commerceBaseCatalogue(media,true).replaceAll('The weekend edit','精选带货').replaceAll('In your own light','商品展示').replaceAll('A wider perspective','生活场景').replaceAll('Little keepsakes','细节与卖点').replaceAll('Find a new favorite','发现更多好物').replaceAll('A fresh first impression','日常好物').replaceAll('Beyond the still','剧情灵感').replaceAll('Try it','做同款').replaceAll('▷ Video','▷ 视频');};
// Navigation follows the already agreed four-entry architecture.
let commerceDiscoveryTab='discover';
productExploreTabs=function(){return `<div class="product-explore-tabs" role="tablist" aria-label="发现内容">${[['discover','推荐'],['templates','带货'],['videos','灵感']].map(([key,name])=>`<button data-product-explore="${key}" role="tab" aria-selected="${tab===key}">${name}</button>`).join('')}</div>`;};
productNav=function(){return [[commerceDiscoveryTab,'发现',navigationSvg('discover')],['me','我的',navigationSvg('me')]].map(([key,name,art])=>`<button data-tab="${key}" aria-label="${name}" ${((name==='发现'&&['discover','templates','videos'].includes(tab))||key===tab)?'aria-current="page"':''}>${art}<span>${name}</span></button>`).join('');};
productFloatingEntry.querySelector('span').textContent='创作';productFloatingEntry.setAttribute('aria-label','创作');
const commerceHeader=header;
header=function(){if(['discover','templates','videos'].includes(tab))return productExploreTabs();if(tab==='me')return '<div class="brand-heading"><h1>我的</h1></div><div class="actions"><button class="saved-entry" data-action="saved" aria-label="我的收藏">'+svg('heart')+'</button><button class="icon" data-route="settings" aria-label="设置">'+svg('settings')+'</button></div>';return commerceHeader();};
// Undecided tool functions remain neutral placeholders, with the same six positions.
productToolItems=function(){return Array.from({length:6},(_,i)=>productTask('功能待定',`<rect x="4" y="4" width="16" height="16" rx="5"/><path d="M8 12h8m-4-4v8"/>`,`data-commerce-tool="${i}"`));};
const commerceMe=()=>`<div class="me-modules"><div class="media-tabs" role="tablist"><button role="tab" aria-selected="true">我的作品</button><button data-commerce-tasks role="tab" aria-selected="false">我的任务</button></div><div class="creation-empty compact-empty"><h2>还没有带货作品</h2><p>从一个模板开始，制作你的第一条视频</p><button class="primary" data-tab="templates">去选模板</button></div></div>`;
const commerceBaseContent=content;
content=function(){if(tab==='me')return commerceMe();const state=pageStates[tab];if(state==='loading')return '<div class="state" role="status"><span class="spinner"></span><p>正在加载</p></div>';if(state==='error')return emptyView('加载失败','请检查网络后重试','重试','retry');if(state==='empty')return emptyView('暂无内容','换个分类看看','查看推荐','browse');return commerceBaseContent();};
const commerceBaseRender=render;
render=function(){if(['discover','templates','videos'].includes(tab))commerceDiscoveryTab=tab;commerceBaseRender();document.documentElement.lang='zh-CN';document.title='AI带货｜产品原型';document.querySelector('.phone').setAttribute('aria-label','带货创作原型');};
function commercePreview(item){savePosition();const origin=new URL(location.href);origin.searchParams.set('tab',tab);origin.searchParams.set('type',type);origin.searchParams.set('category',category);location.href='带货模板与制作_v0.1.html?id='+encodeURIComponent(item.id)+'&return='+encodeURIComponent(origin.href);}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-commerce-tool')){e.stopImmediatePropagation();notify('功能分类稍后确定');return;}if(b.hasAttribute('data-commerce-tasks')){e.stopImmediatePropagation();location.href='带货模板与制作_v0.1.html?stage=tasks&return='+encodeURIComponent(location.href);return;}const d=b.dataset;if(d.productStudio==='create'||d.productStudio==='edit'){e.stopImmediatePropagation();type='photo';category=d.productStudio==='edit'?'drama':'selling';go('templates');category=d.productStudio==='edit'?'drama':'selling';render();return;}let item;if(d.commerceTemplate)item=commerceItems.find(t=>t.id===d.commerceTemplate);else if(d.template||d.use){const t=templates.find(t=>t.id===(d.template||d.use));item=commerceItems.find(c=>c.id===t?.commerceId);}if(item){e.stopImmediatePropagation();commercePreview(item);return;}if(d.collection){e.stopImmediatePropagation();category='recommend';go('templates');return;}},true);

// Categories stay in one horizontal rail; the complete list is available on demand.
const commerceCategoryOffsets={};
const commerceBaseGuide=mountCreationGuide;
mountCreationGuide=function(){
 commerceBaseGuide();
 const dock=document.querySelector('.catalogue-sticky-tools');
 const hero=document.querySelector('.commerce-selling-hero');if(hero&&dock)hero.after(dock);
 const rail=dock?.querySelector('.topic-navigation');if(!rail)return;
 const wrapper=document.createElement('div');wrapper.className='commerce-category-bar';
 rail.before(wrapper);wrapper.append(rail);
 const all=document.createElement('button');all.type='button';all.className='commerce-all-categories';all.dataset.commerceAllCategories='';all.textContent='全部分类';const heading=document.createElement('span');heading.className='commerce-category-heading';heading.textContent='全部分类';wrapper.append(heading);all.setAttribute('aria-controls','commerce-categories');all.setAttribute('aria-expanded','false');wrapper.append(all);
 const railTab=tab;rail.scrollLeft=commerceCategoryOffsets[railTab]||0;
 const active=rail.querySelector('[aria-selected=true]');
 if(active){const a=active.getBoundingClientRect(),r=rail.getBoundingClientRect();if(a.left<r.left||a.right>r.right)rail.scrollLeft+=a.left-r.left-8;}
 rail.addEventListener('scroll',()=>{commerceCategoryOffsets[railTab]=rail.scrollLeft;},{passive:true});
};
function commerceCloseCategories(restoreFocus=false){
 const panel=document.querySelector('#commerce-categories');if(!panel)return;
 panel.remove();const trigger=document.querySelector('[data-commerce-all-categories]');
 trigger?.setAttribute('aria-expanded','false');if(trigger)trigger.textContent='全部分类';if(restoreFocus)trigger?.focus({preventScroll:true});
}
function commerceOpenCategories(){
 if(document.querySelector('#commerce-categories')){commerceCloseCategories(true);return;}
 const trigger=document.querySelector('[data-commerce-all-categories]');
 const d=document.createElement('div');d.id='commerce-categories';d.className='commerce-categories';d.setAttribute('role','region');d.setAttribute('aria-label','全部分类');
 d.innerHTML=`<div class="commerce-category-grid">${commerceCategories.map(([id,name])=>`<button type="button" data-commerce-category="${id}" aria-pressed="${selectedTopic()===id}">${name}</button>`).join('')}</div>`;
 trigger.closest('.commerce-category-bar').append(d);trigger.setAttribute('aria-expanded','true');trigger.textContent='收起';
 d.addEventListener('click',e=>{const b=e.target.closest('[data-commerce-category]');if(b){const next=b.dataset.commerceCategory;commerceCloseCategories(true);if(selectedTopic()!==next){savePosition();category=next;mem[tab]=topicMemory[type+':'+category]||{top:0,rails:[]};render();document.querySelector('[data-commerce-all-categories]')?.focus({preventScroll:true});}}});
}
document.addEventListener('click',e=>{if(e.target.closest('[data-commerce-all-categories]')){e.stopImmediatePropagation();commerceOpenCategories();}else if(!e.target.closest('#commerce-categories'))commerceCloseCategories();},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')commerceCloseCategories(true);});

function commerceBrowseMode(mode){type='photo';go('templates');category=mode==='edit'?'drama':'selling';render();}
