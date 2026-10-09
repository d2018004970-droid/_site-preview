/**
 * Interface do quiz. Toda a pontuação vem de core.js (configuração central).
 * mountQuiz(root, { fetch, storage, endpoint }) — dependências injetáveis
 * para os testes de fluxo.
 */
import {
  QUESTIONS, TOTAL_QUESTIONS, QUIZ_TITLE, OFFICIAL_URL, OPTION_INDEX,
  computeScores, createSession, selectAnswer, isComplete, isValidEmail, getPhase
} from './core.js';

const ICON = {
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.35-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 5c-2.5 4.65-9.5 9-9.5 9z"/></svg>',
  gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8S10.5 4 8 4.5 7.5 8 12 8Zm0 0s1.5-4 4-3.5S16.5 8 12 8Z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" aria-hidden="true"><path d="M12 2c.6 4.7 2.3 6.4 7 7-4.7.6-6.4 2.3-7 7-.6-4.7-2.3-6.4-7-7 4.7-.6 6.4-2.3 7-7Z" transform="translate(0 3)"/></svg>'
};

const divider = (icon = ICON.heart) => `<div class="divider" aria-hidden="true"><span class="line"></span>${icon}<span class="line"></span></div>`;

const STORAGE_KEY = 'jornada-quiz-v1';

const ERROR_MESSAGES = {
  email: 'O endereço de e-mail não parece válido. Confira e tente novamente.',
  not_configured: 'O envio de e-mails ainda está sendo configurado. Por favor, tente novamente mais tarde.',
  provider_error: 'O serviço de e-mail não confirmou o envio.',
  provider_unreachable: 'Não conseguimos falar com o serviço de e-mail.',
  provider_no_id: 'O serviço de e-mail não confirmou o envio.',
  answers: 'Parece que alguma resposta ficou faltando. Revise suas respostas e tente novamente.',
  network: 'Não foi possível conectar. Verifique sua internet.',
  default: 'Não foi possível enviar seu resultado agora.'
};

function newId() {
  try {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') return globalThis.crypto.randomUUID();
  } catch { /* segue */ }
  return 'id-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e9).toString(36);
}

export function mountQuiz(root, deps = {}) {
  const doFetch = deps.fetch || ((...a) => globalThis.fetch(...a));
  const storage = deps.storage === undefined ? safeStorage() : deps.storage;
  const endpoint = deps.endpoint || '/api/enviar-resultado';

  let session = load() || createSession();
  let screen = session.screen || 'intro';
  let form = { name: '', email: '', marketing: false };
  let status = { sending: false, error: null, fieldError: null };

  function safeStorage() {
    try { return globalThis.sessionStorage || null; } catch { return null; }
  }
  function save() {
    if (!storage) return;
    try { storage.setItem(STORAGE_KEY, JSON.stringify({ ...session, screen: screen === 'success' ? 'intro' : screen })); } catch { /* ignora */ }
  }
  function load() {
    if (!storage) return null;
    try {
      const s = JSON.parse(storage.getItem(STORAGE_KEY) || 'null');
      if (!s || typeof s !== 'object' || typeof s.answers !== 'object') return null;
      // Descarta qualquer resposta que não exista na configuração atual.
      const answers = {};
      for (const q of QUESTIONS) if (OPTION_INDEX[s.answers[q.id]]?.questionId === q.id) answers[q.id] = s.answers[q.id];
      return { answers, current: Math.min(Math.max(0, s.current | 0), TOTAL_QUESTIONS - 1), choice: s.choice, submissionId: null, screen: ['question', 'intro'].includes(s.screen) ? s.screen : 'intro' };
    } catch { return null; }
  }
  function clearStore() {
    if (!storage) return;
    try { storage.removeItem(STORAGE_KEY); } catch { /* ignora */ }
  }

  function go(next) {
    screen = next;
    save();
    render();
    const h = root.querySelector('h1, h2, legend');
    if (h) { h.setAttribute('tabindex', '-1'); try { h.focus({ preventScroll: true }); } catch { h.focus(); } }
    try { globalThis.scrollTo?.({ top: 0, behavior: 'smooth' }); } catch { /* jsdom */ }
  }

  function restart() {
    session = createSession();
    form = { name: '', email: '', marketing: false };
    status = { sending: false, error: null, fieldError: null };
    clearStore();
    go('intro');
  }

  function afterLastQuestion() {
    if (!isComplete(session.answers)) {
      const firstMissing = QUESTIONS.findIndex((q) => !session.answers[q.id]);
      session.current = firstMissing;
      return go('question');
    }
    const { isTie, topPhaseIds } = computeScores(session.answers);
    if (isTie) {
      if (session.choice && session.choice !== 'todas' && !topPhaseIds.includes(session.choice)) session.choice = undefined;
      return go('tie');
    }
    session.choice = undefined;
    go('form');
  }

  /* ---------------- telas ---------------- */
  function viewIntro() {
    return `<section class="screen center" aria-labelledby="t-intro">
      <p class="eyebrow">Jornada de Si · Quiz gratuito</p>
      <h1 id="t-intro">${QUIZ_TITLE}</h1>
      ${divider()}
      <p class="lead">Uma pausa para olhar para si, reconhecer seu momento atual e descobrir uma pequena prática de reflexão para levar consigo.</p>
      <p>Em meio à rotina, às responsabilidades e às escolhas, nem sempre encontramos espaço para perceber como estamos.</p>
      <p>Este quiz é um convite para fazer uma pausa, observar seu momento atual e descobrir uma atividade simples que pode ajudar você a refletir sobre si.</p>
      <ul class="info-list" style="text-align:left">
        <li>${ICON.gift}<span>Gratuito.</span></li>
        <li>${ICON.clock}<span>Aproximadamente 3 minutos para responder.</span></li>
        <li>${ICON.mail}<span>Resultado personalizado enviado por e-mail.</span></li>
        <li>${ICON.pen}<span>Uma atividade prática para realizar em aproximadamente 5 minutos.</span></li>
      </ul>
      <button class="btn" type="button" data-action="start">Quero começar</button>
      <p class="note" style="margin-top:24px">Este quiz não é um teste psicológico nem um diagnóstico. O resultado é uma sugestão de reflexão baseada nas suas respostas.</p>
    </section>`;
  }

  function viewQuestion() {
    const i = session.current;
    const q = QUESTIONS[i];
    const selected = session.answers[q.id];
    const pct = Math.round(((i + 1) / TOTAL_QUESTIONS) * 100);
    const opts = q.options.map((o) => `
      <label class="option">
        <input type="radio" name="${q.id}" value="${o.optionId}" ${selected === o.optionId ? 'checked' : ''}>
        <span class="option-card"><span class="mark" aria-hidden="true"></span><span>${o.text}</span></span>
      </label>`).join('');
    return `<section class="screen" aria-labelledby="t-q">
      <div class="progress-top">
        <p class="eyebrow">Pergunta ${i + 1}</p>
        <span class="progress-count">${i + 1} de ${TOTAL_QUESTIONS}</span>
      </div>
      <div class="progress" role="progressbar" aria-label="Progresso do quiz" aria-valuemin="0" aria-valuemax="${TOTAL_QUESTIONS}" aria-valuenow="${i + 1}"><span style="width:${pct}%"></span></div>
      <form data-form="question" novalidate>
        <fieldset>
          <legend id="t-q" class="question-title" style="font-family:var(--font-heading);font-weight:600;color:var(--color-text)">${q.text}</legend>
          <p class="question-hint">Escolha a opção que mais tem a ver com você hoje. Não tem resposta certa.</p>
          <div class="options" role="radiogroup" aria-labelledby="t-q">${opts}</div>
        </fieldset>
        <div class="nav-row">
          <button class="btn btn-outline" type="button" data-action="back">Voltar</button>
          <button class="btn" type="submit" data-action="next" ${selected ? '' : 'disabled'}>${i === TOTAL_QUESTIONS - 1 ? 'Concluir' : 'Avançar'}</button>
        </div>
      </form>
    </section>`;
  }

  function viewTie() {
    const { topPhaseIds } = computeScores(session.answers);
    const cards = topPhaseIds.map((id) => {
      const p = getPhase(id);
      return `<label class="option" style="--phase-color:${p.color}">
        <input type="radio" name="tie" value="${p.id}" ${session.choice === p.id ? 'checked' : ''}>
        <span class="option-card"><span class="mark" aria-hidden="true"></span><span>
          <span class="phase-tag">Fase ${p.order} · ${p.verb}</span>
          <span class="phase-name">${p.name}</span>
          <span class="phase-sub">${p.subtitle}</span>
        </span></span>
      </label>`;
    }).join('');
    return `<section class="screen" aria-labelledby="t-tie">
      <p class="eyebrow">Suas respostas</p>
      <h2 id="t-tie">Mais de um tema pediu atenção</h2>
      ${divider(ICON.spark)}
      <p>Suas respostas se distribuíram igualmente entre ${topPhaseIds.length} temas da Jornada de Si. Nenhum deles é mais importante que o outro.</p>
      <p>Qual deles você gostaria de explorar primeiro?</p>
      <form data-form="tie" novalidate>
        <fieldset>
          <legend class="hp">Escolha um tema</legend>
          <div class="tie-grid">${cards}
            <label class="option">
              <input type="radio" name="tie" value="todas" ${session.choice === 'todas' ? 'checked' : ''}>
              <span class="option-card"><span class="mark" aria-hidden="true"></span><span>
                <span class="phase-name">Prefiro não escolher</span>
                <span class="phase-sub">Receber as atividades de todos esses temas.</span>
              </span></span>
            </label>
          </div>
        </fieldset>
        <div class="nav-row">
          <button class="btn btn-outline" type="button" data-action="back-to-questions">Revisar respostas</button>
          <button class="btn" type="submit" ${session.choice ? '' : 'disabled'}>Continuar</button>
        </div>
      </form>
    </section>`;
  }

  function viewForm() {
    const err = status.error ? `<div class="alert alert-error" role="alert"><p><strong>${status.error}</strong></p><p>Suas respostas continuam salvas. Você pode tentar novamente sem refazer o quiz.</p></div>` : '';
    const review = QUESTIONS.map((q, i) => `<li><strong>${q.text}</strong>${OPTION_INDEX[session.answers[q.id]]?.text || '—'} <button type="button" class="link-btn" data-action="edit" data-index="${i}">alterar</button></li>`).join('');
    return `<section class="screen" aria-labelledby="t-form">
      <p class="eyebrow">Último passo</p>
      <h2 id="t-form">Seu convite de reflexão está quase pronto.</h2>
      ${divider()}
      <p>Informe seu nome e e-mail para receber seu resultado personalizado e a atividade prática correspondente ao seu momento de reflexão.</p>
      <form class="card" data-form="lead" novalidate>
        ${err}
        <div class="field">
          <label for="f-name">Nome <span class="opt">(opcional)</span></label>
          <input id="f-name" name="name" type="text" autocomplete="given-name" maxlength="60">
        </div>
        <div class="field">
          <label for="f-email">E-mail</label>
          <input id="f-email" name="email" type="email" autocomplete="email" inputmode="email" required aria-required="true" ${status.fieldError ? 'aria-invalid="true" aria-describedby="f-email-err"' : ''}>
          ${status.fieldError ? `<p class="field-error" id="f-email-err">${status.fieldError}</p>` : ''}
        </div>
        <div class="hp" aria-hidden="true"><label for="f-website">Não preencha</label><input id="f-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>
        <label class="check"><input type="checkbox" name="marketing"> <span>Quero receber, por e-mail, conteúdos e novidades de Claudia Tilemann sobre a Jornada de Si. <em>(Opcional. Você recebe seu resultado mesmo sem marcar.)</em></span></label>
        <div class="privacy"><p>Usamos seu e-mail para enviar este resultado. Suas respostas servem apenas para calcular o resultado e não ficam armazenadas. Você pode solicitar informações ou a exclusão dos seus dados a qualquer momento. <a href="privacidade.html" target="_blank" rel="noopener">Aviso de privacidade</a></p></div>
        <button class="btn" type="submit" style="width:100%" ${status.sending ? 'disabled aria-busy="true"' : ''}>
          ${status.sending ? '<span class="spinner" aria-hidden="true"></span> Enviando seu resultado…' : (status.error ? 'Tentar enviar novamente' : 'Quero receber meu resultado')}
        </button>
        <p class="sr-status hp" role="status" aria-live="polite">${status.sending ? 'Enviando seu resultado.' : ''}</p>
      </form>
      <details class="review"><summary>Revisar minhas respostas</summary><ol>${review}</ol></details>
    </section>`;
  }

  function viewSuccess() {
    return `<section class="screen center" aria-labelledby="t-ok">
      <div class="success-icon" aria-hidden="true">${ICON.heart}</div>
      <p class="eyebrow">Resultado enviado</p>
      <h2 id="t-ok">Este pode ser o seu ponto de partida.</h2>
      ${divider()}
      <p role="status">Seu resultado foi enviado para o e-mail informado. Confira também sua pasta de spam ou lixo eletrônico, caso não encontre a mensagem na caixa de entrada.</p>
      <div class="callout">
        <p>A atividade que você receberá é uma pequena oportunidade de olhar para si com mais atenção.</p>
        <p>A Jornada de Si oferece um percurso mais amplo de reflexão e registro pessoal, organizado em cinco fases.</p>
        <p>Se você deseja conhecer a proposta completa, visite a página oficial e descubra se esse percurso faz sentido para você.</p>
        <a class="btn" href="${OFFICIAL_URL}" data-action="official">Conhecer a Jornada de Si</a>
      </div>
      <p style="margin-top:28px"><button type="button" class="link-btn" data-action="restart">Refazer o quiz</button></p>
    </section>`;
  }

  function render() {
    const views = { intro: viewIntro, question: viewQuestion, tie: viewTie, form: viewForm, success: viewSuccess };
    root.innerHTML = (views[screen] || viewIntro)();
    if (screen === 'form') {
      const n = root.querySelector('#f-name');
      const e = root.querySelector('#f-email');
      const m = root.querySelector('input[name="marketing"]');
      n.value = form.name; e.value = form.email; m.checked = form.marketing;
    }
  }

  /* ---------------- envio ---------------- */
  async function submitLead(formEl) {
    if (status.sending) return; // evita clique duplo
    form.name = formEl.elements.name.value;
    form.email = formEl.elements.email.value.trim();
    form.marketing = formEl.elements.marketing.checked;
    const website = formEl.elements.website.value;

    if (!isValidEmail(form.email)) {
      status.fieldError = 'Informe um e-mail válido para receber seu resultado.';
      render();
      root.querySelector('#f-email')?.focus();
      return;
    }
    status.fieldError = null;
    if (!isComplete(session.answers)) return afterLastQuestion();
    const { isTie } = computeScores(session.answers);
    if (isTie && !session.choice) return go('tie');

    // Mesmo identificador em novas tentativas da mesma conclusão.
    if (!session.submissionId) session.submissionId = newId();
    status.sending = true;
    status.error = null;
    render();

    let res, data;
    try {
      res = await doFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: session.answers,
          choice: isTie ? session.choice : undefined,
          email: form.email,
          name: form.name,
          marketingConsent: form.marketing,
          submissionId: session.submissionId,
          website
        })
      });
      data = await res.json().catch(() => ({}));
    } catch {
      status.sending = false;
      status.error = ERROR_MESSAGES.network;
      return render();
    }
    status.sending = false;
    if (res.ok && data && data.ok === true && data.id) {
      clearStore();
      return go('success');
    }
    status.error = ERROR_MESSAGES[data?.code] || ERROR_MESSAGES.default;
    if (data?.code === 'email') { status.fieldError = ERROR_MESSAGES.email; status.error = null; }
    render();
  }

  /* ---------------- eventos ---------------- */
  root.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-action]');
    if (!el) return;
    const a = el.dataset.action;
    if (a === 'start') { session.current = 0; go('question'); }
    else if (a === 'back') {
      if (session.current === 0) go('intro');
      else { session.current -= 1; go('question'); }
    }
    else if (a === 'back-to-questions') { session.current = TOTAL_QUESTIONS - 1; go('question'); }
    else if (a === 'edit') { session.current = Number(el.dataset.index); go('question'); }
    else if (a === 'restart') { ev.preventDefault(); restart(); }
  });

  root.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t.type !== 'radio') return;
    if (t.name === 'tie') {
      session.choice = t.value;
      session.submissionId = null;
      save();
      root.querySelector('[data-form="tie"] button[type="submit"]')?.removeAttribute('disabled');
      return;
    }
    const before = session.answers[t.name];
    selectAnswer(session, t.name, t.value);
    if (before !== t.value) { session.submissionId = null; session.choice = undefined; }
    save();
    root.querySelector('[data-form="question"] button[type="submit"]')?.removeAttribute('disabled');
  });

  root.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const f = ev.target.dataset.form;
    if (f === 'question') {
      const q = QUESTIONS[session.current];
      if (!session.answers[q.id]) return;
      if (session.current < TOTAL_QUESTIONS - 1) { session.current += 1; go('question'); }
      else afterLastQuestion();
    } else if (f === 'tie') {
      if (session.choice) go('form');
    } else if (f === 'lead') {
      submitLead(ev.target);
    }
  });

  render();
  return {
    get screen() { return screen; },
    get session() { return session; },
    restart
  };
}
