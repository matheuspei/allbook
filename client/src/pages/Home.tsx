import { Play, Star, ChevronRight, ChevronDown, Info, MoreVertical, X } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";

import {
  carregarSinopses,
  catalog,
  getBooksByIds,
  genreSlug,
  duracaoDoLivro,
  genres,
  temCapaReal,
  tituloDeVitrine,
  type Book,
  type Genre,
  porNota,
} from "@/lib/books";
import FimDaLista from "@/components/FimDaLista";
import { collections, homeRows, getBooksForCollection } from "@/lib/collections";
import GenreIcon from "@/components/GenreIcon";
import { PLAYBACK_EVENT, playbackEntries, removeFromPlayback } from "@/lib/playback";
import { readProfile } from "@/lib/profile";
import BookActionsMenu from "@/components/BookActionsMenu";
import CategoryCard from "@/components/CategoryCard";
import CatalogoVazio from "@/components/CatalogoVazio";

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

/**
 * Há alguma nota no catálogo inteiro?
 *
 * Decide o critério E o selo do billboard. Com o acervo de verdade a resposta é
 * **não**: nenhuma das lojas entrega avaliação, e a nota do AllBook vem de quem
 * ouve. Chamar de "Mais bem avaliados" uma seleção em que ninguém avaliou nada
 * seria o mesmo tipo de mentira que as maquetes contavam (§4.134).
 */
function existeAlgumaNota(): boolean {
  return catalog.some((livro) => livro.rating !== undefined);
}

/** Os mais bem avaliados, um por gênero — os cinco de maior nota vão à capa. */
function destaquesDaCapa(): Book[] {
  /**
   * ⚠️ **A capa do app tem porteiro** (21/08). O acervo de verdade traz fichas
   * de qualidade desigual, e o billboard é a primeira coisa que se vê: no
   * primeiro teste ele estampou um livro sem autor ("Autor desconhecido"), sem
   * descrição e com o título cru da loja, em caixa baixa e sem acento. Livro
   * assim continua no catálogo, na busca e nas listas — só não é cartão de
   * visita.
   */
  const aptoParaACapa = (book: Book) =>
    temCapaReal(book) && book.author !== "Autor desconhecido";

  const melhorDeCadaGenero = genres
    .map(({ label }) =>
      catalog
        .filter((book) => book.genre === label && aptoParaACapa(book))
        .sort(porNota)[0]
    )
    .filter((book): book is Book => Boolean(book));

  // Com notas, os melhores; sem nenhuma nota no catálogo, os mais recentes —
  // senão a ordem seria arbitrária e o selo "Novo no acervo" mentiria.
  const criterio = existeAlgumaNota()
    ? porNota
    : (a: Book, b: Book) => (b.year ?? 0) - (a.year ?? 0);

  return melhorDeCadaGenero.sort(criterio).slice(0, 5);
}

const HA_NOTAS = existeAlgumaNota();

/**
 * As fileiras que o **acervo** monta sozinho, uma por gênero.
 *
 * 🚨 Nasceram em 21/08 de um buraco que eu mesmo abri (§4.134): ao apagar as
 * maquetes, a curadoria de `lib/collections.ts` foi esvaziada — ela apontava
 * para os ids delas —, e com 2.436 livros de verdade dentro a Início ficou com
 * o destaque, um livro em "Continuar ouvindo" e mais nada. Prateleira curada
 * volta quando alguém curar; **fileira de gênero não precisa de ninguém**, sai
 * do próprio catálogo e cresce junto com ele.
 *
 * Ordem por tamanho do gênero, e só entra livro com capa de verdade: fileira
 * horizontal é feita de arte, e capa tipográfica gerada no meio de capas reais
 * é o defeito que a §4.104 já tinha nomeado.
 */
function fileirasDoAcervo(): { slug: string; label: string; books: Book[] }[] {
  return genres
    .map(({ label }) => ({
      slug: genreSlug(label),
      label,
      books: catalog.filter((livro) => livro.genre === label && temCapaReal(livro)),
    }))
    .filter((fileira) => fileira.books.length >= 4)
    .sort((a, b) => b.books.length - a.books.length)
    .slice(0, 8)
    .map((fileira) => ({ ...fileira, books: fileira.books.slice(0, 14) }));
}

const fileirasPorGenero = fileirasDoAcervo();

const heroBooks = destaquesDaCapa().map((book) => ({
  id: book.id,
  // Sem o subtítulo: o acervo traz o título cru da loja, e o billboard é o
  // único lugar onde o título é grande o bastante para virar parágrafo
  // (§4.136). O corte em duas linhas no JSX é a trava que sobra.
  title: tituloDeVitrine(book.title),
  author: book.author,
  narrator: book.narrator,
  // A capa REAL do livro (o `books.ts` já cai na arte genérica do gênero quando
  // não há capa baixada). Antes o billboard usava sempre a genérica.
  cover: book.cover,
  // A duração medida pela loja quando existe (o acervo a traz); só na falta
  // dela a estimativa por páginas, que é herança da ficha da Open Library.
  duration: duracaoDoLivro(book),
  badge: HA_NOTAS ? "Mais bem avaliados" : "Novo no acervo",
  // A chamada escrita à mão vence; depois a sinopse da própria loja (o acervo
  // traz uma para quase todo livro); e só então a frase do gênero.
  // Só a chamada escrita à mão. A cascata completa está no JSX, porque a
  // sinopse do livro chega depois (o billboard a busca): a ordem é chamada à
  // mão → sinopse do próprio livro → frase do gênero, da mais específica para
  // a mais genérica.
  description: chamadaPorLivro[book.id],
  chamadaDoGenero: chamadaPorGenero[book.genre],
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

  /**
   * As sinopses dos 5 destaques.
   *
   * Elas **não** vêm no catálogo (§4.134.2: eram 85% de uma resposta de 14 MB),
   * então o billboard as pede numa ida só, na abertura. Enquanto não chegam, a
   * descrição é a chamada escrita à mão ou a frase do gênero — nunca um vazio.
   */
  const [sinopses, setSinopses] = useState<Record<number, string | undefined>>({});

  useEffect(() => {
    const ids = heroBooks.map((livro) => livro.id);
    if (ids.length === 0) return;
    let vivo = true;
    void carregarSinopses(ids).then(() => {
      if (!vivo) return;
      setSinopses(
        Object.fromEntries(
          ids.map((id) => {
            const livro = catalog.find((item) => item.id === id);
            return [id, livro?.sinopse ?? livro?.synopsis];
          }),
        ),
      );
    });
    return () => {
      vivo = false;
    };
  }, []);

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

  /**
   * ⚠️ **Sem destaque, sem retângulo.** Com o catálogo vazio isto desenhava
   * 75vh de preto no topo da Início — e `% heroBooks.length` num array vazio dá
   * `NaN`, que não quebra nada e não avisa nada. A guarda vem **depois de todos
   * os hooks**, que é onde ela pode vir: `return` antes de um `useEffect` muda
   * a ordem dos hooks entre renders e o React reclama.
   */
  if (heroBooks.length === 0) return null;

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
      /*
        `overflow-hidden` conserta um vazamento antigo (26/07). O fundo de cada
        slide é a capa **ampliada em 10% e borrada**; sem recorte, esses 10% e o
        halo do borrão escapavam para fora do billboard e pintavam de cor a
        primeira faixa do conteúdo abaixo — com uma linha de corte seca onde o
        borrão acabava. Era isso que deixava a emenda "bagunçada" e diferente a
        cada capa que passa. Recortado, o degradê do slide desce inteiro até o
        `#141414` e a emenda some.
      */
      className="relative w-full select-none cursor-pointer overflow-hidden"
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

            §4.104: o fundo deixou de ser véu tímido (opacity-50 sob dois véus
            escuros — na prática parecia fundo chapado) e virou cenário: a arte
            sangra a tela, estilo Netflix, decisão dele na folha da averiguação.
            A legibilidade do texto fica por conta do degradê de baixo, que segue
            fechado no #141414.
          */}
          <img
            src={book.cover}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-3xl scale-110 opacity-90 saturate-125"
          />
          <div className="absolute inset-x-0 top-0 h-[54%] flex items-center justify-center px-6 pt-6">
            <img
              src={book.cover}
              alt={book.title}
              className="h-full w-auto max-w-[60%] object-contain rounded-xl shadow-2xl shadow-black/60 ring-1 ring-white/10"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/35 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/40 to-transparent" />

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
              className="font-display text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight max-w-sm line-clamp-2"
            >
              {book.title}
            </h1>

            <p className="text-sm text-white/70 max-w-sm leading-relaxed line-clamp-3" data-testid="text-hero-description">
              {book.description ?? sinopses[book.id] ?? book.chamadaDoGenero}
            </p>

            <div className="flex items-center gap-3 text-xs text-white/50">
              <span>{book.author}</span>
              {book.duration && (
                <>
                  <span>•</span>
                  <span>{book.duration}</span>
                </>
              )}
              {/* Estrela só com nota: o acervo chega sem avaliação, e o que
                  ficava aqui era uma estrela vermelha sozinha, sem número
                  nenhum ao lado (§4.134). */}
              {book.rating !== undefined && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-primary text-primary" />
                    <span>{book.rating}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                data-testid="button-hero-play"
                onClick={() => setLocation(`/player/${book.id}`)}
                className="flex items-center gap-2 bg-white text-background font-bold px-6 py-2.5 rounded-md text-sm hover:bg-white/90 transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                Ouvir
              </button>
              <button
                data-testid="button-hero-info"
                onClick={() => setLocation(`/book/${book.id}`)}
                className="flex items-center gap-2 bg-white/20 text-white font-semibold px-6 py-2.5 rounded-md text-sm hover:bg-white/30 transition-colors backdrop-blur-sm"
              >
                <Info className="w-4 h-4" />
                Mais informações
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

/**
 * O bloco de categorias da Início: o botão "Categorias" e, abaixo, os cards das
 * coleções curadas.
 *
 * **A seta agora cumpre o que promete (26/07).** O botão tinha uma seta apontando
 * para baixo — o gesto universal de "isto abre aqui mesmo" — mas o clique
 * *navegava* para a tela Descobrir. Nas palavras do Matheus: *"ele abre uma
 * página que é a mesma página do buscar, então ele fica sem sentido"* (a
 * Descobrir começa com um campo de busca, daí a confusão). Ou a seta some, ou ela
 * cumpre; escolhemos cumprir, porque a lista de gêneros é conteúdo real e não
 * existia em lugar nenhum da Início.
 *
 * **Gênero ≠ coleção, e por isso os dois blocos convivem.** A lista que abre são
 * os **gêneros** do catálogo (Terror, Romance…), que levam a `/category/:slug`;
 * os cards coloridos logo abaixo são **coleções curadas** (Lançamentos…), que
 * levam a `/collection/:slug`. São listas diferentes — não é repetição.
 *
 * **Ícone no lugar de cor, e nada de contagem (26/07).** A primeira versão tinha
 * uma barrinha no gradiente de cada gênero e o número de livros ao lado. As duas
 * coisas saíram no mesmo pedido do Matheus: oito cores diferentes *"cai um pouco
 * no padrão"* (a briga antiga contra a cara de template — ver ROTEIRO 4.27), e a
 * contagem *"não acrescenta muita coisa"* — quem escolhe um gênero quer o
 * assunto, não o estoque. O sinal visual agora é um ícone monocromático por
 * gênero, que acende no laranja da marca ao toque. Os desenhos são próprios do
 * AllBook (`components/GenreIcon.tsx`), e não da biblioteca de ícones: o
 * Matheus escolheu essa linha vendo as três propostas lado a lado.
 */
function CategoryGrid() {
  const [, setLocation] = useLocation();
  const [listaAberta, setListaAberta] = useState(false);

  /**
   * As capas de cada mosaico, sem repetir as dos vizinhos (§4.104). As coleções
   * se cruzam de propósito (o mesmo livro vive em várias), mas a colagem
   * ingênua dos 3 primeiros estampava Hábitos Atômicos em dois cards colados e
   * a Início parecia ter meia dúzia de livros. Cada card gasta primeiro as
   * capas que os anteriores ainda não usaram; capa tipográfica de reserva não
   * entra em vitrine (`temCapaReal`). Se faltar inédita, repete das próprias —
   * mosaico vazio seria pior que mosaico repetido.
   */
  /**
   * As coleções que têm ao menos um livro. Cartão de coleção vazia é uma porta
   * para uma tela vazia — e com o catálogo apagado eram oito deles em fila,
   * retângulos escuros com um rótulo em cima.
   */
  const colecoesComLivro = useMemo(
    () => collections.filter((colecao) => getBooksForCollection(colecao).length > 0),
    [],
  );

  const capasDosMosaicos = useMemo(() => {
    const usadas = new Set<string>();
    return colecoesComLivro.map((colecao) => {
      const comCapaReal = getBooksForCollection(colecao).filter(temCapaReal);
      const ineditas = comCapaReal.filter((livro) => !usadas.has(livro.cover));
      const doCard: string[] = [];
      for (const livro of [...ineditas, ...comCapaReal]) {
        if (!doCard.includes(livro.cover)) doCard.push(livro.cover);
        if (doCard.length === 3) break;
      }
      doCard.forEach((capa) => usadas.add(capa));
      return doCard;
    });
  }, [colecoesComLivro]);

  return (
    <section className="px-4 py-6 space-y-4" data-testid="category-grid">
      <div className="flex items-center gap-2 pb-2">
        <button
          data-testid="filter-categories"
          aria-expanded={listaAberta}
          aria-controls="lista-de-generos"
          onClick={() => setListaAberta((aberta) => !aberta)}
          className={`px-4 py-1.5 rounded-full border text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            listaAberta
              ? "border-primary/60 bg-primary/15 text-white"
              : "border-white/30 text-white hover:bg-white/10"
          }`}
        >
          Categorias
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${listaAberta ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {listaAberta && (
        <div
          id="lista-de-generos"
          data-testid="lista-de-generos"
          /*
            A altura máxima é para o dia em que o acervo crescer. Hoje são 8
            gêneros e a lista nem chega perto do limite; com um catálogo de
            verdade ("imagina aí, vinte mil audiolivros" — Matheus, 26/07) essa
            lista vira dezenas de itens, e sem teto ela empurraria a Início
            inteira para baixo. Com teto, ela rola sozinha e o resto da tela fica
            onde está.
          */
          className="grid max-h-[19rem] grid-cols-2 gap-2 overflow-y-auto pr-1 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          {genres.map(({ label }) => (
            <button
              key={label}
              type="button"
              data-testid={`genero-${genreSlug(label)}`}
              onClick={() => setLocation(`/category/${genreSlug(label)}`)}
              className="group flex items-center gap-2.5 rounded-lg bg-white/[0.04] px-3 py-2.5 text-left ring-1 ring-white/10 transition-colors hover:bg-white/[0.08] active:scale-[0.98]"
            >
              {/* 20px, e não os 16 de um ícone comum: estes têm um elemento
                  preenchido, e miúdos demais o sólido some dentro do traço.
                  20px é o teto que **não** mexe na altura da pastilha — é a
                  mesma altura da linha do texto ao lado, então o desenho cresce
                  e a lista fica idêntica (pedido do Matheus: "só os ícones, a
                  barra pode se manter"). */}
              <GenreIcon
                genre={label}
                className="h-5 w-5 shrink-0 text-white/45 transition-colors group-hover:text-primary"
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-white/90">
                {label}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3" data-testid="category-cards">
        {colecoesComLivro.map((colecao, i) => (
          <CategoryCard
            key={colecao.slug}
            label={colecao.label}
            covers={capasDosMosaicos[i]}
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

  // Nem histórico real nem exemplo: o título ficaria sozinho sobre o vazio.
  // (Os exemplos são `getBooksByIds`, então somem junto com o catálogo.)
  if (items.length === 0) return null;

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
              <div className="sobre-midia absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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

function BookCarousel({
  slug,
  title,
  books,
  destino,
}: {
  slug: string;
  title: string;
  books: Book[];
  /**
   * Para onde o "Ver tudo" leva. O padrão é a tela da coleção; as fileiras que
   * o acervo monta por gênero apontam para `/category/…`, que é a tela que sabe
   * mostrar um gênero inteiro. Sem isto elas caíam em "Coleção não encontrada".
   */
  destino?: string;
}) {
  const [, setLocation] = useLocation();

  // Fileira sem livro não se desenha. Título com "Ver tudo" e nada embaixo é
  // pior do que a ausência: promete conteúdo e leva a uma tela vazia.
  if (books.length === 0) return null;

  return (
    <section className="py-2 space-y-3" data-testid={`carousel-${slug}`}>
      <div className="flex items-center justify-between px-4">
        <h2 className="font-display font-bold text-xl text-white">{title}</h2>
        <button
          onClick={() => setLocation(destino ?? `/collection/${slug}`)}
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
  /**
   * Catálogo inteiro vazio — o app acabou de ser aberto sem um livro sequer.
   *
   * Com as guardas acima, o que sobraria na tela seria a barra "Categorias", um
   * título de fileira e o rodapé: esqueleto. Aqui a Início vira o que o AllBook
   * tem a oferecer mesmo sem acervo — a porta do pedido (§4.134).
   */
  if (catalog.length === 0) {
    return (
      <div className="min-h-screen bg-background" data-testid="page-home">
        <CatalogoVazio />
      </div>
    );
  }

  return (
    // Sem `pb-24` desde §4.104: ele somava com o `pb-20` do App e a tela
    // terminava num vão morto. Quem fecha a rolagem agora é o <FimDaLista />.
    <div className="min-h-screen bg-background" data-testid="page-home">
      <HeroBillboard />

      {/*
        Nada de faixa entre o billboard e o corpo da página (26/07, ROTEIRO 4.18).
        A chamada de "peça um livro" morou aqui por um tempo, para o diferencial
        do app aparecer sem rolagem — mas o lugar era ruim por natureza: o
        billboard termina num degradê que se dissolve no fundo, e qualquer
        retângulo encostado ali corta esse degradê no meio. Nas palavras do
        Matheus: *"como estava antigamente, no único degradê, ficava mais
        bonito"*. A porta do pedido foi para o **menu de baixo**, onde aparece em
        toda tela do app em vez de só nesta.
      */}
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

        {/* As fileiras que o acervo monta sozinho. Vêm depois das curadas de
            propósito: curadoria, quando existe, vale mais que contagem. */}
        {fileirasPorGenero.map((fileira) => (
          <BookCarousel
            key={`genero-${fileira.slug}`}
            slug={`genero-${fileira.slug}`}
            title={fileira.label}
            books={fileira.books}
            destino={`/category/${fileira.slug}`}
          />
        ))}
        <FimDaLista />
      </div>
    </div>
  );
}
