import { Play, Star, ChevronRight, Info, MoreVertical, X } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";

import { catalog, getBooksByIds, duracaoEstimada, genres, type Book, type Genre } from "@/lib/books";
import { collections, homeRows, getBooksForCollection } from "@/lib/collections";
import { PLAYBACK_EVENT, playbackEntries, removeFromPlayback } from "@/lib/playback";
import { readProfile } from "@/lib/profile";
import BookActionsMenu from "@/components/BookActionsMenu";
import CategoryCard from "@/components/CategoryCard";

/**
 * Os livros do billboard do topo (a "capa" do app).
 *
 * Antes eram quatro ids escolhidos a dedo e escritos à mão — sem nenhum critério
 * que explicasse por que aqueles e não outros. Agora saem de uma regra real:
 * **os mais bem avaliados do catálogo, um por gênero** para não repetir tema.
 * Assim a capa sempre destaca o melhor do acervo e se atualiza sozinha quando o
 * catálogo muda; ninguém precisa manter uma lista fixa na mão.
 *
 * O texto de cada destaque (a "chamada") continua escrito à mão, porque a
 * sinopse importada da Open Library vem em inglês e cheia de texto de divulgação.
 * Livro sem chamada própria cai na frase padrão do gênero, então a capa nunca
 * fica sem descrição mesmo se a seleção mudar.
 */

const chamadaPorLivro: Record<number, string> = {
  7: "Uma saga épica de aventura, política e ecologia em um planeta desértico. O clássico da ficção científica que influenciou gerações.",
  102: "Um método fácil e comprovado de criar bons hábitos e abandonar os maus. Pequenas mudanças, resultados notáveis.",
  105: "Isolado pela neve num hotel vazio, um zelador enlouquece enquanto forças sombrias cercam sua família. Terror psicológico no ponto mais alto.",
  136: "O relato real de uma menina judia escondida do nazismo. Um testemunho de coragem e esperança que atravessou gerações.",
  140: "Elizabeth e o orgulhoso Sr. Darcy trocam farpas antes de trocar o coração. O romance mais querido de Jane Austen.",
  101: "Histórias sobre como lidamos com o dinheiro. O sucesso financeiro não depende de inteligência — depende de comportamento.",
  111: "A história íntima e inspiradora da ex-primeira-dama dos Estados Unidos. Uma jornada de superação e determinação.",
};

const chamadaPorGenero: Record<Genre, string> = {
  "Ficção Científica": "Mundos, tecnologias e futuros que esticam a imaginação.",
  Romance: "Histórias de amor que ficam com você muito depois do fim.",
  Terror: "Suspense e medo para ouvir com a luz acesa.",
  Mistério: "Pistas, reviravoltas e segredos até a última cena.",
  Negócios: "Ideias para pensar melhor sobre dinheiro, trabalho e decisões.",
  Biografia: "A vida real de quem deixou marca no mundo.",
  Autoajuda: "Um empurrão para mudar hábitos e enxergar a vida de outro jeito.",
  Produtividade: "Métodos simples para render mais sem se sobrecarregar.",
};

/** Os mais bem avaliados, um por gênero — os cinco de maior nota vão à capa. */
function destaquesDaCapa(): Book[] {
  const melhorDeCadaGenero = genres
    .map(({ label }) =>
      catalog
        .filter((book) => book.genre === label)
        .sort((a, b) => b.rating - a.rating)[0]
    )
    .filter((book): book is Book => Boolean(book));

  return melhorDeCadaGenero.sort((a, b) => b.rating - a.rating).slice(0, 5);
}

const heroBooks = destaquesDaCapa().map((book) => ({
  id: book.id,
  title: book.title,
  author: book.author,
  narrator: book.narrator,
  // A capa REAL do livro (o `books.ts` já cai na arte genérica do gênero quando
  // não há capa baixada). Antes o billboard usava sempre a genérica.
  cover: book.cover,
  duration: duracaoEstimada(book.pages),
  badge: "Mais bem avaliados",
  description: chamadaPorLivro[book.id] ?? chamadaPorGenero[book.genre],
  rating: book.rating,
}));

/**
 * "Continuar ouvindo" — os livros já começados.
 *
 * A lista era inventada, com ids (201, 202, 203) que não existem no catálogo:
 * clicar num deles abria o player de outro livro. Agora são livros de verdade;
 * as porcentagens seguem fixas, porque só existe progresso real do último livro
 * ouvido — esse entra na frente, em `ContinueListeningSection`.
 */
const continueListening = getBooksByIds([1, 7, 4]).map((book, index) => ({
  ...book,
  progress: [45, 23, 78][index] ?? 30,
}));

// Os cards coloridos de categoria vêm de `lib/collections.ts` (label, gradiente
// e destino), a mesma fonte que a tela `/collection/:slug` usa.

// As fileiras da Home são montadas a partir do catálogo em lib/books.ts,
// para não duplicar os dados fixos entre Home e Descobrir.
// As fileiras horizontais da Home vêm de `homeRows` em lib/collections.ts, a
// mesma fonte que a tela `/collection/:slug` usa quando a pessoa toca "Ver tudo".

function HeroBillboard() {
  const [, setLocation] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const dragStartX = useRef<number | null>(null);
  const dragStartY = useRef<number | null>(null);
  const isDragging = useRef(false);
  // Distingue "toquei no banner" (abre o livro) de "arrastei para trocar de
  // slide" (não abre nada). Um arraste também dispara clique no fim; sem isto,
  // deslizar entre capas abriria a página do livro sem querer.
  const suppressClick = useRef(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % heroBooks.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  const handleSwipe = useCallback((deltaX: number) => {
    if (Math.abs(deltaX) < 50) return;
    suppressClick.current = true;
    if (deltaX < 0) {
      setCurrentIndex((prev) => (prev + 1) % heroBooks.length);
    } else {
      setCurrentIndex((prev) => (prev - 1 + heroBooks.length) % heroBooks.length);
    }
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    dragStartX.current = e.touches[0].clientX;
    dragStartY.current = e.touches[0].clientY;
    suppressClick.current = false;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (dragStartX.current === null || dragStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - dragStartX.current;
    const deltaY = e.changedTouches[0].clientY - dragStartY.current;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      handleSwipe(deltaX);
    }
    dragStartX.current = null;
    dragStartY.current = null;
  };

  const onMouseDown = (e: React.MouseEvent) => {
    dragStartX.current = e.clientX;
    isDragging.current = true;
    suppressClick.current = false;
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current || dragStartX.current === null) return;
    handleSwipe(e.clientX - dragStartX.current);
    dragStartX.current = null;
    isDragging.current = false;
  };

  const hero = heroBooks[currentIndex];

  // Tocar em qualquer parte do banner abre a página do livro — o mesmo destino
  // de "Mais Informações". Os botões (Ouvir, Mais Informações, bolinhas) cuidam
  // do próprio clique, então são ignorados aqui. E um arraste não conta como
  // toque (ver `suppressClick`).
  const onBillboardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, a")) return;
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    setLocation(`/book/${hero.id}`);
  };

  return (
    <section
      data-testid="hero-billboard"
      className="relative w-full select-none cursor-pointer"
      style={{ height: "75vh", minHeight: "480px" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={() => { isDragging.current = false; dragStartX.current = null; }}
      onClick={onBillboardClick}
    >
      {heroBooks.map((book, idx) => (
        <div
          key={book.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: idx === currentIndex ? 1 : 0, pointerEvents: idx === currentIndex ? "auto" : "none" }}
          aria-hidden={idx !== currentIndex}
        >
          {/*
            A capa real é pequena (~320px de largura). Esticá-la para preencher o
            billboard inteiro a deixava borrada. Solução em duas camadas: o FUNDO é
            a capa ampliada e BORRADA de propósito (o borrão esconde o serrilhado do
            aumento), e por cima entra a capa NÍTIDA, inteira (`object-contain`) e
            reduzida — como é mostrada menor que o original, sai afiada.
          */}
          <img
            src={book.cover}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-50"
          />
          <div className="absolute inset-x-0 top-0 h-[54%] flex items-center justify-center px-6 pt-6">
            <img
              src={book.cover}
              alt={book.title}
              className="h-full w-auto max-w-[60%] object-contain rounded-xl shadow-2xl shadow-black/60 ring-1 ring-white/10"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/70 to-transparent" />

          {/*
            A legenda e os botões vivem DENTRO do slide, para trocarem junto com a
            capa. Antes o texto ficava fora e mudava na hora, enquanto a imagem
            levava 0,7s no fade — durante a troca aparecia a capa de um livro com o
            título de outro (a capa real traz o título impresso, então saltava aos
            olhos). Como um bloco só, capa e texto nunca mais se desencontram.
          */}
          <div className="absolute bottom-0 left-0 right-0 p-5 pb-8 space-y-3">
            <div className="inline-flex items-center gap-2">
              <span className="text-xs font-bold text-primary uppercase tracking-widest" data-testid="text-hero-badge">
                {book.badge}
              </span>
            </div>

            <h1
              data-testid="text-hero-title"
              className="font-display text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight max-w-sm"
            >
              {book.title}
            </h1>

            <p className="text-sm text-white/70 max-w-sm leading-relaxed line-clamp-3" data-testid="text-hero-description">
              {book.description}
            </p>

            <div className="flex items-center gap-3 text-xs text-white/50">
              <span>{book.author}</span>
              {book.duration && (
                <>
                  <span>•</span>
                  <span>{book.duration}</span>
                </>
              )}
              <span>•</span>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-primary text-primary" />
                <span>{book.rating}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                data-testid="button-hero-play"
                onClick={() => setLocation(`/player/${book.id}`)}
                className="flex items-center gap-2 bg-white text-black font-bold px-6 py-2.5 rounded-md text-sm hover:bg-white/90 transition-colors"
              >
                <Play className="w-4 h-4 fill-black" />
                Ouvir
              </button>
              <button
                data-testid="button-hero-info"
                onClick={() => setLocation(`/book/${book.id}`)}
                className="flex items-center gap-2 bg-white/20 text-white font-semibold px-6 py-2.5 rounded-md text-sm hover:bg-white/30 transition-colors backdrop-blur-sm"
              >
                <Info className="w-4 h-4" />
                Mais Informações
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 pt-4" data-testid="hero-pagination">
              {heroBooks.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  data-testid={`button-hero-dot-${dotIdx}`}
                  aria-label={`Destaque ${dotIdx + 1}`}
                  onClick={() => setCurrentIndex(dotIdx)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    dotIdx === currentIndex
                      ? "bg-white w-6"
                      : "bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

function CategoryGrid() {
  const [, setLocation] = useLocation();

  return (
    <section className="px-4 py-6 space-y-4" data-testid="category-grid">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
        <button data-testid="filter-categories" onClick={() => setLocation("/discover")} className="px-4 py-1.5 rounded-full border border-white/30 text-sm font-medium text-white whitespace-nowrap hover:bg-white/10 transition-colors flex items-center gap-1">
          Categorias
          <ChevronRight className="w-3 h-3 rotate-90" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3" data-testid="category-cards">
        {collections.map((colecao) => (
          <CategoryCard
            key={colecao.slug}
            label={colecao.label}
            covers={getBooksForCollection(colecao).slice(0, 3).map((book) => book.cover)}
            onClick={() => setLocation(`/collection/${colecao.slug}`)}
            testId={`card-category-${colecao.slug}`}
          />
        ))}
      </div>
    </section>
  );
}

function ContinueListeningSection() {
  const [, setLocation] = useLocation();

  /**
   * Os livros que a pessoa começou de verdade vêm na frente da fileira.
   *
   * É aqui que "onde parei" reaparece depois que a barrinha do player some.
   * A barra é da visita atual; esta fileira é a memória que sobrevive a fechar
   * o app — por isso a barra pode desaparecer sem que nada se perca.
   *
   * Os livros fixos continuam atrás só para a fileira não ficar vazia em quem
   * nunca ouviu nada. Assim que houver histórico real, ele empurra os fixos.
   */
  const [entries, setEntries] = useState(playbackEntries);

  useEffect(() => {
    const sync = () => setEntries(playbackEntries());
    window.addEventListener(PLAYBACK_EVENT, sync);
    return () => window.removeEventListener(PLAYBACK_EVENT, sync);
  }, []);

  /**
   * Ou tudo real, ou tudo exemplo — nunca misturado.
   *
   * Misturar dava uma cena confusa: tirar um livro do "Continuar ouvindo" com o
   * X o fazia **reaparecer** logo ali, agora como exemplo fixo, porque ele
   * também estava na lista de enfeite. Assim que existe histórico de verdade,
   * os exemplos saem de cena.
   */
  const items = entries.length
    ? entries.map(({ book, percent }) => ({ ...book, progress: percent, real: true }))
    : continueListening;

  return (
    <section className="px-4 py-2 space-y-4" data-testid="continue-listening">
      <h2 className="font-display font-bold text-xl text-white">
        Continuar ouvindo como <span className="text-white/70">{readProfile().name}</span>
      </h2>
      <div className="flex overflow-x-auto scrollbar-hide gap-3 -mx-4 px-4 pb-2">
        {items.map((book) => (
          <div
            key={book.id}
            className="min-w-[150px] max-w-[150px] group cursor-pointer"
            onClick={() => setLocation(`/player/${book.id}`)}
            data-testid={`card-continue-${book.id}`}
          >
            <div className="relative rounded-lg overflow-hidden aspect-[3/4] mb-1">
              <img
                src={book.cover}
                alt={book.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${book.progress}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between mt-1.5 px-0.5">
              <button
                onClick={(e) => { e.stopPropagation(); setLocation(`/book/${book.id}`); }}
                className="text-white/60 hover:text-white transition-colors"
                aria-label={`Sobre ${book.title}`}
                data-testid={`button-info-${book.id}`}
              >
                <Info className="w-4 h-4" />
              </button>
              {/**
               * Os três pontinhos abrem o mesmo menu da tela do livro. Antes
               * eles estavam aqui sem fazer nada.
               *
               * "Tirar de Continuar ouvindo" entra como ação extra — é o gesto
               * do X da Netflix, só que dentro do menu em vez de solto: um
               * botão a menos no cartão, e a ação fica nomeada por extenso, o
               * que evita confundi-la com "sair do livro".
               */}
              <BookActionsMenu
                bookId={book.id}
                acoesExtras={
                  "real" in book
                    ? [{
                        icone: X,
                        rotulo: "Tirar de Continuar ouvindo",
                        aoClicar: () => removeFromPlayback(book.id),
                      }]
                    : []
                }
              >
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="text-white/60 hover:text-white transition-colors"
                  aria-label={`Mais opções de ${book.title}`}
                  data-testid={`button-more-${book.id}`}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </BookActionsMenu>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BookCarousel({ slug, title, books }: { slug: string; title: string; books: Book[] }) {
  const [, setLocation] = useLocation();

  return (
    <section className="py-2 space-y-3" data-testid={`carousel-${slug}`}>
      <div className="flex items-center justify-between px-4">
        <h2 className="font-display font-bold text-xl text-white">{title}</h2>
        <button
          onClick={() => setLocation(`/collection/${slug}`)}
          className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors"
          data-testid={`button-see-all-${slug}`}
        >
          Ver tudo
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex overflow-x-auto scrollbar-hide gap-3 -mx-0 px-4 pb-2 snap-x snap-mandatory">
        {books.map((book) => (
          <div
            key={book.id}
            className="min-w-[130px] max-w-[130px] snap-start group cursor-pointer"
            onClick={() => setLocation(`/book/${book.id}`)}
            data-testid={`card-book-${book.id}`}
          >
            <div className="relative rounded-lg overflow-hidden aspect-[3/4] mb-2 transition-transform duration-200 group-hover:scale-105">
              <img
                src={book.cover}
                alt={book.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1.5 right-1.5">
                {/*
                  Os três pontinhos sobre a capa abriam nada. Agora usam o mesmo
                  BookActionsMenu da tela do livro e do carrossel "Continuar
                  ouvindo". O stopPropagation impede que o toque também navegue
                  para a página do livro (o cartão inteiro é clicável).
                */}
                <BookActionsMenu bookId={book.id}>
                  <button
                    // No celular não existe hover: o botão fica sempre visível
                    // e só de `sm` para cima passa a aparecer ao passar o mouse.
                    className="p-1 rounded-full bg-black/50 text-white/70 hover:text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Mais opções de ${book.title}`}
                    data-testid={`button-options-${book.id}`}
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                </BookActionsMenu>
              </div>
            </div>
            <h3 className="text-sm font-medium text-white leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {book.title}
            </h3>
            <p className="text-xs text-white/50 mt-0.5 line-clamp-1">{book.author}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen pb-24 bg-[#141414]" data-testid="page-home">
      <HeroBillboard />

      <div className="relative z-10 -mt-4">
        <CategoryGrid />
        <ContinueListeningSection />
        {homeRows.map((row) => (
          <BookCarousel
            key={row.slug}
            slug={row.slug}
            title={row.label}
            books={getBooksForCollection(row)}
          />
        ))}
      </div>
    </div>
  );
}
