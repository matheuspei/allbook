/**
 * Livros que a pessoa recomenda para a comunidade.
 *
 * Não confundir com a "Minha lista": aquela é intenção privada, o que a pessoa
 * ainda quer ouvir. Esta é uma declaração pública, com o nome dela junto — a
 * diferença entre o "assistir mais tarde" e uma playlist pública do YouTube.
 *
 * Como ainda não há contas nem servidor, isto vive no `localStorage` e só a
 * própria pessoa vê. Quando existir backend, é o perfil dela que passa a
 * mostrar esta lista para os outros.
 */

import { catalog, type Book } from "@/lib/books";

const STORAGE_KEY = "allbook_recommendations";

/** Ids recomendados, na ordem em que foram adicionados. */
export function readRecommendationIds(): number[] {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(stored)) return [];
    return stored.map(Number).filter((id) => Number.isFinite(id));
  } catch {
    return [];
  }
}

/** Os livros recomendados, já resolvidos pelo catálogo e sem ids órfãos. */
export function readRecommendations(): Book[] {
  return readRecommendationIds()
    .map((id) => catalog.find((book) => book.id === id))
    .filter((book): book is Book => book !== undefined);
}

export function isRecommended(id: number): boolean {
  return readRecommendationIds().includes(id);
}

/** Põe ou tira da lista. Devolve a lista nova. */
export function toggleRecommendation(id: number): number[] {
  const current = readRecommendationIds();
  const next = current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
