/**
 * Os comentários de primeiro nível que VOCÊ escreve, guardados no `localStorage`.
 *
 * Irmão de `replies.ts`: lá ficam as suas respostas, aqui os seus comentários de
 * primeiro nível. Ficam separados de `comments.ts` pelo mesmo motivo — aquilo é o
 * esqueleto fixo de leitores fictícios (código); isto é o que você escreveu (dado,
 * muda em uso). A tela do livro junta as duas fontes.
 *
 * **Por que passou a existir:** `comments.ts` só tinha funções de leitura, então
 * livro sem comentário semeado (a maioria — ex.: "Garota Exemplar") não tinha como
 * receber comentário nenhum. Quando houver servidor, isto vira POST/GET e a tela
 * não muda, porque ela já junta esta fonte com a fixa.
 *
 * **O alvo deixou de ser só o livro.** Agora um comentário seu pode ser sobre um
 * livro, uma pessoa (autor/narrador) ou uma editora — os mesmos três alvos de
 * `comments.ts`. Antes o campo era um `bookId` obrigatório, e por isso o perfil
 * de autor, de narrador e de editora só *mostrava* o que os leitores fictícios
 * tinham dito: não havia onde escrever. Um comentário guardado antes desta
 * mudança tem só `bookId` e continua válido — nada precisou ser migrado.
 */

const STORAGE_KEY = "allbook_my_comments";

/**
 * Onde o comentário foi deixado. Exatamente um campo por alvo — o tipo em união
 * impede escrever um comentário que é de livro e de editora ao mesmo tempo.
 */
export type CommentTarget =
  | { bookId: number; personSlug?: never; publisherSlug?: never }
  | { personSlug: string; bookId?: never; publisherSlug?: never }
  | { publisherSlug: string; bookId?: never; personSlug?: never };

export interface MyComment {
  id: string;
  /** O `id` em `books.ts`. */
  bookId?: number;
  /** O `slug` em `people.ts`. */
  personSlug?: string;
  /** O `slug` em `publishers.ts`. */
  publisherSlug?: string;
  text: string;
  /** ISO completo — ordena do mais novo para o mais velho. */
  date: string;
  /**
   * Em que segundo do áudio você estava — a âncora da sala do livro
   * (ROTEIRO 4.39, e o porquê está em `comments.ts`). Ausente = você falou do
   * livro em geral, e aí todo mundo lê.
   */
  positionSec?: number;
  /** Você marcou como spoiler: o texto fica atrás de um toque para os outros. */
  spoiler?: boolean;
}

/** O que se pode prender a um comentário na hora de publicar. */
export interface OpcoesDoComentario {
  positionSec?: number;
  spoiler?: boolean;
}

/** Quanto cabe num comentário. Curto de propósito: comentário, não resenha. */
export const MAX_COMMENT = 600;

/** Um comentário sem alvo nenhum é lixo — não teria como voltar à tela. */
function temAlvo(item: MyComment): boolean {
  return (
    typeof item.bookId === "number" ||
    typeof item.personSlug === "string" ||
    typeof item.publisherSlug === "string"
  );
}

export function readMyComments(): MyComment[] {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(stored)) return [];

    return stored.filter(
      (item): item is MyComment =>
        item &&
        typeof item.id === "string" &&
        typeof item.text === "string" &&
        typeof item.date === "string" &&
        temAlvo(item),
    );
  } catch {
    return [];
  }
}

function ehDoAlvo(item: MyComment, target: CommentTarget): boolean {
  if (target.bookId !== undefined) return item.bookId === target.bookId;
  if (target.personSlug !== undefined) return item.personSlug === target.personSlug;
  return item.publisherSlug === target.publisherSlug;
}

/** Os seus comentários de um alvo, do mais novo para o mais velho. */
export function myCommentsFor(target: CommentTarget): MyComment[] {
  return readMyComments()
    .filter((item) => ehDoAlvo(item, target))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function save(list: MyComment[]): MyComment[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
}

/** Você comenta. Devolve a lista nova para a tela já mostrar. */
export function addComment(
  target: CommentTarget,
  text: string,
  opcoes: OpcoesDoComentario = {},
): MyComment[] {
  const clean = text.trim().slice(0, MAX_COMMENT);
  if (!clean) return readMyComments();

  const comment: MyComment = {
    id: `myc-${Date.now()}`,
    ...target,
    text: clean,
    date: new Date().toISOString(),
    // Só grava o que existe: comentário sem âncora não deve carregar
    // `positionSec: undefined` para o JSON.
    ...(opcoes.positionSec !== undefined ? { positionSec: opcoes.positionSec } : {}),
    ...(opcoes.spoiler ? { spoiler: true } : {}),
  };

  return save([...readMyComments(), comment]);
}

/** Apaga um comentário seu. */
export function removeComment(id: string): MyComment[] {
  return save(readMyComments().filter((item) => item.id !== id));
}
