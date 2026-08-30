/**
 * O tocador de verdade — o que faz o AllBook sair som (30/08, §4.139).
 *
 * Até hoje o player era um **cronômetro**: um `setInterval` somava 1s por
 * segundo em `currentTime`, a barra andava, o capítulo virava, e não havia
 * áudio nenhum. A entrega existia no servidor desde 08/08 (§4.130) e nenhuma
 * tela a pedia.
 *
 * ## O que este hook faz, e o que ele NÃO faz
 *
 * Ele cuida do **elemento de áudio**: descobre se o livro tem narração, liga o
 * HLS, e devolve o elemento pronto. Quem manda em play/pause, posição e
 * velocidade continua sendo o `AudioPlayer` — este hook não conhece a tela.
 *
 * ⚠️ **O cronômetro NÃO foi removido, e não pode ser.** Dos 13.917 livros do
 * acervo, **um** tem áudio ingerido hoje. Tirar o relógio deixaria o player de
 * todos os outros parado, mudo e sem barra andando — pior do que está. Enquanto
 * `temAudio` for falso, o player segue no cronômetro; quando for verdadeiro,
 * quem dá a hora é o elemento.
 *
 * ## Por que HLS e não um arquivo só
 *
 * O servidor entrega o livro em pedaços de ~6s e **confere a sessão a cada
 * pedaço** (§4.130) — é assim que o acervo não sai pela porta. Um `<audio
 * src="livro.mp3">` seria o arquivo inteiro exposto num endereço.
 *
 * ⚠️ **O Safari toca HLS sozinho e o hls.js não funciona nele** — no iPhone
 * (que é o alvo do app) o caminho é `audio.src = <a lista>` e pronto. Nos
 * outros navegadores é o hls.js que traduz. Os dois caminhos estão aqui, e é
 * `Hls.isSupported()` que escolhe.
 */

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

export type SituacaoDoTocador =
  /** Ainda perguntando ao servidor. */
  | "carregando"
  /** Há narração e o elemento está pronto. */
  | "pronto"
  /** O livro não tem narração ingerida — é o caso de quase todo o acervo. */
  | "sem-narracao"
  /** Precisa entrar na conta para ouvir (§4.130: ouvir exige sessão). */
  | "precisa-entrar"
  /** Bateu o limite de livros por dia. */
  | "limite-do-dia"
  /** Deu errado de um jeito que a tela precisa contar. */
  | "erro";

export interface Tocador {
  /** O elemento de áudio, ou `null` enquanto não há narração. */
  audio: HTMLAudioElement | null;
  situacao: SituacaoDoTocador;
  /** Mensagem do servidor, quando há uma para mostrar. */
  recado: string | null;
  /** Atalho: dá para contar com o elemento para marcar a hora? */
  temAudio: boolean;
}

export function useTocador(livroId: number): Tocador {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [situacao, setSituacao] = useState<SituacaoDoTocador>("carregando");
  const [recado, setRecado] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    const lista = `/api/audio/${livroId}/lista.m3u8`;

    async function ligar() {
      setSituacao("carregando");
      setRecado(null);

      /*
       * Pergunta ANTES de montar o HLS. Sem isto, o hls.js receberia um JSON de
       * erro no lugar da lista e diria "manifesto inválido" — mensagem que não
       * ajuda ninguém a entender que o livro só não tem narração ainda.
       */
      let resposta: Response;
      try {
        /*
         * ⚠️ **`include`, e não `same-origin`.** A primeira versão usou
         * `same-origin` e o servidor devolveu **401 em tudo** — o cookie de
         * sessão não ia junto. O `lib/auth.ts` já avisava disso desde 08/08,
         * com estas palavras: "sem ele o navegador não manda o cookie de
         * sessão". A casa inteira usa `include`; este fetch é que era o
         * forasteiro.
         *
         * ⚠️ **`cache: "no-store"` pelo mesmo motivo prático:** enquanto o
         * `same-origin` estava lá, o navegador guardou o **401** e passou a
         * respondê-lo do cache — o pedido não saía mais, o servidor não
         * registrava nada, e o conserto parecia não ter funcionado. A lista é
         * privada e por sessão (o servidor manda `private, no-store`); guardar
         * a resposta nunca foi certo.
         */
        resposta = await fetch(lista, { credentials: "include", cache: "no-store" });
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

      const elemento = new Audio();
      elemento.preload = "auto";
      audioRef.current = elemento;

      if (Hls.isSupported()) {
        const hls = new Hls({
          // A lista já vem inteira do servidor e o livro não muda enquanto toca.
          xhrSetup: (xhr) => {
            xhr.withCredentials = true;
          },
        });
        hlsRef.current = hls;
        hls.loadSource(lista);
        hls.attachMedia(elemento);
        hls.on(Hls.Events.ERROR, (_evento, dados) => {
          // Só o que é fatal vira estado: o hls.js se recupera sozinho de falha
          // de um pedaço, e transformar isso em tela de erro faria o livro
          // "quebrar" por causa de um segundo de rede ruim.
          if (dados.fatal && vivo) {
            setSituacao("erro");
            setRecado("A narração parou de chegar. Tente de novo.");
          }
        });
      } else {
        // Safari: HLS nativo.
        elemento.src = lista;
      }

      if (!vivo) return;
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
    };
  }, [livroId]);

  return {
    audio,
    situacao,
    recado,
    temAudio: situacao === "pronto",
  };
}
