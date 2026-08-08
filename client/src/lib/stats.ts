/**
 * O resumo que as Estatísticas e o Perfil mostram — calculado, nunca escrito.
 *
 * Existe para os dois lugares **contarem a mesma história**: antes o Perfil
 * dizia "47h · 5 títulos · 3 sem. · 2 concluídos" e a tela de Estatísticas
 * repetia os mesmos números, ambos fixos no código e sem relação com o uso.
 * Aqui eles saem das três fontes reais — o diário de audição
 * (`listening.ts`), o progresso por livro (`playback.ts`) e a lista salva
 * (`library.ts`).
 *
 * Este módulo fica **acima** dos outros de propósito: ele importa os três, e
 * nenhum deles importa este. `playback.ts` já credita o diário, então uma
 * dependência de volta fecharia um ciclo.
 */

import type { DadosDeConquista } from "@/lib/achievements";
import { catalog, minutosEstimados, type Book, type Genre } from "@/lib/books";
import { readFollowing } from "@/lib/following";
import { readLibrary } from "@/lib/library";
import { readMyComments } from "@/lib/myComments";
import { readReactions } from "@/lib/reactions";
import { readRecommendationIds } from "@/lib/recommendations";
import {
  diaISO,
  garantirDiario,
  melhorSequenciaDeDias,
  porLivro,
  segundosNaJanela,
  sequenciaDeDias,
  sequenciaDeSemanas,
  temExemplo,
  totalSegundos,
  type Diario,
} from "@/lib/listening";
import {
  CONCLUIDO_PERCENT,
  MINIMO_PARA_CONTAR_PERCENT,
  playbackPercent,
  readConcluidos,
  readPlaybackList,
} from "@/lib/playback";

/** A régua de "concluído" mora em `playback.ts`, junto de quem a aplica. */
export { CONCLUIDO_PERCENT } from "@/lib/playback";

export interface ResumoDeAudicao {
  diario: Diario;
  /** Segundos ouvidos desde sempre. */
  segundos: number;
  /** Livros que já foram abertos no player. */
  titulosComecados: number;
  concluidos: number;
  /** Dias seguidos ouvindo, contando de hoje (ou de ontem) para trás. */
  sequenciaDias: number;
  melhorSequencia: number;
  sequenciaSemanas: number;
  /** Últimos 21 dias, do mais antigo ao mais novo: houve audição? */
  ultimos21: boolean[];
  /** Quantos títulos estão na "Minha lista". */
  naLista: number;
  /** Segundos ouvidos nos últimos 7 dias e nos 7 anteriores. */
  estaSemana: number;
  semanaPassada: number;
  /** Ainda há dias de demonstração no diário. */
  temExemplo: boolean;
}

/**
 * O resumo da audição.
 *
 * `soReal` deixa de fora os dias de **demonstração** (§4.123). Ele existe por um
 * defeito concreto: o app semeia 42 dias de audição falsa para as Estatísticas
 * não nascerem com gráficos vazios, e as **medalhas eram carimbadas em cima
 * deles** — a pessoa ganhava "Constante" e "Eclético" sem ter ouvido nada. Isso
 * era vitrine enquanto vivia só no navegador; desde que as conquistas passaram a
 * subir para a conta (§4.122), virava troféu falso **permanente**, atravessando
 * aparelhos e indistinguível do real.
 *
 * ⚠️ **Quem MOSTRA continua usando o resumo completo, e quem GRAVA usa este.**
 * São dois cálculos de propósito: a tela de Estatísticas segue bonita com o
 * histórico de exemplo (que é o que ele existe para fazer), e a medalha só é
 * registrada quando houve audição de verdade.
 */
export function lerResumo(opcoes?: { soReal?: boolean }): ResumoDeAudicao {
  const completo = garantirDiario();
  const diario = opcoes?.soReal
    ? Object.fromEntries(Object.entries(completo).filter(([, dia]) => !dia.exemplo))
    : completo;
  const progresso = readPlaybackList();
  const hoje = new Date();

  const ultimos21: boolean[] = [];
  for (let atras = 20; atras >= 0; atras--) {
    const data = new Date(hoje);
    data.setDate(data.getDate() - atras);
    ultimos21.push((diario[diaISO(data)]?.sec ?? 0) > 0);
  }

  /**
   * "Títulos começados" é a união de duas evidências: os livros que aparecem
   * no diário (você ouviu algum tempo deles) e os que têm posição salva. Contar
   * só o progresso deixava a tela incoerente — dava para ver "45h ouvidas" ao
   * lado de "0 títulos começados" quando o histórico vinha do diário.
   */
  const comecados = new Set<number>(progresso.map((item) => item.bookId));
  for (const { bookId } of porLivro(diario)) comecados.add(bookId);

  return {
    diario,
    segundos: totalSegundos(diario),
    titulosComecados: comecados.size,
    concluidos: progresso.filter((item) => playbackPercent(item) >= CONCLUIDO_PERCENT).length,
    sequenciaDias: sequenciaDeDias(diario, hoje),
    melhorSequencia: melhorSequenciaDeDias(diario),
    sequenciaSemanas: sequenciaDeSemanas(diario, hoje),
    ultimos21,
    naLista: readLibrary().length,
    estaSemana: segundosNaJanela(diario, 6, 0),
    semanaPassada: segundosNaJanela(diario, 13, 7),
    temExemplo: temExemplo(diario),
  };
}

/**
 * O que as medalhas precisam saber. Junta o diário de audição com a lista e a
 * atividade na comunidade — é o que substituiu o `unlocked` escrito à mão em
 * `achievements.ts`.
 */
export function lerDadosDeConquista(resumo: ResumoDeAudicao): DadosDeConquista {
  const dias = Object.values(resumo.diario);
  const maiorDiaSec = dias.reduce((maior, dia) => Math.max(maior, dia.sec), 0);

  let ouviuDeMadrugada = false;
  let ouviuAoAmanhecer = false;
  for (const dia of dias) {
    for (const [hora, sec] of Object.entries(dia.horas)) {
      if (sec <= 0) continue;
      const h = Number(hora);
      if (h < 4) ouviuDeMadrugada = true;
      else if (h < 7) ouviuAoAmanhecer = true;
    }
  }

  const curtidas = Object.values(readReactions()).filter((r) => r === "like").length;

  return {
    segundos: resumo.segundos,
    maiorDiaSec,
    sequenciaSemanas: resumo.sequenciaSemanas,
    melhorSequenciaDias: resumo.melhorSequencia,
    ouviuDeMadrugada,
    ouviuAoAmanhecer,
    generosOuvidos: generosMaisOuvidos(resumo.diario).length,
    concluidos: resumo.concluidos,
    naLista: resumo.naLista,
    comentarios: readMyComments().length,
    curtidas,
    seguindo: readFollowing().length,
    recomendacoes: readRecommendationIds().length,
  };
}

export interface ResumoDoPeriodo {
  /**
   * Livros com audição na janela **e** progresso acima do piso, do mais ouvido
   * para o menos. Quem só espiou não entra.
   */
  ouvidos: { book: Book; sec: number; percent: number }[];
  /** Quantos livros ficaram de fora por terem sido só espiados. */
  espiados: number;
  /** Terminados **dentro** da janela — só os que têm data carimbada. */
  terminados: Book[];
  segundos: number;
  diasComAudicao: number;
  /** Os gêneros da janela, do mais ouvido para o menos. */
  generos: Genre[];
  /** Quantos autores diferentes entraram na conta. */
  autores: number;
  /**
   * Quantas vozes diferentes narraram para você na janela. É o número mais
   * "AllBook" da lista: num app de leitura ele não existe.
   */
  narradores: number;
  /** Quem você mais ouviu na janela — nomes, o que mais rende conversa. */
  autorTop: string | null;
  narradorTop: string | null;
}

/**
 * O recorte dos últimos N dias — a matéria-prima do cartão de story.
 *
 * O total de sempre ("39h ouvidas") é bom para o perfil, mas ninguém posta
 * isso: o que se conta para os outros é o que aconteceu *agora*, e em
 * **livros**, não em horas. Por isso esta função responde em livros ouvidos,
 * livros terminados e dias de audição no período.
 *
 * **Página foi tentada aqui e rejeitada** (26/07). A ideia era mostrar "1.206
 * páginas" em vez de horas, porque página é a moeda que qualquer leitor
 * compara. Duas versões caíram: a primeira convertia hora em página por uma
 * média (33 páginas/hora), um chute; a segunda usava a página real da ficha,
 * mas a ficha vem da **Open Library** — dado externo, que só existe para os
 * livros que por acaso estão lá. Quando o AllBook subir os próprios livros
 * (o rumo do projeto), a maioria não terá página nenhuma, e a métrica viraria
 * zero ou invenção. Ficaram só números que são do próprio app: livro, gênero,
 * autor, voz, ritmo e fila.
 */
export function lerResumoDoPeriodo(diario: Diario, dias = 30, hoje = new Date()): ResumoDoPeriodo {
  const limite = new Date(hoje);
  limite.setDate(limite.getDate() - (dias - 1));
  const chaveLimite = diaISO(limite);

  const porLivroSec = new Map<number, number>();
  let segundos = 0;
  let diasComAudicao = 0;

  for (const [dia, valor] of Object.entries(diario)) {
    // As chaves são "AAAA-MM-DD": comparar como texto já ordena por data.
    if (dia < chaveLimite) continue;
    segundos += valor.sec;
    if (valor.sec > 0) diasComAudicao++;
    for (const [id, sec] of Object.entries(valor.livros)) {
      const bookId = Number(id);
      porLivroSec.set(bookId, (porLivroSec.get(bookId) ?? 0) + sec);
    }
  }

  /**
   * O quanto do livro já foi ouvido — a régua que decide se ele "conta".
   *
   * São **duas evidências, e vale a maior**: a posição salva no `playback`
   * (quem retomou perto do fim ouviu pouco no mês, mas o livro está adiantado)
   * e o total acumulado no diário sobre a duração estimada (quem ouviu 5h de um
   * livro de 6h está quase no fim, mesmo sem posição salva — é o caso de todo o
   * histórico de demonstração, que alimenta o diário e não o player).
   */
  const posicaoSalva = new Map(
    readPlaybackList().map((item) => [item.bookId, playbackPercent(item)])
  );
  const totalPorLivro = new Map(porLivro(diario).map((item) => [item.bookId, item.sec]));

  const candidatos = Array.from(porLivroSec.entries())
    .sort((a, b) => b[1] - a[1])
    .flatMap(([bookId, sec]) => {
      const book = catalog.find((item) => item.id === bookId);
      if (!book) return [];

      // 5h quando o livro não tem número de páginas — a mesma reserva da ficha.
      const duracaoSec = (minutosEstimados(book.pages) || 300) * 60;
      const acumulado = ((totalPorLivro.get(bookId) ?? 0) / duracaoSec) * 100;
      const percent = Math.min(100, Math.max(posicaoSalva.get(bookId) ?? 0, acumulado));

      return [{ book, sec, percent }];
    });

  const ouvidos = candidatos.filter((item) => item.percent >= MINIMO_PARA_CONTAR_PERCENT);
  const espiados = candidatos.length - ouvidos.length;

  const inicioISO = limite.toISOString().slice(0, 10);
  const terminados = Object.entries(readConcluidos())
    .filter(([, quando]) => quando.slice(0, 10) >= inicioISO)
    .flatMap(([id]) => {
      const book = catalog.find((item) => item.id === Number(id));
      return book ? [book] : [];
    });

  /*
   * Gênero, autor e narrador da janela saem só dos livros que **contam** (os
   * `ouvidos`): um livro espiado por dois minutos não deve fazer o mês parecer
   * de terror. Ordenados por tempo, para "o mais ouvido" ser o primeiro.
   */
  const porGenero = new Map<Genre, number>();
  const porAutor = new Map<string, number>();
  const porNarrador = new Map<string, number>();
  for (const { book, sec } of ouvidos) {
    porGenero.set(book.genre, (porGenero.get(book.genre) ?? 0) + sec);
    porAutor.set(book.author, (porAutor.get(book.author) ?? 0) + sec);
    porNarrador.set(book.narrator, (porNarrador.get(book.narrator) ?? 0) + sec);
  }
  const maisOuvido = (mapa: Map<string, number>): string | null =>
    Array.from(mapa.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    ouvidos,
    espiados,
    terminados,
    segundos,
    diasComAudicao,
    generos: Array.from(porGenero.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([genero]) => genero),
    autores: porAutor.size,
    narradores: porNarrador.size,
    autorTop: maisOuvido(porAutor),
    narradorTop: maisOuvido(porNarrador),
  };
}

export interface FatiaDeGenero {
  genero: Genre;
  sec: number;
  /** Fração do total ouvido, de 0 a 1. */
  parte: number;
}

/** Os gêneros que você mais ouviu, do maior para o menor. */
export function generosMaisOuvidos(diario: Diario): FatiaDeGenero[] {
  const soma = new Map<Genre, number>();
  let total = 0;

  for (const { bookId, sec } of porLivro(diario)) {
    const livro = catalog.find((item) => item.id === bookId);
    if (!livro) continue;
    soma.set(livro.genre, (soma.get(livro.genre) ?? 0) + sec);
    total += sec;
  }

  if (total === 0) return [];

  return Array.from(soma.entries())
    .map(([genero, sec]) => ({ genero, sec, parte: sec / total }))
    .sort((a, b) => b.sec - a.sec);
}

export interface PessoaMaisOuvida {
  nome: string;
  sec: number;
  /** Quantos títulos diferentes dessa pessoa você ouviu. */
  titulos: number;
}

/**
 * Quem você mais ouviu — `campo` escolhe entre quem escreveu e quem narra.
 * São perguntas diferentes, e num app de audiolivro a segunda importa tanto
 * quanto a primeira.
 */
export function pessoaMaisOuvida(
  diario: Diario,
  campo: "author" | "narrator"
): PessoaMaisOuvida | null {
  const soma = new Map<string, { sec: number; livros: Set<number> }>();

  for (const { bookId, sec } of porLivro(diario)) {
    const livro = catalog.find((item) => item.id === bookId);
    if (!livro) continue;
    const nome = livro[campo];
    const atual = soma.get(nome) ?? { sec: 0, livros: new Set<number>() };
    atual.sec += sec;
    atual.livros.add(bookId);
    soma.set(nome, atual);
  }

  const melhor = Array.from(soma.entries()).sort((a, b) => b[1].sec - a[1].sec)[0];
  if (!melhor) return null;

  return { nome: melhor[0], sec: melhor[1].sec, titulos: melhor[1].livros.size };
}
