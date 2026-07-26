import { Search as SearchIcon, X, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";

import { catalog, genres, getBooksByGenre, genreSlug, type Genre, type Book } from "@/lib/books";
import SearchResults from "@/components/SearchResults";
import RequestBanner from "@/components/RequestBanner";
import CategoryCard from "@/components/CategoryCard";

/**
 * Tela de Busca — a aba "Buscar" do menu de baixo (`/search`), no modelo da
 * Apple TV: mostra conteúdo para navegar quando o campo está vazio, e os
 * resultados ao digitar. É a única busca do app; os resultados vêm do
 * componente compartilhado `components/SearchResults`.
 *
 * Como é uma aba (não uma tela cheia empurrada), mantém o TopNav e o BottomNav —
 * por isso não tem cabeçalho fixo nem seta de voltar; o campo é o primeiro
 * conteúdo, logo abaixo do TopNav.
 *
 * **26/07: a tela Descobrir foi fundida aqui** (ver ROTEIRO 4.32). Ela era uma
 * tela sem aba, sem nome e com um campo de busca falso que jogava para cá — e o
 * que ela tinha de bom, a grade de gêneros com capas, era justamente o que
 * faltava nesta tela. Agora mora aqui.
 */

function normalize(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Grade de gêneros, herdada da antiga tela Descobrir.
 *
 * **Convive com o botão "Categorias" da Início de propósito, e não é repetição
 * à toa:** lá é uma lista compacta de pastilhas com ícone, para quem está
 * passeando e resolve filtrar; aqui são cartões com capas de verdade, para quem
 * abriu a busca sem saber o que procurar. Mesmo destino (`/category/:slug`),
 * momentos diferentes.
 */
function GenreGrid({ onSelect }: { onSelect: (genre: Genre) => void }) {
  return (
    <section className="space-y-3" data-testid="search-genres">
      <h2 className="font-display font-bold text-lg text-white tracking-tight">Navegar por gênero</h2>

      {/* Entrada em cascata dos cards, em CSS (tw-animate-css) e NÃO em framer:
          keyframe CSS não trava semitransparente quando a janela perde o foco — o
          framer, via requestAnimationFrame, chegava a deixar cards invisíveis. O
          `animationDelay` por índice dá o efeito cascata; `fill-mode-both` mantém
          o card no estado inicial durante o atraso, e o `fade-in` termina sempre
          em opacidade cheia, então no pior caso o card só aparece sem o atraso. */}
      <div className="grid grid-cols-2 gap-3">
        {genres.map((genre, i) => (
          <div
            key={genre.label}
            className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300"
            style={{ animationDelay: `${i * 45}ms` }}
          >
            <CategoryCard
              label={genre.label}
              covers={[...getBooksByGenre(genre.label)]
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 3)
                .map((book) => book.cover)}
              onClick={() => onSelect(genre.label)}
              testId={`card-genre-${normalize(genre.label).replace(/\s/g, "-")}`}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Fileira "Em alta" — o desenho numerado que era o "Top 10 da semana" da
 * Descobrir, com o nome e a régua trocados.
 *
 * **Por que o nome mudou (26/07).** "Top 10 da semana" prometia recorte de
 * tempo e a lista era um array escrito à mão no arquivo — nem semana, nem
 * ranking. "Em alta" é o mesmo bloco sem a promessa falsa.
 *
 * **Por que a numeração ficou.** Regra do Matheus, dita nesta data e valendo
 * para o projeto inteiro: *"as nossas decisões têm que ser tomadas
 * independentemente de existir servidor ou não (…) o servidor vai ser criado no
 * próximo passo"*. Então o desenho é o da versão final — quando o servidor
 * entrar, troca-se só a **fonte** desta lista (nota → mais ouvidos de verdade)
 * e nada aqui muda.
 */
function EmAltaRow({ books }: { books: Book[] }) {
  const [, setLocation] = useLocation();

  return (
    <section className="-mx-4 space-y-3" data-testid="search-em-alta">
      <h2 className="px-4 font-display font-bold text-lg text-white tracking-tight">Em alta</h2>

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
              data-testid={`card-em-alta-${book.id}`}
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

/**
 * Estado vazio da busca (nada digitado), no estilo da tela "Buscar" da Apple
 * TV: a pessoa já vê por onde começar antes de pesquisar qualquer coisa.
 *
 * A ordem é a que o Matheus pediu em 26/07: primeiro a porta do pedido, depois
 * a grade de gêneros (o que a Descobrir tinha de melhor — *"ela é mais bonita
 * do que a tela de buscar"*), e por último a fileira "Em alta". A fileira
 * "Lançamentos" da Descobrir **não** veio junto: ela já é um dos cards
 * coloridos da Início, e repetir aqui seria a mesma lista em dois lugares.
 */
function SearchSuggestions() {
  const [, navegar] = useLocation();
  const emAlta = useMemo(
    () => [...catalog].sort((a, b) => b.rating - a.rating).slice(0, 10),
    []
  );

  return (
    <div className="px-4 py-4 space-y-6" data-testid="search-suggestions">
      {/* Antes de digitar qualquer coisa, a pessoa já vê que pode pedir um livro
          que não está aqui. Antes isso só aparecia depois de uma busca sem
          resultado — e a busca antiga quase nunca ficava sem resultado, então na
          prática a porta não existia (ROTEIRO 4.18). */}
      <RequestBanner variante="discreto" />

      <GenreGrid onSelect={(genero) => navegar(`/category/${genreSlug(genero)}`)} />

      <EmAltaRow books={emAlta} />
    </div>
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
