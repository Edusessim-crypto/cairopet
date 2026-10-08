/**
 * Apresentação comercial (/apresentacao): um slide por tela.
 *
 * - Teclado: → ↓ PageDown Espaço (próximo) · ← ↑ PageUp Shift+Espaço (anterior)
 *   · Home/End · F (tela cheia).
 * - Roda/trackpad: uma troca por gesto (a inércia do trackpad não pula slides).
 * - Celular: swipe para os lados.
 * - URL: ?slide=N (replaceState, sem recarregar).
 * O slide inicial já vem ativo do script inline do Deck (sem piscar o 1º).
 * Números com [data-count] animam de data-count-from (padrão 0) até o valor sempre que
 * o slide entra (data-count-delay, em ms, adia o início para casar com a animação do slide).
 */

const IDLE_MS = 2600; // desktop: controles somem depois disso sem mexer o mouse
const WHEEL_GAP_MS = 220; // pausa que separa um gesto do próximo
const WHEEL_MIN_MS = 450; // intervalo mínimo entre trocas pela roda (≈ duração da transição)
const WHEEL_THRESHOLD = 24;
const SWIPE_MIN_PX = 48;
const SWIPE_MAX_MS = 900;
const COUNT_MS = 1100;
const COUNT_DELAY_MS = 250;

type FsDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };

const pad = (n: number) => String(n).padStart(2, '0');
const formatCount = (n: number) => Math.round(n).toLocaleString('pt-BR');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

let stopCount: (() => void) | null = null;

/** Conta os [data-count] do slide; o HTML já traz o valor final (sem JS, leitor de tela). */
function countUp(slide: HTMLElement) {
  stopCount?.();
  const items = [...slide.querySelectorAll<HTMLElement>('[data-count]')].map((el) => ({
    el,
    from: Number(el.dataset.countFrom ?? 0),
    to: Number(el.dataset.count),
    delay: Number(el.dataset.countDelay ?? COUNT_DELAY_MS),
  }));
  if (!items.length) return;

  const finish = () => {
    for (const { el, to } of items) el.textContent = formatCount(to);
  };
  if (reducedMotion.matches) return finish();

  for (const { el, from } of items) el.textContent = formatCount(from);
  const start = performance.now();
  let raf = 0;
  const tick = (now: number) => {
    let running = false;
    for (const { el, from, to, delay } of items) {
      const t = Math.min(Math.max((now - start - delay) / COUNT_MS, 0), 1);
      if (t < 1) running = true;
      el.textContent = formatCount(from + (to - from) * (1 - (1 - t) ** 3));
    }
    if (running) raf = requestAnimationFrame(tick);
    else stopCount = null;
  };
  raf = requestAnimationFrame(tick);

  stopCount = () => {
    cancelAnimationFrame(raf);
    finish();
    stopCount = null;
  };
}

export function initPresentation() {
  const deck = document.querySelector<HTMLElement>('[data-deck]');
  if (!deck) return;

  const slides = [...deck.querySelectorAll<HTMLElement>('[data-slide]')];
  const total = slides.length;
  const counter = deck.querySelector<HTMLElement>('[data-current]');
  const progress = deck.querySelector<HTMLElement>('[data-progress]');
  const live = deck.querySelector<HTMLElement>('[data-live]');
  const ctlPrev = deck.querySelector<HTMLButtonElement>('[data-controls] [data-prev]');
  const ctlNext = deck.querySelector<HTMLButtonElement>('[data-controls] [data-next]');
  let index = Math.min(Math.max(Number(deck.dataset.index) || 0, 0), total - 1);

  // Ordem de entrada dentro de cada slide: rótulo → título → conteúdo → visual
  for (const slide of slides) {
    slide.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el, i) => el.style.setProperty('--i', String(i)));
  }

  const openDialog = () => deck.querySelector('dialog[open]');

  // Slide que não coube (celular, janela baixa): fade atrás dos controles até o fim do conteúdo
  function syncScrollable() {
    const s = slides[index];
    const more = s.scrollHeight - s.clientHeight - s.scrollTop > 2;
    deck!.classList.toggle('is-scrollable', more);
  }
  for (const s of slides) s.addEventListener('scroll', () => s === slides[index] && syncScrollable(), { passive: true });
  addEventListener('resize', syncScrollable, { passive: true });

  function syncUrl() {
    const url = new URL(location.href);
    if (index === 0) url.searchParams.delete('slide');
    else url.searchParams.set('slide', String(index + 1));
    const next = url.pathname + url.search + url.hash;
    if (next !== location.pathname + location.search + location.hash) history.replaceState(history.state, '', next);
  }

  function render(announce: boolean) {
    const slide = slides[index];
    deck!.dataset.theme = slide.dataset.theme ?? 'dark';
    deck!.dataset.index = String(index);
    if (counter) counter.textContent = pad(index + 1);
    progress?.style.setProperty('--progress', String((index + 1) / total));
    if (ctlPrev) ctlPrev.disabled = index === 0;
    if (ctlNext) ctlNext.disabled = index === total - 1;
    if (announce && live) live.textContent = `Slide ${index + 1} de ${total}: ${slide.dataset.name ?? ''}`;
    syncUrl();
  }

  function go(to: number) {
    const target = Math.min(Math.max(to, 0), total - 1);
    if (target === index || openDialog()) return;

    const from = slides[index];
    const next = slides[target];
    const hadFocus = from.contains(document.activeElement);

    // A direção precisa valer antes de o slide entrar (de baixo ao avançar, de cima ao voltar)
    deck!.dataset.dir = target > index ? 'next' : 'prev';
    next.scrollTop = 0;
    void next.offsetWidth;

    from.classList.remove('is-active');
    from.inert = true;
    next.inert = false;
    next.classList.add('is-active');
    index = target;
    render(true);
    countUp(next);
    syncScrollable();

    if (hadFocus) next.focus({ preventScroll: true });
  }

  const step = (delta: number) => go(index + delta);

  // Botões -------------------------------------------------------------------------
  deck.querySelectorAll<HTMLElement>('[data-next]').forEach((b) => b.addEventListener('click', () => step(1)));
  deck.querySelectorAll<HTMLElement>('[data-prev]').forEach((b) => b.addEventListener('click', () => step(-1)));

  // Teclado ------------------------------------------------------------------------
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || openDialog()) return;
    const target = e.target instanceof Element ? e.target : null;
    if (target?.closest('input:not([type="checkbox"]), textarea, select, [contenteditable]')) return;
    const onControl = !!target?.closest('button, a[href], input, label, summary');

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case 'PageDown':
        step(1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        step(-1);
        break;
      case ' ':
      case 'Spacebar':
        if (onControl) return; // espaço num botão/checkbox aciona o próprio controle
        step(e.shiftKey ? -1 : 1);
        break;
      case 'Home':
        go(0);
        break;
      case 'End':
        go(total - 1);
        break;
      case 'f':
      case 'F':
        toggleFullscreen();
        break;
      default:
        return;
    }
    e.preventDefault();
  });

  // Roda do mouse / trackpad ---------------------------------------------------------
  let wheelSum = 0;
  let lastWheel = 0;
  let lastNav = 0;
  let wheelLocked = false;

  const canScroll = (el: HTMLElement, dy: number) =>
    dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0;

  deck.addEventListener(
    'wheel',
    (e) => {
      if (openDialog() || e.ctrlKey) return;
      const now = performance.now();
      const gap = now - lastWheel;
      lastWheel = now;
      const vertical = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
      const delta = vertical ? e.deltaY : e.deltaX;

      // Slide que não coube na janela (tela baixa, celular): rola o conteúdo primeiro.
      if (vertical && canScroll(slides[index], e.deltaY)) {
        wheelLocked = true;
        lastNav = 0;
        wheelSum = 0;
        return;
      }

      e.preventDefault();
      if (wheelLocked) {
        if (gap < WHEEL_GAP_MS || now - lastNav < WHEEL_MIN_MS) return;
        wheelLocked = false;
      }
      if (gap > WHEEL_GAP_MS) wheelSum = 0;
      wheelSum += delta;
      if (Math.abs(wheelSum) < WHEEL_THRESHOLD) return;

      step(Math.sign(wheelSum));
      wheelSum = 0;
      wheelLocked = true;
      lastNav = now;
    },
    { passive: false },
  );

  // Swipe (celular/tablet) ------------------------------------------------------------
  let touchX = 0;
  let touchY = 0;
  let touchT = 0;
  let tracking = false;

  deck.addEventListener(
    'touchstart',
    (e) => {
      tracking = e.touches.length === 1 && !openDialog();
      if (!tracking) return;
      touchX = e.touches[0].clientX;
      touchY = e.touches[0].clientY;
      touchT = performance.now();
    },
    { passive: true },
  );

  deck.addEventListener('touchcancel', () => (tracking = false), { passive: true });

  deck.addEventListener(
    'touchend',
    (e) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchX;
      const dy = t.clientY - touchY;
      if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy) * 1.4) return;
      if (performance.now() - touchT > SWIPE_MAX_MS) return;
      step(dx < 0 ? 1 : -1);
    },
    { passive: true },
  );

  // Controles quase invisíveis com o mouse parado (só desktop) ---------------------------
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let idleTimer = 0;
  const wake = () => {
    deck.classList.remove('is-idle');
    window.clearTimeout(idleTimer);
    if (finePointer.matches) idleTimer = window.setTimeout(() => deck.classList.add('is-idle'), IDLE_MS);
  };
  deck.addEventListener('pointermove', wake, { passive: true });
  deck.addEventListener('pointerdown', wake, { passive: true });
  wake();

  // Tela cheia ----------------------------------------------------------------------
  const doc = document as FsDocument;
  const root = document.documentElement as FsElement;
  const fsButton = deck.querySelector<HTMLButtonElement>('[data-fullscreen]');
  const fsSupported = !!(doc.fullscreenEnabled || doc.webkitFullscreenEnabled);
  const isFullscreen = () => !!(doc.fullscreenElement || doc.webkitFullscreenElement);

  function toggleFullscreen() {
    if (!fsSupported) return;
    try {
      const result = isFullscreen()
        ? doc.exitFullscreen
          ? doc.exitFullscreen()
          : doc.webkitExitFullscreen?.()
        : root.requestFullscreen
          ? root.requestFullscreen({ navigationUI: 'hide' })
          : root.webkitRequestFullscreen?.();
      Promise.resolve(result).catch(() => {});
    } catch {
      /* navegador recusou (ex.: sem gesto do usuário) */
    }
  }

  function syncFullscreen() {
    const on = isFullscreen();
    deck!.classList.toggle('is-fullscreen', on);
    if (fsButton) {
      fsButton.setAttribute('aria-label', on ? 'Sair da tela cheia' : 'Entrar em tela cheia');
      fsButton.title = on ? 'Sair da tela cheia (F)' : 'Tela cheia (F)';
    }
  }

  if (fsButton && fsSupported) {
    fsButton.hidden = false;
    fsButton.addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('webkitfullscreenchange', syncFullscreen);
  }

  // Planos: seletor no celular e "Ver tudo o que está incluso" -----------------------------
  const plans = deck.querySelector<HTMLElement>('[data-plans]');
  const tabs = [...deck.querySelectorAll<HTMLButtonElement>('[data-plan-tab]')];
  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      if (plans && tab.dataset.planTab) plans.dataset.active = tab.dataset.planTab;
      for (const t of tabs) t.setAttribute('aria-pressed', String(t === tab));
    });
  }

  deck.querySelectorAll<HTMLButtonElement>('[data-plan-open]').forEach((button) => {
    button.addEventListener('click', () => {
      deck.querySelector<HTMLDialogElement>(`[data-plan-dialog="${button.dataset.planOpen}"]`)?.showModal();
    });
  });

  deck.querySelectorAll<HTMLDialogElement>('[data-plan-dialog]').forEach((dialog) => {
    dialog.querySelector('[data-plan-close]')?.addEventListener('click', () => dialog.close());
    // Clique fora do conteúdo fecha
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
  });

  render(false);
  syncScrollable();
  // Fontes e fotos mudam a altura do conteúdo depois do primeiro cálculo
  document.fonts?.ready.then(syncScrollable);
  addEventListener('load', syncScrollable);
  countUp(slides[index]);
}
