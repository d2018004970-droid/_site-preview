/**
 * Quiz "O que está pedindo mais atenção em você?" — Jornada de Si
 *
 * CONFIGURAÇÃO CENTRAL ÚNICA: fases, perguntas, alternativas, pontuação e
 * cálculo do resultado. Este arquivo é usado pela página do quiz, pela função
 * de envio de e-mail (servidor) e pelos testes automatizados. Não duplique a
 * lógica de pontuação em nenhum outro lugar.
 *
 * Regras:
 *  - cada alternativa tem optionId único, exatamente uma phaseId válida e
 *    points inteiro >= 0;
 *  - o cálculo usa apenas as respostas registradas (nada de nome, e-mail,
 *    horário, dispositivo ou aleatoriedade);
 *  - empates nunca são desfeitos automaticamente.
 */

export const OFFICIAL_URL = 'https://www.psiclaudiatilemann.com.br/jornadadesi';
export const QUIZ_TITLE = 'O que está pedindo mais atenção em você?';
export const TOTAL_QUESTIONS = 10;

/* ------------------------------------------------------------------ */
/* FASES OFICIAIS (nomes e ordem conforme site e material da Jornada)  */
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
/* PERGUNTAS E MAPEAMENTO ALTERNATIVA -> FASE -> PONTOS                */
/* Todas as alternativas valem 1 ponto. Cada fase aparece em 8 das 10  */
/* perguntas (pontuação máxima possível por fase: 8).                  */
/* ------------------------------------------------------------------ */
const opt = (questionId, n, phaseId, text) => ({
  questionId,
  optionId: `${questionId}-${n}`,
  phaseId,
  points: 1,
  text
});

export const QUESTIONS = [
  {
    id: 'q1',
    text: 'Quando você para e pensa na sua vida até aqui, o que mais chama a sua atenção?',
    options: [
      opt('q1', 'a', 'raizes', 'Como eu me tornei quem sou hoje, com tudo o que já vivi.'),
      opt('q1', 'b', 'libertacao', 'Algumas coisas que eu acredito sobre mim e que talvez nem sejam bem assim.'),
      opt('q1', 'c', 'fortalecimento', 'Tudo o que eu já enfrentei e consegui, mesmo quando foi difícil.'),
      opt('q1', 'd', 'acolhimento', 'O jeito como eu tenho me tratado no meio de tanta coisa.')
    ]
  },
  {
    id: 'q2',
    text: 'Tem alguma coisa do seu passado que ainda mexe com você?',
    options: [
      opt('q2', 'a', 'acolhimento', 'Momentos difíceis em que eu fui dura demais comigo.'),
      opt('q2', 'b', 'raizes', 'Pessoas e situações que marcaram o jeito como eu me vejo.'),
      opt('q2', 'c', 'visao-de-futuro', 'Sonhos que eu deixei para depois e que ainda me chamam.'),
      opt('q2', 'd', 'libertacao', 'Coisas que eu ouvi sobre mim e que ainda ecoam na minha cabeça.')
    ]
  },
  {
    id: 'q3',
    text: 'Qual dessas cobranças parece mais com as suas?',
    options: [
      opt('q3', 'a', 'libertacao', 'Aquela vozinha que aparece quando alguma coisa não sai como eu queria.'),
      opt('q3', 'b', 'fortalecimento', 'Faço muito, mas sinto que nunca é o suficiente.'),
      opt('q3', 'c', 'visao-de-futuro', 'Sinto que eu já deveria estar em outro ponto da vida.'),
      opt('q3', 'd', 'raizes', 'Cobranças tão antigas que parecem fazer parte de mim.')
    ]
  },
  {
    id: 'q4',
    text: 'O que você gostaria de enxergar mais em você?',
    options: [
      opt('q4', 'a', 'fortalecimento', 'As coisas boas que eu tenho e que, às vezes, nem percebo.'),
      opt('q4', 'b', 'visao-de-futuro', 'O que eu ainda quero viver e para onde quero ir.'),
      opt('q4', 'c', 'raizes', 'Partes de mim que foram ficando esquecidas na correria.'),
      opt('q4', 'd', 'acolhimento', 'Do que eu preciso de verdade, e não só do que os outros precisam.')
    ]
  },
  {
    id: 'q5',
    text: 'Quando a vida aperta, o que costuma te ajudar?',
    options: [
      opt('q5', 'a', 'acolhimento', 'Respirar e tentar ter um pouco mais de paciência comigo.'),
      opt('q5', 'b', 'libertacao', 'Parar e me perguntar: será que é mesmo tão ruim quanto parece?'),
      opt('q5', 'c', 'visao-de-futuro', 'Lembrar do que é importante para mim e pensar no próximo passo.'),
      opt('q5', 'd', 'fortalecimento', 'Lembrar de outras vezes em que eu passei por algo parecido e consegui.')
    ]
  },
  {
    id: 'q6',
    text: 'E as suas vontades e necessidades, como ficam no dia a dia?',
    options: [
      opt('q6', 'a', 'raizes', 'Às vezes eu nem percebo direito o que estou sentindo.'),
      opt('q6', 'b', 'acolhimento', 'Até sei do que preciso, mas quase nunca sobra tempo para mim.'),
      opt('q6', 'c', 'libertacao', 'Acabo pensando que as minhas coisas podem esperar.'),
      opt('q6', 'd', 'fortalecimento', 'Fica mais fácil quando eu lembro do que me faz bem.')
    ]
  },
  {
    id: 'q7',
    text: 'Em que momentos você sente que foi além do seu limite?',
    options: [
      opt('q7', 'a', 'visao-de-futuro', 'Quando abraço tanta coisa que me afasto do que eu quero para mim.'),
      opt('q7', 'b', 'raizes', 'Quando percebo que estou repetindo um jeito antigo de agir.'),
      opt('q7', 'c', 'acolhimento', 'Quando digo "sim", mas por dentro queria dizer "não".'),
      opt('q7', 'd', 'libertacao', 'Quando faço algo só para não decepcionar ninguém.')
    ]
  },
  {
    id: 'q8',
    text: 'Como você descreveria o seu momento agora?',
    options: [
      opt('q8', 'a', 'fortalecimento', 'Dando conta de muita coisa, sem parar para reconhecer isso.'),
      opt('q8', 'b', 'raizes', 'Sentindo muita coisa, mas sem saber bem o quê.'),
      opt('q8', 'c', 'visao-de-futuro', 'Com vontade de mudar algo, mesmo sem saber direito o quê.'),
      opt('q8', 'd', 'acolhimento', 'Cansada, precisando de um pouco mais de cuidado.')
    ]
  },
  {
    id: 'q9',
    text: 'O que você gostaria de levar com você daqui para frente?',
    options: [
      opt('q9', 'a', 'libertacao', 'Mais leveza com os meus próprios pensamentos.'),
      opt('q9', 'b', 'acolhimento', 'Mais carinho e paciência comigo mesma.'),
      opt('q9', 'c', 'fortalecimento', 'Mais confiança em mim e no que eu acredito.'),
      opt('q9', 'd', 'visao-de-futuro', 'Pequenos passos em direção à vida que eu quero.')
    ]
  },
  {
    id: 'q10',
    text: 'Se hoje você tivesse cinco minutinhos só para você, sobre o que gostaria de pensar?',
    options: [
      opt('q10', 'a', 'raizes', 'Sobre quem eu sou, além de tudo o que eu faço pelos outros.'),
      opt('q10', 'b', 'visao-de-futuro', 'Sobre o que eu quero ter mais na minha vida.'),
      opt('q10', 'c', 'fortalecimento', 'Sobre algo que eu conquistei e que merece ser lembrado.'),
      opt('q10', 'd', 'libertacao', 'Sobre um pensamento que anda pesando e que talvez não seja bem assim.')
    ]
  }
];

/** Índice central optionId -> alternativa (usado pelo cálculo e pelos testes). */
export const OPTION_INDEX = Object.freeze(
  Object.fromEntries(QUESTIONS.flatMap((q) => q.options).map((o) => [o.optionId, o]))
);

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
  for (const q of QUESTIONS) {
    if (q.options.length !== 4) errors.push(`${q.id}: deve ter 4 alternativas.`);
    for (const o of q.options) {
      if (seen.has(o.optionId)) errors.push(`optionId duplicado: ${o.optionId}`);
      seen.add(o.optionId);
      if (o.questionId !== q.id) errors.push(`${o.optionId}: questionId incorreto.`);
      if (!PHASE_IDS.includes(o.phaseId)) errors.push(`${o.optionId}: fase inválida (${o.phaseId}).`);
      if (!Number.isInteger(o.points) || o.points < 0) errors.push(`${o.optionId}: pontuação inválida.`);
      if (!o.text || !o.text.trim()) errors.push(`${o.optionId}: texto vazio.`);
    }
  }
  return errors;
}

/* ------------------------------------------------------------------ */
/* CÁLCULO DO RESULTADO                                                */
/* ------------------------------------------------------------------ */

/**
 * answers: objeto { q1: 'q1-a', ..., q10: 'q10-d' }.
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

/** Retorna { scores, max, topPhaseIds, isTie } de forma determinística. */
export function computeScores(answers) {
  assertCompleteAnswers(answers);
  const scores = Object.fromEntries(PHASE_IDS.map((id) => [id, 0]));
  for (const q of QUESTIONS) {
    const option = OPTION_INDEX[answers[q.id]];
    scores[option.phaseId] += option.points;
  }
  const max = Math.max(...Object.values(scores));
  // Ordem estável = ordem oficial das fases (apenas para exibição, nunca para desempate).
  const topPhaseIds = PHASE_IDS.filter((id) => scores[id] === max);
  return { scores, max, topPhaseIds, isTie: topPhaseIds.length > 1 };
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
