(() => {
  'use strict';
  const portrait = document.querySelector('.ink-portrait');
  const image = portrait?.querySelector('img');
  const canvas = portrait?.querySelector('canvas');
  const context = canvas?.getContext('2d');
  if (!portrait || !image || !context) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = { x: -1000, y: -1000 };
  let particles = [];
  let width = 0;
  let height = 0;
  let frame = 0;
  let inView = true;
  let entranceStart = 0;
  let pointerUntil = 0;
  let lastFrame = 0;
  let seed = 83;

  function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  function paint(now) {
    context.clearRect(0, 0, width, height);
    const settling = reducedMotion.matches ? 0 : Math.max(0, 1 - (now - entranceStart) / 4200);
    for (const particle of particles) {
      let x = particle.x + Math.sin(now * 0.0007 + particle.phase) * particle.drift * settling;
      let y = particle.y + Math.cos(now * 0.0005 + particle.phase) * particle.drift * settling;
      const distance = Math.hypot(x - pointer.x, y - pointer.y);
      if (!reducedMotion.matches && distance < 100 && distance > 0) {
        const strength = (1 - distance / 100) * 12;
        x += (x - pointer.x) / distance * strength;
        y += (y - pointer.y) / distance * strength;
      }
      context.fillStyle = 'rgba(65, 58, 76, ' + particle.alpha + ')';
      context.beginPath();
      context.ellipse(x, y, particle.radius, particle.radius * 0.7, particle.phase, 0, Math.PI * 2);
      context.fill();
    }
  }

  function animate(now) {
    frame = 0;
    if (document.hidden || !inView) return;
    if (now - lastFrame >= 30) {
      paint(now);
      lastFrame = now;
    }
    if (!reducedMotion.matches && (now < entranceStart + 4200 || now < pointerUntil)) {
      frame = requestAnimationFrame(animate);
    } else {
      paint(now);
    }
  }

  function refresh() {
    if (!frame && inView && !document.hidden) frame = requestAnimationFrame(animate);
  }

  function buildParticles() {
    if (!image.naturalWidth) return;
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    if (!width || !height) return;
    const scale = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);

    // Sample the artwork once per resize, concentrating pigment near translucent edges.
    const sample = document.createElement('canvas');
    sample.width = 180;
    sample.height = Math.round(180 * image.naturalHeight / image.naturalWidth);
    const sampleContext = sample.getContext('2d', { willReadFrequently: true });
    if (!sampleContext) return;
    sampleContext.drawImage(image, 0, 0, sample.width, sample.height);
    const pixels = sampleContext.getImageData(0, 0, sample.width, sample.height).data;
    const fit = Math.min(portrait.clientWidth / image.naturalWidth, portrait.clientHeight / image.naturalHeight);
    const imageWidth = image.naturalWidth * fit;
    const imageHeight = image.naturalHeight * fit;
    const offsetX = (width - imageWidth) / 2;
    const offsetY = (height - imageHeight) / 2;
    particles = [];
    seed = 83;
    for (let attempt = 0; attempt < 6500 && particles.length < 850; attempt++) {
      const px = Math.floor(random() * sample.width);
      const py = Math.floor(random() * sample.height);
      const alpha = pixels[(py * sample.width + px) * 4 + 3] / 255;
      if (alpha < 0.025 || alpha > 0.7) continue;
      const spread = 9 + random() * 24;
      particles.push({
        x: offsetX + px / sample.width * imageWidth + (random() - 0.5) * spread,
        y: offsetY + py / sample.height * imageHeight + (random() - 0.5) * spread,
        radius: 0.25 + random() * 0.85,
        alpha: 0.08 + random() * 0.21,
        drift: 2 + random() * 7,
        phase: random() * Math.PI * 2
      });
    }
    paint(performance.now());
    refresh();
  }

  portrait.addEventListener('pointermove', event => {
    if (reducedMotion.matches || event.pointerType === 'touch') return;
    const bounds = canvas.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;
    pointerUntil = performance.now() + 180;
    refresh();
  });
  portrait.addEventListener('pointerleave', () => {
    pointer.x = -1000;
    pointer.y = -1000;
    refresh();
  });
  reducedMotion.addEventListener('change', () => {
    cancelAnimationFrame(frame);
    frame = 0;
    paint(performance.now());
  });
  const observer = new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    if (inView) refresh();
  });
  observer.observe(portrait);
  new ResizeObserver(buildParticles).observe(portrait);
  document.addEventListener('visibilitychange', refresh);
  window.addEventListener('pagehide', () => cancelAnimationFrame(frame));
  function start() {
    entranceStart = performance.now();
    buildParticles();
  }
  image.addEventListener('load', start, { once: true });
  if (image.complete && image.naturalWidth) start();
})();

;
(() => {
  'use strict';
  const button = document.querySelector('[data-portfolio-like]');
  if (!button) return;

  const label = button.querySelector('[data-like-label]');
  const feedback = document.querySelector('[data-like-feedback]');
  const storageKey = 'lidaiyu-portfolio-liked';
  let liked = false;

  // This is a browser-local response, with no shared counter or network request.
  try { liked = localStorage.getItem(storageKey) === 'true'; } catch {}

  function render() {
    button.setAttribute('aria-pressed', String(liked));
    label.textContent = liked ? '谢谢你的喜欢！' : '喜欢这个作品集';
  }

  button.addEventListener('click', () => {
    liked = !liked;
    render();
    button.classList.toggle('is-celebrating', liked);
    feedback.textContent = liked ? '已点赞，谢谢你的喜欢！' : '已取消点赞';
    try {
      if (liked) localStorage.setItem(storageKey, 'true');
      else localStorage.removeItem(storageKey);
    } catch {
      // Keep the interaction usable when browser storage is unavailable.
    }
  });

  button.addEventListener('animationend', () => button.classList.remove('is-celebrating'));
  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    liked = event.key !== null && event.newValue === 'true';
    button.classList.remove('is-celebrating');
    render();
  });

  render();
  document.querySelector('[data-portfolio-reaction]').hidden = false;
})();

;
(() => {
  'use strict';
  const dialog = document.querySelector('#hobby-viewer');
  if (!dialog) return;
  const stage = dialog.querySelector('.hobby-viewer-stage');
  const caption = dialog.querySelector('#hobby-viewer-caption');
  const count = dialog.querySelector('#hobby-viewer-count');
  const previous = dialog.querySelector('.hobby-viewer-prev');
  const next = dialog.querySelector('.hobby-viewer-next');
  const close = dialog.querySelector('.hobby-viewer-close');
  let activeAlbum;
  let current = 0;
  let previousOverflow = '';
  const position = (index, length) => String(index + 1).padStart(2, '0') + ' / ' + String(length).padStart(2, '0');

  function show(index) {
    const buttons = activeAlbum.buttons;
    current = Math.max(0, Math.min(index, buttons.length - 1));
    const button = buttons[current];
    const media = button.querySelector('.hobby-media').cloneNode(true);
    media.querySelectorAll('img').forEach((image, index) => {
      image.loading = 'eager';
      const full = image.dataset.fullSrc || image.dataset.src;
      if (full) { window.portfolioMedia.showFull(image, full); delete image.dataset.src; }
      const original = button.querySelectorAll('img')[index];
      image.alt = window.portfolioI18n?.originalAttribute(original, 'alt') || original.alt;
    });
    stage.replaceChildren(media);
    caption.textContent = button.dataset.caption;
    count.textContent = position(current, buttons.length);
    previous.disabled = current === 0;
    next.disabled = current === buttons.length - 1;
  }

  document.querySelectorAll('.hobby-album').forEach(album => {
    const buttons = [...album.querySelectorAll('[data-hobby-image]')];
    const slides = [...album.querySelectorAll('.hobby-album-slide')];
    const thumbnails = [...album.querySelectorAll('[data-hobby-select]')];
    let selected = 0;
    function select(index) {
      selected = (index + buttons.length) % buttons.length;
      slides.forEach((slide, i) => {
        slide.classList.toggle('is-current', i === selected);
        slide.classList.toggle('is-previous', i === (selected + buttons.length - 1) % buttons.length);
        slide.classList.toggle('is-next', i === (selected + 1) % buttons.length);
        slide.setAttribute('aria-hidden', String(i !== selected));
        buttons[i].tabIndex = i === selected ? 0 : -1;
        thumbnails[i].setAttribute('aria-pressed', String(i === selected));
      });
      slides.filter(slide => slide.matches('.is-current, .is-previous, .is-next')).forEach(slide => {
        slide.querySelectorAll('[data-src]').forEach(image => window.portfolioMedia?.load(image));
      });
      album.querySelector('.hobby-album-count').textContent = position(selected, buttons.length);
      album.querySelector('.hobby-album-title').textContent = buttons[selected].dataset.title;
    }
    const controller = { buttons, select };
    album.querySelector('.hobby-album-previous').addEventListener('click', () => select(selected - 1));
    album.querySelector('.hobby-album-next').addEventListener('click', () => select(selected + 1));
    thumbnails.forEach((button, index) => button.addEventListener('click', () => select(index)));
    album.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        select(selected + (event.key === 'ArrowRight' ? 1 : -1));
        if (event.target.matches('[data-hobby-image]')) buttons[selected].focus({ preventScroll: true });
      }
    });
    buttons.forEach((button, index) => button.addEventListener('click', () => {
      activeAlbum = controller;
      dialog.setAttribute('aria-label', (window.portfolioI18n?.originalAttribute(album, 'aria-label') || album.getAttribute('aria-label')) + '大图');
      show(index);
      previousOverflow = document.body.style.overflow;
      dialog.showModal();
      document.body.style.overflow = 'hidden';
      close.focus();
    }));
  });
  previous.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    activeAlbum.select(current);
    activeAlbum.buttons[current].focus({ preventScroll: true });
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
})();

;
window.PORTFOLIO = {
  name: 'lidaiyu',
  email: 'daiyulee77@163.com',
  projects: [],
  archive: []
};

;
window.PORTFOLIO.archive = [
  {
    "id": "sky-f1",
    "group": "archive",
    "categoryGroup": "digital",
    "category": "用户研究 / C 端体验",
    "title": "围绕车手，重新连接 F1 粉丝体验",
    "shortTitle": "Sky Sports F1",
    "summary": "担任组长，带队访谈来自 4 个国家的 12 位用户，将车手资讯和粉丝交流做成互动原型。",
    "image": "assets/archive/page-02.webp",
    "status": "研究与交互原型",
    "subtitle": "Sky Sports F1 / 粉丝互动体验",
    "role": "项目组长 · 主导用户研究与交互方案",
    "time": "2025.03 – 2025.05",
    "intro": "粉丝关注的不只是比赛结果，还有车手是谁、他们如何生活，以及如何与其他粉丝分享热爱。在 Sky Sports 项目中，我带领小组探索现有移动端产品如何承载这些不同的需求。",
    "problem": "车手资讯散落在多个平台；不同粉丝对技术数据、幕后故事和互动表达有不同偏好。一个统一的信息流，很难同时回应所有人的关注点。",
    "roleText": "我担任组长，组织了覆盖 4 个国家、12 位用户的深度访谈，提炼出两类用户画像，并带队设计个性化仪表盘和粉丝社区的交互原型。项目原稿记录了访谈、亲和图、体验地图、故事版和界面迭代，展示从研究发现到设计取舍的过程。",
    "decisions": [
      [
        "扩展已有产品，保持连续性",
        "在 Sky Sports 原有应用的操作逻辑与品牌基础上扩展功能，保留用户熟悉的入口和使用方式。"
      ],
      [
        "让关注对象组织信息",
        "通过可定制仪表盘聚合关注车手、赛程和资讯，并用赛前、赛中、赛后的触点检查内容与时机。"
      ],
      [
        "让内容与表达相连",
        "将车手主页与社区讨论、投票、粉丝墙和活动关联；根据原型反馈补充赛事结果，并调整含义不明确的按钮。"
      ]
    ],
    "result": "形成用户画像、体验地图、故事版、信息架构及中高保真原型，并记录反馈后的界面调整。",
    "boundary": "展示阶段为用户研究与交互设计，不将参与度、情感联结等设计目标当作上线效果。",
    "learning": "有价值的个性化，需要先理解用户在什么时刻关注什么，再决定信息如何聚合，以及哪些互动值得被放到前面。",
    "gallery": [
      {
        "src": "assets/archive/page-02.webp",
        "label": "项目概览",
        "caption": "项目概览 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-08.webp",
        "label": "背景与设计挑战",
        "caption": "背景与设计挑战 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-13.webp",
        "label": "研究过程",
        "caption": "研究过程 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-18.webp",
        "label": "洞察与用户画像",
        "caption": "洞察与用户画像 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-23.webp",
        "label": "用户体验地图",
        "caption": "用户体验地图 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-28.webp",
        "label": "故事版",
        "caption": "故事版 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-32.webp",
        "label": "信息架构与设计系统",
        "caption": "信息架构与设计系统 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-36.webp",
        "label": "原型反馈与迭代",
        "caption": "原型反馈与迭代 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-38.webp",
        "label": "高保真交互页面",
        "caption": "高保真交互页面 · 历史作品原稿"
      }
    ]
  },
  {
    "id": "ecochamps",
    "group": "archive",
    "categoryGroup": "digital",
    "category": "硬件数据 / 行为设计",
    "title": "把能耗数据，转化为每天愿意做的小行动",
    "shortTitle": "EcoChamps",
    "summary": "围绕智能电表数据，探索小目标、即时反馈与家庭节能挑战。",
    "image": "assets/archive/page-03.webp",
    "status": "概念产品与原型",
    "subtitle": "EcoChamps / 节能生活应用",
    "role": "用户体验、服务流程与游戏化方案探索",
    "time": "2025",
    "intro": "看到用电量，不等于知道下一步怎么做。EcoChamps 是一个基于智能电表数据的概念应用，尝试把抽象数字转化为可理解的目标、反馈和日常行动。",
    "problem": "用户不容易把能耗信息转化为具体行为，也容易在缺少反馈和动力时放弃长期目标。方案需要在有限的注意力里，连接理解、行动与持续参与。",
    "roleText": "项目工作涵盖用户洞察、用户画像、服务与功能流程、游戏化机制、视觉规范和交互原型，重点探索数据如何进入家庭用户的日常任务。",
    "decisions": [
      [
        "把数据和行动放在一起",
        "以个性化仪表盘组织能耗、提醒和挑战进度，让用户在看见信息时，也能理解可采取的下一步。"
      ],
      [
        "让长期目标变成小挑战",
        "把目标拆成每日与每周任务，用进度、积分和奖励方案表达反馈，探索家庭成员共同参与的动力。"
      ],
      [
        "优先核心任务，收拢范围",
        "原型迭代中后置非核心个人简介模块，优先优化挑战反馈、排名互动和好友进度入口。"
      ]
    ],
    "result": "形成用户洞察、功能架构、故事版、设计系统和高保真页面，并记录原型迭代方向。",
    "boundary": "概念应用与原型设计；电表实时接入、奖励兑换及节能效果不作为已实现能力。原稿中的任务数值为情境示意。",
    "learning": "硬件产生的数据，只有进入用户能够理解和执行的任务，才可能变得有价值。激励机制也应服务核心行为。",
    "gallery": [
      {
        "src": "assets/archive/page-03.webp",
        "label": "项目概览",
        "caption": "项目概览 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-09.webp",
        "label": "背景与智能电表场景",
        "caption": "背景与智能电表场景 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-14.webp",
        "label": "设计问题",
        "caption": "设计问题 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-19.webp",
        "label": "洞察与画像",
        "caption": "洞察与画像 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-24.webp",
        "label": "功能与信息架构",
        "caption": "功能与信息架构 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-29.webp",
        "label": "用户故事版",
        "caption": "用户故事版 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-33.webp",
        "label": "设计系统与迭代",
        "caption": "设计系统与迭代 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-37.webp",
        "label": "能耗仪表盘",
        "caption": "能耗仪表盘 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-39.webp",
        "label": "挑战与奖励机制",
        "caption": "挑战与奖励机制 · 历史作品原稿"
      }
    ]
  },
  {
    "id": "curadent",
    "group": "archive",
    "categoryGroup": "digital",
    "category": "B 端工作流 / AI 探索",
    "title": "先理清诊所日常工作，再找到 AI 的位置",
    "shortTitle": "Curadent 诊所 CRM",
    "summary": "聚合预约、人员与运营信息，探索对话式操作如何进入业务工作流。",
    "image": "assets/archive/page-04.webp",
    "status": "产品设计与概念探索",
    "subtitle": "Curadent / 私人诊所工作台",
    "role": "业务场景、CRM 界面与扩展方案设计",
    "time": "2025",
    "intro": "小型诊所需要快速了解当日预约、人员可用时间和运营信息。Curadent 以虚拟诊所为场景，探索一个轻量工作台，以及对话式操作和 AI 能力可能出现的位置。",
    "problem": "业务信息分散会增加查看和协调成本；新增能力若脱离现有任务，也可能制造更多操作负担。需要先建立清晰的信息结构与工作流。",
    "roleText": "围绕私人诊所场景进行 CRM 界面与扩展方案探索，原稿包括虚拟品牌、设计规范、仪表盘、预约流程和对话交互。",
    "decisions": [
      [
        "围绕日常工作聚合信息",
        "将预约、患者与团队可用时间组织在首页，服务开诊前查看和周期性运营回顾。"
      ],
      [
        "让状态和动作一起出现",
        "日历展示预约状态，支持时段选择和逐步输入；以明确的确认结果收束操作，另探索对话式查询、录入与提醒。"
      ],
      [
        "把 AI 放进具体任务",
        "将 AI 与 VR 作为后续扩展，探索患者档案、影像查看和随访中的接入点，先说明服务什么任务。"
      ]
    ],
    "result": "形成品牌与设计系统、工作台、预约和对话流程，以及 AI／VR 扩展方案。",
    "boundary": "Curadent 是虚拟诊所设计项目。AI／VR 为概念扩展，未据此声称模型训练、医疗效果或临床部署。",
    "learning": "AI 产品的起点是一个值得改善的工作流。先把对象、状态和决策理清，再讨论智能能力应该如何介入。",
    "gallery": [
      {
        "src": "assets/archive/page-04.webp",
        "label": "项目概览",
        "caption": "项目概览 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-10.webp",
        "label": "诊所场景与需求",
        "caption": "诊所场景与需求 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-15.webp",
        "label": "虚拟品牌与设计系统",
        "caption": "虚拟品牌与设计系统 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-20.webp",
        "label": "工作台、预约与对话流程",
        "caption": "工作台、预约与对话流程 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-25.webp",
        "label": "AI 与 VR 扩展探索",
        "caption": "AI 与 VR 扩展探索 · 历史作品原稿"
      }
    ]
  },
  {
    "id": "vr-experiences",
    "group": "archive",
    "categoryGroup": "spatial",
    "category": "空间交互 / 体验设计",
    "title": "让沉浸式体验，回应人的感受与理解方式",
    "shortTitle": "VR 沉浸式体验",
    "summary": "两个设计探索：轻量冥想交互，以及面向儿童的消防情境学习。",
    "image": "assets/archive/page-05.webp",
    "status": "沉浸式交互原型",
    "subtitle": "VR / 冥想空间与儿童情境教育",
    "role": "场景、引导、反馈与沉浸式交互探索",
    "time": "2025",
    "intro": "同样是 VR，平静的冥想空间和儿童学习情境，需要不同的节奏与反馈。这两个项目探索声音、空间、动作和视觉提示如何共同影响体验。",
    "problem": "冥想场景需要降低主动投入的负担；儿童学习场景则需要让复杂指令变得直观。沉浸感之外，认知负担、视点和反馈强度同样需要设计。",
    "roleText": "在冥想项目中参与轻量互动设计，以投掷、光点、呼吸和摇动树枝等动作构建环境回应；消防项目原稿呈现了场景、旅程、指令、声音和表情反馈的设计探索。",
    "decisions": [
      [
        "用低负担互动进入冥想",
        "通过渐进引导和象征性动作，让行为获得柔和的环境回应，避免把冥想变成一连串高强度任务。"
      ],
      [
        "把情境学习拆成连续选择",
        "将故事、场景判断、即时反馈与复盘串联，以图形、简短提示和语音减少对长文本的依赖。"
      ],
      [
        "把身体与认知约束纳入设计",
        "考虑儿童视点高度、声音强度和佩戴体验，探索真实感与紧张程度之间的平衡。"
      ]
    ],
    "result": "形成用户流程、概念草图、故事版、旅程图、VR 场景和交互细节展示。两组原稿均保留在下方。",
    "boundary": "展示为历史设计方案与原型。原稿中的情绪及学习效果表述，不作为已验证的疗效或教育成果。",
    "learning": "空间体验的品质不只取决于画面。如何进入、何时回应、反馈有多强，都会改变用户的感受和理解。",
    "gallery": [
      {
        "src": "assets/archive/page-05.webp",
        "label": "VR 项目概览",
        "caption": "VR 项目概览 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-11.webp",
        "label": "冥想：背景与交互流程",
        "caption": "冥想：背景与交互流程 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-16.webp",
        "label": "冥想：环境与轻量互动",
        "caption": "冥想：环境与轻量互动 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-21.webp",
        "label": "消防教育：场景与挑战",
        "caption": "消防教育：场景与挑战 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-26.webp",
        "label": "消防教育：故事版与设计原则",
        "caption": "消防教育：故事版与设计原则 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-30.webp",
        "label": "消防教育：用户旅程",
        "caption": "消防教育：用户旅程 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-34.webp",
        "label": "消防教育：声音、表情与视点",
        "caption": "消防教育：声音、表情与视点 · 历史作品原稿"
      }
    ]
  },
  {
    "id": "silver-bond",
    "group": "archive",
    "categoryGroup": "digital",
    "category": "服务设计 / 代际交流",
    "title": "把养老服务，也放进家人的日常",
    "shortTitle": "Silver Bond",
    "summary": "将社区养老服务、家人参与与代际交流放在同一套服务体验中考虑。",
    "image": "assets/archive/page-22.webp",
    "status": "服务与交互设计",
    "subtitle": "Silver Bond / 养老社区服务",
    "role": "养老场景与服务体验探索",
    "time": "2025",
    "intro": "养老服务关乎事务，也关乎关系。Silver Bond 从养老与代际情感出发，探索社区服务如何连接长者的日常需要，以及家人的参与。",
    "problem": "服务供给与情感连接往往分开被讨论。方案需要同时考虑不同角色的需要，以及他们在服务过程中的接触点。",
    "roleText": "这组设计作品将养老情境、用户需求、服务过程与移动端页面放在一起，通过研究与流程表达探索跨角色的服务体验。",
    "decisions": [
      [
        "把长者与家人放进同一服务视角",
        "关注长者需求，也将后代参与和代际交流纳入服务目标，避免只以服务管理者的任务组织体验。"
      ],
      [
        "先梳理触点，再设计页面",
        "利用用户旅程组织服务阶段与机会点，再将主要任务转化为移动端界面。"
      ],
      [
        "让关系与服务相互支持",
        "在社区养老情境中探索日常服务与情感互动的连接，让产品问题同时包含效率与人的感受。"
      ]
    ],
    "result": "形成背景研究、服务与用户旅程，以及移动端界面设计原稿。",
    "boundary": "服务设计与交互探索，未声称已运营服务或实际改善养老效果。",
    "learning": "跨角色产品需要理解不同人的任务，也需要看见任务背后的关系。流程设计与情感体验可以在同一个服务中被考虑。",
    "gallery": [
      {
        "src": "assets/archive/page-22.webp",
        "label": "养老社区场景与研究",
        "caption": "养老社区场景与研究 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-27.webp",
        "label": "服务旅程与界面设计",
        "caption": "服务旅程与界面设计 · 历史作品原稿"
      }
    ]
  },
  {
    "id": "physical-explorations",
    "group": "archive",
    "categoryGroup": "spatial",
    "category": "可穿戴 / 互动装置",
    "title": "在身体、情感与技术之间，继续探索",
    "shortTitle": "可穿戴与互动装置",
    "summary": "通过推测性可穿戴系统和情感互动装置，拓展对实体产品体验的理解。",
    "image": "assets/archive/page-06.webp",
    "status": "跨领域设计探索",
    "subtitle": "Other Works / 实体与情感交互",
    "role": "产品概念与交互表达探索",
    "time": "2025 作品整理",
    "intro": "工业设计训练让我习惯从身体、环境和材料出发思考产品。这些探索把未来情境、可穿戴系统和情感表达带入交互设计。",
    "problem": "并非所有体验都发生在屏幕中。实体设备、身体动作和隐喻性的反馈，也会改变人如何理解信息与表达关系。",
    "roleText": "作品包括 I-Health 推测性可穿戴系统，以及利用 Arduino 传感器探索亲子情感表达的互动装置。以下保留原始概念、造型和场景展示。",
    "decisions": [
      [
        "用未来情境提出设计问题",
        "I-Health 以推测性设定探索身体与环境的关系，通过系统和形态设计表达概念。"
      ],
      [
        "用动作表达不容易说出的话",
        "互动装置围绕亲子关系中直接赞美的缺席，将情感主题转化为传感器输入与可感知反馈。"
      ],
      [
        "跨越界面，考虑完整体验",
        "将实体形态、操作方式、空间环境与反馈一起考虑，保持对屏幕之外体验的敏感。"
      ]
    ],
    "result": "形成可穿戴概念、形态与场景展示，以及互动装置构思和操作流程原稿。",
    "boundary": "跨领域概念与设计作品。推测性健康设定不代表真实医疗、健康监测或防护能力。",
    "learning": "实体交互提醒我：产品不是界面的总和。人的身体、环境和情感，会持续影响每一次操作。",
    "gallery": [
      {
        "src": "assets/archive/page-06.webp",
        "label": "其他作品概览",
        "caption": "其他作品概览 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-12.webp",
        "label": "I-Health：可穿戴系统概念",
        "caption": "I-Health：可穿戴系统概念 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-17.webp",
        "label": "I-Health：形态与场景设计",
        "caption": "I-Health：形态与场景设计 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-31.webp",
        "label": "情感互动装置",
        "caption": "情感互动装置 · 历史作品原稿"
      },
      {
        "src": "assets/archive/page-35.webp",
        "label": "互动装置的操作流程",
        "caption": "互动装置的操作流程 · 历史作品原稿"
      }
    ]
  }
];

;
(function(){
'use strict';
// Keep bookmarked sections working after the PalmX overview moved off the homepage.
if (document.querySelector('.selected-project')) {
  const projectAnchors = ['#responsibilities', '#hmi-surface', '#app-surface'];
  function followProjectAnchor() {
    if (projectAnchors.includes(location.hash)) {
      location.replace('palmx.html' + location.hash);
    }
  }
  followProjectAnchor();
  window.addEventListener('hashchange', followProjectAnchor);
}
const data=window.PORTFOLIO;
if(!data)return;
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=p=>'case-'+encodeURIComponent(p.id)+'.html';
const archive=document.querySelector('#archive-projects');
function renderArchive(filter){
 if(!archive)return;
 const items=data.archive.filter(p=>filter==='all'||p.categoryGroup===filter);
 archive.innerHTML=items.map(p=>'<article class="archive-card"><a href="'+link(p)+'"><div class="archive-image"><img src="'+window.portfolioMedia.preview(p.image)+'" alt="'+escapeHtml(p.shortTitle)+'作品封面" loading="lazy"></div><div class="archive-meta"><span>'+escapeHtml(p.category)+'</span><span>'+escapeHtml(p.status)+'</span></div><h3>'+escapeHtml(p.shortTitle)+'</h3><p>'+escapeHtml(p.summary)+'</p><span class="archive-link">查看项目 <span aria-hidden="true">↗</span></span></a></article>').join('');
 document.querySelector('#filter-status').textContent='显示 '+items.length+' 个作品';
}
if(!archive?.hasAttribute('data-prerendered')) renderArchive('all');
document.querySelectorAll('.filter').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.filter').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});renderArchive(button.dataset.filter);}));
const toggle=document.querySelector('.menu-toggle');
if(toggle){const menu=document.querySelector('#mobile-nav');toggle.addEventListener('click',()=>{const expanded=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',String(!expanded));toggle.setAttribute('aria-label',expanded?'打开导航':'关闭导航');menu.hidden=expanded;});menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','打开导航');}));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus();}});}
document.querySelectorAll('[data-copy-email]').forEach(button=>button.addEventListener('click',async()=>{const feedback=document.querySelector('#copy-feedback');try{if(!navigator.clipboard)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(button.dataset.copyEmail);feedback.textContent='邮箱已复制';button.textContent='已复制';setTimeout(()=>{button.textContent='复制邮箱';feedback.textContent='';},3000);}catch{feedback.textContent='请长按或选中上方邮箱复制，也可以点击邮箱发送邮件。';}}));
if(document.querySelector('.palmx-overview, .software-showcase'))initViewer([
 {src:'assets/palmx-pc-current.webp',label:'PC · 当前软件 Web 体验版'},
 {src:'assets/palmx-hmi-current.webp',label:'HMI · 当前机载屏交互原型，浏览器模拟'},
 {src:'assets/palmx-app-current.webp',label:'App · 当前源码的 Web 预览'},
 {src:'assets/palmx-design-system.webp',label:'设计系统 · PalmX Studio UI Kit 组件总览'},
 {src:'assets/palmx-icon-library.webp',label:'Icon 库 · PalmX 软件 UI 柔和线性图标'}
].concat(window.PALMX_RESEARCH_GALLERY||[], [
 {src:'assets/palmx-alarm-inventory.webp',label:'CNC 全量报警异常清单 · 触发场景、原因与处置方式'},
 {src:'assets/ai-blender-mcp.webp',label:'AI × MCP 建模 · Blender 模型与连接面板'},
 {src:'assets/ai-codex-usage-full.webp',label:'Codex 完整使用记录 · 累计 100.9 亿 Token、连续使用 32 天与活动热力图'},
 {src:'assets/ai-claude-design.webp',label:'Claude Design · 设计系统与多版方案对比'},
 {src:'assets/palmx-logo-design.webp',label:'Palm X Logo 设计 · 手掌意象与几何构造'},
 {src:'assets/palmx-prototype-test.svg',label:'样机交互测试现场 · 样机已做保密处理'}
]));
const caseContainer=document.querySelector('#case-content');
if(caseContainer){
 const all=data.projects.concat(data.archive);
 const id=caseContainer.dataset.project||new URLSearchParams(location.search).get('project');
 if(id==='palmx-fixture'){const destination=new URL('palmx.html',location.href);const language=new URLSearchParams(location.search).get('lang');if(language)destination.searchParams.set('lang',language);location.replace(destination);return;}
 const p=all.find(project=>project.id===id);
 if(!p){caseContainer.innerHTML='<section class="wrap not-found"><p class="eyebrow">作品集</p><h1>这个项目暂时找不到。</h1><p>可以回到作品列表，继续查看其他案例。</p><a class="button dark" href="index.html#work">返回所有作品</a></section>';document.title='未找到项目 — lidaiyu';return;}
 document.title=p.shortTitle+' — lidaiyu 产品作品集';
 const next=all[(all.indexOf(p)+1)%all.length];
 const gallery=p.gallery||[];
 if(caseContainer.dataset.project!==p.id) caseContainer.innerHTML=window.renderPortfolioCase(p,next,window.portfolioMedia.preview);
 initViewer(gallery);
}
function initViewer(gallery){
 const dialog=document.querySelector('#image-viewer');if(!dialog)return;
 const image=document.querySelector('#viewer-image'), caption=document.querySelector('#viewer-caption'),count=document.querySelector('#viewer-count'),prev=document.querySelector('#viewer-prev'),next=document.querySelector('#viewer-next'),zoom=document.querySelector('#viewer-zoom'),body=dialog.querySelector('.viewer-body');let current=0,opener=null;
 function update(){const item=gallery[current];window.portfolioMedia.showFull(image,item.src);image.alt=item.label;caption.textContent=item.label;count.textContent=(current+1)+' / '+gallery.length;prev.disabled=current===0;next.disabled=current===gallery.length-1;body.classList.remove('zoomed');zoom.setAttribute('aria-pressed','false');zoom.textContent='放大原图';body.scrollTop=0;body.scrollLeft=0;}
 document.querySelectorAll('[data-image-index]').forEach(button=>button.addEventListener('click',()=>{current=Number(button.dataset.imageIndex);opener=button;update();dialog.showModal();document.body.style.overflow='hidden';dialog.querySelector('.viewer-close').focus();}));
 dialog.querySelector('.viewer-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{document.body.style.overflow='';if(opener)opener.focus();});
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 prev.addEventListener('click',()=>{if(current>0){current--;update();}});next.addEventListener('click',()=>{if(current<gallery.length-1){current++;update();}});
 zoom.addEventListener('click',()=>{const expanded=body.classList.toggle('zoomed');zoom.setAttribute('aria-pressed',String(expanded));zoom.textContent=expanded?'适应窗口':'放大原图';});
 dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'&&current>0){e.preventDefault();current--;update();}if(e.key==='ArrowRight'&&current<gallery.length-1){e.preventDefault();current++;update();}});
}
})();
