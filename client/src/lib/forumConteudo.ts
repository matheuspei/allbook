/**
 * **Enquetes e eventos** de uma comunidade — as duas outras abas que o Orkut
 * tinha, ao lado dos fóruns.
 *
 * O Matheus citou as três na mesma frase quando listou os poderes do moderador
 * (*"travar a criação de tópicos, enquetes e eventos"*), e a trava já existia em
 * `forum.ts` antes de haver o que travar. Isto é o que faltava do outro lado.
 *
 * ---
 *
 * **Como o Orkut fazia, e é o que está aqui:**
 *
 * - **Enquete** — pergunta, de 2 a 10 opções, **um voto por pessoa**, resultado
 *   em barra com porcentagem, e o voto **muda de ideia** (dava para trocar).
 *   Quem criou fecha a enquete quando quiser.
 * - **Evento** — título, data, hora, local e descrição, com as três respostas de
 *   lá: **vou · talvez · não vou**. O criador cancela.
 *
 * **Tudo é seu ou semeado, como o resto do app.** Os votos e as confirmações dos
 * leitores fictícios são **estáveis** (semente pelo id): enquete que começa
 * zerada não mostra o que uma enquete é, e número que dança a cada desenho é
 * interface mentindo.
 */

import { EU } from "@/lib/clubes";
import { community } from "@/lib/community";
import { GRUPOS_EVENT } from "@/lib/grupos";

const ENQUETES_CHAVE = "allbook_forum_enquetes";
const VOTOS_CHAVE = "allbook_forum_votos";
const EVENTOS_CHAVE = "allbook_forum_eventos";
const PRESENCAS_CHAVE = "allbook_forum_presencas";

export const MAX_PERGUNTA = 200;
export const MAX_OPCAO = 80;
export const MAX_OPCOES = 10;
export const MIN_OPCOES = 2;

/* ------------------------------------------------------------------ *
 * Enquetes
 * ------------------------------------------------------------------ */

export interface Enquete {
  id: string;
  grupoId: string;
  pergunta: string;
  opcoes: string[];
  /** Slug de quem criou. Ausente = você. */
  autorSlug?: string;
  date: string;
  fechada?: boolean;
}

/** As enquetes semeadas — para a aba não nascer vazia (a régua da §4.23). */
const SEMEADAS: Enquete[] = [
  {
    id: "e-esq-1",
    grupoId: "suspense-misterio",
    pergunta: "O que estraga mais um suspense?",
    opcoes: [
      "Narrador não confiável mal feito",
      "Reviravolta sem pista nenhuma",
      "Vilão explicando o plano no fim",
      "Final aberto",
    ],
    autorSlug: "ana-paula",
    date: "2026-07-24",
  },
  {
    id: "e-esq-2",
    grupoId: "quem-ouve-no-transito",
    pergunta: "Qual a sua velocidade no trânsito?",
    opcoes: ["1x, sem pressa", "1,2x", "1,5x", "2x — e entendo tudo"],
    autorSlug: "marcos-v",
    date: "2026-07-20",
  },
  {
    id: "e-esq-3",
    grupoId: "classicos",
    pergunta: "Clássico em áudio: melhor com narração dramatizada ou sóbria?",
    opcoes: ["Dramatizada, com vozes", "Sóbria, quase leitura", "Depende do livro"],
    autorSlug: "juliana-s",
    date: "2026-07-18",
  },
];

function ler<T>(chave: string): T[] {
  try {
    const guardado = JSON.parse(localStorage.getItem(chave) || "[]");
    return Array.isArray(guardado) ? (guardado as T[]) : [];
  } catch {
    return [];
  }
}

function gravar<T>(chave: string, lista: T[]): void {
  try {
    localStorage.setItem(chave, JSON.stringify(lista));
  } catch {
    /* sem storage não persiste; a tela já mostrou o efeito */
  }
  window.dispatchEvent(new Event(GRUPOS_EVENT));
}

/** As enquetes de uma comunidade, da mais nova para a mais velha. */
export function enquetesDe(grupoId: string): Enquete[] {
  const minhas = ler<Enquete>(ENQUETES_CHAVE).filter((item) => item.grupoId === grupoId);
  return [...SEMEADAS.filter((item) => item.grupoId === grupoId), ...minhas].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
}

export function enquetePorId(id: string): Enquete | undefined {
  return [...SEMEADAS, ...ler<Enquete>(ENQUETES_CHAVE)].find((item) => item.id === id);
}

/** Cria uma enquete. Precisa de pergunta e de ao menos duas opções com texto. */
export function criarEnquete(
  grupoId: string,
  pergunta: string,
  opcoes: string[],
): Enquete | null {
  const limpa = pergunta.trim().slice(0, MAX_PERGUNTA);
  const validas = opcoes
    .map((item) => item.trim().slice(0, MAX_OPCAO))
    .filter(Boolean)
    .slice(0, MAX_OPCOES);
  if (!limpa || validas.length < MIN_OPCOES) return null;

  const enquete: Enquete = {
    id: `e-meu-${Date.now()}`,
    grupoId,
    pergunta: limpa,
    opcoes: validas,
    date: new Date().toISOString(),
  };
  gravar(ENQUETES_CHAVE, [...ler<Enquete>(ENQUETES_CHAVE), enquete]);
  return enquete;
}

export function apagarEnquete(id: string): void {
  gravar(ENQUETES_CHAVE, ler<Enquete>(ENQUETES_CHAVE).filter((item) => item.id !== id));
}

/** Fecha ou reabre — enquete fechada mostra o resultado e não aceita voto. */
export function alternarEnqueteFechada(id: string): void {
  gravar(
    ENQUETES_CHAVE,
    ler<Enquete>(ENQUETES_CHAVE).map((item) =>
      item.id === id ? { ...item, fechada: !item.fechada } : item,
    ),
  );
}

type Voto = { enqueteId: string; opcao: number };

/** Em que opção você votou, se votou. */
export function meuVoto(enqueteId: string): number | undefined {
  return ler<Voto>(VOTOS_CHAVE).find((item) => item.enqueteId === enqueteId)?.opcao;
}

/**
 * Vota — e **trocar de ideia é permitido**, como no Orkut. Votar de novo na
 * mesma opção desfaz o voto.
 */
export function votar(enqueteId: string, opcao: number): void {
  const atual = ler<Voto>(VOTOS_CHAVE).filter((item) => item.enqueteId !== enqueteId);
  const jaEra = meuVoto(enqueteId);
  gravar(VOTOS_CHAVE, jaEra === opcao ? atual : [...atual, { enqueteId, opcao }]);
}

/**
 * Os votos por opção — os fictícios e o seu.
 *
 * ⚠️ Os fictícios são **estáveis** (semente pelo id da enquete + índice da
 * opção). Enquete zerada não ensina o que uma enquete é, e resultado que dança a
 * cada desenho denuncia a maquete.
 */
export function votosDe(enquete: Enquete): number[] {
  const meu = meuVoto(enquete.id);
  return enquete.opcoes.map((_, indice) => {
    /* Enquete sua começa sem voto de ninguém: fingir que doze pessoas votaram no
       que você acabou de perguntar é a mentira mais fácil de perceber. */
    const base = enquete.autorSlug === undefined ? 0 : semear(`${enquete.id}-${indice}`) % 9;
    return base + (meu === indice ? 1 : 0);
  });
}

function semear(texto: string): number {
  let n = 0;
  for (let i = 0; i < texto.length; i += 1) n = (n * 31 + texto.charCodeAt(i)) % 9973;
  return n;
}

/* ------------------------------------------------------------------ *
 * Eventos
 * ------------------------------------------------------------------ */

export type Presenca = "vou" | "talvez" | "nao";

export interface Evento {
  id: string;
  grupoId: string;
  titulo: string;
  /** ISO só com o dia — hora fica à parte, como no formulário do Orkut. */
  data: string;
  hora?: string;
  local?: string;
  descricao?: string;
  autorSlug?: string;
  criadoEm: string;
  cancelado?: boolean;
}

const EVENTOS_SEMEADOS: Evento[] = [
  {
    id: "v-esq-1",
    grupoId: "suspense-misterio",
    titulo: "Maratona: ouvir o último capítulo juntos",
    data: proximoSabado(),
    hora: "21:00",
    local: "Online — cada um no seu fone",
    descricao:
      "Combinado: todo mundo dá play às 21h e a gente comenta no tópico logo depois. Sem spoiler antes.",
    autorSlug: "ana-paula",
    criadoEm: "2026-07-25",
  },
  {
    id: "v-esq-2",
    grupoId: "classicos",
    titulo: "Clube da leitura em voz alta — Orgulho e Preconceito",
    data: emDias(12),
    hora: "19:30",
    local: "Online",
    descricao: "Trechos favoritos, lidos por quem quiser ler.",
    autorSlug: "juliana-s",
    criadoEm: "2026-07-22",
  },
];

function emDias(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toISOString().slice(0, 10);
}

function proximoSabado(): string {
  const data = new Date();
  data.setDate(data.getDate() + ((6 - data.getDay() + 7) % 7 || 7));
  return data.toISOString().slice(0, 10);
}

/** Os eventos de uma comunidade — **os próximos primeiro**, como no Orkut. */
export function eventosDe(grupoId: string): Evento[] {
  const meus = ler<Evento>(EVENTOS_CHAVE).filter((item) => item.grupoId === grupoId);
  return [...EVENTOS_SEMEADOS.filter((item) => item.grupoId === grupoId), ...meus].sort((a, b) =>
    a.data.localeCompare(b.data),
  );
}

export function eventoPorId(id: string): Evento | undefined {
  return [...EVENTOS_SEMEADOS, ...ler<Evento>(EVENTOS_CHAVE)].find((item) => item.id === id);
}

export function criarEvento(dados: {
  grupoId: string;
  titulo: string;
  data: string;
  hora?: string;
  local?: string;
  descricao?: string;
}): Evento | null {
  const titulo = dados.titulo.trim().slice(0, 120);
  if (!titulo || !dados.data) return null;
  const evento: Evento = {
    id: `v-meu-${Date.now()}`,
    grupoId: dados.grupoId,
    titulo,
    data: dados.data,
    hora: dados.hora?.trim() || undefined,
    local: dados.local?.trim().slice(0, 120) || undefined,
    descricao: dados.descricao?.trim().slice(0, 500) || undefined,
    criadoEm: new Date().toISOString(),
  };
  gravar(EVENTOS_CHAVE, [...ler<Evento>(EVENTOS_CHAVE), evento]);
  return evento;
}

export function apagarEvento(id: string): void {
  gravar(EVENTOS_CHAVE, ler<Evento>(EVENTOS_CHAVE).filter((item) => item.id !== id));
}

type MinhaPresenca = { eventoId: string; resposta: Presenca };

export function minhaPresenca(eventoId: string): Presenca | undefined {
  return ler<MinhaPresenca>(PRESENCAS_CHAVE).find((item) => item.eventoId === eventoId)?.resposta;
}

/** Confirma presença. Tocar de novo na mesma resposta desfaz. */
export function responderPresenca(eventoId: string, resposta: Presenca): void {
  const atual = ler<MinhaPresenca>(PRESENCAS_CHAVE).filter((item) => item.eventoId !== eventoId);
  const jaEra = minhaPresenca(eventoId);
  gravar(PRESENCAS_CHAVE, jaEra === resposta ? atual : [...atual, { eventoId, resposta }]);
}

/**
 * Quem respondeu o quê — os fictícios são estáveis, e **quem organiza vai**.
 *
 * Evento sem ninguém confirmado parece cancelado antes de começar; por isso o
 * autor entra sempre na lista dos que vão, que é o que acontece de verdade.
 */
export function presencasDe(evento: Evento): Record<Presenca, string[]> {
  const resultado: Record<Presenca, string[]> = { vou: [], talvez: [], nao: [] };

  if (evento.autorSlug) {
    resultado.vou.push(evento.autorSlug);
    for (const membro of community) {
      if (membro.slug === evento.autorSlug) continue;
      const n = semear(`${evento.id}-${membro.slug}`) % 10;
      if (n < 3) resultado.vou.push(membro.slug);
      else if (n < 5) resultado.talvez.push(membro.slug);
    }
  }

  const minha = minhaPresenca(evento.id);
  if (minha) resultado[minha].push(EU);
  return resultado;
}
