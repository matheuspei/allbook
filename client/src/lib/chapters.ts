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

export interface Chapter {
  /** Número do capítulo, começando em 1. */
  id: number;
  title: string;
  /** Duração do capítulo em segundos. */
  durationSec: number;
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

/** A lista de capítulos de um livro — sempre a mesma para o mesmo id. */
export function getChapters(bookId: number): Chapter[] {
  const emCache = cache.get(bookId);
  if (emCache) return emCache;

  const rand = seeded(bookId * 2654435761);
  const count = 8 + Math.floor(rand() * 7); // 8 a 14 capítulos
  const chapters: Chapter[] = Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `Capítulo ${i + 1}`,
    durationSec: (12 + Math.floor(rand() * 19)) * 60, // 12 a 30 minutos
  }));

  cache.set(bookId, chapters);
  return chapters;
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
