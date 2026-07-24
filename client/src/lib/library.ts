/**
 * A "Minha Lista" e os downloads — as duas chaves que várias telas dividem.
 *
 * Antes, cada tela lia `allbook_library` e `allbook_downloads` com o próprio
 * `JSON.parse`, quase sempre sem try/catch: um storage corrompido derrubava a
 * tela inteira, e cada leitura repetia (ou esquecia) as mesmas conversões.
 * Este módulo vira a porta única das duas chaves, no mesmo espírito do
 * `playback.ts`: ler nunca quebra, e o que sai daqui já vem normalizado.
 *
 * **Formato gravado (novo):** só `{ id, addedAt }`, com o id em número. O
 * formato antigo guardava o livro inteiro — título, autor e a URL da capa —,
 * mas a URL da capa muda a cada build do Vite, então a cópia envelhecia e a
 * Biblioteca mostrava capa quebrada. Guardar só o id e resolver o resto no
 * catálogo (`libraryBooks`) elimina essa classe de defeito.
 *
 * **Formato antigo (ainda aceito na leitura):** objetos completos com o id em
 * texto. A leitura normaliza com `Number()` e descarta o que não fizer sentido,
 * para ninguém perder a lista que já tinha ao atualizar o app.
 */

import { catalog, type Book } from "@/lib/books";

const LIBRARY_KEY = "allbook_library";
const DOWNLOADS_KEY = "allbook_downloads";

/**
 * Avisa quem estiver com a lista na tela que ela mudou — mesmo espírito do
 * `PLAYBACK_EVENT`. Sem isso, tirar um livro da lista pelo menu de "…" deixava
 * a Biblioteca mostrando o item removido até a pessoa recarregar a página, já
 * que o menu tem estado próprio e a tela não tinha como saber.
 */
export const LIBRARY_EVENT = "allbook:library";

function notifyLibrary(): void {
  window.dispatchEvent(new Event(LIBRARY_EVENT));
}

export interface LibraryItem {
  id: number;
  /** ISO de quando o livro entrou na lista. */
  addedAt: string;
}

/**
 * Aceita uma entrada em qualquer formato já visto no storage — objeto novo,
 * objeto antigo com id em texto — e devolve o item normalizado, ou nada se a
 * entrada não tiver um id aproveitável.
 */
function toLibraryItem(entry: unknown): LibraryItem[] {
  if (!entry || typeof entry !== "object") return [];
  const item = entry as Record<string, unknown>;
  const id = Number(item.id);
  if (!Number.isFinite(id)) return [];
  return [
    {
      id,
      addedAt: typeof item.addedAt === "string" ? item.addedAt : new Date().toISOString(),
    },
  ];
}

/** Os itens crus da lista, já normalizados e sem duplicatas. Nunca quebra. */
export function readLibrary(): LibraryItem[] {
  try {
    const stored = JSON.parse(localStorage.getItem(LIBRARY_KEY) || "[]");
    if (!Array.isArray(stored)) return [];
    const seen = new Set<number>();
    return stored.flatMap(toLibraryItem).filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  } catch {
    // Storage corrompido: lista vazia em vez de derrubar a tela.
    return [];
  }
}

function writeLibrary(items: LibraryItem[]): void {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(items));
    notifyLibrary();
  } catch {
    // localStorage cheio ou bloqueado: perder a marcação é chato, mas não é
    // motivo para quebrar o botão que a pessoa acabou de tocar.
  }
}

/**
 * A lista pronta para desenhar: cada id resolvido no catálogo. Um id que saiu
 * do catálogo é descartado em silêncio — livro que não existe mais não tem o
 * que mostrar.
 */
export function libraryBooks(): { book: Book; addedAt: string }[] {
  return readLibrary().flatMap((item) => {
    const book = catalog.find((b) => b.id === item.id);
    return book ? [{ book, addedAt: item.addedAt }] : [];
  });
}

export function isInLibrary(id: number): boolean {
  return readLibrary().some((item) => item.id === id);
}

/** Põe na lista. Já estar lá não duplica — a chamada só é ignorada. */
export function addToLibrary(id: number): void {
  const current = readLibrary();
  if (current.some((item) => item.id === id)) return;
  writeLibrary([...current, { id, addedAt: new Date().toISOString() }]);
}

export function removeFromLibrary(id: number): void {
  writeLibrary(readLibrary().filter((item) => item.id !== id));
}

/**
 * Downloads: só uma lista de ids — "baixado" ainda é uma marca, nenhum arquivo
 * de áudio existe. O formato antigo gravava os ids como texto; a leitura aceita
 * os dois e devolve sempre números.
 */
export function readDownloads(): number[] {
  try {
    const stored = JSON.parse(localStorage.getItem(DOWNLOADS_KEY) || "[]");
    if (!Array.isArray(stored)) return [];
    const seen = new Set<number>();
    return stored
      .map((id) => Number(id))
      .filter((id) => {
        if (!Number.isFinite(id) || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
  } catch {
    return [];
  }
}

function writeDownloads(ids: number[]): void {
  try {
    localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(ids));
    notifyLibrary();
  } catch {
    /* mesmo raciocínio de writeLibrary */
  }
}

/** Os livros baixados, resolvidos pelo catálogo e sem ids órfãos. */
export function downloadedBooks(): Book[] {
  return readDownloads().flatMap((id) => {
    const book = catalog.find((b) => b.id === id);
    return book ? [book] : [];
  });
}

export function isDownloaded(id: number): boolean {
  return readDownloads().includes(id);
}

export function addDownload(id: number): void {
  const current = readDownloads();
  if (current.includes(id)) return;
  writeDownloads([...current, id]);
}

export function removeDownload(id: number): void {
  writeDownloads(readDownloads().filter((item) => item !== id));
}
