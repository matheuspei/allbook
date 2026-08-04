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
  /**
   * **Clube fechado: entrar depende do moderador.**
   *
   * Nasceu de um argumento do Matheus sobre a sala de escuta ao vivo (§4.81):
   * *"o anfitrião tem opção de privar o clube e aceitar quem entra ou não… então
   * ele já tem poder de banir as pessoas"*. Ele defendeu a privacidade da sala
   * apoiado neste poder — e, ao conferir, **ele não existia**. Havia limite de
   * vagas e fila de espera, que são outra coisa: controlam *quantos*, nunca
   * *quem*.
   *
   * Ausente ou `false` = qualquer um entra, como sempre foi.
   */
  privado?: boolean;
  /**
   * **Clube ao vivo** — a turma ouve junto, em sessões marcadas (§4.81).
   *
   * > *"O clube do livro pode ser como já é, mas também pode ser ao vivo. A
   * > ideia é poder fazer um clube do livro com hora marcada e as pessoas
   * > interagirem de forma ao vivo."*
   *
   * ⚠️ **Não é um segundo tipo de clube, é uma vocação.** Tudo continua
   * existindo — rodada, mural, votação, estante —, e a rodada **continua sem
   * hora** (§4.39). O que muda é o que a tela oferece primeiro: um clube ao vivo
   * abre com "marcar a próxima sessão", e um clube comum não fala de sessão
   * nenhuma até alguém marcar uma.
   *
   * Foi assim e não com dois tipos separados porque a §4.43 já registrou o que
   * acontece quando duas coisas parecidas viram entidades diferentes: elas
   * divergem, e o app passa a ter dois lugares para a mesma pergunta.
   */
  aoVivo?: boolean;
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
  /* ------------------------------------------------------------------ *
   * O resto do povoado (28/07, ROTEIRO 4.42).
   *
   * **Por que existem:** o Matheus pediu para *"criar alguns clubes bem
   * aleatórios, colocando pessoas, colocando estreia, enchendo isso"* — só assim
   * dá para ver se o carrossel, a busca e as pastilhas de tópico aguentam
   * quantidade. Com cinco clubes tudo parece organizado; o desenho só se prova
   * com vinte.
   *
   * Nada aqui é aleatório de verdade — é variado **de propósito**, para cada
   * caso limite aparecer na tela: clube lotado, clube de duas pessoas, estreia
   * hoje e estreia daqui a dez dias, ciclo no começo e ciclo quase no fim,
   * gênero com muitos clubes e gênero com um só.
   * ------------------------------------------------------------------ */
  {
    id: "1984-quinta",
    nome: "Distopia às Quintas",
    descricao:
      "Lemos os clássicos que todo mundo cita e pouca gente terminou. Um por mês, sem vergonha de achar datado.",
    donoSlug: "gustavo-a",
    membros: ["gustavo-a", "nara", "elias", "sandra-l", "caio", "tereza-m", "vitor-h"],
    ciclo: cicloSemeado(130, 16, 4),
    estante: [{ bookId: 131, terminadoEm: "2026-06-20" }],
    genero: "Ficção Científica",
    limite: 10,
  },
  {
    id: "tres-corpos",
    nome: "O Problema dos 3 Corpos — leitura guiada",
    descricao:
      "A física assusta mais que a trama. Vamos devagar, explicando o que der, sem estragar nada de ninguém.",
    donoSlug: "elias",
    membros: ["elias", "hugo-p", "caio", "otavio"],
    ciclo: cicloSemeado(109, 6, 6),
    estante: [],
    genero: "Ficção Científica",
  },
  {
    id: "tolkien-ano",
    nome: "Um ano na Terra-média",
    descricao: "O Senhor dos Anéis em ritmo humano. Quem já leu volta pelo prazer; quem nunca leu descobre.",
    donoSlug: "sandra-l",
    membros: ["sandra-l", "marcos-v", "iara", "dani-r", "paulo-s", "bia-costa"],
    ciclo: cicloSemeado(129, 30, 8),
    estante: [],
    genero: "Ficção Científica",
    limite: 6,
  },
  {
    id: "romance-cafe",
    nome: "Romance com café",
    descricao: "Sem julgamento e sem ironia: a gente vem chorar mesmo. Um por mês, e vale reler os favoritos.",
    donoSlug: "bia-costa",
    membros: ["bia-costa", "renata-v", "lia-f", "marina-t", "nara", "juliana-s", "iara", "sandra-l"],
    ciclo: cicloSemeado(141, 11, 4),
    estante: [
      { bookId: 142, terminadoEm: "2026-06-25" },
      { bookId: 143, terminadoEm: "2026-05-28" },
    ],
    genero: "Romance",
  },
  {
    id: "austen",
    nome: "Clube Jane Austen",
    descricao: "Orgulho e Preconceito de novo, sim. E de novo no ano que vem. A conversa nunca é a mesma.",
    donoSlug: "renata-v",
    membros: ["renata-v", "marina-t", "lia-f"],
    ciclo: cicloSemeado(140, -6, 5),
    estante: [{ bookId: 307, terminadoEm: "2026-07-02" }],
    genero: "Romance",
  },
  {
    id: "sexta-13",
    nome: "Sexta-feira 13",
    descricao: "Terror clássico, um por mês, e a regra é só uma: ninguém conta o susto antes da hora.",
    donoSlug: "otavio",
    membros: ["otavio", "hugo-p", "paulo-s", "dani-r", "vitor-h", "beto", "caio", "tereza-m", "iara"],
    ciclo: cicloSemeado(144, 21, 5),
    estante: [{ bookId: 305, terminadoEm: "2026-06-18" }],
    genero: "Terror",
    limite: 9,
  },
  {
    id: "exorcista",
    nome: "Não durmo mais",
    descricao: "Começou como brincadeira e virou compromisso. Ouvimos de dia, porque à noite ninguém aguenta.",
    donoSlug: "hugo-p",
    membros: ["hugo-p", "iara"],
    ciclo: cicloSemeado(145, -3, 4),
    estante: [],
    genero: "Terror",
  },
  {
    id: "poltrona",
    nome: "Detetives de poltrona",
    descricao:
      "Cada um aposta em quem foi antes da metade. Quem acertar leva o direito de escolher o próximo livro.",
    donoSlug: "marcos-v",
    membros: ["marcos-v", "ana-paula", "tereza-m", "gustavo-a", "renata-v", "elias", "nara"],
    ciclo: cicloSemeado(119, 14, 4),
    estante: [
      { bookId: 3, terminadoEm: "2026-06-30" },
      { bookId: 2, terminadoEm: "2026-05-20" },
    ],
    genero: "Mistério",
  },
  {
    id: "garota-trem",
    nome: "Narradoras não confiáveis",
    descricao: "Só livros em que a pessoa que conta a história esconde alguma coisa. É o nosso tipo favorito.",
    donoSlug: "juliana-s",
    membros: ["juliana-s", "carla-lima", "bia-costa", "lia-f", "marina-t"],
    ciclo: cicloSemeado(120, -2, 4),
    estante: [],
    genero: "Mistério",
    limite: 5,
  },
  {
    id: "dinheiro-adulto",
    nome: "Dinheiro de gente adulta",
    descricao:
      "Um livro de finanças por mês e uma conversa honesta: o que você mudou de verdade na sua vida?",
    donoSlug: "ricardo",
    membros: ["ricardo", "felipe-g", "gustavo-a", "paulo-s", "vitor-h", "otavio"],
    ciclo: cicloSemeado(101, 9, 4),
    estante: [{ bookId: 125, terminadoEm: "2026-06-12" }],
    genero: "Negócios",
    limite: 12,
  },
  {
    id: "pense-de-novo",
    nome: "Mudei de ideia",
    descricao: "Clube de quem gosta de estar errado. Cada rodada alguém defende a opinião contrária à sua.",
    donoSlug: "caio",
    membros: ["caio", "dani-r", "sandra-l", "elias"],
    ciclo: cicloSemeado(108, -8, 3),
    estante: [],
    genero: "Negócios",
  },
  {
    id: "vidas-inteiras",
    nome: "Vidas inteiras",
    descricao: "Biografia é o único jeito de viver duas vezes. Uma por mês, e sempre de gente muito diferente.",
    donoSlug: "luciana",
    membros: ["luciana", "tereza-m", "nara", "renata-v", "iara", "marcos-v", "bia-costa", "paulo-s", "lia-f"],
    ciclo: cicloSemeado(112, 24, 6),
    estante: [
      { bookId: 111, terminadoEm: "2026-06-08" },
      { bookId: 135, terminadoEm: "2026-04-30" },
    ],
    genero: "Biografia",
  },
  {
    id: "anne-frank",
    nome: "O Diário, devagar",
    descricao: "Um trecho por dia, sem pressa. É curto, mas não é para maratonar.",
    donoSlug: "marina-t",
    membros: ["marina-t", "lia-f", "sandra-l", "dani-r"],
    ciclo: cicloSemeado(136, -1, 4),
    estante: [],
    genero: "Biografia",
    limite: 4,
  },
  {
    id: "manha-cedo",
    nome: "O clube das 5 da manhã (literal)",
    descricao:
      "A gente lê o livro e tenta acordar às 5 junto. Metade desiste na segunda semana e tudo bem.",
    donoSlug: "felipe-g",
    membros: ["felipe-g", "otavio", "hugo-p", "vitor-h", "caio", "gustavo-a", "ricardo"],
    ciclo: cicloSemeado(4, 5, 4),
    estante: [],
    genero: "Autoajuda",
  },
  {
    id: "alquimista",
    nome: "Segunda leitura",
    descricao: "Livros que a gente leu adolescente e quer ver o que sobrou. Nem sempre sobra — e é o interessante.",
    donoSlug: "tereza-m",
    membros: ["tereza-m", "nara", "iara", "beto", "renata-v"],
    ciclo: cicloSemeado(203, -5, 3),
    estante: [{ bookId: 201, terminadoEm: "2026-07-05" }],
    genero: "Autoajuda",
  },
  {
    id: "essencialismo",
    nome: "Menos coisas",
    descricao: "Produtividade sem culpa. Se você não fez a tarefa da semana, vem assim mesmo.",
    donoSlug: "dani-r",
    membros: ["dani-r", "sandra-l", "luciana", "paulo-s", "marina-t", "felipe-g"],
    ciclo: cicloSemeado(107, 18, 4),
    estante: [{ bookId: 124, terminadoEm: "2026-06-22" }],
    genero: "Produtividade",
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
  /**
   * Quem entrou por **convite seu**: clubeId → slugs.
   *
   * Guardado à parte pela mesma razão dos removidos: o esqueleto fica intacto e
   * só a sua ação é gravada. Quando houver servidor isto vira um POST, e a tela
   * não muda.
   */
  convidados: Record<string, string[]>;
  /**
   * Nome e descrição trocados pelo moderador: clubeId → o novo texto.
   *
   * **Existe porque um clube que troca de assunto precisa trocar de nome**
   * (§4.58): o nome nasce colado ao primeiro livro ("Duna nas quintas") e, três
   * ciclos depois, mente. Guardado por fora, como todo o resto, para o esqueleto
   * ficar intacto.
   */
  renomeados: Record<string, { nome: string; descricao: string }>;
  /** Clubes cheios em que você entrou na fila: ids. */
  naFila: string[];
  /** Quantas pessoas cabem: clubeId → limite. Ausente = sem limite. */
  limites: Record<string, number>;
  /** Clubes semeados que você apagou (só acontece nos que você modera). */
  apagados: string[];
  /**
   * **Privacidade que o moderador mexeu:** clubeId → fechado ou não.
   *
   * Por fora, como todo o resto, para o esqueleto ficar intacto: assim um clube
   * semeado pode ser fechado por você sem reescrever a semente.
   */
  privacidade: Record<string, boolean>;
  /**
   * **Quem pediu para entrar num clube fechado:** clubeId → slugs.
   *
   * A sua vez também mora aqui (`EU`), e é o que faz a tela dizer "seu pedido
   * está com o moderador" em vez de fingir que você entrou.
   */
  pedidos: Record<string, string[]>;
  /**
   * **Quem foi banido:** clubeId → slugs.
   *
   * ⚠️ **Banir não é remover, e a diferença é o ponto.** Removido pode voltar —
   * inclusive por convite, que é uma decisão nova do moderador (ver
   * `adicionarMembro`). Banido **não volta**: nem entrando, nem pela fila, nem
   * por convite. Sem essa distinção, "banir" seria só um botão com nome mais
   * forte, e a proteção que o Matheus descreveu não existiria.
   */
  banidos: Record<string, string[]>;
}

const VAZIO: EstadoLocal = {
  criados: [],
  entrou: [],
  ciclos: {},
  estantes: {},
  removidos: {},
  convidados: {},
  renomeados: {},
  naFila: [],
  limites: {},
  apagados: [],
  privacidade: {},
  pedidos: {},
  banidos: {},
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
      convidados: guardado.convidados ?? {},
      renomeados: guardado.renomeados ?? {},
      naFila: Array.isArray(guardado.naFila) ? guardado.naFila : [],
      limites: guardado.limites ?? {},
      apagados: Array.isArray(guardado.apagados) ? guardado.apagados : [],
      privacidade: guardado.privacidade ?? {},
      pedidos: guardado.pedidos ?? {},
      banidos: guardado.banidos ?? {},
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
  const renomeado = estado.renomeados[clube.id];
  /* Quem entrou por convite seu vale para clube semeado **e** para clube seu —
     por isso a soma acontece aqui, e não no `comAlteracoes`, que só passa pelos
     semeados. */
  const convidados = (estado.convidados[clube.id] ?? []).filter(
    (slug) => !clube.membros.includes(slug),
  );
  const membros = [...clube.membros, ...convidados];

  /* Banido sai da lista de membros junto com quem foi removido: quem não pode
     voltar também não pode continuar dentro. */
  const banidos = estado.banidos[clube.id] ?? [];
  const foraDeVez = [...(fora ?? []), ...banidos];
  const privado = estado.privacidade[clube.id];

  return {
    ...clube,
    ...(renomeado ? { nome: renomeado.nome, descricao: renomeado.descricao } : {}),
    membros: foraDeVez.length ? membros.filter((slug) => !foraDeVez.includes(slug)) : membros,
    ...(limite !== undefined ? { limite } : {}),
    ...(privado !== undefined ? { privado } : {}),
  };
}

/**
 * Troca o nome (e a descrição) de um clube que você modera.
 *
 * **Por que isto faltava** (§4.58): o nome era fixo desde a criação, e o clube
 * que muda de assunto ficava com um nome que mente. O Matheus descreveu o ciclo
 * inteiro numa frase — *"muda o nome, escolhe o próximo livro"* —, e a segunda
 * metade já existia (a votação).
 *
 * **Vale para clube semeado e para clube seu**, e por isso mora no `renomeados`
 * em vez de reescrever a lista `criados`: um caminho só, e o esqueleto intacto.
 * **Nome vazio não passa** — clube sem nome não tem como ser citado nem achado.
 */
export function renomearClube(clubeId: string, nome: string, descricao: string): boolean {
  const limpo = nome.trim().slice(0, 40);
  if (!limpo) return false;
  const estado = readEstado();
  salvar({
    ...estado,
    renomeados: {
      ...estado.renomeados,
      [clubeId]: { nome: limpo, descricao: descricao.trim().slice(0, 200) },
    },
  });
  return true;
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

/**
 * Os clubes de outro leitor — para a página dele (§4.56).
 *
 * Vale para clube semeado **e** para os seus: se você convidou alguém para um
 * clube seu, ele aparece na página dessa pessoa, porque `todosOsClubes` já traz
 * os dois e a lista de membros já foi somada em `moderado`.
 */
export function clubesDe(slug: string): Clube[] {
  return todosOsClubes().filter((clube) => clube.membros.includes(slug));
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

/** Um clube sugerido com o **porquê** escrito — a seção "Para você" (§4.99). */
export interface ClubeComMotivo {
  clube: Clube;
  motivo: string;
}

/**
 * Clubes abertos que combinam com os que você **já frequenta** — com o motivo.
 *
 * Pedido do Matheus na folha dos clubes (04/08): *"uma aba de recomendação…
 * clubes abertos que você possa entrar"*. O motivo vai escrito no cartão
 * ("porque você está no Não durmo mais") porque vitrine genérica não convence
 * ninguém — é a mesma régua das sugestões com motivo da Comunidade.
 *
 * Clube cheio fica de fora: recomendar porta fechada é convite que mente.
 * A ordem: o gênero em que você está em **mais** clubes vem primeiro — é o
 * sinal mais forte do que você realmente gosta.
 */
export function clubesParaVoce(maximo = 3): ClubeComMotivo[] {
  const meusPorGenero = new Map<string, Clube[]>();
  for (const clube of meusClubes()) {
    meusPorGenero.set(clube.genero, [...(meusPorGenero.get(clube.genero) ?? []), clube]);
  }

  return todosOsClubes()
    .filter((clube) => !souMembro(clube) && !clubeCheio(clube) && meusPorGenero.has(clube.genero))
    .sort((a, b) => {
      const pesoA = meusPorGenero.get(a.genero)?.length ?? 0;
      const pesoB = meusPorGenero.get(b.genero)?.length ?? 0;
      return pesoB - pesoA || b.membros.length - a.membros.length;
    })
    .slice(0, maximo)
    .map((clube) => {
      const irmaos = meusPorGenero.get(clube.genero) ?? [];
      return {
        clube,
        motivo:
          irmaos.length > 1
            ? `você está em ${irmaos.length} clubes de ${clube.genero.toLowerCase()}`
            : `porque você está no ${irmaos[0]?.nome ?? "seu clube"}`,
      };
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

/* ------------------------------------------------------------------ *
 * Achar um clube no meio de muitos (ROTEIRO 4.42).
 *
 * **Por que isto passou a existir.** A tela dos clubes tinha duas gavetas —
 * "seus clubes" e "clubes em andamento" — e o Matheus viu o problema antes de
 * ele acontecer: *"imagina que a gente vai ter uma tela que tenha centenas de
 * clubes de livros; da forma como está estruturada hoje não está muito legal"*.
 * Uma lista corrida de 300 clubes não se lê; ela precisa de **busca** e de
 * **assunto**, que foi a saída que ele mesmo sugeriu ("talvez colocar por
 * tópicos, por exemplo").
 * ------------------------------------------------------------------ */

/** Tira acento e caixa: buscar "misterio" tem de achar "Mistério". */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Os assuntos que **existem de fato**, com quantos clubes cada um tem.
 *
 * Sai dos clubes, não da lista de gêneros do catálogo: um filtro "Romance" que
 * devolve zero clubes é o botão morto que a 4.23 mandou varrer. A ordem é por
 * quantidade — o assunto com mais gente é o que mais serve a quem chega.
 */
export function topicosDeClube(): { genero: string; total: number }[] {
  const contagem = new Map<string, number>();
  for (const clube of todosOsClubes()) {
    contagem.set(clube.genero, (contagem.get(clube.genero) ?? 0) + 1);
  }
  return Array.from(contagem.entries())
    .map(([genero, total]) => ({ genero, total }))
    .sort((a, b) => b.total - a.total || a.genero.localeCompare(b.genero));
}

/**
 * Busca por nome do clube, descrição, **título do livro e autor**.
 *
 * O livro entra na busca de propósito: quem procura clube quase sempre procura
 * pelo que quer ouvir ("tem alguém lendo Duna?"), não pelo nome que a turma deu
 * a si mesma. Procurar só pelo nome do clube devolveria vazio na pergunta mais
 * comum que existe.
 */
export function buscarClubes(clubes: Clube[], texto: string, topico?: string): Clube[] {
  const termo = normalizar(texto);

  return clubes.filter((clube) => {
    if (topico && clube.genero !== topico) return false;
    if (!termo) return true;

    const livro = catalog.find((item) => item.id === clube.ciclo.bookId);
    const palheiro = normalizar(
      `${clube.nome} ${clube.descricao} ${clube.genero} ${livro?.title ?? ""} ${livro?.author ?? ""}`,
    );
    return palheiro.includes(termo);
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
 * Os clubes que ainda vão começar, do mais próximo ao mais distante — **todos**,
 * os seus incluídos. É a lista bruta; a vitrine usa `estreiasParaDescobrir`.
 */
export function clubesComecando(): Clube[] {
  return todosOsClubes()
    .filter(estaComecando)
    .sort((a, b) => a.ciclo.inicio.localeCompare(b.ciclo.inicio));
}

/**
 * As estreias que **não são suas** — o que a vitrine e a página de estreias
 * mostram (§4.99).
 *
 * Até 04/08 a vitrine usava `clubesComecando` inteiro, com a justificativa de
 * que "quem criou um clube quer vê-lo na vitrine". O uso provou o contrário: o
 * Matheus, em 8 clubes, viu "Não durmo mais" e "Clube Jane Austen" **duas vezes
 * na mesma tela** — entre os seus e no carrossel. A regra que ficou, escolhida
 * por ele na folha: estreia sua mora **entre os seus**, com a etiqueta de
 * estreia; a vitrine é só o que dá para você entrar.
 */
export function estreiasParaDescobrir(): Clube[] {
  return clubesComecando().filter((clube) => !souMembro(clube));
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

/* ------------------------------------------------------------------ *
 * Lista de espera — o que fazer quando o clube está cheio (§4.58).
 *
 * **O problema que ela resolve:** clube lotado era um beco sem saída. A tela
 * dizia "este clube está cheio" e acabava ali — a pessoa que se interessou não
 * tinha o que fazer, e o moderador não ficava sabendo que havia gente querendo
 * entrar. É exatamente o tipo de porta fechada que a §4.23 manda varrer.
 *
 * **Teto de 250** (número do Matheus). Não é limite técnico: é o ponto em que
 * uma fila deixa de ser uma promessa e vira mentira — ninguém entra em 250º
 * lugar num clube de oito pessoas.
 *
 * **A "turma 2" foi retirada, e continua fora.** Eu tinha proposto que o clube
 * cheio gerasse automaticamente uma segunda turma; o Matheus perguntou por que
 * ela existiria se o moderador já pode aumentar o limite ou criar outro clube, e
 * eu não consegui fundamentar. O que multiplica clube é outra coisa, e já está
 * construída: quem perde a votação funda o clube do livro que queria (§4.69).
 * ------------------------------------------------------------------ */

/** Quantas pessoas cabem na fila de um clube. */
export const TETO_DA_FILA = 250;

/** Quem está na fila deste clube — os fictícios e, se for o caso, você. */
export function filaDoClube(clubeId: string): string[] {
  const clube = clubePorId(clubeId);
  if (!clube) return [];
  const naFila = readEstado().naFila.includes(clubeId);
  return [...filaSemeada(clube), ...(naFila ? [EU] : [])];
}

/**
 * A fila fictícia de um clube cheio — **estável, e proporcional ao clube**.
 *
 * Sem servidor não há fila de verdade, mas uma fila sempre vazia esconderia o
 * que a peça significa: entrar numa fila de 6 pessoas é diferente de entrar numa
 * de 1. A semente é o id do clube, então o número não muda a cada desenho — a
 * mesma honestidade do progresso dos membros e das curtidas.
 */
function filaSemeada(clube: Clube): string[] {
  if (!clubeCheio(clube)) return [];
  let semente = 0;
  for (let i = 0; i < clube.id.length; i += 1) semente = (semente * 31 + clube.id.charCodeAt(i)) % 9973;
  const quantos = semente % 5;
  return community
    .filter((membro) => !clube.membros.includes(membro.slug))
    .slice(0, quantos)
    .map((membro) => membro.slug);
}

/** A sua posição na fila, começando em 1. `undefined` se você não está nela. */
export function minhaPosicaoNaFila(clubeId: string): number | undefined {
  const posicao = filaDoClube(clubeId).indexOf(EU);
  return posicao === -1 ? undefined : posicao + 1;
}

/**
 * Entra na fila. Devolve `false` quando não dá — clube inexistente, você já é
 * membro, o clube não está cheio (aí é só entrar) ou a fila bateu no teto.
 */
export function entrarNaFila(clubeId: string): boolean {
  const clube = clubePorId(clubeId);
  if (!clube || souMembro(clube) || !clubeCheio(clube)) return false;
  if (filaDoClube(clubeId).length >= TETO_DA_FILA) return false;

  const estado = readEstado();
  if (estado.naFila.includes(clubeId)) return false;
  salvar({ ...estado, naFila: [...estado.naFila, clubeId] });
  return true;
}

export function sairDaFila(clubeId: string): void {
  const estado = readEstado();
  salvar({ ...estado, naFila: estado.naFila.filter((id) => id !== clubeId) });
}

/**
 * Abriu vaga: **o primeiro da fila entra**.
 *
 * Chamada quando alguém sai ou é removido. Se o primeiro da fila for você, você
 * entra de verdade; se for um fictício, ele vira membro pelo mesmo caminho do
 * convite aceito (`adicionarMembro`). Deixar a vaga aberta com gente esperando
 * seria a fila não significar nada.
 */
export function chamarOProximoDaFila(clubeId: string): string | undefined {
  const clube = clubePorId(clubeId);
  if (!clube || clubeCheio(clube)) return undefined;
  const primeiro = filaDoClube(clubeId)[0];
  if (!primeiro) return undefined;

  if (primeiro === EU) {
    sairDaFila(clubeId);
    entrarNoClube(clubeId);
  } else {
    adicionarMembro(clubeId, primeiro);
  }
  return primeiro;
}

/**
 * Entrar num clube.
 *
 * **Devolve o que aconteceu**, porque agora há três finais possíveis e a tela
 * precisa dizer qual foi:
 *
 * - `"entrou"` — clube aberto, você está dentro;
 * - `"pediu"` — clube **fechado**: o pedido foi para o moderador (§4.81);
 * - `"barrado"` — você foi banido daqui, ou o clube está cheio.
 *
 * A checagem mora aqui e não só na tela pelo motivo de sempre: tela se contorna.
 */
export function entrarNoClube(id: string): "entrou" | "pediu" | "barrado" {
  const estado = readEstado();
  if (estado.criados.some((clube) => clube.id === id)) return "entrou";
  if (estado.entrou.includes(id)) return "entrou";

  const clube = clubePorId(id);

  /* Banido não entra, e é aqui que "banir" deixa de ser um botão com nome
     bonito: sem esta linha, quem foi banido voltaria no toque seguinte. */
  if (clube && (estado.banidos[id] ?? []).includes(EU)) return "barrado";

  /* O limite vale de verdade: entrar em clube lotado não pode ser possível só
     porque a tela deixou o botão aceso. A tela também esconde o botão. */
  if (clube && clubeCheio(clube)) return "barrado";

  /* Clube fechado: vira pedido. Entrar sozinho num clube que escolheu quem
     entra desfaria a escolha inteira. */
  if (clube?.privado) {
    const fila = estado.pedidos[id] ?? [];
    if (!fila.includes(EU)) {
      salvar({ ...estado, pedidos: { ...estado.pedidos, [id]: [...fila, EU] } });
    }
    return "pediu";
  }

  salvar({ ...estado, entrou: [...estado.entrou, id] });
  return "entrou";
}

/* ------------------------------------------------------------------ *
 * Clube fechado: quem entra é escolhido (ROTEIRO §4.81)
 * ------------------------------------------------------------------ */

/** Abrir ou fechar o clube. Só o moderador. */
export function definirPrivacidade(clubeId: string, privado: boolean): void {
  const clube = clubePorId(clubeId);
  if (!clube || !souDono(clube)) return;
  const estado = readEstado();
  salvar({ ...estado, privacidade: { ...estado.privacidade, [clubeId]: privado } });
}

/**
 * Quem está esperando aprovação.
 *
 * ⚠️ **Os pedidos de outras pessoas são simulados e estáveis** (semente pelo id
 * do clube), como o progresso dos membros: sem servidor ninguém pede nada de
 * verdade. Um clube fechado sem nenhum pedido para aprovar seria uma tela de
 * moderação que nunca modera — e aí o poder que o Matheus pediu existiria só no
 * papel.
 */
export function pedidosDoClube(clubeId: string): string[] {
  const clube = clubePorId(clubeId);
  if (!clube?.privado) return [];

  const estado = readEstado();
  const meus = estado.pedidos[clubeId] ?? [];
  const recusados = estado.banidos[clubeId] ?? [];

  const semente = clubeId.split("").reduce((soma, letra) => soma + letra.charCodeAt(0), 0);
  const forasteiros = community
    .filter((pessoa) => !clube.membros.includes(pessoa.slug))
    .filter((_, i) => (semente + i) % 7 === 0)
    .slice(0, 3)
    .map((pessoa) => pessoa.slug);

  return [...meus, ...forasteiros].filter(
    (slug, i, lista) =>
      lista.indexOf(slug) === i && !recusados.includes(slug) && !clube.membros.includes(slug),
  );
}

/** O moderador deixou entrar. */
export function aprovarEntrada(clubeId: string, slug: string): void {
  const clube = clubePorId(clubeId);
  if (!clube || !souDono(clube)) return;

  const estado = readEstado();
  const semOPedido = {
    ...estado.pedidos,
    [clubeId]: (estado.pedidos[clubeId] ?? []).filter((item) => item !== slug),
  };

  if (slug === EU) {
    salvar({ ...estado, pedidos: semOPedido, entrou: [...estado.entrou, clubeId] });
    return;
  }
  salvar({
    ...estado,
    pedidos: semOPedido,
    convidados: {
      ...estado.convidados,
      [clubeId]: [...(estado.convidados[clubeId] ?? []), slug],
    },
  });
}

/**
 * O moderador recusou.
 *
 * Recusar **não bane** — só tira o pedido da fila. Quem foi recusado pode pedir
 * de novo, e é assim que deve ser: uma recusa não é uma sentença.
 */
export function recusarEntrada(clubeId: string, slug: string): void {
  const clube = clubePorId(clubeId);
  if (!clube || !souDono(clube)) return;
  const estado = readEstado();
  salvar({
    ...estado,
    pedidos: {
      ...estado.pedidos,
      [clubeId]: (estado.pedidos[clubeId] ?? []).filter((item) => item !== slug),
    },
  });
}

/** Você pediu para entrar e ainda não teve resposta? */
export function meuPedidoPendente(clubeId: string): boolean {
  return (readEstado().pedidos[clubeId] ?? []).includes(EU);
}

/**
 * **Banir — e banido não volta.**
 *
 * A diferença para `removerMembro` é o ponto todo: removido pode voltar (pela
 * porta, pela fila ou por convite); banido não entra por caminho nenhum. Sem
 * essa distinção, "banir" seria só um rótulo mais duro no mesmo botão.
 */
export function banirDoClube(clubeId: string, slug: string): void {
  const clube = clubePorId(clubeId);
  if (!clube || !souDono(clube) || slug === clube.donoSlug) return;

  const estado = readEstado();
  salvar({
    ...estado,
    banidos: { ...estado.banidos, [clubeId]: [...(estado.banidos[clubeId] ?? []), slug] },
    /* Sai também de onde ele poderia voltar sozinho. */
    convidados: {
      ...estado.convidados,
      [clubeId]: (estado.convidados[clubeId] ?? []).filter((item) => item !== slug),
    },
    pedidos: {
      ...estado.pedidos,
      [clubeId]: (estado.pedidos[clubeId] ?? []).filter((item) => item !== slug),
    },
  });
}

/** Desfazer o banimento — decisão nova do moderador, como readmitir. */
export function desbanir(clubeId: string, slug: string): void {
  const estado = readEstado();
  salvar({
    ...estado,
    banidos: {
      ...estado.banidos,
      [clubeId]: (estado.banidos[clubeId] ?? []).filter((item) => item !== slug),
    },
  });
}

export function banidosDoClube(clubeId: string): string[] {
  return readEstado().banidos[clubeId] ?? [];
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

  /* Saiu você, abriu vaga: quem estava esperando entra. Sem isto a fila seria
     uma lista que nunca anda — e fila que não anda é pior que não ter fila. */
  chamarOProximoDaFila(id);
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
/**
 * Põe alguém na turma — **é o que acontece quando um convite é aceito**.
 *
 * Respeita o limite pela mesma razão que `entrarNoClube`: se a tela deixasse o
 * botão aceso num clube lotado, o limite viraria enfeite. E desfaz uma remoção
 * anterior, porque readmitir por convite é uma decisão nova do moderador.
 */
export function adicionarMembro(clubeId: string, slug: string): void {
  const clube = clubePorId(clubeId);
  if (!clube || clubeCheio(clube) || clube.membros.includes(slug)) return;

  const estado = readEstado();
  const atuais = estado.convidados[clubeId] ?? [];
  const fora = (estado.removidos[clubeId] ?? []).filter((item) => item !== slug);
  salvar({
    ...estado,
    convidados: { ...estado.convidados, [clubeId]: [...atuais, slug] },
    removidos: { ...estado.removidos, [clubeId]: fora },
  });
}

export function removerMembro(clubeId: string, slug: string): void {
  if (slug === EU) return;
  const clube = clubePorId(clubeId);
  if (!clube || !souDono(clube)) return;

  const estado = readEstado();
  const jaFora = estado.removidos[clubeId] ?? [];
  if (jaFora.includes(slug)) return;

  salvar({ ...estado, removidos: { ...estado.removidos, [clubeId]: [...jaFora, slug] } });

  chamarOProximoDaFila(clubeId);
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
  /** Clube fechado desde o nascimento: entrar vira pedido (§4.81). */
  privado?: boolean;
  /**
   * **O clube nasce ao vivo** (§4.81): a turma combina de ouvir junto, em
   * sessões com hora, em vez de só responder à rodada quando der.
   *
   * Não muda o mecanismo — muda o que a tela do clube oferece primeiro e o que
   * ela ensina. Pedido do Matheus: *"o clube do livro pode ser como já é, mas
   * também pode ser ao vivo"*.
   */
  aoVivo?: boolean;
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
    ...(dados.privado ? { privado: true } : {}),
    ...(dados.aoVivo ? { aoVivo: true } : {}),
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

/* ------------------------------------------------------------------ *
 * Gente a mais, só para o clube.
 *
 * **Por que existe aqui e não em `community.ts`:** os oito leitores de lá são
 * perfis completos (bio, horas ouvidas, conquistas, recomendações) e sustentam a
 * tela Comunidade. Para o clube basta um nome e uma cor — um clube de dez pessoas
 * não precisa de dez biografias, precisa de dez avatares. Botar meia dúzia de
 * perfis pela metade lá dentro estragaria a outra tela.
 *
 * São **figurantes declarados**: aparecem como membros e na régua do grupo, e a
 * tela do clube já diz, no rodapé, que os outros membros são fictícios.
 * ------------------------------------------------------------------ */
/*
 * A lista de figurantes que ficava aqui **foi promovida a gente de verdade** em
 * 29/07: os 16 estão em `community.ts`, com bio e página própria. O defeito que
 * motivou a mudança apareceu no cartão de clube do feed — *"moderado por Elias"*
 * não era clicável, porque o Elias não existia como pessoa em lugar nenhum.
 *
 * **A regra que fica: quem aparece no app tem página.** E o nome de cada um
 * passa a viver num lugar só, em vez de duplicado em duas listas que podiam
 * divergir.
 */

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
