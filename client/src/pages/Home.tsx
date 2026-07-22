import { Search, Play, Star, ChevronRight, X, Info, MoreVertical, ChevronLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Fuse from "fuse.js";

import { catalog, getBooksByIds, type Book } from "@/lib/books";
import { PLAYBACK_EVENT, playbackEntries, removeFromPlayback } from "@/lib/playback";
import BookActionsMenu from "@/components/BookActionsMenu";

import coverScifi from "@/assets/images/cover-scifi.png";
import coverSelfhelp from "@/assets/images/cover-selfhelp.png";
import coverBusiness from "@/assets/images/cover-business.png";
import coverBiography from "@/assets/images/cover-biography.png";
import coverProductivity from "@/assets/images/cover-productivity.png";

const heroBooks = [
  {
    id: 101,
    title: "A Psicologia Financeira",
    author: "Morgan Housel",
    narrator: "Lidiane Maravilha",
    cover: coverBusiness,
    duration: "8h 32min",
    badge: "AllBook Original",
    description: "Histórias sobre como lidamos com o dinheiro. O sucesso financeiro não depende de inteligência — depende de comportamento.",
    rating: 4.8,
  },
  {
    id: 102,
    title: "Hábitos Atômicos",
    author: "James Clear",
    narrator: "Ricardo Marques",
    cover: coverProductivity,
    duration: "10h 15min",
    badge: "Mais Ouvido",
    description: "Um método fácil e comprovado de criar bons hábitos e eliminar os maus. Pequenas mudanças, resultados notáveis.",
    rating: 4.9,
  },
  {
    id: 7,
    title: "Duna",
    author: "Frank Herbert",
    narrator: "Bruno Rocha",
    cover: coverScifi,
    duration: "21h 48min",
    badge: "Exclusivo AllBook",
    description: "Uma saga épica de aventura, política e ecologia em um planeta desértico. O clássico da ficção científica que influenciou gerações.",
    rating: 4.9,
  },
  {
    id: 111,
    title: "Minha História",
    author: "Michelle Obama",
    narrator: "Ana Paula Silva",
    cover: coverBiography,
    duration: "19h 20min",
    badge: "Best-Seller",
    description: "A história íntima e inspiradora da ex-primeira-dama dos Estados Unidos. Uma jornada de superação e determinação.",
    rating: 4.8,
  },
];

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

const categoryCards = [
  { label: "Só na AllBook", gradient: "from-orange-600 to-red-700" },
  { label: "Best-sellers Internacionais", gradient: "from-blue-600 to-teal-500" },
  { label: "Mais Ouvidos", gradient: "from-pink-600 to-rose-500" },
  { label: "Favoritos", gradient: "from-teal-500 to-cyan-400" },
  { label: "O Brasil Curtiu", gradient: "from-red-700 to-rose-600" },
  { label: "Lançamentos", gradient: "from-purple-700 to-violet-500" },
  { label: "Para Maratonar", gradient: "from-teal-600 to-emerald-500" },
  { label: "Autoajuda & Negócios", gradient: "from-amber-600 to-orange-500" },
];

// As fileiras da Home são montadas a partir do catálogo em lib/books.ts,
// para não duplicar os dados fixos entre Home e Descobrir.
const categories: { title: string; books: Book[] }[] = [
  {
    title: "Minha lista",
    books: getBooksByIds([101, 102, 1, 103, 8]),
  },
  {
    title: "Descubra suas próximas histórias",
    books: getBooksByIds([2, 3, 104, 105, 106, 119, 120]),
  },
  {
    title: "🔥 Sugestões que você vai adorar",
    books: getBooksByIds([7, 109, 129, 130, 131, 132]),
  },
  {
    title: "Desenvolvimento e Negócios",
    books: getBooksByIds([4, 107, 5, 108, 124, 125]),
  },
  {
    title: "Biografias e Histórias Reais",
    books: getBooksByIds([111, 112, 113, 135, 136, 137]),
  },
];

function HeroBillboard() {
  const [, setLocation] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const dragStartX = useRef<number | null>(null);
  const dragStartY = useRef<number | null>(null);
  const isDragging = useRef(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % heroBooks.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  const handleSwipe = useCallback((deltaX: number) => {
    if (Math.abs(deltaX) < 50) return;
    if (deltaX < 0) {
      setCurrentIndex((prev) => (prev + 1) % heroBooks.length);
    } else {
      setCurrentIndex((prev) => (prev - 1 + heroBooks.length) % heroBooks.length);
    }
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    dragStartX.current = e.touches[0].clientX;
    dragStartY.current = e.touches[0].clientY;
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
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current || dragStartX.current === null) return;
    handleSwipe(e.clientX - dragStartX.current);
    dragStartX.current = null;
    isDragging.current = false;
  };

  const hero = heroBooks[currentIndex];

  return (
    <section
      data-testid="hero-billboard"
      className="relative w-full select-none"
      style={{ height: "75vh", minHeight: "480px" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={() => { isDragging.current = false; dragStartX.current = null; }}
    >
      {heroBooks.map((book, idx) => (
        <div
          key={book.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: idx === currentIndex ? 1 : 0 }}
        >
          <img
            src={book.cover}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/70 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-5 pb-8 space-y-3">
        <div className="inline-flex items-center gap-2">
          <span className="text-xs font-bold text-primary uppercase tracking-widest" data-testid="text-hero-badge">
            {hero.badge}
          </span>
        </div>

        <h1
          data-testid="text-hero-title"
          className="font-display text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight max-w-sm"
        >
          {hero.title}
        </h1>

        <p className="text-sm text-white/70 max-w-sm leading-relaxed line-clamp-3" data-testid="text-hero-description">
          {hero.description}
        </p>

        <div className="flex items-center gap-3 text-xs text-white/50">
          <span>{hero.author}</span>
          <span>•</span>
          <span>{hero.duration}</span>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-primary text-primary" />
            <span>{hero.rating}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            data-testid="button-hero-play"
            onClick={() => setLocation(`/player/${hero.id}`)}
            className="flex items-center gap-2 bg-white text-black font-bold px-6 py-2.5 rounded-md text-sm hover:bg-white/90 transition-colors"
          >
            <Play className="w-4 h-4 fill-black" />
            Ouvir
          </button>
          <button
            data-testid="button-hero-info"
            onClick={() => setLocation(`/book/${hero.id}`)}
            className="flex items-center gap-2 bg-white/20 text-white font-semibold px-6 py-2.5 rounded-md text-sm hover:bg-white/30 transition-colors backdrop-blur-sm"
          >
            <Info className="w-4 h-4" />
            Mais Informações
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 pt-4" data-testid="hero-pagination">
          {heroBooks.map((_, idx) => (
            <button
              key={idx}
              data-testid={`button-hero-dot-${idx}`}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? "bg-white w-6"
                  : "bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryGrid() {
  return (
    <section className="px-4 py-6 space-y-4" data-testid="category-grid">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
        <button data-testid="filter-audiobooks" className="px-4 py-1.5 rounded-full border border-white/30 text-sm font-medium text-white whitespace-nowrap hover:bg-white/10 transition-colors">
          Audiobooks
        </button>
        <button data-testid="filter-podcasts" className="px-4 py-1.5 rounded-full border border-white/30 text-sm font-medium text-white whitespace-nowrap hover:bg-white/10 transition-colors">
          Podcasts
        </button>
        <button data-testid="filter-categories" className="px-4 py-1.5 rounded-full border border-white/30 text-sm font-medium text-white whitespace-nowrap hover:bg-white/10 transition-colors flex items-center gap-1">
          Categorias
          <ChevronRight className="w-3 h-3 rotate-90" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3" data-testid="category-cards">
        {categoryCards.map((cat, idx) => (
          <button
            key={idx}
            data-testid={`card-category-${idx}`}
            className={`bg-gradient-to-br ${cat.gradient} rounded-lg p-4 text-left font-semibold text-sm text-white h-20 flex items-end hover:opacity-90 transition-opacity active:scale-[0.98]`}
          >
            {cat.label}
          </button>
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
      <h2 className="font-display font-bold text-lg text-white">
        Continuar ouvindo como <span className="text-white/70">matheus</span>
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

function BookCarousel({ title, books }: { title: string; books: typeof categories[0]["books"] }) {
  const [, setLocation] = useLocation();

  return (
    <section className="py-2 space-y-3" data-testid={`carousel-${title.replace(/\s/g, '-').toLowerCase()}`}>
      <div className="flex items-center justify-between px-4">
        <h2 className="font-display font-bold text-lg text-white">{title}</h2>
        <button className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors" data-testid={`button-see-all-${title.replace(/\s/g, '-').toLowerCase()}`}>
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
                    className="p-1 rounded-full bg-black/50 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
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

function SearchResults({ query, onClear }: { query: string; onClear: () => void }) {
  const [, setLocation] = useLocation();

  const allBooks = catalog;

  const filteredBooks = useMemo(() => {
    if (!query.trim()) return [];

    const normalize = (str: string) =>
      str.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    const q = normalize(query);

    const directResults = allBooks.filter(book =>
      normalize(book.title).includes(q) ||
      normalize(book.author).includes(q)
    );

    if (directResults.length > 0) return directResults;

    const fuse = new Fuse(allBooks, {
      keys: ['title', 'author'],
      threshold: 0.4,
      distance: 100,
      minMatchCharLength: 2,
      includeScore: true
    });

    return fuse.search(query).map(result => result.item);
  }, [query, allBooks]);

  return (
    <section className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-xl text-white">Resultados</h2>
        <span className="text-xs text-white/50">{filteredBooks.length} encontrados</span>
      </div>

      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {filteredBooks.map((book) => (
            <div key={book.id} className="group cursor-pointer" onClick={() => setLocation(`/book/${book.id}`)} data-testid={`card-search-${book.id}`}>
              <div className="relative rounded-lg overflow-hidden aspect-[3/4] mb-2 transition-transform duration-200 group-hover:scale-105">
                <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xs font-medium text-white leading-tight line-clamp-2">{book.title}</h3>
              <p className="text-[10px] text-white/50 mt-0.5">{book.author}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/5 mb-2">
            <Search className="w-6 h-6 text-white/30" />
          </div>
          <p className="text-white/50">Nenhum resultado para "{query}"</p>
          <button onClick={onClear} className="text-primary text-sm font-bold" data-testid="button-clear-search">
            Limpar busca
          </button>
        </div>
      )}
    </section>
  );
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className="min-h-screen pb-24 bg-[#141414]" data-testid="page-home">
      {showSearch && (
        <div className="fixed inset-0 z-40 bg-[#141414]">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
            <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} className="text-white/70" data-testid="button-close-search">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                type="text"
                placeholder="Pesquisar títulos ou autores"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-white/10 border-none pl-9 pr-9 h-10 rounded-lg text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-primary/50"
                data-testid="input-search"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  data-testid="button-clear-input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="overflow-y-auto" style={{ height: "calc(100vh - 56px)" }}>
            {searchQuery.trim() ? (
              <SearchResults query={searchQuery} onClear={() => setSearchQuery("")} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-white/30 text-sm">Digite para pesquisar</p>
              </div>
            )}
          </div>
        </div>
      )}

      <HeroBillboard />

      <div className="relative z-10 -mt-4">
        <CategoryGrid />
        <ContinueListeningSection />
        {categories.map((category, idx) => (
          <BookCarousel key={idx} title={category.title} books={category.books} />
        ))}
      </div>
    </div>
  );
}
