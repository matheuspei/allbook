/**
 * As marcações do tocador — um ponto guardado no áudio, com nota opcional.
 *
 * **Por que este arquivo nasceu (26/07).** O player já tinha o botão
 * "+ Marcação" e o item "Marcações e notas" no menu de "…", e **nenhum dos dois
 * fazia nada**: o primeiro mostrava o aviso "Guardamos o ponto em 1h 12min" sem
 * guardar coisa alguma, e o segundo abria um aviso dizendo que as marcações
 * "aparecerão aqui" — uma promessa para um lugar que não existia. Quem marcasse
 * um trecho perdia tudo ao sair da tela.
 *
 * Segue a mesma forma dos outros módulos de storage da casa (`library.ts`,
 * `playback.ts`): **ler nunca quebra**, o que sai daqui já vem normalizado, e
 * toda escrita avisa a tela por um evento de `window`.
 */

import { catalog, type Book } from "@/lib/books";

const KEY = "allbook_bookmarks";

/**
 * As telas que mostram marcações escutam este evento. Sem ele, salvar uma
 * marcação com o painel aberto não mudava a lista até fechar e abrir de novo —
 * o mesmo defeito que o `LIBRARY_EVENT` resolveu na Biblioteca.
 */
export const BOOKMARK_EVENT = "allbook:bookmarks";

export interface Bookmark {
  /** Identidade da marcação. Não é o id do livro. */
  id: string;
  bookId: number;
  /** Onde no áudio, em segundos. */
  positionSec: number;
  /** O capítulo em que o ponto cai — guardado junto para não recalcular. */
  chapter: number;
  /** A nota que a pessoa escreveu. Vazia é o normal: marcar é um toque só. */
  note: string;
  /** ISO de quando foi criada. */
  createdAt: string;
}

function toBookmark(entry: unknown): Bookmark[] {
  if (!entry || typeof entry !== "object") return [];
  const item = entry as Record<string, unknown>;
  const bookId = Number(item.bookId);
  const positionSec = Number(item.positionSec);
  if (!Number.isFinite(bookId) || !Number.isFinite(positionSec)) return [];

  const chapter = Number(item.chapter);
  return [
    {
      // Marcação sem id (formato futuro ou storage editado à mão) ganha um
      // derivado do ponto: dois pontos iguais no mesmo livro não fazem sentido.
      id: typeof item.id === "string" && item.id ? item.id : `${bookId}-${Math.round(positionSec)}`,
      bookId,
      positionSec: Math.max(0, Math.round(positionSec)),
      chapter: Number.isFinite(chapter) && chapter > 0 ? chapter : 1,
      note: typeof item.note === "string" ? item.note : "",
      createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
    },
  ];
}

/** Todas as marcações, de todos os livros. Nunca quebra. */
export function readBookmarks(): Bookmark[] {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(stored)) return [];
    return stored.flatMap(toBookmark);
  } catch {
    // Storage corrompido: lista vazia em vez de derrubar o player.
    return [];
  }
}

function writeBookmarks(items: Bookmark[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(BOOKMARK_EVENT));
  } catch {
    // localStorage cheio ou bloqueado: perder a marcação é chato, mas não é
    // motivo para quebrar o botão que a pessoa acabou de tocar.
  }
}

/** As marcações de um livro, do começo do áudio para o fim. */
export function bookmarksFor(bookId: number): Bookmark[] {
  return readBookmarks()
    .filter((item) => item.bookId === bookId)
    .sort((a, b) => a.positionSec - b.positionSec);
}

export function bookmarkCount(bookId: number): number {
  return readBookmarks().filter((item) => item.bookId === bookId).length;
}

/**
 * Guarda um ponto. Devolve a marcação criada, ou a que **já existia** perto
 * dali: sem essa folga, tocar duas vezes no botão criava duas marcações no
 * mesmo instante, e a lista virava um monte de linhas repetidas.
 */
export function addBookmark(
  bookId: number,
  positionSec: number,
  chapter: number,
  note = ""
): { bookmark: Bookmark; jaExistia: boolean } {
  const todas = readBookmarks();
  const perto = todas.find(
    (item) => item.bookId === bookId && Math.abs(item.positionSec - positionSec) <= 5
  );
  if (perto) return { bookmark: perto, jaExistia: true };

  const bookmark: Bookmark = {
    // `Date.now()` no id, e não só o ponto: dá para marcar o mesmo trecho de
    // novo depois de apagar, sem colidir com o registro antigo.
    id: `${bookId}-${Math.round(positionSec)}-${Date.now()}`,
    bookId,
    positionSec: Math.max(0, Math.round(positionSec)),
    chapter,
    note,
    createdAt: new Date().toISOString(),
  };
  writeBookmarks([...todas, bookmark]);
  return { bookmark, jaExistia: false };
}

/** Escreve (ou apaga) a nota de uma marcação. */
export function setBookmarkNote(id: string, note: string): void {
  writeBookmarks(readBookmarks().map((item) => (item.id === id ? { ...item, note } : item)));
}

export function removeBookmark(id: string): void {
  writeBookmarks(readBookmarks().filter((item) => item.id !== id));
}

export interface LivroComMarcacoes {
  book: Book;
  marcacoes: Bookmark[];
  /** Quantas dessas marcações têm nota escrita. */
  comNota: number;
  /** ISO da marcação mais recente — é por ela que a lista se ordena. */
  ultima: string;
}

/**
 * Tudo que foi marcado, **agrupado por livro** e do mexido mais recentemente
 * para o mais antigo.
 *
 * Existe porque guardar sem poder rever de fora é quase guardar no lixo: até
 * 26/07 as marcações só apareciam dentro do player **daquele** livro, então quem
 * marcasse trechos em cinco livros precisava abrir cinco players para lembrar do
 * que tinha guardado. Esta é a consulta que a tela "Minhas marcações" usa.
 *
 * Livro que saiu do catálogo é descartado em silêncio, como em `libraryBooks`.
 */
export function bookmarksByBook(): LivroComMarcacoes[] {
  const porLivro = new Map<number, Bookmark[]>();
  for (const marcacao of readBookmarks()) {
    const lista = porLivro.get(marcacao.bookId);
    if (lista) lista.push(marcacao);
    else porLivro.set(marcacao.bookId, [marcacao]);
  }

  return Array.from(porLivro.entries())
    .flatMap(([bookId, marcacoes]) => {
      const book = catalog.find((item) => item.id === bookId);
      if (!book) return [];
      const ordenadas = marcacoes.slice().sort((a, b) => a.positionSec - b.positionSec);
      return [
        {
          book,
          marcacoes: ordenadas,
          comNota: ordenadas.filter((item) => item.note.trim().length > 0).length,
          ultima: ordenadas.reduce(
            (maior, item) => (item.createdAt > maior ? item.createdAt : maior),
            ordenadas[0].createdAt
          ),
        },
      ];
    })
    .sort((a, b) => b.ultima.localeCompare(a.ultima));
}

/** Quantas marcações existem no total, de todos os livros. */
export function totalBookmarks(): number {
  return readBookmarks().length;
}
