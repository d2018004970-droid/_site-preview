/**
 * Quiz "O que está pedindo mais atenção em você?" — Jornada de Si
 *
 * CONFIGURAÇÃO CENTRAL ÚNICA: fases, perguntas, alternativas, pontuação,
 * telas intermediárias e cálculo do resultado. Este arquivo é usado pela
 * página do quiz, pela função de envio de e-mail (servidor) e pelos testes
 * automatizados. Não duplique a lógica de pontuação em nenhum outro lugar.
 *
 * VERSÃO 2 — resumo das mudanças em relação à versão 1:
 *  - 10 perguntas: p2 a p6 pontuam a fase (1 ponto cada, 1 fase por opção);
 *    p1, p7, p8, p9, p10 são de funil (não pontuam), servem para montar o
 *    perfil usado na personalização do e-mail.
 *  - 3 telas intermediárias (sem pontuação, apenas texto), que entram no
 *    meio do fluxo: depois de p2, depois de p5 e depois de p6.
 *  - QUIZ_VERSION identifica esta configuração; o servidor recusa envios
 *    que não informem esta versão (ver netlify/functions/enviar-resultado.mjs).
 *
 * Regras:
 *  - cada alternativa de pergunta "fase" tem optionId único, exatamente uma
 *    phaseId válida e points inteiro >= 0;
 *  - cada alternativa de pergunta "funil" tem optionId único e uma tag;
 *  - o cálculo da fase usa apenas as respostas das perguntas tipo "fase"
 *    (nada de nome, e-mail, horário, dispositivo, respostas de funil ou
 *    aleatoriedade);
 *  - empates nunca são desfeitos automaticamente.
 */

export const QUIZ_VERSION = 2;
export const OFFICIAL_URL = 'https://www.psiclaudiatilemann.com.br/jornadadesi';
export const QUIZ_TITLE = 'O que está pedindo mais atenção em você?';
export const TOTAL_QUESTIONS = 10;

/* ------------------------------------------------------------------ */
/* FASES OFICIAIS (nomes, descrições e atividades — usadas no e-mail)  */
/* ------------------------------------------------------------------ */
export const PHASES = [
  {
    id: 'raizes',
    order: 1,
    name: 'Raízes',
    verb: 'Observar',
    subtitle: 'O que reconheço da minha história',
    color: '#D9939A',
    tint: '#FBEEEF',
    description:
      'Suas respostas apontam para um convite a olhar para a mulher que você é hoje e para as experiências, papéis e emoções que fazem parte do seu caminho. Não para encontrar uma explicação definitiva, mas para observar antes de interpretar.',
    activity: {
      title: 'Quem sou eu hoje?',
      steps: [
        'Pegue um papel ou abra uma nota no celular. Respire com calma por alguns instantes.',
        'Escreva até três papéis que você ocupa hoje (por exemplo: filha, mãe, profissional, amiga). Ao lado de cada um, anote uma palavra sobre como se sente nesse papel.',
        'Complete a frase, sem pensar no que esperam de você: "Hoje, quando olho para mim, eu sou alguém que…"',
        'Releia o que escreveu apenas observando. Não é preciso corrigir, explicar ou concluir nada.'
      ]
    },
    prompts: [
      'Se você tivesse que se apresentar para si mesma hoje, sem pensar no que esperam de você, como se descreveria?',
      'Quais emoções você tem sentido com mais frequência nos últimos dias?',
      'Existe alguma parte de você que gostaria que tivesse mais espaço para ser vista e reconhecida?'
    ]
  },
  {
    id: 'libertacao',
    order: 2,
    name: 'Libertação',
    verb: 'Questionar',
    subtitle: 'O que começo a olhar de outra forma',
    color: '#A985AD',
    tint: '#F5EFF6',
    description:
      'Suas respostas apontam para um convite a observar algumas frases, cobranças e expectativas que costumam acompanhar você. Questionar um pensamento não significa negar sua experiência: significa abrir espaço para perceber que ele pode não contar a história inteira.',
    activity: {
      title: 'Uma frase, outros ângulos',
      steps: [
        'Escreva uma frase sobre você que costuma aparecer quando algo não sai como esperava.',
        'Observe: essa frase lembra alguma mensagem ou expectativa que você ouviu ao longo da vida?',
        'Lembre-se de uma situação concreta que mostra um outro lado dessa história e anote-a.',
        'Reescreva a frase de forma mais acolhedora, realista e respeitosa, sem precisar transformá-la em algo positivo.'
      ]
    },
    prompts: [
      'O pensamento que você escolheu conta toda a história sobre você, ou apenas uma parte dela?',
      'Quando esse pensamento aparece, o que você costuma fazer?',
      'Como você prefere falar consigo da próxima vez que ele aparecer?'
    ]
  },
  {
    id: 'fortalecimento',
    order: 3,
    name: 'Fortalecimento',
    verb: 'Reconhecer',
    subtitle: 'O que reconheço sobre mim',
    color: '#9EA88A',
    tint: '#F1F3EB',
    description:
      'Suas respostas apontam para um convite a dar espaço às suas conquistas, qualidades, valores e recursos que sustentam você. Fortalecer não significa construir uma versão idealizada de si, mas reconhecer aquilo que já está presente.',
    activity: {
      title: 'Um momento que merece ser lembrado',
      steps: [
        'Pense em um momento da sua vida em que você se sentiu satisfeita, realizada ou orgulhosa de si.',
        'Anote em poucas linhas o que aconteceu e por que esse momento foi significativo para você.',
        'Registre o que ajudou você a viver essa experiência: algo em você e, se houver, algo ou alguém que também ajudou.',
        'Escreva uma qualidade sua que apareceu nesse momento, sem precisar provar que ela está presente o tempo todo.'
      ]
    },
    prompts: [
      'O que reconheço em mim quando olho para esse momento?',
      'Quais características suas você aprecia ou gostaria de reconhecer mais?',
      'O que você considera importante preservar ou cultivar na sua vida?'
    ]
  },
  {
    id: 'acolhimento',
    order: 4,
    name: 'Acolhimento',
    verb: 'Cuidar',
    subtitle: 'Como desejo me tratar',
    color: '#E09F84',
    tint: '#FCF0EB',
    description:
      'Suas respostas apontam para um convite a observar como você se trata, especialmente nos momentos difíceis, e a reconhecer suas necessidades e limites. Cuidar de si não significa agir perfeitamente, mas responder à própria experiência com mais respeito, presença e gentileza.',
    activity: {
      title: 'A voz que ofereço a mim',
      steps: [
        'Pense em uma situação recente em que você errou, se frustrou ou viveu um momento difícil. Escolha algo que seja confortável revisitar agora.',
        'Anote o que você se lembra de ter pensado sobre si naquele momento.',
        'Agora escreva como você poderia responder a si mesma hoje, sem apagar o que aconteceu e sem precisar transformar tudo em algo positivo.',
        'Leia as duas formas lado a lado e apenas observe o que percebe.'
      ]
    },
    prompts: [
      'O que você percebe quando lê as duas formas lado a lado?',
      'Existe alguma necessidade, preferência ou limite que você percebe nessa situação?',
      'Qual pequena forma de cuidado consigo caberia na sua rotina nos próximos dias?'
    ]
  },
  {
    id: 'visao-de-futuro',
    order: 5,
    name: 'Visão de futuro',
    verb: 'Levar adiante',
    subtitle: 'O que desejo levar adiante',
    color: '#A1A9C4',
    tint: '#EFF0F6',
    description:
      'Suas respostas apontam para um convite a reunir o que faz sentido para você e transformar isso em pequenos passos possíveis. Seguir em frente não significa ter todas as respostas: uma direção pode começar como uma preferência, uma curiosidade ou algo a que você gostaria de oferecer mais espaço.',
    activity: {
      title: 'Um pequeno movimento',
      steps: [
        'Complete três vezes a frase: "Quero mais espaço na minha vida para…"',
        'Escolha uma das respostas, aquela que hoje parece mais importante para você.',
        'Escreva um pequeno movimento possível nos próximos dias, por menor que seja.',
        'Anote o que poderia ajudar esse movimento a encontrar espaço na sua realidade.'
      ]
    },
    prompts: [
      'Por que isso importa para você neste momento?',
      'Existe alguém ou algum recurso que poderia apoiar você, se quiser?',
      'Se não acontecer como imaginou, o que você poderia reconsiderar?'
    ]
  }
];

export const PHASE_IDS = PHASES.map((p) => p.id);

/* ------------------------------------------------------------------ */
/* PERGUNTAS — p2 a p6 pontuam a fase; p1,p7,p8,p9,p10 são de funil     */
/* (não pontuam, viram "profile" para personalizar o e-mail).          */
/* ------------------------------------------------------------------ */
const faseOpt = (questionId, n, phaseId, text) => ({
  questionId,
  optionId: `${questionId}-${n}`,
  phaseId,
  points: 1,
  text
});
const funilOpt = (questionId, n, tag, text) => ({
  questionId,
  optionId: `${questionId}-${n}`,
  tag,
  text
});

export const QUESTIONS = [
  {
    id: 'p1',
    type: 'funil',
    profile: 'rotina',
    text: 'Como andam os seus dias?',
    options: [
      funilOpt('p1', 'a', 'corridos', 'Corridos, sempre apagando algum incêndio.'),
      funilOpt('p1', 'b', 'cuidando', 'Cheios de gente para cuidar e com pouco tempo para mim.'),
      funilOpt('p1', 'c', 'automatico', 'Organizados, mas parece que vivo no automático.'),
      funilOpt('p1', 'd', 'falta-algo', 'Tranquilos, mas sinto falta de alguma coisa que não sei nomear.')
    ]
  },
  {
    id: 'p2',
    type: 'fase',
    text: 'Quando foi a última vez que você fez algo só para você, sem culpa?',
    options: [
      faseOpt('p2', 'a', 'raizes', 'Nem lembro. Acho que até esqueci do que eu gosto.'),
      faseOpt('p2', 'b', 'libertacao', 'Até faço, mas a culpa vem junto.'),
      faseOpt('p2', 'c', 'acolhimento', 'Faz tempo. Sempre tem alguém precisando mais do que eu.'),
      faseOpt('p2', 'd', 'visao-de-futuro', 'Faço às vezes, mas queria que isso fosse parte da minha vida, e não exceção.')
    ]
  },
  {
    id: 'p3',
    type: 'fase',
    text: 'Qual dessas frases você já pensou sobre si mesma?',
    options: [
      faseOpt('p3', 'a', 'raizes', '"Eu não sou mais a mesma de antes."'),
      faseOpt('p3', 'b', 'libertacao', '"Eu deveria dar conta de tudo."'),
      faseOpt('p3', 'c', 'fortalecimento', '"Nada do que eu faço é suficiente."'),
      faseOpt('p3', 'd', 'acolhimento', '"Eu sempre fico para depois."')
    ]
  },
  {
    id: 'p4',
    type: 'fase',
    text: 'Quando alguém te pede algo que você não quer ou não pode fazer, você…',
    options: [
      faseOpt('p4', 'a', 'libertacao', 'Diz sim, com medo de decepcionar.'),
      faseOpt('p4', 'b', 'acolhimento', 'Diz sim e depois fica sem tempo e sem energia para você.'),
      faseOpt('p4', 'c', 'fortalecimento', 'Até diz não, mas fica insegura se fez certo.'),
      faseOpt('p4', 'd', 'visao-de-futuro', 'Diz sim, mesmo sabendo que isso te afasta do que você quer para a sua vida.')
    ]
  },
  {
    id: 'p5',
    type: 'fase',
    text: 'O que mais pesa para você hoje?',
    options: [
      faseOpt('p5', 'a', 'raizes', 'Sentir que me perdi de mim no meio de tantos papéis.'),
      faseOpt('p5', 'b', 'fortalecimento', 'Não enxergar o quanto eu já fiz e do que sou capaz.'),
      faseOpt('p5', 'c', 'acolhimento', 'O cansaço de cuidar de todo mundo e não ser cuidada.'),
      faseOpt('p5', 'd', 'visao-de-futuro', 'Não saber direito para onde estou indo.')
    ]
  },
  {
    id: 'p6',
    type: 'fase',
    text: 'Se daqui a algumas semanas algo tivesse mudado, o que você mais gostaria de sentir?',
    options: [
      faseOpt('p6', 'a', 'raizes', 'Que voltei a me reconhecer.'),
      faseOpt('p6', 'b', 'libertacao', 'Mais leveza, sem tanta cobrança.'),
      faseOpt('p6', 'c', 'fortalecimento', 'Confiança na minha própria voz.'),
      faseOpt('p6', 'd', 'visao-de-futuro', 'Clareza do que eu quero daqui para frente.')
    ]
  },
  {
    id: 'p7',
    type: 'funil',
    profile: 'formato',
    text: 'Para cuidar de você, o que faria mais sentido?',
    options: [
      funilOpt('p7', 'a', 'ritmo', 'Algo que eu faça no meu ritmo, sem horário marcado.'),
      funilOpt('p7', 'b', 'passo-a-passo', 'Um passo a passo, para eu não ficar perdida.'),
      funilOpt('p7', 'c', 'reservado', 'Algo reservado, sem precisar contar minha história para ninguém.'),
      funilOpt('p7', 'd', 'nao-sei', 'Ainda não sei, quero entender melhor.')
    ]
  },
  {
    id: 'p8',
    type: 'funil',
    profile: 'tempo',
    text: 'Quanto tempo por semana você conseguiria reservar para você?',
    options: [
      funilOpt('p8', 'a', 'quase-nenhum', 'Hoje, quase nenhum.'),
      funilOpt('p8', 'b', 'menos-30', 'Menos de 30 minutos.'),
      funilOpt('p8', 'c', 'cerca-1h', 'Cerca de 1 hora.'),
      funilOpt('p8', 'd', 'mais-1h', 'Mais de 1 hora.')
    ]
  },
  {
    id: 'p9',
    type: 'funil',
    profile: 'obstaculo',
    text: 'O que mais costuma te impedir de cuidar de você?',
    options: [
      funilOpt('p9', 'a', 'tempo', 'Falta de tempo.'),
      funilOpt('p9', 'b', 'culpa', 'Culpa por pensar em mim.'),
      funilOpt('p9', 'c', 'nao-termino', 'Já comecei outras coisas e não terminei.'),
      funilOpt('p9', 'd', 'por-onde-comecar', 'Não sei por onde começar.')
    ]
  },
  {
    id: 'p10',
    type: 'funil',
    profile: 'prontidao',
    text: 'Se existisse um caminho simples para voltar a olhar para você, você começaria?',
    options: [
      funilOpt('p10', 'a', 'agora', 'Sim, estou precisando disso agora.'),
      funilOpt('p10', 'b', 'se-couber', 'Sim, desde que caiba na minha rotina.'),
      funilOpt('p10', 'c', 'talvez', 'Talvez, quero conhecer melhor antes.'),
      funilOpt('p10', 'd', 'depois', 'Agora não, mas quero guardar para depois.')
    ]
  }
];

/** Índice central optionId -> alternativa (usado pelo cálculo e pelos testes). */
export const OPTION_INDEX = Object.freeze(
  Object.fromEntries(QUESTIONS.flatMap((q) => q.options).map((o) => [o.optionId, o]))
);

/* ------------------------------------------------------------------ */
/* TELAS INTERMEDIÁRIAS — sem pontuação, só texto. Entram no fluxo     */
/* depois de p2 (tela-1), depois de p5 (tela-2) e depois de p6 (tela-3)*/
/* ------------------------------------------------------------------ */
export const INTERSTITIALS = {
  'tela-1': {
    afterQuestionId: 'p2',
    paragraphs: [
      'Se você se reconheceu, saiba que não está sozinha. Muitas mulheres passam tanto tempo cuidando de todos que esquecem de si.'
    ],
    quote: 'O problema não é falta de força. É excesso de sobrevivência.'
  },
  'tela-2': {
    afterQuestionId: 'p5',
    paragraphs: [],
    quote: 'O maior risco não é continuar cansada. É olhar pra trás daqui a alguns anos e perceber que você passou tanto tempo cuidando da vida de todos, que esqueceu de viver a sua.'
  },
  'tela-3': {
    afterQuestionId: 'p6',
    paragraphs: [
      'Voltar para si não exige mudar de vida. Começa com pequenas pausas, boas perguntas e um tempo só seu.',
      'Foi pensando nisso que a psicóloga Claudia Tilemann criou a Jornada de Si: um caminho guiado de 5 semanas para mulheres que passaram tanto tempo cuidando de todos que esqueceram de si.'
    ],
    quote: null
  }
};

/** Pelo índice (0-based) da pergunta recém-respondida, qual tela mostrar antes da próxima (ou null). */
export function interstitialAfter(questionIndex) {
  const q = QUESTIONS[questionIndex];
  if (!q) return null;
  for (const [key, v] of Object.entries(INTERSTITIALS)) {
    if (v.afterQuestionId === q.id) return key;
  }
  return null;
}

export function getPhase(id) {
  return PHASES.find((p) => p.id === id) || null;
}

/* ------------------------------------------------------------------ */
/* VALIDAÇÃO DA CONFIGURAÇÃO                                           */
/* ------------------------------------------------------------------ */
export function validateConfig() {
  const errors = [];
  const seen = new Set();
  if (PHASES.length !== 5) errors.push('Devem existir exatamente 5 fases.');
  if (new Set(PHASE_IDS).size !== PHASE_IDS.length) errors.push('IDs de fase duplicados.');
  if (QUESTIONS.length !== TOTAL_QUESTIONS) errors.push(`Devem existir ${TOTAL_QUESTIONS} perguntas.`);
  const faseQuestions = QUESTIONS.filter((q) => q.type === 'fase');
  if (faseQuestions.length !== 5) errors.push('Devem existir exatamente 5 perguntas do tipo "fase" (p2 a p6).');
  for (const q of QUESTIONS) {
    if (!['fase', 'funil'].includes(q.type)) errors.push(`${q.id}: tipo inválido (${q.type}).`);
    if (q.options.length !== 4) errors.push(`${q.id}: deve ter 4 alternativas.`);
    if (q.type === 'funil' && !q.profile) errors.push(`${q.id}: pergunta de funil sem "profile".`);
    const phasesInQuestion = new Set();
    for (const o of q.options) {
      if (seen.has(o.optionId)) errors.push(`optionId duplicado: ${o.optionId}`);
      seen.add(o.optionId);
      if (o.questionId !== q.id) errors.push(`${o.optionId}: questionId incorreto.`);
      if (!o.text || !o.text.trim()) errors.push(`${o.optionId}: texto vazio.`);
      if (q.type === 'fase') {
        if (!PHASE_IDS.includes(o.phaseId)) errors.push(`${o.optionId}: fase inválida (${o.phaseId}).`);
        if (!Number.isInteger(o.points) || o.points < 0) errors.push(`${o.optionId}: pontuação inválida.`);
        if (phasesInQuestion.has(o.phaseId)) errors.push(`${q.id}: fase repetida na mesma pergunta (${o.phaseId}).`);
        phasesInQuestion.add(o.phaseId);
      } else if (q.type === 'funil') {
        if (!o.tag || !String(o.tag).trim()) errors.push(`${o.optionId}: tag vazia.`);
      }
    }
  }
  // Cada fase deve aparecer em exatamente 4 das 5 perguntas "fase" (fica de fora de 1).
  for (const phaseId of PHASE_IDS) {
    const count = faseQuestions.filter((q) => q.options.some((o) => o.phaseId === phaseId)).length;
    if (count !== 4) errors.push(`Fase "${phaseId}" aparece em ${count} perguntas de fase (esperado: 4).`);
  }
  return errors;
}

/* ------------------------------------------------------------------ */
/* CÁLCULO DO RESULTADO                                                */
/* ------------------------------------------------------------------ */

/**
 * answers: objeto { p1: 'p1-a', ..., p10: 'p10-d' }.
 * Lança erro se faltar resposta, se houver resposta inválida ou extra.
 */
export function assertCompleteAnswers(answers) {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    throw new Error('Respostas ausentes.');
  }
  const keys = Object.keys(answers);
  for (const k of keys) {
    if (!QUESTIONS.some((q) => q.id === k)) throw new Error(`Pergunta desconhecida: ${k}`);
  }
  for (const q of QUESTIONS) {
    const optionId = answers[q.id];
    if (!optionId) throw new Error(`Resposta obrigatória ausente: ${q.id}`);
    const option = OPTION_INDEX[optionId];
    if (!option || option.questionId !== q.id) throw new Error(`Resposta inválida para ${q.id}: ${optionId}`);
  }
}

export function isComplete(answers) {
  try {
    assertCompleteAnswers(answers);
    return true;
  } catch {
    return false;
  }
}

/** Retorna { scores, max, topPhaseIds, isTie } de forma determinística. Usa só p2–p6. */
export function computeScores(answers) {
  assertCompleteAnswers(answers);
  const scores = Object.fromEntries(PHASE_IDS.map((id) => [id, 0]));
  for (const q of QUESTIONS) {
    if (q.type !== 'fase') continue;
    const option = OPTION_INDEX[answers[q.id]];
    scores[option.phaseId] += option.points;
  }
  const max = Math.max(...Object.values(scores));
  // Ordem estável = ordem oficial das fases (apenas para exibição, nunca para desempate).
  const topPhaseIds = PHASE_IDS.filter((id) => scores[id] === max);
  return { scores, max, topPhaseIds, isTie: topPhaseIds.length > 1 };
}

/**
 * Perfil de funil (p1, p7, p8, p9, p10) — usado só para personalizar o
 * e-mail. Nunca influencia a fase. { rotina, formato, tempo, obstaculo, prontidao }
 */
export function getProfile(answers) {
  assertCompleteAnswers(answers);
  const profile = {};
  for (const q of QUESTIONS) {
    if (q.type !== 'funil') continue;
    const option = OPTION_INDEX[answers[q.id]];
    profile[q.profile] = option ? option.tag : undefined;
  }
  return profile;
}

/**
 * Resolve o resultado final.
 * choice: undefined (sem empate), um phaseId entre os empatados ("explorar
 * primeiro") ou 'todas' (participante preferiu não escolher).
 * Retorno: { mode: 'single'|'chosen'|'combined', primary, phaseIds, tiedPhaseIds, scores }
 */
export function resolveResult(answers, choice) {
  const { scores, topPhaseIds, isTie } = computeScores(answers);
  if (!isTie) {
    return { mode: 'single', primary: topPhaseIds[0], phaseIds: [topPhaseIds[0]], tiedPhaseIds: [], scores };
  }
  if (choice && choice !== 'todas') {
    if (!topPhaseIds.includes(choice)) throw new Error('Escolha não corresponde às fases empatadas.');
    return { mode: 'chosen', primary: choice, phaseIds: [choice], tiedPhaseIds: topPhaseIds, scores };
  }
  if (choice === 'todas') {
    return { mode: 'combined', primary: null, phaseIds: topPhaseIds, tiedPhaseIds: topPhaseIds, scores };
  }
  throw new Error('Empate: é necessário escolher uma fase ou "todas".');
}

/* ------------------------------------------------------------------ */
/* SESSÃO (estado do quiz na interface)                                */
/* ------------------------------------------------------------------ */
export function createSession() {
  return { answers: {}, current: 0, choice: undefined, submissionId: null };
}

export function selectAnswer(session, questionId, optionId) {
  const option = OPTION_INDEX[optionId];
  if (!option || option.questionId !== questionId) throw new Error('Alternativa inválida.');
  session.answers = { ...session.answers, [questionId]: optionId };
  return session;
}

export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const v = email.trim();
  if (v.length > 254) return false;
  return /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/.test(v);
}
