// Timing is for prototype playback; production should follow application readiness.
(() => {
  const screen = document.getElementById('glowup-startup');
  let holdTimer, exitTimer;
  let blocked = [];
  const release = () => {
    screen.hidden = true;
    screen.classList.remove('is-leaving');
    document.body.classList.remove('startup-active');
    blocked.forEach(element => { element.inert = false; });
    blocked = [];
    document.querySelector('#onboarding-title')?.focus({ preventScroll: true });
    document.dispatchEvent(new Event('glowup-startup-ready'));
  };
  const leave = () => {
    screen.classList.add('is-leaving');
    exitTimer = setTimeout(release, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 240);
  };
  window.startGlowUpSplash = ({ hold = false } = {}) => {
    clearTimeout(holdTimer);
    clearTimeout(exitTimer);
    blocked.forEach(element => { element.inert = false; });
    blocked = [...document.body.children].filter(element => element !== screen && !element.inert && !['SCRIPT', 'STYLE', 'LINK', 'DETAILS'].includes(element.tagName));
    blocked.forEach(element => { element.inert = true; });
    screen.hidden = false;
    screen.classList.remove('is-leaving');
    document.body.classList.add('startup-active');
    // Replay the same brief fade without moving the wordmark.
    const wordmark = screen.querySelector('.startup-wordmark');
    wordmark.getAnimations().forEach(animation => animation.cancel());
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      wordmark.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 650, easing: 'ease-out' });
    }
    if (!hold) holdTimer = setTimeout(leave, 1200);
  };
  const review = document.querySelector('body > details');
  const replay = document.createElement('button');
  replay.type = 'button';
  replay.className = 'onboarding-replay';
  replay.textContent = '播放启动页';
  replay.onclick = () => window.startGlowUpSplash();
  review?.append(replay);
  window.startGlowUpSplash({ hold: new URLSearchParams(location.search).get('splash') === 'hold' });
})();
