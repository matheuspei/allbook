import { Search as SearchIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";

import { catalog } from "@/lib/books";
import SearchResults, { ResultCard } from "@/components/SearchResults";

/**
 * Tela de Busca — a aba "Buscar" do menu de baixo (`/search`), no modelo da
 * Apple TV: mostra a grade "Em alta" quando vazia e os resultados ao digitar.
 * É a única busca do app; os resultados vêm do componente compartilhado
 * `components/SearchResults`. Ver a decisão da busca no ROTEIRO.
 *
 * Como é uma aba (não uma tela cheia empurrada), mantém o TopNav e o BottomNav —
 * por isso não tem cabeçalho fixo nem seta de voltar; o campo é o primeiro
 * conteúdo, logo abaixo do TopNav.
 */
/**
 * Estado vazio da busca (nada digitado): uma grade de capas recomendadas, no
 * estilo da tela "Buscar" da Apple TV — a pessoa já vê livros bons antes de
 * pesquisar qualquer coisa. Fonte hoje: "Em alta" = mais bem avaliados do
 * catálogo (sem backend). Quando houver servidor, dá pra personalizar por
 * perfil / histórico, como a Apple faz.
 */
function SearchSuggestions() {
  const emAlta = useMemo(
    () => [...catalog].sort((a, b) => b.rating - a.rating).slice(0, 12),
    []
  );

  return (
    <section className="px-4 py-4 space-y-3" data-testid="search-suggestions">
      <h2 className="font-display font-bold text-lg text-white tracking-tight">Em alta</h2>
      <div className="grid grid-cols-3 gap-3">
        {emAlta.map((book) => (
          <ResultCard key={book.id} book={book} />
        ))}
      </div>
    </section>
  );
}

export default function Search() {
  const [query, setQuery] = useState("");

  return (
    <div className="min-h-screen pb-24 bg-[#141414]" data-testid="page-search">
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            type="text"
            placeholder="Pesquisar títulos ou autores"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-white/10 border-none pl-9 pr-9 h-10 rounded-lg text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-primary/50"
            data-testid="input-search"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              aria-label="Limpar"
              data-testid="button-clear-input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {query.trim() ? (
        <SearchResults query={query} onClear={() => setQuery("")} />
      ) : (
        <SearchSuggestions />
      )}
    </div>
  );
}
