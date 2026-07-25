import { Search, Headphones } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMemo } from "react";
import Fuse from "fuse.js";

import { catalog, type Book } from "@/lib/books";
import { REQUEST_PROMISE } from "@/lib/requests";

/**
 * Resultados da busca no catálogo — componente único, usado pela tela de Busca
 * (`pages/Search.tsx`). Nasceu de dois `SearchResults` quase idênticos que viviam
 * dentro da Início e da Descobrir; agora é a fonte única (ver decisão da busca no
 * ROTEIRO). Recebe o texto já digitado e um jeito de limpar; quem monta o campo é
 * a tela que o usa.
 *
 * A busca é 100% no navegador, sobre o catálogo fixo: primeiro tenta um casamento
 * direto (título ou autor contendo o texto, sem acento); só se não achar nada cai
 * no Fuse.js, que tolera erro de digitação. Assim quem escreve certo vê o resultado
 * exato no topo, e quem erra uma letra ainda encontra.
 */

function normalize(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function ResultCard({ book }: { book: Book }) {
  const [, setLocation] = useLocation();

  return (
    <div
      className="group cursor-pointer"
      onClick={() => setLocation(`/book/${book.id}`)}
      data-testid={`card-search-${book.id}`}
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

export default function SearchResults({ query, onClear }: { query: string; onClear: () => void }) {
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
    <section className="px-4 py-4 space-y-4" data-testid="search-results">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-xl text-white tracking-tight">Resultados</h2>
        <span className="text-xs text-white/50">
          {results.length} {results.length === 1 ? "encontrado" : "encontrados"}
        </span>
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {results.map((book) => (
            <ResultCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        /*
          Busca sem resultado é o momento de maior intenção do app inteiro: a
          pessoa disse exatamente o que queria ouvir e o catálogo não tinha.
          Antes isto era um beco — "nenhum resultado" e um botão de limpar. Agora
          é a porta do diferencial: pedir a narração daquele título, que já vai
          preenchido para a tela de pedido. Ver ROTEIRO 4.17.
        */
        <div className="text-center py-14 space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/5">
            <Search className="w-6 h-6 text-white/30" />
          </div>

          <p className="text-white/50">Nenhum resultado para "{query}"</p>

          <div className="space-y-3 pt-1">
            {/* Afirma o que se sabe (não está no catálogo) e oferece com
                firmeza. A versão anterior começava com "talvez", que põe dúvida
                justo onde o app deveria soar seguro do que entrega. */}
            <p className="mx-auto max-w-[17rem] text-sm leading-relaxed text-white/60">
              Este título ainda não está no catálogo. O estúdio grava o livro inteiro e entrega{" "}
              {REQUEST_PROMISE}.
            </p>

            <Link
              href={`/request?titulo=${encodeURIComponent(query.trim())}`}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 h-11 font-bold text-black transition-colors hover:bg-primary/90"
              data-testid="button-request-narration"
            >
              <Headphones className="w-4 h-4" />
              Pedir a narração
            </Link>
          </div>

          <button onClick={onClear} className="text-white/40 text-sm hover:text-white/70 transition-colors" data-testid="button-clear-search">
            Limpar busca
          </button>
        </div>
      )}
    </section>
  );
}
