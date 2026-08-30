/**
 * Os capítulos de um livro.
 *
 * Ainda não há áudio real, então os capítulos são inventados — mas de forma
 * **estável por livro**, não sorteada a cada tela. Antes a página do livro e o
 * player geravam cada um a sua lista aleatória, então discordavam: "Capítulo 3"
 * na ficha não era o mesmo "Capítulo 3" do player. Com uma lista fixa por id, os
 * dois passam a concordar — é isso que faz "começar no capítulo X" e a barra de
 * progresso terem sentido.
 *
 * Quando existir áudio de verdade, trocar `getChapters` pela lista real do livro
 * (título e duração de cada faixa); o resto do app continua igual.
 */

import { catalog } from "./books";

export interface Chapter {
  /** Número do capítulo, começando em 1. */
  id: number;
  title: string;
  /** Duração do capítulo em segundos. */
  durationSec: number;
}

/** 5h — a mesma reserva que a ficha usa quando o livro não tem páginas. */
const FALLBACK_MIN = 300;

/**
 * Duração total do livro em segundos.
 *
 * ⚠️ **A duração de verdade vem primeiro desde 21/08** (§4.134.1). O acervo
 * entrega a duração que a loja anuncia, e o `npm run audio` grava a medida por
 * cima quando o arquivo entra — só na falta das duas é que se estima pelas
 * páginas (≈1h a cada 33), que é herança da ficha da Open Library. Sem esta
 * ordem, **todo livro do acervo mostrava "5h 00min"**: nenhum deles tem número
 * de páginas, então todos caíam na reserva.
 *
 * Os capítulos precisam somar exatamente isto, senão a porcentagem de progresso
 * não bate com o tamanho do livro.
 */
function totalDurationSec(bookId: number): number {
  const book = catalog.find((item) => item.id === bookId);
  if (book?.duracaoSegundos) return book.duracaoSegundos;
  const minutes = book?.pages ? Math.round((book.pages / 33) * 60) : FALLBACK_MIN;
  return minutes * 60;
}

/**
 * Gerador pseudoaleatório com semente (mulberry32): a mesma semente devolve
 * sempre a mesma sequência. É o que torna a lista de um livro estável entre
 * telas e entre visitas, sem precisar guardar nada.
 */
function seeded(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cache = new Map<number, Chapter[]>();
/** Os livros cujo cache já é a lista medida, e não a estimada. */
const medidos = new Set<number>();

/** A lista de capítulos de um livro — sempre a mesma para o mesmo id. */
export function getChapters(bookId: number): Chapter[] {
  const emCache = cache.get(bookId);
  if (emCache) return emCache;

  const rand = seeded(bookId * 2654435761);
  const count = 8 + Math.floor(rand() * 7); // 8 a 14 capítulos
  const total = totalDurationSec(bookId);

  // Pesos estáveis para os capítulos não ficarem todos do mesmo tamanho.
  const pesos = Array.from({ length: count }, () => 0.7 + rand() * 0.6);
  const somaPesos = pesos.reduce((soma, p) => soma + p, 0);

  // Divide a duração total entre os capítulos. Todos menos o último ficam
  // proporcionais aos pesos; o último absorve a sobra, para a soma bater
  // EXATAMENTE com a duração do livro (a lista arredonda só na exibição).
  const chapters: Chapter[] = [];
  let acumulado = 0;
  for (let i = 0; i < count; i++) {
    const durationSec =
      i < count - 1 ? Math.floor((total * pesos[i]) / somaPesos) : total - acumulado;
    acumulado += durationSec;
    chapters.push({ id: i + 1, title: `Capítulo ${i + 1}`, durationSec });
  }

  cache.set(bookId, chapters);
  return chapters;
}

/**
 * Troca a lista estimada deste livro pelos capítulos **medidos** no áudio
 * (30/08, §4.139).
 *
 * O `npm run audio` grava título e duração de cada capítulo lendo o arquivo com
 * o `ffprobe` — 46 capítulos com o nome de verdade, no lugar de "Capítulo 1…12"
 * inventados. Esta função os traz e **sobrescreve o cache**, que é o que faz o
 * resto do arquivo (início, capítulo atual, barra) passar a falar do livro real
 * sem que nada mais mude.
 *
 * ⚠️ **Quem chama precisa redesenhar depois.** `getChapters` é síncrono e o
 * resto do app o usa no corpo dos componentes; trocar o cache não avisa
 * ninguém. O `AudioPlayer` guarda uma "versão" em estado e a incrementa quando
 * isto devolve `true`.
 *
 * Devolve `false` quando o livro não tem áudio ingerido (o normal hoje: 1 de
 * 13.917) — e aí a lista estimada continua valendo, que é melhor do que uma
 * tela sem capítulo nenhum.
 */
export async function carregarCapitulos(bookId: number): Promise<boolean> {
  if (medidos.has(bookId)) return true;
  try {
    const resposta = await fetch(`/api/catalogo/${bookId}/capitulos`);
    if (!resposta.ok) return false;
    const lista = (await resposta.json()) as Chapter[];
    if (!Array.isArray(lista) || lista.length === 0) return false;
    cache.set(bookId, lista);
    medidos.add(bookId);
    return true;
  } catch {
    return false;
  }
}

/** Este livro já está com os capítulos medidos, e não com os estimados? */
export function temCapitulosMedidos(bookId: number): boolean {
  return medidos.has(bookId);
}

/** Soma da duração de todos os capítulos — a duração total do livro. */
export function chaptersTotalSec(bookId: number): number {
  return getChapters(bookId).reduce((soma, cap) => soma + cap.durationSec, 0);
}

/** Em que segundo do livro começa um capítulo (soma dos anteriores). */
export function chapterStartSec(bookId: number, chapterId: number): number {
  return getChapters(bookId)
    .slice(0, Math.max(0, chapterId - 1))
    .reduce((soma, cap) => soma + cap.durationSec, 0);
}

/** Qual capítulo cobre uma dada posição em segundos. */
export function chapterAtSec(bookId: number, positionSec: number): number {
  const chapters = getChapters(bookId);
  let acumulado = 0;
  for (const cap of chapters) {
    acumulado += cap.durationSec;
    if (positionSec < acumulado) return cap.id;
  }
  return chapters.length;
}

/** "18min" — a duração de um capítulo para mostrar na lista. */
export function formatChapterDuration(durationSec: number): string {
  return `${Math.round(durationSec / 60)}min`;
}

/** "9h 45min" — a duração total do livro (soma dos capítulos) para o cabeçalho. */
export function formatBookDuration(totalSec: number): string {
  const minutos = Math.round(totalSec / 60);
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return horas > 0 ? `${horas}h ${String(resto).padStart(2, "0")}min` : `${resto}min`;
}
