import { ArrowLeft, Play, Star, ChevronRight, MoreVertical, BookOpen, BookMarked, Check, Plus, Clock, Headphones, AudioLines } from "lucide-react";
import BookActionsMenu from "@/components/BookActionsMenu";
import MarcacoesDoLivro from "@/components/MarcacoesDoLivro";
import { BOOKMARK_EVENT, bookmarksFor, type Bookmark } from "@/lib/bookmarks";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  catalog,
  findGenreBySlug,
  getBooksByGenre,
  slugify,
  duracaoEstimada,
  notaHistoria,
  notaNarracao,
} from "@/lib/books";
import { findPerson } from "@/lib/people";
import { publisherOfBook } from "@/lib/publishers";
import { STUDIO_NAME, narratorKind } from "@/lib/studio";
import PublisherMark from "@/components/PublisherMark";
import FalasDoLivro from "@/components/FalasDoLivro";
import PresencaNoLivro from "@/components/PresencaNoLivro";
import AvaliacoesDoLivro from "@/components/AvaliacoesDoLivro";
import FaixaDoClubeNoLivro from "@/components/clube/FaixaDoClubeNoLivro";
import AvaliarLivro from "@/components/AvaliarLivro";
import SeletorDeNarracao from "@/components/SeletorDeNarracao";
import { NARRATIONS_EVENT, chosenNarration } from "@/lib/narrations";
import { notaDaComunidade, MINIMO_PARA_MEDIA, RATINGS_EVENT } from "@/lib/ratings";
import PersonAvatar from "@/components/PersonAvatar";
import { motion } from "framer-motion";
import { getChapters, chaptersTotalSec, chapterStartSec, formatChapterDuration, formatBookDuration } from "@/lib/chapters";
import { readPlaybackList, playbackPercent, remainingLabel, savePlaying, type Playback } from "@/lib/playback";
import {
  addToLibrary as salvarNaBiblioteca,
  isInLibrary,
  removeFromLibrary,
} from "@/lib/library";

import coverScifi from "@/assets/images/cover-scifi.png";

/**
 * Ficha curada à mão de alguns livros. Só o que o catálogo NÃO sabe entra aqui
 * (resumo revisado, duração oficial, notas de narração/história). Título,
 * autor, capa, nota e gênero vêm sempre do catálogo — quando a ficha também os
 * trazia, ela cobria a capa real baixada com a genérica do gênero.
 */
const bookData: Record<string, any> = {
  "1": {
    duration: "12h 45min",
    reviewsCount: 128,
    summary: "Setenta anos atrás, a mansão Hope foi palco de um crime brutal que chocou a pacata cidade litorânea. Agora, Kit McDeere é contratada como cuidadora de Lenora Hope, a única sobrevivente do massacre, que nunca falou sobre aquela noite. Em uma casa caindo aos pedaços, Kit descobre que os segredos da família Hope são muito mais profundos e perigosos do que qualquer um poderia imaginar.",
  },
  "5": {
    duration: "4h 42min",
    reviewsCount: 116,
    summary: "Neste guia prático, Ciara Conlon apresenta técnicas essenciais para retomar o controle de sua vida e carreira. Aprenda a eliminar distrações, priorizar o que realmente importa e criar sistemas de organização que funcionam no longo prazo. Um audiolivro indispensável para quem busca fazer mais em menos tempo sem sacrificar o bem-estar mental.",
  },
  "101": {
    duration: "8h 12min",
    reviewsCount: 342,
    summary: "O sucesso financeiro tem menos a ver com a sua inteligência e muito mais com o seu comportamento. Morgan Housel compartilha 19 histórias curtas que exploram as formas estranhas como as pessoas pensam sobre o dinheiro e ensina como ter uma relação melhor com suas finanças, focando na liberdade e na paz de espírito em vez de apenas números.",
  },
  "102": {
    duration: "9h 30min",
    reviewsCount: 856,
    summary: "Pequenas mudanças, resultados impressionantes. James Clear revela como transformações minúsculas no seu dia a dia podem levar a resultados gigantescos. Baseado em ciência biológica e psicológica, este audiolivro oferece um método comprovado para quebrar maus hábitos e construir rotinas positivas de forma automática.",
  }
};

const defaultBook = {
  title: "Título do Livro",
  author: "Autor Desconhecido",
  narrator: "Narrador Padrão",
  duration: "5h 00m",
  rating: 4.5,
  reviewsCount: 10,
  genre: "Geral",
  summary: "Este é um resumo fictício para este audiolivro incrível que você está prestes a descobrir no AllBook. Uma jornada emocionante cheia de aprendizado e entretenimento.",
  cover: coverScifi,
  performance: 4.5,
  story: 4.5,
};

/**
 * Livros sem ficha detalhada em `bookData` caem aqui. Em vez de mostrar
 * "Título do Livro", puxamos do catálogo central o que ele sabe (título, autor,
 * capa, nota, gênero) e completamos o resto com o padrão. Só um id que não
 * existe em lugar nenhum cai no `defaultBook` puro.
 */
/**
 * Autor ou narrador do livro, levando ao perfil da pessoa.
 *
 * Quem não está no catálogo — o "Autor Desconhecido" de um id inexistente, por
 * exemplo — não tem perfil, e aí o bloco aparece sem ser clicável em vez de
 * oferecer um link que levaria a lugar nenhum.
 */
function PessoaDoLivro({
  papel,
  nome,
  testid,
}: {
  papel: string;
  nome: string;
  testid: string;
}) {
  const [, navegar] = useLocation();
  const pessoa = findPerson(slugify(nome));

  const conteudo = (
    <>
      <PersonAvatar name={nome} photo={pessoa?.photo} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] uppercase tracking-widest text-white/40">{papel}</span>
        <span className="block truncate text-sm font-semibold text-white" data-testid={testid}>
          {nome}
        </span>
      </span>
    </>
  );

  if (!pessoa) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/5">
        {conteudo}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => navegar(`/person/${pessoa.slug}`)}
      aria-label={`Ver o perfil de ${nome}`}
      className="flex items-center gap-3 rounded-xl bg-white/5 p-3 text-left ring-1 ring-white/5 transition-colors hover:bg-white/10 active:bg-white/15"
      data-testid={`link-person-${pessoa.slug}`}
    >
      {conteudo}
      <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
    </button>
  );
}

/**
 * Quem produziu a narração — o quarto crédito da ficha.
 *
 * **Por que ele existe (decisão do Matheus, 25/07).** A editora publicou o
 * *livro*; ela não gravou o *áudio*. E na maioria dos títulos o audiolivro não
 * existia em lugar nenhum antes: foi o AllBook que o produziu. Sem esta linha, a
 * ficha creditava a produção a quem não a fez.
 *
 * **Não diz "IA" aqui, de propósito.** Que as vozes são sintéticas está dito no
 * `/studio` e no perfil de cada voz — uma vez, onde a pessoa foi procurar.
 * Carimbado em cada um dos 59 livros viraria advertência de bula.
 *
 * Some quando a narração for humana de verdade (`narratorKind === "human"`):
 * nesse caso o AllBook não produziu nada, e dizer que produziu seria falso.
 */
function EstudioDoLivro({ narrador }: { narrador: string }) {
  const [, navegar] = useLocation();

  if (narratorKind(narrador) !== "studio") return null;

  return (
    <button
      type="button"
      onClick={() => navegar("/studio")}
      aria-label={`Conhecer o ${STUDIO_NAME}`}
      className="flex items-center gap-3 rounded-xl bg-white/5 p-3 text-left ring-1 ring-white/5 transition-colors hover:bg-white/10 active:bg-white/15"
      data-testid="link-studio"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/15 ring-1 ring-primary/25">
        <AudioLines className="h-5 w-5 text-primary" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] uppercase tracking-widest text-white/40">
          Produzido por
        </span>
        <span className="block truncate text-sm font-semibold text-white" data-testid="text-studio">
          {STUDIO_NAME}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
    </button>
  );
}

/**
 * A editora do livro, levando ao perfil dela.
 *
 * Fica na mesma grade de "Escrito por" e "Narrado por" porque é a terceira
 * assinatura do audiolivro — antes o nome de quem publicou não aparecia em
 * lugar nenhum do app. O selo é quadrado, e não redondo como o das pessoas:
 * editora é marca, não gente (ver `PublisherMark`).
 *
 * Livro ainda sem editora atribuída simplesmente não mostra a linha, em vez de
 * mostrar um bloco vazio.
 */
function EditoraDoLivro({ bookId }: { bookId: number }) {
  const [, navegar] = useLocation();
  const editora = publisherOfBook(bookId);

  if (!editora) return null;

  return (
    <button
      type="button"
      onClick={() => navegar(`/publisher/${editora.slug}`)}
      aria-label={`Ver o perfil da editora ${editora.name}`}
      className="flex items-center gap-3 rounded-xl bg-white/5 p-3 text-left ring-1 ring-white/5 transition-colors hover:bg-white/10 active:bg-white/15"
      data-testid={`link-publisher-${editora.slug}`}
    >
      <PublisherMark name={editora.name} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] uppercase tracking-widest text-white/40">
          Publicado por
        </span>
        <span className="block truncate text-sm font-semibold text-white" data-testid="text-publisher">
          {editora.name}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
    </button>
  );
}

/**
 * O gênero do livro levando à tela da categoria.
 *
 * Um id fora do catálogo cai no gênero "Geral", que não é uma categoria de
 * verdade — nesse caso o texto aparece sem virar link, para não prometer uma
 * tela que não existe.
 */
function LinkDoGenero({ genero }: { genero: string }) {
  const [, navegar] = useLocation();
  const slug = slugify(genero);

  if (!findGenreBySlug(slug)) {
    return <span>{genero}</span>;
  }

  return (
    <button
      type="button"
      onClick={() => navegar(`/category/${slug}`)}
      className="flex items-center gap-0.5 font-medium text-primary transition-colors hover:text-primary/80"
      data-testid="link-genre"
    >
      {genero}
      <ChevronRight className="h-3 w-3" />
    </button>
  );
}

/**
 * A linha que diz **de onde vêm** as duas notas do cartão acima.
 *
 * Sem ela o app deixaria a pessoa supor que aquilo é a média dos ouvintes — e
 * hoje não é: é a nota curada do catálogo. A troca só acontece quando houver
 * `MINIMO_PARA_MEDIA` avaliações, e aí a contagem aparece junto, porque é o
 * número de avaliações que permite julgar o peso da média.
 */
function OrigemDaNota({ bookId }: { bookId: number }) {
  const [dados, setDados] = useState(() => notaDaComunidade(bookId));

  useEffect(() => {
    function atualizar() {
      setDados(notaDaComunidade(bookId));
    }
    atualizar();
    window.addEventListener(RATINGS_EVENT, atualizar);
    return () => window.removeEventListener(RATINGS_EVENT, atualizar);
  }, [bookId]);

  if (dados.suficiente) {
    return (
      <p className="-mt-4 text-[11px] text-white/40" data-testid="rating-origin">
        Nota dos ouvintes:{" "}
        <span className="font-semibold text-white/70">{dados.media.toFixed(1)}</span> ·{" "}
        {dados.total} avaliações
      </p>
    );
  }

  return (
    <p className="-mt-4 text-[11px] text-white/30" data-testid="rating-origin">
      Notas do catálogo AllBook. A nota dos ouvintes aparece a partir de{" "}
      {MINIMO_PARA_MEDIA} avaliações
      {dados.total > 0 && ` — já são ${dados.total}`}.
    </p>
  );
}

function buildFromCatalog(id: string) {
  const entry = catalog.find((b) => String(b.id) === id);
  if (!entry) return { ...defaultBook, id };

  return {
    ...defaultBook,
    id,
    title: entry.title,
    author: entry.author,
    narrator: entry.narrator,
    cover: entry.cover,
    rating: entry.rating,
    genre: entry.genre,
    // As duas notas separadas saem do catálogo (fonte única). Livro sem ficha
    // curada não tem as duas, e os ajudantes caem no `rating` — repetir um
    // número verdadeiro é melhor do que estampar dois inventados.
    story: notaHistoria(entry),
    performance: notaNarracao(entry),
    // A sinopse curada em PT-BR vence a importada (§4.104): a da Open Library
    // vem em inglês e virou reserva de livro que ainda não ganhou a sua. Sem
    // nenhuma das duas, um texto que assume a falta em vez de fingir resumo.
    summary:
      entry.sinopse ??
      entry.synopsis ??
      `"${entry.title}", de ${entry.author}. A sinopse deste título ainda não foi importada.`,
    duration: duracaoEstimada(entry.pages) ?? defaultBook.duration,
  };
}

export default function BookDetails({ params }: { params: { id: string } }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    // A lista mora em lib/library.ts — a mesma fonte da Biblioteca e do Perfil.
    setIsAdded(isInLibrary(Number(params.id)));
  }, [params.id]);

  /**
   * A base vem sempre do catálogo, e a ficha detalhada entra por cima só com o
   * que ela acrescenta (resumo, duração, comentários). Antes a ficha substituía
   * tudo, e por isso o narrador dela podia discordar do catálogo — o que
   * quebraria o link para o perfil do narrador.
   */
  const book = { ...buildFromCatalog(params.id), ...(bookData[params.id] ?? {}) };

  /**
   * A narração que vale agora — um livro pode ter mais de uma voz (ROTEIRO 4.30).
   * Sem escolha guardada, é a do catálogo, então a ficha de quem nunca trocou
   * nada continua idêntica.
   */
  const [narracao, setNarracao] = useState(() =>
    chosenNarration({ id: Number(params.id), narrator: book.narrator }),
  );

  useEffect(() => {
    const sincronizar = () =>
      setNarracao(chosenNarration({ id: Number(params.id), narrator: book.narrator }));
    sincronizar();
    window.addEventListener(NARRATIONS_EVENT, sincronizar);
    return () => window.removeEventListener(NARRATIONS_EVENT, sincronizar);
  }, [params.id, book.narrator]);

  /**
  /* As curtidas saíram daqui em 04/08 junto com a conversa (§4.87): quem
     desenha comentário nesta tela agora é a página `/book/:id/conversa`, e é lá
     que o estado de reação mora. Estado sem quem o use é código morto. */

  // A lista de capítulos agora é estável por livro (lib/chapters.ts), a mesma
  // que o player usa — assim "começar no capítulo X" leva ao capítulo certo.
  const chapters = getChapters(Number(params.id));

  // A duração mostrada vem da soma dos capítulos, para bater exatamente com a
  // barra de progresso (a % é medida contra ela). Antes o cabeçalho usava um
  // valor à mão que não conversava com os capítulos.
  const duracaoLivro = formatBookDuration(chaptersTotalSec(Number(params.id)));

  // Onde a pessoa parou neste livro (se já começou). Alimenta o cartão de
  // progresso no topo e o destaque do capítulo atual na lista.
  const [progresso, setProgresso] = useState<Playback | null>(null);
  const [showAllChapters, setShowAllChapters] = useState(false);
  const [marcacoes, setMarcacoes] = useState<Bookmark[]>([]);
  const [verMarcacoes, setVerMarcacoes] = useState(false);

  useEffect(() => {
    const encontrado = readPlaybackList().find((p) => p.bookId === Number(params.id));
    setProgresso(encontrado ?? null);
  }, [params.id]);

  // As marcações deste livro. Relê a cada escrita para o painel e o cartão
  // concordarem quando a pessoa apaga uma nota sem sair da ficha.
  useEffect(() => {
    const atualizar = () => setMarcacoes(bookmarksFor(Number(params.id)));
    atualizar();
    window.addEventListener(BOOKMARK_EVENT, atualizar);
    return () => window.removeEventListener(BOOKMARK_EVENT, atualizar);
  }, [params.id]);

  const marcacoesComNota = marcacoes.filter((item) => item.note.trim().length > 0).length;

  /** "1:12:40" — o relógio do ponto marcado, no mesmo formato do tocador. */
  const formatarPonto = (segundos: number) => {
    const total = Math.floor(Math.abs(segundos));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };


  const addToLibrary = () => {
    if (!isAdded) {
      salvarNaBiblioteca(Number(params.id));
      setIsAdded(true);
      toast({
        title: "Adicionado!",
        description: `${book.title} agora está na sua biblioteca.`,
      });
    } else {
      removeFromLibrary(Number(params.id));
      setIsAdded(false);
      toast({
        title: "Removido",
        description: "O livro foi removido da sua biblioteca.",
      });
    }
  };

  /**
   * "Você também pode gostar": livros do mesmo gênero, tirando o próprio livro
   * aberto. Antes era uma lista fixa de 3 títulos, igual em toda página — e que
   * incluía o próprio livro que a pessoa estava vendo.
   */
  const relatedBooks = getBooksByGenre(book.genre)
    .filter((entry) => String(entry.id) !== params.id)
    .slice(0, 6);

  // Id que não existe no catálogo: tela de "não encontrado" em vez de uma
  // ficha falsa ("Título do Livro / Autor Desconhecido").
  if (!catalog.some((entry) => String(entry.id) === params.id)) {
    return (
      <div
        className="min-h-screen bg-background text-white flex flex-col items-center justify-center gap-4 px-6 text-center"
        data-testid="book-not-found"
      >
        <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-white/20" />
        </div>
        <h1 className="text-xl font-bold font-display">Livro não encontrado</h1>
        <p className="text-sm text-white/50 max-w-xs">
          Este título não está no catálogo — o link pode estar errado.
        </p>
        <Button
          onClick={() => setLocation("/search")}
          className="mt-2 bg-white text-black hover:bg-white/90 font-bold"
          data-testid="button-back-to-search"
        >
          Explorar o catálogo
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-background text-white" data-testid="book-details-page">
      <div className="relative w-full h-[65vh] overflow-hidden">
        <img
          src={book.cover}
          alt={book.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />

        <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4">
          {/*
            Voltar pelo histórico, não para um destino fixo: quem chegou aqui
            pelo perfil de um leitor volta ao perfil, quem veio da Início volta à
            Início. O `href="/"` fixo daqui fazia o botão sempre cair na Início.
          */}
          <button
            onClick={() => (window.history.length > 1 ? window.history.back() : setLocation("/"))}
            className="p-2.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:bg-black/60 transition-colors"
            aria-label="Voltar"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          {/*
            Os três pontinhos ficam aqui em cima, onde Netflix e Spotify os
            põem. Antes o "Mais" dividia uma fileira no meio da tela com um
            botão "Baixar" solto — e baixar já era uma das opções de dentro do
            menu, então a fileira repetia o que o menu oferecia. Compartilhar,
            que ocupava este canto, também está lá dentro.
          */}
          <BookActionsMenu bookId={book.id} legenda={`${book.author} • ${duracaoLivro}`}>
            <button
              className="p-2.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:bg-black/60 transition-colors"
              aria-label="Mais opções"
              data-testid="button-more-options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </BookActionsMenu>
        </header>

        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
          <Badge className="bg-primary/90 text-black border-none px-3 py-1 text-[10px] uppercase font-bold tracking-wider" data-testid="badge-exclusive">
            AllBook Original
          </Badge>
          <h1 className="text-3xl font-bold font-display leading-tight drop-shadow-lg" data-testid="text-book-title">{book.title}</h1>
          <div className="flex items-center gap-3 text-sm text-white/70">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-primary text-primary" />
              <span className="font-semibold text-white">{book.rating}</span>
              <span>({book.reviewsCount})</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{duracaoLivro}</span>
            </div>
            <span>•</span>
            <LinkDoGenero genero={book.genre} />
          </div>
        </div>
      </div>

      <main className="px-5 -mt-2 relative z-10 space-y-8">
        {/*
          "Narrado por" mostra a narração **escolhida**, não a do catálogo: com
          duas vozes para a mesma obra, o nome tem de acompanhar a troca (ver
          ROTEIRO 4.30). O seletor vem logo abaixo e só existe quando há escolha.
        */}
        <div className="grid gap-2 py-2">
          <PessoaDoLivro papel="Escrito por" nome={book.author} testid="text-author" />
          <PessoaDoLivro papel="Narrado por" nome={narracao.name} testid="text-narrator" />
          <SeletorDeNarracao book={{ id: book.id, narrator: book.narrator }} />
          <EditoraDoLivro bookId={Number(params.id)} />
          <EstudioDoLivro narrador={narracao.name} />
        </div>

        <div className="flex gap-3">
          <Button
            /* Quem aperta "Reproduzir" está mandando tocar — mesmo que tenha
               pausado a barrinha antes. O player lê esta bandeira ao abrir. */
            onClick={() => { savePlaying(true); setLocation(`/player/${book.id}`); }}
            className="flex-1 h-12 bg-white text-black hover:bg-white/90 border-none rounded-lg text-base font-bold flex items-center justify-center gap-2"
            data-testid="button-play"
          >
            <Play className="w-5 h-5 fill-current" />
            {progresso ? "Continuar" : "Reproduzir"}
          </Button>

          <Button
            onClick={isAdded ? addToLibrary : addToLibrary}
            className={`h-12 px-5 rounded-lg border font-bold flex items-center justify-center gap-2 ${
              isAdded
                ? "bg-primary/20 border-primary/40 text-primary hover:bg-primary/30"
                : "bg-white/10 border-white/20 text-white hover:bg-white/20"
            }`}
            data-testid="button-add-library"
          >
            {isAdded ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {isAdded ? "Na lista" : "Minha lista"}
          </Button>
        </div>

        {/*
          Cartão de progresso: só aparece quando o livro já foi começado. A
          barra usa a cor da marca e cresce até a porcentagem ao abrir a tela,
          com um brilho suave passando por cima — animação contida, no padrão.
        */}
        {progresso && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-2.5 rounded-xl border border-white/10 bg-white/5 p-4"
            data-testid="progress-card"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-semibold text-white">
                <Headphones className="h-4 w-4 text-primary" />
                Capítulo {progresso.chapter} • {Math.round(playbackPercent(progresso))}% ouvido
              </span>
              <span className="text-xs text-white/50">{remainingLabel(progresso)}</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${playbackPercent(progresso)}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-primary to-primary"
              >
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-y-0 w-16 -skew-x-12 bg-white/30 blur-md"
                  animate={{ x: ["-40%", "300%"] }}
                  transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.2 }}
                />
              </motion.div>
            </div>
          </motion.div>
        )}

        {/*
          Os trechos que a pessoa guardou deste livro, logo abaixo do progresso.
          É o lugar certo: a ficha é onde se decide retomar, e até 26/07 as
          marcações só existiam dentro do player — quem quisesse rever uma nota
          tinha de abrir o tocador e caçar no menu. Só aparece se houver alguma.
        */}
        {marcacoes.length > 0 && (
          <button
            onClick={() => setVerMarcacoes(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-colors hover:bg-white/[0.08]"
            data-testid="button-book-bookmarks"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
              <BookMarked className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">
                {marcacoes.length} {marcacoes.length === 1 ? "nota sua" : "notas suas"}
              </span>
              <span className="block truncate text-xs text-white/50">
                {marcacoesComNota > 0
                  ? `${marcacoesComNota} com nota escrita`
                  : "Toque para rever os trechos guardados"}
              </span>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-white/30" />
          </button>
        )}

        <div className="space-y-3">
          <h2 className="text-lg font-bold font-display" data-testid="heading-summary">Resumo</h2>
          <p className="text-white/70 leading-relaxed text-sm" data-testid="text-summary">
            {book.summary}
          </p>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display" data-testid="heading-chapters">Capítulos</h2>
            <span className="text-sm text-white/40">{chapters.length} capítulos</span>
          </div>
          <div className="rounded-xl overflow-hidden bg-white/5 border border-white/5">
            {(showAllChapters ? chapters : chapters.slice(0, 5)).map((ch) => {
              const isCurrent = progresso?.chapter === ch.id;
              const posNoCap =
                isCurrent && progresso
                  ? Math.max(0, progresso.positionSec - chapterStartSec(Number(params.id), ch.id))
                  : 0;
              const pctNoCap = isCurrent ? Math.min(100, (posNoCap / ch.durationSec) * 100) : 0;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => { savePlaying(true); setLocation(`/player/${book.id}?chapter=${ch.id}`); }}
                  className={`group flex w-full items-center justify-between gap-3 border-b border-white/5 p-4 text-left transition-colors last:border-none ${
                    isCurrent ? "bg-primary/10" : "hover:bg-white/5"
                  }`}
                  data-testid={`row-chapter-${ch.id}`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                        isCurrent ? "bg-primary text-black" : "bg-white/5 text-white/40 group-hover:bg-white/10"
                      }`}
                    >
                      {isCurrent ? (
                        <Headphones className="h-4 w-4" />
                      ) : (
                        <>
                          <span className="font-mono text-xs group-hover:hidden">
                            {ch.id.toString().padStart(2, "0")}
                          </span>
                          <Play className="hidden h-3.5 w-3.5 fill-current group-hover:block" />
                        </>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-sm font-medium ${
                          isCurrent ? "text-primary" : "text-white"
                        }`}
                      >
                        {ch.title}
                      </span>
                      {isCurrent && (
                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pctNoCap}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full rounded-full bg-gradient-to-r from-primary to-primary"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-white/40">
                    {isCurrent ? "Tocando" : formatChapterDuration(ch.durationSec)}
                  </span>
                </button>
              );
            })}
            {chapters.length > 5 && (
              <button
                onClick={() => setShowAllChapters((v) => !v)}
                className="w-full p-3 text-center text-xs font-bold text-primary hover:bg-white/5 transition-colors"
                data-testid="button-show-all-chapters"
              >
                {showAllChapters ? "Ver menos" : `Ver todos os ${chapters.length} capítulos`}
              </button>
            )}
          </div>
        </section>

        {/*
          "O que as pessoas dizem" virou DUAS seções em 28/07 (ROTEIRO 4.41):
          **Avaliações** (o veredito sobre o livro inteiro — nota média, a sua
          nota e as resenhas com estrela) e **Conversa** (o papo de quem está
          dentro, com âncora e trava de spoiler). Era uma seção só, e resenha
          estrelada no meio do papo fazia as duas coisas parecerem a mesma.
        */}
        <section className="space-y-6">
          <h2 className="text-lg font-bold font-display" data-testid="heading-reviews">Avaliações</h2>
          <div className="flex items-center gap-6 py-4 px-6 rounded-xl bg-white/5 border border-white/5">
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Headphones className="w-4 h-4 text-primary" />
                <span className="font-bold text-xl">{book.performance}</span>
              </div>
              <span className="text-[10px] text-white/40 uppercase tracking-wider">Narração</span>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="font-bold text-xl">{book.story}</span>
              </div>
              <span className="text-[10px] text-white/40 uppercase tracking-wider">História</span>
            </div>
          </div>

          {/*
            De onde vêm esses dois números — dito na cara, e não subentendido.
            Enquanto a comunidade não junta `MINIMO_PARA_MEDIA` avaliações, as
            notas são as curadas do catálogo, e chamá-las de "nota dos ouvintes"
            seria promessa falsa (ROTEIRO 4.15). Com uma nota 1 solta contra
            duas boas, a média mentiria e derrubaria o livro.
          */}
          <OrigemDaNota bookId={Number(params.id)} />

          {/* A sua nota: o bloco existe sempre, mas antes dos 20% ouvidos ele é
              informação, não botão. A regra e o porquê estão no componente. */}
          <AvaliarLivro bookId={Number(params.id)} />

          {/* As resenhas escritas — só nota sem âncora, sem caixa de escrever
              e sem responder: os formulários não se cruzam (4.41). */}
          <AvaliacoesDoLivro bookId={Number(params.id)} />
        </section>

        <section className="space-y-6">
          {/*
            ⚠️ **A conversa saiu daqui em 04/08 (ROTEIRO §4.87) — não a traga de
            volta sem ler o porquê.** Ela era a `SalaDoLivro` inteira, logo abaixo
            das avaliações, e o Matheus achou o defeito: *"a conversa no livro,
            junto com os fóruns, pode se tornar muito parecida"*. O defeito estava
            à vista na tela — **uma lista de gente falando embaixo de outra lista
            de gente falando**, no mesmo formato e no mesmo lugar.

            A decisão foi **encolher, não apagar**: a conversa passou a viver onde
            só ela pode existir (o player, presa ao minuto), e aqui ficou o aviso
            de que ela existe + a porta (`FalasDoLivro`). O dado continua inteiro
            em `lib/comments.ts` — apagá-lo levaria junto **a nota dos livros**,
            que sai do mesmo arquivo (33 dos 51 registros têm `rating`).
          */}
          {/* Se algum clube está lendo este livro agora, o convite aparece
              aqui — a pessoa já está olhando o título (ROTEIRO 4.39). */}
          <FaixaDoClubeNoLivro bookId={Number(params.id)} />

          {/* **Quem está neste livro, por capítulo** (§4.58, item 8). Fica junto
              da conversa de propósito: as duas respondem à mesma pergunta —
              *quem mais está aqui dentro?* —, uma pela fala e outra pela
              posição. Some sozinha quando não há ninguém. */}
          <div className="-mx-5">
            <PresencaNoLivro bookId={Number(params.id)} />
          </div>

          <FalasDoLivro bookId={Number(params.id)} />
        </section>

        <section className="space-y-4 pb-10">
          <h2 className="text-lg font-bold font-display" data-testid="heading-related">Você também pode gostar</h2>
          <div className="flex overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide snap-x snap-mandatory gap-3">
            {relatedBooks.map((item) => (
              <Link key={item.id} href={`/book/${item.id}`}>
                <div className="min-w-[130px] snap-start space-y-2 cursor-pointer group" data-testid={`card-related-${item.id}`}>
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-lg border border-white/5 transition-transform group-hover:scale-105 duration-300">
                    <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold truncate group-hover:text-primary transition-colors">{item.title}</h4>
                    <p className="text-[10px] text-white/40 truncate">{item.author}</p>
                    <div className="flex items-center gap-1 text-[10px] text-white/30">
                      <Star className="w-2.5 h-2.5 fill-primary text-primary" />
                      <span>{item.rating}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/*
        O mesmo painel do tocador, reusado aqui — não uma segunda lista escrita
        de novo. Tocar numa marcação abre o player **no segundo exato** (`?t=`),
        que é o que a marcação guarda.
      */}
      <MarcacoesDoLivro
        aberto={verMarcacoes}
        onClose={() => setVerMarcacoes(false)}
        bookId={Number(params.id)}
        titulo={book.title}
        tituloDoCapitulo={(capitulo) =>
          chapters.find((ch) => ch.id === capitulo)?.title ?? `Capítulo ${capitulo}`
        }
        formatarTempo={formatarPonto}
        onIr={(positionSec) => { savePlaying(true); setLocation(`/player/${params.id}?t=${positionSec}`); }}
      />
    </div>
  );
}
