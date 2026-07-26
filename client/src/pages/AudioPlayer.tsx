import { ChevronDown, ChevronRight, Share2, MoreVertical, ListMusic, RotateCcw, RotateCw, SkipBack, SkipForward, Pause, Play, Timer, Bookmark, Car, Minus, Plus, BookOpen, CheckCircle, Settings, History, Search as SearchIcon } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useState, useEffect, useRef } from "react";
import BarraDeAcoesDoPlayer from "@/components/BarraDeAcoesDoPlayer";
import MarcacoesDoLivro from "@/components/MarcacoesDoLivro";
import HistoricoDoLivro from "@/components/HistoricoDoLivro";
import { ListaDeNarracoes } from "@/components/SeletorDeNarracao";
import { NARRATIONS_EVENT, chosenNarration, hasChoiceOfNarration } from "@/lib/narrations";
import { catalog } from "@/lib/books";
import AnotarMarcacao from "@/components/AnotarMarcacao";
// `Bookmark` já é o ícone do lucide aqui em cima — o tipo entra com outro nome.
import {
  addBookmark,
  BOOKMARK_EVENT,
  bookmarkCount,
  type Bookmark as Marcacao,
} from "@/lib/bookmarks";
import { readSettings } from "@/lib/settings";
import { readPlayback, savePlayback, showMiniPlayer } from "@/lib/playback";
import { getChapters, chaptersTotalSec, chapterStartSec, chapterAtSec, formatChapterDuration } from "@/lib/chapters";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function AudioPlayer({ params }: { params: { id: string } }) {
  // Id que não existe no catálogo: tela de "não encontrado" em vez de tocar
  // silenciosamente o primeiro livro do catálogo. `/player/current` é o atalho
  // da barrinha e continua caindo no último livro ouvido, mais abaixo.
  if (params.id !== "current" && !catalog.some((item) => item.id === Number(params.id))) {
    return (
      <div
        className="min-h-screen bg-[#141414] text-white flex flex-col items-center justify-center gap-4 px-6 text-center"
        data-testid="player-not-found"
      >
        <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-white/20" />
        </div>
        <h1 className="text-xl font-bold font-display">Livro não encontrado</h1>
        <p className="text-sm text-white/50 max-w-xs">
          Este título não está no catálogo — o link pode estar errado.
        </p>
        <Link
          href="/search"
          className="mt-2 px-6 py-2.5 bg-white text-black rounded-lg font-bold text-sm hover:bg-white/90 transition-colors"
          data-testid="link-back-to-search"
        >
          Explorar o catálogo
        </Link>
      </div>
    );
  }

  const [, setLocation] = useLocation();
  const [isPlaying, setIsPlaying] = useState(true);

  /**
   * Qual livro tocar.
   *
   * Antes isto era um objeto fixo com "Organize-se": abrir qualquer livro no
   * player mostrava sempre o mesmo título. Agora vem do catálogo pelo id da
   * rota. `/player/current` é o atalho antigo que a barrinha usava — continua
   * valendo e cai no último livro ouvido.
   */
  const book = (() => {
    const fromRoute = catalog.find((item) => item.id === Number(params.id));
    if (fromRoute) return fromRoute;
    const saved = readPlayback();
    const fromSaved = saved && catalog.find((item) => item.id === saved.bookId);
    return fromSaved || catalog[0];
  })();

  // Retoma de onde parou, mas só se for o mesmo livro.
  const savedForThisBook = (() => {
    const saved = readPlayback();
    return saved && saved.bookId === book.id ? saved : null;
  })();

  // Capítulos estáveis do livro e duração total (soma dos capítulos) — a mesma
  // fonte que a tela do livro usa, para os dois concordarem.
  const chapters = getChapters(book.id);
  const durationSeconds = chaptersTotalSec(book.id);

  /*
   * Abrir "/player/:id?chapter=N" começa naquele capítulo, e "?t=SEGUNDOS" num
   * ponto exato. O `t` nasceu com a tela "Minhas marcações" (26/07): mandar para
   * o começo do capítulo perderia justamente o que a marcação guarda — o
   * instante. `t` ganha do `chapter` quando os dois vêm juntos, por ser o mais
   * específico. Sem parâmetro, retoma de onde a pessoa parou.
   */
  const search = useSearch();
  const parametros = new URLSearchParams(search);
  const chapterParam = (() => {
    const n = Number(parametros.get("chapter"));
    return Number.isInteger(n) && n >= 1 && n <= chapters.length ? n : null;
  })();
  const timeParam = (() => {
    const n = Number(parametros.get("t"));
    return Number.isFinite(n) && n >= 0 ? Math.min(n, durationSeconds) : null;
  })();

  const initialPosition =
    timeParam ??
    (chapterParam ? chapterStartSec(book.id, chapterParam) : savedForThisBook?.positionSec ?? 0);

  const [currentTime, setCurrentTime] = useState(initialPosition);

  /**
   * O capítulo atual e a barra de progresso são do **capítulo**, não do livro
   * inteiro. Antes a barra era o livro todo (12h, 31h…) e o rótulo "Capítulo N"
   * não acompanhava quando se arrastava — dava a sensação de "pulou vários
   * capítulos". Agora tudo deriva da posição real: o capítulo é calculado dela,
   * e arrastar a barra move só dentro do capítulo atual (metade = metade do
   * capítulo). A visão do livro inteiro fica na lista de capítulos.
   */
  const currentChapter = chapterAtSec(book.id, currentTime);
  const chapterStart = chapterStartSec(book.id, currentChapter);
  const chapterDuration = chapters[currentChapter - 1]?.durationSec ?? durationSeconds;
  const positionInChapter = Math.min(Math.max(currentTime - chapterStart, 0), chapterDuration);
  const chapterProgress = (positionInChapter / chapterDuration) * 100;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => Math.min(prev + 1, durationSeconds));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, durationSeconds]);

  const formatTime = (seconds: number) => {
    const totalSeconds = Math.floor(Math.abs(seconds));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatRemaining = (totalSeconds: number, currentSeconds: number) => {
    const remaining = Math.max(0, totalSeconds - currentSeconds);
    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    const s = Math.floor(remaining % 60);
    
    if (h > 0) {
      return `${h}h ${m}m ${s}s restantes`;
    }
    return `${m}m ${s}s restantes`;
  };
  // Começa na velocidade escolhida em Configurações; mudar aqui vale só para
  // esta sessão de audição, sem alterar a preferência.
  const [speed, setSpeed] = useState(() => readSettings().speed);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [selectedTimer, setSelectedTimer] = useState("Desligado");
  const [showCustomTimer, setShowCustomTimer] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [customHours, setCustomHours] = useState("0");
  const [customMinutes, setCustomMinutes] = useState("0");
  const [isCarModeActive, setIsCarModeActive] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [showMarcacoes, setShowMarcacoes] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);
  /** A marcação recém-criada, enquanto a caixa de anotação está aberta. */
  const [anotando, setAnotando] = useState<Marcacao | null>(null);
  /** Se o áudio estava tocando quando a caixa abriu, para retomar ao fechar. */
  const estavaTocandoRef = useRef(false);
  /*
   * A gaveta de trocar de voz. É aqui, e não só na ficha, porque **é ouvindo que
   * a pessoa descobre que não gosta da narração** (ideia do Matheus, ROTEIRO
   * 4.30) — mandá-la voltar à ficha para trocar seria pedir que desistisse.
   */
  const [showNarracoes, setShowNarracoes] = useState(false);
  const [narracao, setNarracao] = useState(() => chosenNarration(book));
  const podeTrocarDeVoz = hasChoiceOfNarration(book);

  useEffect(() => {
    const sincronizar = () => setNarracao(chosenNarration(book));
    sincronizar();
    window.addEventListener(NARRATIONS_EVENT, sincronizar);
    return () => window.removeEventListener(NARRATIONS_EVENT, sincronizar);
  }, [book]);
  /*
   * Quantas marcações este livro tem. Fica no estado (e não numa leitura direta
   * a cada desenho) para o número na barra de baixo mudar na hora que a pessoa
   * salva ou apaga — o evento avisa, como no resto da casa.
   */
  const [totalDeMarcacoes, setTotalDeMarcacoes] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    showMiniPlayer();
  }, [book.id]);

  // A contagem de marcações do livro, sempre em dia: lida ao entrar e a cada
  // escrita (salvar no botão, apagar no painel).
  useEffect(() => {
    const atualizar = () => setTotalDeMarcacoes(bookmarkCount(book.id));
    atualizar();
    window.addEventListener(BOOKMARK_EVENT, atualizar);
    return () => window.removeEventListener(BOOKMARK_EVENT, atualizar);
  }, [book.id]);

  /**
   * Guarda onde a pessoa está.
   *
   * Escrever a cada segundo é desperdício — `localStorage` é síncrono e trava a
   * tela por um instante. Mas a primeira versão disto salvava só quando o
   * segundo era múltiplo de 5, e isso tinha um buraco: quem adianta 30 segundos
   * e pausa cai num número que nunca mais bate na conta, e a posição não era
   * gravada nunca. Agora a régua é a *distância* desde o último salvamento, que
   * funciona igual depois de pular, arrastar ou trocar de capítulo.
   *
   * O `return` do efeito salva ao sair do player — assim fechar a tela guarda a
   * posição exata, não a de até 5 segundos atrás.
   */
  const lastSavedRef = useRef(-Infinity);
  const stateRef = useRef({ bookId: book.id, chapter: currentChapter, positionSec: currentTime });
  stateRef.current = { bookId: book.id, chapter: currentChapter, positionSec: currentTime };

  useEffect(() => {
    if (Math.abs(currentTime - lastSavedRef.current) < 5) return;
    lastSavedRef.current = currentTime;
    savePlayback({ ...stateRef.current, durationSec: durationSeconds });
  }, [currentTime, durationSeconds]);

  useEffect(() => {
    return () => {
      savePlayback({ ...stateRef.current, durationSec: durationSeconds });
    };
  }, []);

  const goToChapter = (target: number) => {
    const clamped = Math.min(Math.max(target, 1), chapters.length);
    // Move a posição para o início do capítulo; o capítulo atual e a barra
    // derivam disso sozinhos.
    setCurrentTime(chapterStartSec(book.id, clamped));
  };

  const nextChapter = () => goToChapter(currentChapter + 1);
  const prevChapter = () => goToChapter(currentChapter - 1);

  /**
   * Compartilhar o livro. `navigator.share` abre a folha nativa no celular; no
   * computador cai para copiar o link. Mesma lógica do menu da tela do livro.
   */
  async function compartilhar() {
    const url = `${window.location.origin}/book/${book.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: book.title,
          text: `${book.title}, de ${book.author}, no AllBook.`,
          url,
        });
      } catch {
        // A pessoa fechou a folha nativa — não é erro.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copiado", description: "Agora é só colar onde quiser." });
    } catch {
      toast({ title: "Não consegui copiar o link", description: url });
    }
  }

  /**
   * Guarda o ponto — sem abrir nada. É o caminho do **Modo Carro**, onde não se
   * escreve: um toque, um aviso, e a pessoa continua dirigindo.
   */
  function salvarMarcacao(): boolean {
    const { jaExistia } = addBookmark(book.id, currentTime, currentChapter);
    toast({
      title: jaExistia ? "Este ponto já estava marcado" : "Marcação salva",
      description: jaExistia
        ? `Você já tinha guardado ${formatTime(currentTime)} deste título.`
        : `Guardamos ${formatTime(currentTime)}.`,
    });
    return !jaExistia;
  }

  /**
   * Marcar **e anotar na mesma ação** — o caminho normal, pela barra de baixo.
   *
   * O ponto é gravado primeiro e a caixa de nota abre por cima dele já salvo:
   * se a pessoa fechar sem escrever, a marcação fica. O contrário (só guardar ao
   * confirmar a nota) transformaria um toque numa tarefa, e quem ouve caminhando
   * perderia o trecho ao desistir de escrever.
   *
   * **Pausa enquanto a caixa está aberta** e retoma depois, se estava tocando:
   * escrever com o livro correndo faz perder justamente o trecho seguinte.
   */
  function marcarEAnotar(): boolean {
    const { bookmark, jaExistia } = addBookmark(book.id, currentTime, currentChapter);
    estavaTocandoRef.current = isPlaying;
    setIsPlaying(false);
    setAnotando(bookmark);
    return !jaExistia;
  }

  function fecharAnotacao() {
    setAnotando(null);
    if (estavaTocandoRef.current) setIsPlaying(true);
    estavaTocandoRef.current = false;
  }

  const adjustSpeed = (delta: number) => {
    setSpeed(prev => Math.max(0.5, Math.min(3.0, parseFloat((prev + delta).toFixed(2)))));
  };

  /*
   * **Um toque, e pronto** (26/07). Antes daqui até a tela grande havia três
   * caixas — nota de segurança, "conectar por Bluetooth?" e uma imitação do
   * diálogo de permissão do Android —, quatro toques repetidos a cada uso.
   *
   * Saíram todas, por decisão do Matheus. O motivo está no ROTEIRO 4.33: no
   * Audible o Bluetooth **não conecta nada** (quem conecta é o sistema do
   * celular); ele serve para o app **saber** que você entrou no carro e abrir o
   * modo carro sozinho — ou seja, existe para a pessoa **não** precisar tocar no
   * telefone. Aqui a cópia tinha invertido isso em pedágio, e o navegador não
   * tem nem como detectar essa conexão. O recado de segurança continua, na
   * frase do rodapé da própria tela.
   */
  const handleCarModeClick = () => {
    setIsCarModeActive(true);
  };

  const speedPresets = [0.7, 1.0, 1.2, 1.5, 1.7, 2.0];

  /*
   * O modo carro vinha com um degradê **verde para azul-marinho** (`#1a4d35` →
   * `#0a101f`), herdado do rascunho antigo: nenhuma das duas cores existe na
   * identidade do AllBook, e a tela parecia de outro aplicativo. Agora é o
   * preto da casa com o mesmo calor laranja que abre as telas.
   */
  if (isCarModeActive) {
    return (
      <div className="fixed inset-0 z-[200] bg-linear-to-b from-[#241a12] via-[#141414] to-[#141414] text-white flex flex-col p-6 animate-in fade-in duration-500">
        {/* O selo "Conectado ao Carro" com o ícone do Bluetooth saiu em 26/07:
            ele afirmava uma conexão que o app não faz nem consegue verificar
            (ROTEIRO 4.33). Ficou só a saída. */}
        <header className="flex items-center mb-12">
          <button onClick={() => setIsCarModeActive(false)} className="p-2" aria-label="Sair do modo carro">
            <ChevronDown className="w-10 h-10" />
          </button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-between py-10">
          <div className="text-center space-y-4">
            <div className="w-48 h-48 mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold line-clamp-1">{book.title}</h1>
            <p className="text-primary font-medium">{book.author}</p>
          </div>

          <div className="w-full flex flex-col items-center gap-12">
            <div className="text-4xl font-black tracking-tighter text-white/70">
              -{formatTime(chapterDuration - positionInChapter)}
            </div>

            <div className="w-full flex items-center justify-around">
              <button 
                onClick={() => setCurrentTime(prev => Math.max(0, prev - 30))}
                className="relative p-6 text-white active:scale-90 transition-transform"
              >
                <RotateCcw className="w-16 h-16" />
                <span className="absolute inset-0 flex items-center justify-center text-xl font-black mt-2">30</span>
              </button>

              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-32 h-32 bg-white text-black rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all"
              >
                {isPlaying ? <Pause className="w-16 h-16 fill-current" /> : <Play className="w-16 h-16 fill-current ml-2" />}
              </button>

              <button
                onClick={salvarMarcacao}
                className="p-6 text-white active:scale-90 transition-transform"
                aria-label="Salvar marcação"
              >
                <Bookmark className="w-16 h-16" />
              </button>
            </div>
          </div>
        </main>

        <footer className="mt-auto py-8 text-center text-white/40 text-sm font-medium">
          Mantenha os olhos na estrada.
        </footer>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#141414] text-white">
      {/* Fundo: a capa desfocada dá cor ao player sem fugir do tema escuro do
          app — no espírito dos players de streaming. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <img src={book.cover} alt="" className="h-full w-full scale-125 object-cover opacity-40 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#141414]/70 via-[#141414]/90 to-[#141414]" />
      </div>

      {/* Top Bar */}
      <header className="relative px-4 py-3 flex items-center justify-between shrink-0">
        <button onClick={() => window.history.back()} className="p-2 hover:bg-white/10 rounded-full transition-colors" aria-label="Voltar">
          <ChevronDown className="w-8 h-8" />
        </button>
        <div className="flex items-center gap-1">
          <button onClick={compartilhar} className="p-2 hover:bg-white/10 rounded-full transition-colors" aria-label="Compartilhar">
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowMoreMenu(true)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Mais opções"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="relative flex-1 flex flex-col items-center px-6 justify-center min-h-0 pb-4">
        <div className="w-full flex flex-col items-center space-y-5 max-w-md mx-auto">
          {/* Album Art */}
          <div className="relative w-full max-w-[240px] aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-white/5 shrink-0 transition-transform duration-500 hover:scale-[1.02]">
            <img
              src={book.cover}
              alt={book.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-0 right-0 overflow-hidden w-20 h-20">
              <div className="absolute transform rotate-45 bg-[#f59e0b] text-black text-[9px] font-bold py-1 right-[-25px] top-[15px] w-32 text-center uppercase tracking-wider shadow-sm">
                AllBook<br/>Original
              </div>
            </div>
          </div>

          {/* Título e autor — clicáveis, levam à página do livro. Antes o único
              caminho para os detalhes era o menu "Mais" > "Detalhes do título",
              escondido demais: tocar no nome é o gesto que a pessoa tenta
              primeiro. A setinha dá a dica de que dá para tocar. */}
          <button
            onClick={() => setLocation(`/book/${book.id}`)}
            className="group flex flex-col items-center text-center shrink-0"
            aria-label={`Ver detalhes de ${book.title}`}
            data-testid="button-player-book"
          >
            <span className="flex items-center gap-1.5">
              <span
                className="font-display text-xl font-bold tracking-tight line-clamp-1 transition-colors group-hover:text-primary group-active:text-primary"
                data-testid="text-player-title"
              >
                {book.title}
              </span>
              <ChevronRight className="w-4 h-4 shrink-0 text-white/40 transition-colors group-hover:text-primary" />
            </span>
            <span className="text-sm text-white/60 transition-colors group-hover:text-white/80">{book.author}</span>
          </button>

          {/*
            Trocar de voz sem sair do player. Fica fora do botão de cima (que
            navega para a ficha) porque são gestos diferentes, e some quando o
            livro tem uma narração só — botão que não leva a lugar nenhum é o que
            o ROTEIRO 4.23 mandou varrer. Linha fina, não pastilha: a voz certa
            já está tocando para quase todo mundo.
          */}
          {podeTrocarDeVoz && (
            <button
              onClick={() => setShowNarracoes(true)}
              className="-mt-1 flex shrink-0 items-center gap-1.5 text-[12px] text-white/45 transition-colors hover:text-white/70"
              data-testid="button-change-narration"
            >
              <ListMusic className="h-3 w-3 text-primary" />
              Narrado por {narracao.name}
              <span className="font-semibold text-primary">· trocar</span>
            </button>
          )}

          {/* Capítulo — abre a lista de todos os capítulos para pular direto. */}
          <button
            onClick={() => setShowChapters(true)}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-white/5 hover:bg-white/10 py-1.5 pl-5 pr-4 rounded-full border border-white/10 shrink-0"
            data-testid="button-chapters"
          >
            <ListMusic className="w-4 h-4 text-primary" />
            <span className="font-semibold text-base">Capítulo {currentChapter}</span>
            <ChevronDown className="w-4 h-4 opacity-60" />
          </button>

          {/* Progress Section */}
          <div className="w-full space-y-2 px-2 shrink-0">
            <div className="relative pt-1">
              <Slider
                value={[chapterProgress]}
                onValueChange={(val) => {
                  // Arrastar move só dentro do capítulo atual.
                  setCurrentTime(chapterStart + (val[0] / 100) * chapterDuration);
                }}
                max={100}
                step={0.1}
                className="[&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:bg-primary [&_[role=slider]]:border-none [&_.relative]:h-1 [&_.bg-secondary]:bg-white/15 cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-[10px] font-medium tracking-tight">
              <span className="text-white/50">{formatTime(positionInChapter)}</span>
              <span className="text-white/80">{formatRemaining(chapterDuration, positionInChapter)}</span>
              <span className="text-white/50">-{formatTime(chapterDuration - positionInChapter)}</span>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="w-full flex items-center justify-around px-2 shrink-0">
            <button
              onClick={prevChapter}
              className="text-white/70 hover:text-white transition-colors"
              aria-label="Capítulo anterior"
            >
              <SkipBack className="w-7 h-7" />
            </button>
            
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setCurrentTime(prev => Math.max(0, prev - 30))}
                className="relative p-2 text-white hover:text-amber-500 transition-colors group"
              >
                <RotateCcw className="w-8 h-8" />
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black mt-1">30</span>
              </button>
              
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 bg-primary text-black rounded-full flex items-center justify-center shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                aria-label={isPlaying ? "Pausar" : "Reproduzir"}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 fill-current" />
                ) : (
                  <Play className="w-7 h-7 fill-current ml-1" />
                )}
              </button>

              <button 
                onClick={() => setCurrentTime(prev => Math.min(durationSeconds, prev + 30))}
                className="relative p-2 text-white hover:text-amber-500 transition-colors group"
              >
                <RotateCw className="w-8 h-8" />
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black mt-1">30</span>
              </button>
            </div>

            <button
              onClick={nextChapter}
              className="text-white/70 hover:text-white transition-colors"
              aria-label="Próximo capítulo"
            >
              <SkipForward className="w-7 h-7" />
            </button>
          </div>
        </div>
      </main>

      {/*
        A barra de ações mora em `BarraDeAcoesDoPlayer` desde 26/07. O que
        estava aqui tinha contraste baixo demais (rótulos de 9px a 40% de
        branco), alvos pequenos, e escondia a lista de marcações atrás de um
        toque longo — ver o cabeçalho do componente.
      */}
      <BarraDeAcoesDoPlayer
        velocidade={speed}
        temporizadorLigado={selectedTimer !== "Desligado"}
        totalDeMarcacoes={totalDeMarcacoes}
        onVelocidade={() => setShowSpeedMenu(true)}
        onModoCarro={handleCarModeClick}
        onTemporizador={() => setShowTimerMenu(true)}
        onMarcar={marcarEAnotar}
        onVerMarcacoes={() => setShowMarcacoes(true)}
      />

      {/* Salva o ponto e já pergunta o que a pessoa quis guardar dele. */}
      <AnotarMarcacao
        marcacao={anotando}
        tituloDoCapitulo={(capitulo) =>
          chapters.find((ch) => ch.id === capitulo)?.title ?? `Capítulo ${capitulo}`
        }
        formatarTempo={formatTime}
        onFechar={fecharAnotacao}
      />

      {/* "Histórico de escuta" abria um aviso com o capítulo atual — o presente,
          e já visível na tela. Agora abre o passado de verdade deste título,
          lido do diário de audição (ROTEIRO 4.36). */}
      <HistoricoDoLivro
        aberto={showHistorico}
        onClose={() => setShowHistorico(false)}
        bookId={book.id}
        titulo={book.title}
        capituloAtual={currentChapter}
        totalDeCapitulos={chapters.length}
      />

      {/* O painel que o menu de "…" promete há tempo — agora existe. */}
      <MarcacoesDoLivro
        aberto={showMarcacoes}
        onClose={() => setShowMarcacoes(false)}
        bookId={book.id}
        titulo={book.title}
        tituloDoCapitulo={(chapter) =>
          chapters.find((ch) => ch.id === chapter)?.title ?? `Capítulo ${chapter}`
        }
        formatarTempo={formatTime}
        onIr={(positionSec) => {
          setCurrentTime(positionSec);
          setShowMarcacoes(false);
          toast({ title: "Voltamos para a marcação", description: formatTime(positionSec) });
        }}
      />

      {/* Lista de todos os capítulos — abre pelo botão "Capítulo N". */}
      {/* Gaveta das vozes — mesma casca da lista de capítulos, para o player não
          ter dois jeitos diferentes de mostrar uma escolha. */}
      <Drawer open={showNarracoes} onOpenChange={setShowNarracoes}>
        <DrawerContent className="mx-auto max-h-[80vh] max-w-[480px] border-white/10 bg-[#1a1a1a] text-white">
          <DrawerHeader className="text-left">
            <DrawerTitle className="font-display tracking-tight text-white">Quem narra</DrawerTitle>
            <DrawerDescription className="text-white/50">
              {book.title} tem mais de uma narração. Escolha a voz que preferir.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8">
            <ListaDeNarracoes book={book} aoEscolher={() => setShowNarracoes(false)} />
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={showChapters} onOpenChange={setShowChapters}>
        <DrawerContent className="mx-auto max-h-[80vh] max-w-[480px] border-white/10 bg-[#1a1a1a] text-white">
          <DrawerHeader className="text-left">
            <DrawerTitle className="font-display tracking-tight text-white">Capítulos</DrawerTitle>
            <DrawerDescription className="text-white/50">
              {book.title} • {chapters.length} capítulos
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-0.5 overflow-y-auto px-3 pb-8">
            {chapters.map((ch) => {
              const isCurrent = ch.id === currentChapter;
              // Quanto deste capítulo já foi ouvido, pela posição atual: os
              // capítulos anteriores ficam cheios, o atual mostra o avanço, e os
              // seguintes ficam vazios. A barra cresce animada ao abrir a lista.
              const inicio = chapterStartSec(book.id, ch.id);
              const ouvido = Math.min(Math.max(currentTime - inicio, 0), ch.durationSec);
              const pct = (ouvido / ch.durationSec) * 100;
              const concluido = pct >= 99.5;
              const temBarra = isCurrent || pct > 0;
              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    goToChapter(ch.id);
                    setShowChapters(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                    isCurrent ? "bg-primary/15" : "hover:bg-white/5 active:bg-white/10"
                  }`}
                  data-testid={`chapter-item-${ch.id}`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                        isCurrent
                          ? "bg-primary text-black"
                          : concluido
                            ? "bg-primary/20 text-primary"
                            : "bg-white/10 text-white/50"
                      }`}
                    >
                      {isCurrent ? (
                        <ListMusic className="h-4 w-4" />
                      ) : concluido ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <span className="font-mono text-xs">{ch.id.toString().padStart(2, "0")}</span>
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
                      {temBarra && (
                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                            className="h-full rounded-full bg-gradient-to-r from-primary to-[#f59e0b]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-white/40">
                    {isCurrent ? "Tocando" : concluido ? "Ouvido" : formatChapterDuration(ch.durationSec)}
                  </span>
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Speed Control Modal (Overlay) */}
      {showSpeedMenu && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-xs flex items-end animate-in fade-in duration-200" onClick={() => setShowSpeedMenu(false)}>
          <div 
            className="w-full bg-[#1a1a1a] rounded-t-[32px] p-8 space-y-10 animate-in slide-in-from-bottom duration-300 border-t border-white/10"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-12 h-1.5 bg-white/15 rounded-full mx-auto -mt-2" />
            
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold font-display">Velocidade</h3>
              <span className="text-xl font-bold text-amber-500">{speed.toFixed(2).replace('.', ',')}</span>
            </div>

            {/* Main Slider Control */}
            <div className="flex items-center gap-6 px-2">
              <button 
                onClick={() => adjustSpeed(-0.05)}
                className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/5 active:scale-95 transition-all"
              >
                <Minus className="w-6 h-6" />
              </button>

              <div className="flex-1 relative pt-2">
                <Slider 
                  value={[speed]} 
                  onValueChange={([val]) => setSpeed(val)} 
                  min={0.5}
                  max={3.0} 
                  step={0.05}
                  className="[&_[role=slider]]:h-7 [&_[role=slider]]:w-7 [&_[role=slider]]:bg-amber-500 [&_[role=slider]]:border-none [&_.relative]:h-1.5 [&_.bg-primary]:bg-white/15"
                />
              </div>

              <button 
                onClick={() => adjustSpeed(0.05)}
                className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/5 active:scale-95 transition-all"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-3 gap-4">
              {speedPresets.map(preset => (
                <button
                  key={preset}
                  onClick={() => setSpeed(preset)}
                  className={`py-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-0.5 ${
                    speed === preset 
                      ? "bg-amber-500/10 border-amber-500 text-amber-500" 
                      : "border-white/10 text-white/70 hover:border-white/30"
                  }`}
                >
                  <span className="text-base font-bold">{preset.toFixed(1).replace('.', ',')}</span>
                  {preset === 1.0 && <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70">Padrão</span>}
                </button>
              ))}
            </div>
            
            <div className="pb-4" />
          </div>
        </div>
      )}

      {/* More Options Menu (Overlay) */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-[160] animate-in fade-in duration-200" onClick={() => setShowMoreMenu(false)}>
          <div 
            /* O fundo era `#1c2a3d`, um azul-marinho da versão antiga: o menu
               era a única superfície azul do app inteiro. Agora é o mesmo
               `#1c1c1c` das folhas de baixo e dos cartões. */
            className="absolute top-16 right-4 w-72 bg-[#1c1c1c] rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-200 origin-top-right"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col py-2">
              {/* Usa `book.id` (já resolvido) em vez de `params.id`, que podia
                  ser 'current' e caía num /book/5 fixo — abrindo o livro errado. */}
              <Link href={`/book/${book.id}`}>
                <button className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left group w-full">
                  <BookOpen className="w-5 h-5 text-white/50 group-hover:text-white" />
                  <span className="text-sm font-medium">Detalhes do título</span>
                </button>
              </Link>

              {/* "Conectar dispositivo Bluetooth" também saiu em 26/07: era o
                  mesmo teatro dos diálogos do modo carro — o app não conecta
                  nada, quem conecta é o sistema do celular (ROTEIRO 4.33). */}
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  toast({ title: "Marcado como concluído", description: `${book.title} entrou nos seus títulos ouvidos.` });
                }}
                className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left group w-full"
              >
                <CheckCircle className="w-5 h-5 text-white/50 group-hover:text-white" />
                <span className="text-sm font-medium">Marcar como concluído</span>
              </button>

              {/* Abre o painel de verdade. Antes este item mostrava um aviso
                  prometendo que as marcações "aparecerão aqui" — e não havia
                  nenhum "aqui" para onde ir. */}
              <button
                onClick={() => { setShowMoreMenu(false); setShowMarcacoes(true); }}
                className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left group w-full"
                data-testid="menu-bookmarks"
              >
                <Bookmark className="w-5 h-5 text-white/50 group-hover:text-white" />
                <span className="text-sm font-medium">Minhas notas</span>
                {totalDeMarcacoes > 0 && (
                  <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-white/70">
                    {totalDeMarcacoes}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setShowMoreMenu(false); setLocation('/settings'); }}
                className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left group w-full"
              >
                <Settings className="w-5 h-5 text-white/50 group-hover:text-white" />
                <span className="text-sm font-medium">Configurações do tocador</span>
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  setShowHistorico(true);
                }}
                className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left group w-full"
              >
                <History className="w-5 h-5 text-white/50 group-hover:text-white" />
                <span className="text-sm font-medium">Histórico deste livro</span>
              </button>

              {/* Ia para a tela Descobrir e se chamava "Títulos recomendados" —
                  nome que não dizia para onde levava. Com a Descobrir fundida na
                  Buscar (26/07, ROTEIRO 4.32), o item aponta para lá e usa o nome
                  e o ícone do destino: quem toca aqui sabe onde vai cair. */}
              <button
                onClick={() => { setShowMoreMenu(false); setLocation('/search'); }}
                className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left group w-full"
              >
                <SearchIcon className="w-5 h-5 text-white/50 group-hover:text-white" />
                <span className="text-sm font-medium">Explorar o catálogo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timer Configuration Modal (Overlay) */}
      {showTimerMenu && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-xs flex items-end animate-in fade-in duration-200" onClick={() => setShowTimerMenu(false)}>
          <div 
            className="w-full bg-[#1a1a1a] rounded-t-[32px] p-6 pb-10 space-y-6 animate-in slide-in-from-bottom duration-300 border-t border-white/10"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-12 h-1.5 bg-white/15 rounded-full mx-auto -mt-2" />
            
            <div className="px-2">
              <h3 className="text-lg font-bold font-display mb-6">Temporizador de soneca</h3>
              
              <div className="space-y-1">
                {[
                  "Desligado", 
                  "5 minutos", 
                  "10 minutos", 
                  "15 minutos", 
                  "30 minutos", 
                  "45 minutos", 
                  "60 minutos", 
                  "Fim do capítulo"
                ].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSelectedTimer(option);
                      setShowTimerMenu(false);
                    }}
                    className="w-full flex items-center justify-between py-4 px-2 hover:bg-white/5 rounded-xl transition-colors group"
                  >
                    <span className={`text-base ${selectedTimer === option ? "text-white font-semibold" : "text-white/70"}`}>
                      {option}
                    </span>
                    {/* Os botões de -/+ que ficavam aqui eram mortos (sem
                        onClick) e ainda aninhavam button dentro de button —
                        voltam quando "Fim do capítulo" tiver contagem real. */}
                    <div className="flex items-center gap-2">
                      {selectedTimer === option && (
                        <div className="w-5 h-5 text-white">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
                
                <button
                  onClick={() => {
                    setShowTimerMenu(false);
                    setShowCustomTimer(true);
                  }}
                  className="w-full py-4 px-2 text-left hover:bg-white/5 rounded-xl transition-colors"
                >
                  <span className="text-base text-white/70">Personalizar</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <button 
                onClick={() => setShowTimerMenu(false)}
                className="w-full py-2 text-center text-base font-bold text-white hover:text-amber-500 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Timer Dialog */}
      {showCustomTimer && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          {/* `#3d3d3d` e canto pequeno: era um cinza claro fora da escala do
              app, com a cara do diálogo padrão do Android. Passou para a mesma
              superfície e o mesmo raio dos outros quadros do player. */}
          <div className="w-full max-w-sm bg-[#1a1a1a] rounded-[24px] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 space-y-8">
              <h3 className="text-xl font-medium text-white">Personalizar duração</h3>
              
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="flex flex-col items-center gap-2">
                  <input 
                    type="number" 
                    value={customHours}
                    onChange={(e) => setCustomHours(e.target.value)}
                    className="w-16 bg-transparent border-b-2 border-white/40 text-center text-2xl font-medium focus:border-white outline-none transition-colors"
                  />
                  <span className="text-sm text-white/70">Horas</span>
                </div>
                
                <div className="flex flex-col items-center gap-2">
                  <input 
                    type="number" 
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    className="w-16 bg-transparent border-b-2 border-white/40 text-center text-2xl font-medium focus:border-white outline-none transition-colors"
                  />
                  <span className="text-sm text-white/70">Minutos</span>
                </div>
              </div>

              <p className="text-center text-sm text-white/50">
                (máx: 24 horas, mín: 1 minuto)
              </p>

              <div className="flex justify-end gap-6 pt-2">
                <button 
                  onClick={() => setShowCustomTimer(false)}
                  className="text-sm font-bold text-white/70 hover:text-white uppercase tracking-wider px-2 py-1"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    setSelectedTimer(`${customHours}h ${customMinutes}m`);
                    setShowCustomTimer(false);
                  }}
                  className="text-sm font-bold text-white/70 hover:text-white uppercase tracking-wider px-2 py-1"
                >
                  Ok
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}