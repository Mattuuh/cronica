(() => {
  const book = document.getElementById('book');
  const prev = document.getElementById('prevPage');
  const next = document.getElementById('nextPage');
  const current = document.getElementById('pageCurrent');
  const total = document.getElementById('pageTotal');
  const error = document.getElementById('loadError');
  const pages = Array.from(document.querySelectorAll('.page'));

  total.textContent = String(pages.length);

  const staticFallback = () => {
    error.hidden = false;
    prev.disabled = true;
    next.disabled = true;
    book.classList.add('static-book');
    pages.forEach((page) => {
      page.style.width = 'min(520px, 96vw)';
      page.style.height = 'auto';
      page.style.minHeight = '730px';
      page.style.margin = '0 auto 18px';
    });
  };

  if (!window.St || !window.St.PageFlip) {
    staticFallback();
    return;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pageFlip = new St.PageFlip(book, {
    width: 520,
    height: 730,
    size: 'stretch',
    minWidth: 300,
    maxWidth: 520,
    minHeight: 421,
    maxHeight: 730,
    maxShadowOpacity: 0.5,
    showCover: true,
    mobileScrollSupport: true,
    usePortrait: true,
    drawShadow: true,
    flippingTime: reducedMotion ? 120 : 920,
    autoSize: true,
    clickEventForward: true
  });

  pageFlip.loadFromHTML(pages);

  const updateStatus = (index) => {
    const safeIndex = Math.max(0, Math.min(index, pages.length - 1));
    current.textContent = String(safeIndex + 1);
    prev.disabled = safeIndex <= 0;
    next.disabled = safeIndex >= pages.length - 1;
  };

  pageFlip.on('init', (event) => updateStatus(event.data.page));
  pageFlip.on('flip', (event) => updateStatus(event.data));

  prev.addEventListener('click', () => pageFlip.flipPrev());
  next.addEventListener('click', () => pageFlip.flipNext());

  document.addEventListener('keydown', (event) => {
    const target = event.target;
    if (target && /INPUT|TEXTAREA|SELECT/.test(target.tagName)) return;
    if (event.key === 'ArrowLeft') pageFlip.flipPrev();
    if (event.key === 'ArrowRight') pageFlip.flipNext();
  });
})();
