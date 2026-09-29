import {
  firstName,
  formatWhatsapp,
  normalizeInstagram,
  parseLead,
  validateLead,
  type Lead,
  type LeadErrors,
} from '../lib/lead-schema';
import { getAttribution } from './attribution';
import { track } from './tracking';

const DRAFT_KEY = 'cp_lead_draft_v2';
const PENDING_KEY = 'cp_lead_pending';
const NAME_KEY = 'cp_lead_nome';
const SITUATIONS_KEY = 'cp_situacoes';
const NOT_SAVED = new Set(['website', 'consentimento']);

/** Campos validados em cada etapa (a ordem das etapas vem do HTML). */
const STEP_FIELDS: Record<string, (keyof Lead)[]> = {
  nome: ['nome'],
  whatsapp: ['whatsapp'],
  instagram: [],
  cidade: ['cidade', 'uf'],
  loja: ['loja'],
  tipo: ['tipo_negocio'],
  tamanho: ['tamanho'],
  faturamento: ['faturamento'],
  marketing: ['marketing_atual'],
  anuncios: ['investimento_anuncios'],
  dores: ['dores'],
  objetivo: ['objetivo'],
  momento: ['momento'],
  decisor: ['decisor'],
  investimento: ['faixa_investimento'],
  contexto: [],
  lgpd: ['consentimento'],
  envio: [],
};

const timeout = (ms: number) => ('timeout' in AbortSignal ? AbortSignal.timeout(ms) : undefined);

function session(): Storage | null {
  try {
    sessionStorage.setItem('__t', '1');
    sessionStorage.removeItem('__t');
    return sessionStorage;
  } catch {
    return null;
  }
}

const uuid = () =>
  crypto?.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

export function initLeadForm() {
  const found = document.querySelector<HTMLFormElement>('[data-lead-form]');
  if (!found) return;
  const form: HTMLFormElement = found;
  const store = session();

  const steps = [...form.querySelectorAll<HTMLElement>('[data-step]')];
  const total = steps.length;
  const $ = <T extends Element>(sel: string) => form.querySelector<T>(sel)!;
  const btnNext = $<HTMLButtonElement>('[data-next]');
  const btnBack = $<HTMLButtonElement>('[data-back]');
  const btnSubmit = $<HTMLButtonElement>('[data-submit]');
  const submitLabel = $<HTMLElement>('[data-submit-label]');
  const status = $<HTMLElement>('[data-status]');
  const announce = $<HTMLElement>('[data-announce]');
  const bar = $<HTMLElement>('[data-bar]');
  const whereN = $<HTMLElement>('[data-where-n]');
  const whereLabel = $<HTMLElement>('[data-where-label]');

  let index = 0;
  let started = false;
  let sending = false;
  let lastPointer = 0;

  /* Leitura --------------------------------------------------------------- */
  function raw(): Record<string, unknown> {
    const data = new FormData(form);
    const out: Record<string, unknown> = {};
    for (const key of new Set(data.keys())) {
      const values = data.getAll(key).map(String);
      out[key] = key === 'dores' ? values : values[0];
    }
    return out;
  }
  const read = () => parseLead(raw());
  const controls = (name: string) => [...form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`[name="${name}"]`)];

  /* Erros ----------------------------------------------------------------- */
  function setError(name: string, message: string | null) {
    const el = form.querySelector<HTMLElement>(`[data-err="${name}"]`);
    if (el) {
      el.textContent = message ?? '';
      el.hidden = !message;
    }
    for (const c of controls(name)) {
      if (c instanceof HTMLInputElement && c.type === 'radio') continue;
      if (c instanceof HTMLInputElement && c.type === 'checkbox' && name !== 'consentimento') continue;
      c.setAttribute('aria-invalid', String(Boolean(message)));
    }
  }

  function showErrors(errors: LeadErrors, fields: (keyof Lead)[]) {
    for (const f of fields) setError(f, errors[f] ?? null);
    const first = fields.find((f) => errors[f]);
    if (first) controls(first)[0]?.focus();
  }

  /* Personalização -------------------------------------------------------- */
  function personalize() {
    const lead = read();
    const nome = firstName(lead.nome);
    form.querySelectorAll<HTMLElement>('[data-fill="nome"]').forEach((n) => (n.textContent = nome));
    form.querySelectorAll<HTMLElement>('[data-greet]').forEach((n) => (n.hidden = !nome));
    form.querySelectorAll<HTMLElement>('[data-fill="cidade"]').forEach((n) => (n.textContent = lead.cidade));
    form.querySelectorAll<HTMLElement>('[data-when="cidade"]').forEach((n) => (n.hidden = !lead.cidade));
    const show: Record<string, string> = {
      nome: lead.nome,
      whatsapp: formatWhatsapp(lead.whatsapp),
      loja: lead.loja,
      cidade_uf: lead.cidade && lead.uf ? `${lead.cidade} · ${lead.uf}` : lead.cidade,
    };
    form.querySelectorAll<HTMLElement>('[data-show]').forEach((n) => (n.textContent = show[n.dataset.show!] || '—'));
  }

  /* Navegação ------------------------------------------------------------- */
  function render(focus = true) {
    steps.forEach((s, i) => {
      s.hidden = i !== index;
      s.classList.toggle('is-enter', i === index && focus);
    });
    const step = steps[index];
    const label = step.dataset.label ?? '';
    bar.style.width = `${((index + 1) / total) * 100}%`;
    whereN.textContent = String(index + 1).padStart(2, '0');
    whereLabel.textContent = label;
    form.classList.toggle('is-first', index === 0);
    form.classList.toggle('is-last', index === total - 1);
    personalize();
    if (!focus) return;
    announce.textContent = `Pergunta ${index + 1} de ${total}: ${label}`;
    const top = form.getBoundingClientRect().top + scrollY - 80;
    if (scrollY > top) scrollTo({ top, behavior: 'auto' });
    const text = step.querySelector<HTMLElement>('input.in, textarea.in');
    if (text) {
      text.focus({ preventScroll: true });
      return;
    }
    const q = step.querySelector<HTMLElement>('.st__q');
    if (q) {
      q.setAttribute('tabindex', '-1');
      q.focus({ preventScroll: true });
    }
  }

  function validStep(i: number, show = true): boolean {
    const fields = STEP_FIELDS[steps[i].dataset.step ?? ''] ?? [];
    const errors = validateLead(read(), fields);
    if (show) showErrors(errors, fields);
    return !fields.some((f) => errors[f]);
  }

  function go(to: number, focus = true) {
    index = Math.max(0, Math.min(total - 1, to));
    render(focus);
    saveDraft();
  }

  function next() {
    if (!validStep(index)) return;
    const name = steps[index].dataset.step;
    if (name === 'instagram') {
      const ig = form.querySelector<HTMLInputElement>('[name="instagram"]')!;
      ig.value = normalizeInstagram(ig.value);
    }
    track('form_step', { step: index + 1, step_name: name });
    go(index + 1);
  }

  btnNext.addEventListener('click', next);
  btnBack.addEventListener('click', () => go(index - 1));
  $<HTMLButtonElement>('[data-skip]').addEventListener('click', () => {
    form.querySelector<HTMLInputElement>('[name="instagram"]')!.value = '';
    track('form_step', { step: index + 1, step_name: 'instagram', skipped: true });
    go(index + 1);
  });
  form.querySelectorAll<HTMLButtonElement>('[data-goto]').forEach((b) =>
    b.addEventListener('click', () => go(steps.findIndex((s) => s.dataset.step === b.dataset.goto))),
  );

  // Teclado: Enter avança; Ctrl/Cmd+Enter no texto longo; 1–9 escolhe opção.
  form.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    const step = steps[index];
    if (e.key === 'Enter') {
      if (t.tagName === 'BUTTON' || t.tagName === 'A') return;
      if (t.tagName === 'TEXTAREA' && !(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      if (index < total - 1) next();
      else form.requestSubmit();
      return;
    }
    const inChoice = t instanceof HTMLInputElement && (t.type === 'radio' || t.type === 'checkbox');
    if (/^[1-9]$/.test(e.key) && (inChoice || !['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) {
      const opts = [...step.querySelectorAll<HTMLInputElement>('.opt input')];
      const opt = opts[Number(e.key) - 1];
      if (!opt) return;
      e.preventDefault();
      opt.checked = opt.type === 'checkbox' ? !opt.checked : true;
      opt.focus();
      opt.dispatchEvent(new Event('change', { bubbles: true }));
      if (opt.type === 'radio' && step.hasAttribute('data-auto')) setTimeout(() => steps[index] === step && next(), 250);
    }
  });

  // Toque/clique numa opção única avança sozinho (teclado não, para não surpreender).
  form.addEventListener('pointerdown', () => (lastPointer = Date.now()));
  form.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.type !== 'radio') return;
    const step = steps[index];
    if (!step.hasAttribute('data-auto') || !step.contains(input)) return;
    if (Date.now() - lastPointer > 1000) return;
    setTimeout(() => steps[index] === step && next(), 260);
  });

  /* Campos ---------------------------------------------------------------- */
  const whatsapp = form.querySelector<HTMLInputElement>('[name="whatsapp"]')!;
  whatsapp.addEventListener('input', () => {
    const f = formatWhatsapp(whatsapp.value);
    if (f !== whatsapp.value) whatsapp.value = f;
  });

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
  form.addEventListener('change', () => saveDraft());

  // Sugestão de cidades pelo IBGE ao escolher o estado.
  const uf = form.querySelector<HTMLSelectElement>('[name="uf"]')!;
  const datalist = form.querySelector<HTMLDataListElement>('#lf-cidades')!;
  const cache = new Map<string, string[]>();
  uf.addEventListener('change', async () => {
    if (!uf.value) return;
    try {
      let names = cache.get(uf.value);
      if (!names) {
        const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf.value}/municipios?orderBy=nome`, {
          signal: timeout(5000),
        });
        if (!res.ok) return;
        names = ((await res.json()) as { nome: string }[]).map((m) => m.nome);
        cache.set(uf.value, names);
      }
      datalist.replaceChildren(...names.map((n) => Object.assign(document.createElement('option'), { value: n })));
    } catch {
      /* sem sugestão: campo continua livre */
    }
  });

  /* Rascunho -------------------------------------------------------------- */
  let timer: number | undefined;
  let done = false;
  function flush() {
    if (!store || done) return;
    clearTimeout(timer);
    const values = raw();
    for (const k of NOT_SAVED) delete values[k];
    store.setItem(DRAFT_KEY, JSON.stringify({ values, index }));
  }
  function saveDraft() {
    if (!store) return;
    clearTimeout(timer);
    timer = window.setTimeout(flush, 200);
  }
  addEventListener('pagehide', flush);

  function apply(values: Record<string, string | string[]>) {
    for (const [name, value] of Object.entries(values)) {
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
      const saved = store ? (JSON.parse(store.getItem(DRAFT_KEY) ?? 'null') as { values: Record<string, string | string[]>; index: number } | null) : null;
      if (saved) {
        apply(saved.values);
        restored = true;
        let target = 0;
        while (target < Math.min(saved.index, total - 1) && validStep(target, false)) target++;
        index = target;
        started = true;
      }
    } catch {
      store?.removeItem(DRAFT_KEY);
    }
    // Situações marcadas na home viram dores pré-marcadas.
    if (!restored || !(raw().dores as string[] | undefined)?.length) {
      try {
        const sit = JSON.parse(localStorage.getItem(SITUATIONS_KEY) ?? 'null') as { dores: string[] } | null;
        if (sit?.dores?.length) apply({ dores: sit.dores });
      } catch {
        /* ignora */
      }
    }
  }

  /* Envio ----------------------------------------------------------------- */
  function setStatus(kind: 'error' | 'success', html: string) {
    status.dataset.kind = kind;
    status.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    status.innerHTML = html;
    status.hidden = false;
  }

  function loading(on: boolean) {
    btnSubmit.disabled = on;
    btnBack.disabled = on;
    btnSubmit.toggleAttribute('data-loading', on);
    submitLabel.textContent = on ? 'Enviando…' : 'Enviar minha agropecuária para análise';
  }

  const stepWithError = (errors: LeadErrors) =>
    steps.findIndex((s) => (STEP_FIELDS[s.dataset.step ?? ''] ?? []).some((f) => errors[f]));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return;
    const lead = read();
    const errors = validateLead(lead);
    const bad = stepWithError(errors);
    if (bad !== -1) {
      go(bad);
      showErrors(errors, STEP_FIELDS[steps[bad].dataset.step ?? '']);
      return;
    }

    sending = true;
    loading(true);
    status.hidden = true;
    const eventId = uuid();
    track('form_submit', { step: total });

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...raw(), tracking: { ...getAttribution(), event_id: eventId } }),
        signal: timeout(20000),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; errors?: LeadErrors };
      if (res.status === 422 && data.errors) {
        sending = false;
        loading(false);
        const i = stepWithError(data.errors);
        if (i !== -1) {
          go(i);
          showErrors(data.errors, STEP_FIELDS[steps[i].dataset.step ?? '']);
        }
        return;
      }
      if (!res.ok || !data.ok) throw new Error(`HTTP ${res.status}`);

      // Lead salvo no servidor. Só agora: página de obrigado (onde o evento Lead dispara).
      done = true;
      clearTimeout(timer);
      store?.removeItem(DRAFT_KEY);
      store?.setItem(PENDING_KEY, eventId);
      store?.setItem(NAME_KEY, lead.nome);
      try {
        localStorage.removeItem(SITUATIONS_KEY);
      } catch {
        /* ignora */
      }
      btnSubmit.removeAttribute('data-loading');
      submitLabel.textContent = 'Recebido!';
      setStatus('success', '<strong>Recebemos sua agropecuária.</strong> Só um instante…');
      location.assign(`/obrigado/?lead=${encodeURIComponent(eventId)}`);
    } catch {
      sending = false;
      loading(false);
      setStatus('error', '<strong>Não conseguimos enviar agora.</strong> Suas respostas continuam aqui. Confira a conexão e tente de novo.');
    }
  });

  /* Início ---------------------------------------------------------------- */
  restore();
  render(false);
  const erro = new URLSearchParams(location.search).get('erro');
  if (erro) {
    go(total - 1, false);
    setStatus(
      'error',
      erro === 'formulario'
        ? '<strong>Faltou alguma informação.</strong> Confira as respostas e envie de novo.'
        : '<strong>Não conseguimos registrar seu envio.</strong> Tente de novo em instantes.',
    );
  }
}
