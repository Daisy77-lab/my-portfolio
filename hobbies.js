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
