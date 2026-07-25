/**
 * Onde a pessoa parou de ouvir — e quando a barrinha do player aparece.
 *
 * São **duas coisas separadas de propósito**, e essa é a decisão central deste
 * arquivo:
 *
 * 1. **O progresso** (`allbook_playback`, no `localStorage`) é permanente e é
 *    uma **lista** de todos os livros começados, do mais recente ao mais antigo.
 *    É a memória de onde você parou; sobrevive a fechar o app e reaparece em
 *    "Continuar ouvindo", na Início e na Biblioteca.
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
import { registrarAudicao } from "@/lib/listening";

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

/**
 * Quantos livros começados a lista guarda.
 *
 * A primeira versão guardava **um só**, o último, e isso tinha um defeito sério:
 * começar um segundo livro fazia o primeiro sumir sem deixar rastro — a pessoa
 * perdia até o nome do que estava ouvindo. É uma lista justamente por isso, no
 * modelo do "Continuar assistindo" da Netflix. Vinte é folgado para uso real e
 * ainda pequeno o bastante para não pesar no `localStorage`.
 *
 * **Cheia, quem sai é o mais antigo.** A lista vive ordenada do mais recente
 * para o mais antigo, então cortar no vigésimo (`slice`) descarta exatamente o
 * livro tocado há mais tempo — nunca o que a pessoa acabou de ouvir. Reabrir um
 * livro que já está na lista o traz de volta ao topo em vez de duplicar.
 */
const MAX_ENTRIES = 20;

function isValid(entry: unknown): entry is Playback {
  if (!entry || typeof entry !== "object") return false;
  const item = entry as Record<string, unknown>;
  if (typeof item.bookId !== "number") return false;
  // Progresso de um livro que saiu do catálogo não serve para nada.
  return catalog.some((book) => book.id === item.bookId);
}

function normalize(entry: Playback): Playback {
  return {
    bookId: entry.bookId,
    chapter: typeof entry.chapter === "number" ? entry.chapter : 1,
    positionSec: typeof entry.positionSec === "number" ? entry.positionSec : 0,
    durationSec:
      typeof entry.durationSec === "number" && entry.durationSec > 0 ? entry.durationSec : 1,
    updatedAt: typeof entry.updatedAt === "string" ? entry.updatedAt : new Date().toISOString(),
  };
}

/**
 * Todos os livros começados, do mais recente para o mais antigo.
 *
 * Aceita também o formato antigo (um objeto só) para não apagar o progresso de
 * quem já usava o app antes desta mudança.
 */
export function readPlaybackList(): Playback[] {
  try {
    const stored = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "null");
    if (!stored) return [];

    const list = Array.isArray(stored) ? stored : [stored];
    return list
      .filter(isValid)
      .map(normalize)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

/** O último livro ouvido — é ele que a barrinha mostra. */
export function readPlayback(): Playback | null {
  return readPlaybackList()[0] ?? null;
}

export function savePlayback(playback: Omit<Playback, "updatedAt">): void {
  try {
    const entry: Playback = { ...playback, updatedAt: new Date().toISOString() };
    const lista = readPlaybackList();
    const anterior = lista.find((item) => item.bookId === entry.bookId);
    const rest = lista.filter((item) => item.bookId !== entry.bookId);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify([entry, ...rest].slice(0, MAX_ENTRIES)));
    notify();

    /**
     * O avanço desde a última gravação **é** o tempo ouvido: o player salva a
     * cada 5 segundos, então creditar a diferença aqui alimenta o diário sem
     * ninguém precisar chamar nada. Voltar atrás ou pular capítulo dá diferença
     * negativa ou grande demais, e `registrarAudicao` descarta as duas.
     */
    if (anterior) registrarAudicao(entry.bookId, entry.positionSec - anterior.positionSec);
  } catch {
    // localStorage cheio: perder o progresso é chato, mas não é motivo para
    // derrubar o player no meio da audição.
  }
}

/**
 * Tirar um livro do "Continuar ouvindo" — o mesmo gesto do X que a Netflix
 * oferece nos cartões. Diferente de fechar a barra: aqui a pessoa está dizendo
 * "não quero mais ver isto", e o progresso desse livro some de verdade.
 */
export function removeFromPlayback(bookId: number): void {
  try {
    const rest = readPlaybackList().filter((item) => item.bookId !== bookId);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(rest));
    if (rest.length === 0) hideMiniPlayer();
    notify();
  } catch {
    /* nada a fazer */
  }
}

/** Esquecer tudo (usado pela faxina em Configurações). */
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

/**
 * A lista pronta para desenhar: livro + progresso, do mais recente ao mais
 * antigo. É o que a Início e a Biblioteca mostram em "Continuar ouvindo".
 */
export function playbackEntries(): { book: Book; playback: Playback; percent: number }[] {
  return readPlaybackList().flatMap((playback) => {
    const book = catalog.find((item) => item.id === playback.bookId);
    return book ? [{ book, playback, percent: playbackPercent(playback) }] : [];
  });
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
