(() => {
  'use strict';
  const root = document.querySelector('.anker-experience');
  const dialog = document.querySelector('.anker-viewer');
  if (!root || !dialog) return;
  const viewer = dialog.querySelector('video');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const stages = {
    scenes: '场景库',
    task: '测评任务',
    compare: '结果对比'
  };
  const cases = [...root.querySelectorAll('.anker-case')].map(element => ({
    element,
    video: element.querySelector('video'),
    toggle: element.querySelector('.anker-motion'),
    visible: false,
    paused: reducedMotion.matches,
    title: root.querySelector('[data-anker-project="' + element.dataset.ankerCase + '"]').textContent,
    stage: element.dataset.ankerCase === 'evaluation' ? 'scenes' : null
  }));
  let opener = null;
  let dialogCase = null;

  function load(state) {
    if (state.video.getAttribute('src') !== state.video.dataset.src) {
      state.video.src = state.video.dataset.src;
      state.video.load();
    }
  }
  function updateButton(state) {
    const verb = state.video.paused ? '播放' : '暂停';
    state.toggle.textContent = verb + '动图';
    state.toggle.setAttribute('aria-label', verb + state.title + '动图');
  }
  function sync(state) {
    if (state.visible && !state.element.hidden && !state.paused && !document.hidden && !dialog.open) {
      load(state);
      state.video.play().catch(() => updateButton(state));
    } else {
      state.video.pause();
    }
    updateButton(state);
  }
  function openViewer(state, trigger) {
    opener = trigger;
    dialogCase = state;
    load(state);
    const subtitle = state.stage ? stages[state.stage] + ' · 交互原型' : '工作流成果';
    dialog.querySelector('h2').textContent = state.title + ' · ' + subtitle;
    viewer.poster = state.video.poster;
    viewer.src = state.video.dataset.src;
    viewer.load();
    dialog.showModal();
    cases.forEach(sync);
    if (!state.paused) viewer.play().catch(() => {});
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const state = cases.find(item => item.element === entry.target);
      state.visible = entry.isIntersecting;
      sync(state);
    }
  }, { threshold: 0.1 });
  for (const state of cases) {
    state.video.muted = true;
    state.video.addEventListener('play', () => updateButton(state));
    state.video.addEventListener('pause', () => updateButton(state));
    state.video.addEventListener('error', () => {
      state.toggle.textContent = '重新播放';
      state.toggle.setAttribute('aria-label', '重新播放' + state.title + '动图');
    });
    state.toggle.addEventListener('click', () => {
      state.paused = !state.video.paused;
      if (state.video.error) state.video.load();
      sync(state);
    });
    for (const trigger of state.element.querySelectorAll('.anker-media-open, .anker-expand')) {
      trigger.addEventListener('click', () => openViewer(state, trigger));
    }
    for (const button of state.element.querySelectorAll('[data-anker-stage]')) {
      button.addEventListener('click', () => {
        const key = button.dataset.ankerStage;
        if (key === state.stage) return;
        state.stage = key;
        state.video.pause();
        state.video.dataset.src = 'assets/anker/' + key + '-web.mp4';
        state.video.poster = 'assets/anker/' + key + '.webp';
        load(state);
        state.element.querySelector('[data-anker-caption]').textContent = stages[key] + ' · 交互原型';
        state.element.querySelectorAll('[data-anker-stage]').forEach(item => {
          item.setAttribute('aria-pressed', String(item === button));
        });
        sync(state);
      });
    }
    observer.observe(state.element);
  }
  const tabs = [...root.querySelectorAll('[data-anker-project]')];
  function selectProject(button) {
    tabs.forEach(tab => {
      tab.setAttribute('aria-selected', String(tab === button));
      tab.tabIndex = tab === button ? 0 : -1;
    });
    cases.forEach(state => {
      state.element.hidden = state.element.dataset.ankerCase !== button.dataset.ankerProject;
      sync(state);
    });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectProject(tab));
    tab.addEventListener('keydown', event => {
      let target;
      if (event.key === 'ArrowRight') target = tabs[(index + 1) % tabs.length];
      if (event.key === 'ArrowLeft') target = tabs[(index + tabs.length - 1) % tabs.length];
      if (event.key === 'Home') target = tabs[0];
      if (event.key === 'End') target = tabs[tabs.length - 1];
      if (!target) return;
      event.preventDefault();
      target.focus();
      selectProject(target);
    });
  });
  dialog.querySelector('.anker-viewer-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    viewer.pause();
    viewer.removeAttribute('src');
    viewer.load();
    dialogCase = null;
    cases.forEach(sync);
    opener?.focus({ preventScroll: true });
  });
  document.addEventListener('visibilitychange', () => {
    cases.forEach(sync);
    if (document.hidden) viewer.pause();
    else if (dialog.open && dialogCase && !dialogCase.paused) viewer.play().catch(() => {});
  });
  reducedMotion.addEventListener('change', () => {
    cases.forEach(state => { state.paused = reducedMotion.matches; sync(state); });
    if (reducedMotion.matches) viewer.pause();
  });
})();
