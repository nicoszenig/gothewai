(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;

  /* ============================================================
     INTRO — las frases las anima el CSS inline del <head> (pinta
     sin esperar styles.css). El JS solo decide cuándo termina,
     esperando a que styles.css esté aplicado para no mostrar la
     página sin estilos. Se muestra una vez por sesión.
     ============================================================ */
  const intro = document.getElementById('intro');
  const INTRO_TOTAL = 3300;

  // Espera window.__cssLoaded (seteado por el onload del preload de
  // styles.css), con tope de 4s por si el CSS nunca llega
  function whenCss(cb) {
    const t0 = Date.now();
    (function poll() {
      if (window.__cssLoaded || Date.now() - t0 > 4000) return cb();
      setTimeout(poll, 80);
    })();
  }

  function finishIntro() {
    if (!intro || !intro.parentNode) return;
    whenCss(() => {
      intro.classList.add('is-leaving');
      body.classList.remove('preload');
      body.classList.add('ready');
      setTimeout(() => intro.remove(), 1000);
    });
  }

  let introSeen = false;
  try { introSeen = !!sessionStorage.getItem('wai-intro'); } catch (e) {}

  if (!intro || prefersReduced || introSeen) {
    whenCss(() => {
      if (intro) intro.remove();
      body.classList.remove('preload');
      body.classList.add('ready');
    });
  } else {
    try { sessionStorage.setItem('wai-intro', '1'); } catch (e) {}
    setTimeout(finishIntro, INTRO_TOTAL);
    intro.addEventListener('click', finishIntro);
  }

  /* ============================================================
     NAV — hairline once scrolled
     ============================================================ */
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ============================================================
     MENU MOBILE — hamburguesa, overlay, cierre por link/Escape
     ============================================================ */
  const burger = document.getElementById('burger');
  const mobmenu = document.getElementById('mobmenu');
  if (burger && mobmenu) {
    const setMenu = (open) => {
      body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    };
    burger.addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
    mobmenu.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => setMenu(false))
    );
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  /* ============================================================
     SCRAMBLE — mono labels decode from glyph noise on entry
     ============================================================ */
  const GLYPHS = '>|:&_}{)(#%?+*=@0123456789';
  function scramble(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    const original = el.textContent;
    const len = original.length;
    const DURATION = 900;
    const start = performance.now();
    function tick(now) {
      const t = Math.min((now - start) / DURATION, 1);
      const solved = Math.floor(t * len);
      let out = original.slice(0, solved);
      for (let i = solved; i < len; i++) {
        out += original[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = original;
    }
    requestAnimationFrame(tick);
  }

  /* ============================================================
     OBSERVERS — reveals, progress rules, scrambles
     ============================================================ */
  const reveals = document.querySelectorAll('.reveal');
  const rules = document.querySelectorAll('.section__rule');
  const scrambles = document.querySelectorAll('.scramble');

  if (prefersReduced || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-visible'));
    rules.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          if (el.classList.contains('scramble')) scramble(el);
          else el.classList.add('is-visible');
          io.unobserve(el);
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -40px 0px' }
    );
    reveals.forEach((el) => io.observe(el));
    rules.forEach((el) => io.observe(el));
    scrambles.forEach((el) => io.observe(el));
  }

  /* ============================================================
     SCROLLYTELLING — proceso: spacers drive the active step
     ============================================================ */
  const story = document.getElementById('story');
  if (story && !prefersReduced && 'IntersectionObserver' in window) {
    const num = document.getElementById('storyNum');
    const svgs = story.querySelectorAll('.story__svg');
    const steps = story.querySelectorAll('.story__step');
    const spacers = story.querySelectorAll('.story__spacer');

    function activate(i) {
      num.textContent = '/0' + (i + 1);
      svgs.forEach((s, j) => s.classList.toggle('is-active', j === i));
      steps.forEach((s, j) => s.classList.toggle('is-active', j === i));
    }

    const storyIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            activate(Number(entry.target.dataset.trigger));
          }
        });
      },
      { threshold: 0.5 }
    );
    spacers.forEach((s) => storyIO.observe(s));
  }
})();
