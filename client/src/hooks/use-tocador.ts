/**
 * O tocador — o que faz o AllBook sair som (30/08 §4.139, reescrito em 31/08
 * §4.142).
 *
 * ## Dois modos, e o segundo é o que faz o acervo tocar hoje
 *
 * - **`hls`** — o livro passou pelo `npm run audio`: virou segmentos de ~6s e
 *   toca como um fluxo só. É o formato de **entrega remota**, para quando o
 *   áudio subir para a nuvem.
 * - **`acervo`** — o livro **não** foi convertido, e não precisa: os arquivos
 *   já estão no SSD, um por capítulo, e o servidor os entrega assim. Foi o que
 *   destravou os 13.917 livros: converter o acervo inteiro daria **840 GB ao
 *   lado dos 1,34 TB que já existem**, num disco com 179 GB livres.
 *
 * ## O que muda entre os dois, e por que este arquivo existe
 *
 * No `hls` o elemento toca o livro inteiro: `audio.currentTime` **é** a posição
 * no livro. No `acervo` cada capítulo é um arquivo, e `currentTime` é a posição
 * **dentro do capítulo** — a posição no livro é `início do capítulo +
 * currentTime`, e passar de capítulo significa trocar o `src`.
 *
 * ⚠️ **Toda a tela continua falando em "segundo do livro".** É este hook que
 * traduz, nas duas direções (`posicaoNoLivro` e `irPara`); sem isso, cada tela
 * que mexe no tempo — barra, ±30s, retomar, citação — precisaria conhecer a
 * diferença, e uma delas esqueceria.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";

import type { Chapter } from "@/lib/chapters";

export type ModoDoTocador = "hls" | "acervo";

export type SituacaoDoTocador =
  | "carregando"
  | "pronto"
  /** O livro não tem narração — a tela deve oferecer o pedido, não um player mudo. */
  | "sem-narracao"
  | "precisa-entrar"
  | "limite-do-dia"
  | "erro";

export interface Tocador {
  audio: HTMLAudioElement | null;
  situacao: SituacaoDoTocador;
  modo: ModoDoTocador | null;
  recado: string | null;
  temAudio: boolean;
  /** Onde a escuta está, em segundos **do livro**. */
  posicaoNoLivro: () => number;
  /** Leva a escuta para um segundo **do livro**, trocando de capítulo se preciso. */
  irPara: (segundosNoLivro: number) => void;
}

/** Em que capítulo cai um segundo do livro, e quanto sobra dentro dele. */
function ondeCai(capitulos: Chapter[], segundos: number): { indice: number; dentro: number } {
  let acumulado = 0;
  for (let i = 0; i < capitulos.length; i++) {
    const dura = capitulos[i].durationSec ?? 0;
    if (segundos < acumulado + dura || i === capitulos.length - 1) {
      return { indice: i, dentro: Math.max(0, segundos - acumulado) };
    }
    acumulado += dura;
  }
  return { indice: 0, dentro: 0 };
}

/** Em que segundo do livro começa o capítulo de índice `i`. */
function comecoDe(capitulos: Chapter[], i: number): number {
  return capitulos.slice(0, i).reduce((soma, c) => soma + (c.durationSec ?? 0), 0);
}

export function useTocador(livroId: number, capitulos: Chapter[]): Tocador {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [situacao, setSituacao] = useState<SituacaoDoTocador>("carregando");
  const [modo, setModo] = useState<ModoDoTocador | null>(null);
  const [recado, setRecado] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  /** Qual capítulo está carregado no elemento, no modo `acervo`. */
  const capituloRef = useRef(0);
  /** A lista mais recente, para os callbacks não fecharem sobre uma antiga. */
  const capitulosRef = useRef<Chapter[]>(capitulos);
  capitulosRef.current = capitulos;

  useEffect(() => {
    let vivo = true;

    async function ligar() {
      setSituacao("carregando");
      setRecado(null);

      let resposta: Response;
      try {
        /*
         * ⚠️ `include` e `no-store`, as duas armadilhas da §4.139: com
         * `same-origin` o cookie de sessão não vai (401 em tudo), e sem
         * `no-store` o navegador guarda esse 401 e o pedido para de sair.
         */
        resposta = await fetch(`/api/audio/${livroId}/situacao`, {
          credentials: "include",
          cache: "no-store",
        });
      } catch {
        if (vivo) setSituacao("erro");
        return;
      }
      if (!vivo) return;

      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => ({}) as Record<string, unknown>);
        if (!vivo) return;
        setRecado(typeof corpo.erro === "string" ? corpo.erro : null);
        if (resposta.status === 404) setSituacao("sem-narracao");
        else if (resposta.status === 401) setSituacao("precisa-entrar");
        else if (resposta.status === 429) setSituacao("limite-do-dia");
        else setSituacao("erro");
        return;
      }

      const dados = (await resposta.json()) as { modo?: ModoDoTocador };
      if (!vivo) return;

      const elemento = new Audio();
      elemento.preload = "auto";
      audioRef.current = elemento;
      capituloRef.current = 0;

      if (dados.modo === "hls") {
        const lista = `/api/audio/${livroId}/lista.m3u8`;
        if (Hls.isSupported()) {
          const hls = new Hls({ xhrSetup: (xhr) => { xhr.withCredentials = true; } });
          hlsRef.current = hls;
          hls.loadSource(lista);
          hls.attachMedia(elemento);
          hls.on(Hls.Events.ERROR, (_e, d) => {
            if (d.fatal && vivo) {
              setSituacao("erro");
              setRecado("A narração parou de chegar. Tente de novo.");
            }
          });
        } else {
          elemento.src = lista; // Safari toca HLS sozinho
        }
        setModo("hls");
      } else {
        // Modo acervo: começa no primeiro capítulo; quem manda depois é `irPara`.
        elemento.src = `/api/audio/${livroId}/capitulo/1`;
        setModo("acervo");
      }

      setAudio(elemento);
      setSituacao("pronto");
    }

    void ligar();

    return () => {
      vivo = false;
      hlsRef.current?.destroy();
      hlsRef.current = null;
      const elemento = audioRef.current;
      if (elemento) {
        elemento.pause();
        elemento.removeAttribute("src");
        elemento.load();
      }
      audioRef.current = null;
      setAudio(null);
      setModo(null);
    };
  }, [livroId]);

  /**
   * No modo `acervo`, virar de capítulo é trocar o arquivo — e o `<audio>`
   * esquece que estava tocando. Guardar isso aqui é o que faz o livro seguir
   * sozinho de um capítulo para o outro.
   */
  useEffect(() => {
    const elemento = audio;
    if (!elemento || modo !== "acervo") return;
    const aoAcabar = () => {
      const proximo = capituloRef.current + 1;
      if (proximo >= capitulosRef.current.length) return;
      capituloRef.current = proximo;
      elemento.src = `/api/audio/${livroId}/capitulo/${proximo + 1}`;
      void elemento.play().catch(() => {});
    };
    elemento.addEventListener("ended", aoAcabar);
    return () => elemento.removeEventListener("ended", aoAcabar);
  }, [audio, modo, livroId]);

  const posicaoNoLivro = useCallback(() => {
    const elemento = audioRef.current;
    if (!elemento) return 0;
    if (modo !== "acervo") return elemento.currentTime;
    return comecoDe(capitulosRef.current, capituloRef.current) + elemento.currentTime;
  }, [modo]);

  const irPara = useCallback(
    (segundosNoLivro: number) => {
      const elemento = audioRef.current;
      if (!elemento) return;
      if (modo !== "acervo") {
        elemento.currentTime = segundosNoLivro;
        return;
      }
      const { indice, dentro } = ondeCai(capitulosRef.current, segundosNoLivro);
      if (indice !== capituloRef.current) {
        const tocava = !elemento.paused;
        capituloRef.current = indice;
        elemento.src = `/api/audio/${livroId}/capitulo/${indice + 1}`;
        // O `src` novo só aceita posição depois de ter metadados.
        elemento.addEventListener(
          "loadedmetadata",
          () => {
            elemento.currentTime = dentro;
            if (tocava) void elemento.play().catch(() => {});
          },
          { once: true },
        );
        return;
      }
      if (Math.abs(elemento.currentTime - dentro) > 1.5) elemento.currentTime = dentro;
    },
    [modo, livroId],
  );

  return {
    audio,
    situacao,
    modo,
    recado,
    temAudio: situacao === "pronto",
    posicaoNoLivro,
    irPara,
  };
}
