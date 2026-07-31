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
export function historicoDoLivro(
  diario: Diario,
  bookId: number,
  hoje = new Date()
): HistoricoDeUmLivro {
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

/**
 * Três semanas sem tocar num livro não é "ouvir devagar" — é ter saído dele.
 * Quando a pessoa volta depois disso, ela **retomou**, e o tempo parado não
 * pode entrar no ritmo.
 */
const LIMITE_DE_HIATO_DIAS = 21;

/**
 * Abaixo disto o dia **não abre nem sustenta** um trecho de leitura: é a espiada
 * de quem abriu o livro só para ouvir como é a voz do narrador.
 *
 * Caso do Matheus, 26/07: *"a pessoa abriu o livro, ouviu 30 segundos e foi ali
 * ver como era a voz"*. Sem este piso, aquela curiosidade viraria o marco zero
 * do ritmo — e a conta inteira nasceria torta. O tempo desses dias **continua
 * somando** no total ouvido; ele só não serve de âncora para o ritmo.
 */
const MINIMO_DE_SESSAO_SEC = 300;

function diferencaEmDias(deISO: string, ateISO: string): number {
  // Meio-dia dos dois lados: evita que o horário de verão coma ou invente um dia.
  const de = new Date(`${deISO}T12:00:00`).getTime();
  const ate = new Date(`${ateISO}T12:00:00`).getTime();
  return Math.round((ate - de) / 86_400_000);
}

/**
 * "3 dias", "3 meses", "1 ano" — a unidade acompanha o tamanho da previsão.
 *
 * **Por que não deixar em dias sempre:** o primeiro teste devolveu *"219 dias"*,
 * que é a conta certa e a comunicação errada — ninguém processa 219 dias, e o
 * número ainda soa a cobrança. Em meses a mesma verdade fica legível. Fica aqui,
 * e não na tela, porque as **duas** telas que mostram previsão têm de falar
 * igual (ROTEIRO 4.36).
 */
export function prazoLegivel(dias: number): string {
  if (dias === 1) return "1 dia";
  if (dias <= 45) return `${dias} dias`;
  const meses = Math.round(dias / 30);
  if (meses < 12) return `${meses} meses`;
  const anos = Math.round(dias / 365);
  return anos === 1 ? "1 ano" : `${anos} anos`;
}

export interface PrevisaoDeTermino {
  /** Dias corridos estimados até o fim, no ritmo atual. */
  dias: number;
  /** Segundos por dia corrido — o ritmo em si. */
  secPorDia: number;
  /** Primeiro dia do trecho atual, quando houve retomada depois de um hiato. */
  retomadoEm: string | null;
}

/**
 * **A previsão de término do AllBook — fonte única.** Player e Estatísticas
 * chamam esta função; antes cada tela fazia a sua conta e o app se contradizia
 * (ROTEIRO 4.36).
 *
 * O ritmo é o **daquele livro**, e só do **trecho atual de leitura**:
 *
 * - **Dias parados contam** dentro do trecho. Quem ouve 1h a cada três dias não
 *   termina no ritmo de 1h por dia — a frequência faz parte do ritmo.
 * - **Um hiato acima de 21 dias corta o trecho.** Os dois furos que o Matheus
 *   apontou em 26/07 morrem aqui: (a) os 30 segundos de curiosidade em maio não
 *   viram mais o marco zero de quem só começou de verdade em julho; (b) quem
 *   passou quatro meses fora não carrega esses meses na média ao voltar.
 * - **Parou de vez → sem previsão.** Se a última escuta foi há mais de 21 dias,
 *   a pessoa não está lendo este livro *agora*, e "no seu ritmo" seria invenção.
 * - **Um dia só de escuta → sem previsão.** Amostra não é ritmo.
 */
export function previsaoDeTermino(
  diario: Diario,
  bookId: number,
  restanteSec: number,
  hoje = new Date()
): PrevisaoDeTermino | null {
  if (restanteSec <= 0) return null;

  const { dias } = historicoDoLivro(diario, bookId); // do mais recente ao mais antigo

  // Só as sessões de verdade desenham o trecho; as espiadas ficam de fora.
  const sessoes = dias.filter((d) => d.sec >= MINIMO_DE_SESSAO_SEC);
  if (sessoes.length < 2) return null;

  const hojeISO = diaISO(hoje);
  if (diferencaEmDias(sessoes[0].dia, hojeISO) > LIMITE_DE_HIATO_DIAS) return null;

  // Anda para trás enquanto as sessões estiverem encostadas; para no 1º buraco.
  let fim = 0;
  while (
    fim + 1 < sessoes.length &&
    diferencaEmDias(sessoes[fim + 1].dia, sessoes[fim].dia) <= LIMITE_DE_HIATO_DIAS
  ) {
    fim += 1;
  }

  const trecho = sessoes.slice(0, fim + 1);
  if (trecho.length < 2) return null;

  const comecoDoTrecho = trecho[trecho.length - 1].dia;

  /*
   * O tempo somado usa **todos** os dias dentro do trecho, inclusive os curtos:
   * os 3 minutos de uma terça também foram ouvidos. O piso vale para escolher
   * onde o trecho começa, não para descartar audição.
   */
  const secDoTrecho = dias
    .filter((d) => d.dia >= comecoDoTrecho)
    .reduce((soma, d) => soma + d.sec, 0);

  const diasCorridos = Math.max(1, diferencaEmDias(comecoDoTrecho, hojeISO) + 1);
  const secPorDia = secDoTrecho / diasCorridos;
  if (secPorDia < 60) return null;

  return {
    dias: Math.max(1, Math.ceil(restanteSec / secPorDia)),
    secPorDia,
    // Houve corte se sobrou sessão antes do trecho — a tela diz "desde que retomou".
    retomadoEm: fim + 1 < sessoes.length ? comecoDoTrecho : null,
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
