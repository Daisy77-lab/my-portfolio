(() => {
  'use strict';
  document.querySelectorAll('[data-design-gallery]').forEach(gallery => {
    const buttons = [...gallery.querySelectorAll('[data-design-select]')];
    const panels = [...gallery.querySelectorAll('[data-design-panel]')];
    buttons.forEach(button => button.addEventListener('click', () => {
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      panels.forEach(panel => { panel.hidden = panel.dataset.designPanel !== button.dataset.designSelect; });
    }));
  });

  document.querySelectorAll('[data-website-tour]').forEach(tour => {
    const video = tour.querySelector('video');
    const toggle = tour.querySelector('.website-tour-toggle');
    const label = toggle.querySelector('span');
    const error = tour.querySelector('.website-tour-error');
    let wantsPlayback = true;
    let visible = false;

    function updatePlayback() {
      const playing = !video.paused && !video.ended;
      tour.classList.toggle('is-playing', playing);
      label.textContent = playing ? '暂停' : '播放';
      toggle.setAttribute('aria-label', playing ? '暂停结构导览' : '播放结构导览');
    }

    function updateView() {
      const position = video.duration ? video.currentTime / video.duration : 0;
      tour.style.setProperty('--tour-title-opacity', String(Math.max(0, Math.min(1, 1 - (position - .16) / .13))));
    }

    function syncPlayback() {
      if (wantsPlayback && visible && !document.hidden && !video.error) {
        window.portfolioMedia.load(video);
        video.play().then(() => {
          // A pause or scroll can happen while the first frame is loading.
          if (!wantsPlayback || !visible || document.hidden) video.pause();
        }).catch(() => updatePlayback());
      } else {
        video.pause();
      }
    }

    toggle.hidden = false;
    video.controls = false;
    video.muted = true;
    video.defaultMuted = true;
    video.autoplay = true;
    video.playsInline = true;
    toggle.addEventListener('click', () => {
      wantsPlayback = video.paused;
      syncPlayback();
    });
    video.addEventListener('loadedmetadata', () => {
      video.playbackRate = .8;
    });
    video.addEventListener('canplay', syncPlayback);
    video.addEventListener('play', updatePlayback);
    video.addEventListener('pause', updatePlayback);
    video.addEventListener('timeupdate', updateView);
    video.addEventListener('seeked', updateView);
    video.addEventListener('error', () => {
      error.hidden = false;
      toggle.hidden = true;
      updatePlayback();
    });
    tour.querySelector('[data-tour-retry]').addEventListener('click', () => {
      error.hidden = true;
      toggle.hidden = false;
      video.load();
      syncPlayback();
    });
    document.addEventListener('visibilitychange', syncPlayback);
    window.addEventListener('pageshow', syncPlayback);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        syncPlayback();
      }, { threshold: 0 }).observe(video);
    } else {
      visible = true;
      syncPlayback();
    }
  });
})();
