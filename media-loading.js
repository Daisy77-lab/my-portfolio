(() => {
  'use strict';
  const previews = window.portfolioPreviews || {};
  const preview = src => previews[src] || src;
  // Keep the already-readable preview while a large zoom image crosses the network.
  const fullRequests = new WeakMap();
  const previewRequests = new WeakMap();
  function primeImage(image) {
    const original = image.dataset.fullSrc || image.dataset.src || image.getAttribute('src');
    const placeholder = (window.portfolioPlaceholders || {})[original];
    if (!placeholder || (image.complete && image.naturalWidth > 0 && image.getAttribute('src') !== placeholder)) return;
    image.dataset.fullSrc = original;
    image.dataset.src = original;
    if (image.getAttribute('src') !== placeholder) image.src = placeholder;
  }
  function prime(root) { root.querySelectorAll('img').forEach(primeImage); }
  function showFull(image, original) {
    const small = preview(original);
    const ticket = {};
    fullRequests.set(image, ticket);
    image.loading = 'eager';
    image.decoding = 'async';
    image.src = small;
    if (small === original) return;
    const full = new Image();
    full.decoding = 'async';
    full.onload = async () => {
      try { await full.decode(); } catch { return; }
      if (fullRequests.get(image) === ticket && image.isConnected) image.src = original;
    };
    // A network failure leaves a useful preview; reopening retries the original.
    full.onerror = () => {};
    full.src = original;
  }
  function eligible(element) {
    if (element.closest('[hidden], .pc-window[aria-hidden="true"]')) return false;
    const slide = element.closest('.hobby-album-slide');
    return !slide || slide.matches('.is-current, .is-previous, .is-next');
  }
  function load(element, prepareHidden = false) {
    if (!prepareHidden && !eligible(element)) return;
    if (element.tagName === 'IMG') element.loading = 'eager';
    if (element.dataset.src) {
      const original = element.dataset.src;
      const src = element.tagName === 'IMG' && !element.closest('dialog') ? preview(original) : original;
      if (element.tagName === 'IMG' && element.getAttribute('src')?.startsWith('data:image/')) {
        if (previewRequests.has(element)) return;
        const request = new Image();
        previewRequests.set(element, request);
        request.onload = async () => {
          try { await request.decode(); } catch { previewRequests.delete(element); return; }
          if (previewRequests.get(element) === request) {
            element.src = src;
            delete element.dataset.src;
            previewRequests.delete(element);
          }
        };
        request.onerror = () => previewRequests.delete(element);
        request.src = src;
        return;
      }
      if (element.tagName === 'IMG') {
        // One loading threshold: don't defer again after our observer has scheduled it.
        element.loading = 'eager';
        element.decoding = 'async';
        if (src !== original) element.dataset.fullSrc = original;
      }
      if (element.getAttribute('src') !== src) {
        element.setAttribute('src', src);
        if (element.tagName === 'VIDEO') element.load();
      }
      if (element.tagName !== 'VIDEO') delete element.dataset.src;
    }
    if (element.dataset.href) {
      // SVG cropping coordinates are retained; only the embedded raster is smaller.
      element.setAttribute('href', preview(element.dataset.href));
      delete element.dataset.href;
    }
  }
  // Warm only the next useful views when their controls approach the viewport.
  // Keeping the same image nodes lets a tab switch reuse their decoded pixels.
  function prepare(root, selector) {
    let prepared = false;
    const run = () => {
      if (prepared) return;
      prepared = true;
      root.querySelectorAll(selector).forEach(image => load(image, true));
      ahead.disconnect();
    };
    const ahead = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) run();
    }, { rootMargin: '600px 0px' });
    ahead.observe(root);
    root.addEventListener('pointerover', run, {once:true});
    root.addEventListener('focusin', run, {once:true});
  }
  function activate(root) {
    root.querySelectorAll('img[data-src], img[loading="lazy"], image[data-href]').forEach(image => load(image));
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
    if (isIntersecting && eligible(target)) { load(target); observer.unobserve(target); }
  }), { rootMargin: '600px 0px' });
  const nearObserver = new IntersectionObserver(entries => entries.forEach(({target,isIntersecting}) => {
    if (isIntersecting) { load(target); nearObserver.unobserve(target); }
  }), { rootMargin: '600px 0px' });
  const playbackObserver = new IntersectionObserver(entries => entries.forEach(({ target }) => syncVideo(target)));
  const seen = new WeakSet();
  function watch(root) {
    const matches = root.nodeType === 1 && root.matches('[data-src], [data-href], img[loading="lazy"]') ? [root] : [];
    matches.push(...(root.querySelectorAll?.('[data-src], [data-href], img[loading="lazy"]') || []));
    for (const element of matches) {
      if (seen.has(element)) continue;
      seen.add(element);
      if (element.tagName === 'IMG') primeImage(element);
      if (element.matches('video[data-motion-src]')) { playbackObserver.observe(element); continue; }
      if (element.matches('video, .hobby-album-thumb img, .pc-thumbnails img, .hmi-thumbnails img')) nearObserver.observe(element);
      else observer.observe(element);

    }
  }
  watch(document);
  new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(watch)))
    .observe(document.body, { childList: true, subtree: true });
  document.addEventListener('visibilitychange', () => document.querySelectorAll('video[data-motion-src]').forEach(syncVideo));
  window.portfolioMedia = { load, syncVideo, preview, showFull, prepare, activate, prime };
})();
