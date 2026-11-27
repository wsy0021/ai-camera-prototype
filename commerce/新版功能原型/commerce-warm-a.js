// Enable the product theme only on the two reviewed pages. Styles are loaded in the head.
(() => {
 const phone=document.querySelector('.phone');
 const sheets=['commerce-warm-style','commerce-system-style'].map(id=>document.getElementById(id)).filter(Boolean);
 function update(){const media=['create','me'].includes(phone?.dataset.productPage)?'all':'not all';for(const sheet of sheets)sheet.media=media;}
 if(phone)new MutationObserver(update).observe(phone,{attributes:true,attributeFilter:['data-product-page']});
 update();
})();
