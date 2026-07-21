import { ArrowLeft, Share2, Play, Star, ChevronRight, Download, MoreVertical, Mic, BookOpen, Quote, User, Check, Library as LibraryIcon, Plus, Clock, Headphones } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { catalog, findGenreBySlug, slugify } from "@/lib/books";
import { findPerson } from "@/lib/people";
import PersonAvatar from "@/components/PersonAvatar";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import coverScifi from "@/assets/images/cover-scifi.png";
import coverSelfhelp from "@/assets/images/cover-selfhelp.png";
import coverRomance from "@/assets/images/cover-romance.png";
import coverMystery from "@/assets/images/cover-mystery.png";
import coverBusiness from "@/assets/images/cover-business.png";
import coverBiography from "@/assets/images/cover-biography.png";
import coverHorror from "@/assets/images/cover-horror.png";
import coverProductivity from "@/assets/images/cover-productivity.png";

const bookData: Record<string, any> = {
  "1": {
    title: "O massacre da família Hope",
    author: "Riley Sager",
    duration: "12h 45min",
    rating: 4.5,
    reviewsCount: 128,
    genre: "Mistério",
    summary: "Setenta anos atrás, a mansão Hope foi palco de um crime brutal que chocou a pacata cidade litorânea. Agora, Kit McDeere é contratada como cuidadora de Lenora Hope, a única sobrevivente do massacre, que nunca falou sobre aquela noite. Em uma casa caindo aos pedaços, Kit descobre que os segredos da família Hope são muito mais profundos e perigosos do que qualquer um poderia imaginar.",
    cover: coverMystery,
    performance: 4.8,
    story: 4.3,
    comments: [
      { user: "Ana Paula", rating: 5, text: "Suspense do início ao fim! A narração traz um peso incrível para a história." },
      { user: "Marcos V.", rating: 4, text: "Reviravoltas inesperadas. Um dos melhores que ouvi este ano." }
    ]
  },
  "5": {
    title: "Organize-se",
    author: "Ciara Conlon",
    duration: "4h 42min",
    rating: 4.3,
    reviewsCount: 116,
    genre: "Produtividade",
    summary: "Neste guia prático, Ciara Conlon apresenta técnicas essenciais para retomar o controle de sua vida e carreira. Aprenda a eliminar distrações, priorizar o que realmente importa e criar sistemas de organização que funcionam no longo prazo. Um audiolivro indispensável para quem busca fazer mais em menos tempo sem sacrificar o bem-estar mental.",
    cover: coverSelfhelp,
    performance: 4.5,
    story: 4.1,
    comments: [
      { user: "Ricardo", rating: 5, text: "Dicas muito práticas que comecei a aplicar no mesmo dia. Recomendo!" },
      { user: "Juliana S.", rating: 4, text: "A voz da narradora é muito calmante e o conteúdo é bem estruturado." }
    ]
  },
  "101": {
    title: "A Psicologia Financeira",
    author: "Morgan Housel",
    duration: "8h 12min",
    rating: 4.8,
    reviewsCount: 342,
    genre: "Negócios",
    summary: "O sucesso financeiro tem menos a ver com a sua inteligência e muito mais com o seu comportamento. Morgan Housel compartilha 19 histórias curtas que exploram as formas estranhas como as pessoas pensam sobre o dinheiro e ensina como ter uma relação melhor com suas finanças, focando na liberdade e na paz de espírito em vez de apenas números.",
    cover: coverBusiness,
    performance: 4.9,
    story: 4.7,
    comments: [
      { user: "Felipe G.", rating: 5, text: "Mudou completamente minha visão sobre investimentos. Essencial." },
      { user: "Carla Lima", rating: 5, text: "Texto leve e profundo ao mesmo tempo. Excelente narração." }
    ]
  },
  "102": {
    title: "Hábitos Atômicos",
    author: "James Clear",
    duration: "9h 30min",
    rating: 4.9,
    reviewsCount: 856,
    genre: "Produtividade",
    summary: "Pequenas mudanças, resultados impressionantes. James Clear revela como transformações minúsculas no seu dia a dia podem levar a resultados gigantescos. Baseado em ciência biológica e psicológica, este audiolivro oferece um método comprovado para quebrar maus hábitos e construir rotinas positivas de forma automática.",
    cover: coverProductivity,
    performance: 4.9,
    story: 4.9,
    comments: [
      { user: "Beto", rating: 5, text: "O melhor livro sobre hábitos já escrito. Ponto final." },
      { user: "Luciana", rating: 5, text: "Prático, direto e transformador. Ouço repetidamente para fixar." }
    ]
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
  comments: [
    { user: "Usuário AllBook", rating: 5, text: "Excelente experiência auditiva!" }
  ]
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
 * Uma linha do menu "Mais". Fecha a folha ao ser tocada — menos quando está
 * desabilitada, porque aí nada aconteceu e fechar confundiria.
 */
function AcaoDoMenu({
  icone: Icone,
  rotulo,
  aoClicar,
  desabilitado = false,
}: {
  icone: React.ComponentType<{ className?: string }>;
  rotulo: string;
  aoClicar: () => void;
  desabilitado?: boolean;
}) {
  const botao = (
    <button
      type="button"
      onClick={aoClicar}
      disabled={desabilitado}
      className="flex w-full items-center gap-4 rounded-xl px-3 py-3.5 text-left text-[15px] text-white transition-colors hover:bg-white/5 active:bg-white/10 disabled:opacity-40"
      data-testid={`menu-action-${rotulo}`}
    >
      <Icone className="h-5 w-5 shrink-0 text-white/60" />
      {rotulo}
    </button>
  );

  return desabilitado ? botao : <DrawerClose asChild>{botao}</DrawerClose>;
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
    summary: `"${entry.title}", de ${entry.author}. A ficha completa deste título ainda está sendo preparada — em breve com resumo, narração e avaliações.`,
  };
}

export default function BookDetails({ params }: { params: { id: string } }) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const library = JSON.parse(localStorage.getItem("allbook_library") || "[]");
    setIsAdded(library.some((b: any) => b.id === params.id));
  }, [params.id]);

  /**
   * A base vem sempre do catálogo, e a ficha detalhada entra por cima só com o
   * que ela acrescenta (resumo, duração, comentários). Antes a ficha substituía
   * tudo, e por isso o narrador dela podia discordar do catálogo — o que
   * quebraria o link para o perfil do narrador.
   */
  const book = { ...buildFromCatalog(params.id), ...(bookData[params.id] ?? {}) };

  // Só entram no menu os atalhos que levam a algum lugar de verdade: um livro
  // fora do catálogo não tem autor, narrador nem categoria para onde ir.
  const autorDoLivro = findPerson(slugify(book.author));
  const narradorDoLivro = findPerson(slugify(book.narrator));
  const generoDoLivro = findGenreBySlug(slugify(book.genre));

  const [chapters] = useState(() => {
    const count = 8 + Math.floor(Math.random() * 7);
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      title: `Capítulo ${i + 1}`,
      duration: `${Math.floor(Math.random() * 20) + 10}min`
    }));
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloaded, setIsDownloaded] = useState(() => {
    const downloads = JSON.parse(localStorage.getItem("allbook_downloads") || "[]");
    return downloads.includes(params.id);
  });

  /**
   * `navigator.share` abre a folha de compartilhamento nativa, mas só existe em
   * celular e em contexto seguro. No navegador do computador caímos para copiar
   * o link, que é o que dá para oferecer sem inventar uma tela de partilha.
   */
  const compartilhar = async () => {
    const url = `${window.location.origin}/book/${book.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: book.title,
          text: `${book.title}, de ${book.author}, no AllBook.`,
          url,
        });
      } catch {
        // A pessoa fechou a folha nativa. Não é erro, não avisa nada.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copiado", description: "Agora é só colar onde quiser." });
    } catch {
      toast({ title: "Não consegui copiar o link", description: url });
    }
  };

  const handleDownload = () => {
    if (isDownloaded || isDownloading) return;
    
    setIsDownloading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        setDownloadProgress(100);
        clearInterval(interval);
        
        const downloads = JSON.parse(localStorage.getItem("allbook_downloads") || "[]");
        if (!downloads.includes(params.id)) {
          downloads.push(params.id);
          localStorage.setItem("allbook_downloads", JSON.stringify(downloads));
        }
        
        setTimeout(() => {
          setIsDownloading(false);
          setIsDownloaded(true);
          toast({
            title: "Download Concluído",
            description: "Conteúdo criptografado e salvo no armazenamento seguro do app.",
          });
        }, 500);
      } else {
        setDownloadProgress(Math.floor(progress));
      }
    }, 400);
  };

  const addToLibrary = () => {
    const library = JSON.parse(localStorage.getItem("allbook_library") || "[]");
    if (!isAdded) {
      const newBook = {
        id: params.id,
        title: book.title,
        author: book.author,
        cover: book.cover,
        addedAt: new Date().toISOString()
      };
      localStorage.setItem("allbook_library", JSON.stringify([...library, newBook]));
      setIsAdded(true);
      toast({
        title: "Adicionado!",
        description: `${book.title} agora está na sua biblioteca.`,
      });
    } else {
      const filtered = library.filter((b: any) => b.id !== params.id);
      localStorage.setItem("allbook_library", JSON.stringify(filtered));
      setIsAdded(false);
      toast({
        title: "Removido",
        description: "O livro foi removido da sua biblioteca.",
      });
    }
  };

  const relatedBooks = [
    { id: '101', title: "A Psicologia Financeira", author: "Morgan Housel", duration: "8h 12m", rating: 4.8, reviews: 342 },
    { id: '102', title: "Hábitos Atômicos", author: "James Clear", duration: "9h 30m", rating: 4.9, reviews: 856, isExclusive: true },
    { id: '1', title: "O massacre da família Hope", author: "Riley Sager", duration: "12h 45m", rating: 4.5, reviews: 128 },
  ];

  return (
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="book-details-page">
      <div className="relative w-full h-[65vh] overflow-hidden">
        <img
          src={book.cover}
          alt={book.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/60 to-transparent" />

        <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4">
          <Link href="/">
            <button className="p-2.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:bg-black/60 transition-colors" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <button onClick={compartilhar} className="p-2.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:bg-black/60 transition-colors" data-testid="button-share">
            <Share2 className="w-5 h-5" />
          </button>
        </header>

        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
          <Badge className="bg-amber-500/90 text-black border-none px-3 py-1 text-[10px] uppercase font-bold tracking-wider" data-testid="badge-exclusive">
            AllBook Original
          </Badge>
          <h1 className="text-3xl font-bold font-display leading-tight drop-shadow-lg" data-testid="text-book-title">{book.title}</h1>
          <div className="flex items-center gap-3 text-sm text-white/70">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span className="font-semibold text-white">{book.rating}</span>
              <span>({book.reviewsCount})</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{book.duration}</span>
            </div>
            <span>•</span>
            <LinkDoGenero genero={book.genre} />
          </div>
        </div>
      </div>

      <main className="px-5 -mt-2 relative z-10 space-y-8">
        <div className="grid gap-2 py-2">
          <PessoaDoLivro papel="Escrito por" nome={book.author} testid="text-author" />
          <PessoaDoLivro papel="Narrado por" nome={book.narrator} testid="text-narrator" />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => setLocation(`/player/${book.id}`)}
            className="flex-1 h-12 bg-white text-black hover:bg-white/90 border-none rounded-lg text-base font-bold flex items-center justify-center gap-2"
            data-testid="button-play"
          >
            <Play className="w-5 h-5 fill-current" />
            Reproduzir
          </Button>

          <Button
            onClick={isAdded ? addToLibrary : addToLibrary}
            className={`h-12 px-5 rounded-lg border font-bold flex items-center justify-center gap-2 ${
              isAdded
                ? "bg-amber-500/20 border-amber-500/40 text-amber-500 hover:bg-amber-500/30"
                : "bg-white/10 border-white/20 text-white hover:bg-white/20"
            }`}
            data-testid="button-add-library"
          >
            {isAdded ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {isAdded ? "Na Lista" : "Minha Lista"}
          </Button>
        </div>

        <div className="flex gap-6 justify-center py-2">
          <button
            onClick={handleDownload}
            className="flex flex-col items-center gap-1.5 text-white/60 hover:text-white transition-colors"
            data-testid="button-download"
          >
            {isDownloading ? (
              <div className="w-6 h-6 relative">
                <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.2" />
                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeDasharray={`${downloadProgress * 0.628} 62.8`} />
                </svg>
              </div>
            ) : (
              <Download className={`w-6 h-6 ${isDownloaded ? 'text-amber-500' : ''}`} />
            )}
            <span className="text-[10px] uppercase tracking-wider font-medium">
              {isDownloaded ? "Baixado" : isDownloading ? `${downloadProgress}%` : "Baixar"}
            </span>
          </button>
          <Drawer>
            <DrawerTrigger asChild>
              <button className="flex flex-col items-center gap-1.5 text-white/60 hover:text-white transition-colors" data-testid="button-more-options">
                <MoreVertical className="w-6 h-6" />
                <span className="text-[10px] uppercase tracking-wider font-medium">Mais</span>
              </button>
            </DrawerTrigger>

            {/*
              A folha é desenhada num portal, fora da moldura de celular da
              prévia, então sem limite ela ocuparia a largura toda da janela. O
              teto de 480px não afeta celular nenhum (o mais largo tem 440px) e
              deixa a folha centrada em telas grandes.
            */}
            <DrawerContent className="mx-auto max-w-[480px] border-white/10 bg-[#1a1a1a]">
              <DrawerHeader className="text-left">
                <DrawerTitle className="font-display tracking-tight text-white">
                  {book.title}
                </DrawerTitle>
                <DrawerDescription className="text-white/50">
                  {book.author} • {book.duration}
                </DrawerDescription>
              </DrawerHeader>

              <div className="space-y-0.5 px-4 pb-8">
                <AcaoDoMenu
                  icone={Play}
                  rotulo="Ouvir agora"
                  aoClicar={() => setLocation(`/player/${book.id}`)}
                />
                <AcaoDoMenu
                  icone={isAdded ? Check : Plus}
                  rotulo={isAdded ? "Já está na Minha Lista" : "Adicionar à Minha Lista"}
                  aoClicar={addToLibrary}
                  desabilitado={isAdded}
                />
                <AcaoDoMenu
                  icone={Download}
                  rotulo={isDownloaded ? "Já baixado" : "Baixar para ouvir offline"}
                  aoClicar={handleDownload}
                  desabilitado={isDownloaded || isDownloading}
                />
                <AcaoDoMenu icone={Share2} rotulo="Compartilhar" aoClicar={compartilhar} />

                <div className="my-2 h-px bg-white/10" />

                {autorDoLivro && (
                  <AcaoDoMenu
                    icone={User}
                    rotulo={`Ver perfil de ${book.author}`}
                    aoClicar={() => setLocation(`/person/${autorDoLivro.slug}`)}
                  />
                )}
                {narradorDoLivro && (
                  <AcaoDoMenu
                    icone={Mic}
                    rotulo={`Ver perfil de ${book.narrator}`}
                    aoClicar={() => setLocation(`/person/${narradorDoLivro.slug}`)}
                  />
                )}
                {generoDoLivro && (
                  <AcaoDoMenu
                    icone={LibraryIcon}
                    rotulo={`Ver mais de ${generoDoLivro}`}
                    aoClicar={() => setLocation(`/category/${slugify(generoDoLivro)}`)}
                  />
                )}
              </div>
            </DrawerContent>
          </Drawer>
        </div>

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
            {chapters.slice(0, 5).map((ch) => (
              <div key={ch.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-none" data-testid={`row-chapter-${ch.id}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <span className="text-white/40 font-mono text-xs">{ch.id.toString().padStart(2, '0')}</span>
                  </div>
                  <span className="text-sm font-medium">{ch.title}</span>
                </div>
                <span className="text-xs text-white/40">{ch.duration}</span>
              </div>
            ))}
            {chapters.length > 5 && (
              <button className="w-full p-3 text-center text-xs font-bold text-amber-500 hover:bg-white/5 transition-colors" data-testid="button-show-all-chapters">
                Ver todos os {chapters.length} capítulos
              </button>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-lg font-bold font-display" data-testid="heading-reviews">O que as pessoas dizem</h2>
          <div className="flex items-center gap-6 py-4 px-6 rounded-xl bg-white/5 border border-white/5">
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Headphones className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-xl">{book.performance}</span>
              </div>
              <span className="text-[10px] text-white/40 uppercase tracking-wider">Narração</span>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-xl">{book.story}</span>
              </div>
              <span className="text-[10px] text-white/40 uppercase tracking-wider">História</span>
            </div>
          </div>

          <div className="space-y-3">
            {book.comments.map((comment: any, idx: number) => (
              <div key={idx} className="bg-white/5 p-4 rounded-xl space-y-3 border border-white/5" data-testid={`card-review-${idx}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-600/30 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <span className="text-sm font-bold">{comment.user}</span>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-2.5 h-2.5 ${i < comment.rating ? 'fill-amber-500 text-amber-500' : 'text-white/20'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-white/70 leading-relaxed italic">"{comment.text}"</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 pb-10">
          <h2 className="text-lg font-bold font-display" data-testid="heading-related">Você também pode gostar</h2>
          <div className="flex overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide snap-x snap-mandatory gap-3">
            {relatedBooks.map((item) => (
              <Link key={item.id} href={`/book/${item.id}`}>
                <div className="min-w-[130px] snap-start space-y-2 cursor-pointer group" data-testid={`card-related-${item.id}`}>
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-lg border border-white/5 transition-transform group-hover:scale-105 duration-300">
                    <img src={coverData[item.id as keyof typeof coverData] || coverScifi} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {item.isExclusive && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-amber-500 text-black border-none text-[8px] px-1.5 py-0.5 font-bold uppercase">
                          Exclusivo
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold truncate group-hover:text-amber-500 transition-colors">{item.title}</h4>
                    <p className="text-[10px] text-white/40 truncate">{item.author}</p>
                    <div className="flex items-center gap-1 text-[10px] text-white/30">
                      <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                      <span>{item.rating}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

const coverData = {
  "1": coverMystery,
  "5": coverSelfhelp,
  "101": coverBusiness,
  "102": coverProductivity
};
