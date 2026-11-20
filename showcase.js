(function () {
  'use strict';
  const root = document.querySelector('[data-terminal-showcase]');
  const data = window.PALMX_SHOWCASE;
  if (!root || !data) return;
  const keys = ['pc', 'hmi', 'app'];
  const selected = {pc: 0, hmi: 0, app: 0};
  let selectedMobile = 0;
  const tabs = Array.from(root.querySelectorAll('[role="tab"]'));
  const panels = root.querySelector('[data-showcase-panels]');
  const dialog = document.querySelector('.showcase-viewer');
  const viewerBody = dialog.querySelector('.showcase-viewer-body');
  const viewerImage = dialog.querySelector('[data-showcase-full]');
  const zoom = dialog.querySelector('[data-showcase-zoom]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let motionPlaying = !reducedMotion.matches;
  const viewerMotion = document.createElement('button');
  viewerMotion.type = 'button';
  viewerMotion.dataset.motionToggle = '';
  viewerMotion.hidden = true;
  zoom.before(viewerMotion);
  let terminal = 'pc', opener = null, savedOverflow = '', wheelTotal = 0, lastWheel = 0;
  let pointerStart = null, wheelEventAt = 0, ignoreClickUntil = 0;
  const escape = text => String(text).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function cropMedia(scene, image) {
    return scene.crop === 'community-browser' ? '<span class="showcase-cropped-media">' + image + '</span>' : image;
  }

  function media(key, index) {
    const scene = data[key].scenes[index];
    if (scene.src) return cropMedia(scene, '<img src="' + escape(scene.poster && !motionPlaying ? scene.poster : scene.src) + '"' + (scene.poster ? ' data-motion-src="' + escape(scene.src) + '" data-motion-poster="' + escape(scene.poster) + '"' : '') + ' alt="' + escape(scene.alt) + '" loading="lazy"' + (key === 'pc' ? ' draggable="false"' : '') + '>');
    return '<div class="showcase-placeholder"><span>' + data[key].name + '</span><strong>' + escape(scene.title) + '</strong><small>页面素材位</small></div>';
  }

  function frame(key, index, className) {
    const scene = data[key].scenes[index], active = index === selected[key];
    const label = (active && scene.src ? '放大查看 ' : key === 'pc' ? '查看 ' : '置顶查看 ') + data[key].name + ' ' + scene.title;
    const indices = data[key].scenes.map((_, i) => i);
    const depth = (indices.indexOf(index) - indices.indexOf(selected[key]) + indices.length) % indices.length;
    const offset = key === 'pc' ? pcOffset(index) : 0;
    const galleryAttrs = key === 'pc' ? ' data-offset="' + offset + '" style="--pc-offset:' + offset + '" tabindex="' + (Math.abs(offset) <= 1 ? 0 : -1) + '" aria-hidden="' + (Math.abs(offset) > 1) + '"' : '';
    return '<button type="button" data-card="' + index + '" data-key="' + key + '" data-depth="' + depth + '"' + galleryAttrs + ' aria-label="' + label + '" class="' + className + (active ? ' is-active' : '') + '">' + media(key, index) + '</button>';
  }

  function pcOffset(index) {
    const count = data.pc.scenes.length, offset = (index - selected.pc + count) % count;
    return offset > count / 2 ? offset - count : offset;
  }

  function stage(key) {
    if (key === 'pc') {
      return '<div class="pc-gallery" data-pc-viewport>' + data.pc.scenes.map((_, i) => frame(key, i, 'pc-window')).join('') + '<button type="button" class="pc-gallery-arrow pc-gallery-prev" data-direction="-1" data-key="pc" aria-label="PC 上一页">←</button><button type="button" class="pc-gallery-arrow pc-gallery-next" data-direction="1" data-key="pc" aria-label="PC 下一页">→</button></div>';
    }
    return '';
  }

  function pcGroup(index) {
    return data.pc.groups.find(group => group.scenes.includes(index));
  }

  function pcNavigation() {
    return '<div class="pc-gallery-nav"><div class="pc-thumbnails" role="group" aria-label="PC 图集缩略图">' + data.pc.scenes.map((scene, index) =>
      '<button type="button" data-key="pc" data-scene="' + index + '" aria-label="查看 ' + (index + 1) + '：' + escape(scene.title) + '" title="' + escape(scene.title) + '" aria-pressed="' + (selected.pc === index) + '"><img src="' + escape(scene.src) + '" alt="" loading="lazy"></button>'
    ).join('') + '</div><span data-pc-count aria-live="polite">' + String(selected.pc + 1).padStart(2, '0') + ' / ' + data.pc.scenes.length + '</span></div>';
  }

  function pcCaption() {
    const scene = data.pc.scenes[selected.pc];
    return '<div class="showcase-copy pc-caption" aria-live="polite" aria-atomic="true"><p class="pc-caption-group">' + pcGroup(selected.pc).title + '</p><h3>' + escape(scene.title) + '</h3><p class="showcase-description">' + escape(scene.description) + '</p><p class="pc-caption-note">' + escape(scene.note) + '</p></div>';
  }

  function hmiCaption() {
    const scene = data.hmi.scenes[selected.hmi];
    return '<strong>' + escape(scene.title) + '</strong><span>' + String(selected.hmi + 1).padStart(2, '0') + ' / ' + data.hmi.scenes.length + '</span><small>' + escape(scene.note) + '</small>';
  }

  function hmiNavigation() {
    const scene = data.hmi.scenes[selected.hmi];
    return '<div class="hmi-gallery-nav"><div class="hmi-thumbnails" role="group" aria-label="HMI 图集缩略图">' + data.hmi.scenes.map((item, index) =>
      '<button type="button" data-key="hmi" data-scene="' + index + '" aria-label="查看 ' + (index + 1) + '：' + escape(item.title) + '" title="' + escape(item.title) + '" aria-pressed="' + (selected.hmi === index) + '"><img src="' + escape(item.poster || item.src) + '" alt="" loading="lazy">' + (item.poster ? '<span class="hmi-thumbnail-play" aria-hidden="true">▶</span>' : '') + '</button>'
    ).join('') + '</div><div class="hmi-gallery-meta"><p class="hmi-gallery-caption" data-hmi-caption aria-live="polite" aria-atomic="true">' + hmiCaption() + '</p><button type="button" class="hmi-motion-toggle" data-motion-toggle data-playing="' + motionPlaying + '" aria-label="' + (motionPlaying ? '暂停动图' : '播放动图') + '"' + (scene.poster ? '' : ' hidden') + '>' + (motionPlaying ? '暂停动图' : '播放动图') + '</button></div></div>';
  }

  function communityCaption() {
    const scene = data.app.scenes[selected.app];
    return '<div><strong>Community · ' + escape(scene.title) + '</strong><span>' + String(selected.app + 1).padStart(2, '0') + ' / ' + data.app.scenes.length + '</span></div><p>' + escape(scene.description) + '</p>';
  }

  function mobileScene() {
    const scene = data.app.mobileScenes[selectedMobile];
    return {...scene, surface: 'App', alt: 'PalMake App 交互原型：' + scene.title + '，' + scene.description, note: 'App 交互原型 · ' + String(selectedMobile + 1).padStart(2, '0') + ' / ' + data.app.mobileScenes.length};
  }

  function mobileFrame() {
    const scene = mobileScene();
    return '<button type="button" class="ecosystem-phone" data-app-device aria-label="放大查看 App ' + escape(scene.title) + '"><img src="' + scene.src + '" alt="' + escape(scene.alt) + '" loading="lazy" draggable="false"></button>';
  }

  function mobileCaption() {
    const scene = mobileScene();
    return '<strong>App · ' + escape(scene.title) + '</strong><span>' + escape(scene.description) + '</span>';
  }

  function mobileGallery() {
    return '<figure class="ecosystem-mobile" data-mobile-gallery tabindex="0" role="group" aria-roledescription="轮播图集" aria-label="App 用户流程图集，可用左右方向键切换页面">' + mobileFrame() +
      '<div class="mobile-gallery-controls"><button type="button" data-mobile-direction="-1" aria-label="App 上一页">←</button><span data-mobile-count aria-live="polite">' + String(selectedMobile + 1).padStart(2, '0') + ' / ' + data.app.mobileScenes.length + '</span><button type="button" data-mobile-direction="1" aria-label="App 下一页">→</button></div>' +
      '<figcaption data-mobile-caption aria-live="polite" aria-atomic="true">' + mobileCaption() + '</figcaption></figure>';
  }

  function communityNavigation() {
    return '<div class="community-gallery-nav"><div class="community-thumbnails" role="group" aria-label="Community 图集缩略图">' + data.app.scenes.map((scene, index) =>
      '<button type="button" data-key="app" data-scene="' + index + '" aria-label="查看 ' + (index + 1) + '：' + escape(scene.title) + '" title="' + escape(scene.title) + '" aria-pressed="' + (selected.app === index) + '">' + cropMedia(scene, '<img src="' + escape(scene.src) + '" alt="" loading="lazy">') + '</button>'
    ).join('') + '</div><div class="community-caption" data-community-caption aria-live="polite" aria-atomic="true">' + communityCaption() + '</div></div>';
  }

  function panelContents(key) {
    const entry = data[key], current = selected[key], scene = entry.scenes[current];
    if (key === 'pc') return '<div class="showcase-stage showcase-stage-pc" data-scroll-stage="pc" tabindex="0" role="group" aria-roledescription="轮播图集" aria-label="PC 连续图集，可用左右方向键切换页面">' + stage(key) + pcNavigation() + '</div>' + pcCaption();
    if (key === 'hmi') return '<div class="hmi-overview"><div class="hmi-intro"><h3>' + entry.title + '</h3><p>' + entry.description + '</p></div>' +
      '<figure class="hmi-product-study"><img class="hmi-device-photo" src="' + entry.device + '" alt="PalmX G1 Hybrid 设备产品渲染" loading="lazy"><figcaption><span>设备外观</span><strong>PalmX G1 Hybrid</strong></figcaption></figure></div>' +
      '<div class="showcase-stage showcase-stage-hmi" data-scroll-stage="hmi" tabindex="0" role="group" aria-roledescription="轮播图集" aria-label="HMI 连续图集，可用左右方向键切换页面"><div class="hmi-screen"><div class="hmi-console"><div class="hmi-console-face">' + frame(key, current, 'hmi-display') + '</div><span class="hmi-console-brand" aria-hidden="true">PalmX</span></div><button type="button" class="hmi-gallery-arrow hmi-gallery-prev" data-direction="-1" data-key="hmi" aria-label="HMI 上一页">←</button><button type="button" class="hmi-gallery-arrow hmi-gallery-next" data-direction="1" data-key="hmi" aria-label="HMI 下一页">→</button></div>' + hmiNavigation() + '</div>';
    return '<div class="ecosystem-pair">' + mobileGallery() +
      '<div class="showcase-stage showcase-stage-app" data-scroll-stage="app" tabindex="0" role="group" aria-roledescription="轮播图集" aria-label="Community 连续图集，可用左右方向键切换页面"><div class="community-screen">' + frame(key, current, 'community-window') + '<button type="button" class="community-arrow community-prev" data-direction="-1" data-key="app" aria-label="Community 上一页">←</button><button type="button" class="community-arrow community-next" data-direction="1" data-key="app" aria-label="Community 下一页">→</button></div>' + communityNavigation() + '</div></div>';
  }

  panels.innerHTML = keys.map(key => '<div class="showcase-panel" id="showcase-panel-' + key + '" role="tabpanel" aria-labelledby="showcase-tab-' + key + '"' + (key === 'pc' ? '' : ' hidden') + '>' + panelContents(key) + '</div>').join('');

  function revealThumbnail(strip, smooth = true) {
    if (!strip.clientWidth) return;
    const thumb = strip.querySelector('[aria-pressed="true"]');
    const stripRect = strip.getBoundingClientRect(), thumbRect = thumb.getBoundingClientRect();
    if (thumbRect.left < stripRect.left || thumbRect.right > stripRect.right) strip.scrollTo({left: strip.scrollLeft + thumbRect.left - stripRect.left - (strip.clientWidth - thumb.offsetWidth) / 2, behavior: smooth && !reducedMotion.matches ? 'smooth' : 'instant'});
  }
  const thumbnailResize = new ResizeObserver(entries => entries.forEach(entry => revealThumbnail(entry.target, false)));
  root.querySelectorAll('.pc-thumbnails,.hmi-thumbnails,.community-thumbnails').forEach(strip => thumbnailResize.observe(strip));

  function selectMobileScene(index, source) {
    const count = data.app.mobileScenes.length;
    selectedMobile = (index + count) % count;
    const gallery = root.querySelector('[data-mobile-gallery]');
    gallery.querySelector('.ecosystem-phone').outerHTML = mobileFrame();
    gallery.querySelector('[data-mobile-count]').textContent = String(selectedMobile + 1).padStart(2, '0') + ' / ' + count;
    gallery.querySelector('[data-mobile-caption]').innerHTML = mobileCaption();
    if (source) source.focus({preventScroll: true});
  }

  function selectTerminal(key, focus) {
    terminal = key;
    tabs.forEach(tab => {
      const active = tab.dataset.terminal === key;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      document.querySelector('#showcase-panel-' + tab.dataset.terminal).hidden = !active;
      if (active && focus) tab.focus();
    });
  }

  function selectScene(key, index, source) {
    const count = data[key].scenes.length;
    selected[key] = (index + count) % count;
    const panel = document.querySelector('#showcase-panel-' + key);
    const direction = source && source.dataset.direction;
    panel.classList.remove('is-expanded');
    const expand = panel.querySelector('[data-expand]');
    if (expand) { expand.setAttribute('aria-expanded', 'false'); expand.textContent = key === 'pc' ? '展开图集' : '展开页面'; }
    if (key === 'hmi') {
      panel.querySelector('.hmi-display').outerHTML = frame(key, selected[key], 'hmi-display');
      panel.querySelector('[data-motion-toggle]').hidden = !data.hmi.scenes[selected[key]].poster;
      panel.querySelector('[data-hmi-caption]').innerHTML = hmiCaption();
      panel.querySelectorAll('.hmi-thumbnails [data-scene]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.scene) === selected.hmi)));
      revealThumbnail(panel.querySelector('.hmi-thumbnails'));
    } else if (key === 'app') {
      panel.querySelector('.community-window').outerHTML = frame(key, selected[key], 'community-window');
      panel.querySelector('[data-community-caption]').innerHTML = communityCaption();
      panel.querySelectorAll('.community-thumbnails [data-scene]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.scene) === selected.app)));
      revealThumbnail(panel.querySelector('.community-thumbnails'));
    } else {
      if (key === 'pc') {
        panel.querySelectorAll('.pc-thumbnails [data-scene]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.scene) === selected.pc)));
        panel.querySelector('[data-pc-count]').textContent = String(selected.pc + 1).padStart(2, '0') + ' / ' + count;
        revealThumbnail(panel.querySelector('.pc-thumbnails'));
      }
      const indices = data[key].scenes.map((_, i) => i);
      panel.querySelectorAll('[data-card]').forEach(card => {
        const i = Number(card.dataset.card), active = i === selected[key], scene = data[key].scenes[i];
        card.dataset.depth = (indices.indexOf(i) - indices.indexOf(selected[key]) + indices.length) % indices.length;
        card.classList.toggle('is-active', active);
        card.setAttribute('aria-label', (active && scene.src ? '放大查看 ' : key === 'pc' ? '查看 ' : '置顶查看 ') + data[key].name + ' ' + scene.title);
        if (key === 'pc') {
          const offset = pcOffset(i);
          card.dataset.offset = offset;
          card.style.setProperty('--pc-offset', offset);
          card.tabIndex = Math.abs(offset) <= 1 ? 0 : -1;
          card.setAttribute('aria-hidden', String(Math.abs(offset) > 1));
        }
      });
    }
    if (key === 'pc') {
      const copy = document.createElement('div');
      copy.innerHTML = key === 'pc' ? pcCaption() : panelContents(key);
      panel.querySelector('.showcase-copy').replaceWith(copy.querySelector('.showcase-copy'));
    }
    // Keep keyboard focus on the same control after updating the composition.
    const target = direction ? panel.querySelector('[data-direction="' + direction + '"]') : panel.querySelector('[data-scene="' + selected[key] + '"]');
    if (source && target) target.focus({preventScroll: true});
  }

  function toggleExpanded(key) {
    const panel = document.querySelector('#showcase-panel-' + key);
    const expanded = panel.classList.toggle('is-expanded');
    const button = panel.querySelector('[data-expand]');
    if (button) {button.setAttribute('aria-expanded', String(expanded)); button.textContent = (expanded ? '收起' : '展开') + (key === 'pc' ? '图集' : '页面');}
  }

  function openViewer(key, source, scene = data[key].scenes[selected[key]]) {
    opener = source;
    let crop = viewerBody.querySelector('.showcase-viewer-crop');
    if (!crop) { crop = document.createElement('div'); crop.className = 'showcase-cropped-media showcase-viewer-crop'; viewerBody.append(crop); }
    const cropped = scene.crop === 'community-browser';
    crop.hidden = !cropped;
    if (cropped) crop.append(viewerImage);
    else viewerBody.prepend(viewerImage);
    viewerImage.hidden = !scene.src;
    let slot = viewerBody.querySelector('.showcase-viewer-slot');
    if (!slot) { slot = document.createElement('div'); slot.className = 'showcase-viewer-slot'; viewerBody.append(slot); }
    slot.hidden = !!scene.src;
    if (scene.src) { viewerImage.src = scene.poster && !motionPlaying ? scene.poster : scene.src; viewerImage.alt = scene.alt; }
    else slot.innerHTML = media(key, selected[key]);
    viewerMotion.hidden = !scene.poster;
    viewerMotion.textContent = motionPlaying ? '暂停动图' : '播放动图';
    if (scene.poster) {
      viewerImage.dataset.motionSrc = scene.src;
      viewerImage.dataset.motionPoster = scene.poster;
    } else {
      delete viewerImage.dataset.motionSrc;
      delete viewerImage.dataset.motionPoster;
    }
    zoom.hidden = !scene.src;
    dialog.querySelector('#showcase-viewer-title').textContent = (scene.surface || data[key].name) + ' · ' + scene.title;
    dialog.querySelector('[data-showcase-viewer-count]').textContent = scene.note;
    viewerBody.classList.remove('is-zoomed');
    zoom.setAttribute('aria-pressed', 'false');
    zoom.textContent = '放大原图';
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    viewerBody.scrollTo(0, 0);
    dialog.querySelector('[data-showcase-close]').focus();
  }

  root.addEventListener('click', event => {
    if (performance.now() < ignoreClickUntil) { event.preventDefault(); return; }
    const button = event.target.closest('button');
    if (!button || !root.contains(button)) return;
    if (button.hasAttribute('data-motion-toggle')) toggleMotion();
    else if (button.hasAttribute('data-app-device')) openViewer('app', button, mobileScene());
    else if (button.dataset.mobileDirection) selectMobileScene(selectedMobile + Number(button.dataset.mobileDirection), button);
    else if (button.dataset.terminal) selectTerminal(button.dataset.terminal, false);
    else if (button.dataset.expand) toggleExpanded(button.dataset.expand);
    else if (button.dataset.card !== undefined) {
      const key = button.dataset.key, index = Number(button.dataset.card);
      const expanded = button.closest('.showcase-panel').classList.contains('is-expanded');
      if (index !== selected[key] || expanded) selectScene(key, index, button);
      else if (data[key].scenes[index].src) openViewer(key, button);
      else if (key !== 'hmi') toggleExpanded(key);
      else selectScene(key, index + 1, button);
    }
    else if (button.dataset.enlarge) openViewer(button.dataset.enlarge, button);
    else if (button.dataset.scene !== undefined) selectScene(button.dataset.key, Number(button.dataset.scene), button);
    else if (button.dataset.direction) selectScene(button.dataset.key, selected[button.dataset.key] + Number(button.dataset.direction), button);
  });
  function toggleMotion() {
    motionPlaying = !motionPlaying;
    document.querySelectorAll('[data-motion-src]').forEach(img => {
      img.src = motionPlaying ? img.dataset.motionSrc : img.dataset.motionPoster;
    });
    document.querySelectorAll('[data-motion-toggle]').forEach(button => {
      button.textContent = motionPlaying ? '暂停动图' : '播放动图';
      button.setAttribute('aria-label', button.textContent);
      button.dataset.playing = String(motionPlaying);
    });
  }
  viewerMotion.addEventListener('click', toggleMotion);
  reducedMotion.addEventListener('change', event => {
    if (event.matches && motionPlaying) toggleMotion();
  });
  root.addEventListener('keydown', event => {
    const mobile = event.target.closest('[data-mobile-gallery]');
    if (mobile && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      selectMobileScene(selectedMobile + (event.key === 'ArrowRight' ? 1 : -1));
      mobile.focus({preventScroll: true});
      return;
    }
    const stage = event.target.closest('[data-scroll-stage]');
    if (!stage || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const key = stage.dataset.scrollStage;
    selectScene(key, selected[key] + (event.key === 'ArrowRight' ? 1 : -1));
    stage.focus({preventScroll: true});
  });
  // Galleries use horizontal gestures; vertical wheel scrolling remains page scrolling.
  root.addEventListener('wheel', event => {
    const stage = event.target.closest('[data-scroll-stage],[data-mobile-gallery]');
    if (!stage || event.ctrlKey || event.target.closest('.pc-gallery-nav,.hmi-gallery-nav,.community-gallery-nav')) return;
    const key = stage.hasAttribute('data-mobile-gallery') ? 'mobile' : stage.dataset.scrollStage;
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    const step = Math.sign(delta), target = (key === 'mobile' ? selectedMobile : selected[key]) + step;
    if (!step) return;
    const now = performance.now();
    if (now - lastWheel < 420) { event.preventDefault(); return; }
    event.preventDefault();
    if (Math.sign(wheelTotal) !== step || now - wheelEventAt > 250) wheelTotal = 0;
    wheelEventAt = now;
    wheelTotal += delta * (event.deltaMode === 1 ? 16 : 1);
    if (Math.abs(wheelTotal) >= 45) {
      if (key === 'mobile') selectMobileScene(target);
      else selectScene(key, target);
      lastWheel = now;
      wheelTotal = 0;
    }
  }, {passive: false});
  root.addEventListener('pointerdown', event => {
    if (event.target.closest('.ecosystem-phone') && event.pointerType !== 'mouse') {
      pointerStart = {key: 'mobile', x: event.clientX, y: event.clientY};
      return;
    }
    const stage = event.target.closest('[data-scroll-stage]');
    if (!stage || event.target.closest('.pc-gallery-nav,.hmi-gallery-nav,.community-gallery-nav')) return;
    if (stage.dataset.scrollStage === 'pc') {
      const surface = event.target.closest('[data-pc-viewport]');
      if (!surface || event.button !== 0 || !event.isPrimary || event.target.closest('[data-direction]')) return;
      pointerStart = {key: 'pc', x: event.clientX, y: event.clientY, id: event.pointerId, surface, dragging: false};
      return;
    }
    if (event.pointerType === 'mouse') return;
    pointerStart = {key: stage.dataset.scrollStage, x: event.clientX, y: event.clientY};
  });
  root.addEventListener('pointermove', event => {
    const start = pointerStart;
    if (!start || start.key !== 'pc' || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (!start.dragging) {
      if (Math.abs(dy) > 10 && Math.abs(dy) >= Math.abs(dx)) { pointerStart = null; return; }
      if (Math.abs(dx) < 7 || Math.abs(dx) <= Math.abs(dy) * 1.2) return;
      start.dragging = true;
      start.surface.setPointerCapture(event.pointerId);
      start.surface.classList.add('is-dragging');
    }
    event.preventDefault();
    const limit = start.surface.clientWidth * .7;
    start.surface.style.setProperty('--pc-drag', Math.max(-limit, Math.min(limit, dx)) + 'px');
  });
  root.addEventListener('pointerup', event => {
    if (!pointerStart) return;
    const start = pointerStart;
    pointerStart = null;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (start.key === 'pc') {
      start.surface.classList.remove('is-dragging');
      start.surface.style.removeProperty('--pc-drag');
      if (start.surface.hasPointerCapture(event.pointerId)) start.surface.releasePointerCapture(event.pointerId);
      if (start.dragging) {
        ignoreClickUntil = performance.now() + 400;
        if (Math.abs(dx) > 45) selectScene('pc', selected.pc + (dx < 0 ? 1 : -1));
      }
      return;
    }
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      ignoreClickUntil = performance.now() + 400;
      if (start.key === 'mobile') selectMobileScene(selectedMobile + (dx < 0 ? 1 : -1));
      else selectScene(start.key, selected[start.key] + (dx < 0 ? 1 : -1));
    }
  });
  function cancelPointer() {
    if (pointerStart && pointerStart.surface) {
      pointerStart.surface.classList.remove('is-dragging');
      pointerStart.surface.style.removeProperty('--pc-drag');
    }
    pointerStart = null;
  }
  root.addEventListener('pointercancel', cancelPointer);
  root.addEventListener('lostpointercapture', cancelPointer);
  root.addEventListener('dragstart', event => { if (event.target.closest('[data-pc-viewport]')) event.preventDefault(); });
  root.querySelector('[role="tablist"]').addEventListener('keydown', event => {
    let index = keys.indexOf(terminal);
    if (event.key === 'ArrowRight') index = (index + 1) % keys.length;
    else if (event.key === 'ArrowLeft') index = (index + keys.length - 1) % keys.length;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = keys.length - 1;
    else return;
    event.preventDefault();
    selectTerminal(keys[index], true);
  });
  dialog.querySelector('[data-showcase-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.body.style.overflow = savedOverflow;
    if (opener && opener.isConnected) opener.focus({preventScroll: true});
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  zoom.addEventListener('click', () => {
    const expanded = viewerBody.classList.toggle('is-zoomed');
    zoom.setAttribute('aria-pressed', String(expanded));
    zoom.textContent = expanded ? '适应窗口' : '放大原图';
  });
  root.addEventListener('error', event => {
    if (event.target.tagName !== 'IMG') return;
    const fallback = document.createElement('div');
    fallback.className = 'showcase-image-error';
    fallback.textContent = '图片暂未加载，请刷新页面重试';
    event.target.replaceWith(fallback);
  }, true);
})();
