import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Play, Pause, X } from "lucide-react";

import {
  PLAYBACK_EVENT,
  hideMiniPlayer,
  isMiniPlayerVisible,
  playbackBook,
  playbackPercent,
  readPlayback,
  readPlaying,
  remainingLabel,
  savePlayback,
  savePlaying,
} from "@/lib/playback";
import { CHAPTERS_EVENT, chapterAtSec, getChapters } from "@/lib/chapters";
import {
  TOCADOR_EVENT,
  abrirLivro,
  livroDoTocador,
  elementoDeAudio,
  pausar,
  posicaoNoLivro,
  temAudioDeVerdade,
  tocar,
} from "@/lib/tocador";

/**
 * A barrinha do player, flutuando acima do menu inferior.
 *
 * Duas coisas mudaram em relação à primeira versão, e as duas vieram de um
 * incômodo real de uso:
 *
 * - **Ela não aparece mais sozinha ao abrir o app.** Antes era um pedaço fixo
 *   da tela com "Organize-se" escrito na mão — quem nunca tinha ouvido nada
 *   ganhava uma barra atravessada no caminho. Agora ela só nasce depois que a
 *   pessoa abre um livro no player, e some quando a aba fecha. Onde parou não
 *   se perde: fica em "Continuar ouvindo", na Início.
 * - **Dá para fechar.** Pelo X e também **arrastando para o lado** — no celular
 *   arrastar é o gesto natural, mas gesto não se vê; o X é o que ensina que a
 *   barra pode sair. Por isso os dois, não um ou outro.
 *
 * Fechar só esconde. O progresso continua salvo.
 */

/** Quanto é preciso arrastar para a barra sair, em pixels. */
const SWIPE_THRESHOLD = 80;

export default function MiniPlayer() {
  const [location] = useLocation();
  const [visible, setVisible] = useState(isMiniPlayerVisible);
  const [playback, setPlayback] = useState(readPlayback);
  /*
   * O "está tocando" **não é desta barra** — é do app, e mora no `playback.ts`.
   * Antes era um `useState(false)` só daqui, com dois efeitos ruins: sair do
   * player no meio de um capítulo mostrava o ícone de tocar (parecia que a
   * audição tinha parado), e o botão era enfeite — trocava de desenho sem mexer
   * no progresso de ninguém. Agora player e barrinha leem e escrevem no mesmo
   * lugar (27/07).
   */
  const [isPlaying, setIsPlaying] = useState(() => readPlaying() ?? false);

  /**
   * Deslocamento do arraste, em pixels. 0 = parado no lugar.
   *
   * Vive em `state` (para redesenhar) **e** em `ref` (para decidir). O `ref` não
   * é firula: o `state` do React só chega atualizado no próximo desenho, então
   * ao soltar o dedo a conta do "andou o bastante?" lia o valor velho e a barra
   * não fechava. O `ref` vale na hora.
   */
  const [dragX, setDragX] = useState(0);
  const dragXRef = useRef(0);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  /** Só vira arraste depois de andar mais na horizontal do que na vertical. */
  const isHorizontal = useRef(false);

  useEffect(() => {
    function sync() {
      setVisible(isMiniPlayerVisible());
      setPlayback(readPlayback());
      setIsPlaying(readPlaying() ?? false);
    }
    sync();
    window.addEventListener(PLAYBACK_EVENT, sync);
    return () => window.removeEventListener(PLAYBACK_EVENT, sync);
  }, [location]);

  /**
   * A audição continua andando com a barra na tela.
   *
   * Enquanto não há áudio de verdade, quem faz o tempo passar é este relógio —
   * o mesmo truque do player, só que de 5 em 5 segundos, que é a precisão que a
   * barra mostra ("2h 14m restantes"). Sem isto, sair do player congelava o
   * livro: a pessoa via "tocando" e o tempo restante parado no mesmo número.
   *
   * Não roda dentro do player (lá o próprio player conta, e contar duas vezes
   * dobraria a velocidade) nem com a barra fechada — nada avança escondido.
   */
  useEffect(() => {
    if (!isPlaying || !visible || location.startsWith("/player")) return;
    /* Com áudio de verdade quem dá a hora é o elemento — somar 5s por cima
       faria a posição correr o dobro e o livro "pular" ao reabrir (§4.143). */
    if (temAudioDeVerdade()) return;

    const relogio = setInterval(() => {
      const atual = readPlayback();
      if (!atual) return;
      const posicao = Math.min(atual.positionSec + 5, atual.durationSec);
      savePlayback({
        bookId: atual.bookId,
        chapter: chapterAtSec(atual.bookId, posicao),
        positionSec: posicao,
        durationSec: atual.durationSec,
      });
    }, 5000);

    return () => clearInterval(relogio);
  }, [isPlaying, visible, location]);

  /**
   * A barrinha prepara o tocador sozinha.
   *
   * Sem isto, quem recarregasse a página e apertasse play aqui não ouviria
   * nada: o tocador só era aberto pela tela do player, e ela não está montada.
   * `abrirLivro` não faz nada quando o livro já é o mesmo, então isto é barato
   * e pode rodar a cada mudança.
   */
  useEffect(() => {
    const livro = playback?.bookId;
    if (!livro || livroDoTocador() === livro) return;
    void abrirLivro(livro, getChapters(livro));
  }, [playback?.bookId]);

  /* Os capítulos chegam depois do primeiro desenho; quando chegam, o tocador
     precisa deles para traduzir posição (§4.142). */
  useEffect(() => {
    const aoChegar = () => {
      const livro = playback?.bookId;
      if (livro) void abrirLivro(livro, getChapters(livro));
    };
    window.addEventListener(CHAPTERS_EVENT, aoChegar);
    return () => window.removeEventListener(CHAPTERS_EVENT, aoChegar);
  }, [playback?.bookId]);

  /**
   * O botão da barrinha reflete o tocador, não um palpite.
   *
   * Quando o áudio pausa por conta própria — fim do livro, rede caindo, o
   * navegador recusando o autoplay — o desenho tem de acompanhar, senão a barra
   * mostra "tocando" em silêncio, que foi exatamente a queixa dele.
   */
  useEffect(() => {
    const aoMudar = () => {
      if (!temAudioDeVerdade()) return;
      const tocandoDeVerdade = !elementoDeAudio()?.paused;
      if (tocandoDeVerdade !== (readPlaying() ?? false)) savePlaying(tocandoDeVerdade);
    };
    window.addEventListener(TOCADOR_EVENT, aoMudar);
    return () => window.removeEventListener(TOCADOR_EVENT, aoMudar);
  }, []);

  /**
   * Com áudio de verdade, é o elemento que dita a posição guardada — inclusive
   * fora do player. Sem isto, minimizar congelaria o "onde parei" no último
   * segundo que a tela do player chegou a ver.
   */
  useEffect(() => {
    const audio = elementoDeAudio();
    if (!audio || !temAudioDeVerdade()) return;
    const guardar = () => {
      const atual = readPlayback();
      if (!atual) return;
      const posicao = posicaoNoLivro();
      if (Math.abs(posicao - atual.positionSec) < 5) return;
      savePlayback({
        bookId: atual.bookId,
        chapter: chapterAtSec(atual.bookId, posicao),
        positionSec: posicao,
        durationSec: atual.durationSec,
      });
    };
    audio.addEventListener("timeupdate", guardar);
    return () => audio.removeEventListener("timeupdate", guardar);
  }, [isPlaying, visible, location]);

  // Na tela cheia do player a barra não faz sentido: o player já está aberto.
  if (location.startsWith("/player")) return null;
  if (!visible || !playback) return null;

  const book = playbackBook();
  if (!book) return null;

  function close() {
    hideMiniPlayer();
  }

  function onPointerDown(event: React.PointerEvent) {
    // Botão e link têm o próprio comportamento; arrastar parte do corpo da barra.
    dragStart.current = { x: event.clientX, y: event.clientY };
    isHorizontal.current = false;
  }

  function onPointerMove(event: React.PointerEvent) {
    if (!dragStart.current) return;
    const deltaX = event.clientX - dragStart.current.x;
    const deltaY = event.clientY - dragStart.current.y;

    if (!isHorizontal.current) {
      // Enquanto não ficar claro que é horizontal, deixa a página rolar.
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        dragStart.current = null;
        return;
      }
      if (Math.abs(deltaX) < 8) return;
      isHorizontal.current = true;
    }

    dragXRef.current = deltaX;
    setDragX(deltaX);
  }

  function onPointerUp() {
    if (Math.abs(dragXRef.current) > SWIPE_THRESHOLD) {
      close();
    }
    dragXRef.current = 0;
    setDragX(0);
    dragStart.current = null;
    isHorizontal.current = false;
  }

  const percent = playbackPercent(playback);
  // Some aos poucos conforme a barra é arrastada, para o gesto dar retorno.
  const opacity = Math.max(0, 1 - Math.abs(dragX) / (SWIPE_THRESHOLD * 2));

  return (
    <div
      className="fixed bottom-[72px] left-4 right-4 z-40 animate-in slide-in-from-bottom-4 duration-300"
      style={{
        transform: `translateX(${dragX}px)`,
        opacity,
        transition: dragX === 0 ? "transform 200ms ease, opacity 200ms ease" : "none",
        touchAction: "pan-y",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      data-testid="mini-player"
    >
      <div className="bg-card/95 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl overflow-hidden">
        <div className="h-1 w-full bg-white/5">
          <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
        </div>

        <div className="flex items-center p-2 gap-3">
          <Link
            href={`/player/${book.id}`}
            className="flex flex-1 items-center gap-3 min-w-0"
            data-testid="link-mini-player-open"
          >
            <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 shadow-lg">
              <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white truncate">{book.title}</h4>
              <p className="text-[10px] text-white/40 truncate">
                Capítulo {playback.chapter} • {remainingLabel(playback)}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => {
                /*
                 * ⚠️ **Manda no tocador, não só no espelho** (31/08, §4.143).
                 * Antes isto só gravava "tocando" no `localStorage`; o áudio
                 * ficava por conta de um elemento que a tela do player tinha
                 * criado — e que morria ao minimizar. Resultado: a barrinha
                 * dizia "tocando" em silêncio, e apertar play ali recomeçava o
                 * livro do zero.
                 */
                const querTocar = !isPlaying;
                savePlaying(querTocar);
                if (!temAudioDeVerdade()) return;
                if (querTocar) void tocar().then((deu) => { if (!deu) savePlaying(false); });
                else pausar();
              }}
              className="p-2 text-white hover:text-primary transition-colors"
              aria-label={isPlaying ? "Pausar" : "Reproduzir"}
              data-testid="button-mini-player-play"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-0.5" />
              )}
            </button>
            <button
              onClick={close}
              className="p-2 text-white/40 hover:text-white transition-colors"
              aria-label="Fechar o player"
              data-testid="button-mini-player-close"
            >
              <X className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
