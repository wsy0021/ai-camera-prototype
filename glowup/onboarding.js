// Independent GlowUp preview state: never reads MuseMe's onboarding or free offer.
(() => {
  const key = 'glowup-onboarding-v1';
  const slides = [
    { title: 'Your photo. A whole new look.', lines: 'Your photo.<br>A whole new look.', description: 'One photo. Explore every version of you.', image: 'assets/compare-editorial-after.jpg', alt: 'Editorial portrait inspiration' },
    { title: 'Make every moment picture-worthy.', lines: 'Make every moment<br>picture-worthy.', description: 'Reimagine your photos for birthdays, weddings, and dream getaways.', image: 'assets/onboarding-birthday.png', alt: 'Birthday portrait with candles and a celebration cake' },
    { title: 'Two photos. One unforgettable kiss.', lines: 'Two photos.<br>One unforgettable kiss.', description: 'Add a photo of each of you.<br>Create your kiss video.', image: 'assets/compare-golden-kiss-after.jpg', alt: 'A couple sharing a romantic kiss in golden light' }
  ];
  const scenes = [
    { name: 'Golden hour', image: 'assets/compare-golden-kiss-after.jpg', inputs: ['assets/onboarding-person-1.jpg', 'assets/onboarding-person-2.jpg'], video: null },
    { name: 'Rainy night', image: 'assets/compare-rainy-kiss-after.jpg', inputs: ['assets/onboarding-rainy-person-1.jpg', 'assets/onboarding-rainy-person-2.jpg'], video: null }
  ];
  let selectedScene = 0;
  let step = 0;
  let shell;
  let sceneTimer;
  const playPortraitEntrance = () => {
    if (step !== 0 || !shell?.isConnected) return;
    shell.querySelector('.portrait-discovery')?.classList.add('is-playing');
  };
  document.addEventListener('glowup-startup-ready', playPortraitEntrance);
  const stopSceneRotation = () => { clearInterval(sceneTimer); sceneTimer = undefined; };
  const rotateScene = () => {
    if (document.hidden || step !== 2 || !shell?.isConnected) return;
    const art = shell.querySelector('.onboarding-art');
    const image = art.querySelector('img');
    if (!image) return;
    art.style.backgroundImage = `url("${scenes[selectedScene].image}")`;
    selectedScene = (selectedScene + 1) % scenes.length;
    const scene = scenes[selectedScene];
    image.src = scene.image;
    image.alt = scene.name + ' kiss scene reference';
    shell.querySelectorAll('.kiss-inputs img').forEach((input, i) => { input.src = scene.inputs[i]; });
    document.body.style.setProperty('--intro-backdrop', `url("${scene.image}")`);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      image.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350, easing: 'ease-in-out' });
    }
  };
  const readSeen = () => { try { return localStorage.getItem(key) === 'done'; } catch { return false; } };
  const render = () => {
    stopSceneRotation();
    const slide = slides[step];
    shell.dataset.step = String(step);
    document.body.style.setProperty('--intro-backdrop', `url("${step === 2 ? scenes[selectedScene].image : slide.image}")`);
    const scene = scenes[selectedScene];
    const kissProcess = `<div class="kiss-inputs" aria-label="Two individual photos used for the kiss scene"><figure><img src="${scene.inputs[0]}" alt="First person’s input photo"></figure><figure><img src="${scene.inputs[1]}" alt="Second person’s input photo"></figure></div>`;
    const media = step === 2 ? scene : slide;
    const collections = [
      [
        { image: 'assets/onboarding-soft-portrait.jpg', label: 'Fashion', alt: 'Fashion portrait in a black outfit' },
        { image: 'assets/onboarding-studio-portrait.jpg', label: 'Studio', alt: 'Portrait with blue and violet studio lighting' },
        { image: 'assets/onboarding-warm-portrait.jpg', label: 'Golden hour', alt: 'Warm outdoor portrait in golden light' },
        { image: 'assets/compare-editorial-after.jpg', label: 'Editorial', alt: 'Editorial portrait inspiration' }
      ],
      [
        { image: 'assets/onboarding-birthday.png', label: 'Birthday', alt: 'Birthday portrait with a cake and candlelight' },
        { image: 'assets/compare-wedding-after.jpg', label: 'Wedding', alt: 'A couple celebrating their wedding in a garden' },
        { image: 'assets/compare-summer-after.jpg', label: 'Getaway', alt: 'A sunlit vacation portrait by the sea' }
      ]
    ];
    const styleCard = (item, duplicate = false) => `<figure><img src="${item.image}" alt="${duplicate ? '' : item.alt}"><figcaption>${item.label}</figcaption></figure>`;
    const styleColumns = [
      [collections[0][3], collections[0][0]],
      [collections[0][1], collections[0][2]]
    ];
    const collage = step === 0 ? `<div class="portrait-discovery"><div class="portrait-opening" aria-hidden="true"><img src="assets/compare-editorial-after.jpg" alt=""></div><figure class="source-portrait"><img src="assets/compare-editorial-before.jpg" alt="Original portrait"></figure><div id="intro-looks" class="intro-gallery styles-gallery" aria-label="Portrait styles to explore">${styleColumns.map((items, column) => `<div class="style-column style-column-${column}"><div class="style-track"><div class="style-loop">${items.map(item => styleCard(item)).join('')}</div><div class="style-loop" aria-hidden="true">${items.map(item => styleCard(item, true)).join('')}</div></div></div>`).join('')}</div></div>` : step === 1 ? `<div class="intro-gallery moments-gallery" aria-label="Birthday, wedding and vacation scene inspiration">${collections[1].map(item => `<figure><img src="${item.image}" alt="${item.alt}"><figcaption>${item.label}</figcaption></figure>`).join('')}</div>` : '';
    shell.innerHTML = `<figure class="onboarding-art">${step === 2 && scene.video ? `<video src="${scene.video}" poster="${scene.image}" autoplay muted loop playsinline controls aria-label="${scene.name} kiss video"></video>` : `<img src="${media.image}" alt="${step === 2 ? scene.name + ' kiss scene reference' : slide.alt}">`}</figure><div class="onboarding-top">${step ? '<button type="button" class="onboarding-back" aria-label="Previous introduction">‹</button>' : ''}<span class="onboarding-brand">GlowUp</span></div>${collage}<div class="onboarding-copy">${step === 2 ? kissProcess : ''}<h1 id="onboarding-title" tabindex="-1" aria-label="${slide.title}">${slide.lines}</h1><p>${slide.description}</p><button class="onboarding-next" type="button">${step === slides.length - 1 ? 'Get started' : 'Continue'}</button><div class="onboarding-dots" role="img" aria-label="Step ${step + 1} of ${slides.length}">${slides.map((_, i) => `<i class="${i === step ? 'active' : ''}"></i>`).join('')}</div></div>`;
    shell.querySelector('.onboarding-back')?.addEventListener('click', () => { step--; render(); });
    shell.querySelector('.onboarding-next').addEventListener('click', () => {
      if (step < slides.length - 1) { step++; render(); return; }
      try { localStorage.setItem(key, 'done'); } catch { /* Preview still works without storage. */ }
      stopSceneRotation();
        shell.remove();
      document.body.classList.remove('onboarding-active');
      filter = 'Couples';
      browse();
      window.scrollTo(0, 0);
      showPlans(false);
    });
    shell.querySelector('h1').focus({ preventScroll: true });
    window.scrollTo(0, 0);
    if (!document.body.classList.contains('startup-active')) playPortraitEntrance();
    if (step === 2) sceneTimer = setInterval(rotateScene, 1300);
  };
  window.startGlowUpOnboarding = () => {
    if (modal.open) closeModal();
    if (templateDetail.open) templateDetail.close();
    closeAccount();
    document.getElementById('glowup-onboarding')?.remove();
    const entry = new URLSearchParams(location.search).get('onboardingStep');
    step = entry === 'birthday' ? 1 : entry === 'scenes' || entry === 'kiss' ? 2 : 0;
    shell = document.createElement('section');
    shell.id = 'glowup-onboarding';
    shell.className = 'onboarding-shell';
    shell.setAttribute('aria-labelledby', 'onboarding-title');
    document.body.classList.add('onboarding-active');
    document.body.insertBefore(shell, document.body.firstChild);
    render();
  };
  const review = document.querySelector('body > details');
  const replay = document.createElement('button');
  replay.type = 'button';
  replay.className = 'onboarding-replay';
  replay.textContent = '重新体验新人流程';
  replay.onclick = window.startGlowUpOnboarding;
  review.append(replay);
  const replayEntrance = document.createElement('button');
  replayEntrance.type = 'button';
  replayEntrance.className = 'onboarding-replay';
  replayEntrance.textContent = '重播首屏大片展开';
  replayEntrance.onclick = () => { step = 0; render(); };
  review.append(replayEntrance);
  const note = document.createElement('p');
  note.textContent = '新人流程：自动原图展开个人风格 → 特别时刻 → Kiss输入输出与场景切换 → 当前订阅页；关闭或购买完成后可浏览双人模板。第一屏以成片拉近开场，约2秒内收进主列，两侧造型带透视展开，接入9／10秒错向循环；原图以右下圆框辅助说明，不放大原图；当前使用既有不同人物风格图演示交互，同一人多造型素材待补，不代表当前照片已生成这些造型。Kiss A方案展示全屏成片上叠加两张输入照片的对应关系；人物小图仅作示意，不是实际上传控件。Kiss页每1.3秒自动切换日落／雨夜封面与对应输入示例；不显示场景按钮；对应真实Kiss视频待补充，暂不演示靠近到亲吻动作。新人页均为静态参考图，未接入真实视频。完成状态仅保存在本浏览器，不继承 MuseMe 免费体验规则。';
  review.append(note);
  ['assets/compare-editorial-before.jpg', 'assets/onboarding-soft-portrait.jpg', 'assets/onboarding-studio-portrait.jpg', 'assets/onboarding-warm-portrait.jpg', ...slides.map(slide => slide.image), ...scenes.flatMap(scene => [scene.image, ...scene.inputs])].forEach(source => { const image = new Image(); image.src = source; });
  const query = new URLSearchParams(location.search);
  if (query.get('onboarding') === '1' || (!readSeen() && query.get('onboarding') !== '0' && !query.has('preview'))) window.startGlowUpOnboarding();
})();
