import { ChevronRight, Play, Trophy, BookOpen, Plus, ArrowLeft, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PLAYBACK_EVENT, playbackEntries, removeFromPlayback, remainingLabel } from "@/lib/playback";
import { libraryBooks as lerBiblioteca } from "@/lib/library";
import { catalog, getBooksByGenre, type Book } from "@/lib/books";

import { useEffect, useMemo, useState } from "react";

export default function Library() {
  const [, setLocation] = useLocation();
  const [libraryBooks, setLibraryBooks] = useState<{ book: Book; addedAt: string }[]>([]);

  // Volta para onde a pessoa estava (Perfil, Início...), e não para um destino
  // fixo. Se ela abriu a URL direto, cai na Início.
  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/");
    }
  }
  const [activeTab, setActiveTab] = useState("todos");

  /**
   * "Continuar ouvindo" — os livros realmente começados, do mais recente ao
   * mais antigo.
   *
   * Isto era uma lista inventada, com dois títulos escritos na mão que não
   * existem no catálogo. Quem ouvia um livro de verdade não o via aqui; quem
   * nunca tinha ouvido nada via dois que nunca abriu. Agora vem de
   * `lib/playback.ts`, a mesma fonte da Início e da barrinha do player.
   */
  const [listeningHistory, setListeningHistory] = useState(playbackEntries);

  useEffect(() => {
    const sync = () => setListeningHistory(playbackEntries());
    window.addEventListener(PLAYBACK_EVENT, sync);
    return () => window.removeEventListener(PLAYBACK_EVENT, sync);
  }, []);

  useEffect(() => {
    // A lista vem de lib/library.ts, já resolvida pelo catálogo — a cópia de
    // título/capa que ficava no localStorage envelhecia a cada build.
    setLibraryBooks(lerBiblioteca());
  }, []);

  const tabs = [
    { key: "todos", label: "Todos" },
    { key: "audiolivros", label: "Audiolivros" },
    { key: "baixados", label: "Baixados" },
    { key: "listas", label: "Listas" },
  ];

  /**
   * "Sugestões para você" — outros livros dos gêneros que você já salva, tirando
   * os que já estão na lista, dos mais bem avaliados para baixo. Biblioteca vazia
   * cai nos melhores do catálogo inteiro. Substituiu um bloco de atalhos que não
   * agregavam (Séries/Autores eram "em breve"; Baixados repetia a aba do topo;
   * Gêneros só levava à Descobrir). É real, sem backend — como o resto do app.
   */
  const suggestions = useMemo(() => {
    const salvos = new Set(libraryBooks.map(({ book }) => book.id));
    const generos = Array.from(new Set(libraryBooks.map(({ book }) => book.genre)));
    const candidatos = generos.length
      ? generos.flatMap((genero) => getBooksByGenre(genero))
      : catalog;
    return candidatos
      .filter((livro) => !salvos.has(livro.id))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 12);
  }, [libraryBooks]);

  return (
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="library-page">
      {/* O deslocamento acompanha a altura do TopNav: uma fileira só, 56px,
          em qualquer largura — mesmo ajuste feito no PageHeader. */}
      <header className="sticky top-14 z-30 bg-[#141414]/95 backdrop-blur-md border-b border-white/5">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={goBack}
                className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Voltar"
                data-testid="button-library-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold font-display" data-testid="text-library-title">Minha Lista</h1>
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8 border border-white/20">
                <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white font-semibold text-xs">M</AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? "bg-white text-black"
                    : "bg-white/10 text-white/70 hover:bg-white/15"
                }`}
                data-testid={`tab-${tab.key}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="px-5 py-6 space-y-8">
        {libraryBooks.length > 0 && (
          <section className="space-y-4 animate-in fade-in duration-500" data-testid="section-library">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-display flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                Sua Biblioteca
              </h2>
              <Badge className="bg-amber-500/20 text-amber-500 border-none text-xs px-2">
                {libraryBooks.length}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {libraryBooks.map(({ book }) => (
                <Link key={book.id} href={`/book/${book.id}`}>
                  <div className="group cursor-pointer space-y-2" data-testid={`card-library-${book.id}`}>
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-white/5 shadow-lg">
                      <img src={book.cover} alt={book.title} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                        {/* Botão, não Link: link dentro de link é HTML inválido
                            e deixava o clique no play ambíguo. */}
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLocation(`/player/${book.id}`); }}
                          className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg"
                          aria-label={`Ouvir ${book.title}`}
                        >
                          <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold truncate group-hover:text-amber-500 transition-colors">{book.title}</h3>
                      <p className="text-[10px] text-white/40 truncate">{book.author}</p>
                    </div>
                  </div>
                </Link>
              ))}
              <button onClick={() => setLocation("/discover")} className="aspect-[3/4] rounded-lg border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 hover:border-white/20 hover:bg-white/5 transition-colors" data-testid="button-add-more">
                <Plus className="w-8 h-8 text-white/30" />
                <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Adicionar</span>
              </button>
            </div>
          </section>
        )}

        {libraryBooks.length === 0 && (
          <section className="py-12 text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-white/5 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-white/20" />
            </div>
            <h2 className="text-xl font-bold font-display">Sua lista está vazia</h2>
            <p className="text-sm text-white/50 max-w-xs mx-auto">
              Adicione audiolivros à sua lista para acessá-los rapidamente.
            </p>
            <Link href="/">
              <button className="mt-2 px-6 py-2.5 bg-white text-black rounded-lg font-bold text-sm hover:bg-white/90 transition-colors" data-testid="button-explore">
                Explorar Catálogo
              </button>
            </Link>
          </section>
        )}

        {listeningHistory.length > 0 && (
          <section className="space-y-4" data-testid="section-continue-listening">
            <h2 className="text-lg font-bold font-display">Continuar ouvindo</h2>
            <div className="space-y-3">
              {listeningHistory.map(({ book, playback, percent }) => (
                <div
                  key={book.id}
                  className="flex gap-3 items-center group cursor-pointer bg-white/5 rounded-xl p-3 hover:bg-white/8 transition-colors border border-white/5"
                  onClick={() => setLocation(`/player/${book.id}`)}
                  data-testid={`card-continue-${book.id}`}
                >
                  <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-white/10">
                    <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-xs text-white/40 mt-0.5">
                      Capítulo {playback.chapter} • {remainingLabel(playback)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      className="p-2 hover:bg-white/10 rounded-full transition-colors"
                      aria-label={`Retomar ${book.title}`}
                      data-testid={`button-play-${book.id}`}
                    >
                      <Play className="w-5 h-5 text-white fill-white" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFromPlayback(book.id); }}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors"
                      aria-label={`Tirar ${book.title} de Continuar ouvindo`}
                      data-testid={`button-remove-continue-${book.id}`}
                    >
                      <X className="w-4 h-4 text-white/40" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4" data-testid="section-stats-link">
          <Link href="/statistics">
            <div className="flex items-center justify-between group cursor-pointer">
              <h2 className="text-lg font-bold font-display">Suas estatísticas</h2>
              <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-amber-500 transition-colors" />
            </div>
          </Link>
          <Link href="/statistics">
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20 p-4 flex gap-4 items-center cursor-pointer hover:from-amber-500/15 hover:to-orange-500/15 transition-colors" data-testid="card-stats-streak">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                <Trophy className="w-7 h-7 text-amber-500" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm">3 semanas seguidas</h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  Você ouviu pelo menos 1 dia toda semana por 3 semanas.
                </p>
              </div>
            </div>
          </Link>
        </section>

        {suggestions.length > 0 && (
          <section className="space-y-4" data-testid="section-suggestions">
            <h2 className="text-xl font-bold font-display">Sugestões para você</h2>
            <div className="flex overflow-x-auto scrollbar-hide gap-3 -mx-5 px-5 pb-2 snap-x snap-mandatory">
              {suggestions.map((book) => (
                <Link
                  key={book.id}
                  href={`/book/${book.id}`}
                  className="min-w-[130px] max-w-[130px] snap-start group"
                  data-testid={`card-suggestion-${book.id}`}
                >
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-white/5 shadow-lg mb-2 transition-transform duration-300 group-hover:scale-105">
                    <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-sm font-medium text-white leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{book.author}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
