/**
 * Avaliação de livro — quem pode dar nota, a partir de quando, e que nota o app
 * mostra. As decisões estão em `docs/ROTEIRO.md` 4.15; aqui está a mecânica.
 *
 * Três regras mandam neste arquivo:
 *
 * 1. **Só o livro recebe nota.** Autor, narrador e editora nunca são avaliados
 *    direto — a nota deles é média dos livros (`people.ts`, `publishers.ts`).
 *    Ninguém "ouve um autor", e nota em gente vira placar público.
 * 2. **Só avalia quem ouviu** — `PERCENT_PARA_AVALIAR` do livro. É a vantagem de
 *    o AllBook ser um tocador: ele **sabe** quanto você ouviu, uma livraria não.
 *    Custo aceito de propósito: quem leu em papel não avalia.
 * 3. **Média da comunidade só com volume** (`MINIMO_PARA_MEDIA`). Com duas
 *    pessoas gostando e uma dando 1 estrela, a média mente — e derruba o livro.
 *    Abaixo do mínimo o app mostra a nota curada do catálogo, **sem** chamá-la
 *    de nota da comunidade.
 *
 * **Comentar continua livre para qualquer um.** Texto é conversa e não distorce
 * nada; nota é número, entra em média e ordena o catálogo. Por isso só a nota
 * tem portão.
 */

import { commentsForBook } from "@/lib/comments";
import { playbackPercent, readPlaybackList } from "@/lib/playback";

const STORAGE_KEY = "allbook_ratings";

/** Quanto do livro é preciso ouvir para poder avaliar. */
export const PERCENT_PARA_AVALIAR = 20;

/** Quantas avaliações um livro precisa para o app mostrar média de comunidade. */
export const MINIMO_PARA_MEDIA = 5;

/** Avisa quem estiver na tela que a sua nota mudou. */
export const RATINGS_EVENT = "allbook:ratings";

/**
 * A sua nota de um livro. **As duas dimensões são independentes e opcionais**:
 * dá para avaliar só a história, só a narração, ou as duas. Exigir as duas
 * afastaria quem tem opinião formada sobre uma só — e é comum: livro bom com
 * narração morna, ou o contrário.
 */
export interface MinhaAvaliacao {
  bookId: number;
  /** 1 a 5 — a obra, o texto. Herda para o **autor**. */
  historia?: number;
  /** 1 a 5 — a performance desta edição. Herda para o **narrador**. */
  narracao?: number;
  /** ISO de quando você mexeu pela última vez. */
  updatedAt: string;
}

function notify() {
  window.dispatchEvent(new Event(RATINGS_EVENT));
}

function limitar(nota: number | undefined): number | undefined {
  if (nota === undefined) return undefined;
  const inteiro = Math.round(nota);
  if (inteiro < 1 || inteiro > 5) return undefined;
  return inteiro;
}

/** Tudo que você já avaliou. Lista vazia se nunca avaliou nada. */
export function readMyRatings(): MinhaAvaliacao[] {
  try {
    const cru = localStorage.getItem(STORAGE_KEY);
    if (!cru) return [];
    const dado = JSON.parse(cru);
    if (!Array.isArray(dado)) return [];
    return dado.flatMap((item: unknown) => {
      if (typeof item !== "object" || item === null) return [];
      const registro = item as Record<string, unknown>;
      if (typeof registro.bookId !== "number") return [];
      const historia = limitar(registro.historia as number | undefined);
      const narracao = limitar(registro.narracao as number | undefined);
      // Registro sem nenhuma das duas notas não é avaliação — é lixo de um
      // salvamento pela metade, e some na próxima gravação.
      if (historia === undefined && narracao === undefined) return [];
      return [
        {
          bookId: registro.bookId,
          historia,
          narracao,
          updatedAt: typeof registro.updatedAt === "string" ? registro.updatedAt : "",
        },
      ];
    });
  } catch {
    return [];
  }
}

/** A sua nota daquele livro, ou `null` se você ainda não avaliou. */
export function myRatingOf(bookId: number): MinhaAvaliacao | null {
  return readMyRatings().find((item) => item.bookId === bookId) ?? null;
}

/**
 * Guarda (ou muda) a sua nota. **Uma avaliação por livro, sempre editável** —
 * mudar de ideia depois de terminar o livro é normal, e travar a nota só faria
 * a pessoa evitar avaliar cedo.
 *
 * Passar `undefined` numa dimensão **mantém** o que já estava lá; para tirar uma
 * nota isolada, passe `null`.
 */
export function saveMyRating(
  bookId: number,
  notas: { historia?: number | null; narracao?: number | null },
): void {
  const lista = readMyRatings();
  const atual = lista.find((item) => item.bookId === bookId);

  const historia =
    notas.historia === null ? undefined : limitar(notas.historia) ?? atual?.historia;
  const narracao =
    notas.narracao === null ? undefined : limitar(notas.narracao) ?? atual?.narracao;

  const semNota = historia === undefined && narracao === undefined;
  const resto = lista.filter((item) => item.bookId !== bookId);
  const proxima = semNota
    ? resto
    : [...resto, { bookId, historia, narracao, updatedAt: new Date().toISOString() }];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(proxima));
  } catch {
    // localStorage cheio: perder a nota é chato, mas não é motivo para quebrar
    // a tela — mesma postura do `playback.ts`.
  }
  notify();
}

/** Apaga a sua avaliação daquele livro por inteiro. */
export function removeMyRating(bookId: number): void {
  saveMyRating(bookId, { historia: null, narracao: null });
}

/** Quanto daquele livro você já ouviu, de 0 a 100. Nunca ouviu = 0. */
export function percentOuvido(bookId: number): number {
  const registro = readPlaybackList().find((item) => item.bookId === bookId);
  return registro ? playbackPercent(registro) : 0;
}

/**
 * Você já pode avaliar este livro?
 *
 * Quem **já avaliou** continua podendo mexer na nota mesmo que o progresso
 * suma (o "não quero mais ver isto" apaga o progresso, e seria absurdo isso
 * confiscar uma nota que você já tinha dado).
 */
export function podeAvaliar(bookId: number): boolean {
  if (myRatingOf(bookId)) return true;
  return percentOuvido(bookId) >= PERCENT_PARA_AVALIAR;
}

/** Quantos pontos percentuais faltam para liberar a avaliação. Zero se já liberou. */
export function faltaParaAvaliar(bookId: number): number {
  return Math.max(0, PERCENT_PARA_AVALIAR - percentOuvido(bookId));
}

/**
 * A nota que os ouvintes deram, e quantos avaliaram.
 *
 * Entram na conta os comentários com estrela (`Comment.rating`, os leitores de
 * `community.ts`) **e a sua nota**. Quem avaliou as duas dimensões conta uma
 * vez, com a média das duas: a pessoa é uma só, e o número de avaliações
 * precisa dizer *quantas pessoas*, não quantas estrelas foram tocadas.
 */
export function notaDaComunidade(bookId: number): {
  media: number;
  total: number;
  suficiente: boolean;
} {
  const dosLeitores = commentsForBook(bookId)
    .map((comentario) => comentario.rating)
    .filter((nota): nota is number => typeof nota === "number");

  const minha = myRatingOf(bookId);
  const minhasNotas = minha ? [minha.historia, minha.narracao].filter((n): n is number => !!n) : [];
  const notas = [...dosLeitores];
  if (minhasNotas.length > 0) {
    notas.push(minhasNotas.reduce((soma, nota) => soma + nota, 0) / minhasNotas.length);
  }

  const total = notas.length;
  const media = total > 0 ? notas.reduce((soma, nota) => soma + nota, 0) / total : 0;
  return { media, total, suficiente: total >= MINIMO_PARA_MEDIA };
}

/**
 * A nota para estampar na tela, junto com a origem dela.
 *
 * `origem: "catalogo"` é a nota curada à mão que o app sempre teve — mostrada
 * enquanto a comunidade não tem volume. **Quem chama precisa respeitar a
 * origem**: só a de comunidade pode ser apresentada como "nota dos ouvintes",
 * senão o app promete uma coisa e entrega outra.
 */
export function notaExibida(book: { id: number; rating: number }): {
  valor: number;
  origem: "comunidade" | "catalogo";
  total: number;
} {
  const comunidade = notaDaComunidade(book.id);
  if (comunidade.suficiente) {
    return { valor: comunidade.media, origem: "comunidade", total: comunidade.total };
  }
  return { valor: book.rating, origem: "catalogo", total: comunidade.total };
}
