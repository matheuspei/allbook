import { ChevronDown, ChevronRight, Share2, MoreVertical, ListMusic, Pencil, RotateCcw, RotateCw, Scissors, SkipBack, SkipForward, Pause, Play, Bookmark, Minus, Plus, BookOpen, CheckCircle, Settings, History, Undo2, Search as SearchIcon } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import { Slider } from "@/components/ui/slider";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useState, useEffect, useMemo, useRef } from "react";
import BarraDeAcoesDoPlayer from "@/components/BarraDeAcoesDoPlayer";
import ConversaDoTrecho from "@/components/ConversaDoTrecho";
import MarcasDaConversa from "@/components/MarcasDaConversa";
import FaixaDaTurmaNoPlayer from "@/components/clube/FaixaDaTurmaNoPlayer";
import FaixaDaSalaNoPlayer, { ItemOuvirJunto } from "@/components/sala/FaixaDaSalaNoPlayer";
import ContinuarDaTurma from "@/components/sala/ContinuarDaTurma";
import { ultimaTelaNavegavel } from "@/lib/navegacao";
import AbrirSala from "@/components/sala/AbrirSala";
import { SALA_AO_VIVO_EVENT } from "@/lib/salaAoVivo";
import { MAX_CITACAO_SEC, criarCitacao, rotuloDaCitacao } from "@/lib/citacoes";
import { CLUBES_EVENT, meuClubeDoLivro } from "@/lib/clubes";
import { guardarTrecho, type TrechoGuardado } from "@/lib/trechosGuardados";
import EditarTrecho from "@/components/EditarTrecho";
import { commentsForBook } from "@/lib/comments";
import { myCommentsFor } from "@/lib/myComments";
import { comentariosNoTrecho } from "@/lib/sala";
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
import { readSettings, saveSettings } from "@/lib/settings";
import { readPlayback, readPlaying, savePlayback, savePlaying, showMiniPlayer } from "@/lib/playback";
import { getChapters, chaptersTotalSec, chapterStartSec, chapterAtSec, formatChapterDuration } from "@/lib/chapters";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function AudioPlayer({ params }: { params: { id: string } }) {
  // Id que não existe no catálogo: tela de "não encontrado" em vez de tocar
  // silenciosamente o primeiro livro do catálogo. `/player/current` é o atalho
  // da barrinha e continua caindo no último livro ouvido, mais abaixo.
  if (params.id !== "current" && !catalog.some((item) => item.id === Number(params.id))) {
    return (
      <div
        className="min-h-screen bg-background text-white flex flex-col items-center justify-center gap-4 px-6 text-center"
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
  /*
   * Abre tocando — é o que a pessoa espera de quem apertou "Reproduzir". A
   * exceção é ter pausado na barrinha e voltado para cá: aí o player abre no
   * estado em que ela deixou, em vez de dar play por conta própria (27/07).
   */
  const [isPlaying, setIsPlaying] = useState(() => readPlaying() ?? true);

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
  /**
   * `?ate=` — o fim de uma **citação** (ROTEIRO 4.43).
   *
   * É o que separa "ouvir o trecho" de "abrir o livro por aqui". Sem ele, quem
   * tocasse uma citação de 40 segundos entraria no livro e seguiria capítulo
   * adentro — e a condição que o Matheus pôs era justamente *"só poder
   * reproduzir isso"*.
   */
  const ateParam = (() => {
    const n = Number(parametros.get("ate"));
    return Number.isFinite(n) && n > 0 ? Math.min(n, durationSeconds) : null;
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

  /**
   * Enquanto uma citação está tocando, o fim dela é uma parede.
   *
   * Some assim que a pessoa **sai do trecho por vontade própria** (arrasta a
   * barra, pula de capítulo): a citação é uma porta de entrada, não uma cerca —
   * quem gostou do trecho e quer continuar o livro tem de poder, e ficar sendo
   * pausado a cada volta seria o app teimando com quem já decidiu.
   */
  const [limiteDaCitacao, setLimiteDaCitacao] = useState<number | null>(ateParam);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (limiteDaCitacao !== null && prev + 1 >= limiteDaCitacao) {
            setIsPlaying(false);
            setLimiteDaCitacao(null);
            return limiteDaCitacao;
          }
          return Math.min(prev + 1, durationSeconds);
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, durationSeconds, limiteDaCitacao]);

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

  /*
   * **O player lembra a velocidade** (31/07, §4.85).
   *
   * Era assim: o player abria na velocidade guardada em Configurações e, se
   * você mudasse aqui, a mudança valia só para aquela sessão — na próxima
   * abertura voltava ao padrão. Isso obrigava a existir uma tela de
   * configuração só para fixar o número, e o Matheus reclamou dela com razão:
   * *"a configuração de reprodução não faz sentido nessa página, você já pode
   * alterar isso no player"*.
   *
   * Agora quem manda é o player: mudou aqui, fica assim para os próximos
   * livros. A tela de configuração some, e a preferência continua existindo —
   * só que escrita pelo lugar onde a pessoa de fato decide.
   */
  const [speed, setSpeed] = useState(() => readSettings().speed);
  useEffect(() => {
    const atual = readSettings();
    if (atual.speed !== speed) saveSettings({ ...atual, speed });
  }, [speed]);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [selectedTimer, setSelectedTimer] = useState("Desligado");
  const [showCustomTimer, setShowCustomTimer] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [customHours, setCustomHours] = useState("0");
  const [customMinutes, setCustomMinutes] = useState("0");
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
  const [showConversa, setShowConversa] = useState(false);
  /* Em que segundo a gaveta da conversa abriu. `null` = no ponto onde o áudio
     está agora (o caso do botão "Conversa" da barra). Preenchido quando a pessoa
     toca numa marca do trilho — inclusive numa de trecho ainda não ouvido. */
  const [pontoDaConversa, setPontoDaConversa] = useState<number | null>(null);
  /** O trecho recém-guardado que está sendo aparado na folha de ajuste. */
  const [ajustandoTrecho, setAjustandoTrecho] = useState<TrechoGuardado | null>(null);
  /**
   * O trecho guardado há poucos segundos — enquanto ele existe, o botão de
   * guardar oferece **ajustar** aquele corte em vez de guardar outro.
   */
  const [recemGuardado, setRecemGuardado] = useState<TrechoGuardado | null>(null);
  const janelaDeAjuste = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** O ponto de onde a pessoa saltou, oferecido de volta por alguns segundos. */
  const [voltarPara, setVoltarPara] = useState<number | null>(null);
  const ondeEuEstavaRef = useRef<number | null>(null);
  const relogioDoVoltar = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (janelaDeAjuste.current) clearTimeout(janelaDeAjuste.current);
      if (relogioDoVoltar.current) clearTimeout(relogioDoVoltar.current);
    };
  }, []);
  const { toast } = useToast();

  /**
   * Quantas falas existem nos últimos 5 minutos de áudio — o contador do botão
   * "Conversa" (ROTEIRO 4.39).
   *
   * Recalculado a cada meio minuto de audição, e não a cada segundo: a conta
   * varre a lista de comentários, e fazer isso 60 vezes por minuto seria
   * desperdício para um número que muda de dois em dois minutos.
   */
  const janelaDeConversa = Math.floor(currentTime / 30);
  const falasNoTrecho = useMemo(() => {
    const posicao = janelaDeConversa * 30;
    const dosOutros = comentariosNoTrecho(commentsForBook(book.id), posicao).length;
    const meus = myCommentsFor({ bookId: book.id }).filter(
      (item) =>
        item.positionSec !== undefined &&
        item.positionSec <= posicao + 1 &&
        item.positionSec >= posicao - 300,
    ).length;
    return dosOutros + meus;
  }, [book.id, janelaDeConversa]);

  /*
   * O clube dentro do player (ROTEIRO 4.40). Recalculado quando o clube muda
   * (entrar, sair, encerrar ciclo) e não a cada segundo de áudio: `CLUBES_EVENT`
   * é o mesmo aviso que as telas de clube já escutam.
   */
  /**
   * A sala de escuta ao vivo (§4.81). `versaoDaSala` só existe para a faixa
   * redesenhar quando alguém abre, entra ou encerra uma sala — o mesmo padrão
   * que o clube usa logo abaixo.
   */
  const [showAbrirSala, setShowAbrirSala] = useState(false);
  const [versaoDaSala, setVersaoDaSala] = useState(0);
  useEffect(() => {
    const atualizar = () => setVersaoDaSala((v) => v + 1);
    window.addEventListener(SALA_AO_VIVO_EVENT, atualizar);
    return () => window.removeEventListener(SALA_AO_VIVO_EVENT, atualizar);
  }, []);

  const [clubeDoLivro, setClubeDoLivro] = useState(() => meuClubeDoLivro(book.id));
  useEffect(() => {
    const atualizar = () => setClubeDoLivro(meuClubeDoLivro(book.id));
    atualizar();
    window.addEventListener(CLUBES_EVENT, atualizar);
    return () => window.removeEventListener(CLUBES_EVENT, atualizar);
  }, [book.id]);

  useEffect(() => {
    showMiniPlayer();
  }, [book.id]);

  /*
   * Tocar/pausar aqui vale para o app inteiro: a barrinha lê o mesmo estado e
   * continua de onde o player parou quando a pessoa sai desta tela.
   */
  useEffect(() => {
    savePlaying(isPlaying);
  }, [isPlaying]);

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

  const speedPresets = [0.7, 1.0, 1.2, 1.5, 1.7, 2.0];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-background text-white">
      {/* Fundo: a capa desfocada dá cor ao player sem fugir do tema escuro do
          app — no espírito dos players de streaming. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <img src={book.cover} alt="" className="h-full w-full scale-125 object-cover opacity-40 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/90 to-background" />
      </div>

      {/* Top Bar */}
      <header className="relative px-4 py-3 flex items-center justify-between shrink-0">
        {/*
          **Minimizar devolve à última tela com menu** (31/07, §4.81). Era
          `window.history.back()`, e isso tinha dois furos: quem abriu o app
          direto num endereço de player **saía do app**, e — depois que a sala ao
          vivo nasceu — voltar podia cair na sala, que é outra tela cheia, e as
          duas se empurravam sem fim ("*ele fica nesse limbo*", o Matheus).
          A regra mora em `lib/navegacao.ts`.
        */}
        <button
          onClick={() => setLocation(ultimaTelaNavegavel(), { replace: true })}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Minimizar o player"
        >
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
          </div>

          {/* O selo saiu de CIMA da arte (§4.104): a fita diagonal cobria a
              capa. Fora da imagem, como a ficha do livro já faz. */}
          <span className="-my-1 rounded-md bg-primary/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
            AllBook Original
          </span>

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

          {/*
            O clube, enquanto o livro toca (ROTEIRO 4.40). Fica aqui — colado na
            barra de progresso — porque o assunto dele é ritmo: "você no cap. 3,
            a roda no 4" só faz sentido ao lado de onde você está no áudio.
          */}
          {clubeDoLivro && <FaixaDaTurmaNoPlayer clube={clubeDoLivro} />}

          {/*
            A sala ao vivo deste livro, se houver (§4.81). Fica ao lado da faixa
            do clube porque as duas respondem à mesma pergunta — "tem gente
            comigo neste livro?" —, e some sozinha quando não há sala.
            `key` com a versão: a faixa precisa sumir na hora em que a sala é
            encerrada, sem esperar a próxima navegação.
          */}
          <div key={versaoDaSala} className="w-full space-y-2 px-2 shrink-0 empty:hidden">
            <FaixaDaSalaNoPlayer bookId={book.id} />

            {/* "Continuar de onde a turma parou" (§4.81) — só para quem está
                atrás do ponto da última sessão. */}
            <ContinuarDaTurma
              bookId={book.id}
              posicaoAtualSec={currentTime}
              onIr={(posicao) => {
                setCurrentTime(posicao);
                toast({
                  title: "Você está com a turma",
                  description: "As falas da sessão aparecem conforme você passa por cada minuto.",
                });
              }}
            />
          </div>

          {/* Progress Section */}
          <div className="w-full space-y-2 px-2 shrink-0">
            <div className="relative pt-1">
              <Slider
                value={[chapterProgress]}
                /* Guarda de onde a pessoa saiu, **antes** de o arraste começar a
                   mover o áudio — é este valor que o "voltar" devolve. */
                onPointerDown={() => {
                  ondeEuEstavaRef.current = currentTime;
                }}
                onValueChange={(val) => {
                  // Arrastar move só dentro do capítulo atual.
                  // Arrastar é decidir continuar: a cerca da citação cai aqui.
                  setLimiteDaCitacao(null);
                  setCurrentTime(chapterStart + (val[0] / 100) * chapterDuration);
                }}
                /*
                  **A rede de segurança do toque errado** (ROTEIRO 4.52). A barra
                  é o alvo mais fácil de acertar sem querer no player, e errar
                  nela custa caro: o áudio pula e a pessoa perde onde estava —
                  *"ela não sabe onde ela está"*. Passou de 15 segundos, o
                  caminho de volta aparece por 8. Abaixo disso é ajuste fino de
                  quem quis mesmo mover, e um aviso ali só atrapalharia.
                */
                onValueCommit={(val) => {
                  const antes = ondeEuEstavaRef.current;
                  ondeEuEstavaRef.current = null;
                  if (antes === null) return;
                  const agora = chapterStart + (val[0] / 100) * chapterDuration;
                  if (Math.abs(agora - antes) < 15) return;
                  setVoltarPara(antes);
                  if (relogioDoVoltar.current) clearTimeout(relogioDoVoltar.current);
                  relogioDoVoltar.current = setTimeout(() => setVoltarPara(null), 8000);
                }}
                max={100}
                step={0.1}
                className="[&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:bg-primary [&_[role=slider]]:border-none [&_.relative]:h-1 [&_.bg-secondary]:bg-white/15 cursor-pointer"
              />

              {voltarPara !== null && (
                <button
                  onClick={() => {
                    setCurrentTime(voltarPara);
                    setVoltarPara(null);
                  }}
                  /* **Acima** da barra, e não abaixo: embaixo fica o trilho da
                     conversa, e cobrir os alvos de toque por 8 segundos seria
                     trocar um estorvo por outro — ainda mais para quem acabou
                     de pular e talvez queira justamente tocar numa marca. */
                  className="absolute bottom-full left-1/2 z-20 mb-1 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[11px] font-bold text-black shadow-lg animate-in fade-in slide-in-from-bottom-1 duration-200"
                  data-testid="voltar-para-onde-eu-estava"
                >
                  <Undo2 className="h-3 w-3" />
                  Voltar para {formatTime(voltarPara - chapterStart)}
                </button>
              )}
            </div>

            {/*
              **O trilho da conversa, fora da barra** (ROTEIRO 4.52). Ficava por
              cima do slider, com 5px de alvo dentro da área de arraste: quem
              errava a bolinha movia o áudio. Aqui embaixo é faixa só dele, e
              errar o toque não custa nada.
            */}
            <MarcasDaConversa
              bookId={book.id}
              chapterStart={chapterStart}
              chapterDuration={chapterDuration}
              currentTime={currentTime}
              slugsDaTurma={clubeDoLivro?.membros}
              /*
                **Marca do futuro não move o áudio** (05/08). Tocar numa marca já
                ouvida leva o player até lá — é o que se espera de "voltar
                naquele ponto". Tocar numa marca à frente **abre só a conversa**,
                num ponto avulso: mover o áudio ali seria adiantar o livro sem
                pedir, e quem quis espiar a conversa não pediu para pular a
                história.
              */
              onAbrir={(posicao, adiante) => {
                if (!adiante) setCurrentTime(posicao);
                setPontoDaConversa(posicao);
                setShowConversa(true);
              }}
            />
            <div className="flex items-center justify-between text-[10px] font-medium tracking-tight">
              <span className="text-white/50">{formatTime(positionInChapter)}</span>

              {/*
                **Guardar 40s daqui, num toque** (ROTEIRO 4.46).

                Antes eram três: Conversa → "Citar o trecho" → Guardar. O Matheus
                apontou: *"a pessoa vai ter que citar o trecho e só depois abre a
                parte onde ela pode guardar"* — guardar era sub-ação de comentar,
                quando na verdade é irmã de marcar uma nota.

                **Fica na linha dos tempos** porque o assunto dele é posição, e é
                onde o olho já está quando se pensa "esse pedaço aqui". Não deu
                para pôr na barra de ações: ela já tem seis alvos e o código
                abrevia "Velocidade" por isso — um sétimo truncaria os outros.

                **Padrão primeiro, ajuste depois:** o toque guarda 40 segundos na
                hora e o aviso oferece ajustar. Abrir o cortador para depois
                guardar era pedágio; quem quer o corte exato ainda o tem, agora
                como refinamento e não como caminho obrigatório.

                **E o próprio botão vira "Ajustar o corte" por 8 segundos**
                (ROTEIRO 4.49). Deixar o ajuste só no aviso era frágil: ele some
                sozinho em cinco segundos — apareceu testando, quando o clique
                chegou depois e não abriu nada. Aqui o segundo toque cai **no
                mesmo lugar** do primeiro, que é onde o dedo já está; é o mesmo
                motivo pelo qual o botão "Marcar" confirma em si mesmo em vez de
                confiar no aviso (ver `BarraDeAcoesDoPlayer`).
              */}
              <button
                onClick={() => {
                  if (recemGuardado) {
                    setAjustandoTrecho(recemGuardado);
                    setRecemGuardado(null);
                    return;
                  }
                  const guardado = guardarTrecho(criarCitacao(book.id, currentTime, MAX_CITACAO_SEC));
                  setRecemGuardado(guardado);
                  if (janelaDeAjuste.current) clearTimeout(janelaDeAjuste.current);
                  janelaDeAjuste.current = setTimeout(() => setRecemGuardado(null), 8000);
                  toast({
                    title: "Trecho guardado",
                    description: `${rotuloDaCitacao(guardado)}. Fica em Meus trechos — anexe em qualquer conversa pelo clipe.`,
                    /*
                      **"Ajustar", e não "Ver"** (ROTEIRO 4.49). O comentário
                      abaixo prometia desde a §4.46 que "o aviso oferece
                      ajustar", e isso nunca existiu — o Matheus cobrou: *"ela
                      poderia ter, como tem em conversas, a opção de selecionar
                      a parte que ela quer gravar; ali não dá essa opção"*.
                      Ajustar só serve aqui, no calor do momento; ver a lista já
                      tem caminho próprio (Você › Meus trechos), e a descrição
                      acima diz onde o trecho foi parar.
                    */
                    action: (
                      <ToastAction
                        altText="Ajustar o corte"
                        onClick={() => setAjustandoTrecho(guardado)}
                      >
                        Ajustar
                      </ToastAction>
                    ),
                  });
                }}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors active:scale-95 ${
                  recemGuardado
                    ? "bg-primary/15 text-primary ring-1 ring-inset ring-primary/40"
                    : "bg-white/[0.07] text-white/60 hover:bg-white/15 hover:text-white"
                }`}
                data-testid="guardar-trecho-rapido"
              >
                {/* "Guardar trecho", e não "Guardar 40s": quarenta é o **teto**,
                    não o que a pessoa está guardando — o rótulo antigo anunciava
                    um limite como se fosse a coisa (ROTEIRO 4.47). */}
                {recemGuardado ? (
                  <>
                    <Pencil className="h-2.5 w-2.5" />
                    Ajustar o corte
                  </>
                ) : (
                  <>
                    <Scissors className="h-2.5 w-2.5" />
                    Guardar trecho
                  </>
                )}
              </button>

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
                className="relative p-2 text-white hover:text-primary transition-colors group"
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
                className="relative p-2 text-white hover:text-primary transition-colors group"
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
        onTemporizador={() => setShowTimerMenu(true)}
        onMarcar={marcarEAnotar}
        onVerMarcacoes={() => setShowMarcacoes(true)}
        falasNoTrecho={falasNoTrecho}
        onConversa={() => {
          setPontoDaConversa(null);
          setShowConversa(true);
        }}
      />

      {/* A conversa deste ponto do áudio — a metade da sala do livro que mora
          dentro do player (ROTEIRO 4.39). O ponto pode ser o de agora ou o de
          uma marca do trilho, inclusive à frente (§4.87, 05/08). */}
      {showConversa && (
        <ConversaDoTrecho
          bookId={book.id}
          posicaoSec={pontoDaConversa ?? currentTime}
          adiante={pontoDaConversa !== null && pontoDaConversa > currentTime}
          onFechar={() => {
            setShowConversa(false);
            setPontoDaConversa(null);
          }}
        />
      )}

      {/* Abrir uma sala de escuta ao vivo, a partir do ponto onde a pessoa está
          (ROTEIRO §4.81). */}
      {showAbrirSala && (
        <AbrirSala
          bookId={book.id}
          posicaoSec={currentTime}
          onFechar={() => setShowAbrirSala(false)}
        />
      )}

      {/* O segundo tempo do "guardar num toque": aparar as pontas e escrever a
          nota, sem sair do player (ROTEIRO 4.49). */}
      {ajustandoTrecho && (
        <EditarTrecho trecho={ajustandoTrecho} onFechar={() => setAjustandoTrecho(null)} />
      )}

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
        restanteSec={Math.max(0, durationSeconds - currentTime)}
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
          toast({ title: "Voltamos para a nota", description: formatTime(positionSec) });
        }}
      />

      {/* Lista de todos os capítulos — abre pelo botão "Capítulo N". */}
      {/* Gaveta das vozes — mesma casca da lista de capítulos, para o player não
          ter dois jeitos diferentes de mostrar uma escolha. */}
      <Drawer open={showNarracoes} onOpenChange={setShowNarracoes}>
        <DrawerContent className="mx-auto max-h-[80vh] max-w-[480px] border-white/10 bg-card text-white">
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
        <DrawerContent className="mx-auto max-h-[80vh] max-w-[480px] border-white/10 bg-card text-white">
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
                            className="h-full rounded-full bg-gradient-to-r from-primary to-primary"
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
            className="w-full bg-card rounded-t-[32px] p-8 space-y-10 animate-in slide-in-from-bottom duration-300 border-t border-white/10"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-12 h-1.5 bg-white/15 rounded-full mx-auto -mt-2" />
            
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold font-display">Velocidade</h3>
              <span className="text-xl font-bold text-primary">{speed.toFixed(2).replace('.', ',')}</span>
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
                  className="[&_[role=slider]]:h-7 [&_[role=slider]]:w-7 [&_[role=slider]]:bg-primary [&_[role=slider]]:border-none [&_.relative]:h-1.5 [&_.bg-primary]:bg-white/15"
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
                      ? "bg-primary/10 border-primary text-primary" 
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
            className="absolute top-16 right-4 w-72 bg-card rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-200 origin-top-right"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col py-2">
              {/* "Modo carro" saiu do app em 04/08 por decisão do Matheus
                  (ROTEIRO §4.98): era só uma tela de botões grandes — nem a
                  Audible conecta nada de verdade (§4.33) — e ninguém a ligava.
                  "Detalhes do título" saiu em 27/07: segundo caminho para o
                  mesmo lugar (§4.38). "Conectar Bluetooth" saiu em 26/07:
                  teatro de conexão que o app não faz (§4.33). */}
              {/* Abrir sala de escuta ao vivo (§4.81). Fica no menu porque é ação
                  ocasional; o que é do momento — uma sala já no ar — aparece
                  sozinho na faixa junto da barra de progresso. */}
              <ItemOuvirJunto
                onAbrir={() => {
                  setShowMoreMenu(false);
                  setShowAbrirSala(true);
                }}
              />

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
                <span className="text-sm font-medium">Neste aparelho</span>
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  setShowHistorico(true);
                }}
                className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left group w-full"
              >
                <History className="w-5 h-5 text-white/50 group-hover:text-white" />
                <span className="text-sm font-medium">Meu ritmo neste livro</span>
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
            className="w-full bg-card rounded-t-[32px] p-6 pb-10 space-y-6 animate-in slide-in-from-bottom duration-300 border-t border-white/10"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-12 h-1.5 bg-white/15 rounded-full mx-auto -mt-2" />
            
            <div className="px-2">
              <h3 className="text-lg font-bold font-display mb-6">Dormir — o áudio para sozinho</h3>
              
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
                  <span className="text-base text-white/70">Outra duração…</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <button 
                onClick={() => setShowTimerMenu(false)}
                className="w-full py-2 text-center text-base font-bold text-white hover:text-primary transition-colors"
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
          <div className="w-full max-w-sm bg-card rounded-[24px] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 space-y-8">
              <h3 className="text-xl font-medium text-white">Outra duração</h3>
              
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