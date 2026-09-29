/** Header com fio ao rolar, CTA fixo no mobile e entrada suave (uma vez). */

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function header() {
  const el = document.querySelector<HTMLElement>('[data-header]');
  if (!el) return;
  const update = () => el.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', update, { passive: true });
  update();
}

/** Aparece depois do CTA da hero; some nas áreas que já têm CTA (final, rodapé). */
function sticky() {
  const bar = document.querySelector<HTMLElement>('[data-sticky]');
  const hero = document.getElementById('hero-cta');
  if (!bar || !hero) return;
  let past = false;
  const blocking = new Set<Element>();
  const render = () => {
    const on = past && blocking.size === 0;
    bar.classList.toggle('is-on', on);
    bar.toggleAttribute('inert', !on);
  };
  new IntersectionObserver(([e]) => {
    past = !e.isIntersecting && e.boundingClientRect.top < 0;
    render();
  }).observe(hero);
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.isIntersecting ? blocking.add(e.target) : blocking.delete(e.target);
    render();
  });
  document.querySelectorAll('[data-no-sticky]').forEach((n) => io.observe(n));
}

function reveal() {
  const nodes = document.querySelectorAll<HTMLElement>('[data-in]');
  if (reduced || !('IntersectionObserver' in window)) {
    nodes.forEach((n) => n.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  nodes.forEach((n) => io.observe(n));
}

export function initUi() {
  header();
  sticky();
  reveal();
}
