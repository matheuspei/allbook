import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { LayoutGrid, Search as SearchIcon, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import SearchResults from "@/components/SearchResults";

/**
 * A busca aberta **por cima** da tela em que você está, pela lupa do TopNav.
 *
 * **Por que sobreposta, e não uma ida à aba Catálogo** (26/07, ideia do
 * Matheus). Ele queria a lupa na Início — *"as pessoas, assim que dedicaram ao
 * livro, já possam pesquisar"* — sem que isso levasse à outra aba. Duas coisas
 * decorrem disso:
 *
 * - **Não é uma segunda busca.** Os resultados saem do mesmo `SearchResults`
 *   que a aba usa (fonte única desde 4.18). O que muda é só onde ele aparece.
 * - **Não é um campo dentro da Início.** Resultado de busca é lista longa: na
 *   Início ele empurraria a vitrine, o "continuar ouvindo" e o resto para fora
 *   da tela. Por cima, ele tem a tela toda — e ao fechar você volta ao ponto
 *   exato onde estava, sem ter trocado de aba. É o gesto do Spotify e da App
 *   Store.
 *
 * **O teclado é melhor esforço, não promessa.** O foco é pedido assim que o
 * painel abre, o que costuma subir o teclado no Android. O iOS só abre teclado
 * a partir de um gesto direto e pode recusar — por isso nada aqui depende
 * disso: o campo já está focado, e um toque resolve. Foi o mesmo motivo que
 * tirou o `autoFocus` da aba Catálogo.
 */
export default function BuscaSobreposta({ onFechar }: { onFechar: () => void }) {
  const [query, setQuery] = useState("");
  const [, navegar] = useLocation();
  const campo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    campo.current?.focus();
  }, []);

  // Esc fecha — vale no navegador e no teclado externo do tablet.
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-background animate-in fade-in duration-150"
      data-testid="busca-sobreposta"
    >
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            ref={campo}
            type="text"
            placeholder="Buscar títulos ou autores"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-lg border-none bg-white/10 pl-9 pr-9 text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-primary/50"
            data-testid="input-busca-sobreposta"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                campo.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              aria-label="Limpar"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          onClick={onFechar}
          className="shrink-0 px-1 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
          data-testid="fechar-busca"
        >
          Cancelar
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* `onEscolher={onFechar}`: sem isto a folha ficava montada por cima da
            tela nova e o app parecia travado (05/08) — ver `SearchResults`. */}
        {query.trim() ? (
          <SearchResults query={query} onClear={() => setQuery("")} onEscolher={onFechar} />
        ) : (
          /*
           * Estado vazio com **saída**, não só uma frase: quem abriu a lupa sem
           * saber o que procurar continua a um toque do catálogo, em vez de
           * ficar olhando para um campo em branco.
           */
          <div className="px-6 pt-10 text-center">
            <p className="text-sm text-white/40">
              Digite o título de um livro ou o nome de quem escreveu.
            </p>
            <button
              onClick={() => {
                onFechar();
                navegar("/search");
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-[13px] font-medium text-white/70 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white"
              data-testid="link-catalogo-da-busca"
            >
              <LayoutGrid className="h-4 w-4 text-primary" />
              Explorar o catálogo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
