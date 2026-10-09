/**
 * Monta o e-mail do resultado a partir do resultado calculado em core.js.
 * Usado pela função de servidor e pelos testes. Não decide nada sobre a
 * pontuação: apenas formata o resultado recebido.
 */
import { OFFICIAL_URL, QUIZ_TITLE, getPhase } from './core.js';

export const EMAIL_SUBJECT = `Seu resultado do quiz “${QUIZ_TITLE}”`;
export const LOGO_URL = 'https://psiclaudiatilemann.com.br/images/logo-email.png';

const C = {
  bg: '#fdfbf9',
  text: '#392d3b',
  soft: '#545060',
  accent: '#a27da6',
  lavender: '#f9f3fa',
  border: '#e7dfe3'
};

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function cleanName(name) {
  if (typeof name !== 'string') return '';
  return name.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
}

function joinNames(names) {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

/** Texto de abertura do resultado conforme o modo (single/chosen/combined). */
export function resultHeadline(result) {
  const phases = result.phaseIds.map(getPhase);
  if (result.mode === 'combined') {
    return {
      label: joinNames(phases.map((p) => p.name)),
      note: 'Suas respostas se distribuíram igualmente entre estes temas. Por isso, você recebe as atividades de cada um deles. Nenhum é mais importante que o outro: escolha por onde começar, no seu ritmo.'
    };
  }
  if (result.mode === 'chosen') {
    const others = result.tiedPhaseIds.filter((id) => id !== result.primary).map((id) => getPhase(id).name);
    return {
      label: getPhase(result.primary).name,
      note: `Suas respostas se distribuíram igualmente entre ${joinNames(result.tiedPhaseIds.map((id) => getPhase(id).name))}. Você escolheu começar por ${getPhase(result.primary).name}. ${others.length === 1 ? 'O outro tema' : 'Os outros temas'} também pode${others.length === 1 ? '' : 'm'} ser explorado${others.length === 1 ? '' : 's'} quando fizer sentido para você.`
    };
  }
  return { label: phases[0].name, note: '' };
}

function phaseBlockHtml(p) {
  const steps = p.activity.steps
    .map((s, i) => `<tr><td valign="top" style="width:28px;padding:0 0 10px 0;font:700 14px Arial,Helvetica,sans-serif;color:${p.color};">${i + 1}.</td><td style="padding:0 0 10px 0;font:15px/1.6 Arial,Helvetica,sans-serif;color:${C.soft};">${escapeHtml(s)}</td></tr>`)
    .join('');
  const prompts = p.prompts
    .map((q) => `<p style="margin:0 0 12px 0;padding:12px 16px;background:#ffffff;border-left:3px solid ${p.color};border-radius:8px;font:15px/1.6 Arial,Helvetica,sans-serif;color:${C.text};">${escapeHtml(q)}</p>`)
    .join('');
  return `
<tr><td style="padding:8px 32px 0 32px;">
  <p style="margin:0 0 6px 0;font:700 12px Arial,Helvetica,sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:${p.color};">Fase ${p.order} · ${escapeHtml(p.verb)}</p>
  <h2 style="margin:0 0 4px 0;font:700 30px/1.2 Georgia,'Times New Roman',serif;color:${C.text};">${escapeHtml(p.name)}</h2>
  <p style="margin:0 0 16px 0;font:italic 16px Georgia,serif;color:${C.soft};">${escapeHtml(p.subtitle)}</p>
  <p style="margin:0 0 24px 0;font:15px/1.7 Arial,Helvetica,sans-serif;color:${C.soft};">${escapeHtml(p.description)}</p>
</td></tr>
<tr><td style="padding:0 32px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${p.tint};border-radius:16px;">
    <tr><td style="padding:24px 24px 14px 24px;">
      <p style="margin:0 0 4px 0;font:700 12px Arial,Helvetica,sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:${p.color};">Sua atividade de cinco minutos</p>
      <h3 style="margin:0 0 16px 0;font:700 20px Georgia,serif;color:${C.text};">${escapeHtml(p.activity.title)}</h3>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${steps}</table>
    </td></tr>
    <tr><td style="padding:4px 24px 20px 24px;">
      <p style="margin:0 0 12px 0;font:700 12px Arial,Helvetica,sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:${p.color};">Para registrar</p>
      ${prompts}
    </td></tr>
  </table>
</td></tr>
<tr><td style="height:28px;line-height:28px;font-size:0;">&nbsp;</td></tr>`;
}

function phaseBlockText(p) {
  return [
    `${p.name.toUpperCase()} (Fase ${p.order} · ${p.verb})`,
    p.subtitle,
    '',
    p.description,
    '',
    `SUA ATIVIDADE DE CINCO MINUTOS: ${p.activity.title}`,
    ...p.activity.steps.map((s, i) => `${i + 1}. ${s}`),
    '',
    'PARA REGISTRAR',
    ...p.prompts.map((q) => `- ${q}`),
    ''
  ].join('\n');
}

/**
 * Monta { subject, html, text } a partir do resultado (resolveResult) e do
 * nome opcional. O conteúdo depende apenas do resultado.
 */
export function buildEmail(result, name) {
  const n = cleanName(name);
  const greeting = n ? `Olá, ${n}.` : 'Olá.';
  const head = resultHeadline(result);
  const phases = result.phaseIds.map(getPhase);
  const safety =
    'Se alguma pergunta despertar desconforto, você pode interromper a atividade a qualquer momento ou escolher outro tema. Se perceber necessidade de apoio, considere buscar acompanhamento psicológico ou outro profissional adequado à sua situação.';

  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><title>${escapeHtml(EMAIL_SUBJECT)}</title>
<style>@media (max-width:620px){.wrap{width:100%!important}.px{padding-left:20px!important;padding-right:20px!important}}</style>
</head>
<body style="margin:0;padding:0;background:${C.lavender};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Seu convite de reflexão: ${escapeHtml(head.label)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.lavender};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:${C.bg};border-radius:20px;overflow:hidden;">
<tr><td align="center" style="padding:32px 32px 8px 32px;">
  <img src="${LOGO_URL}" width="120" alt="Claudia Tilemann · Psicóloga" style="display:block;width:120px;height:auto;border:0;font:14px Georgia,serif;color:${C.accent};">
</td></tr>
<tr><td class="px" style="padding:16px 32px 8px 32px;">
  <p style="margin:0 0 16px 0;font:15px/1.7 Arial,Helvetica,sans-serif;color:${C.text};">${escapeHtml(greeting)}</p>
  <p style="margin:0 0 16px 0;font:15px/1.7 Arial,Helvetica,sans-serif;color:${C.soft};">Obrigada por reservar alguns minutos para olhar para si.</p>
  <p style="margin:0 0 8px 0;font:15px/1.7 Arial,Helvetica,sans-serif;color:${C.soft};">Com base nas respostas que você compartilhou, seu convite de reflexão é:</p>
  <p style="margin:0 0 8px 0;font:700 26px/1.3 Georgia,serif;color:${C.accent};">${escapeHtml(head.label)}</p>
  ${head.note ? `<p style="margin:0 0 8px 0;font:14px/1.6 Arial,Helvetica,sans-serif;color:${C.soft};">${escapeHtml(head.note)}</p>` : ''}
</td></tr>
<tr><td style="padding:16px 32px 16px 32px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid ${C.border};font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>
${phases.map(phaseBlockHtml).join('')}
<tr><td class="px" style="padding:0 32px 8px 32px;">
  <p style="margin:0 0 12px 0;font:15px/1.7 Arial,Helvetica,sans-serif;color:${C.soft};">Faça essa atividade no seu próprio ritmo. Você não precisa encontrar respostas definitivas. O convite é observar, registrar e refletir sobre o que fizer sentido para você.</p>
  <p style="margin:0 0 12px 0;font:13px/1.6 Arial,Helvetica,sans-serif;color:${C.soft};">${escapeHtml(safety)}</p>
  <p style="margin:0 0 24px 0;font:italic 13px/1.6 Arial,Helvetica,sans-serif;color:${C.soft};">Este resultado é uma sugestão de reflexão pessoal, não um diagnóstico ou uma avaliação psicológica.</p>
</td></tr>
<tr><td style="padding:0 32px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ede5f6;border-radius:16px;"><tr><td align="center" style="padding:28px 24px;">
    <p style="margin:0 0 8px 0;font:700 12px Arial,Helvetica,sans-serif;letter-spacing:2px;text-transform:uppercase;color:${C.accent};">Um convite para continuar</p>
    <p style="margin:0 0 20px 0;font:15px/1.7 Arial,Helvetica,sans-serif;color:${C.text};">A Jornada de Si propõe um percurso de reflexão pessoal organizado em cinco fases. Se você quiser conhecer melhor a proposta, acesse:</p>
    <a href="${OFFICIAL_URL}" style="display:inline-block;background:${C.accent};color:#ffffff;text-decoration:none;font:700 14px Arial,Helvetica,sans-serif;letter-spacing:.3px;padding:16px 32px;border-radius:40px;">Conhecer a Jornada de Si</a>
    <p style="margin:14px 0 0 0;font:12px Arial,Helvetica,sans-serif;color:${C.soft};word-break:break-all;"><a href="${OFFICIAL_URL}" style="color:${C.accent};">${OFFICIAL_URL}</a></p>
  </td></tr></table>
</td></tr>
<tr><td class="px" style="padding:28px 32px 32px 32px;">
  <p style="margin:0 0 4px 0;font:15px/1.7 Arial,Helvetica,sans-serif;color:${C.soft};">Com carinho e respeito pelo seu processo,</p>
  <p style="margin:0;font:700 17px Georgia,serif;color:${C.text};">Claudia Tilemann</p>
  <p style="margin:0;font:14px Arial,Helvetica,sans-serif;color:${C.accent};">Jornada de Si</p>
</td></tr>
<tr><td style="padding:16px 32px 28px 32px;border-top:1px solid ${C.border};">
  <p style="margin:0;font:11px/1.6 Arial,Helvetica,sans-serif;color:#8a8494;">Você recebeu este e-mail porque solicitou o resultado do quiz “${escapeHtml(QUIZ_TITLE)}”. Suas respostas não são armazenadas. Dúvidas sobre seus dados: psi.claudiatilemann@gmail.com · <a href="https://psiclaudiatilemann.com.br/quiz/privacidade.html" style="color:#8a8494;">Aviso de privacidade</a></p>
</td></tr>
</table></td></tr></table>
</body></html>`;

  const text = [
    greeting,
    '',
    'Obrigada por reservar alguns minutos para olhar para si.',
    '',
    'Com base nas respostas que você compartilhou, seu convite de reflexão é:',
    '',
    head.label.toUpperCase(),
    head.note ? `\n${head.note}` : '',
    '',
    ...phases.map(phaseBlockText),
    'Faça essa atividade no seu próprio ritmo. Você não precisa encontrar respostas definitivas. O convite é observar, registrar e refletir sobre o que fizer sentido para você.',
    '',
    safety,
    '',
    'Este resultado é uma sugestão de reflexão pessoal, não um diagnóstico ou uma avaliação psicológica.',
    '',
    'UM CONVITE PARA CONTINUAR',
    '',
    'A Jornada de Si propõe um percurso de reflexão pessoal organizado em cinco fases.',
    '',
    'Se você quiser conhecer melhor a proposta, acesse:',
    OFFICIAL_URL,
    '',
    'Com carinho e respeito pelo seu processo,',
    '',
    'Claudia Tilemann',
    'Jornada de Si'
  ].join('\n');

  return { subject: EMAIL_SUBJECT, html, text };
}
