/**
 * Netlify Function: recalcula o resultado no servidor (mesma configuração
 * central do quiz) e envia o e-mail pelo Resend.
 *
 * Variáveis de ambiente (Netlify > Site configuration > Environment variables):
 *   RESEND_API_KEY     (obrigatória) chave da API do Resend — nunca vai ao navegador
 *   EMAIL_FROM         (obrigatória) ex.: "Claudia Tilemann <jornada@psiclaudiatilemann.com.br>"
 *                      (o domínio precisa estar verificado no Resend)
 *   EMAIL_REPLY_TO     (opcional)   ex.: "psi.claudiatilemann@gmail.com"
 *   RESEND_SEGMENT_ID  (opcional)   segmento do Resend para quem autorizar conteúdos futuros
 *   ALLOWED_ORIGINS    (opcional)   origens aceitas, separadas por vírgula
 */
import { resolveResult, isValidEmail, QUESTIONS, getPhase } from '../../quiz/js/core.js';
import { buildEmail, cleanName } from '../../quiz/js/email.js';
import { createHash } from 'node:crypto';

const DEFAULT_ORIGINS = [
  'https://psiclaudiatilemann.com.br',
  'https://www.psiclaudiatilemann.com.br'
];

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });

export function idempotencyKey(submissionId, to, html) {
  const h = createHash('sha256').update(html).digest('hex').slice(0, 16);
  return `quiz-${submissionId}-${h}-${to.toLowerCase()}`.slice(0, 256);
}

/** Lógica testável: recebe o Request, as variáveis e o fetch. */
export async function handle(req, env, fetchImpl = fetch) {
  if (req.method !== 'POST') return json(405, { ok: false, code: 'method', message: 'Método não permitido.' });

  const allowed = (env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',') : DEFAULT_ORIGINS).map((s) => s.trim());
  const origin = req.headers.get('origin');
  if (origin && !allowed.includes(origin)) return json(403, { ok: false, code: 'origin', message: 'Origem não autorizada.' });

  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    return json(503, { ok: false, code: 'not_configured', message: 'O envio de e-mails ainda não foi configurado.' });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { ok: false, code: 'bad_json', message: 'Dados inválidos.' });
  }

  // Campo-armadilha contra robôs: pessoas não o preenchem.
  if (body && typeof body.website === 'string' && body.website.trim() !== '') {
    return json(400, { ok: false, code: 'rejected', message: 'Não foi possível processar o envio.' });
  }

  const { answers, choice, email, name, marketingConsent, submissionId } = body || {};

  if (!isValidEmail(email)) return json(400, { ok: false, code: 'email', message: 'Informe um e-mail válido.' });
  if (typeof submissionId !== 'string' || !/^[A-Za-z0-9-]{8,64}$/.test(submissionId)) {
    return json(400, { ok: false, code: 'submission', message: 'Identificador de envio inválido.' });
  }

  // Só aceita as chaves das perguntas (evita dados extras) e recalcula aqui.
  const cleanAnswers = {};
  if (answers && typeof answers === 'object') {
    for (const q of QUESTIONS) if (typeof answers[q.id] === 'string') cleanAnswers[q.id] = answers[q.id];
  }
  let result;
  try {
    result = resolveResult(cleanAnswers, choice);
  } catch (e) {
    return json(400, { ok: false, code: 'answers', message: 'As respostas estão incompletas ou inválidas.' });
  }

  const to = email.trim();
  const { subject, html, text } = buildEmail(result, cleanName(name));

  const payload = { from: env.EMAIL_FROM, to: [to], subject, html, text };
  if (env.EMAIL_REPLY_TO) payload.reply_to = env.EMAIL_REPLY_TO;

  let res;
  try {
    res = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        // Mesma conclusão + mesmo e-mail + mesmo conteúdo = mesma chave: o Resend não envia duas vezes.
        'Idempotency-Key': idempotencyKey(submissionId, to, html)
      },
      body: JSON.stringify(payload)
    });
  } catch {
    return json(502, { ok: false, code: 'provider_unreachable', message: 'Não conseguimos falar com o serviço de e-mail.' });
  }

  if (!res.ok) {
    return json(502, { ok: false, code: 'provider_error', status: res.status, message: 'O serviço de e-mail não confirmou o envio.' });
  }
  const data = await res.json().catch(() => ({}));
  if (!data || !data.id) {
    return json(502, { ok: false, code: 'provider_no_id', message: 'O serviço de e-mail não confirmou o envio.' });
  }

  // Consentimento separado para conteúdos futuros: não afeta o envio do resultado.
  // Guardamos também a(s) fase(s) do resultado, para personalizar conteúdos futuros —
  // está dentro da mesma finalidade/consentimento, não é um dado novo sendo coletado.
  let marketing = 'not_requested';
  if (marketingConsent === true) {
    if (env.RESEND_SEGMENT_ID) {
      const phaseNames = result.phaseIds.map((id) => getPhase(id)?.name).filter(Boolean).join(', ');
      try {
        const r = await fetchImpl('https://api.resend.com/contacts', {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: to,
            first_name: cleanName(name) || undefined,
            unsubscribed: false,
            segments: [{ id: env.RESEND_SEGMENT_ID }],
            properties: [
              { key: 'fase_quiz', value: phaseNames },
              { key: 'fase_quiz_modo', value: result.mode }
            ]
          })
        });
        marketing = r.ok ? 'saved' : 'failed';
      } catch {
        marketing = 'failed';
      }
    } else {
      marketing = 'not_configured';
    }
  }

  return json(200, { ok: true, id: data.id, phaseIds: result.phaseIds, mode: result.mode, marketing });
}

export default async (req) => handle(req, process.env);

export const config = { path: '/api/enviar-resultado' };
