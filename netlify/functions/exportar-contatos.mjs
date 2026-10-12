/**
 * Netlify Function TEMPORÁRIA: exporta todos os contatos do Resend junto
 * com as propriedades (fase do quiz, respostas de marketing) em um arquivo
 * CSV — algo que o próprio painel do Resend não oferece hoje (a exportação
 * de lá não inclui propriedades customizadas).
 *
 * Protegida por um token guardado em uma variável de ambiente (EXPORT_TOKEN),
 * só para evitar que alguém que descubra a URL baixe a lista de contatos.
 * Esta função usa a mesma RESEND_API_KEY já configurada no Netlify (não
 * precisa de nenhuma chave nova).
 *
 * Variável de ambiente necessária (Netlify > Site configuration > Environment
 * variables):
 *   EXPORT_TOKEN   um valor secreto qualquer, escolhido por você.
 *
 * Como usar: depois do deploy, abra no navegador:
 *   https://psiclaudiatilemann.com.br/api/exportar-contatos?token=SEU_EXPORT_TOKEN
 * O navegador baixa um arquivo .csv com todos os contatos.
 *
 * IMPORTANTE: depois de usar, remova este arquivo do repositório e publique
 * de novo — ele não deve ficar disponível no site para sempre.
 */

const PROPERTY_KEYS = [
  'fase_quiz',
  'fase_quiz_modo',
  'quiz_formato',
  'quiz_tempo',
  'quiz_obstaculo',
  'quiz_prontidao'
];

export function csvEscape(value) {
  const s = value === undefined || value === null ? '' : String(value);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export async function listAllContacts(apiKey, fetchImpl) {
  const all = [];
  let after;
  // Limite de segurança para nunca entrar em loop infinito mesmo se a API
  // devolver algo inesperado.
  for (let page = 0; page < 200; page++) {
    const url = new URL('https://api.resend.com/contacts');
    url.searchParams.set('limit', '100');
    if (after) url.searchParams.set('after', after);
    const res = await fetchImpl(url.toString(), { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!res.ok) throw new Error(`Falha ao listar contatos: ${res.status}`);
    const data = await res.json();
    const items = data.data || [];
    all.push(...items);
    if (data.has_more && items.length) {
      after = items[items.length - 1].id;
    } else {
      break;
    }
  }
  return all;
}

export async function getContactProperties(apiKey, id, fetchImpl) {
  const res = await fetchImpl(`https://api.resend.com/contacts/${id}`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  if (!res.ok) return {};
  const data = await res.json();
  return data.properties || {};
}

export function buildCsv(rows) {
  const header = ['email', 'first_name', 'created_at', 'unsubscribed', ...PROPERTY_KEYS];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push(header.map((h) => csvEscape(r[h])).join(','));
  }
  return lines.join('\r\n');
}

/** Lógica testável: recebe o Request, as variáveis e o fetch. */
export async function handle(req, env, fetchImpl = fetch) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!env.EXPORT_TOKEN) {
    return new Response('EXPORT_TOKEN não configurada.', { status: 503 });
  }
  if (!token || token !== env.EXPORT_TOKEN) {
    return new Response('Não autorizado.', { status: 403 });
  }
  if (!env.RESEND_API_KEY) {
    return new Response('RESEND_API_KEY não configurada.', { status: 503 });
  }

  let contacts;
  try {
    contacts = await listAllContacts(env.RESEND_API_KEY, fetchImpl);
  } catch (e) {
    return new Response('Não foi possível listar os contatos no Resend.', { status: 502 });
  }

  const rows = [];
  for (const c of contacts) {
    const props = await getContactProperties(env.RESEND_API_KEY, c.id, fetchImpl);
    const get = (k) => props[k]?.value ?? '';
    const row = {
      email: c.email,
      first_name: c.first_name || '',
      created_at: c.created_at,
      unsubscribed: c.unsubscribed
    };
    for (const k of PROPERTY_KEYS) row[k] = get(k);
    rows.push(row);
  }

  const csv = buildCsv(rows);

  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="contatos-resend-completo.csv"',
      'cache-control': 'no-store'
    }
  });
}

export default async (req) => handle(req, process.env);

export const config = { path: '/api/exportar-contatos' };
