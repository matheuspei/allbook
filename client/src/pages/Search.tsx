import { Search as SearchIcon, X, ChevronLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useState } from "react";

import SearchResults from "@/components/SearchResults";

/**
 * Tela de Busca — endereço próprio (`/search`).
 *
 * Antes a busca era um overlay que morava dentro da Início e era aberto por uma
 * ponte de evento (`lib/search.ts`), e a Descobrir tinha uma busca separada com o
 * mesmo código. Agora há um lugar só: a lupa do TopNav e a barra da Descobrir
 * apontam para cá, e os resultados vêm do componente compartilhado
 * `components/SearchResults`. Ganho: URL própria (dá para voltar com o botão do
 * navegador) e uma implementação única. Ver a decisão da busca no ROTEIRO.
 *
 * É tela cheia (sem TopNav/BottomNav, como o player e o login) para o foco ficar
 * no campo, que abre já com o cursor. O cabeçalho fica fixo no topo e a lista
 * rola por baixo.
 */
export default function Search() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");

  /** Volta para a tela anterior; se não houver histórico (URL colada à mão), vai para a Início. */
  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#141414]" data-testid="page-search">
      <div className="fixed top-0 left-0 right-0 z-10 bg-[#141414] border-b border-white/10">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={goBack} className="text-white/70" aria-label="Voltar" data-testid="button-search-back">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="relative flex-1">
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
      </div>

      <div className="pt-16">
        {query.trim() ? (
          <SearchResults query={query} onClear={() => setQuery("")} />
        ) : (
          <div className="flex items-center justify-center h-[50vh]">
            <p className="text-white/30 text-sm">Digite para pesquisar</p>
          </div>
        )}
      </div>
    </div>
  );
}
