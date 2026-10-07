/**
 * Formulário CairoPet — uma pergunta por tela, agrupadas em 3 etapas; mobile first.
 *
 * - Cada avanço vira uma entrada no histórico, então o "voltar" do navegador
 *   (ou o gesto do Android) volta uma pergunta, sem perder nada.
 * - Rascunho salvo no aparelho a cada resposta e ao trocar de app/aba
 *   (localStorage por 24h; sem ele, sessionStorage).
 * - Teclado: não abre sozinho no celular; se já estiver aberto, segue para o
 *   próximo campo de texto. Com o teclado aberto, campo e botão ficam visíveis.
 * - Escolha única: tocar numa opção já avança. No computador, 1–9 escolhe a opção.
 * - "O que impede de vender mais": no máximo 2 escolhas (as demais ficam indisponíveis).
 * - Envio: espera a API confirmar o lead salvo (`ok` + `saved`) → dispara a conversão
 *   (`lead` no dataLayer → GTM → generate_lead/Lead, até 2 s) → só então abre /obrigado/.
 *   Falhou: fica na página, com o WhatsApp, e registra `form_error`.
 * - event_id: um por preenchimento. Nasce na primeira tentativa de envio, fica no
 *   rascunho e é reaproveitado em toda nova tentativa (erro de rede, timeout, 5xx,
 *   422, recarregar a página) — a planilha deduplica por ele. Só é apagado junto
 *   com o rascunho, depois de o servidor confirmar o lead.
 * - Funil (dataLayer, sem dados pessoais), por ETAPA (não por pergunta): form_step_view
 *   ao entrar em cada etapa, form_step ao concluir a etapa 1 e a 2 — cada um no máximo
 *   1× por preenchimento.
 */
import {
  DIFICULDADES_OPTIONS,
  MAX_DIFICULDADES,
  firstName,
  formatWhatsapp,
  normalizeInstagram,
  parseLead,
  validateLead,
  type Lead,
  type LeadErrors,
} from '../lib/lead-schema';
import { getAttribution } from './attribution';
import { track, trackLead } from './tracking';

const DRAFT_KEY = 'cp_lead_draft_v4';
/** Rascunhos do formulário anterior (16 perguntas): descartados. */
const OLD_DRAFT_KEYS = ['cp_lead_draft_v3'];
const DRAFT_TTL = 24 * 60 * 60 * 1000;
const SITUATIONS_KEY = 'cp_situacoes';
const NOT_SAVED = new Set(['website', 'consentimento']);
const MULTI = new Set(['dificuldades']);
/** Campos que o próprio site pode pré-preencher (situações marcadas na home): não provam interação. */
const PREFILLED = new Set(['dificuldades']);
const SUBMIT_LABEL = 'Quero vender mais';

interface Draft {
  ts: number;
  values: Record<string, string | string[]>;
  index: number;
  eventId?: string;
  /** Eventos de funil já enviados neste preenchimento. */
  funnel?: string[];
}

/**
 * Rascunho em que a pessoa de fato respondeu algo (ou já tentou enviar).
 * Rascunho vazio — página aberta e abandonada — não conta como formulário iniciado.
 */
function hasMeaningfulDraft(draft: Draft): boolean {
  if (draft.eventId) return true;
  return Object.entries(draft.values ?? {}).some(
    ([name, v]) => !PREFILLED.has(name) && (Array.isArray(v) ? v.length > 0 : String(v ?? '').trim() !== ''),
  );
}

/** Campos validados em cada tela (a ordem das telas vem do HTML). */
const STEP_FIELDS: Record<string, (keyof Lead)[]> = {
  loja: ['loja'],
  cidade: ['uf', 'cidade'],
  tipo: ['tipo_estabelecimento'],
  faturamento: ['faturamento'],
  dificuldades: ['dificuldades'],
  urgencia: ['urgencia'],
  decisao: ['poder_decisao'],
  nome: ['nome'],
  whatsapp: ['whatsapp'],
  instagram: ['instagram', 'consentimento'],
};

/** Etapas (grupos de perguntas): número da etapa = data-stage da tela. */
const STAGES = [
  { name: 'agropecuaria', label: 'Sua agropecuária' },
  { name: 'negocio', label: 'Seu negócio' },
  { name: 'dados', label: 'Seus dados' },
];

const timeout = (ms: number) => ('timeout' in AbortSignal ? AbortSignal.timeout(ms) : undefined);

function storage(kind: 'localStorage' | 'sessionStorage'): Storage | null {
  try {
    const s = window[kind];
    s.setItem('__t', '1');
    s.removeItem('__t');
    return s;
  } catch {
    return null;
  }
}

const uuid = () =>
  crypto?.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

const isTextField = (el: Element | null): el is HTMLInputElement | HTMLTextAreaElement =>
  !!el && ((el instanceof HTMLInputElement && !['radio', 'checkbox', 'submit', 'button', 'hidden'].includes(el.type)) || el instanceof HTMLTextAreaElement);

const plain = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export function initLeadForm() {
  const found = document.querySelector<HTMLFormElement>('[data-lead-form]');
  if (!found) return;
  const form: HTMLFormElement = found;
  const draftStore = storage('localStorage') ?? storage('sessionStorage');
  const touch = matchMedia('(pointer: coarse)').matches;

  const steps = [...form.querySelectorAll<HTMLElement>('[data-step]')];
  const total = steps.length;
  const $ = <T extends Element>(sel: string) => form.querySelector<T>(sel)!;
  const backButtons = [...form.querySelectorAll<HTMLButtonElement>('[data-back]')];
  const btnNext = $<HTMLButtonElement>('[data-next]');
  const btnSubmit = $<HTMLButtonElement>('[data-submit]');
  const submitLabel = $<HTMLElement>('[data-submit-label]');
  const status = $<HTMLElement>('[data-status]');
  const announce = $<HTMLElement>('[data-announce]');
  const segments = [...form.querySelectorAll<HTMLElement>('[data-seg]')];
  const countN = $<HTMLElement>('[data-count-n]');
  const countLabel = $<HTMLElement>('[data-count-label]');
  const actions = $<HTMLElement>('.lf__actions');
  const top = $<HTMLElement>('.lf__top');

  let index = 0;
  let started = false;
  let sending = false;
  let finished = false;
  /** event_id deste preenchimento (ver cabeçalho). */
  let eventId: string | null = null;
  const funnel = new Set<string>();
  let lastPointer = 0;
  // Teclado aberto no instante do toque em "Continuar" (antes do botão roubar o foco).
  let typingAtTap = false;

  /* Leitura ------------------------------------------------------------- */
  function raw(): Record<string, unknown> {
    const data = new FormData(form);
    const out: Record<string, unknown> = {};
    for (const key of new Set(data.keys())) {
      const values = data.getAll(key).map(String);
      out[key] = MULTI.has(key) ? values : values[0];
    }
    for (const key of MULTI) out[key] ??= [];
    return out;
  }
  const read = () => parseLead(raw());
  const controls = (name: string) =>
    [...form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`[name="${name}"]`)];

  /* Funil: cada evento no máximo 1× por preenchimento ------------------------ */
  function trackOnce(key: string, event: string, params: Record<string, string | number>) {
    if (funnel.has(key)) return;
    funnel.add(key);
    track(event, params);
    saveDraft();
  }
  const stepName = (i: number) => steps[i]?.dataset.step ?? '';
  /** Etapa (1–3) da tela i. */
  const stageOf = (i: number) => Number(steps[i]?.dataset.stage ?? 1);
  const stageScreens = (stage: number) => steps.filter((_, i) => stageOf(i) === stage).length;
  const posInStage = (i: number) => steps.slice(0, i).filter((_, j) => stageOf(j) === stageOf(i)).length;

  /* Erros: sempre junto da pergunta ------------------------------------------ */
  function setError(name: string, message: string | null) {
    const el = form.querySelector<HTMLElement>(`[data-err="${name}"]`);
    if (el) {
      el.textContent = message ?? '';
      el.hidden = !message;
    }
    for (const c of controls(name)) {
      if (c instanceof HTMLInputElement && ['radio', 'checkbox', 'hidden'].includes(c.type)) continue;
      c.setAttribute('aria-invalid', String(Boolean(message)));
    }
  }

  function showErrors(errors: LeadErrors, fields: (keyof Lead)[]) {
    for (const f of fields) setError(f, errors[f] ?? null);
    const first = fields.find((f) => errors[f]);
    if (!first) return;
    const control = controls(first)[0];
    const err = form.querySelector<HTMLElement>(`[data-err="${first}"]`);
    // No toque, não abre teclado só para mostrar o erro: rola até ele.
    if (touch && !isTextField(document.activeElement)) err?.scrollIntoView({ block: 'center' });
    else control?.focus();
  }

  /* Personalização ------------------------------------------------------ */
  function personalize() {
    const nome = firstName(read().nome);
    form.querySelectorAll<HTMLElement>('[data-fill="nome"]').forEach((n) => (n.textContent = nome));
    form.querySelectorAll<HTMLElement>('[data-greet]').forEach((n) => (n.hidden = !nome));
  }

  /* Limite de escolhas ------------------------------------------------------ */
  function syncLimits(announceLimit = false) {
    form.querySelectorAll<HTMLElement>('[data-max]').forEach((group) => {
      const max = Number(group.dataset.max);
      const boxes = [...group.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
      const n = boxes.filter((b) => b.checked).length;
      boxes.forEach((b) => (b.disabled = !b.checked && n >= max));
      const picked = group.querySelector<HTMLElement>('[data-picked]');
      if (picked) picked.textContent = String(n);
      if (announceLimit && n >= max) announce.textContent = `Você escolheu ${max} opções. Para trocar, desmarque uma.`;
    });
  }

  /* Teclado aberto: manter campo e botão visíveis --------------------------- */
  function keepVisible() {
    const vv = window.visualViewport;
    const field = document.activeElement;
    if (!vv || !isTextField(field) || !form.contains(field)) return;
    const visibleBottom = vv.offsetTop + vv.height;
    const headerBottom = top.getBoundingClientRect().bottom;
    const f = field.getBoundingClientRect();
    const btn = actions.getBoundingClientRect();
    // Prioridade: o campo. Depois, se couber, o botão logo abaixo dele.
    let delta = 0;
    if (f.bottom > visibleBottom - 12) delta = f.bottom - visibleBottom + 12;
    else if (btn.bottom > visibleBottom) delta = Math.min(btn.bottom - visibleBottom + 8, f.top - headerBottom - 12);
    if (f.top - delta < headerBottom + 8) delta = f.top - headerBottom - 8;
    if (Math.abs(delta) > 4) window.scrollBy({ top: delta, behavior: 'auto' });
  }
  window.visualViewport?.addEventListener('resize', () => requestAnimationFrame(keepVisible));
  form.addEventListener('focusin', (e) => {
    if (touch && isTextField(e.target as Element)) setTimeout(keepVisible, 320);
  });

  /* Navegação ------------------------------------------------------------ */
  function render(animate: boolean, keyboardWasOpen = false) {
    steps.forEach((s, i) => {
      s.hidden = i !== index;
      s.classList.toggle('is-enter', i === index && animate);
    });
    const step = steps[index];
    const stage = stageOf(index);
    const stageLabel = STAGES[stage - 1]?.label ?? '';
    // Cada barra é uma etapa: as anteriores cheias, a atual enche pergunta a pergunta.
    segments.forEach((seg, i) => {
      const n = i + 1;
      const fill = n < stage ? 1 : n > stage ? 0 : (posInStage(index) + 1) / stageScreens(stage);
      seg.style.width = `${fill * 100}%`;
    });
    countN.textContent = String(stage);
    countLabel.textContent = stageLabel;
    form.classList.toggle('is-first', index === 0);
    form.classList.toggle('is-last', index === total - 1);
    form.classList.toggle('is-choice', step.dataset.kind === 'choice');
    form.classList.add('is-ready');
    personalize();
    trackOnce(`view:${stage}`, 'form_step_view', { step: stage, step_name: STAGES[stage - 1]?.name ?? '' });
    if (!animate) return;

    announce.textContent = `Etapa ${stage} de ${STAGES.length}, ${stageLabel}: ${step.dataset.label ?? ''}`;
    window.scrollTo({ top: 0, behavior: 'auto' });

    const text = step.querySelector<HTMLInputElement>('input.in');
    // Celular: só mantém o teclado se ele já estava aberto. Computador: foca o campo.
    if (text && (!touch || keyboardWasOpen)) {
      text.focus({ preventScroll: true });
      return;
    }
    const q = step.querySelector<HTMLElement>('.st__q');
    if (q) {
      q.setAttribute('tabindex', '-1');
      q.focus({ preventScroll: true });
    }
  }

  function show(to: number, animate = true) {
    const keyboardWasOpen = isTextField(document.activeElement) || typingAtTap;
    typingAtTap = false;
    index = Math.max(0, Math.min(total - 1, to));
    // Aviso de erro de envio é da última pergunta: some ao trocar de tela.
    if (status.dataset.kind === 'error') status.hidden = true;
    render(animate, keyboardWasOpen);
    saveDraft();
  }

  /** Avançar: cria entrada no histórico (o "voltar" do navegador volta uma etapa). */
  function forward(to: number) {
    history.pushState({ cpStep: to }, '');
    show(to);
  }

  function back() {
    if (index === 0) return;
    if (history.state?.cpStep === index) history.back();
    else {
      history.replaceState({ cpStep: index - 1 }, '');
      show(index - 1);
    }
  }

  addEventListener('popstate', (e) => {
    const s = (e.state as { cpStep?: number } | null)?.cpStep;
    if (typeof s === 'number' && !finished) show(s);
  });

  function validStep(i: number, showIt = true): boolean {
    const fields = STEP_FIELDS[stepName(i)] ?? [];
    const errors = validateLead(read(), fields);
    if (showIt) showErrors(errors, fields);
    return !fields.some((f) => errors[f]);
  }

  function next() {
    if (!validStep(index)) return;
    // Última pergunta da etapa: etapa concluída.
    const stage = stageOf(index);
    if (stageOf(index + 1) !== stage) trackOnce(`done:${stage}`, 'form_step', { step: stage, step_name: STAGES[stage - 1]?.name ?? '' });
    forward(index + 1);
  }

  btnNext.addEventListener('pointerdown', () => (typingAtTap = isTextField(document.activeElement)));
  btnNext.addEventListener('click', next);
  backButtons.forEach((b) => b.addEventListener('click', back));

  // Enter / "Próximo" do teclado: vai ao próximo campo vazio da tela ou avança.
  // No computador, 1–9 escolhe opção.
  form.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    const step = steps[index];
    if (e.key === 'Enter') {
      if (t.tagName === 'BUTTON' || t.tagName === 'A') return;
      e.preventDefault();
      if (isTextField(t) || t instanceof HTMLSelectElement) {
        const fields = [...step.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input.in, select.in')];
        const nextEmpty = fields.slice(fields.indexOf(t as HTMLInputElement) + 1).find((f) => !f.value);
        if (nextEmpty) {
          nextEmpty.focus();
          return;
        }
      }
      if (index < total - 1) next();
      else form.requestSubmit();
      return;
    }
    const inChoice = t instanceof HTMLInputElement && (t.type === 'radio' || t.type === 'checkbox');
    if (/^[1-9]$/.test(e.key) && (inChoice || !['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) {
      const opt = [...step.querySelectorAll<HTMLInputElement>('.opt input')][Number(e.key) - 1];
      if (!opt || opt.disabled) return;
      e.preventDefault();
      opt.checked = opt.type === 'checkbox' ? !opt.checked : true;
      opt.focus();
      opt.dispatchEvent(new Event('change', { bubbles: true }));
      if (opt.type === 'radio' && step.hasAttribute('data-auto')) setTimeout(() => steps[index] === step && next(), 200);
    }
  });

  // Toque numa opção única avança sozinho (com o teclado físico, não).
  form.addEventListener('pointerdown', () => (lastPointer = Date.now()));
  form.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.type !== 'radio') return;
    const step = steps[index];
    if (!step.hasAttribute('data-auto') || !step.contains(input)) return;
    if (Date.now() - lastPointer > 1000) return;
    setTimeout(() => steps[index] === step && next(), 220);
  });

  /* Campos --------------------------------------------------------------- */
  const whatsapp = $<HTMLInputElement>('[name="whatsapp"]');
  whatsapp.addEventListener('input', () => {
    const f = formatWhatsapp(whatsapp.value);
    if (f !== whatsapp.value) whatsapp.value = f;
  });

  const instagram = $<HTMLInputElement>('[name="instagram"]');
  instagram.addEventListener('change', () => (instagram.value = normalizeInstagram(instagram.value)));

  form.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement;
    if (!started) {
      started = true;
      track('form_start', { first_field: t.name });
    }
    if (t.name) setError(t.name, null);
    if (status.dataset.kind === 'error') status.hidden = true;
    saveDraft();
  });
  form.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name) setError(t.name, null);
    if (t.type === 'checkbox') syncLimits(true);
    saveDraft();
  });

  // Sugestão de cidades do IBGE ao escolher o estado; grafia oficial quando bater.
  const uf = $<HTMLSelectElement>('[name="uf"]');
  const cidade = $<HTMLInputElement>('[name="cidade"]');
  const datalist = $<HTMLDataListElement>('#lf-cidades');
  const cache = new Map<string, string[]>();
  function canonCity() {
    const names = cache.get(uf.value);
    const typed = plain(cidade.value);
    if (!names || !typed) return;
    const hit = names.find((n) => plain(n) === typed);
    if (hit && hit !== cidade.value) {
      cidade.value = hit;
      saveDraft();
    }
  }
  async function loadCities() {
    if (!uf.value) return;
    try {
      let names = cache.get(uf.value);
      if (!names) {
        const res = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf.value}/municipios?orderBy=nome`,
          { signal: timeout(5000) },
        );
        if (!res.ok) return;
        names = ((await res.json()) as { nome: string }[]).map((m) => m.nome);
        cache.set(uf.value, names);
      }
      datalist.replaceChildren(...names.map((n) => Object.assign(document.createElement('option'), { value: n })));
      canonCity();
    } catch {
      /* sem sugestão: campo continua livre */
    }
  }
  uf.addEventListener('change', loadCities);
  cidade.addEventListener('change', canonCity);

  /* Rascunho: sobrevive a recarregar, trocar de app e voltar ----------------- */
  let timer: number | undefined;
  function flush() {
    // Só guarda rascunho depois de interação real: abrir e sair não cria rascunho vazio.
    if (!draftStore || finished || (!started && !eventId)) return;
    clearTimeout(timer);
    const values = raw();
    for (const k of NOT_SAVED) delete values[k];
    const draft: Draft = {
      ts: Date.now(),
      values: values as Draft['values'],
      index,
      funnel: [...funnel],
      ...(eventId ? { eventId } : {}),
    };
    try {
      draftStore.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* armazenamento cheio: segue sem salvar */
    }
  }
  function saveDraft() {
    if (!draftStore) return;
    clearTimeout(timer);
    timer = window.setTimeout(flush, 150);
  }
  addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush());

  function apply(values: Record<string, string | string[]>) {
    for (const [name, value] of Object.entries(values)) {
      if (NOT_SAVED.has(name)) continue;
      const vals = Array.isArray(value) ? value : [value];
      for (const c of controls(name)) {
        if (c instanceof HTMLInputElement && (c.type === 'radio' || c.type === 'checkbox')) c.checked = vals.includes(c.value);
        else c.value = vals[0] ?? '';
      }
    }
  }

  function restore() {
    let restored = false;
    try {
      for (const k of OLD_DRAFT_KEYS) draftStore?.removeItem(k);
      const saved = JSON.parse(draftStore?.getItem(DRAFT_KEY) ?? 'null') as Draft | null;
      if (saved && Date.now() - saved.ts < DRAFT_TTL && hasMeaningfulDraft(saved)) {
        apply(saved.values);
        restored = true;
        // Já respondeu antes: o form_start daquele preenchimento já foi registrado.
        started = true;
        (saved.funnel ?? []).forEach((k) => funnel.add(k));
        // Mesmo preenchimento: um novo envio reaproveita o event_id da tentativa anterior.
        if (typeof saved.eventId === 'string' && saved.eventId) eventId = saved.eventId;
        // Volta para a etapa em que parou, sem pular etapa incompleta.
        let target = 0;
        while (target < Math.min(saved.index, total - 1) && validStep(target, false)) target++;
        index = target;
      } else if (saved) {
        draftStore?.removeItem(DRAFT_KEY);
      }
    } catch {
      draftStore?.removeItem(DRAFT_KEY);
    }
    // Situações marcadas na home chegam pré-marcadas (no máximo 2, as primeiras da lista).
    if (!restored || !(raw().dificuldades as string[]).length) {
      try {
        const sit = JSON.parse(localStorage.getItem(SITUATIONS_KEY) ?? 'null') as { dificuldades?: string[] } | null;
        const valid = (sit?.dificuldades ?? []).filter((d) => (DIFICULDADES_OPTIONS as readonly string[]).includes(d));
        if (valid.length) apply({ dificuldades: valid.slice(0, MAX_DIFICULDADES) });
      } catch {
        /* ignora */
      }
    }
    if (uf.value) loadCities();
  }

  /* Envio ---------------------------------------------------------------- */
  const statusText = $<HTMLElement>('[data-status-text]');
  const statusWa = $<HTMLAnchorElement>('[data-status-wa]');
  // Celular: abre direto no app do WhatsApp (mesma aba). Computador: nova aba.
  if (touch) statusWa.removeAttribute('target');

  const SEND_ERROR =
    '<strong>Não conseguimos enviar seus dados.</strong> Tente novamente ou fale com a gente pelo WhatsApp.';

  function setStatus(kind: 'error' | 'success', html: string, whatsapp = false) {
    status.dataset.kind = kind;
    statusText.innerHTML = html;
    statusWa.hidden = !whatsapp;
    status.hidden = false;
  }

  function loading(on: boolean) {
    btnSubmit.disabled = on;
    backButtons.forEach((b) => (b.disabled = on));
    btnSubmit.toggleAttribute('data-loading', on);
    submitLabel.textContent = on ? 'Enviando...' : SUBMIT_LABEL;
  }

  /** Falha: fica na página, mantém as respostas, libera o botão e oferece o WhatsApp. */
  function sendFailed(error_type: 'network' | 'timeout' | 'server', httpStatus = 0) {
    sending = false;
    loading(false);
    setStatus('error', SEND_ERROR, true);
    track('form_error', { error_type, status: httpStatus });
  }

  const stepWithError = (errors: LeadErrors) =>
    steps.findIndex((s) => (STEP_FIELDS[s.dataset.step ?? ''] ?? []).some((f) => errors[f]));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return; // sem duplo toque
    const lead = read();
    const errors = validateLead(lead);
    const bad = stepWithError(errors);
    if (bad !== -1) {
      if (bad !== index) forward(bad);
      showErrors(errors, STEP_FIELDS[stepName(bad)]);
      return;
    }

    // Botão desabilitado já no clique, antes de qualquer espera.
    sending = true;
    loading(true);
    status.hidden = true;
    // Um event_id por preenchimento: criado na primeira tentativa, gravado no rascunho
    // antes do envio e reaproveitado em qualquer nova tentativa. Se a planilha salvou
    // mas a resposta se perdeu, o reenvio cai na deduplicação em vez de virar 2 linhas.
    if (!eventId) eventId = uuid();
    const id = eventId;
    flush();
    track('form_submit', { step: total });

    let res: Response;
    let data: { ok?: boolean; saved?: boolean; errors?: LeadErrors } = {};
    try {
      // keepalive: a requisição termina mesmo se a pessoa fechar ou trocar de página.
      // 25 s: mais que o pior caso da API (planilha 15 s + Conversions API 4 s), para o
      // navegador não desistir antes de o servidor saber se o lead foi salvo.
      res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...raw(), tracking: { ...getAttribution(), event_id: id } }),
        keepalive: true,
        signal: timeout(25000),
      });
      data = (await res.json().catch(() => ({}))) as typeof data;
    } catch (err) {
      const name = (err as Error)?.name;
      sendFailed(name === 'TimeoutError' || name === 'AbortError' ? 'timeout' : 'network');
      return;
    }

    // Validação recusada no servidor: volta para a etapa com problema, respostas mantidas.
    if (res.status === 422 && data.errors) {
      sending = false;
      loading(false);
      track('form_error', { error_type: 'validation', status: 422, fields: Object.keys(data.errors).join(',') });
      const i = stepWithError(data.errors);
      if (i !== -1) {
        if (i !== index) forward(i);
        showErrors(data.errors, STEP_FIELDS[stepName(i)]);
      } else {
        setStatus('error', SEND_ERROR, true);
      }
      return;
    }

    // Erro (5xx, resposta inválida): event_id continua no rascunho para o reenvio.
    if (!res.ok || data.ok !== true) {
      sendFailed('server', res.status);
      return;
    }

    // Envio aceito. Limpa rascunho + event_id: um novo preenchimento terá outro ID.
    finished = true;
    eventId = null;
    clearTimeout(timer);
    draftStore?.removeItem(DRAFT_KEY);
    try {
      localStorage.removeItem(SITUATIONS_KEY);
    } catch {
      /* ignora */
    }
    btnSubmit.removeAttribute('data-loading');
    submitLabel.textContent = 'Enviado';

    // Conversão (lead → GTM → GA4 generate_lead + Meta Lead) SOMENTE com `saved: true`,
    // a confirmação de lead salvo. Envio descartado (`ok` sem `saved`) segue para a
    // página de obrigado como antes, mas sem conversão.
    if (data.saved === true) await trackLead(id);
    location.replace('/obrigado/');
  });

  /* Início --------------------------------------------------------------- */
  restore();
  syncLimits();
  history.replaceState({ cpStep: index }, '');
  render(false);
  if (!touch && index === 0) form.querySelector<HTMLInputElement>('#f-loja')?.focus({ preventScroll: true });

  const erro = new URLSearchParams(location.search).get('erro');
  if (erro) {
    show(total - 1, false);
    if (erro === 'formulario') setStatus('error', '<strong>Faltou alguma informação.</strong> Confira as respostas e envie de novo.');
    else setStatus('error', SEND_ERROR, true);
  }
}
