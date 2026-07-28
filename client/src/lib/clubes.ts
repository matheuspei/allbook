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
  /**
   * Quantas pessoas cabem. Ausente = sem limite.
   *
   * **Pedido do Matheus em 28/07** (ROTEIRO 4.40), e ele tem razão de produto:
   * clube de leitura tem um tamanho útil. Com quatro pessoas todo mundo responde
   * a todo mundo; com quarenta a conversa vira mural de avisos e ninguém se sente
   * responsável por aparecer. Deixar o dono escolher é o que permite um clube
   * pequeno e íntimo existir ao lado de um aberto e grande.
   */
  limite?: number;
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

/** `somarDias` com nome público — a tela de criar clube precisa dela. */
export function somarDiasIso(iso: string, dias: number): string {
  return somarDias(iso, dias);
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

/** Dias entre duas datas (positivo quando `fim` vem depois de `inicio`). */
export function diasEntre(inicio: string, fim: string): number {
  const a = new Date(`${inicio}T12:00:00`).getTime();
  const b = new Date(`${fim}T12:00:00`).getTime();
  return Math.round((b - a) / 86400000);
}

/**
 * Marcos **sugeridos** entre duas datas quaisquer — a partir daqui o moderador
 * edita à vontade.
 *
 * **Por que passou a existir** (ROTEIRO 4.42): a versão anterior só sabia gerar
 * ciclos de 2, 3, 4 ou 6 semanas fechadas, porque o formulário só oferecia esses
 * botões. O Matheus apontou o problema com todas as letras — o moderador *"não
 * consegue dizer qual é o dia que ele quer que acabe"*. Agora o ciclo é definido
 * por **duas datas**, e os marcos são apenas um ponto de partida razoável dentro
 * delas: divide o período em semanas (ou no que couber) e reparte os capítulos.
 *
 * A regra de arredondamento garante que o **último marco é sempre o livro
 * inteiro** — um ciclo que termina no capítulo 12 de 13 deixaria o final fora do
 * combinado, e é justamente o final que a turma quer discutir junta.
 */
export function marcosSugeridos(bookId: number, inicio: string, fim: string): Marco[] {
  const totalCapitulos = getChapters(bookId).length;
  const dias = Math.max(1, diasEntre(inicio, fim));
  /* Um marco por semana, no mínimo um e no máximo um por capítulo: pedir marco
     de dois em dois dias vira cobrança, e mais marcos que capítulos repetiria o
     mesmo número em linhas seguidas. */
  const quantos = Math.max(1, Math.min(totalCapitulos, Math.round(dias / 7)));
  const passoCap = totalCapitulos / quantos;
  const passoDias = dias / quantos;

  return Array.from({ length: quantos }, (_, i) => ({
    id: i + 1,
    chapter:
      i === quantos - 1 ? totalCapitulos : Math.min(totalCapitulos, Math.round(passoCap * (i + 1))),
    prazo: i === quantos - 1 ? fim : somarDias(inicio, Math.round(passoDias * (i + 1))),
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
 *
 * `diasDesdeOInicio` **negativo** = clube que ainda vai começar.
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
  /*
   * Um clube que **ainda não começou** — e ele existe por um pedido direto do
   * Matheus (27/07): *"deveria ter uma parte onde as pessoas pudessem ver: está
   * tendo um clube de tal livro, vai começar tal dia"*. Sem pelo menos um clube
   * em estreia, a seção "começando em breve" nasceria vazia e ninguém entenderia
   * para que ela serve.
   */
  /*
   * **Um clube que é seu, com gente dentro.** Existe por um problema prático,
   * não por enfeite: o Matheus pediu (28/07) que o moderador tivesse muita
   * autonomia — tirar gente, pôr assunto em votação, definir quantas vagas. Só
   * que um clube recém-criado nasce **só com você**, então a lista de membros
   * teria uma linha, sem ninguém para remover, e a tela de moderação nasceria
   * como botão morto — exatamente o que a 4.23 mandou varrer.
   *
   * A saída honesta foi semear um clube **do qual você é dono**, com os leitores
   * fictícios de `community.ts` dentro, e **dizer isso na própria descrição**.
   * Não é encenação: é o mesmo esqueleto declarado que o app usa em toda parte,
   * posto onde a moderação precisa dele. Apagar leva um toque.
   */
  {
    id: "exemplo-do-dono",
    nome: "Suspense de Domingo",
    descricao:
      "Exemplo: um clube com gente dentro, para você ver os poderes do moderador funcionando de verdade. Os membros são leitores fictícios — pode apagar este clube quando quiser.",
    donoSlug: EU,
    membros: [EU, "carla-lima", "marcos-v", "juliana-s", "beto"],
    ciclo: cicloSemeado(104, 9, 4),
    estante: [],
    genero: "Suspense",
    limite: 8,
  },
  {
    id: "duna-domingo",
    nome: "Duna, do começo",
    descricao:
      "Uma leitura guiada de Duna para quem sempre quis começar e travou nas primeiras cem páginas. Sem pressa, do primeiro capítulo ao fim.",
    donoSlug: "carla-lima",
    membros: ["carla-lima", "felipe-g", "juliana-s"],
    ciclo: cicloSemeado(7, -4, 6),
    estante: [],
    genero: "Ficção Científica",
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
  /** Membros que o moderador removeu: clubeId → slugs. */
  removidos: Record<string, string[]>;
  /** Quantas pessoas cabem: clubeId → limite. Ausente = sem limite. */
  limites: Record<string, number>;
  /** Clubes semeados que você apagou (só acontece nos que você modera). */
  apagados: string[];
}

const VAZIO: EstadoLocal = {
  criados: [],
  entrou: [],
  ciclos: {},
  estantes: {},
  removidos: {},
  limites: {},
  apagados: [],
};

function readEstado(): EstadoLocal {
  try {
    const guardado = JSON.parse(localStorage.getItem(CHAVE) || "null");
    if (!guardado || typeof guardado !== "object") return VAZIO;
    return {
      criados: Array.isArray(guardado.criados) ? guardado.criados : [],
      entrou: Array.isArray(guardado.entrou) ? guardado.entrou : [],
      ciclos: guardado.ciclos ?? {},
      estantes: guardado.estantes ?? {},
      removidos: guardado.removidos ?? {},
      limites: guardado.limites ?? {},
      apagados: Array.isArray(guardado.apagados) ? guardado.apagados : [],
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
  return moderado(
    {
      ...clube,
      membros: entrou ? [...clube.membros, EU] : clube.membros,
      ciclo: estado.ciclos[clube.id] ?? clube.ciclo,
      estante: [...(estado.estantes[clube.id] ?? []), ...clube.estante],
    },
    estado,
  );
}

/**
 * O que o moderador mexeu, aplicado por cima — vale igual para clube semeado e
 * para clube seu, e é por isso que mora numa função à parte.
 *
 * Guardar "quem foi removido" em vez de reescrever a lista de membros é a mesma
 * escolha do resto da casa: o esqueleto fica intacto e só a sua decisão é
 * guardada. Quando houver servidor, isto vira um DELETE e a tela não muda.
 */
function moderado(clube: Clube, estado: EstadoLocal): Clube {
  const fora = estado.removidos[clube.id];
  const limite = estado.limites[clube.id];

  return {
    ...clube,
    membros: fora ? clube.membros.filter((slug) => !fora.includes(slug)) : clube.membros,
    ...(limite !== undefined ? { limite } : {}),
  };
}

/** Todos os clubes que existem para você: os semeados e os seus. */
export function todosOsClubes(): Clube[] {
  const estado = readEstado();
  return [
    ...estado.criados.map((clube) => moderado(clube, estado)),
    ...clubesSemeados
      .filter((clube) => !estado.apagados.includes(clube.id))
      .map((clube) => comAlteracoes(clube, estado)),
  ];
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
    // Os que ainda vão estrear têm vitrine própria ("Começando em breve") — sem
    // este filtro, o mesmo clube apareceria duas vezes na mesma tela.
    .filter((clube) => !souMembro(clube) && !estaComecando(clube))
    .sort((a, b) => {
      const pesoA = generosOuvidos.has(a.genero) ? 0 : 1;
      const pesoB = generosOuvidos.has(b.genero) ? 0 : 1;
      return pesoA - pesoB || b.membros.length - a.membros.length;
    });
}

/**
 * O **seu** clube que está lendo este livro agora — a peça que faz o clube
 * existir dentro do player.
 *
 * **Por que isto precisou existir** (ROTEIRO 4.40): até 28/07 o clube aparecia em
 * cinco telas e em **nenhum** momento no `AudioPlayer` ou no `MiniPlayer`. A
 * pessoa passava dez horas ouvindo o livro do ciclo sem o clube existir ali — que
 * é exatamente onde ele tem algo a dizer, e a razão de ele parecer invisível.
 *
 * **Clube que ainda não estreou fica de fora:** ninguém da turma começou, então a
 * faixa só teria "a roda está no capítulo 0". Informação que não informa.
 */
export function meuClubeDoLivro(bookId: number): Clube | undefined {
  return meusClubes().find((clube) => clube.ciclo.bookId === bookId && !estaComecando(clube));
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

/* ------------------------------------------------------------------ *
 * Estreia: o clube que ainda vai começar.
 * ------------------------------------------------------------------ */

/**
 * O clube ainda não começou — está **em formação**.
 *
 * Existe porque entrar num clube que já vai no capítulo 6 é constrangedor: ou
 * você maratona para alcançar, ou fica lendo mensagem coberta. Um clube que
 * estreia daqui a três dias começa com todo mundo no mesmo lugar, e é isso que
 * faz alguém entrar. Foi o pedido do Matheus em 27/07: *"as pessoas poderiam ver
 * que está tendo um clube de tal livro e que vai começar tal dia"*.
 */
export function estaComecando(clube: Clube): boolean {
  return diasAte(clube.ciclo.inicio) > 0;
}

/** "começa amanhã", "estreia em 4 dias" — o texto do cartão de estreia. */
export function estreiaEmTexto(clube: Clube): string {
  const dias = diasAte(clube.ciclo.inicio);
  if (dias <= 0) return "já começou";
  if (dias === 1) return "começa amanhã";
  return `começa em ${dias} dias`;
}

/**
 * Os clubes que ainda vão começar, do mais próximo ao mais distante.
 *
 * Inclui os seus: quem criou um clube para estrear semana que vem quer vê-lo na
 * vitrine tanto quanto os outros — é assim que ele junta gente.
 */
export function clubesComecando(): Clube[] {
  return todosOsClubes()
    .filter(estaComecando)
    .sort((a, b) => a.ciclo.inicio.localeCompare(b.ciclo.inicio));
}

/**
 * O endereço do clube para mandar a alguém.
 *
 * **É um convite de verdade, mesmo sem servidor:** quem abrir o link cai na
 * página do clube, vê o livro, o ritmo e o combinado, e tem o botão de entrar
 * ali. Não existe "convite pendente" porque não existem contas para receber
 * convite — e um botão que finge mandar e-mail seria o teatro que este app
 * varre desde a 4.23.
 */
export function linkDoClube(id: string): string {
  return `${window.location.origin}/clube/${id}`;
}

/** Lotado: o limite que o dono definiu foi alcançado. */
export function clubeCheio(clube: Clube): boolean {
  return clube.limite !== undefined && clube.membros.length >= clube.limite;
}

/** Quantas vagas ainda há. `undefined` quando o clube não tem limite. */
export function vagasRestantes(clube: Clube): number | undefined {
  if (clube.limite === undefined) return undefined;
  return Math.max(0, clube.limite - clube.membros.length);
}

export function entrarNoClube(id: string): void {
  const estado = readEstado();
  if (estado.criados.some((clube) => clube.id === id)) return;
  if (estado.entrou.includes(id)) return;

  /* O limite vale de verdade: entrar em clube lotado não pode ser possível só
     porque a tela deixou o botão aceso. A tela também esconde o botão. */
  const clube = clubePorId(id);
  if (clube && clubeCheio(clube)) return;

  salvar({ ...estado, entrou: [...estado.entrou, id] });
}

export function sairDoClube(id: string): void {
  const estado = readEstado();
  const clube = clubePorId(id);

  /* Dono de clube semeado (o exemplo) apaga de verdade: sem isto ele voltaria
     na próxima abertura, porque o esqueleto é código, não dado. */
  const apagaSemeado = clube !== undefined && souDono(clube) && !estado.criados.some((c) => c.id === id);

  salvar({
    ...estado,
    entrou: estado.entrou.filter((item) => item !== id),
    criados: estado.criados.filter((c) => c.id !== id),
    apagados: apagaSemeado ? [...estado.apagados, id] : estado.apagados,
  });
}

/* ------------------------------------------------------------------ *
 * Poderes do moderador (ROTEIRO 4.40).
 *
 * O pedido do Matheus foi direto: *"esse cara tem que ter muita autonomia"*.
 * Os três que faltavam — tirar gente, pôr assunto em votação e dizer quantas
 * pessoas cabem — moram aqui. Todos checam a posse: quem não é dono não modera,
 * e a checagem fica na biblioteca (e não só na tela) porque tela se contorna.
 * ------------------------------------------------------------------ */

/**
 * Tirar alguém do clube.
 *
 * **Não dá para remover você mesmo:** o dono que quer sair está, na verdade,
 * apagando o clube — e essa é outra ação, com outra confirmação. Sem esta trava,
 * um clube ficaria sem dono e sem quem o modere.
 */
export function removerMembro(clubeId: string, slug: string): void {
  if (slug === EU) return;
  const clube = clubePorId(clubeId);
  if (!clube || !souDono(clube)) return;

  const estado = readEstado();
  const jaFora = estado.removidos[clubeId] ?? [];
  if (jaFora.includes(slug)) return;

  salvar({ ...estado, removidos: { ...estado.removidos, [clubeId]: [...jaFora, slug] } });
}

/** Devolver alguém que foi removido — todo poder de moderação precisa de volta. */
export function readmitirMembro(clubeId: string, slug: string): void {
  const clube = clubePorId(clubeId);
  if (!clube || !souDono(clube)) return;

  const estado = readEstado();
  salvar({
    ...estado,
    removidos: {
      ...estado.removidos,
      [clubeId]: (estado.removidos[clubeId] ?? []).filter((item) => item !== slug),
    },
  });
}

/** Quem o moderador tirou deste clube — para poder desfazer. */
export function membrosRemovidos(clubeId: string): string[] {
  return readEstado().removidos[clubeId] ?? [];
}

/**
 * Quantas pessoas cabem. `undefined` tira o limite.
 *
 * **Nunca abaixo de quem já está dentro:** diminuir o limite não expulsa
 * ninguém. Expulsar é uma decisão do moderador, tomada nome por nome — fazer
 * isso de lado, mexendo num número, seria a pior forma de perder um membro.
 */
export function definirLimite(clubeId: string, limite: number | undefined): void {
  const clube = clubePorId(clubeId);
  if (!clube || !souDono(clube)) return;

  const estado = readEstado();
  const limites = { ...estado.limites };

  if (limite === undefined) delete limites[clubeId];
  else limites[clubeId] = Math.max(clube.membros.length, limite);

  salvar({ ...estado, limites });
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
  /**
   * O ciclo inteiro, já decidido pelo moderador (ROTEIRO 4.42).
   *
   * **Antes esta função calculava o ciclo sozinha**, a partir de "daqui a quantos
   * dias" e "quantas semanas" — e por isso o formulário só podia oferecer
   * botõezinhos. Agora quem decide é a tela, e a biblioteca só guarda: data de
   * estreia livre, data do encontro livre, e marcos que o moderador editou um a
   * um. Nada disto é mais caro para um servidor — uma data continua sendo uma
   * data —, era simplificação de interface travando o dono do clube.
   */
  inicio: string;
  encontro: string;
  marcos: Marco[];
  /** Quantas pessoas cabem. Ausente = sem limite (ROTEIRO 4.40). */
  limite?: number;
}): Clube {
  const estado = readEstado();
  const livro = catalog.find((book) => book.id === dados.bookId);

  const clube: Clube = {
    id: `meu-${Date.now()}`,
    nome: dados.nome.trim(),
    descricao: dados.descricao.trim(),
    donoSlug: EU,
    membros: [EU],
    ciclo: {
      bookId: dados.bookId,
      inicio: dados.inicio,
      encontro: dados.encontro,
      marcos: dados.marcos,
    },
    estante: [],
    genero: livro?.genre ?? "Geral",
    ...(dados.limite !== undefined ? { limite: dados.limite } : {}),
  };

  salvar({ ...estado, criados: [clube, ...estado.criados] });
  return clube;
}

/**
 * Trocar o ciclo de um clube que você modera — datas e marcos.
 *
 * **Existe porque o combinado muda no meio do caminho** (ROTEIRO 4.42): metade
 * da turma atrasou, um feriado caiu no meio, o livro era mais longo do que
 * parecia. Sem isto o moderador só podia refazer o clube do zero, perdendo o
 * mural. Guardar o ciclo alterado em `ciclos` já era o caminho que a votação do
 * próximo livro usava — aqui ele só passa a valer também para quem é dono.
 */
export function editarCiclo(clubeId: string, ciclo: Ciclo): void {
  const clube = clubePorId(clubeId);
  if (!clube || !souDono(clube)) return;

  const estado = readEstado();
  const ehCriado = estado.criados.some((item) => item.id === clubeId);

  salvar(
    ehCriado
      ? {
          ...estado,
          criados: estado.criados.map((item) => (item.id === clubeId ? { ...item, ciclo } : item)),
        }
      : { ...estado, ciclos: { ...estado.ciclos, [clubeId]: ciclo } },
  );
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
    // Clube que ainda vai estrear: ninguém começou, e mostrar "capítulo 1"
    // faria a régua mentir logo na tela que serve para atrair gente.
    if (estaComecando(clube)) return { slug, capitulo: 0 };
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
