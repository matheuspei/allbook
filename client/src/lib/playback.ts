/**
 * Onde a pessoa parou de ouvir — e quando a barrinha do player aparece.
 *
 * São **duas coisas separadas de propósito**, e essa é a decisão central deste
 * arquivo:
 *
 * 1. **O progresso** (`allbook_playback`, no `localStorage`) é permanente. É a
 *    memória de onde você parou; sobrevive a fechar o app e volta em
 *    "Continuar ouvindo", na Início.
 * 2. **A barrinha aparecer** (`allbook_miniplayer`, no `sessionStorage`) vale só
 *    para esta visita. Abrir o app começa com a tela limpa: a barra só nasce
 *    quando você toca em play em alguma coisa, e some quando você fecha.
 *
 * O `sessionStorage` é o que dá isso de graça — ele é limpo sozinho quando a
 * aba fecha. Antes, a barra era um pedaço de tela fixo com "Organize-se"
 * escrito na mão, sem botão de fechar: ficava atravancando a navegação de quem
 * nunca tinha ouvido nada.
 */

import { catalog, type Book } from "@/lib/books";

const PROGRESS_KEY = "allbook_playback";
const VISIBLE_KEY = "allbook_miniplayer";

/** Avisa o `MiniPlayer` que algo mudou — ele não recarrega a página sozinho. */
export const PLAYBACK_EVENT = "allbook:playback";

export interface Playback {
  bookId: number;
  /** Capítulo atual, começando em 1. */
  chapter: number;
  /** Segundos ouvidos dentro do livro. */
  positionSec: number;
  /** Duração total em segundos, para calcular a porcentagem. */
  durationSec: number;
  /** ISO da última vez que mexeu. */
  updatedAt: string;
}

function notify() {
  window.dispatchEvent(new Event(PLAYBACK_EVENT));
}

export function readPlayback(): Playback | null {
  try {
    const stored = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "null");
    if (!stored || typeof stored !== "object") return null;
    if (typeof stored.bookId !== "number") return null;
    // Progresso de um livro que saiu do catálogo não serve para nada.
    if (!catalog.some((book) => book.id === stored.bookId)) return null;

    return {
      bookId: stored.bookId,
      chapter: typeof stored.chapter === "number" ? stored.chapter : 1,
      positionSec: typeof stored.positionSec === "number" ? stored.positionSec : 0,
      durationSec: typeof stored.durationSec === "number" && stored.durationSec > 0
        ? stored.durationSec
        : 1,
      updatedAt: typeof stored.updatedAt === "string" ? stored.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function savePlayback(playback: Omit<Playback, "updatedAt">): void {
  try {
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({ ...playback, updatedAt: new Date().toISOString() }),
    );
    notify();
  } catch {
    // localStorage cheio: perder o progresso é chato, mas não é motivo para
    // derrubar o player no meio da audição.
  }
}

/** Esquecer de vez onde parou (usado pela faxina em Configurações). */
export function clearPlayback(): void {
  localStorage.removeItem(PROGRESS_KEY);
  hideMiniPlayer();
  notify();
}

/** A barra deve aparecer agora? Só se houver progresso E ela não estiver fechada. */
export function isMiniPlayerVisible(): boolean {
  try {
    return sessionStorage.getItem(VISIBLE_KEY) === "1" && readPlayback() !== null;
  } catch {
    return false;
  }
}

/** Chamado ao abrir o player: a partir daqui a barrinha acompanha a navegação. */
export function showMiniPlayer(): void {
  try {
    sessionStorage.setItem(VISIBLE_KEY, "1");
  } catch {
    /* modo anônimo restrito: sem barra, o app continua funcionando */
  }
  notify();
}

/**
 * Fechar a barra. **Não apaga o progresso** — é o ponto todo: some da frente
 * agora, e continua guardado em "Continuar ouvindo" para retomar depois.
 */
export function hideMiniPlayer(): void {
  try {
    sessionStorage.removeItem(VISIBLE_KEY);
  } catch {
    /* idem */
  }
  notify();
}

/** O livro do progresso salvo, ou `null` se não há nada guardado. */
export function playbackBook(): Book | null {
  const playback = readPlayback();
  if (!playback) return null;
  return catalog.find((book) => book.id === playback.bookId) ?? null;
}

/** Quanto do livro já foi ouvido, de 0 a 100. */
export function playbackPercent(playback: Playback): number {
  return Math.min(100, Math.max(0, (playback.positionSec / playback.durationSec) * 100));
}

/** "4h 28m restantes" — o texto da barrinha. */
export function remainingLabel(playback: Playback): string {
  const remaining = Math.max(0, playback.durationSec - playback.positionSec);
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m restantes`;
  return `${minutes}m restantes`;
}
