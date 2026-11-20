(() => {
  'use strict';
  // Defer actual URLs, including SVG images and hidden gallery slides, until nearby.
  function load(element) {
    if (element.dataset.src) {
      if (element.getAttribute('src') !== element.dataset.src) {
        element.setAttribute('src', element.dataset.src);
        if (element.tagName === 'VIDEO') element.load();
      }
      if (element.tagName !== 'VIDEO') delete element.dataset.src;
    }
    if (element.dataset.href) {
      element.setAttribute('href', element.dataset.href);
      delete element.dataset.href;
    }
  }
  function syncVideo(video) {
    const rect = video.getBoundingClientRect();
    const visible = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight && !document.hidden;
    if (visible && video.dataset.playing !== 'false') {
      load(video);
      video.muted = true;
      video.play().catch(() => {});
    } else video.pause();
  }
  const observer = new IntersectionObserver(entries => entries.forEach(({ target, isIntersecting }) => {
    if (isIntersecting) load(target);
    if (isIntersecting) observer.unobserve(target);
  }), { rootMargin: '160px 0px' });
  const playbackObserver = new IntersectionObserver(entries => entries.forEach(({ target }) => syncVideo(target)));
  const seen = new WeakSet();
  function watch(root) {
    const matches = root.nodeType === 1 && root.matches('[data-src], [data-href]') ? [root] : [];
    matches.push(...(root.querySelectorAll?.('[data-src], [data-href]') || []));
    for (const element of matches) {
      if (seen.has(element)) continue;
      seen.add(element);
      observer.observe(element);
      if (element.matches('video[data-motion-src]')) playbackObserver.observe(element);
    }
  }
  watch(document);
  new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(watch)))
    .observe(document.body, { childList: true, subtree: true });
  document.addEventListener('visibilitychange', () => document.querySelectorAll('video[data-motion-src]').forEach(syncVideo));
  window.portfolioMedia = { load, syncVideo };
})();
