import { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { catalog, genres, type Genre, livroPorId} from "@/lib/books";
import {
  readRecommendationItems,
  setRecommendationNote,
  toggleRecommendation,
  type RecommendationItem,
} from "@/lib/recommendations";

/**
 * Escolher o que recomendar e dizer por quê (`/profile/recommendations`).
 *
 * Salva a cada toque e a cada tecla, sem botão "salvar" — como montar uma
 * playlist. Duas partes: em cima, "Seus recomendados", onde cada livro
 * escolhido ganha um campo para o porquê; embaixo, o catálogo para escolher
 * mais. Os escolhidos também sobem no catálogo, para achar sem rolar tudo.
 */

/** Limite do porquê — uma frase, não uma resenha. */
const MAX_NOTE = 200;

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function RecommendationsEdit() {
  const [items, setItems] = useState<RecommendationItem[]>(readRecommendationItems);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState<Genre | null>(null);

  const selectedIds = useMemo(() => items.map((item) => item.id), [items]);

  function toggle(id: number) {
    toggleRecommendation(id);
    setItems(readRecommendationItems());
  }

  function updateNote(id: number, note: string) {
    setRecommendationNote(id, note);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, note } : item)));
  }

  const books = useMemo(() => {
    const q = normalize(query.trim());

    const filtered = catalog.filter((book) => {
      const matchesGenre = !genre || book.genre === genre;
      const matchesQuery =
        !q ||
        normalize(book.title).includes(q) ||
        normalize(book.author).includes(q);
      return matchesGenre && matchesQuery;
    });

    // Escolhidos primeiro, na ordem em que foram adicionados.
    return [...filtered].sort((a, b) => {
      const ia = selectedIds.indexOf(a.id);
      const ib = selectedIds.indexOf(b.id);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return 0;
    });
  }, [query, genre, selectedIds]);

  return (
    <div className="min-h-screen pb-24 bg-background text-white" data-testid="recommendations-edit-page">
      <PageHeader
        title="O que você recomenda"
        fallback="/profile"
        action={
          <span className="text-xs text-white/40 shrink-0" data-testid="text-selected-count">
            {items.length} escolhido{items.length === 1 ? "" : "s"}
          </span>
        }
      />

      {items.length > 0 && (
        <section className="px-5 pt-4" data-testid="recommendations-notes">
          <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-3">
            Seus recomendados — conte o porquê
          </h2>
          <div className="space-y-3">
            {items.map((item) => {
              const book = livroPorId(item.id);
              if (!book) return null;
              return (
                <div key={item.id} className="flex gap-3" data-testid={`rec-note-${item.id}`}>
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-11 h-[59px] rounded object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-medium line-clamp-1">{book.title}</h3>
                      <button
                        onClick={() => toggle(item.id)}
                        className="text-white/30 hover:text-white shrink-0"
                        aria-label={`Tirar ${book.title} das recomendações`}
                        data-testid={`remove-rec-${item.id}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      value={item.note}
                      onChange={(e) => updateNote(item.id, e.target.value.slice(0, MAX_NOTE))}
                      rows={2}
                      placeholder="Por que você recomenda este livro?"
                      className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/50 transition-colors resize-none placeholder:text-white/25"
                      data-testid={`input-rec-note-${item.id}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="px-5 pt-4 pb-2">
        <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-3">
          Adicionar à lista
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar título ou autor..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-9 py-2.5 text-sm outline-none focus:border-primary/50 transition-colors placeholder:text-white/25"
            data-testid="input-search-recommendations"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              aria-label="Limpar a busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setGenre(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              genre === null ? "bg-white text-background" : "bg-white/10 text-white/70 hover:bg-white/15"
            }`}
            data-testid="filter-genre-todos"
          >
            Todos
          </button>
          {genres.map((item) => (
            <button
              key={item.label}
              onClick={() => setGenre(genre === item.label ? null : item.label)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                genre === item.label ? "bg-white text-background" : "bg-white/10 text-white/70 hover:bg-white/15"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <main className="px-5 py-3">
        {books.length === 0 ? (
          <p className="text-center text-sm text-white/40 py-16">
            Nenhum livro encontrado{query && ` para "${query}"`}.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3" data-testid="recommendations-grid">
            {books.map((book) => {
              const isOn = selectedIds.includes(book.id);
              return (
                <button
                  key={book.id}
                  onClick={() => toggle(book.id)}
                  /* `flex flex-col` pela mesma razão do `BookGrid` (§4.146):
                     a célula do grid estica o botão até a altura do vizinho de
                     título mais alto, e o navegador centraliza o conteúdo de um
                     `<button>` — a capa desceria em relação à do lado. */
                  className="group flex flex-col text-left"
                  aria-pressed={isOn}
                  data-testid={`pick-book-${book.id}`}
                >
                  <div
                    className={`relative rounded-lg overflow-hidden aspect-[3/4] mb-2 transition-all ${
                      isOn ? "ring-2 ring-primary" : "group-hover:opacity-80"
                    }`}
                  >
                    <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />

                    {isOn && (
                      <>
                        <div className="absolute inset-0 bg-black/40" />
                        <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />
                        </span>
                      </>
                    )}
                  </div>

                  <h3
                    className={`text-xs leading-tight line-clamp-2 ${
                      isOn ? "text-white font-medium" : "text-white/70"
                    }`}
                  >
                    {book.title}
                  </h3>
                  <p className="text-[10px] text-white/40 mt-0.5 line-clamp-1">{book.author}</p>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
