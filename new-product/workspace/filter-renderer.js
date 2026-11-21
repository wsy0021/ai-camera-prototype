/* Deterministic, versioned presets. Preview and export use the same pixel recipe. */
(() => {
  'use strict';
  const version='fixed-v1';
  const recipes={
    warm:(r,g,b)=>[r*1.04+12,g*.97+7,b*.88+4],
    mono:(r,g,b)=>{const y=.2126*r+.7152*g+.0722*b;return [y*.92+10,y*.92+10,y*.92+10];},
    faded:(r,g,b)=>{const y=.2126*r+.7152*g+.0722*b;return [(.78*r+.22*y)*.83+28,(.78*g+.22*y)*.83+28,(.78*b+.22*y)*.83+30];}
  };
  async function render(photo,preset,intensity,maxEdge=2048){
    if(!recipes[preset]||!photo?.url||photo.unavailable)throw Error('Choose a photo and a filter.');
    const pic=new Image();pic.src=photo.url;await pic.decode();
    if(!pic.naturalWidth||!pic.naturalHeight)throw Error('This photo couldn’t be opened.');
    const scale=Math.min(1,maxEdge/Math.max(pic.naturalWidth,pic.naturalHeight));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(pic.naturalWidth*scale));canvas.height=Math.max(1,Math.round(pic.naturalHeight*scale));
    const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('Filters are unavailable in this browser.');
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(pic,0,0,canvas.width,canvas.height);
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),data=pixels.data,amount=Math.max(0,Math.min(100,Number(intensity)))/100;
    for(let i=0;i<data.length;i+=4){const adjusted=recipes[preset](data[i],data[i+1],data[i+2]);for(let c=0;c<3;c++)data[i+c]=Math.round(data[i+c]+amount*(adjusted[c]-data[i+c]));}
    ctx.putImageData(pixels,0,0);
    return {url:canvas.toDataURL('image/jpeg',.94),width:canvas.width,height:canvas.height,version,preset,intensity:Number(intensity),actual:true};
  }
  window.AgentFilters={render,version};
})();
