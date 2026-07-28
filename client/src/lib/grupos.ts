/**
 * Os **fóruns** — comunidade → tópicos → respostas, a estrutura do Orkut.
 *
 * **Na tela chama-se "Fórum"; no código, `grupo`.** A troca de nome é de 28/07
 * (ROTEIRO 4.44) e não é cosmética: o Matheus tinha pedido um "grupo" com dono,
 * privacidade e expulsão, e a janela A mostrou que isso era, funcionalmente, **o
 * clube de leitura sem livro** — dois produtos convergindo para o mesmo ponto.
 * Ele então corrigiu o rumo: *"a ideia do grupo talvez seja ruim, mas a ideia do
 * fórum é boa"*. Fórum e clube não competem, porque **um fórum de 300 pessoas
 * funciona melhor que um de 8, e um clube de 300 não funciona**.
 *
 * Os identificadores continuam `grupo` porque renomeá-los mexeria em chaves do
 * `localStorage` de quem já usa, sem nada mudar para quem vê. Se um dia forem
 * renomeados, a tela não muda — ela já diz Fórum.
 *
 * **O nível que faltava:** a sala do livro conversa sobre UM livro; o clube é uma
 * turma com prazo; o fórum conversa sobre UM ASSUNTO ("Suspense & Mistério",
 * "Quem ouve no trânsito"), sem fim e sem compromisso.
 *
 * **Quem pode o quê:** entrar é livre (um toque); criar tópico e responder é para
 * quem entrou; **quem criou o fórum modera o conteúdo** (esconder, fixar, cobrir
 * spoiler) mas não pode apagá-lo depois que outras pessoas escreveram lá — ver a
 * seção de moderação, mais abaixo.
 *
 * Como tudo no app: os fóruns e os fios dos leitores fictícios são o esqueleto
 * semeado; o que VOCÊ faz mora no `localStorage` e sobrevive a recarregar.
 */

import { type Citacao } from "@/lib/citacoes";
import { community, type CommunityMember } from "@/lib/community";

const PARTICIPO_KEY = "allbook_grupos_participo";
const MEUS_TOPICOS_KEY = "allbook_grupos_meus_topicos";
const MINHAS_RESPOSTAS_KEY = "allbook_grupos_minhas_respostas";

/** Aviso de mudança — as telas releem sem recarregar. */
export const GRUPOS_EVENT = "allbook:grupos";

/** Tamanhos: título curto de fórum; resposta um pouco maior que post do mural. */
export const MAX_TITULO = 120;
export const MAX_RESPOSTA = 400;

export interface Grupo {
  id: string;
  nome: string;
  /** O ícone do grupo — emoji, como as comunidades do Orkut tinham imagem. */
  emoji: string;
  descricao: string;
  /** Slugs de `community.ts` que "moram" neste grupo. */
  membros: string[];
  /** Você criou — pode apagar, e ele mora no `localStorage`. */
  meu?: boolean;
}

export interface RespostaSemeada {
  autorSlug: string;
  texto: string;
  /** ISO (só dia). */
  date: string;
}

export interface TopicoSemeado {
  id: string;
  grupoId: string;
  titulo: string;
  autorSlug: string;
  date: string;
  /** Fixado no topo do grupo (o 📌 do Orkut). */
  fixado?: boolean;
  respostas: RespostaSemeada[];
}

/* ------------------------------------------------------------------ *
 * O esqueleto — grupos e fios fictícios, para dar o que ler no dia 1
 * ------------------------------------------------------------------ */

export const grupos: Grupo[] = [
  /*
   * **Este fórum é seu**, e existe por um motivo prático (ROTEIRO 4.44): um
   * fórum recém-criado nasce vazio, sem tópico de outra pessoa dentro — e a
   * moderação que o Matheus pediu nasceria como botão morto, que é o que a 4.23
   * manda varrer. Marcá-lo como seu dá o que moderar. Mesmo precedente do clube
   * "Suspense de Domingo", e pela mesma razão.
   */
  {
    id: "suspense-misterio",
    nome: "Suspense & Mistério",
    emoji: "🕵️",
    descricao:
      "Reviravolta, narrador não confiável e o medo de dar play no último capítulo. Este é seu: dá para fixar e esconder o que aparece aqui.",
    membros: ["ana-paula", "marcos-v", "beto", "carla-lima", "ricardo"],
    meu: true,
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
    grupoId: "suspense-misterio",
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
    grupoId: "suspense-misterio",
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
    grupoId: "suspense-misterio",
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
    grupoId: "quem-ouve-no-transito",
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
    grupoId: "quem-ouve-no-transito",
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
    grupoId: "classicos",
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
    grupoId: "classicos",
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
    grupoId: "ficcao-cientifica",
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
    grupoId: "habitos-vida-real",
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
  grupoId: string;
  titulo: string;
  date: string;
}

export interface MinhaResposta {
  id: string;
  topicoId: string;
  texto: string;
  date: string;
  /** Um trecho do áudio citado junto (ROTEIRO 4.45). */
  citacao?: Citacao;
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
  window.dispatchEvent(new Event(GRUPOS_EVENT));
}

/* — os grupos que VOCÊ cria (pedido de 28/07: "eu não posso criar um grupo?") — */

const MEUS_GRUPOS_KEY = "allbook_grupos_meus";

export function meusGrupos(): Grupo[] {
  return lerLista<Grupo>(MEUS_GRUPOS_KEY).map((grupo) => ({ ...grupo, meu: true }));
}

/** Cria um grupo seu. Nome vazio não cria; emoji vazio ganha o padrão 💬. */
export function criarGrupo(nome: string, emoji: string, descricao: string): Grupo | null {
  const nomeLimpo = nome.trim().slice(0, 40);
  if (!nomeLimpo) return null;
  const grupo: Grupo = {
    id: `meu-g-${Date.now()}`,
    nome: nomeLimpo,
    emoji: emoji.trim().slice(0, 4) || "💬",
    descricao: descricao.trim().slice(0, 160),
    membros: [],
    meu: true,
  };
  gravarLista(MEUS_GRUPOS_KEY, [...lerLista<Grupo>(MEUS_GRUPOS_KEY), grupo]);
  // Quem cria, participa — criar já é o maior gesto de entrada.
  const participo = lerLista<string>(PARTICIPO_KEY);
  if (!participo.includes(grupo.id)) gravarLista(PARTICIPO_KEY, [...participo, grupo.id]);
  return grupo;
}

/** Apaga um grupo seu — os tópicos e respostas que você criou nele vão junto. */
export function apagarMeuGrupo(id: string): void {
  gravarLista(MEUS_GRUPOS_KEY, lerLista<Grupo>(MEUS_GRUPOS_KEY).filter((g) => g.id !== id));
  gravarLista(PARTICIPO_KEY, lerLista<string>(PARTICIPO_KEY).filter((p) => p !== id));
  for (const topico of meusTopicos().filter((t) => t.grupoId === id)) {
    apagarMeuTopico(topico.id);
  }
}

/** Todos os grupos que existem: os semeados e os seus. */
export function todosOsGrupos(): Grupo[] {
  return [...grupos, ...meusGrupos()];
}

export function gruposQueParticipo(): string[] {
  return lerLista<string>(PARTICIPO_KEY);
}

export function participoDa(grupoId: string): boolean {
  return gruposQueParticipo().includes(grupoId);
}

/** Entra ou sai. Devolve o estado novo (true = dentro). */
export function alternarParticipacao(grupoId: string): boolean {
  const atual = gruposQueParticipo();
  const dentro = atual.includes(grupoId);
  gravarLista(PARTICIPO_KEY, dentro ? atual.filter((id) => id !== grupoId) : [...atual, grupoId]);
  return !dentro;
}

export function meusTopicos(): MeuTopico[] {
  return lerLista<MeuTopico>(MEUS_TOPICOS_KEY);
}

/** Cria um tópico seu numo grupo. Título vazio não cria. */
export function criarTopico(grupoId: string, titulo: string): MeuTopico | null {
  const clean = titulo.trim().slice(0, MAX_TITULO);
  if (!clean || !grupoPorId(grupoId)) return null;
  const topico: MeuTopico = {
    id: `meu-t-${Date.now()}`,
    grupoId,
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
export function responder(
  topicoId: string,
  texto: string,
  citacao?: Citacao,
): MinhaResposta | null {
  const clean = texto.trim().slice(0, MAX_RESPOSTA);
  /* Resposta só com trecho vale: às vezes o trecho já é a resposta. */
  if (!clean && !citacao) return null;
  const resposta: MinhaResposta = {
    id: `minha-r-${Date.now()}`,
    topicoId,
    texto: clean,
    date: new Date().toISOString(),
    ...(citacao ? { citacao } : {}),
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

export function grupoPorId(id: string): Grupo | undefined {
  return todosOsGrupos().find((grupo) => grupo.id === id);
}

/** Um tópico como a tela vê: semeado ou seu, com contagem e última data. */
export interface TopicoNaTela {
  id: string;
  grupoId: string;
  titulo: string;
  /** Membro fictício, ou `null` = você. */
  autor: CommunityMember | null;
  date: string;
  fixado: boolean;
  /** Você criou — pode apagar. */
  meu: boolean;
  /** O dono do fórum escondeu (ROTEIRO 4.44). */
  escondido: boolean;
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

/* ------------------------------------------------------------------ *
 * Moderação de conteúdo — o poder de quem criou (28/07, ROTEIRO 4.44).
 *
 * **A decisão do Matheus, e o que ficou de fora.** Ele pediu que quem cria
 * pudesse *"excluir em algum momento isso"*. Moderar **conteúdo** entrou sem
 * ressalva: esconder resposta, esconder tópico, fixar, cobrir spoiler. Destruir
 * o fórum inteiro, não — um fórum com gente dentro guarda o trabalho de outras
 * pessoas, e apagá-lo é apagar o que não é seu. Isso é o contrário do clube, que
 * tem oito pessoas e **acaba de qualquer jeito** quando o ciclo fecha; por lá
 * apagar é legítimo (§4.40).
 *
 * **A regra que sobrou:** apagar só enquanto o fórum for **só seu** — nenhum
 * tópico de outra pessoa dentro. Passado disso, o criador esconde o que precisa,
 * mas a casa fica de pé.
 *
 * **Esconder, e não apagar de verdade**, pelo mesmo motivo do mural do clube:
 * moderação errada acontece, e sem volta ela custa uma pessoa. Tudo o que se
 * esconde aqui pode ser devolvido.
 * ------------------------------------------------------------------ */

const MODERACAO_KEY = "allbook_grupos_moderacao";

interface Moderacao {
  /** Ids de tópicos escondidos pelo dono do fórum. */
  topicos: string[];
  /** Ids de respostas escondidas. */
  respostas: string[];
  /** Ids de tópicos que o dono fixou no topo. */
  fixados: string[];
  /** Ids de respostas cobertas como spoiler pelo dono. */
  spoilers: string[];
}

const SEM_MODERACAO: Moderacao = { topicos: [], respostas: [], fixados: [], spoilers: [] };

function lerModeracao(): Moderacao {
  try {
    const guardado = JSON.parse(localStorage.getItem(MODERACAO_KEY) || "null");
    if (!guardado || typeof guardado !== "object") return SEM_MODERACAO;
    return {
      topicos: Array.isArray(guardado.topicos) ? guardado.topicos : [],
      respostas: Array.isArray(guardado.respostas) ? guardado.respostas : [],
      fixados: Array.isArray(guardado.fixados) ? guardado.fixados : [],
      spoilers: Array.isArray(guardado.spoilers) ? guardado.spoilers : [],
    };
  } catch {
    return SEM_MODERACAO;
  }
}

function gravarModeracao(estado: Moderacao): void {
  localStorage.setItem(MODERACAO_KEY, JSON.stringify(estado));
  window.dispatchEvent(new Event(GRUPOS_EVENT));
}

/** Você criou este fórum — e portanto modera o que acontece nele. */
export function souDonoDo(grupoId: string): boolean {
  return grupoPorId(grupoId)?.meu === true;
}

/** Liga/desliga um id numa das listas de moderação. Só o dono consegue. */
function alternar(grupoId: string, campo: keyof Moderacao, id: string): boolean {
  if (!souDonoDo(grupoId)) return false;
  const estado = lerModeracao();
  const tinha = estado[campo].includes(id);
  gravarModeracao({
    ...estado,
    [campo]: tinha ? estado[campo].filter((item) => item !== id) : [...estado[campo], id],
  });
  return !tinha;
}

/** Esconder/devolver um tópico. Devolve `true` quando passou a ficar escondido. */
export function alternarTopicoEscondido(grupoId: string, topicoId: string): boolean {
  return alternar(grupoId, "topicos", topicoId);
}

/** Esconder/devolver uma resposta. */
export function alternarRespostaEscondida(grupoId: string, respostaId: string): boolean {
  return alternar(grupoId, "respostas", respostaId);
}

/** Fixar/soltar um tópico no topo — o 📌 do fórum. */
export function alternarFixado(grupoId: string, topicoId: string): boolean {
  return alternar(grupoId, "fixados", topicoId);
}

/**
 * Cobrir uma resposta como spoiler.
 *
 * É o poder mais usado na prática em qualquer conversa sobre livro: quase
 * ninguém posta spoiler de má-fé, posta distraído. Esconder a mensagem inteira
 * seria punição desproporcional; cobrir resolve e mantém a conversa.
 */
export function alternarSpoiler(grupoId: string, respostaId: string): boolean {
  return alternar(grupoId, "spoilers", respostaId);
}

/** O que você escondeu neste fórum — para poder devolver. */
export function escondidosDo(grupoId: string): { topicos: string[]; respostas: string[] } {
  const estado = lerModeracao();
  const idsDoGrupo = new Set(topicosSemeados.filter((t) => t.grupoId === grupoId).map((t) => t.id));
  for (const meu of meusTopicos().filter((t) => t.grupoId === grupoId)) idsDoGrupo.add(meu.id);
  return {
    topicos: estado.topicos.filter((id) => idsDoGrupo.has(id)),
    respostas: estado.respostas,
  };
}

/**
 * Dá para apagar este fórum?
 *
 * Só enquanto ele for **só seu**: nenhum tópico de outra pessoa dentro. Depois
 * disso, apagar destruiria o que os outros escreveram — e a tela oferece
 * esconder conteúdo, não demolir a casa.
 */
export function podeApagarGrupo(grupoId: string): boolean {
  if (!souDonoDo(grupoId)) return false;
  return topicosDa(grupoId, { incluirEscondidos: true }).every((topico) => topico.meu);
}

/** Os tópicos de umo grupo: fixado primeiro, depois pela última atividade. */
export function topicosDa(
  grupoId: string,
  opcoes: { incluirEscondidos?: boolean } = {},
): TopicoNaTela[] {
  const moderacao = lerModeracao();
  const doEsqueleto: TopicoNaTela[] = topicosSemeados
    .filter((topico) => topico.grupoId === grupoId)
    .map((topico) => {
      const { total, ultima } = contarRespostas(topico.id, topico.respostas);
      return {
        id: topico.id,
        grupoId,
        titulo: topico.titulo,
        autor: community.find((member) => member.slug === topico.autorSlug) ?? null,
        date: topico.date,
        fixado: topico.fixado === true || moderacao.fixados.includes(topico.id),
        meu: false,
        escondido: moderacao.topicos.includes(topico.id),
        totalRespostas: total,
        ultimaAtividade: ultima || topico.date,
      };
    });

  const meus: TopicoNaTela[] = meusTopicos()
    .filter((topico) => topico.grupoId === grupoId)
    .map((topico) => {
      const { total, ultima } = contarRespostas(topico.id, []);
      return {
        id: topico.id,
        grupoId,
        titulo: topico.titulo,
        autor: null,
        date: topico.date,
        fixado: moderacao.fixados.includes(topico.id),
        meu: true,
        escondido: moderacao.topicos.includes(topico.id),
        totalRespostas: total,
        ultimaAtividade: ultima || topico.date.slice(0, 10),
      };
    });

  return [...doEsqueleto, ...meus]
    /* Escondido some para todo mundo. O dono vê pela tela de moderação, que é
       onde ele devolve — deixar na lista com um véu confundiria quem lê. */
    .filter((topico) => opcoes.incluirEscondidos || !topico.escondido)
    .sort(
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
  /** Um trecho do áudio citado junto. */
  citacao?: Citacao;
  /** O dono do fórum escondeu. */
  escondida: boolean;
  /** O dono cobriu como spoiler: o texto fica atrás de um toque. */
  spoiler: boolean;
}

export function tituloDoTopico(topicoId: string): TopicoNaTela | undefined {
  for (const grupo of todosOsGrupos()) {
    const achado = topicosDa(grupo.id).find((topico) => topico.id === topicoId);
    if (achado) return achado;
  }
  return undefined;
}

/** O fio: respostas semeadas + as suas, na ordem em que chegaram. */
export function fioDo(topicoId: string): RespostaNaTela[] {
  const moderacao = lerModeracao();
  const semeado = topicosSemeados.find((topico) => topico.id === topicoId);
  const doEsqueleto: RespostaNaTela[] = (semeado?.respostas ?? []).map((item, indice) => ({
    id: `${topicoId}-r${indice}`,
    autor: community.find((member) => member.slug === item.autorSlug) ?? null,
    texto: item.texto,
    date: item.date,
    minha: false,
    escondida: moderacao.respostas.includes(`${topicoId}-r${indice}`),
    spoiler: moderacao.spoilers.includes(`${topicoId}-r${indice}`),
  }));

  const minhas: RespostaNaTela[] = minhasRespostas()
    .filter((item) => item.topicoId === topicoId)
    .map((item) => ({
      id: item.id,
      autor: null,
      texto: item.texto,
      date: item.date.slice(0, 10),
      minha: true,
      ...(item.citacao ? { citacao: item.citacao } : {}),
      escondida: moderacao.respostas.includes(item.id),
      spoiler: moderacao.spoilers.includes(item.id),
    }));

  return [...doEsqueleto, ...minhas]
    .filter((resposta) => !resposta.escondida)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** O resumo que a vitrine da Comunidade mostra. */
export function resumoDosGrupos(): {
  grupo: Grupo;
  totalTopicos: number;
  totalPessoas: number;
  participo: boolean;
}[] {
  // Os seus grupos primeiro: quem cria quer se ver no topo da lista.
  return [...meusGrupos(), ...grupos].map((grupo) => ({
    grupo,
    totalTopicos: topicosDa(grupo.id).length,
    // Você conta quando entrou — o esqueleto não vira número inflado.
    totalPessoas: grupo.membros.length + (participoDa(grupo.id) ? 1 : 0),
    participo: participoDa(grupo.id),
  }));
}
