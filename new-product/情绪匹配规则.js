/* Prototype candidates only. Production taxonomy and media scope are not configured. */
window.CameraMoodRules=(()=>{
 const options=[['☾','Slow down'],['↗','Feel bold'],['✧','Celebrate me'],['≈','Let’s get playful'],['♡','Feel nostalgic'],['✦','Surprise me']];
 const pools=[['golden-hour','city-film'],['dark-studio','city-film'],['golden-hour','dark-studio'],['city-film','golden-hour'],['city-film','dark-studio']];
 function pick(ids,previous,random=Math.random){let available=[...new Set(ids)].filter(id=>Object.hasOwn(CameraPhotoTasks.styles,id));if(available.length>1)available=available.filter(id=>id!==previous);return available.length?available[Math.floor(random()*available.length)]:null}
 function candidates(index){return index===5?[...new Set(pools.flat())]:pools[index]||[]}
 return {options,pools,pick,candidates};
})();
