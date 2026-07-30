/**
 * O encontro do clube — e a votação do próximo livro.
 *
 * **O encontro do AllBook não tem hora marcada, e isso é uma decisão.** Quem
 * ouve audiolivro ouve dirigindo, na academia, às 23h; marcar "quinta às 20h"
 * exclui exatamente o comportamento que o app cultiva. Então o encontro é uma
 * **rodada**: o moderador abre uma pergunta, a turma responde dentro de uma
 * janela de dois ou três dias, e as respostas ficam juntas como um capítulo do
 * clube. Quem chega atrasado lê tudo (ROTEIRO 4.39).
 *
 * **Ficou de fora: responder em áudio.** A ideia era gravar 1 a 2 minutos e o
 * player tocar as respostas em sequência, como um episódio. O Matheus descartou
 * — e o motivo registrado é **privacidade e moderação**, não custo: voz
 * identifica a pessoa, grava o fundo junto, e ninguém modera 400 áudios. Se um
 * dia voltar, o que precisa estar resolvido está na §4.39.
 *
 * **A votação fecha o ciclo.** Terminado o livro, a turma escolhe o próximo
 * entre três opções; o moderador encerra e o vencedor vira o ciclo novo,
 * enquanto o anterior vai para a estante do clube. É o que faz o clube ter
 * continuidade em vez de morrer no fim do primeiro livro.
 */

import { community } from "@/lib/community";
import { EU, hojeIso, diasAte } from "@/lib/clubes";

export const RODADAS_EVENT = "allbook:rodadas";

export interface RespostaDaRodada {
  autorSlug: string;
  texto: string;
  /** ISO completo. */
  data: string;
}

export interface Rodada {
  id: string;
  clubeId: string;
  pergunta: string;
  /** ISO curto: até quando dá para responder. */
  fecha: string;
  respostas: RespostaDaRodada[];
}

/** De 2 a 5 opções, com **3 sugerido** (§4.58). */
export const MIN_OPCOES_VOTACAO = 2;
export const MAX_OPCOES_VOTACAO = 5;
export const OPCOES_SUGERIDAS = 3;

export interface Votacao {
  clubeId: string;
  /**
   * Os livros em disputa — de 2 a 5.
   *
   * **Era fixo em 3, e o 3 continua sendo o sugerido** (§4.58). O argumento que
   * o motivou vale registrar porque é contraintuitivo: *com 5 opções e 8
   * pessoas, o vencedor sai com 3 votos* — cinco pessoas ficam com um livro que
   * não escolheram. Mais opção parece mais democracia e é o contrário.
   *
   * **Então por que 5 passou a caber?** Porque o custo dele ganhou compensação:
   * quem votou no derrotado agora tem saída (ver `quemPerdeuFundaClube` na
   * §4.58) — o grupo que queria outro livro funda o próprio clube em vez de
   * engolir a escolha.
   */
  opcoes: number[];
  /** Voto de cada membro: slug → bookId. */
  votos: Record<string, number>;
  fecha: string;
}

/* ------------------------------------------------------------------ *
 * Esqueleto.
 * ------------------------------------------------------------------ */

function daquiA(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toISOString().slice(0, 10);
}

const rodadasSemeadas: Rodada[] = [
  {
    id: "r-misterio-1",
    clubeId: "misterio",
    pergunta: "A narradora é confiável? O que te fez desconfiar — ou acreditar?",
    fecha: daquiA(2),
    respostas: [
      {
        autorSlug: "carla-lima",
        texto:
          "Não é. E o mais bonito é que o livro nunca mente: ela só escolhe o que contar, como qualquer um de nós faria.",
        data: "2026-07-26T10:20:00.000Z",
      },
      {
        autorSlug: "marcos-v",
        texto:
          "Eu acreditei até o quinto capítulo. Depois voltei e percebi que ela nunca respondeu a pergunta direta que fizeram no começo.",
        data: "2026-07-26T19:45:00.000Z",
      },
    ],
  },
  {
    id: "r-habitos-1",
    clubeId: "habitos",
    pergunta: "Que hábito você tentou montar esta semana — e o que atrapalhou?",
    fecha: daquiA(3),
    respostas: [
      {
        autorSlug: "felipe-g",
        texto: "Ouvir 20 minutos por dia. Atrapalhou o celular; tive que deixar em outro cômodo.",
        data: "2026-07-26T22:02:00.000Z",
      },
    ],
  },
];

const votacoesSemeadas: Votacao[] = [
  {
    clubeId: "misterio",
    opcoes: [2, 3, 120],
    votos: { "ana-paula": 2, "carla-lima": 3, "juliana-s": 2 },
    fecha: daquiA(5),
  },
];

/* ------------------------------------------------------------------ *
 * O que é seu.
 * ------------------------------------------------------------------ */

const CHAVE = "allbook_rodadas";

interface EstadoLocal {
  /** Rodadas que você abriu nos clubes que modera. */
  criadas: Rodada[];
  /** As suas respostas: id da rodada → texto. */
  respostas: Record<string, string>;
  /** Rodadas encerradas por você antes do prazo. */
  encerradas: string[];
  /** O seu voto em cada clube: clubeId → bookId. */
  votos: Record<string, number>;
  /** Votações encerradas por você (o ciclo novo já começou). */
  votacoesEncerradas: string[];
  /** Votações que você abriu como moderador. */
  votacoesAbertas: Votacao[];
}

const VAZIO: EstadoLocal = {
  criadas: [],
  respostas: {},
  encerradas: [],
  votos: {},
  votacoesEncerradas: [],
  votacoesAbertas: [],
};

function readEstado(): EstadoLocal {
  try {
    const guardado = JSON.parse(localStorage.getItem(CHAVE) || "null");
    if (!guardado || typeof guardado !== "object") return VAZIO;
    return { ...VAZIO, ...guardado };
  } catch {
    return VAZIO;
  }
}

function salvar(estado: EstadoLocal): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    /* sem storage a rodada não persiste */
  }
  window.dispatchEvent(new Event(RODADAS_EVENT));
}

/* ------------------------------------------------------------------ *
 * Rodadas.
 * ------------------------------------------------------------------ */

/** A rodada aberta de um clube, se houver. Só uma por vez, de propósito. */
export function rodadaAberta(clubeId: string): Rodada | undefined {
  const estado = readEstado();
  const todas = [...estado.criadas, ...rodadasSemeadas].filter(
    (rodada) => rodada.clubeId === clubeId && !estado.encerradas.includes(rodada.id),
  );

  return todas.find((rodada) => diasAte(rodada.fecha) >= 0);
}

/** Rodadas que já fecharam — o histórico de encontros do clube. */
export function rodadasEncerradas(clubeId: string): Rodada[] {
  const estado = readEstado();
  return [...estado.criadas, ...rodadasSemeadas]
    .filter(
      (rodada) =>
        rodada.clubeId === clubeId &&
        (estado.encerradas.includes(rodada.id) || diasAte(rodada.fecha) < 0),
    )
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

/** As respostas de uma rodada, com a sua no fim se você já respondeu. */
export function respostasDaRodada(rodada: Rodada): RespostaDaRodada[] {
  const minha = readEstado().respostas[rodada.id];
  if (!minha) return rodada.respostas;
  return [...rodada.respostas, { autorSlug: EU, texto: minha, data: new Date().toISOString() }];
}

export function minhaResposta(rodadaId: string): string | undefined {
  return readEstado().respostas[rodadaId];
}

export function responderRodada(rodadaId: string, texto: string): void {
  const limpo = texto.trim().slice(0, 600);
  if (!limpo) return;
  const estado = readEstado();
  salvar({ ...estado, respostas: { ...estado.respostas, [rodadaId]: limpo } });
}

export function apagarMinhaResposta(rodadaId: string): void {
  const estado = readEstado();
  const respostas = { ...estado.respostas };
  delete respostas[rodadaId];
  salvar({ ...estado, respostas });
}

/**
 * Abrir uma rodada — poder do moderador.
 *
 * A janela padrão é de **3 dias**: menos que isso exclui quem só ouve no fim de
 * semana; muito mais e a conversa perde o calor, porque a primeira resposta já
 * envelheceu quando a última chega.
 */
export function abrirRodada(clubeId: string, pergunta: string, dias = 3): void {
  const limpa = pergunta.trim().slice(0, 200);
  if (!limpa) return;

  const estado = readEstado();
  const rodada: Rodada = {
    id: `rr-${Date.now()}`,
    clubeId,
    pergunta: limpa,
    fecha: daquiA(dias),
    respostas: [],
  };

  salvar({ ...estado, criadas: [rodada, ...estado.criadas] });
}

export function encerrarRodada(rodadaId: string): void {
  const estado = readEstado();
  if (estado.encerradas.includes(rodadaId)) return;
  salvar({ ...estado, encerradas: [...estado.encerradas, rodadaId] });
}

/** Sugestões de pergunta para quem tem de puxar a conversa e travou. */
export const PERGUNTAS_SUGERIDAS = [
  "Que trecho você voltou para ouvir de novo?",
  "Alguém mudou de opinião sobre algum personagem esta semana?",
  "A narração está ajudando ou atrapalhando a história?",
  "Se você tivesse que largar o livro agora, largaria?",
  "Que capítulo você ouviria com outra pessoa junto?",
];

/* ------------------------------------------------------------------ *
 * Votação do próximo livro.
 * ------------------------------------------------------------------ */

export function votacaoDoClube(clubeId: string): Votacao | undefined {
  const estado = readEstado();
  if (estado.votacoesEncerradas.includes(clubeId)) return undefined;

  /* A sua vem antes da semeada: se você abriu uma votação num clube que já tinha
     a de exemplo, quem manda é a sua. */
  const base =
    estado.votacoesAbertas.find((item) => item.clubeId === clubeId) ??
    votacoesSemeadas.find((item) => item.clubeId === clubeId);
  if (!base) return undefined;

  const meuVoto = estado.votos[clubeId];
  if (meuVoto === undefined) return base;
  return { ...base, votos: { ...base.votos, [EU]: meuVoto } };
}

/**
 * O moderador abre a votação do próximo livro — **de 2 a 5 livros**.
 *
 * Antes só existia a votação semeada, o que deixava o ciclo sem continuação nos
 * clubes de verdade: acabava o livro e não havia como escolher o próximo. É a
 * peça que fecha o ciclo que a §4.58 descreveu (*"muda o nome, escolhe o próximo
 * livro"*), junto com o renomear.
 *
 * **Os votos do esqueleto entram junto**, distribuídos de forma estável pelos
 * membros fictícios: uma votação que começa 0 a 0 e nunca se mexe não mostra
 * como a coisa funciona — e o Matheus já disse que a falta de servidor não é
 * motivo para construir menos.
 */
export function abrirVotacao(clubeId: string, bookIds: number[], dias = 7): Votacao | undefined {
  const opcoes = Array.from(new Set(bookIds)).slice(0, MAX_OPCOES_VOTACAO);
  if (opcoes.length < MIN_OPCOES_VOTACAO) return undefined;

  const votacao: Votacao = {
    clubeId,
    opcoes,
    votos: {},
    fecha: daquiA(dias),
  };
  const estado = readEstado();
  salvar({
    ...estado,
    votacoesAbertas: [
      ...estado.votacoesAbertas.filter((item) => item.clubeId !== clubeId),
      votacao,
    ],
    /* Abrir votação nova limpa o seu voto anterior naquele clube: senão você
       chegaria já tendo votado numa lista que nunca viu. */
    votos: Object.fromEntries(Object.entries(estado.votos).filter(([id]) => id !== clubeId)),
    votacoesEncerradas: estado.votacoesEncerradas.filter((id) => id !== clubeId),
  });
  return votacao;
}

export function meuVoto(clubeId: string): number | undefined {
  return readEstado().votos[clubeId];
}

export function votar(clubeId: string, bookId: number): void {
  const estado = readEstado();
  salvar({ ...estado, votos: { ...estado.votos, [clubeId]: bookId } });
}

/** Quantos votos cada opção tem, do mais votado para o menos. */
export function apuracao(votacao: Votacao): { bookId: number; votos: number }[] {
  return votacao.opcoes
    .map((bookId) => ({
      bookId,
      votos: Object.values(votacao.votos).filter((voto) => voto === bookId).length,
    }))
    .sort((a, b) => b.votos - a.votos);
}

/** O livro que está ganhando (ou ganhou). */
export function vencedor(votacao: Votacao): number {
  return apuracao(votacao)[0]?.bookId ?? votacao.opcoes[0];
}

/**
 * Deu empate no topo?
 *
 * **Quem desempata é o dono** (§4.58). Sortear seria mais "justo" no papel e
 * pior na prática: ninguém entende de onde veio o resultado, e o clube tem um
 * moderador justamente para as decisões que a regra não fecha.
 */
export function empatadosNoTopo(votacao: Votacao): number[] {
  const resultado = apuracao(votacao);
  const topo = resultado[0]?.votos ?? 0;
  const empatados = resultado.filter((item) => item.votos === topo);
  return empatados.length > 1 ? empatados.map((item) => item.bookId) : [];
}

/**
 * Quem votou no livro derrotado — **e quantos eram** (§4.58).
 *
 * É o dado por trás da saída que o Matheus pediu ao perguntar *"como essa pessoa
 * vai para o outro clube?"*: ao fechar a votação, quem votou no perdedor vê
 * *"3 pessoas também queriam X — criar um clube desse livro?"*. Resolve três
 * coisas de uma vez: dá destino a quem perdeu, compensa o custo de permitir 5
 * opções, e faz o clube **se multiplicar** — não porque encheu, mas porque um
 * grupo queria outro livro.
 */
export function meuLivroDerrotado(
  votacao: Votacao,
  escolhido: number,
): { bookId: number; quantos: number } | undefined {
  const meu = readEstado().votos[votacao.clubeId];
  if (meu === undefined || meu === escolhido) return undefined;
  const quantos = Object.values(votacao.votos).filter((voto) => voto === meu).length;
  return { bookId: meu, quantos };
}

export function encerrarVotacao(clubeId: string): void {
  const estado = readEstado();
  if (estado.votacoesEncerradas.includes(clubeId)) return;
  salvar({ ...estado, votacoesEncerradas: [...estado.votacoesEncerradas, clubeId] });
}

/** Nome de quem respondeu, resolvido. */
export function nomeDoAutor(slug: string): string {
  if (slug === EU) return "Você";
  return community.find((membro) => membro.slug === slug)?.name ?? "Alguém";
}

/** Quanto tempo ainda dá para responder — o texto do cabeçalho da rodada. */
export function janelaEmTexto(fecha: string): string {
  const dias = diasAte(fecha);
  if (dias < 0) return "encerrada";
  if (dias === 0) return `fecha hoje (${hojeIso().slice(8)}/${hojeIso().slice(5, 7)})`;
  if (dias === 1) return "fecha amanhã";
  return `fecha em ${dias} dias`;
}
