(() => {
const $=s=>document.querySelector(s),mobile=$('#mobile'),code=$('#code'),agree=$('#agree'),submit=$('#submit'),send=$('#send');let sent=false,until=0,policyTrigger=null;
function error(text){$('#error').textContent=text}
function validate(){submit.disabled=!( /^1[3-9]\d{9}$/.test(mobile.value)&&/^\d{6}$/.test(code.value)&&agree.checked)}
function back(){let url;try{url=new URL(new URLSearchParams(location.search).get('return'));if(url.origin!==location.origin||!decodeURI(url.pathname).endsWith('/首页功能探索_v0.1.html'))url=null}catch{}location.href=url?.href||'首页功能探索_v0.1.html?tab=me'}
$('.back').onclick=back;
mobile.addEventListener('input',()=>{mobile.value=mobile.value.replace(/\D/g,'');sent=false;code.value='';until=0;send.disabled=false;send.textContent='获取验证码';error('');validate()});
code.addEventListener('input',()=>{code.value=code.value.replace(/\D/g,'');error('');validate()});agree.onchange=validate;
send.onclick=()=>{if(!/^1[3-9]\d{9}$/.test(mobile.value)){error('请输入正确的11位手机号');mobile.focus();return}if(mobile.value!=='13800000000'){error('当前为原型演示，请使用评审区的演示手机号');return}sent=true;until=Date.now()+60000;send.disabled=true;send.textContent='60秒后重试';$('#review-notice').textContent='演示验证码已准备：123456（未发送短信）';error('');code.focus()};
setInterval(()=>{if(!until)return;const remain=Math.ceil((until-Date.now())/1000);send.disabled=remain>0;send.textContent=remain>0?`${remain}秒后重试`:'重新获取';if(remain<=0)until=0},1000);
$('#login').onsubmit=e=>{e.preventDefault();if(!agree.checked){error('请先阅读并同意协议');return}if(!sent){error('请先获取验证码');return}if(mobile.value!=='13800000000'||code.value!=='123456'){error('验证码不正确，请重新输入');return}try{sessionStorage.setItem('commerce-login-demo','signed');back()}catch{error('暂时无法保存登录状态，请重试')}};
$('#fill').onclick=()=>{mobile.value='13800000000';code.value='123456';sent=true;validate();error('');$('#review-notice').textContent='已填入演示信息，请手动勾选协议后体验登录。'};
document.querySelectorAll('[data-policy]').forEach(b=>b.onclick=e=>{e.preventDefault();policyTrigger=b;$('#policy-title').textContent=b.dataset.policy;$('#policy').hidden=false;$('#close-policy').focus()});
function close(){if($('#policy').hidden)return;$('#policy').hidden=true;policyTrigger?.focus()}
$('#close-policy').onclick=close;$('#policy').onclick=e=>{if(e.target===$('#policy'))close()};document.addEventListener('keydown',e=>{if($('#policy').hidden)return;if(e.key==='Escape')close();if(e.key==='Tab'){e.preventDefault();$('#close-policy').focus()}});
})();
