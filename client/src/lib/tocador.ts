/**
 * O tocador do AllBook — **um só, fora do React** (31/08, §4.143).
 *
 * 🚨 **Por que fora do React.** Na primeira versão (§4.142) o elemento de áudio
 * nascia dentro do `AudioPlayer`, num hook. Funcionava até a pessoa minimizar:
 * a tela desmonta, o `useEffect` limpa, e **o áudio morre junto** — o livro
 * pausava sozinho. Pior: ao apertar o play na barrinha, um elemento novo era
 * criado do zero e a escuta **voltava para o começo**, jogando fora os minutos
 * já ouvidos. Os dois defeitos eram o mesmo: som preso ao ciclo de vida de uma
 * tela.
 *
 * Aqui o elemento é do **módulo**. Ele nasce uma vez, atravessa navegação,
 * minimização e troca de tela, e só troca de conteúdo quando o livro muda.
 *
 * ## Quem fala com ele
 *
 * O `AudioPlayer` e o `MiniPlayer` — os dois, pela mesma porta. Nenhuma tela
 * cria `Audio` por conta própria, e nenhuma mexe em `currentTime` direto: quem
 * traduz entre "segundo do capítulo" e "segundo do livro" é este arquivo.
 *
 * ## Dois modos (§4.142)
 *
 * - `hls` — livro convertido pelo `npm run audio`: um fluxo só.
 * - `acervo` — os arquivos como estão no SSD, um por capítulo. É o modo de
 *   13.917 dos 13.917 livros hoje.
 */

import Hls from "hls.js";

import type { Chapter } from "./chapters";

export type ModoDoTocador = "hls" | "acervo";

export type SituacaoDoTocador =
  | "vazio"
  | "carregando"
  | "pronto"
  | "sem-narracao"
  | "precisa-entrar"
  | "limite-do-dia"
  | "erro";

/** Avisa que algo mudou: livro, situação, play/pause, posição. */
export const TOCADOR_EVENT = "allbook:tocador";

interface Estado {
  livroId: number | null;
  situacao: SituacaoDoTocador;
  modo: ModoDoTocador | null;
  recado: string | null;
}

let audio: HTMLAudioElement | null = null;
let hls: Hls | null = null;
let capitulos: Chapter[] = [];
/** Índice do capítulo carregado no elemento, no modo `acervo`. */
let capituloAtual = 0;
/** Cresce a cada `abrir`: respostas de um livro antigo são descartadas. */
let geracao = 0;

const estado: Estado = { livroId: null, situacao: "vazio", modo: null, recado: null };

/**
 * 🚨 **Verdadeira só durante a virada de capítulo** (01/09, §4.155).
 *
 * No modo `acervo` cada capítulo é um arquivo, então virar é trocar o `src` — e
 * um elemento que acabou de trocar de `src` fica **pausado** por alguns
 * milissegundos, até o arquivo novo carregar. A tela espelha esse `paused`: via
 * "pausado", mandava `pausar()` de volta, e esse `pause()` **abortava** o
 * `play()` do capítulo novo (`AbortError: interrupted by a call to pause()`).
 * O livro parava no começo de cada capítulo, que era a queixa dele.
 *
 * Enquanto ela está de pé, `estaTocando()` responde **"tocando"** — porque é o
 * que está acontecendo, do ponto de vista de quem ouve.
 */
let virandoDeCapitulo = false;

/* -------------------------------------------------------------------------- */
/* Uma aba de cada vez (31/08, §4.144)                                         */
/* -------------------------------------------------------------------------- */

/**
 * 🚨 **Duas abas do AllBook tocando ao mesmo tempo é o pior dos mundos**, e foi
 * o que ele encontrou: começou um livro numa janela, foi tocar noutra, e a
 * primeira "pausou e voltou para o início".
 *
 * A raiz é que as abas dividem o `localStorage` — o "onde parei" é um registro
 * só. Duas escutas correndo escrevem por cima uma da outra, e o resultado é
 * imprevisível por natureza: não dá para guardar duas posições diferentes do
 * mesmo livro no mesmo lugar.
 *
 * A saída é a de todo app de áudio (Spotify, Audible, YouTube): **quem aperta
 * play assume**, e as outras abas pausam — sem perder o lugar delas, que
 * continua na escuta, não no registro compartilhado.
 */
const DONO_KEY = "allbook_tocador_dono";
/** Identidade desta aba. Vive só na memória: recarregar cria outra, e deve. */
const ESTA_ABA = Math.random().toString(36).slice(2);

function assumirReproducao() {
  try {
    localStorage.setItem(DONO_KEY, JSON.stringify({ aba: ESTA_ABA, em: Date.now() }));
  } catch {
    /* sem storage, cada aba toca por sua conta — pior, mas não quebra */
  }
}

function souODono(): boolean {
  try {
    const cru = localStorage.getItem(DONO_KEY);
    if (!cru) return true;
    return (JSON.parse(cru) as { aba?: string }).aba === ESTA_ABA;
  } catch {
    return true;
  }
}

/*
 * O aviso entre abas: `storage` só dispara nas OUTRAS abas, que é exatamente
 * quem precisa ouvir. A aba que assumiu não se pausa sozinha.
 */
if (typeof window !== "undefined") {
  window.addEventListener("storage", (evento) => {
    if (evento.key !== DONO_KEY) return;
    if (souODono()) return;
    if (audio && !audio.paused) {
      // Pausa, mas NÃO mexe na posição: quem voltar para esta aba continua de
      // onde estava. Zerar aqui era metade da queixa dele.
      audio.pause();
      avisar();
    }
  });
}

function avisar() {
  window.dispatchEvent(new CustomEvent(TOCADOR_EVENT));
}

function comecoDe(indice: number): number {
  return capitulos.slice(0, indice).reduce((soma, c) => soma + (c.durationSec ?? 0), 0);
}

function ondeCai(segundos: number): { indice: number; dentro: number } {
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

function soltarElemento() {
  hls?.destroy();
  hls = null;
  if (audio) {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }
  audio = null;
}

/**
 * Prepara este livro para tocar. Chamar de novo com o **mesmo** livro não faz
 * nada — é o que permite o player e a barrinha chamarem à vontade sem
 * reiniciar a escuta (era esse reinício que voltava o livro para o começo).
 */
export async function abrirLivro(livroId: number, lista: Chapter[]): Promise<void> {
  if (estado.livroId === livroId) {
    // Só atualiza os capítulos: eles chegam depois, e a tradução depende deles.
    if (lista.length > 0) capitulos = lista;
    return;
  }

  const minha = ++geracao;
  soltarElemento();
  capitulos = lista;
  capituloAtual = 0;
  estado.livroId = livroId;
  estado.situacao = "carregando";
  estado.modo = null;
  estado.recado = null;
  avisar();

  let resposta: Response;
  try {
    /* `include` + `no-store`: as duas armadilhas da §4.139 — sem o primeiro o
       cookie não vai (401 em tudo), sem o segundo o navegador guarda esse 401
       e o pedido para de sair. */
    resposta = await fetch(`/api/audio/${livroId}/situacao`, {
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    if (minha === geracao) {
      estado.situacao = "erro";
      avisar();
    }
    return;
  }
  if (minha !== geracao) return;

  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => ({}) as Record<string, unknown>);
    if (minha !== geracao) return;
    estado.recado = typeof corpo.erro === "string" ? corpo.erro : null;
    estado.situacao =
      resposta.status === 404
        ? "sem-narracao"
        : resposta.status === 401
          ? "precisa-entrar"
          : resposta.status === 429
            ? "limite-do-dia"
            : "erro";
    avisar();
    return;
  }

  const dados = (await resposta.json()) as { modo?: ModoDoTocador };
  if (minha !== geracao) return;

  const elemento = new Audio();
  elemento.preload = "auto";
  audio = elemento;

  if (dados.modo === "hls") {
    const url = `/api/audio/${livroId}/lista.m3u8`;
    if (Hls.isSupported()) {
      hls = new Hls({ xhrSetup: (xhr) => { xhr.withCredentials = true; } });
      hls.loadSource(url);
      hls.attachMedia(elemento);
      hls.on(Hls.Events.ERROR, (_e, d) => {
        if (d.fatal && minha === geracao) {
          estado.situacao = "erro";
          estado.recado = "A narração parou de chegar. Tente de novo.";
          avisar();
        }
      });
    } else {
      elemento.src = url; // Safari toca HLS nativo
    }
    estado.modo = "hls";
  } else {
    elemento.src = `/api/audio/${livroId}/capitulo/1`;
    estado.modo = "acervo";
  }

  /* Virar de capítulo é trocar o arquivo — sem isto o livro para no fim de cada
     capítulo, que no acervo pode ser a cada 3 minutos. */
  elemento.addEventListener("ended", () => {
    if (estado.modo !== "acervo") return;
    const proximo = capituloAtual + 1;
    if (proximo >= capitulos.length) {
      avisar(); // fim do livro: a tela precisa saber que parou
      return;
    }
    capituloAtual = proximo;

    /* A bandeira sobe ANTES do `src` novo e só cai quando o áudio volta a
       correr: é ela que impede a tela de mandar pausar no meio da troca. */
    virandoDeCapitulo = true;
    avisar(); // o rótulo do capítulo muda na hora, sem esperar o som

    elemento.src = `/api/audio/${estado.livroId}/capitulo/${proximo + 1}`;

    const acabou = () => {
      if (!virandoDeCapitulo) return;
      virandoDeCapitulo = false;
      avisar();
    };
    /* Rede de segurança: se o arquivo novo nunca carregar, a bandeira não pode
       ficar de pé para sempre, senão o botão mostraria "tocando" em silêncio. */
    setTimeout(acabou, 15000);

    void elemento
      .play()
      .then(acabou)
      .catch(() => {
        /* Trocar o `src` dispara um `load()`, e um `play()` pedido no mesmo
           instante pode ser abortado por ele. A segunda tentativa — já com o
           arquivo pronto — é a que vale. */
        elemento.addEventListener(
          "canplay",
          () => {
            void elemento.play().catch(() => {});
            acabou();
          },
          { once: true },
        );
      });
  });
  elemento.addEventListener("play", avisar);
  elemento.addEventListener("pause", avisar);

  estado.situacao = "pronto";
  avisar();
}

/** O elemento, para quem precisa escutar `timeupdate` ou mexer na velocidade. */
export function elementoDeAudio(): HTMLAudioElement | null {
  return audio;
}

export function situacaoDoTocador(): SituacaoDoTocador {
  return estado.situacao;
}

export function modoDoTocador(): ModoDoTocador | null {
  return estado.modo;
}

export function recadoDoTocador(): string | null {
  return estado.recado;
}

export function livroDoTocador(): number | null {
  return estado.livroId;
}

export function temAudioDeVerdade(): boolean {
  return estado.situacao === "pronto" && audio !== null;
}

/**
 * ⚠️ **Quem quer saber se o livro está correndo pergunta AQUI**, e não a
 * `elementoDeAudio()?.paused`: no meio da virada de capítulo o elemento está
 * pausado por um instante, e quem lê o elemento cru conclui que a pessoa
 * pausou. Foi assim que a tela matava a virada (§4.155).
 */
export function estaTocando(): boolean {
  if (virandoDeCapitulo) return true;
  return audio !== null && !audio.paused;
}

/**
 * Onde a escuta está, em segundos **do livro**.
 *
 * ⚠️ No modo `acervo`, `audio.currentTime` é a posição dentro do CAPÍTULO.
 * Quem chamar o elemento direto vai ler o número errado — é para isso que esta
 * função existe.
 */
export function posicaoNoLivro(): number {
  if (!audio) return 0;
  if (estado.modo !== "acervo") return audio.currentTime;
  return comecoDe(capituloAtual) + audio.currentTime;
}

/** Leva a escuta a um segundo **do livro**, trocando de capítulo se preciso. */
export function irPara(segundosNoLivro: number): void {
  if (!audio) return;
  if (estado.modo !== "acervo") {
    audio.currentTime = segundosNoLivro;
    return;
  }
  const { indice, dentro } = ondeCai(segundosNoLivro);
  if (indice !== capituloAtual) {
    const tocava = !audio.paused;
    capituloAtual = indice;
    const elemento = audio;
    elemento.src = `/api/audio/${estado.livroId}/capitulo/${indice + 1}`;
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
  if (Math.abs(audio.currentTime - dentro) > 1.5) audio.currentTime = dentro;
}

/**
 * Toca. Devolve `false` quando o navegador recusa — e recusar é o normal
 * enquanto a pessoa não tocou na tela; não é erro, é o botão voltando para
 * "pausado" para ela apertar.
 */
export async function tocar(): Promise<boolean> {
  if (!audio) return false;
  // Assumir ANTES de tocar: se as outras abas só soubessem depois, haveria uma
  // janela em que duas escutas correriam juntas.
  assumirReproducao();
  try {
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

export function pausar(): void {
  audio?.pause();
}

/** A velocidade escolhida em Configurações e no player. */
export function definirVelocidade(v: number): void {
  if (audio) audio.playbackRate = v;
}
