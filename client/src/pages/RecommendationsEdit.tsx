import { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { catalog, genres, type Genre } from "@/lib/books";
import { readRecommendationIds, toggleRecommendation } from "@/lib/recommendations";

/**
 * Escolher o que recomendar (`/profile/recommendations`).
 *
 * Salva a cada toque, sem botão "salvar" — como montar uma playlist. Os
 * escolhidos sobem para o topo, para a pessoa ver o que já montou sem rolar
 * o catálogo inteiro atrás deles.
 */

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function RecommendationsEdit() {
  const [selected, setSelected] = useState<number[]>(readRecommendationIds);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState<Genre | null>(null);

  function toggle(id: number) {
    setSelected(toggleRecommendation(id));
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
      const ia = selected.indexOf(a.id);
      const ib = selected.indexOf(b.id);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return 0;
    });
  }, [query, genre, selected]);

  return (
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="recommendations-edit-page">
      <PageHeader
        title="O que você recomenda"
        fallback="/profile"
        action={
          <span className="text-xs text-white/40 shrink-0" data-testid="text-selected-count">
            {selected.length} escolhido{selected.length === 1 ? "" : "s"}
          </span>
        }
      />

      <div className="px-5 pt-4 pb-2">
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
              aria-label="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setGenre(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              genre === null ? "bg-white text-black" : "bg-white/10 text-white/70 hover:bg-white/15"
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
                genre === item.label ? "bg-white text-black" : "bg-white/10 text-white/70 hover:bg-white/15"
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
              const isOn = selected.includes(book.id);
              return (
                <button
                  key={book.id}
                  onClick={() => toggle(book.id)}
                  className="text-left group"
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
                          <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />
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
