/**
 * Os capítulos de um livro — **os de verdade, e só eles** (31/08, §4.141).
 *
 * 🚨 **Aqui morava um gerador de capítulos falsos.** Ele sorteava de 8 a 14
 * capítulos por livro, com uma semente estável, e os batizava "Capítulo 1",
 * "Capítulo 2"… Fazia sentido enquanto o AllBook era maquete e não existia
 * livro nenhum: era melhor uma lista plausível do que uma tela vazia.
 *
 * **Esse tempo acabou.** O acervo entrou com 13.917 livros de verdade, e 100%
 * das fichas trazem o número e o título certos de cada capítulo — o importador
 * os grava, e o `npm run audio` os regrava medidos quando o áudio entra. Manter
 * o sorteio ao lado disso só produzia mentira visível: um livro de 3 capítulos
 * aparecendo com 12, nomes que não existem, durações que ninguém mediu.
 *
 * A regra agora é simples: **o que não veio do banco não aparece.**
 *
 * ⚠️ `getChapters` é síncrono e o cache começa vazio. Quem precisa da lista
 * chama `carregarCapitulos(id)` primeiro e redesenha — é o que o `AudioPlayer`
 * e o `BookDetails` fazem. Quem só precisa da duração total pode usar
 * `chaptersTotalSec`, que cai na duração do próprio livro (a que a loja anuncia
 * ou a que o `ffprobe` mediu) quando a lista ainda não chegou.
 */

import { catalog } from "./books";

export interface Chapter {
  /** Número do capítulo, começando em 1. */
  id: number;
  title: string;
  /**
   * Duração do capítulo em segundos, ou `null` quando ninguém a mediu.
   *
   * São 1.584 capítulos em 240.952 (0,7%): arquivos que o `ffprobe` não
   * conseguiu ler. Fica **vazio de propósito** — a lista mostra o capítulo sem
   * o tempo ao lado, e é melhor não dizer do que dizer errado.
   */
  durationSec: number | null;
}

/** Os capítulos que vieram do servidor, por livro. Vazio = ainda não pedimos. */
const cache = new Map<number, Chapter[]>();

/**
 * A duração do livro inteiro, em segundos, segundo o catálogo.
 *
 * É a duração **medida** quando há áudio ingerido, e a **anunciada pela loja**
 * no resto. Livro sem nenhuma das duas devolve 0 — e 0 aqui quer dizer "não
 * sabemos", não "livro de duração zero": quem divide por isto precisa checar.
 */
function duracaoDoLivro(bookId: number): number {
  return catalog.find((item) => item.id === bookId)?.duracaoSegundos ?? 0;
}

/**
 * Traz os capítulos deste livro do servidor e os guarda.
 *
 * Devolve `false` quando o livro não tem capítulo nenhum registrado — e aí a
 * tela **não mostra lista**, em vez de inventar uma.
 */
export async function carregarCapitulos(bookId: number): Promise<boolean> {
  if (cache.has(bookId)) return cache.get(bookId)!.length > 0;
  try {
    const resposta = await fetch(`/api/catalogo/${bookId}/capitulos`);
    if (!resposta.ok) return false;
    const lista = (await resposta.json()) as Chapter[];
    if (!Array.isArray(lista)) return false;
    cache.set(bookId, lista);
    return lista.length > 0;
  } catch {
    return false;
  }
}

/**
 * O evento que avisa que os capítulos de um livro chegaram.
 *
 * É o padrão da casa (`allbook:library`, `allbook:playback`…): quem mostra
 * capítulo escuta e redesenha. Existe porque `getChapters` é síncrono e a
 * primeira resposta dele é sempre uma lista vazia — sem o aviso, telas como a
 * do clube ficariam mostrando "0 capítulos" até alguém tocar nelas.
 */
export const CHAPTERS_EVENT = "allbook:capitulos";

/** Livros cujo pedido já saiu, para não pedir duas vezes por render. */
const pedindo = new Set<number>();

/**
 * A lista de capítulos deste livro.
 *
 * ⚠️ **Devolve vazio na primeira chamada e DISPARA o carregamento**: quem
 * chamar de novo depois do evento `CHAPTERS_EVENT` recebe a lista. Isso troca a
 * lista inventada de antes por uma espera curta — e espera é honesta, invenção
 * não era.
 */
export function getChapters(bookId: number): Chapter[] {
  const emCache = cache.get(bookId);
  if (emCache) return emCache;
  if (!pedindo.has(bookId)) {
    pedindo.add(bookId);
    void carregarCapitulos(bookId).then((veio) => {
      if (veio) window.dispatchEvent(new CustomEvent(CHAPTERS_EVENT, { detail: { bookId } }));
    });
  }
  return [];
}

/** Já sabemos quais são os capítulos deste livro? */
export function temCapitulos(bookId: number): boolean {
  return (cache.get(bookId)?.length ?? 0) > 0;
}

/**
 * A duração total do livro em segundos.
 *
 * Soma dos capítulos quando eles já chegaram; senão, a duração do próprio
 * livro. As duas são verdade — a segunda é só menos detalhada.
 */
export function chaptersTotalSec(bookId: number): number {
  const caps = cache.get(bookId);
  if (caps && caps.length > 0) {
    const soma = caps.reduce((total, cap) => total + (cap.durationSec ?? 0), 0);
    if (soma > 0) return soma;
  }
  return duracaoDoLivro(bookId);
}

/** Em que segundo do livro começa um capítulo (soma dos anteriores). */
export function chapterStartSec(bookId: number, chapterId: number): number {
  return getChapters(bookId)
    .slice(0, Math.max(0, chapterId - 1))
    .reduce((soma, cap) => soma + (cap.durationSec ?? 0), 0);
}

/**
 * Qual capítulo cobre uma dada posição em segundos.
 *
 * Sem lista carregada devolve 1: a pessoa está em algum lugar do livro, e
 * "capítulo 1" é o menos errado que se pode dizer sem inventar divisões.
 */
export function chapterAtSec(bookId: number, positionSec: number): number {
  const chapters = getChapters(bookId);
  if (chapters.length === 0) return 1;
  let acumulado = 0;
  for (const cap of chapters) {
    acumulado += cap.durationSec ?? 0;
    if (positionSec < acumulado) return cap.id;
  }
  return chapters.length;
}

/** "18min" — a duração de um capítulo. Vazio quando ninguém mediu. */
export function formatChapterDuration(durationSec: number | null): string {
  if (!durationSec) return "";
  return `${Math.round(durationSec / 60)}min`;
}

/** "9h 45min" — a duração total do livro, para o cabeçalho. */
export function formatBookDuration(totalSec: number): string {
  const minutos = Math.round(totalSec / 60);
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return horas > 0 ? `${horas}h ${String(resto).padStart(2, "0")}min` : `${resto}min`;
}
