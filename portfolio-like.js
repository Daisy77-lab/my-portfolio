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
