(() => {
  'use strict';
  const dictionary = window.PORTFOLIO_EN;
  if (!dictionary) return;
  const storageKey = 'lidaiyu-portfolio-language';
  const attributes = ['alt', 'title', 'aria-label', 'aria-roledescription', 'placeholder'];
  const originals = new WeakMap();
  const originalAttributes = new WeakMap();
  const normalize = value => value.replace(/\s+/g, ' ').trim();
  const excluded = 'script, style, noscript, code, pre, [data-no-translate]';
  let language = document.documentElement.lang === 'en' ? 'en' : 'zh';

  function english(value) {
    if (Object.hasOwn(dictionary, value)) return dictionary[value];
    // Labels assembled by the existing galleries and video controls.
    const patterns = [
      [/^PalMake App 交互原型：(.+?)，(.+)$/, m => `PalMake App prototype: ${english(m[1])}, ${english(m[2])}`],
      [/^显示 (\d+) 个作品$/, m => `Showing ${m[1]} projects`],
      [/^查看 (\d+)：(.+)$/, m => `View ${m[1]}: ${english(m[2])}`],
      [/^放大查看[：\s]*(.+)$/, m => `Enlarge: ${english(m[1])}`],
      [/^放大(.+)$/, m => `Enlarge ${english(m[1])}`],
      [/^置顶查看\s*(.+)$/, m => `Show ${english(m[1])}`],
      [/^查看(.+)$/, m => `View ${english(m[1].trim())}`],
      [/^(重新播放|播放|暂停)(.+)动图$/, m => `${m[1] === '暂停' ? 'Pause' : m[1] === '重新播放' ? 'Replay' : 'Play'} ${english(m[2])} video`],
      [/^下一个项目：(.+)$/, m => `Next project: ${english(m[1])}`],
      [/^(.+)，打开完整原图$/, m => `${english(m[1])}, open full image`],
      [/^(.+)作品封面$/, m => `${english(m[1])} cover`],
      [/^(.+)项目界面$/, m => `${english(m[1])} project screen`],
      [/^(.+)大图$/, m => `${english(m[1])} — enlarged images`],
      [/^(.+) — lidaiyu 产品作品集$/, m => `${english(m[1])} — Daisy Li's portfolio`],
      [/^(PC|HMI|App \+ Community|App|Community) (?!· )(.+)$/, m => `${m[1]} ${english(m[2])}`]
    ];
    for (const [pattern, replace] of patterns) {
      const match = value.match(pattern);
      if (match) return replace(match);
    }
    if (value.includes(' · ')) return value.split(' · ').map(english).join(' · ');
    return value;
  }

  function localized(current, saved) {
    const source = saved && current === saved.rendered ? saved.source : current;
    const translated = language === 'en' ? english(normalize(source)) : source;
    const rendered = language === 'en' ? source.replace(/\S[\s\S]*\S|\S/, translated) : source;
    return { source, rendered };
  }

  function translateText(node) {
    if (!node.parentElement || node.parentElement.closest(excluded) || !node.data.trim()) return;
    const next = localized(node.data, originals.get(node));
    originals.set(node, next);
    if (node.data !== next.rendered) node.data = next.rendered;
  }

  function translateElement(element) {
    if (element.closest(excluded)) return;
    const saved = originalAttributes.get(element) || {};
    const names = element.matches('meta[name="description"]') ? [...attributes, 'content'] : attributes;
    for (const name of names) {
      if (!element.hasAttribute(name)) continue;
      const current = element.getAttribute(name);
      saved[name] = localized(current, saved[name]);
      if (current !== saved[name].rendered) element.setAttribute(name, saved[name].rendered);
    }
    originalAttributes.set(element, saved);
    if (element.matches('a[href]')) {
      const raw = element.getAttribute('href');
      if (!raw || raw.startsWith('#')) return;
      const url = new URL(raw, location.href);
      if (url.origin !== location.origin || !url.pathname.endsWith('.html') || url.pathname.includes('/prototypes/')) return;
      url.searchParams.set('lang', language);
      const next = url.pathname + url.search + url.hash;
      if (raw !== next) element.setAttribute('href', next);
    }
  }

  function translate(root) {
    if (root.nodeType === Node.TEXT_NODE) return translateText(root);
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) translateElement(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeType === Node.TEXT_NODE) translateText(node);
      else translateElement(node);
    }
  }

  const switcher = document.createElement('div');
  switcher.className = 'language-switch';
  switcher.dataset.noTranslate = '';
  switcher.setAttribute('role', 'group');
  switcher.innerHTML = '<button type="button" data-language="zh" lang="zh-CN">中文</button><span aria-hidden="true">/</span><button type="button" data-language="en" lang="en">EN</button>';
  const header = document.querySelector('.header');
  if (header) header.insertBefore(switcher, header.querySelector('.menu-toggle'));
  else {
    switcher.classList.add('language-switch-floating');
    document.body.prepend(switcher);
  }
  function updateSwitcher() {
    switcher.setAttribute('aria-label', language === 'en' ? 'Language' : '语言');
    switcher.querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.language === language));
      button.setAttribute('aria-label', button.dataset.language === 'en' ? 'Switch to English' : '切换到中文');
    });
  }

  const observer = new MutationObserver(records => {
    observer.disconnect();
    for (const record of records) {
      if (record.type === 'childList') record.addedNodes.forEach(translate);
      else if (record.type === 'characterData') translateText(record.target);
      else translateElement(record.target);
    }
    observe();
  });
  function observe() {
    observer.observe(document.documentElement, {subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:[...attributes, 'content', 'href']});
  }
  function setLanguage(next, persist = true) {
    language = next === 'en' ? 'en' : 'zh';
    observer.disconnect();
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    translate(document);
    updateSwitcher();
    if (persist) {
      try { localStorage.setItem(storageKey, language); } catch {}
      const url = new URL(location.href);
      url.searchParams.set('lang', language);
      history.replaceState(history.state, '', url);
    }
    observe();
  }
  switcher.addEventListener('click', event => {
    const button = event.target.closest('[data-language]');
    if (button) setLanguage(button.dataset.language);
  });
  window.addEventListener('popstate', () => {
    const next = new URLSearchParams(location.search).get('lang');
    if (next === 'en' || next === 'zh') setLanguage(next, false);
  });
  window.portfolioI18n = {
    originalAttribute: (element, name) => originalAttributes.get(element)?.[name]?.source || element.getAttribute(name),
    translate: value => language === 'en' ? english(normalize(value)) : value
  };
  setLanguage(language);
})();
