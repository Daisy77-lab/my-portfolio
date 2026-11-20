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
