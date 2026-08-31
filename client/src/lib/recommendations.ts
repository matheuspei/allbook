/**
 * Livros que a pessoa recomenda para a comunidade — agora com um porquê.
 *
 * Não confundir com a "Minha lista": aquela é intenção privada, o que a pessoa
 * ainda quer ouvir. Esta é uma declaração pública, com o nome dela junto — a
 * diferença entre o "assistir mais tarde" e uma playlist pública do YouTube.
 *
 * Cada recomendação carrega um `note`: uma frase da pessoa sobre o livro ("por
 * que eu recomendo"). É opcional — dá para recomendar sem escrever nada — e é o
 * que transforma a lista de capas num convite pessoal.
 *
 * Como ainda não há contas nem servidor, isto vive no `localStorage` e só a
 * própria pessoa vê. Quando existir backend, é o perfil dela que passa a
 * mostrar esta lista para os outros.
 */

import { type Book, livroPorId } from "@/lib/books";

const STORAGE_KEY = "allbook_recommendations";

export interface RecommendationItem {
  id: number;
  /** O porquê da recomendação. Vazio = a pessoa ainda não escreveu nada. */
  note: string;
  /**
   * Quando você recomendou (ISO). Entrou em 28/07 para o Mural: linha do
   * tempo pede data. Itens de antes não têm — continuam valendo em todo
   * lugar, só não entram no feed (data chutada seria mentira).
   */
  date?: string;
}

/**
 * Lê os itens salvos, migrando o formato antigo (uma lista só de ids) para o
 * novo `{ id, note }`. Assim quem já tinha recomendações não as perde — elas
 * só passam a existir sem texto até a pessoa escrever um.
 */
export function readRecommendationItems(): RecommendationItem[] {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(stored)) return [];
    return stored.flatMap((entry): RecommendationItem[] => {
      if (typeof entry === "number" && Number.isFinite(entry)) {
        return [{ id: entry, note: "" }];
      }
      if (entry && typeof entry === "object" && Number.isFinite(Number(entry.id))) {
        return [
          {
            id: Number(entry.id),
            note: typeof entry.note === "string" ? entry.note : "",
            ...(typeof entry.date === "string" ? { date: entry.date } : {}),
          },
        ];
      }
      return [];
    });
  } catch {
    return [];
  }
}

/** Só os ids, na ordem em que foram adicionados. */
export function readRecommendationIds(): number[] {
  return readRecommendationItems().map((item) => item.id);
}

/** Os livros recomendados + o motivo, resolvidos pelo catálogo e sem ids órfãos. */
export function readRecommendations(): { book: Book; note: string }[] {
  return readRecommendationItems().flatMap((item) => {
    const book = livroPorId(item.id);
    return book ? [{ book, note: item.note }] : [];
  });
}

export function isRecommended(id: number): boolean {
  return readRecommendationIds().includes(id);
}

/** Põe ou tira da lista. Devolve os ids novos (mantém a assinatura antiga). */
/** As recomendações mudaram — o padrão de evento da casa (§4.122). */
export const RECOMMENDATIONS_EVENT = "allbook:recomendacoes";

function gravar(next: RecommendationItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(RECOMMENDATIONS_EVENT));
}

export function toggleRecommendation(id: number): number[] {
  const current = readRecommendationItems();
  const next = current.some((item) => item.id === id)
    ? current.filter((item) => item.id !== id)
    : [...current, { id, note: "", date: new Date().toISOString() }];

  gravar(next);
  return next.map((item) => item.id);
}

/** Guarda (ou apaga) o motivo de um livro já recomendado. */
export function setRecommendationNote(id: number, note: string): void {
  const current = readRecommendationItems();
  const next = current.map((item) => (item.id === id ? { ...item, note } : item));
  gravar(next);
}
