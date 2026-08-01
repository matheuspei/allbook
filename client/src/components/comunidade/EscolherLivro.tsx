import { useState } from "react";
import { Search, X } from "lucide-react";

import { catalog } from "@/lib/books";

/**
 * **Escolher um livro para responder** (§4.92) — a busca curta que transforma
 * uma resposta de texto numa resposta com capa.
 *
 * É a peça de *"responder com um livro"* que a §4.58 decidiu em 29/07 e que
 * ficou por construir: o comentário aceitava texto e nada mais, então indicar
 * um livro virava uma frase que ninguém consegue tocar.
 *
 * **Seis resultados, e é de propósito.** Quem responde uma indicação já sabe o
 * nome do que vai indicar; uma grade maior transformaria a caixa de comentário
 * numa tela de busca, e a §4.23 manda varrer a tela que faz duas coisas.
 */
export default function EscolherLivro({
  onEscolher,
  onFechar,
}: {
  onEscolher: (bookId: number) => void;
  onFechar: () => void;
}) {
  const [busca, setBusca] = useState("");

  const termo = busca.trim().toLowerCase();
  const achados = termo
    ? catalog
        .filter(
          (livro) =>
            livro.title.toLowerCase().includes(termo) ||
            livro.author.toLowerCase().includes(termo),
        )
        .slice(0, 6)
    : [];

  return (
    <div
      className="mt-2 rounded-xl border border-white/[0.08] bg-black/25 p-2.5"
      data-testid="escolher-livro"
    >
      <div className="flex items-center gap-2">
        <span className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
          <input
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="qual livro você indica?"
            autoFocus
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-2 pl-8 pr-2 text-[12.5px] text-white placeholder:text-white/25 focus:border-primary/50 focus:outline-none"
            data-testid="busca-livro-resposta"
          />
        </span>
        <button
          onClick={onFechar}
          className="shrink-0 text-white/30 transition-colors hover:text-white"
          aria-label="fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {termo && achados.length === 0 && (
        <p className="mt-2 text-[11.5px] text-white/35">Nenhum livro com esse nome.</p>
      )}

      {achados.length > 0 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {achados.map((livro) => (
            <button
              key={livro.id}
              onClick={() => onEscolher(livro.id)}
              className="w-[58px] shrink-0 text-left"
              data-testid={`resposta-livro-${livro.id}`}
            >
              <img
                src={livro.cover}
                alt={livro.title}
                className="h-[82px] w-[58px] rounded-lg object-cover ring-1 ring-white/10"
              />
              <span className="mt-1 block truncate text-[9px] leading-tight text-white/45">
                {livro.title}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * **O livro dentro de uma resposta** — a capa que se toca e vai ouvir.
 *
 * O botão de ouvir leva ao player; a capa e o título abrem a ficha. É a mesma
 * divisão do trecho de áudio (§4.92): um pixel, um dono.
 */
export function LivroDaResposta({ bookId }: { bookId: number }) {
  const livro = catalog.find((item) => item.id === bookId);
  if (!livro) return null;

  return (
    <a
      href={`/book/${livro.id}`}
      className="mt-1.5 flex items-center gap-2.5 rounded-xl bg-white/[0.06] p-2 ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/[0.1]"
      data-testid={`livro-da-resposta-${livro.id}`}
    >
      <img
        src={livro.cover}
        alt={livro.title}
        className="h-[52px] w-[36px] shrink-0 rounded-md object-cover"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] font-semibold leading-tight">
          {livro.title}
        </span>
        <span className="mt-0.5 block truncate text-[10px] text-white/40">{livro.author}</span>
        <span className="mt-0.5 block text-[10px] text-primary">narra {livro.narrator}</span>
      </span>
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-black">
        <span className="ml-0.5 text-[9px]">▶</span>
      </span>
    </a>
  );
}
