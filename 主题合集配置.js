window.CameraCollections={
 'weekend-edit':{title:'The weekend edit',copy:'A fresh perspective on your everyday.',items:['golden-hour','dark-studio','city-film','soft-light','demo-instant','demo-photo-strip']},
 'studio':{title:'Your studio moment',copy:'Find your own light.',items:['dark-studio','golden-hour','soft-light']},
 'portrait-edit':{title:'In your own light',copy:'Portraits with a point of view.',items:['dark-studio','soft-light','golden-hour','city-film']},
 'motion':{title:'Beyond the still',copy:'Make your next moment move.',items:['motion-portrait','studio-glow','city-moment','city-closeup']},
 'printed':{title:'Little keepsakes',copy:'Small moments, made to keep.',items:['demo-photo-strip','demo-instant','demo-studio-print']},
 'profile':{title:'A fresh first impression',copy:'A new look for your profile.',items:['demo-profile','dark-studio','golden-hour']},
 'quick-picks':{title:'Find a new favorite',copy:'A few different ways to see yourself.',items:['golden-hour','dark-studio','city-film','soft-light','demo-profile','demo-instant']}
};

// Catalogue presentation is explicit, never inferred from a tile's list index.
// Context overrides mirror the existing first-level theme categories.
window.CameraCollectionPresentation={
 types:{portrait:{columns:2,ratio:'3/4'},large:{columns:1,ratio:'3/4'},wide:{columns:1,ratio:'4/3'},avatar:{columns:3,ratio:'1/1'},video:{columns:2,ratio:'9/16'},product:{columns:2,ratio:null},'product-wide':{columns:1,ratio:null}},
 defaults:{'city-film':'wide','demo-profile':'avatar','demo-photo-strip':'product','demo-instant':'product','demo-studio-print':'product'},
 overrides:{'portrait-edit':{'golden-hour':'large','city-film':'portrait'},profile:{'dark-studio':'avatar','golden-hour':'avatar'},printed:{'demo-photo-strip':'product-wide'}},
 type(collection,id,item){return this.overrides[collection]?.[id]||(item.mediaType==='video'?'video':this.defaults[id]||'portrait')},
 groups(collection,ids,lookup){const groups=[];for(const id of ids){const item=lookup(id);if(!item)continue;const type=this.type(collection,id,item);let group=groups[groups.length-1];if(!group||group.type!==type){group={type,columns:this.types[type].columns,items:[]};groups.push(group)}group.items.push({id,item})}return groups}
};
