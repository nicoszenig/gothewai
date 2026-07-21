(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;

  /* ============================================================
     INTRO — phrases in sequence on dark, then slide up & reveal
     ============================================================ */
  const intro = document.getElementById('intro');
  const phrases = intro ? intro.querySelectorAll('.intro__phrase') : [];

  function finishIntro() {
    if (!intro.parentNode) return;
    intro.classList.add('is-leaving');
    body.classList.remove('preload');
    body.classList.add('ready');
    setTimeout(() => intro.remove(), 1000);
  }

  if (!intro || prefersReduced) {
    if (intro) intro.remove();
    body.classList.remove('preload');
    body.classList.add('ready');
  } else {
    const STEP = 950; // per-phrase screen time
    phrases.forEach((p, i) => {
      setTimeout(() => {
        phrases.forEach((q) => q.classList.remove('is-on'));
        if (i > 0) phrases[i - 1].classList.add('is-off');
        p.classList.add('is-on');
      }, 350 + i * STEP);
    });
    setTimeout(finishIntro, 350 + phrases.length * STEP + 250);
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
