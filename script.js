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
     SCRAMBLE — el texto se decodifica desde glifos aleatorios.
     Reutilizable: labels al entrar en viewport y links del nav
     en hover.
     ============================================================ */
  const GLYPHS = '>|:&_}{)(#%?+*=@0123456789';
  function scramble(el) {
    if (el.dataset.scrambling) return;
    el.dataset.scrambling = '1';
    const original = el.dataset.orig || el.textContent;
    el.dataset.orig = original;
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
      else {
        el.textContent = original;
        delete el.dataset.scrambling;
      }
    }
    requestAnimationFrame(tick);
  }

  // Scramble al pasar el mouse por los links del nav
  if (!prefersReduced) {
    document.querySelectorAll('.nav__links a').forEach((a) => {
      a.addEventListener('mouseenter', () => scramble(a));
    });
  }

  /* ============================================================
     RELOJ — hora de Buenos Aires en vivo (nav y footer)
     ============================================================ */
  const clocks = document.querySelectorAll('.js-clock');
  if (clocks.length) {
    const fmt = new Intl.DateTimeFormat('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
    const tickClock = () => {
      const t = fmt.format(new Date());
      clocks.forEach((c) => { c.textContent = t; });
    };
    tickClock();
    setInterval(tickClock, 1000);
  }

  /* ============================================================
     CHAT — la conversación del hero se escribe sola, en loop
     ============================================================ */
  const chatEl = document.getElementById('chat');
  if (chatEl && !prefersReduced) {
    const msgs = Array.from(chatEl.querySelectorAll('.chat__msg'));
    const typing = chatEl.querySelector('.chat__typing');
    const TYPE = 1000, GAP = 550, HOLD = 4000;
    chatEl.classList.add('chat--live');

    function step(i) {
      if (i >= msgs.length) {
        typing.classList.remove('is-shown');
        setTimeout(() => {
          // el primer mensaje queda fijo; solo se reinician las respuestas
          msgs.slice(1).forEach((m) => m.classList.remove('is-shown'));
          setTimeout(() => step(1), 800);
        }, HOLD);
        return;
      }
      const isOut = msgs[i].classList.contains('chat__msg--out');
      typing.classList.toggle('chat__typing--out', isOut);
      // flota sobre el hueco del mensaje que está por aparecer
      typing.style.top = msgs[i].offsetTop + 'px';
      typing.style.left = isOut ? 'auto' : '0';
      typing.style.right = isOut ? '0' : 'auto';
      typing.classList.add('is-shown');
      setTimeout(() => {
        typing.classList.remove('is-shown');
        msgs[i].classList.add('is-shown');
        setTimeout(() => step(i + 1), GAP);
      }, TYPE);
    }

    // Arranca cuando el sitio ya se reveló (post-intro); el primer
    // mensaje ya está visible, se animan solo las respuestas
    (function waitReady() {
      if (body.classList.contains('ready')) setTimeout(() => step(1), 900);
      else setTimeout(waitReady, 200);
    })();
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
