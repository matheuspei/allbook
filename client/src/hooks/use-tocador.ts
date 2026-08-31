/**
 * A ponte React para o tocador (`lib/tocador.ts`).
 *
 * ⚠️ **O áudio NÃO mora aqui** (31/08, §4.143). Ele morava, e era esse o
 * defeito: minimizar o player desmontava a tela, o `useEffect` limpava e o som
 * morria junto; a barrinha então criava um elemento novo e a escuta voltava ao
 * começo. Agora o elemento é do módulo, e este hook só **assina** as mudanças e
 * redesenha — desmontar uma tela não desliga mais nada.
 */

import { useCallback, useEffect, useState } from "react";

import type { Chapter } from "@/lib/chapters";
import {
  TOCADOR_EVENT,
  abrirLivro,
  elementoDeAudio,
  estaTocando,
  irPara,
  modoDoTocador,
  posicaoNoLivro,
  recadoDoTocador,
  situacaoDoTocador,
  temAudioDeVerdade,
  type ModoDoTocador,
  type SituacaoDoTocador,
} from "@/lib/tocador";

export interface Tocador {
  audio: HTMLAudioElement | null;
  situacao: SituacaoDoTocador;
  modo: ModoDoTocador | null;
  recado: string | null;
  temAudio: boolean;
  tocando: boolean;
  posicaoNoLivro: () => number;
  irPara: (segundosNoLivro: number) => void;
}

export function useTocador(livroId: number, capitulos: Chapter[]): Tocador {
  const [, redesenhar] = useState(0);

  useEffect(() => {
    const aoMudar = () => redesenhar((n) => n + 1);
    window.addEventListener(TOCADOR_EVENT, aoMudar);
    return () => window.removeEventListener(TOCADOR_EVENT, aoMudar);
  }, []);

  /*
   * ⚠️ **Nada de cleanup soltando o áudio.** `abrirLivro` já ignora a chamada
   * quando o livro é o mesmo, então trocar de tela não reinicia a escuta — e é
   * justamente por não haver "return () => parar()" aqui que o livro continua
   * tocando com o player minimizado.
   */
  useEffect(() => {
    void abrirLivro(livroId, capitulos);
  }, [livroId, capitulos]);

  return {
    audio: elementoDeAudio(),
    situacao: situacaoDoTocador(),
    modo: modoDoTocador(),
    recado: recadoDoTocador(),
    temAudio: temAudioDeVerdade(),
    tocando: estaTocando(),
    posicaoNoLivro: useCallback(() => posicaoNoLivro(), []),
    irPara: useCallback((s: number) => irPara(s), []),
  };
}
