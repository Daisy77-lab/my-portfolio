(() => {
  const requested = new URLSearchParams(location.search).get('lang');
  let saved;
  try { saved = localStorage.getItem('lidaiyu-portfolio-language'); } catch {}
  document.documentElement.lang = (requested === 'en' || (requested !== 'zh' && saved === 'en')) ? 'en' : 'zh-CN';
})();
