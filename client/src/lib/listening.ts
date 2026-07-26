/**
 * O diário de audição — quanto você ouviu, em que dia e a que hora.
 *
 * **Por que ele precisou existir.** A tela de Estatísticas mostrava "47h
 * ouvidas", "3 semanas seguidas" e um gráfico de barras — **tudo escrito à mão
 * no código**, com meses de outubro a fevereiro que envelheceram sozinhos. Não
 * dava para calcular nada de verdade porque o app **não guardava histórico**:
 * o `playback.ts` sabe apenas *em que ponto de cada livro você parou*, não
 * *quanto tempo você ouviu ontem*. Este arquivo é a peça que faltava.
 *
 * **Formato.** Um objeto por dia (`"2026-07-25"`), com o total em segundos, a
 * quebra por hora do dia e a quebra por livro. Agregar na hora de gravar (em
 * vez de guardar uma linha por sessão) mantém o storage pequeno e responde a
 * todas as perguntas da tela: total, série por dia/semana/mês, sequência,
 * horário preferido e livro mais ouvido.
 *
 * **Quem alimenta.** Ninguém chama isto à mão: `savePlayback` (em
 * `playback.ts`) compara a posição nova com a anterior e credita o avanço aqui.
 * O player salva a cada 5 segundos, então o diário acompanha a audição sozinho.
 *
 * **Histórico de exemplo.** O app nasce sem passado nenhum, e uma tela de
 * estatísticas vazia não dá para avaliar nem para usar. Na primeira leitura,
 * semeamos ~10 semanas de histórico plausível, marcado com `exemplo: true` —
 * a tela avisa que aquilo é demonstração, e o uso real vai por cima. A geração
 * é determinística (semente fixa): o mesmo histórico sempre, e não muda a cada
 * abertura.
 */

import { catalog } from "@/lib/books";

const DIARIO_KEY = "allbook_listening";
const SEMEADO_KEY = "allbook_listening_seeded";

/** Avisa as telas abertas que o diário mudou (mesmo espírito do PLAYBACK_EVENT). */
export const LISTENING_EVENT = "allbook:listening";

export interface DiaDeAudicao {
  /** Segundos ouvidos no dia. */
  sec: number;
  /** Segundos por hora do dia (0–23) — daqui sai o horário preferido. */
  horas: Record<number, number>;
  /** Segundos por livro. */
  livros: Record<number, number>;
  /** Veio do histórico de demonstração, não do uso real. */
  exemplo?: boolean;
}

/** O diário inteiro, indexado por dia em ISO curto ("2026-07-25"). */
export type Diario = Record<string, DiaDeAudicao>;

/**
 * Avanço maior que isto não é audição — é a pessoa arrastando a barra ou
 * pulando de capítulo. Sem esse teto, um pulo para o fim do livro creditaria
 * horas que ninguém ouviu.
 */
const MAX_AVANCO_SEC = 120;

export function diaISO(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

function somarDias(data: Date, dias: number): Date {
  const copia = new Date(data);
  copia.setDate(copia.getDate() + dias);
  return copia;
}

function notificar(): void {
  window.dispatchEvent(new Event(LISTENING_EVENT));
}

function gravar(diario: Diario): void {
  try {
    localStorage.setItem(DIARIO_KEY, JSON.stringify(diario));
    notificar();
  } catch {
    // Storage cheio ou bloqueado: perder a estatística não justifica derrubar
    // o player no meio da audição.
  }
}

/** Lê o diário cru. Nunca quebra: storage estragado devolve diário vazio. */
export function readDiario(): Diario {
  try {
    const guardado = JSON.parse(localStorage.getItem(DIARIO_KEY) || "{}");
    if (!guardado || typeof guardado !== "object" || Array.isArray(guardado)) return {};

    const limpo: Diario = {};
    for (const [dia, valor] of Object.entries(guardado as Record<string, unknown>)) {
      if (!valor || typeof valor !== "object") continue;
      const item = valor as Record<string, unknown>;
      const sec = Number(item.sec);
      if (!Number.isFinite(sec) || sec <= 0) continue;
      limpo[dia] = {
        sec,
        horas: (item.horas as Record<number, number>) ?? {},
        livros: (item.livros as Record<number, number>) ?? {},
        exemplo: item.exemplo === true,
      };
    }
    return limpo;
  } catch {
    return {};
  }
}

/**
 * Credita segundos ouvidos. Chamado pelo `savePlayback` a cada avanço do
 * player — avanço negativo (voltou) ou grande demais (pulou) é ignorado.
 */
export function registrarAudicao(bookId: number, segundos: number, quando = new Date()): void {
  if (!Number.isFinite(segundos) || segundos <= 0 || segundos > MAX_AVANCO_SEC) return;

  const diario = garantirDiario();
  const chave = diaISO(quando);
  const hora = quando.getHours();
  const dia: DiaDeAudicao = diario[chave] ?? { sec: 0, horas: {}, livros: {} };

  dia.sec += segundos;
  dia.horas[hora] = (dia.horas[hora] ?? 0) + segundos;
  dia.livros[bookId] = (dia.livros[bookId] ?? 0) + segundos;
  // O dia deixou de ser só demonstração no instante em que entrou audição real.
  delete dia.exemplo;

  diario[chave] = dia;
  gravar(diario);
}

/* ------------------------------------------------------------------ *
 * Histórico de demonstração
 * ------------------------------------------------------------------ */

/** Semanas de histórico que a semente cobre. */
const SEMANAS_DE_EXEMPLO = 10;

/**
 * Gerador pseudoaleatório com semente fixa. Serve para o histórico de exemplo
 * ser sempre o mesmo — um `Math.random` faria os números dançarem a cada
 * geração, e "45h ouvidas" viraria outra coisa no dia seguinte.
 */
function sorteador(semente: number): () => number {
  let estado = semente;
  return () => {
    estado = (estado * 1103515245 + 12345) % 2147483648;
    return estado / 2147483648;
  };
}

/**
 * Monta ~10 semanas plausíveis: nem todo dia tem audição, fim de semana rende
 * sessões mais longas, e a maior parte acontece de noite — o padrão de quem
 * ouve audiolivro no trajeto e antes de dormir.
 */
function historicoDeExemplo(hoje = new Date()): Diario {
  const sortear = sorteador(20260725);
  const diario: Diario = {};

  /**
   * Dois livros de **cada gênero**, não os primeiros do catálogo: o catálogo
   * começa com uma sequência inteira de ficção científica, e semear com ela
   * fazia a tela dizer "Ficção Científica 100%" — um gosto de leitura que não
   * demonstra nada.
   */
  const porGenero = new Map<string, number[]>();
  for (const livro of catalog) {
    const atual = porGenero.get(livro.genre) ?? [];
    if (atual.length < 2) porGenero.set(livro.genre, [...atual, livro.id]);
  }
  const ids = Array.from(porGenero.values()).flat();
  if (ids.length === 0) return diario;

  for (let atras = SEMANAS_DE_EXEMPLO * 7 - 1; atras >= 0; atras--) {
    const data = somarDias(hoje, -atras);
    const fimDeSemana = data.getDay() === 0 || data.getDay() === 6;

    // Frequência: ~55% nos dias de semana, ~70% no fim de semana.
    if (sortear() > (fimDeSemana ? 0.7 : 0.55)) continue;

    const minutos = Math.round(fimDeSemana ? 45 + sortear() * 70 : 20 + sortear() * 55);
    const livro = ids[Math.floor(sortear() * ids.length)];

    // Três momentos típicos de quem ouve audiolivro, com a noite pesando mais:
    // o trajeto da manhã, a tarde e antes de dormir.
    const momento = sortear();
    const hora =
      momento < 0.5
        ? 20 + Math.floor(sortear() * 3) // noite
        : momento < 0.8
          ? 7 + Math.floor(sortear() * 3) // manhã
          : 14 + Math.floor(sortear() * 4); // tarde
    const sec = minutos * 60;

    diario[diaISO(data)] = {
      sec,
      horas: { [hora]: sec },
      livros: { [livro]: sec },
      exemplo: true,
    };
  }

  return diario;
}

/**
 * O diário pronto para uso. Na primeiríssima vez semeia o histórico de
 * demonstração; depois disso nunca mais — inclusive se a pessoa apagar tudo
 * pela faxina das Configurações, para a limpeza não ser desfeita sozinha.
 */
export function garantirDiario(): Diario {
  const atual = readDiario();
  if (Object.keys(atual).length > 0) return atual;

  try {
    if (localStorage.getItem(SEMEADO_KEY)) return atual;
    localStorage.setItem(SEMEADO_KEY, new Date().toISOString());
  } catch {
    return atual;
  }

  const semeado = historicoDeExemplo();
  gravar(semeado);
  return semeado;
}

/** Sobrou algum dia de demonstração no diário? A tela avisa quando sim. */
export function temExemplo(diario: Diario): boolean {
  return Object.values(diario).some((dia) => dia.exemplo);
}

/** Apaga o diário (usado pela faxina das Configurações). */
export function limparDiario(): void {
  try {
    localStorage.removeItem(DIARIO_KEY);
    notificar();
  } catch {
    /* nada a fazer */
  }
}

/* ------------------------------------------------------------------ *
 * Consultas
 * ------------------------------------------------------------------ */

export interface PontoDaSerie {
  /** Rótulo curto do eixo ("qua", "12/07", "jul."). */
  rotulo: string;
  /** Horas, com uma casa — é o que o gráfico desenha. */
  horas: number;
  sec: number;
}

export function totalSegundos(diario: Diario): number {
  return Object.values(diario).reduce((soma, dia) => soma + dia.sec, 0);
}

/** Quantos dias diferentes tiveram audição. */
export function diasAtivos(diario: Diario): number {
  return Object.keys(diario).length;
}

/** Soma de uma janela: de `deDias` atrás até `ateDias` atrás (0 = hoje). */
export function segundosNaJanela(diario: Diario, deDias: number, ateDias: number): number {
  const hoje = new Date();
  let soma = 0;
  for (let atras = ateDias; atras <= deDias; atras++) {
    soma += diario[diaISO(somarDias(hoje, -atras))]?.sec ?? 0;
  }
  return soma;
}

const DIAS_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Um ponto por dia, do mais antigo para o mais novo. */
export function serieDiaria(diario: Diario, dias: number, hoje = new Date()): PontoDaSerie[] {
  const pontos: PontoDaSerie[] = [];
  for (let atras = dias - 1; atras >= 0; atras--) {
    const data = somarDias(hoje, -atras);
    const sec = diario[diaISO(data)]?.sec ?? 0;
    pontos.push({ rotulo: DIAS_CURTOS[data.getDay()], horas: sec / 3600, sec });
  }
  return pontos;
}

/** Um ponto por semana (blocos de 7 dias terminando hoje). */
export function serieSemanal(diario: Diario, semanas: number, hoje = new Date()): PontoDaSerie[] {
  const pontos: PontoDaSerie[] = [];
  for (let bloco = semanas - 1; bloco >= 0; bloco--) {
    let sec = 0;
    let inicio = hoje;
    for (let i = 0; i < 7; i++) {
      const data = somarDias(hoje, -(bloco * 7 + i));
      sec += diario[diaISO(data)]?.sec ?? 0;
      inicio = data;
    }
    pontos.push({
      rotulo: `${inicio.getDate()}/${String(inicio.getMonth() + 1).padStart(2, "0")}`,
      horas: sec / 3600,
      sec,
    });
  }
  return pontos;
}

/** Um ponto por mês do calendário. */
export function serieMensal(diario: Diario, meses: number, hoje = new Date()): PontoDaSerie[] {
  const pontos: PontoDaSerie[] = [];
  for (let atras = meses - 1; atras >= 0; atras--) {
    const referencia = new Date(hoje.getFullYear(), hoje.getMonth() - atras, 1);
    const prefixo = `${referencia.getFullYear()}-${String(referencia.getMonth() + 1).padStart(2, "0")}`;
    let sec = 0;
    for (const [dia, valor] of Object.entries(diario)) {
      if (dia.startsWith(prefixo)) sec += valor.sec;
    }
    pontos.push({ rotulo: MESES_CURTOS[referencia.getMonth()], horas: sec / 3600, sec });
  }
  return pontos;
}

/**
 * Dias seguidos com audição, contando de hoje para trás. Ainda não ter ouvido
 * **hoje** não zera a sequência — ela conta a partir de ontem, senão toda manhã
 * a pessoa acordaria com a sequência perdida.
 */
export function sequenciaDeDias(diario: Diario, hoje = new Date()): number {
  const comecoEmHoje = (diario[diaISO(hoje)]?.sec ?? 0) > 0;
  let sequencia = 0;
  for (let atras = comecoEmHoje ? 0 : 1; atras < 400; atras++) {
    if ((diario[diaISO(somarDias(hoje, -atras))]?.sec ?? 0) <= 0) break;
    sequencia++;
  }
  return sequencia;
}

/** A maior sequência de dias já alcançada — o recorde a bater. */
export function melhorSequenciaDeDias(diario: Diario): number {
  const dias = Object.keys(diario).sort();
  let melhor = 0;
  let atual = 0;
  let anterior: Date | null = null;

  for (const chave of dias) {
    const data = new Date(`${chave}T12:00:00`);
    const seguido =
      anterior !== null && Math.round((data.getTime() - anterior.getTime()) / 86400000) === 1;
    atual = seguido ? atual + 1 : 1;
    melhor = Math.max(melhor, atual);
    anterior = data;
  }
  return melhor;
}

/** Semanas seguidas com pelo menos um dia de audição. */
export function sequenciaDeSemanas(diario: Diario, hoje = new Date()): number {
  let semanas = 0;
  for (let bloco = 0; bloco < 200; bloco++) {
    let temAudicao = false;
    for (let i = 0; i < 7 && !temAudicao; i++) {
      if ((diario[diaISO(somarDias(hoje, -(bloco * 7 + i)))]?.sec ?? 0) > 0) temAudicao = true;
    }
    if (!temAudicao) break;
    semanas++;
  }
  return semanas;
}

export type FaixaDoDia = "madrugada" | "manhã" | "tarde" | "noite";

/** Segundos por faixa do dia — de onde sai "você ouve mais à noite". */
export function porFaixaDoDia(diario: Diario): Record<FaixaDoDia, number> {
  const faixas: Record<FaixaDoDia, number> = { madrugada: 0, manhã: 0, tarde: 0, noite: 0 };
  for (const dia of Object.values(diario)) {
    for (const [hora, sec] of Object.entries(dia.horas)) {
      const h = Number(hora);
      const faixa: FaixaDoDia = h < 6 ? "madrugada" : h < 12 ? "manhã" : h < 18 ? "tarde" : "noite";
      faixas[faixa] += sec;
    }
  }
  return faixas;
}

/** Segundos por livro, do mais ouvido para o menos. */
export function porLivro(diario: Diario): { bookId: number; sec: number }[] {
  const soma = new Map<number, number>();
  for (const dia of Object.values(diario)) {
    for (const [id, sec] of Object.entries(dia.livros)) {
      const bookId = Number(id);
      soma.set(bookId, (soma.get(bookId) ?? 0) + sec);
    }
  }
  return Array.from(soma.entries())
    .map(([bookId, sec]) => ({ bookId, sec }))
    .sort((a, b) => b.sec - a.sec);
}

/** Segundos por dia da semana (0 = domingo) — o "seu dia mais forte". */
export function porDiaDaSemana(diario: Diario): number[] {
  const dias = [0, 0, 0, 0, 0, 0, 0];
  for (const [chave, valor] of Object.entries(diario)) {
    dias[new Date(`${chave}T12:00:00`).getDay()] += valor.sec;
  }
  return dias;
}

/** Um dia em que a pessoa ouviu um livro específico. */
export interface DiaDoLivro {
  /** Dia em ISO curto ("2026-07-25"). */
  dia: string;
  sec: number;
  /** Veio do histórico de demonstração, não do uso real. */
  exemplo: boolean;
}

/** O que a pessoa já ouviu de **um** livro, dia a dia. */
export interface HistoricoDeUmLivro {
  totalSec: number;
  /** Do mais recente para o mais antigo — é a ordem em que se lê um histórico. */
  dias: DiaDoLivro[];
  /** Só de demonstração? Serve para a tela avisar em vez de fingir. */
  soExemplo: boolean;
}

/**
 * O histórico de **um livro**: quanto foi ouvido dele, em que dias.
 *
 * O diário já guardava `livros` dentro de cada dia (segundos por id) — faltava
 * olhar por essa fatia. É o que dá conteúdo real ao "Histórico de escuta" do
 * tocador, que antes só repetia o capítulo atual (ver ROTEIRO 4.36).
 */
export function historicoDoLivro(diario: Diario, bookId: number): HistoricoDeUmLivro {
  const dias: DiaDoLivro[] = [];
  let totalSec = 0;

  for (const [dia, registro] of Object.entries(diario)) {
    const sec = registro.livros[bookId];
    if (!sec) continue;
    totalSec += sec;
    dias.push({ dia, sec, exemplo: Boolean(registro.exemplo) });
  }

  dias.sort((a, b) => (a.dia < b.dia ? 1 : -1));

  return {
    totalSec,
    dias,
    soExemplo: dias.length > 0 && dias.every((d) => d.exemplo),
  };
}

/** "47h", "1h 20min", "35min" — o mesmo texto em toda a tela. */
export function formatarDuracao(sec: number): string {
  const minutosTotais = Math.round(sec / 60);
  const horas = Math.floor(minutosTotais / 60);
  const minutos = minutosTotais % 60;
  if (horas === 0) return `${minutos}min`;
  if (minutos === 0) return `${horas}h`;
  return `${horas}h ${minutos}min`;
}

export { DIAS_CURTOS };
