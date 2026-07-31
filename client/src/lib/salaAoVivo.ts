/**
 * **A sala de escuta ao vivo** — ouvir o mesmo livro, no mesmo segundo, com chat.
 *
 * ---
 *
 * **A ideia, em uma frase:** alguém abre a sala e **transmite o próprio player**;
 * quem entra cai no ponto em que a turma está e conversa **em cima da
 * transmissão**. Quem abriu manda no áudio — pausa, volta, encerra.
 *
 * Ideia do Matheus, 31/07. As decisões todas estão no **ROTEIRO §4.81**; aqui vão
 * só as que este arquivo precisa obedecer, com o porquê, para ninguém desfazer
 * sem saber:
 *
 * 1. **A transmissão é corrida, e o chat também.** *"A transmissão tem que ser
 *    corrida… assim a pessoa pode comentar em cima da transmissão."* Eu propus
 *    conversa só nas pausas e **perdi o argumento**: o valor da sala é reagir no
 *    segundo em que a frase toca. Conversa represada vira comentário — e
 *    comentário o app já tem.
 * 2. **Quem entra vê tudo, mas não controla nada.** *"Por mais que ela não possa
 *    pausar, é importante ela se situar onde está no livro."* Perder o controle é
 *    a regra; perder o **mapa** era defeito do meu desenho. Por isso
 *    `situacaoDaSala` devolve capítulo, nome e **quanto falta para virar**.
 * 3. **A conversa fica.** Ao encerrar, as falas **não somem**: viram o *rastro*,
 *    preso ao segundo do áudio. Quem faltou ouve depois e as falas aparecem no
 *    minuto certo — a "função de continuar", que ele chamou de melhor de todas.
 *    Ele chegou a defender apagar (medo de spoiler e de conversa solta) e mudou
 *    de posição: os dois medos já tinham resposta — a trava de posição da
 *    `lib/sala.ts` e o fato de o chat da sessão **não** se misturar com os
 *    tópicos do clube.
 * 4. **Sala privada não deixa rastro.** O que foi dito a dois morre a dois. É a
 *    única exceção à regra 3, e é de propósito.
 *
 * ---
 *
 * ⚠️ **O que é simulado, e como.** Sem servidor não existe outra pessoa ouvindo
 * de verdade. A sala semeada (`salasSemeadas`) resolve isso **sem inventar número
 * que muda a cada desenho da tela**:
 *
 * - **O áudio dela anda com o relógio:** a posição é `início + (agora − abertura)`.
 *   Recarregar a página não teletransporta ninguém — a sala continua de onde
 *   estaria. É a única coisa "viva" aqui, e é viva pelo motivo certo.
 * - **As falas dos outros já estão escritas, presas a um segundo do áudio.** Elas
 *   não aparecem por sorteio: aparecem quando a transmissão **passa por elas**.
 *   O mesmo mecanismo do rastro — uma peça só, e o chat nunca mente.
 *
 * **O que é real:** a sala que **você** abre, o que **você** escreve, e o controle
 * do áudio quando a sala é sua. Tudo no `localStorage`. Com servidor, muda a fonte
 * e nenhuma tela.
 */

import { EU } from "@/lib/clubes";
import { chapterAtSec, chapterStartSec, getChapters } from "@/lib/chapters";

const CHAVE = "allbook_salas_ao_vivo";

/** Avisa as telas de que alguma sala mudou. Mesmo padrão do resto do app. */
export const SALA_AO_VIVO_EVENT = "allbook:sala-ao-vivo";

/**
 * Quem pode entrar. **Não são três produtos — são três portas para a mesma
 * sala** (§4.81), e a única coisa que muda é quem entra e quando começa.
 */
export type PortaDaSala =
  /** Só quem for chamado. **Não deixa rastro.** */
  | "privada"
  /** Qualquer um entra enquanto durar; aparece no feed e nos clubes. */
  | "aberta"
  /** Tem hora: é o evento de comunidade da §4.79, com o botão de entrar. */
  | "marcada";

export interface FalaDaSala {
  id: string;
  /** Slug de quem falou (`"voce"` é você). */
  autor: string;
  texto: string;
  /**
   * **Em que segundo do áudio a fala foi dita.** É este campo que faz o rastro
   * funcionar depois — e é o mesmo conceito da âncora da `lib/sala.ts`.
   */
  posicaoSec: number;
  /** Momento real, só para desempatar falas no mesmo segundo. */
  em: number;
}

export interface SalaAoVivo {
  id: string;
  bookId: number;
  /** Slug de quem abriu. Quem abriu **manda**. */
  anfitriao: string;
  porta: PortaDaSala;
  /** Quando a sala foi convocada de um clube — a *sessão de escuta* do §4.81. */
  clubeId?: string;
  /** Título quando é sessão marcada ("cap. 9 a 12, ao vivo"). */
  titulo?: string;
  /** Só para `porta: "marcada"`: quando começa (ISO) e a hora ("21:00"). */
  data?: string;
  hora?: string;
  /**
   * Onde o áudio da sala estava **no instante `marcoEm`**. Só o anfitrião muda.
   *
   * ⚠️ Não leia este campo direto para mostrar na tela — use `posicaoAgora`.
   * Sozinho ele é uma foto: enquanto a sala toca, a posição de verdade é esta
   * mais o tempo que passou desde o marco.
   */
  posicaoSec: number;
  /**
   * Quando `posicaoSec` foi fixada. É o que faz a transmissão **andar**: sem ele
   * a sala ficava congelada no segundo em que foi aberta, mesmo "tocando" —
   * defeito achado testando, na primeira sala que eu mesmo criei.
   */
  marcoEm: number;
  tocando: boolean;
  /** Slugs de quem está dentro agora. */
  presentes: string[];
  /**
   * Quem foi chamado e ainda não entrou.
   *
   * **Sem isto a sala privada não serve para nada** — ela é "só quem eu chamar",
   * e sem convite não há ninguém para chamar. Foi um buraco do meu escopo,
   * achado ao conferir o caso que originou a ideia (*"ouvir um livro junto com
   * minha namorada"*).
   */
  convidados?: string[];
  falas: FalaDaSala[];
  abertaEm: number;
  /** Preenchido ao encerrar: daí em diante a sala é rastro, não é sala. */
  encerradaEm?: number;
}

/* ------------------------------------------------------------------ */
/* Guardar e ler                                                       */
/* ------------------------------------------------------------------ */

/** As salas que **você** criou ou mexeu. As semeadas não moram aqui. */
function lerMinhas(): SalaAoVivo[] {
  try {
    const guardado = JSON.parse(localStorage.getItem(CHAVE) || "[]");
    return Array.isArray(guardado) ? (guardado as SalaAoVivo[]) : [];
  } catch {
    return [];
  }
}

function gravar(salas: SalaAoVivo[]): void {
  localStorage.setItem(CHAVE, JSON.stringify(salas));
  window.dispatchEvent(new Event(SALA_AO_VIVO_EVENT));
}

/* ------------------------------------------------------------------ */
/* A sala fictícia — a que existe para a tela não nascer vazia          */
/* ------------------------------------------------------------------ */

/**
 * Uma sala ao vivo acontecendo agora, para a tela ter o que mostrar.
 *
 * `abertaEm` é **relativo ao momento em que a página abre**: 22 minutos atrás.
 * Assim a sala está sempre "no meio", nunca no segundo zero nem terminada — e
 * não depende de uma data fixa que envelhece.
 */
const ABERTA_HA_MIN = 22;
const COMECOU_EM_SEC = 3_580; // ~59min de livro quando a sala abriu

export function salaSemeada(): SalaAoVivo {
  const abertaEm = Date.now() - ABERTA_HA_MIN * 60_000;

  return {
    id: "sala-semeada-1",
    bookId: 1,
    anfitriao: "ana-paula",
    porta: "aberta",
    posicaoSec: COMECOU_EM_SEC,
    marcoEm: abertaEm,
    tocando: true,
    presentes: ["ana-paula", "marcos-v", "juliana-s", "carla-lima", "beto"],
    falas: FALAS_SEMEADAS,
    abertaEm,
  };
}

/**
 * As falas da sala fictícia, **cada uma presa a um segundo do áudio**.
 *
 * Elas não aparecem por sorteio: entram no chat quando a transmissão passa por
 * elas (ver `falasAteAgora`). É o mesmo mecanismo que faz o rastro — de propósito.
 */
const FALAS_SEMEADAS: FalaDaSala[] = [
  { id: "f1", autor: "ana-paula", texto: "boa noite, gente! bora", posicaoSec: 3_585, em: 1 },
  { id: "f2", autor: "marcos-v", texto: "cheguei", posicaoSec: 3_602, em: 2 },
  { id: "f3", autor: "juliana-s", texto: "esse narrador é outro nível", posicaoSec: 3_690, em: 3 },
  { id: "f4", autor: "carla-lima", texto: "a voz dele muda quando ela entra na cena, ouviram?", posicaoSec: 3_940, em: 4 },
  { id: "f5", autor: "beto", texto: "achei que era impressão minha", posicaoSec: 3_961, em: 5 },
  { id: "f6", autor: "ana-paula", texto: "não é não, ele faz isso desde o primeiro capítulo", posicaoSec: 3_988, em: 6 },
  { id: "f7", autor: "marcos-v", texto: "OLHA A PORTA 😱", posicaoSec: 4_240, em: 7 },
  { id: "f8", autor: "juliana-s", texto: "eu sabia, eu SABIA", posicaoSec: 4_252, em: 8 },
  { id: "f9", autor: "carla-lima", texto: "gente eu tive que voltar 30 segundos", posicaoSec: 4_301, em: 9 },
  { id: "f10", autor: "ana-paula", texto: "calma que agora vem a parte boa", posicaoSec: 4_420, em: 10 },
  { id: "f11", autor: "beto", texto: "não acredito que ela fez isso", posicaoSec: 4_690, em: 11 },
  { id: "f12", autor: "marcos-v", texto: "kkkkkk eu avisei lá no começo", posicaoSec: 4_712, em: 12 },
  { id: "f13", autor: "juliana-s", texto: "esse capítulo é o melhor até agora, disparado", posicaoSec: 4_980, em: 13 },
  { id: "f14", autor: "carla-lima", texto: "concordo demais", posicaoSec: 5_010, em: 14 },
];

/**
 * Onde a transmissão de uma sala está **agora**.
 *
 * A conta é a mesma para a sala fictícia e para a sua: **posição do marco + o
 * tempo que passou desde ele**, e só enquanto está tocando. Pausou, congela;
 * encerrou, congela de vez.
 *
 * É isto que faz uma sala ser transmissão e não uma foto — e vale para o
 * anfitrião também. Na primeira versão só a sala semeada andava, e a minha
 * própria sala nascia parada no segundo em que eu a abri.
 */
export function posicaoAgora(sala: SalaAoVivo): number {
  if (sala.encerradaEm || !sala.tocando) return sala.posicaoSec;

  const corridos = Math.floor((Date.now() - sala.marcoEm) / 1000);
  return sala.posicaoSec + Math.max(0, corridos);
}

/* ------------------------------------------------------------------ */
/* Achar salas                                                         */
/* ------------------------------------------------------------------ */

/**
 * Todas as salas que existem: a fictícia + as suas.
 *
 * ⚠️ **A sua versão da sala fictícia ganha dela.** Ao entrar na sala semeada, ou
 * ao falar nela, o app grava uma cópia com o **mesmo id**. Se as duas ficassem na
 * lista, `salaPorId` devolveria sempre a semeada (que vem primeiro) e o que você
 * escreveu **sumiria na hora** — foi exatamente o que aconteceu no primeiro
 * teste: a reação era gravada e a tela continuava com 12 falas.
 */
export function todasAsSalas(): SalaAoVivo[] {
  const minhas = lerMinhas();
  const semeada = salaSemeada();
  const tenhoMinhaVersao = minhas.some((sala) => sala.id === semeada.id);

  return tenhoMinhaVersao ? minhas : [semeada, ...minhas];
}

export function salaPorId(id: string): SalaAoVivo | undefined {
  return todasAsSalas().find((sala) => sala.id === id);
}

/**
 * As salas **acontecendo agora** e que dá para ver.
 *
 * Privada fica de fora de propósito: ela não aparece para ninguém — quem foi
 * chamado entra pelo convite, não por vitrine.
 */
export function salasAoVivo(): SalaAoVivo[] {
  return todasAsSalas().filter((sala) => !sala.encerradaEm && sala.porta !== "privada");
}

/** A sala ao vivo deste livro, se houver. */
export function salaDoLivro(bookId: number): SalaAoVivo | undefined {
  return salasAoVivo().find((sala) => sala.bookId === bookId);
}

/** As sessões ao vivo de um clube — o que a página do clube mostra. */
export function salasDoClube(clubeId: string): SalaAoVivo[] {
  return salasAoVivo().filter((sala) => sala.clubeId === clubeId);
}

export function souAnfitriao(sala: SalaAoVivo): boolean {
  return sala.anfitriao === EU;
}

export function estouDentro(sala: SalaAoVivo): boolean {
  return sala.presentes.includes(EU);
}

/* ------------------------------------------------------------------ */
/* O que a tela mostra                                                 */
/* ------------------------------------------------------------------ */

export interface SituacaoDaSala {
  posicaoSec: number;
  capitulo: number;
  tituloDoCapitulo: string;
  totalDeCapitulos: number;
  /** Quanto falta para o capítulo **virar**, em segundos. */
  faltaParaVirarSec: number;
  totalSec: number;
}

/**
 * **Onde a sala está no livro** — o mapa de quem só acompanha.
 *
 * Existe por pedido explícito do Matheus (§4.81): *"por mais que ela não possa
 * pausar, é importante ela se situar… tá no capítulo 3 e faltam tantos minutos
 * para o capítulo acabar e virar"*. Quem assiste perde o **controle**, nunca a
 * **informação**.
 */
export function situacaoDaSala(sala: SalaAoVivo): SituacaoDaSala {
  const capitulos = getChapters(sala.bookId);
  const posicaoSec = posicaoAgora(sala);
  const capitulo = chapterAtSec(sala.bookId, posicaoSec);
  const atual = capitulos.find((item) => item.id === capitulo) ?? capitulos[0];

  const comeco = chapterStartSec(sala.bookId, capitulo);
  const fim = comeco + (atual?.durationSec ?? 0);
  const totalSec = capitulos.reduce((soma, item) => soma + item.durationSec, 0);

  return {
    posicaoSec,
    capitulo,
    tituloDoCapitulo: atual?.title ?? `Capítulo ${capitulo}`,
    totalDeCapitulos: capitulos.length,
    faltaParaVirarSec: Math.max(0, fim - posicaoSec),
    totalSec,
  };
}

/**
 * As falas que **já foram ditas** nesta transmissão.
 *
 * A regra é a mesma do resto do app: nada à frente aparece. Numa sala ao vivo
 * isso nem é trava de spoiler — é o que significa estar ao vivo. A fala de daqui
 * a três minutos ainda não existe.
 */
export function falasAteAgora(sala: SalaAoVivo): FalaDaSala[] {
  const posicao = posicaoAgora(sala);
  return sala.falas
    .filter((fala) => fala.posicaoSec <= posicao + 1)
    .sort((a, b) => a.posicaoSec - b.posicaoSec || a.em - b.em);
}

/** "6 min 20" — o formato de "quanto falta para o capítulo virar". */
export function faltaEmTexto(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos));
  const min = Math.floor(total / 60);
  const seg = total % 60;
  if (min === 0) return `${seg} s`;
  return `${min} min ${String(seg).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/* Mexer na sala                                                       */
/* ------------------------------------------------------------------ */

function salvarMinha(sala: SalaAoVivo): void {
  const minhas = lerMinhas();
  const i = minhas.findIndex((item) => item.id === sala.id);
  if (i >= 0) minhas[i] = sala;
  else minhas.push(sala);
  gravar(minhas);
}

export function abrirSala(dados: {
  bookId: number;
  porta: PortaDaSala;
  posicaoSec: number;
  clubeId?: string;
  titulo?: string;
  data?: string;
  hora?: string;
  convidados?: string[];
}): SalaAoVivo {
  const sala: SalaAoVivo = {
    id: `sala-${Date.now()}`,
    bookId: dados.bookId,
    anfitriao: EU,
    porta: dados.porta,
    clubeId: dados.clubeId,
    titulo: dados.titulo,
    data: dados.data,
    hora: dados.hora,
    posicaoSec: dados.posicaoSec,
    marcoEm: Date.now(),
    tocando: true,
    presentes: [EU],
    convidados: dados.convidados,
    falas: [],
    abertaEm: Date.now(),
  };
  salvarMinha(sala);
  if (dados.convidados?.length) responderAoConvite(sala.id, dados.convidados);
  return sala;
}

/**
 * **Quem foi chamado aparece na sala** — simulação, e ela é declarada.
 *
 * Sem servidor ninguém entra de verdade. O app já resolve isso do mesmo jeito em
 * `convitesDeEvento.ts` (a pessoa responde em alguns segundos), e repetir o
 * padrão é melhor do que inventar um segundo: a sala que você abre **não fica
 * eternamente vazia**, que seria a versão mentirosa da mesma tela.
 *
 * Entra ~4 em cada 5 — convite que sempre dá certo também é mentira, só que
 * simpática.
 */
function responderAoConvite(salaId: string, convidados: string[]): void {
  convidados.forEach((slug, i) => {
    window.setTimeout(
      () => {
        const sala = salaPorId(salaId);
        if (!sala || sala.encerradaEm || sala.presentes.includes(slug)) return;

        /* Semente pelo slug: quem aceita é sempre o mesmo, e não muda a cada
           vez que a tela desenha. */
        const vem = (slug.charCodeAt(0) + slug.length) % 5 !== 0;
        if (!vem) return;

        salvarMinha({
          ...sala,
          presentes: [...sala.presentes, slug],
          convidados: (sala.convidados ?? []).filter((item) => item !== slug),
        });
      },
      2500 + i * 1800,
    );
  });
}

export function entrarNaSala(id: string): void {
  const sala = salaPorId(id);
  if (!sala || sala.encerradaEm || sala.presentes.includes(EU)) return;

  // A sala fictícia não está no `localStorage`: entrar nela grava uma cópia sua,
  // com a posição congelada no instante em que você entrou — daí em diante ela
  // continua andando pelo relógio, como qualquer transmissão.
  salvarMinha({ ...sala, presentes: [...sala.presentes, EU] });
}

export function sairDaSala(id: string): void {
  const sala = salaPorId(id);
  if (!sala) return;
  salvarMinha({ ...sala, presentes: sala.presentes.filter((slug) => slug !== EU) });
}

/**
 * **Mandar no áudio — só o anfitrião.** É a regra que ele pediu com todas as
 * letras: *"a pessoa que criou tem autonomia de fazer o que ela quiser"*.
 */
export function mandarNoAudio(id: string, mudanca: { posicaoSec?: number; tocando?: boolean }): void {
  const sala = salaPorId(id);
  if (!sala || !souAnfitriao(sala) || sala.encerradaEm) return;

  /*
   * Toda mudança **refaz o marco**: a posição gravada passa a ser a de agora, e
   * o relógio recomeça dali. Sem isso, pausar e voltar a tocar somaria de novo
   * o tempo já corrido e a sala pularia para frente sozinha.
   */
  salvarMinha({
    ...sala,
    posicaoSec: mudanca.posicaoSec ?? posicaoAgora(sala),
    marcoEm: Date.now(),
    tocando: mudanca.tocando ?? sala.tocando,
  });
}

export function falarNaSala(id: string, texto: string): void {
  const limpo = texto.trim();
  const sala = salaPorId(id);
  if (!sala || !limpo || sala.encerradaEm) return;

  const fala: FalaDaSala = {
    id: `fala-${Date.now()}`,
    autor: EU,
    texto: limpo,
    posicaoSec: posicaoAgora(sala),
    em: Date.now(),
  };
  salvarMinha({ ...sala, falas: [...sala.falas, fala] });
}

/**
 * **Encerrar — e o que sobra depois.**
 *
 * Sala **privada** some inteira: o que foi dito a dois morre a dois (§4.81).
 * As outras viram **rastro** — ficam guardadas, com as falas presas ao segundo
 * do áudio, para quem faltou continuar de onde a turma parou.
 */
export function encerrarSala(id: string): void {
  const sala = salaPorId(id);
  if (!sala || !souAnfitriao(sala)) return;

  if (sala.porta === "privada") {
    gravar(lerMinhas().filter((item) => item.id !== id));
    return;
  }

  salvarMinha({
    ...sala,
    posicaoSec: posicaoAgora(sala),
    marcoEm: Date.now(),
    tocando: false,
    presentes: [],
    encerradaEm: Date.now(),
  });
}

/* ------------------------------------------------------------------ */
/* O rastro — a "função de continuar"                                  */
/* ------------------------------------------------------------------ */

/** As sessões já encerradas deste livro, da mais recente para a mais antiga. */
export function sessoesEncerradas(bookId: number): SalaAoVivo[] {
  return todasAsSalas()
    .filter((sala) => sala.bookId === bookId && sala.encerradaEm)
    .sort((a, b) => (b.encerradaEm ?? 0) - (a.encerradaEm ?? 0));
}

/**
 * O rastro perto de onde **você** está no livro — o que o player mostra depois.
 *
 * ⚠️ **A trava vale aqui, e é ela que permitiu guardar a conversa.** Só volta
 * fala de trecho por onde você **já passou**; nada à frente, nem a contagem. Foi
 * a resposta ao medo de spoiler que quase fez a conversa ser apagada (§4.81).
 *
 * Cinco minutos de janela, o mesmo da `lib/sala.ts`: uma fala de quatro minutos
 * atrás ainda é sobre a mesma cena.
 */
export function rastroNoTrecho(
  bookId: number,
  posicaoSec: number,
  janelaSec = 300,
): { fala: FalaDaSala; sala: SalaAoVivo }[] {
  const resultado: { fala: FalaDaSala; sala: SalaAoVivo }[] = [];

  for (const sala of sessoesEncerradas(bookId)) {
    for (const fala of sala.falas) {
      if (fala.posicaoSec <= posicaoSec + 1 && fala.posicaoSec >= posicaoSec - janelaSec) {
        resultado.push({ fala, sala });
      }
    }
  }

  return resultado.sort((a, b) => a.fala.posicaoSec - b.fala.posicaoSec);
}

/**
 * **Onde a turma parou** — a função que o Matheus chamou de melhor de todas.
 *
 * Quem não pôde estar na sessão abre o livro e continua **do ponto da turma**,
 * com as falas aparecendo no minuto certo. Devolve `undefined` quando não houve
 * sessão nenhuma neste livro.
 */
export function ondeATurmaParou(bookId: number): { posicaoSec: number; sala: SalaAoVivo } | undefined {
  const ultima = sessoesEncerradas(bookId)[0];
  if (!ultima) return undefined;
  return { posicaoSec: ultima.posicaoSec, sala: ultima };
}
