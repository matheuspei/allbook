/**
 * Clubes de leitura — a "turma" que combina de ouvir junto.
 *
 * **O que um clube é, e o que ele NÃO é** (ROTEIRO 4.39): a *sala do livro* é
 * aberta, existe sozinha para os 59 títulos e não tem dono. O clube é o
 * contrário em tudo o que importa: tem **dono** (o moderador), **membros**,
 * **um livro por vez**, **prazo** e **fim**. A frase que decidiu o desenho: *a
 * sala é do livro, o clube é das pessoas.*
 *
 * **Por que o clube funciona melhor dentro do AllBook do que num app à parte:**
 * todo clube de leitura sofre de dois males — o ritmo se perde e o spoiler
 * afasta quem está atrasado. Aqui o player **sabe** onde cada um está, então a
 * régua do grupo e a trava de spoiler saem de graça, sem ninguém precisar
 * declarar nada.
 *
 * **Como os dados moram aqui.** O mesmo padrão do resto da casa: uma lista fixa
 * de clubes semeados (esqueleto, para haver o que descobrir) e, no
 * `localStorage`, só o que **você** fez — os clubes que criou, aqueles em que
 * entrou ou de que saiu, e os ciclos que mudaram depois de uma votação. Quando
 * houver servidor, `readEstado`/`salvar` viram chamadas de API e as telas não
 * mudam.
 *
 * **O progresso dos outros membros é simulado, e de propósito.** Eles são os
 * leitores fictícios de `community.ts`; sem servidor não existe progresso real
 * de ninguém além do seu. A simulação é **estável** (semente por membro +
 * clube) e ancorada no tempo decorrido do ciclo, para a régua não pular a cada
 * desenho. É a mesma honestidade dos capítulos inventados em `chapters.ts`.
 */

import { catalog } from "@/lib/books";
import { chapterAtSec, getChapters } from "@/lib/chapters";
import { community } from "@/lib/community";
import { readPlaybackList } from "@/lib/playback";

/** Você, dentro de um clube. Não é slug de `community.ts` de propósito. */
export const EU = "voce";

/** Avisa as telas de que algo mudou (mesmo padrão de `playback.ts`). */
export const CLUBES_EVENT = "allbook:clubes";

export interface Marco {
  /** 1, 2, 3… na ordem do ciclo. */
  id: number;
  /** Até este capítulo, inclusive. */
  chapter: number;
  /** Data combinada, ISO curto (AAAA-MM-DD). */
  prazo: string;
}

export interface Ciclo {
  bookId: number;
  /** ISO curto. */
  inicio: string;
  /** O encontro — quando a turma conversa sobre o livro inteiro. */
  encontro: string;
  marcos: Marco[];
}

export interface Clube {
  id: string;
  nome: string;
  descricao: string;
  /** Quem criou e modera. `EU` quando o clube é seu. */
  donoSlug: string;
  /** Todos os membros, o dono incluído. */
  membros: string[];
  ciclo: Ciclo;
  /** O que a turma já terminou, do mais recente para o mais antigo. */
  estante: { bookId: number; terminadoEm: string }[];
  /** Gênero que dá a cara do clube — usado para sugerir. */
  genero: string;
}

/* ------------------------------------------------------------------ *
 * Datas — o clube inteiro gira em torno de prazo, então elas vêm antes.
 * ------------------------------------------------------------------ */

/** "2026-07-27" a partir de um `Date`. */
export function isoCurto(data: Date): string {
  return data.toISOString().slice(0, 10);
}

export function hojeIso(): string {
  return isoCurto(new Date());
}

/** Dias entre hoje e uma data (negativo = já passou). */
export function diasAte(iso: string): number {
  const alvo = new Date(`${iso}T12:00:00`);
  const hoje = new Date(`${hojeIso()}T12:00:00`);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
}

/** "em 3 dias", "hoje", "há 2 dias" — o texto que a tela usa. */
export function prazoEmTexto(iso: string): string {
  const dias = diasAte(iso);
  if (dias === 0) return "hoje";
  if (dias === 1) return "amanhã";
  if (dias === -1) return "ontem";
  if (dias > 1) return `em ${dias} dias`;
  return `há ${Math.abs(dias)} dias`;
}

/** "30/08" — data curta, para caber ao lado do nome do livro. */
export function dataCurta(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

function somarDias(iso: string, dias: number): string {
  const data = new Date(`${iso}T12:00:00`);
  data.setDate(data.getDate() + dias);
  return isoCurto(data);
}

/**
 * Monta os marcos de um ciclo: divide os capítulos do livro em semanas.
 *
 * **Por que semanal, e não "3 capítulos por dia":** clube existe para caber na
 * vida de gente ocupada, e a semana é a unidade em que as pessoas realmente se
 * organizam. Um marco por semana também dá o número certo de encontros de
 * conversa — nem um por dia (vira cobrança), nem um só no fim (vira ninguém
 * lendo até a véspera).
 */
export function marcosSemanais(bookId: number, semanas: number, inicio: string): Marco[] {
  const totalCapitulos = getChapters(bookId).length;
  const passo = totalCapitulos / semanas;

  return Array.from({ length: semanas }, (_, i) => ({
    id: i + 1,
    chapter: Math.min(totalCapitulos, Math.round(passo * (i + 1))),
    prazo: somarDias(inicio, (i + 1) * 7),
  }));
}

/* ------------------------------------------------------------------ *
 * O esqueleto: clubes que já existem para haver o que descobrir.
 * ------------------------------------------------------------------ */

/**
 * Os ciclos dos clubes semeados são calculados a partir de **hoje**, não
 * escritos à mão: um ciclo com data fixa envelheceria em uma semana e o app
 * abriria mostrando encontro vencido, régua parada e prazo negativo — o tipo de
 * esqueleto que passa por app quebrado.
 */
function cicloSemeado(bookId: number, diasDesdeOInicio: number, semanas: number): Ciclo {
  const inicio = somarDias(hojeIso(), -diasDesdeOInicio);
  return {
    bookId,
    inicio,
    encontro: somarDias(inicio, semanas * 7),
    marcos: marcosSemanais(bookId, semanas, inicio),
  };
}

export const clubesSemeados: Clube[] = [
  {
    id: "misterio",
    nome: "Clube do Mistério",
    descricao:
      "Um suspense por mês, sem pressa e sem entregar o final de ninguém. Quem chega atrasado é bem-vindo — a conversa espera.",
    donoSlug: "ana-paula",
    membros: ["ana-paula", "carla-lima", "juliana-s", "marcos-v", "ricardo"],
    ciclo: cicloSemeado(106, 12, 4),
    estante: [
      { bookId: 1, terminadoEm: "2026-06-28" },
      { bookId: 120, terminadoEm: "2026-05-30" },
    ],
    genero: "Mistério",
  },
  {
    id: "habitos",
    nome: "Hábitos & Produtividade",
    descricao:
      "Livro por mês e uma pergunta simples toda semana: o que você mudou de verdade na sua rotina?",
    donoSlug: "luciana",
    membros: ["luciana", "felipe-g", "ricardo"],
    ciclo: cicloSemeado(102, 3, 4),
    estante: [{ bookId: 107, terminadoEm: "2026-06-15" }],
    genero: "Produtividade",
  },
  {
    id: "madrugada",
    nome: "Terror de Madrugada",
    descricao: "Só ouvimos depois das 22h. Não é regra, é o que acaba acontecendo.",
    donoSlug: "beto",
    membros: ["beto", "juliana-s"],
    ciclo: cicloSemeado(105, 20, 5),
    estante: [{ bookId: 104, terminadoEm: "2026-06-05" }],
    genero: "Terror",
  },
];

/* ------------------------------------------------------------------ *
 * O que é seu: guardado no navegador.
 * ------------------------------------------------------------------ */

const CHAVE = "allbook_clubes";

interface EstadoLocal {
  /** Clubes que você criou — você é o dono. */
  criados: Clube[];
  /** Ids de clubes semeados em que você entrou. */
  entrou: string[];
  /** Ciclos que mudaram (depois de uma votação, por exemplo). */
  ciclos: Record<string, Ciclo>;
  /** Livros acrescentados à estante de um clube ao encerrar um ciclo. */
  estantes: Record<string, { bookId: number; terminadoEm: string }[]>;
}

const VAZIO: EstadoLocal = { criados: [], entrou: [], ciclos: {}, estantes: {} };

function readEstado(): EstadoLocal {
  try {
    const guardado = JSON.parse(localStorage.getItem(CHAVE) || "null");
    if (!guardado || typeof guardado !== "object") return VAZIO;
    return {
      criados: Array.isArray(guardado.criados) ? guardado.criados : [],
      entrou: Array.isArray(guardado.entrou) ? guardado.entrou : [],
      ciclos: guardado.ciclos ?? {},
      estantes: guardado.estantes ?? {},
    };
  } catch {
    return VAZIO;
  }
}

function salvar(estado: EstadoLocal): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    /* sem storage o clube não persiste; a tela já mostrou o resultado */
  }
  window.dispatchEvent(new Event(CLUBES_EVENT));
}

/** Um clube semeado, já com as suas alterações por cima. */
function comAlteracoes(clube: Clube, estado: EstadoLocal): Clube {
  const entrou = estado.entrou.includes(clube.id);
  return {
    ...clube,
    membros: entrou ? [...clube.membros, EU] : clube.membros,
    ciclo: estado.ciclos[clube.id] ?? clube.ciclo,
    estante: [...(estado.estantes[clube.id] ?? []), ...clube.estante],
  };
}

/** Todos os clubes que existem para você: os semeados e os seus. */
export function todosOsClubes(): Clube[] {
  const estado = readEstado();
  return [...estado.criados, ...clubesSemeados.map((clube) => comAlteracoes(clube, estado))];
}

export function clubePorId(id: string): Clube | undefined {
  return todosOsClubes().find((clube) => clube.id === id);
}

export function souMembro(clube: Clube): boolean {
  return clube.membros.includes(EU);
}

export function souDono(clube: Clube): boolean {
  return clube.donoSlug === EU;
}

/** Os clubes em que você está — os que criou e aqueles em que entrou. */
export function meusClubes(): Clube[] {
  return todosOsClubes().filter(souMembro);
}

/**
 * O que sugerir a quem ainda não entrou em nada.
 *
 * A ordem não é aleatória: primeiro os clubes do **gênero que você mais ouve**,
 * depois o resto. Entrar num clube é assumir um prazo com estranhos — o mínimo
 * é que o livro interesse.
 */
export function clubesParaDescobrir(): Clube[] {
  const generosOuvidos = new Set<string>(
    readPlaybackList()
      .map((item) => catalog.find((book) => book.id === item.bookId)?.genre)
      .filter((genero): genero is NonNullable<typeof genero> => genero !== undefined),
  );

  return todosOsClubes()
    .filter((clube) => !souMembro(clube))
    .sort((a, b) => {
      const pesoA = generosOuvidos.has(a.genero) ? 0 : 1;
      const pesoB = generosOuvidos.has(b.genero) ? 0 : 1;
      return pesoA - pesoB || b.membros.length - a.membros.length;
    });
}

/**
 * Os clubes que estão lendo este livro **agora**.
 *
 * É o que permite a ficha do livro avisar "este é o livro do ciclo do Clube do
 * Mistério" — a porta de entrada mais natural que existe, porque a pessoa já
 * está olhando exatamente aquele título.
 */
export function clubesDoLivro(bookId: number): Clube[] {
  return todosOsClubes().filter((clube) => clube.ciclo.bookId === bookId);
}

export function entrarNoClube(id: string): void {
  const estado = readEstado();
  if (estado.criados.some((clube) => clube.id === id)) return;
  if (estado.entrou.includes(id)) return;
  salvar({ ...estado, entrou: [...estado.entrou, id] });
}

export function sairDoClube(id: string): void {
  const estado = readEstado();
  salvar({
    ...estado,
    entrou: estado.entrou.filter((item) => item !== id),
    criados: estado.criados.filter((clube) => clube.id !== id),
  });
}

/**
 * Criar um clube. Você vira o dono — e, portanto, o moderador.
 *
 * **Nasce só com você dentro, e isso é honesto:** sem servidor não há como
 * convidar ninguém de verdade. Os leitores fictícios que "entram" depois são
 * esqueleto; a tela diz isso com todas as letras em vez de encenar um grupo
 * cheio.
 */
export function criarClube(dados: {
  nome: string;
  descricao: string;
  bookId: number;
  semanas: number;
}): Clube {
  const estado = readEstado();
  const inicio = hojeIso();
  const livro = catalog.find((book) => book.id === dados.bookId);

  const clube: Clube = {
    id: `meu-${Date.now()}`,
    nome: dados.nome.trim(),
    descricao: dados.descricao.trim(),
    donoSlug: EU,
    membros: [EU],
    ciclo: {
      bookId: dados.bookId,
      inicio,
      encontro: somarDias(inicio, dados.semanas * 7),
      marcos: marcosSemanais(dados.bookId, dados.semanas, inicio),
    },
    estante: [],
    genero: livro?.genre ?? "Geral",
  };

  salvar({ ...estado, criados: [clube, ...estado.criados] });
  return clube;
}

/** Troca o livro do ciclo (o que acontece quando uma votação termina). */
export function comecarCiclo(clubeId: string, bookId: number, semanas = 4): void {
  const estado = readEstado();
  const clube = clubePorId(clubeId);
  if (!clube) return;

  const inicio = hojeIso();
  const ciclo: Ciclo = {
    bookId,
    inicio,
    encontro: somarDias(inicio, semanas * 7),
    marcos: marcosSemanais(bookId, semanas, inicio),
  };

  const anterior = clube.ciclo;
  const estanteDoClube = estado.estantes[clubeId] ?? [];

  if (clube.donoSlug === EU) {
    salvar({
      ...estado,
      criados: estado.criados.map((item) => (item.id === clubeId ? { ...item, ciclo } : item)),
      estantes: {
        ...estado.estantes,
        [clubeId]: [{ bookId: anterior.bookId, terminadoEm: hojeIso() }, ...estanteDoClube],
      },
    });
    return;
  }

  salvar({
    ...estado,
    ciclos: { ...estado.ciclos, [clubeId]: ciclo },
    estantes: {
      ...estado.estantes,
      [clubeId]: [{ bookId: anterior.bookId, terminadoEm: hojeIso() }, ...estanteDoClube],
    },
  });
}

/* ------------------------------------------------------------------ *
 * Ritmo: onde você está, onde a roda está, e até onde dá para falar.
 * ------------------------------------------------------------------ */

/** O marco vigente: o primeiro cujo prazo ainda não venceu. */
export function marcoAtual(clube: Clube): Marco | undefined {
  return (
    clube.ciclo.marcos.find((marco) => diasAte(marco.prazo) >= 0) ??
    clube.ciclo.marcos[clube.ciclo.marcos.length - 1]
  );
}

/**
 * **Até que capítulo a turma combinou não passar.** É a regra de spoiler do
 * clube — mais simples de entender do que marcar mensagem por mensagem: "nada
 * além do capítulo 6" cabe numa linha e todo mundo entende.
 */
export function capituloCombinado(clube: Clube): number {
  return marcoAtual(clube)?.chapter ?? getChapters(clube.ciclo.bookId).length;
}

/** Em que capítulo do livro do ciclo você está (0 = não começou). */
export function meuCapitulo(clube: Clube): number {
  const entrada = readPlaybackList().find((item) => item.bookId === clube.ciclo.bookId);
  if (!entrada) return 0;
  return chapterAtSec(clube.ciclo.bookId, entrada.positionSec);
}

/** Semente estável: o mesmo membro, no mesmo clube, dá sempre o mesmo desvio. */
function desvioEstavel(slug: string, clubeId: string): number {
  const texto = `${slug}@${clubeId}`;
  let hash = 0;
  for (let i = 0; i < texto.length; i++) hash = (hash * 31 + texto.charCodeAt(i)) | 0;
  // De -0,25 a +0,25 do ciclo: uns adiantados, outros atrasados, sempre iguais.
  return ((Math.abs(hash) % 51) - 25) / 100;
}

/**
 * Em que capítulo está cada membro (o seu vem do player; o dos outros é
 * simulado, ver o cabeçalho do arquivo).
 */
export function progressoDosMembros(clube: Clube): { slug: string; capitulo: number }[] {
  const capitulos = getChapters(clube.ciclo.bookId).length;
  const total = Math.max(1, diasAte(clube.ciclo.encontro) + diasDesdeInicio(clube));
  const decorrido = diasDesdeInicio(clube) / total;

  return clube.membros.map((slug) => {
    if (slug === EU) return { slug, capitulo: meuCapitulo(clube) };
    const fracao = Math.min(1, Math.max(0, decorrido + desvioEstavel(slug, clube.id)));
    return { slug, capitulo: Math.max(1, Math.round(fracao * capitulos)) };
  });
}

function diasDesdeInicio(clube: Clube): number {
  return Math.max(0, -diasAte(clube.ciclo.inicio));
}

/**
 * Onde **a roda** está: a mediana dos membros, não o campeão.
 *
 * A mediana é uma escolha de produto, não de estatística: a média é puxada por
 * quem devorou o livro em dois dias, e mostrar o líder transformaria o clube em
 * corrida — exatamente o que a decisão contra gamificação evita, porque leva a
 * pessoa a **mentir o progresso**, e progresso mentido quebra a trava de
 * spoiler (ROTEIRO 4.39).
 */
export function capituloDaRoda(clube: Clube): number {
  const capitulos = progressoDosMembros(clube)
    .map((item) => item.capitulo)
    .sort((a, b) => a - b);
  if (capitulos.length === 0) return 0;
  const meio = Math.floor(capitulos.length / 2);
  return capitulos.length % 2 === 0
    ? Math.round((capitulos[meio - 1] + capitulos[meio]) / 2)
    : capitulos[meio];
}

/** O nome de um membro, resolvido — `EU` vira "Você". */
export function nomeDoMembro(slug: string): string {
  if (slug === EU) return "Você";
  return community.find((membro) => membro.slug === slug)?.name ?? "Alguém";
}

/** A cor do avatar de um membro (a mesma de `community.ts`). */
export function corDoMembro(slug: string): string {
  if (slug === EU) return "from-primary to-[#f59e0b]";
  return community.find((membro) => membro.slug === slug)?.color ?? "from-white/20 to-white/10";
}
