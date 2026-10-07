(() => {
  const book = document.getElementById('book');
  const prev = document.getElementById('prevPage');
  const next = document.getElementById('nextPage');
  const current = document.getElementById('pageCurrent');
  const total = document.getElementById('pageTotal');
  const error = document.getElementById('loadError');

  // Volvemos al ancho original para que la version mobile escale mejor.
  const PAGE_W = 520;
  const PAGE_H = 730;
  const EPS = 2;

  const candidateSelector = [
    '.story-p',
    'blockquote',
    'figure',
    '.integrated-note',
    '.verdict-box',
    '.closing-question',
    '.kicker',
    '.article-title',
    '.section-title'
  ].join(',');

  const pageInner = (page) => page?.querySelector('.page-inner');

  const isOverflowing = (page) => {
    const inner = pageInner(page);
    return !!inner && inner.scrollHeight > inner.clientHeight + EPS;
  };

  const bodyStart = (page) => {
    const inner = pageInner(page);
    if (!inner) return null;
    return inner.querySelector('.running-head, .masthead')?.nextElementSibling || inner.firstElementChild;
  };

  const footer = (page) => page?.querySelector('footer.folio');

  const lastMovable = (page) => {
    const inner = pageInner(page);
    if (!inner) return null;
    const all = Array.from(inner.querySelectorAll(candidateSelector));
    return all.filter((el) => !el.closest('footer.folio'))[all.length - 1] || null;
  };

  const cleanEmptyWrappers = (page) => {
    const inner = pageInner(page);
    if (!inner) return;
    const wrappers = Array.from(inner.querySelectorAll(
      '.story-columns, .story-with-portrait, .cover-lead, .story-continuation, .flow-continuation'
    ));
    wrappers.reverse().forEach((el) => {
      const meaningful = el.querySelector(candidateSelector) || el.textContent.trim();
      if (!meaningful && !el.classList.contains('cover-lead')) el.remove();
    });
  };

  const splitParagraphToFit = (page, p) => {
    if (!p || p.tagName !== 'P' || !p.classList.contains('story-p')) return null;
    const original = p.textContent.trim();
    const words = original.split(/\s+/);
    if (words.length < 18) return null;

    let low = 4;
    let high = words.length - 4;
    let best = -1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      p.textContent = words.slice(0, mid).join(' ');
      if (!isOverflowing(page)) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    if (best < 4 || best >= words.length - 3) {
      p.textContent = original;
      return null;
    }

    p.textContent = words.slice(0, best).join(' ');
    const rest = p.cloneNode(false);
    rest.textContent = words.slice(best).join(' ');
    rest.classList.remove('dropcap-first');
    rest.classList.add('continued-fragment');
    return rest;
  };

  const extractOverflowChunks = (page) => {
    const chunks = [];
    let guard = 0;

    while (isOverflowing(page) && guard++ < 50) {
      const candidate = lastMovable(page);
      if (!candidate) break;

      if (candidate.matches('p.story-p')) {
        const split = splitParagraphToFit(page, candidate);
        if (split) {
          chunks.unshift(split);
          continue;
        }
      }

      candidate.remove();
      chunks.unshift(candidate);
      cleanEmptyWrappers(page);
    }

    return chunks;
  };

  const ensureFlowZone = (page) => {
    const inner = pageInner(page);
    if (!inner) return null;

    let zone = inner.querySelector(':scope > .flow-continuation');
    if (zone) return zone;

    zone = document.createElement('div');
    zone.className = 'flow-continuation';

    const head = inner.querySelector(':scope > .running-head, :scope > .masthead');
    if (head) head.insertAdjacentElement('afterend', zone);
    else inner.insertBefore(zone, inner.firstChild);

    return zone;
  };

  const appendChunksToZone = (zone, chunks) => {
    let textGroup = null;

    const ensureTextGroup = () => {
      if (!textGroup) {
        textGroup = document.createElement('div');
        textGroup.className = 'story-columns flow-text';
        zone.appendChild(textGroup);
        requestAnimationFrame(() => {
          if (textGroup && textGroup.textContent.trim().length > 650) textGroup.classList.add('is-long-flow');
        });
      }
      return textGroup;
    };

    chunks.forEach((chunk) => {
      const isText = chunk.matches?.('p.story-p, blockquote');
      if (isText) {
        ensureTextGroup().appendChild(chunk);
      } else {
        textGroup = null;
        if (chunk.matches?.('figure')) chunk.classList.add('flow-figure');
        zone.appendChild(chunk);
      }
    });
  };

  const prependOverflowToNextPage = (source, target, chunks) => {
    if (!chunks.length) return;
    const zone = ensureFlowZone(target);
    appendChunksToZone(zone, chunks);
  };

  const createPlainContinuationPage = (sourcePage) => {
    const topic = sourcePage.querySelector('.running-head span:last-child')?.textContent?.trim()
      || sourcePage.querySelector('.masthead-rule span:last-child')?.textContent?.trim()
      || 'CRÓNICA';

    const page = document.createElement('article');
    page.className = 'page auto-continuation';
    page.innerHTML = `
      <div class="page-inner">
        <header class="running-head"><span>LA CRONISTA DPP</span><span>${topic}</span></header>
        <div class="flow-continuation"></div>
        <footer class="folio"><span></span><span>${topic}</span></footer>
      </div>`;
    return page;
  };

  const nextArticlePage = (page) => {
    const nextPage = page.nextElementSibling;
    if (!nextPage || nextPage.classList.contains('back-cover')) return null;
    return nextPage;
  };

  const paginateOverflow = () => {
    book.classList.add('preflight');

    let page = book.querySelector('.page:not(.back-cover)');
    let safety = 0;

    while (page && safety++ < 160) {
      if (page.classList.contains('back-cover')) break;

      if (!isOverflowing(page)) {
        page = page.nextElementSibling;
        continue;
      }

      const chunks = extractOverflowChunks(page);
      if (!chunks.length) {
        page = page.nextElementSibling;
        continue;
      }

      let target = nextArticlePage(page);
      if (!target) {
        target = createPlainContinuationPage(page);
        const back = book.querySelector('.back-cover');
        book.insertBefore(target, back || null);
      }

      // El excedente se inserta ARRIBA de la pagina siguiente, antes de su seccion original.
      // Asi la lectura continua de forma lineal y no se crea una pagina aislada de "continuacion".
      prependOverflowToNextPage(page, target, chunks);

      // Volvemos a revisar primero la pagina destino. Si ahora desborda,
      // el excedente seguira pasando a la hoja siguiente, en cadena.
      page = target;
    }

    // Eliminar zonas vacias que hayan quedado tras la redistribucion.
    Array.from(book.querySelectorAll('.flow-continuation')).forEach((zone) => {
      if (!zone.textContent.trim() && !zone.querySelector('img,figure,aside,blockquote')) zone.remove();
    });

    const pages = Array.from(book.querySelectorAll('.page'));
    pages.forEach((p, i) => {
      const folioNum = p.querySelector('.folio span:first-child');
      if (folioNum) folioNum.textContent = String(i + 1);
    });

    book.classList.remove('preflight');
    return pages;
  };

  const staticFallback = (pages) => {
    error.hidden = false;
    prev.disabled = true;
    next.disabled = true;
    book.classList.add('static-book');
    pages.forEach((page) => {
      page.style.width = 'min(520px,96vw)';
      page.style.height = 'auto';
      page.style.minHeight = '730px';
      page.style.margin = '0 auto 18px';
    });
  };

  const init = () => {
    const pages = paginateOverflow();
    total.textContent = String(pages.length);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 740px)').matches;
    const viewport = document.querySelector('.book-viewport');
    const scaleWrapper = document.querySelector('.book-scale');

    const updateStatus = (index) => {
      const i = Math.max(0, Math.min(index, pages.length - 1));
      current.textContent = String(i + 1);
      prev.disabled = i <= 0;
      next.disabled = i >= pages.length - 1;
    };

    if (isMobile) {
      // MOBILE: no dejamos que PageFlip cambie la geometria de la hoja.
      // Mostramos las mismas paginas 520x730 y escalamos el wrapper completo.
      book.classList.add('mobile-book');

      let mobileIndex = 0;
      let animating = false;
      let touchStartX = null;
      let touchStartY = null;

      pages.forEach((page, i) => {
        page.classList.toggle('mobile-active', i === 0);
        page.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
      });

      const scaleMobileBook = () => {
        if (!viewport || !scaleWrapper) return;
        const gutter = 24;
        const available = Math.max(280, window.innerWidth - gutter);
        const scale = Math.min(1, available / PAGE_W);
        scaleWrapper.style.transform = `translateX(-50%) scale(${scale})`;
        scaleWrapper.style.left = '50%';
        viewport.style.height = `${Math.ceil(PAGE_H * scale)}px`;
      };

      const showMobilePage = (nextIndex, direction) => {
        if (animating || nextIndex < 0 || nextIndex >= pages.length || nextIndex === mobileIndex) return;
        animating = true;

        const oldPage = pages[mobileIndex];
        const newPage = pages[nextIndex];
        const turnClass = direction === 'prev' ? 'mobile-turn-prev' : 'mobile-turn-next';

        newPage.classList.add('mobile-active');
        newPage.setAttribute('aria-hidden', 'false');
        oldPage.classList.add(turnClass);

        const finish = () => {
          oldPage.classList.remove('mobile-active', 'mobile-turn-next', 'mobile-turn-prev');
          oldPage.setAttribute('aria-hidden', 'true');
          mobileIndex = nextIndex;
          updateStatus(mobileIndex);
          animating = false;
        };

        if (reducedMotion) finish();
        else window.setTimeout(finish, 530);
      };

      prev.addEventListener('click', () => showMobilePage(mobileIndex - 1, 'prev'));
      next.addEventListener('click', () => showMobilePage(mobileIndex + 1, 'next'));

      book.addEventListener('touchstart', (event) => {
        const t = event.touches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
      }, { passive: true });

      book.addEventListener('touchend', (event) => {
        if (touchStartX == null || touchStartY == null) return;
        const t = event.changedTouches[0];
        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;
        touchStartX = touchStartY = null;
        if (Math.abs(dx) < 45 || Math.abs(dx) <= Math.abs(dy)) return;
        if (dx < 0) showMobilePage(mobileIndex + 1, 'next');
        else showMobilePage(mobileIndex - 1, 'prev');
      }, { passive: true });

      document.addEventListener('keydown', (event) => {
        const target = event.target;
        if (target && /INPUT|TEXTAREA|SELECT/.test(target.tagName)) return;
        if (event.key === 'ArrowLeft') showMobilePage(mobileIndex - 1, 'prev');
        if (event.key === 'ArrowRight') showMobilePage(mobileIndex + 1, 'next');
      });

      window.addEventListener('resize', scaleMobileBook, { passive: true });
      window.addEventListener('orientationchange', () => window.setTimeout(scaleMobileBook, 80), { passive: true });

      scaleMobileBook();
      updateStatus(0);
      return;
    }

    // DESKTOP: conservar exactamente el visor PageFlip de la version estable.
    if (!window.St || !window.St.PageFlip) {
      staticFallback(pages);
      return;
    }

    const pageFlip = new St.PageFlip(book, {
      width: PAGE_W,
      height: PAGE_H,
      size: 'stretch',
      minWidth: 300,
      maxWidth: PAGE_W,
      minHeight: 421,
      maxHeight: PAGE_H,
      maxShadowOpacity: .5,
      showCover: true,
      mobileScrollSupport: true,
      usePortrait: true,
      drawShadow: true,
      flippingTime: reducedMotion ? 120 : 920,
      autoSize: true,
      clickEventForward: true
    });

    pageFlip.loadFromHTML(pages);
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
  };

  // v16: paginar recien cuando imagenes Y webfonts hayan terminado de cargar.
  // Esto evita que dos telefonos calculen alturas distintas por usar una
  // fuente de fallback durante la medicion inicial.
  const startWhenGeometryIsStable = async () => {
    if (document.readyState !== 'complete') {
      await new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
    }

    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
        // Forzar especificamente las familias usadas por la maqueta.
        await Promise.all([
          document.fonts.load('400 18px "Noto Serif"'),
          document.fonts.load('700 18px "Noto Serif"'),
          document.fonts.load('900 24px "Playfair Display"'),
          document.fonts.load('600 14px "Libre Franklin"')
        ]);
      } catch (_) {
        // Si una fuente externa falla, continuamos con los fallbacks.
      }
    }

    // Un frame adicional garantiza que el navegador haya aplicado las
    // metricas finales antes de medir scrollHeight/clientHeight.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    init();
  };

  startWhenGeometryIsStable();
})();
