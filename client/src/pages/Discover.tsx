import { Search, X, ChevronRight, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import Fuse from "fuse.js";

import { catalog, genres, getBooksByIds, genreSlug, type Book, type Genre } from "@/lib/books";


const topWeekIds = [7, 102, 101, 104, 2, 130, 111, 129, 106, 4];
const newReleasesIds = [140, 144, 109, 108, 142, 137, 132, 107];

function normalize(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function BookCard({ book }: { book: Book }) {
  const [, setLocation] = useLocation();

  return (
    <div
      className="group cursor-pointer"
      onClick={() => setLocation(`/book/${book.id}`)}
      data-testid={`card-discover-${book.id}`}
    >
      <div className="relative rounded-lg overflow-hidden aspect-[3/4] mb-2 transition-transform duration-200 group-hover:scale-105">
        <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
      </div>
      <h3 className="text-xs font-medium text-white leading-tight line-clamp-2 group-hover:text-primary transition-colors">
        {book.title}
      </h3>
      <p className="text-[10px] text-white/50 mt-0.5 line-clamp-1">{book.author}</p>
    </div>
  );
}

function SearchResults({ query, onClear }: { query: string; onClear: () => void }) {
  const results = useMemo(() => {
    if (!query.trim()) return [];

    const q = normalize(query);

    const direct = catalog.filter(
      (book) => normalize(book.title).includes(q) || normalize(book.author).includes(q)
    );

    if (direct.length > 0) return direct;

    const fuse = new Fuse(catalog, {
      keys: ["title", "author"],
      threshold: 0.4,
      distance: 100,
      minMatchCharLength: 2,
      includeScore: true,
    });

    return fuse.search(query).map((result) => result.item);
  }, [query]);

  return (
    <section className="px-4 py-4 space-y-4" data-testid="discover-search-results">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-xl text-white tracking-tight">Resultados</h2>
        <span className="text-xs text-white/50">{results.length} encontrados</span>
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {results.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/5 mb-2">
            <Search className="w-6 h-6 text-white/30" />
          </div>
          <p className="text-white/50">Nenhum resultado para "{query}"</p>
          <button onClick={onClear} className="text-primary text-sm font-bold" data-testid="button-discover-clear-search">
            Limpar busca
          </button>
        </div>
      )}
    </section>
  );
}

function GenreGrid({ onSelect }: { onSelect: (genre: Genre) => void }) {
  return (
    <section className="px-4 py-4 space-y-4" data-testid="discover-genres">
      <h2 className="font-display font-bold text-lg text-white tracking-tight">Navegar por gênero</h2>

      <div className="grid grid-cols-2 gap-3">
        {genres.map((genre) => (
          <button
            key={genre.label}
            onClick={() => onSelect(genre.label)}
            data-testid={`card-genre-${normalize(genre.label).replace(/\s/g, "-")}`}
            className={`bg-gradient-to-br ${genre.gradient} rounded-lg p-4 text-left font-semibold text-sm text-white h-20 flex items-end hover:opacity-90 transition-opacity active:scale-[0.98]`}
          >
            {genre.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function TopTenRow() {
  const [, setLocation] = useLocation();
  const books = useMemo(() => getBooksByIds(topWeekIds), []);

  return (
    <section className="py-3 space-y-3" data-testid="discover-top-ten">
      <h2 className="font-display font-bold text-lg text-white tracking-tight px-4">Top 10 da semana</h2>

      <div className="flex overflow-x-auto scrollbar-hide gap-3 px-4 pb-2 snap-x snap-mandatory">
        {books.map((book, idx) => {
          const position = idx + 1;
          const isLeader = position === 1;

          return (
            <button
              key={book.id}
              type="button"
              onClick={() => setLocation(`/book/${book.id}`)}
              aria-label={`${position}º lugar: ${book.title}, de ${book.author}`}
              className="group shrink-0 snap-start w-[118px] text-left"
              data-testid={`card-top-${book.id}`}
            >
              <div
                className={`relative rounded-xl overflow-hidden aspect-[3/4] shadow-lg shadow-black/40 ring-1 transition-transform duration-200 group-hover:scale-[1.04] group-active:scale-[0.98] ${
                  isLeader ? "ring-primary/40" : "ring-white/10"
                }`}
              >
                <img src={book.cover} alt="" className="w-full h-full object-cover" />

                {/* Escurece o topo: sem isto o selo some em capas claras. */}
                <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/70 to-transparent" />

                {/*
                  A posição vira selo em vez de número gigante ao lado da capa.
                  `min-w` + `px` deixam o "10" caber sem espremer nada, e o texto
                  escuro sobre o laranja lê muito melhor que branco sobre laranja.
                  `aria-hidden` porque o botão já anuncia a posição por extenso.
                */}
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 left-1.5 grid place-items-center h-7 min-w-7 px-1.5 rounded-lg bg-gradient-to-br from-primary to-[#f59e0b] text-[#141414] font-display font-extrabold text-sm leading-none tabular-nums shadow-md shadow-black/50"
                >
                  {position}
                </span>
              </div>

              {/*
                `span` e não `p`: o conteúdo de um `button` só aceita conteúdo de
                frase, e parágrafo não é. `min-h` reserva as duas linhas do título
                para as notas alinharem entre cartões.
              */}
              <span className="mt-2 block min-h-[35px] text-[13px] font-medium leading-snug text-white line-clamp-2">
                {book.title}
              </span>
              <span className="mt-0.5 block truncate text-[11px] text-white/50">{book.author}</span>
              <span className="mt-1 flex items-center gap-1 text-[11px] text-white/70">
                <Star className="h-3 w-3 shrink-0 fill-[#f59e0b] text-[#f59e0b]" />
                {book.rating.toFixed(1)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ReleasesRow() {
  const [, setLocation] = useLocation();
  const books = useMemo(() => getBooksByIds(newReleasesIds), []);

  return (
    <section className="py-3 space-y-3" data-testid="discover-releases">
      <div className="flex items-center justify-between px-4">
        <h2 className="font-display font-bold text-lg text-white tracking-tight">Lançamentos</h2>
        <button className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors" data-testid="button-releases-see-all">
          Ver tudo
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex overflow-x-auto scrollbar-hide gap-3 px-4 pb-2 snap-x snap-mandatory">
        {books.map((book) => (
          <div
            key={book.id}
            className="min-w-[130px] max-w-[130px] snap-start group cursor-pointer"
            onClick={() => setLocation(`/book/${book.id}`)}
            data-testid={`card-release-${book.id}`}
          >
            <div className="relative rounded-lg overflow-hidden aspect-[3/4] mb-2 transition-transform duration-200 group-hover:scale-105">
              <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
            </div>
            <h3 className="text-sm font-medium text-white leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {book.title}
            </h3>
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3 h-3 fill-primary text-primary" />
              <span className="text-xs text-white/50">{book.rating}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Discover() {
  const [, navegar] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen pb-24 bg-[#141414]" data-testid="page-discover">
      <div className="px-4 pt-4 pb-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            type="text"
            placeholder="Buscar títulos, autores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 border-none pl-9 pr-9 h-10 rounded-lg text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-primary/50"
            data-testid="input-discover-search"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              data-testid="button-discover-clear-input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isSearching ? (
        <SearchResults query={searchQuery} onClear={() => setSearchQuery("")} />
      ) : (
        <>
          <GenreGrid onSelect={(genero) => navegar(`/category/${genreSlug(genero)}`)} />
          <TopTenRow />
          <ReleasesRow />
        </>
      )}
    </div>
  );
}
