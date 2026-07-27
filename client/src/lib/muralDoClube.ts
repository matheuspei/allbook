/**
 * O mural do clube — a conversa da turma, com a regra de spoiler do grupo.
 *
 * **Diferente da sala do livro, e a diferença é o combinado.** Na sala, cada
 * comentário é preso a um **segundo** do áudio e a trava é individual: você lê o
 * que já ouviu. No clube existe um acordo coletivo — "nada além do capítulo 6
 * até dia 10" —, então aqui a unidade é o **capítulo**, e a mensagem que fala
 * de capítulo à frente do seu chega velada, com o número à mostra. É mais
 * simples de entender e é o que os clubes de verdade combinam entre si
 * (ROTEIRO 4.39).
 *
 * **O moderador aparece aqui.** Ele pode esconder uma mensagem e, sobretudo,
 * **marcar como spoiler o que alguém postou sem marcar** — o poder mais usado
 * na prática, e a razão de a moderação entrar na fundação em vez da última
 * fase. Sem servidor, o efeito vale neste aparelho; a tela diz isso.
 */

import { community } from "@/lib/community";
import { EU } from "@/lib/clubes";

export const MURAL_EVENT = "allbook:mural";

export interface MensagemDoClube {
  id: string;
  clubeId: string;
  autorSlug: string;
  texto: string;
  /** ISO completo — o mural é cronológico, do mais antigo para o mais novo. */
  data: string;
  /**
   * De que capítulo a mensagem fala. Ausente = conversa geral (combinar
   * horário, dar oi, falar da narração) e todo mundo lê.
   */
  capitulo?: number;
  /** Marcado como spoiler — por quem escreveu ou pelo moderador. */
  spoiler?: boolean;
}

/** Mensagens do esqueleto: dão o que ver num mural que ninguém escreveu ainda. */
const semeadas: MensagemDoClube[] = [
  {
    id: "m1",
    clubeId: "misterio",
    autorSlug: "ana-paula",
    texto:
      "Combinado desta semana: até o capítulo 6. Quem passar, segura o dedo e não conta nada aqui 🙂",
    data: "2026-07-24T09:12:00.000Z",
  },
  {
    id: "m2",
    clubeId: "misterio",
    autorSlug: "carla-lima",
    texto: "Terminei o 6 no ônibus e quase perdi o ponto. Alguém no mesmo pedaço?",
    data: "2026-07-25T18:40:00.000Z",
    capitulo: 6,
  },
  {
    id: "m3",
    clubeId: "misterio",
    autorSlug: "ricardo",
    texto: "Estou no 5. Amanhã alcanço vocês.",
    data: "2026-07-25T20:05:00.000Z",
    capitulo: 5,
  },
  {
    id: "m4",
    clubeId: "misterio",
    autorSlug: "juliana-s",
    texto:
      "A revelação do capítulo 9 muda o sentido de tudo o que a narradora disse até aqui. Marquei como spoiler para não estragar de ninguém.",
    data: "2026-07-26T22:15:00.000Z",
    capitulo: 9,
    spoiler: true,
  },
  {
    id: "m5",
    clubeId: "habitos",
    autorSlug: "luciana",
    texto:
      "Pergunta da semana: o que você mudou na sua rotina depois dos três primeiros capítulos? Vale responder com uma frase só.",
    data: "2026-07-25T08:00:00.000Z",
  },
  {
    id: "m6",
    clubeId: "habitos",
    autorSlug: "felipe-g",
    texto: "Passei a ouvir 20 minutos enquanto lavo a louça. Não é muito, mas virou todo dia.",
    data: "2026-07-25T21:30:00.000Z",
    capitulo: 3,
  },
  {
    id: "m7",
    clubeId: "madrugada",
    autorSlug: "beto",
    texto: "Regra da casa: nada de ouvir com fone no escuro sozinho. (Mentira, é exatamente isso.)",
    data: "2026-07-23T23:50:00.000Z",
  },
];

/* ------------------------------------------------------------------ *
 * O que é seu / o que você moderou fica no navegador.
 * ------------------------------------------------------------------ */

const CHAVE = "allbook_mural";

interface EstadoDoMural {
  minhas: MensagemDoClube[];
  /** Ids escondidos pelo moderador (você, nos seus clubes). */
  ocultas: string[];
  /** Ids que o moderador marcou como spoiler depois de publicados. */
  marcadasComoSpoiler: string[];
}

const VAZIO: EstadoDoMural = { minhas: [], ocultas: [], marcadasComoSpoiler: [] };

function readEstado(): EstadoDoMural {
  try {
    const guardado = JSON.parse(localStorage.getItem(CHAVE) || "null");
    if (!guardado || typeof guardado !== "object") return VAZIO;
    return {
      minhas: Array.isArray(guardado.minhas) ? guardado.minhas : [],
      ocultas: Array.isArray(guardado.ocultas) ? guardado.ocultas : [],
      marcadasComoSpoiler: Array.isArray(guardado.marcadasComoSpoiler)
        ? guardado.marcadasComoSpoiler
        : [],
    };
  } catch {
    return VAZIO;
  }
}

function salvar(estado: EstadoDoMural): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    /* idem ao resto: sem storage, a tela já mostrou o efeito */
  }
  window.dispatchEvent(new Event(MURAL_EVENT));
}

/** Quanto cabe numa mensagem de mural. Conversa, não ensaio. */
export const MAX_MENSAGEM = 500;

/**
 * As mensagens de um clube, da mais antiga para a mais nova.
 *
 * Cronológico ao contrário da sala do livro (que ordena por engajamento):
 * mural é diálogo, e resposta antes da pergunta não se entende.
 */
export function mensagensDoClube(clubeId: string): MensagemDoClube[] {
  const estado = readEstado();
  const todas = [...semeadas, ...estado.minhas].filter((item) => item.clubeId === clubeId);

  return todas
    .filter((item) => !estado.ocultas.includes(item.id))
    .map((item) =>
      estado.marcadasComoSpoiler.includes(item.id) ? { ...item, spoiler: true } : item,
    )
    .sort((a, b) => a.data.localeCompare(b.data));
}

/** Quantas mensagens o clube tem — o número que a lista de clubes mostra. */
export function totalDoMural(clubeId: string): number {
  return mensagensDoClube(clubeId).length;
}

export function publicarNoMural(
  clubeId: string,
  texto: string,
  opcoes: { capitulo?: number; spoiler?: boolean } = {},
): void {
  const limpo = texto.trim().slice(0, MAX_MENSAGEM);
  if (!limpo) return;

  const estado = readEstado();
  const mensagem: MensagemDoClube = {
    id: `mm-${Date.now()}`,
    clubeId,
    autorSlug: EU,
    texto: limpo,
    data: new Date().toISOString(),
    ...(opcoes.capitulo !== undefined ? { capitulo: opcoes.capitulo } : {}),
    ...(opcoes.spoiler ? { spoiler: true } : {}),
  };

  salvar({ ...estado, minhas: [...estado.minhas, mensagem] });
}

export function apagarMinhaMensagem(id: string): void {
  const estado = readEstado();
  salvar({ ...estado, minhas: estado.minhas.filter((item) => item.id !== id) });
}

/* ------------------------------------------------------------------ *
 * Poderes do moderador.
 * ------------------------------------------------------------------ */

export function esconderMensagem(id: string): void {
  const estado = readEstado();
  if (estado.ocultas.includes(id)) return;
  salvar({ ...estado, ocultas: [...estado.ocultas, id] });
}

/**
 * Marcar como spoiler o que alguém publicou sem marcar.
 *
 * É o poder que o moderador mais usa: quase ninguém posta spoiler de
 * má-fé — posta distraído. Esconder a mensagem inteira seria punição
 * desproporcional; cobrir o texto resolve e mantém a conversa.
 */
export function marcarComoSpoiler(id: string): void {
  const estado = readEstado();
  if (estado.marcadasComoSpoiler.includes(id)) return;
  salvar({ ...estado, marcadasComoSpoiler: [...estado.marcadasComoSpoiler, id] });
}

export function desfazerModeracao(id: string): void {
  const estado = readEstado();
  salvar({
    ...estado,
    ocultas: estado.ocultas.filter((item) => item !== id),
    marcadasComoSpoiler: estado.marcadasComoSpoiler.filter((item) => item !== id),
  });
}

/** Quantas mensagens você escondeu neste clube — para poder devolvê-las. */
export function escondidasDoClube(clubeId: string): MensagemDoClube[] {
  const estado = readEstado();
  return [...semeadas, ...estado.minhas].filter(
    (item) => item.clubeId === clubeId && estado.ocultas.includes(item.id),
  );
}

/** O nome de quem escreveu, resolvido. */
export function autorDaMensagem(mensagem: MensagemDoClube): string {
  if (mensagem.autorSlug === EU) return "Você";
  return community.find((membro) => membro.slug === mensagem.autorSlug)?.name ?? "Alguém";
}
