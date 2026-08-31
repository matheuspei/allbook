import { useLocation } from "wouter";
import { Star } from "lucide-react";
import { tituloDeVitrine, type Book } from "@/lib/books";

/**
 * Grade de capas com título e nota, usada nos perfis de pessoa e na tela de
 * categoria. Fica em um componente só para as duas telas não divergirem no
 * visual quando uma delas for ajustada.
 */
export default function BookGrid({
  books,
  showAuthor = false,
}: {
  books: Book[];
  /** Na categoria o autor importa (são livros de gente diferente); no perfil da
   *  própria pessoa, não. */
  showAuthor?: boolean;
}) {
  const [, navegar] = useLocation();

  return (
    <div className="grid grid-cols-3 gap-3">
      {books.map((livro) => (
        <button
          key={livro.id}
          type="button"
          onClick={() => navegar(`/book/${livro.id}`)}
          aria-label={`${livro.title}, de ${livro.author}`}
          /* `flex flex-col` não é enfeite: a célula do grid estica todos os
             cartões até a altura do mais alto, e o conteúdo de um `<button>` é
             centralizado verticalmente pelo navegador. Era isso que fazia a
             segunda e a terceira capa DESCEREM enquanto a primeira ficava no
             topo (§4.146). Em coluna, tudo começa em cima. */
          className="group flex flex-col text-left"
          data-testid={`card-grid-book-${livro.id}`}
        >
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl shadow-lg shadow-black/40 ring-1 ring-white/10 transition-transform duration-200 group-hover:scale-[1.04] group-active:scale-[0.98]">
            <img src={livro.cover} alt="" className="h-full w-full object-cover" />
          </div>

          {/* ⚠️ **Sem `block` aqui, e isso é o conserto.** O `line-clamp-2` do
              Tailwind funciona ligando `display: -webkit-box`; um `block` na
              mesma classe o sobrescreve e o corte **deixa de existir, calado**
              — o título de 10 linhas que esticou esta grade tinha o clamp
              declarado o tempo todo (§4.146).

              `tituloDeVitrine` tira o subtítulo colado pela loja; o clamp
              segura o que sobrar. Os dois, sempre: 1.147 títulos longos não têm
              separador nenhum para cortar. */}
          <span className="mt-2 h-[32px] text-[12px] font-medium leading-snug text-white line-clamp-2">
            {tituloDeVitrine(livro)}
          </span>

          {showAuthor && (
            <span className="mt-0.5 block truncate text-[11px] text-white/45">{livro.author}</span>
          )}

          {/* Sem nota, sem estrela — livro do acervo chega sem avaliação, e
              "0,0" leria como péssimo em vez de desconhecido (§4.134). */}
          {livro.rating !== undefined && (
            <span className="mt-0.5 flex items-center gap-1 text-[11px] text-white/60">
              <Star className="h-3 w-3 shrink-0 fill-primary text-primary" />
              {livro.rating.toFixed(1)}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
