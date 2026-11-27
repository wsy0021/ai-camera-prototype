// Connect the local checkout preview to the existing prototype without reloading photo drafts.
let checkoutFrame=null;
const completedCheckoutOrders=new Set();
function startCheckout(){
  const isAndroid=/Android/i.test(navigator.userAgent);
  popup('<iframe id="checkout-frame" title="Glow Up checkout preview" src="checkout.html?embed=1&device='+(isAndroid?'android':'apple')+'" style="width:100%;height:100%;border:0;background:white"></iframe>','checkout-preview-modal');
  checkoutFrame=document.getElementById('checkout-frame');
}
window.addEventListener('message',event=>{
  if(event.origin!==location.origin||!checkoutFrame||event.source!==checkoutFrame.contentWindow||event.data?.type!=='glowup-checkout-preview')return;
  if(event.data.action==='cancel'){checkoutFrame=null;closeModal();return}
  if(event.data.action==='success'&&typeof event.data.orderId==='string'&&!completedCheckoutOrders.has(event.data.orderId)){
    completedCheckoutOrders.add(event.data.orderId);checkoutFrame=null;window.resumeAfterPurchase=false;paid();
  }
});
const checkoutStyle=document.createElement('style');checkoutStyle.textContent='dialog.checkout-preview-modal{width:min(100vw,440px);max-width:100vw;height:92dvh;max-height:92dvh;padding:0;overflow:hidden;border-radius:16px;background:white}dialog.checkout-preview-modal>.modal-close{display:none}@media(max-width:600px){dialog.checkout-preview-modal{width:100vw;height:100dvh;max-height:100dvh;border-radius:0;margin:0}}';document.head.append(checkoutStyle);
if(new URLSearchParams(location.search).get('checkoutDemo')==='success'){
  let receipt;try{receipt=JSON.parse(sessionStorage.getItem('glowup-checkout-demo-handoff')||'null');sessionStorage.removeItem('glowup-checkout-demo-handoff')}catch{}
  if(receipt?.status==='success'&&Date.now()-receipt.createdAt<300000){completedCheckoutOrders.add(receipt.id);window.resumeAfterPurchase=false;paid()}
  const url=new URL(location);url.searchParams.delete('checkoutDemo');history.replaceState(null,'',url);
}
