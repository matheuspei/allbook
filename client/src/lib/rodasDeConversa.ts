/**
 * As Rodas de conversa — a ideia do Orkut, com o nome da casa (28/07).
 *
 * O Matheus lembrou das comunidades do Orkut: você entrava numa comunidade,
 * dentro dela havia **tópicos**, e cada tópico tinha o seu fio de respostas.
 * Aqui a estrutura é a mesma — **Roda → tópicos → respostas** — com o nome
 * "Roda" porque "comunidade dentro da Comunidade" confundiria, e a palavra já
 * é do app ("Formador de Roda", "a sua roda").
 *
 * **O nível que faltava:** a sala do livro conversa sobre UM livro; o clube é
 * uma turma com prazo; a Roda conversa sobre UM ASSUNTO ("Suspense &
 * Mistério", "Quem ouve no trânsito") — é a casa do pedido de indicação por
 * tema, que estava anotado no roteiro esperando lugar.
 *
 * **Quem pode o quê:** entrar é livre (um toque); criar tópico e responder é
 * para quem entrou. Como tudo no app: as rodas e os fios dos leitores
 * fictícios são o esqueleto semeado; o que VOCÊ faz mora no `localStorage`
 * (participações, tópicos e respostas) e sobrevive a recarregar.
 *
 * O arquivo se chama `rodasDeConversa` e não `rodas` porque `lib/rodas.ts` já
 * existe — é a **rodada** do clube, da janela A, outra coisa.
 */

import { community, type CommunityMember } from "@/lib/community";

const PARTICIPO_KEY = "allbook_rodas_participo";
const MEUS_TOPICOS_KEY = "allbook_rodas_meus_topicos";
const MINHAS_RESPOSTAS_KEY = "allbook_rodas_minhas_respostas";

/** Aviso de mudança — as telas releem sem recarregar. */
export const RODAS_EVENT = "allbook:rodas";

/** Tamanhos: título curto de fórum; resposta um pouco maior que post do mural. */
export const MAX_TITULO = 120;
export const MAX_RESPOSTA = 400;

export interface Roda {
  id: string;
  nome: string;
  /** O ícone da roda — emoji, como as comunidades do Orkut tinham imagem. */
  emoji: string;
  descricao: string;
  /** Slugs de `community.ts` que "moram" nesta roda. */
  membros: string[];
}

export interface RespostaSemeada {
  autorSlug: string;
  texto: string;
  /** ISO (só dia). */
  date: string;
}

export interface TopicoSemeado {
  id: string;
  rodaId: string;
  titulo: string;
  autorSlug: string;
  date: string;
  /** Fixado no topo da roda (o 📌 do Orkut). */
  fixado?: boolean;
  respostas: RespostaSemeada[];
}

/* ------------------------------------------------------------------ *
 * O esqueleto — rodas e fios fictícios, para dar o que ler no dia 1
 * ------------------------------------------------------------------ */

export const rodas: Roda[] = [
  {
    id: "suspense-misterio",
    nome: "Suspense & Mistério",
    emoji: "🕵️",
    descricao:
      "Reviravolta, narrador não confiável e o medo de dar play no último capítulo.",
    membros: ["ana-paula", "marcos-v", "beto", "carla-lima", "ricardo"],
  },
  {
    id: "quem-ouve-no-transito",
    nome: "Quem ouve no trânsito",
    emoji: "🚗",
    descricao: "O carro é a nossa poltrona de leitura. Dicas, manias e horários.",
    membros: ["marcos-v", "felipe-g", "ricardo"],
  },
  {
    id: "classicos",
    nome: "Clássicos",
    emoji: "📚",
    descricao: "O que envelheceu bem — e o que só faz sentido com uma boa narração.",
    membros: ["juliana-s", "luciana", "ana-paula", "carla-lima"],
  },
  {
    id: "ficcao-cientifica",
    nome: "Ficção Científica",
    emoji: "🚀",
    descricao: "Mundos inteiros no fone de ouvido, de Duna a Fundação.",
    membros: ["carla-lima", "felipe-g", "ricardo"],
  },
  {
    id: "habitos-vida-real",
    nome: "Hábitos na vida real",
    emoji: "💪",
    descricao: "O que a gente ouviu em Produtividade — e o que funcionou de verdade.",
    membros: ["ricardo", "luciana", "beto", "felipe-g"],
  },
];

const topicosSemeados: TopicoSemeado[] = [
  {
    id: "t-garota-final",
    rodaId: "suspense-misterio",
    titulo: 'Final de "Garota Exemplar": genial ou trapaça?',
    autorSlug: "ana-paula",
    date: "2026-07-26",
    fixado: true,
    respostas: [
      {
        autorSlug: "ana-paula",
        texto:
          "Pra mim é genial. A pista estava lá o tempo todo e ninguém viu. Quem releu o capítulo 3 depois do final me entende.",
        date: "2026-07-26",
      },
      {
        autorSlug: "marcos-v",
        texto:
          "Discordo — trapaça elegante ainda é trapaça. O narrador esconde o que só ele sabia, e isso quebra o combinado com quem ouve.",
        date: "2026-07-26",
      },
      {
        autorSlug: "juliana-s",
        texto:
          "O áudio deixa melhor: a narradora muda o tom nos diários e você DEVIA ter desconfiado. A culpa é nossa.",
        date: "2026-07-27",
      },
      {
        autorSlug: "beto",
        texto: "Genial. Ponto. E eu nunca mais confiei em personagem que escreve diário.",
        date: "2026-07-27",
      },
    ],
  },
  {
    id: "t-narrador-suspense",
    rodaId: "suspense-misterio",
    titulo: "Narrador de suspense: sussurro ou voz firme?",
    autorSlug: "marcos-v",
    date: "2026-07-24",
    respostas: [
      {
        autorSlug: "marcos-v",
        texto:
          "Voz firme. Sussurro em cena de tensão me faz aumentar o volume — e aí o susto estoura o ouvido.",
        date: "2026-07-24",
      },
      {
        autorSlug: "carla-lima",
        texto: "Depende do livro: o Aurélio Prado segura o Massacre inteiro quase falando baixo.",
        date: "2026-07-25",
      },
    ],
  },
  {
    id: "t-indicacao-suspense",
    rodaId: "suspense-misterio",
    titulo: "Me indiquem: suspense curto pra maratonar no feriado",
    autorSlug: "ricardo",
    date: "2026-07-21",
    respostas: [
      {
        autorSlug: "ana-paula",
        texto: "A empregada. Curto, rápido e o fim te dá um tapa. Ouvi em dois dias.",
        date: "2026-07-21",
      },
      {
        autorSlug: "carla-lima",
        texto: "A Paciente Silenciosa — e não leia NADA sobre antes de começar.",
        date: "2026-07-22",
      },
    ],
  },
  {
    id: "t-velocidade-transito",
    rodaId: "quem-ouve-no-transito",
    titulo: "Velocidade 1,5x no trânsito: prática ou heresia?",
    autorSlug: "marcos-v",
    date: "2026-07-23",
    respostas: [
      {
        autorSlug: "marcos-v",
        texto: "1,2x é o meu teto. Acima disso eu chego na reunião sem saber o que ouvi.",
        date: "2026-07-23",
      },
      {
        autorSlug: "felipe-g",
        texto: "Heresia nenhuma: biografia aguenta 1,5x fácil. Romance é que não dá.",
        date: "2026-07-24",
      },
    ],
  },
  {
    id: "t-capitulo-acaba",
    rodaId: "quem-ouve-no-transito",
    titulo: "O capítulo acabou e você ainda não chegou: o que fazem?",
    autorSlug: "felipe-g",
    date: "2026-07-19",
    respostas: [
      {
        autorSlug: "luciana",
        texto: "Dou mais uma volta no quarteirão. Sem vergonha nenhuma.",
        date: "2026-07-20",
      },
    ],
  },
  {
    id: "t-elizabeth-audio",
    rodaId: "classicos",
    titulo: "Orgulho e Preconceito: a Elizabeth do áudio supera a do papel?",
    autorSlug: "juliana-s",
    date: "2026-07-22",
    respostas: [
      {
        autorSlug: "juliana-s",
        texto:
          "A Helena Vasques faz a ironia da Elizabeth aparecer ONDE eu não tinha percebido lendo. Pra mim, supera.",
        date: "2026-07-22",
      },
      {
        autorSlug: "luciana",
        texto: "Reouvi duas vezes só pelos diálogos com o Darcy. O timing dela é perfeito.",
        date: "2026-07-23",
      },
    ],
  },
  {
    id: "t-1984-medo",
    rodaId: "classicos",
    titulo: "1984 em áudio dá mais medo do que no papel?",
    autorSlug: "carla-lima",
    date: "2026-07-18",
    respostas: [
      {
        autorSlug: "juliana-s",
        texto: "Dá. A voz do Diogo Serrano no interrogatório é um pesadelo — elogio, claro.",
        date: "2026-07-19",
      },
    ],
  },
  {
    id: "t-duna-audio",
    rodaId: "ficcao-cientifica",
    titulo: "Duna: dá pra começar pelo áudio ou se perde nos nomes?",
    autorSlug: "carla-lima",
    date: "2026-07-20",
    respostas: [
      {
        autorSlug: "carla-lima",
        texto:
          "Comecei pelo áudio e não me perdi: os nomes assustam menos quando alguém os pronuncia por você.",
        date: "2026-07-20",
      },
      {
        autorSlug: "ricardo",
        texto: "Concordo, mas ouçam com a ficha do livro aberta na primeira hora. Ajuda muito.",
        date: "2026-07-21",
      },
    ],
  },
  {
    id: "t-habitos-funcionou",
    rodaId: "habitos-vida-real",
    titulo: "Hábitos Atômicos: o que funcionou de verdade pra vocês?",
    autorSlug: "luciana",
    date: "2026-07-25",
    respostas: [
      {
        autorSlug: "luciana",
        texto: "A regra dos 2 minutos. Foi ela que me fez voltar a ouvir todo dia, aliás.",
        date: "2026-07-25",
      },
      {
        autorSlug: "ricardo",
        texto: "Empilhar hábito: audiolivro junto com a caminhada. Nunca mais falhei os dois.",
        date: "2026-07-26",
      },
    ],
  },
];

/* ------------------------------------------------------------------ *
 * O que é SEU — participações, tópicos e respostas
 * ------------------------------------------------------------------ */

export interface MeuTopico {
  id: string;
  rodaId: string;
  titulo: string;
  date: string;
}

export interface MinhaResposta {
  id: string;
  topicoId: string;
  texto: string;
  date: string;
}

function lerLista<T>(chave: string): T[] {
  try {
    const stored = JSON.parse(localStorage.getItem(chave) || "[]");
    return Array.isArray(stored) ? (stored as T[]) : [];
  } catch {
    return [];
  }
}

function gravarLista<T>(chave: string, lista: T[]): void {
  localStorage.setItem(chave, JSON.stringify(lista));
  window.dispatchEvent(new Event(RODAS_EVENT));
}

export function rodasQueParticipo(): string[] {
  return lerLista<string>(PARTICIPO_KEY);
}

export function participoDa(rodaId: string): boolean {
  return rodasQueParticipo().includes(rodaId);
}

/** Entra ou sai. Devolve o estado novo (true = dentro). */
export function alternarParticipacao(rodaId: string): boolean {
  const atual = rodasQueParticipo();
  const dentro = atual.includes(rodaId);
  gravarLista(PARTICIPO_KEY, dentro ? atual.filter((id) => id !== rodaId) : [...atual, rodaId]);
  return !dentro;
}

export function meusTopicos(): MeuTopico[] {
  return lerLista<MeuTopico>(MEUS_TOPICOS_KEY);
}

/** Cria um tópico seu numa roda. Título vazio não cria. */
export function criarTopico(rodaId: string, titulo: string): MeuTopico | null {
  const clean = titulo.trim().slice(0, MAX_TITULO);
  if (!clean || !rodaPorId(rodaId)) return null;
  const topico: MeuTopico = {
    id: `meu-t-${Date.now()}`,
    rodaId,
    titulo: clean,
    date: new Date().toISOString(),
  };
  gravarLista(MEUS_TOPICOS_KEY, [...meusTopicos(), topico]);
  return topico;
}

export function apagarMeuTopico(id: string): void {
  gravarLista(MEUS_TOPICOS_KEY, meusTopicos().filter((item) => item.id !== id));
  // As suas respostas dentro dele perdem o pai — saem junto.
  gravarLista(
    MINHAS_RESPOSTAS_KEY,
    minhasRespostas().filter((item) => item.topicoId !== id),
  );
}

export function minhasRespostas(): MinhaResposta[] {
  return lerLista<MinhaResposta>(MINHAS_RESPOSTAS_KEY);
}

/** Responde a um tópico (semeado ou seu). Texto vazio não entra. */
export function responder(topicoId: string, texto: string): MinhaResposta | null {
  const clean = texto.trim().slice(0, MAX_RESPOSTA);
  if (!clean) return null;
  const resposta: MinhaResposta = {
    id: `minha-r-${Date.now()}`,
    topicoId,
    texto: clean,
    date: new Date().toISOString(),
  };
  gravarLista(MINHAS_RESPOSTAS_KEY, [...minhasRespostas(), resposta]);
  return resposta;
}

export function apagarMinhaResposta(id: string): void {
  gravarLista(MINHAS_RESPOSTAS_KEY, minhasRespostas().filter((item) => item.id !== id));
}

/* ------------------------------------------------------------------ *
 * As leituras que as telas usam — esqueleto + o seu, já juntos
 * ------------------------------------------------------------------ */

export function rodaPorId(id: string): Roda | undefined {
  return rodas.find((roda) => roda.id === id);
}

/** Um tópico como a tela vê: semeado ou seu, com contagem e última data. */
export interface TopicoNaTela {
  id: string;
  rodaId: string;
  titulo: string;
  /** Membro fictício, ou `null` = você. */
  autor: CommunityMember | null;
  date: string;
  fixado: boolean;
  /** Você criou — pode apagar. */
  meu: boolean;
  totalRespostas: number;
  ultimaAtividade: string;
}

function contarRespostas(topicoId: string, semeadas: RespostaSemeada[]): {
  total: number;
  ultima: string;
  base: string;
} {
  const minhas = minhasRespostas().filter((item) => item.topicoId === topicoId);
  const datas = [
    ...semeadas.map((item) => item.date),
    ...minhas.map((item) => item.date.slice(0, 10)),
  ].sort();
  return {
    total: semeadas.length + minhas.length,
    ultima: datas[datas.length - 1] ?? "",
    base: datas[0] ?? "",
  };
}

/** Os tópicos de uma roda: fixado primeiro, depois pela última atividade. */
export function topicosDa(rodaId: string): TopicoNaTela[] {
  const doEsqueleto: TopicoNaTela[] = topicosSemeados
    .filter((topico) => topico.rodaId === rodaId)
    .map((topico) => {
      const { total, ultima } = contarRespostas(topico.id, topico.respostas);
      return {
        id: topico.id,
        rodaId,
        titulo: topico.titulo,
        autor: community.find((member) => member.slug === topico.autorSlug) ?? null,
        date: topico.date,
        fixado: topico.fixado === true,
        meu: false,
        totalRespostas: total,
        ultimaAtividade: ultima || topico.date,
      };
    });

  const meus: TopicoNaTela[] = meusTopicos()
    .filter((topico) => topico.rodaId === rodaId)
    .map((topico) => {
      const { total, ultima } = contarRespostas(topico.id, []);
      return {
        id: topico.id,
        rodaId,
        titulo: topico.titulo,
        autor: null,
        date: topico.date,
        fixado: false,
        meu: true,
        totalRespostas: total,
        ultimaAtividade: ultima || topico.date.slice(0, 10),
      };
    });

  return [...doEsqueleto, ...meus].sort(
    (a, b) =>
      Number(b.fixado) - Number(a.fixado) ||
      b.ultimaAtividade.localeCompare(a.ultimaAtividade),
  );
}

/** Uma resposta como o fio mostra. */
export interface RespostaNaTela {
  id: string;
  autor: CommunityMember | null;
  texto: string;
  date: string;
  minha: boolean;
}

export function tituloDoTopico(topicoId: string): TopicoNaTela | undefined {
  for (const roda of rodas) {
    const achado = topicosDa(roda.id).find((topico) => topico.id === topicoId);
    if (achado) return achado;
  }
  return undefined;
}

/** O fio: respostas semeadas + as suas, na ordem em que chegaram. */
export function fioDo(topicoId: string): RespostaNaTela[] {
  const semeado = topicosSemeados.find((topico) => topico.id === topicoId);
  const doEsqueleto: RespostaNaTela[] = (semeado?.respostas ?? []).map((item, indice) => ({
    id: `${topicoId}-r${indice}`,
    autor: community.find((member) => member.slug === item.autorSlug) ?? null,
    texto: item.texto,
    date: item.date,
    minha: false,
  }));

  const minhas: RespostaNaTela[] = minhasRespostas()
    .filter((item) => item.topicoId === topicoId)
    .map((item) => ({
      id: item.id,
      autor: null,
      texto: item.texto,
      date: item.date.slice(0, 10),
      minha: true,
    }));

  return [...doEsqueleto, ...minhas].sort((a, b) => a.date.localeCompare(b.date));
}

/** O resumo que a vitrine da Comunidade mostra. */
export function resumoDasRodas(): {
  roda: Roda;
  totalTopicos: number;
  totalPessoas: number;
  participo: boolean;
}[] {
  return rodas.map((roda) => ({
    roda,
    totalTopicos: topicosDa(roda.id).length,
    // Você conta quando entrou — o esqueleto não vira número inflado.
    totalPessoas: roda.membros.length + (participoDa(roda.id) ? 1 : 0),
    participo: participoDa(roda.id),
  }));
}
