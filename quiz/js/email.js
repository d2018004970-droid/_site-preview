/**
 * Monta o e-mail do resultado a partir do resultado calculado em core.js e
 * do perfil de funil (getProfile). Usado pela função de servidor e pelos
 * testes. Não decide nada sobre a pontuação: apenas formata o que recebe.
 *
 * VERSÃO 2: o e-mail ganhou uma abertura personalizada (conforme p1), três
 * trechos que respondem a objeções comuns (conforme p7/p8/p9) e um bloco de
 * convite com 3 variantes (oferta/conhecer/leve, conforme p10). Preço e
 * garantia ficam centralizados em OFFER — se o preço do site mudar, altere
 * apenas aqui.
 */
import { OFFICIAL_URL, QUIZ_TITLE, getPhase } from './core.js';

export const EMAIL_SUBJECT = `Seu resultado do quiz “${QUIZ_TITLE}”`;
export const LOGO_URL = 'https://psiclaudiatilemann.com.br/images/logo-email.png';

/** Preço e garantia exibidos no convite "oferta". Copiados da página oficial. */
export const OFFER = { price: 'R$67', installment: '12x de R$6,93', guaranteeDays: 7 };

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

/* ------------------------------------------------------------------ */
/* ABERTURA — conforme p1 (rotina)                                     */
/* ------------------------------------------------------------------ */
const OPENINGS = {
  corridos: 'Você contou que seus dias andam corridos, sempre apagando algum incêndio. Por isso, separar alguns minutos para responder a este quiz já foi um gesto de cuidado com você.',
  cuidando: 'Você contou que seus dias andam cheios de gente para cuidar e com pouco tempo para você. Por isso, separar esses minutos para si já foi um gesto de cuidado.',
  automatico: 'Você contou que seus dias andam organizados, mas com a sensação de viver no automático. Às vezes, uma pequena pausa é o que ajuda a voltar a perceber como estamos.',
  'falta-algo': 'Você contou que seus dias andam tranquilos, mas que sente falta de alguma coisa que ainda não sabe nomear. Olhar para isso com calma já é um bom começo.'
};

/* ------------------------------------------------------------------ */
/* TRECHOS DO BLOCO DE CONVITE — conforme p7 (formato), p8 (tempo) e   */
/* p9 (obstáculo)                                                      */
/* ------------------------------------------------------------------ */
const FORMAT_SNIPPETS = {
  ritmo: 'Você disse que prefere algo no seu ritmo, sem horário marcado. A Jornada de Si é autoguiada: você escolhe quando e onde fazer.',
  'passo-a-passo': 'Você disse que gostaria de um passo a passo. A Jornada de Si é organizada em 5 fases, uma por semana, com atividades guiadas em cada uma.',
  reservado: 'Você disse que prefere algo reservado. Na Jornada de Si, você escreve só para você, sem precisar compartilhar sua história com ninguém.',
  'nao-sei': 'Você disse que ainda quer entender melhor o que faria sentido. Na página da Jornada de Si você encontra como ela funciona, o que está incluído e as dúvidas mais comuns.'
};

const TIME_SNIPPETS = {
  'quase-nenhum': 'Você contou que hoje sobra quase nenhum tempo para você. Tudo bem: dá para começar devagar e pausar sempre que precisar.',
  'menos-30': 'Você contou que conseguiria reservar menos de 30 minutos por semana. A Jornada pede cerca de 40 a 60 minutos por semana, e você pode fazer uma atividade por vez, ao longo dos dias.',
  'cerca-1h': 'Você contou que conseguiria reservar cerca de 1 hora por semana. É o tempo que a Jornada pede: cerca de 40 a 60 minutos por semana.',
  'mais-1h': 'Você contou que conseguiria reservar mais de 1 hora por semana. A Jornada pede cerca de 40 a 60 minutos por semana, e você pode voltar às reflexões sempre que quiser.'
};

const OBSTACLE_SNIPPETS = {
  tempo: 'Você também contou que a falta de tempo é o que mais te impede de cuidar de você. Por isso, a Jornada não pede que você mude a sua rotina: você pode fazer uma atividade por vez, interromper quando quiser e retomar em outro momento.',
  culpa: 'Você também contou que a culpa por pensar em você é o que mais te impede de se cuidar. Reservar um tempo para si não tira nada de quem você ama. Cuidar de você também é uma forma de continuar cuidando de quem está ao seu redor.',
  'nao-termino': 'Você também contou que já começou outras coisas e não terminou. A Jornada não é uma prova: você tem acesso por 1 ano, pode pausar e retomar quando precisar, e os PDFs continuam sendo seus.',
  'por-onde-comecar': 'Você também contou que não sabe por onde começar. A Jornada conduz você passo a passo, uma semana de cada vez, sem precisar ter experiência com autoconhecimento.'
};

/** 'oferta' | 'conhecer' | 'leve', conforme a resposta de p10 (prontidao). */
export function invitationType(profile) {
  const p10 = profile && profile.prontidao;
  if (p10 === 'agora' || p10 === 'se-couber') return 'oferta';
  if (p10 === 'talvez') return 'conhecer';
  if (p10 === 'depois') return 'leve';
  throw new Error(`Resposta de prontidão (p10) inválida: ${p10}`);
}

/** Monta o conteúdo do bloco de convite a partir do perfil de funil. */
export function buildInvitation(profile) {
  const type = invitationType(profile);
  const formatText = FORMAT_SNIPPETS[profile.formato];
  const timeText = TIME_SNIPPETS[profile.tempo];
  const obstacleText = OBSTACLE_SNIPPETS[profile.obstaculo];

  if (type === 'leve') {
    return {
      type,
      title: 'Para quando fizer sentido',
      lead: 'Você disse que agora não é o momento, e está tudo bem. Guarde esta atividade e volte a ela quando quiser.',
      snippets: [],
      fixedText: 'A Jornada de Si propõe um percurso de reflexão pessoal organizado em cinco fases. Se um dia fizer sentido continuar, você pode conhecer a proposta em:',
      showPrice: false,
      buttonText: 'Conhecer a Jornada de Si',
      outline: true
    };
  }
  if (type === 'conhecer') {
    return {
      type,
      title: 'Um convite para continuar',
      lead: null,
      snippets: [formatText, timeText, obstacleText],
      fixedText: 'A Jornada de Si propõe um percurso de reflexão pessoal organizado em cinco fases. Se quiser conhecer melhor antes de decidir, a página mostra como ela funciona, o que está incluído e as dúvidas mais comuns:',
      showPrice: false,
      buttonText: 'Conhecer a Jornada de Si',
      outline: false
    };
  }
  // 'oferta'
  return {
    type,
    title: 'Um convite para continuar',
    lead: null,
    snippets: [formatText, timeText, obstacleText],
    fixedText: 'A Jornada de Si propõe um percurso de reflexão pessoal organizado em cinco fases. É um caminho guiado de 5 semanas, criado pela psicóloga Claudia Tilemann, para você voltar a olhar para si.',
    offerText: `Hoje, a Jornada completa sai por ${OFFER.price} (ou ${OFFER.installment}), com garantia de ${OFFER.guaranteeDays} dias: se perceber que não faz sentido para você, basta pedir o reembolso dentro do prazo.`,
    showPrice: true,
    buttonText: 'Quero começar a minha Jornada',
    outline: false
  };
}

function invitationHtml(inv) {
  const snippetsHtml = inv.snippets.filter(Boolean)
    .map((s) => `<p style="margin:0 0 14px 0;font:15px/1.7 Arial,Helvetica,sans-serif;color:${C.text};">${escapeHtml(s)}</p>`)
    .join('');
  const leadHtml = inv.lead ? `<p style="margin:0 0 14px 0;font:15px/1.7 Arial,Helvetica,sans-serif;color:${C.text};">${escapeHtml(inv.lead)}</p>` : '';
  const offerHtml = inv.showPrice ? `<p style="margin:0 0 20px 0;font:700 16px/1.6 Arial,Helvetica,sans-serif;color:${C.text};">${escapeHtml(inv.offerText)}</p>` : '';
  const btnStyle = inv.outline
    ? `display:inline-block;background:transparent;color:${C.accent};text-decoration:none;font:700 14px Arial,Helvetica,sans-serif;letter-spacing:.3px;padding:14px 30px;border-radius:40px;border:2px solid ${C.accent};`
    : `display:inline-block;background:${C.accent};color:#ffffff;text-decoration:none;font:700 14px Arial,Helvetica,sans-serif;letter-spacing:.3px;padding:16px 32px;border-radius:40px;`;
  return `
<tr><td style="padding:0 32px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ede5f6;border-radius:16px;"><tr><td align="center" style="padding:28px 24px;">
    <p style="margin:0 0 16px 0;font:700 12px Arial,Helvetica,sans-serif;letter-spacing:2px;text-transform:uppercase;color:${C.accent};">${escapeHtml(inv.title)}</p>
    <div style="text-align:left;">
      ${leadHtml}
      ${snippetsHtml}
      <p style="margin:0 0 ${inv.showPrice ? '14' : '20'}px 0;font:15px/1.7 Arial,Helvetica,sans-serif;color:${C.text};">${escapeHtml(inv.fixedText)}</p>
      ${offerHtml}
    </div>
    <a href="${OFFICIAL_URL}" style="${btnStyle}">${escapeHtml(inv.buttonText)}</a>
    <p style="margin:14px 0 0 0;font:12px Arial,Helvetica,sans-serif;color:${C.soft};word-break:break-all;"><a href="${OFFICIAL_URL}" style="color:${C.soft};">${OFFICIAL_URL}</a></p>
  </td></tr></table>
</td></tr>`;
}

function invitationText(inv) {
  return [
    inv.title.toUpperCase(),
    '',
    inv.lead || '',
    ...inv.snippets.filter(Boolean),
    inv.fixedText,
    inv.showPrice ? inv.offerText : '',
    '',
    `${inv.buttonText}: ${OFFICIAL_URL}`
  ].filter((l) => l !== '' || true).join('\n');
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
 * Monta { subject, html, text, invitation } a partir do resultado
 * (resolveResult), do perfil de funil (getProfile) e do nome opcional.
 */
export function buildEmail(result, profile, name) {
  const n = cleanName(name);
  const greeting = n ? `Olá, ${n}.` : 'Olá.';
  const head = resultHeadline(result);
  const phases = result.phaseIds.map(getPhase);
  const opening = OPENINGS[profile.rotina];
  const inv = buildInvitation(profile);
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
  <p style="margin:0 0 16px 0;font:15px/1.7 Arial,Helvetica,sans-serif;color:${C.soft};">${escapeHtml(opening)}</p>
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
${invitationHtml(inv)}
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
    opening,
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
    invitationText(inv),
    '',
    'Com carinho e respeito pelo seu processo,',
    '',
    'Claudia Tilemann',
    'Jornada de Si'
  ].join('\n');

  return { subject: EMAIL_SUBJECT, html, text, invitation: inv.type };
}
