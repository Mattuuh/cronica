(() => {
  const book = document.getElementById('book');
  const prev = document.getElementById('prevPage');
  const next = document.getElementById('nextPage');
  const current = document.getElementById('pageCurrent');
  const total = document.getElementById('pageTotal');
  const error = document.getElementById('loadError');
  const pages = document.querySelectorAll('.page');

  total.textContent = String(pages.length);

  if (!window.St || !window.St.PageFlip) {
    error.hidden = false;
    prev.disabled = true;
    next.disabled = true;
    return;
  }

  const pageFlip = new St.PageFlip(book, {
    width: 520,
    height: 730,
    size: 'stretch',
    minWidth: 300,
    maxWidth: 520,
    minHeight: 421,
    maxHeight: 730,
    maxShadowOpacity: 0.48,
    showCover: true,
    mobileScrollSupport: true,
    usePortrait: true,
    drawShadow: true,
    flippingTime: 900,
    autoSize: true
  });

  pageFlip.loadFromHTML(pages);

  const updateStatus = (index) => {
    current.textContent = String(index + 1);
    prev.disabled = index <= 0;
    next.disabled = index >= pages.length - 1;
  };

  pageFlip.on('init', (e) => updateStatus(e.data.page));
  pageFlip.on('flip', (e) => updateStatus(e.data));

  prev.addEventListener('click', () => pageFlip.flipPrev());
  next.addEventListener('click', () => pageFlip.flipNext());

  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') pageFlip.flipPrev();
    if (event.key === 'ArrowRight') pageFlip.flipNext();
  });
})();
