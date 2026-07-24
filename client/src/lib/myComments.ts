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
 */

const STORAGE_KEY = "allbook_my_comments";

export interface MyComment {
  id: string;
  bookId: number;
  text: string;
  /** ISO completo — ordena do mais novo para o mais velho. */
  date: string;
}

/** Quanto cabe num comentário. Curto de propósito: comentário, não resenha. */
export const MAX_COMMENT = 600;

export function readMyComments(): MyComment[] {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(stored)) return [];

    return stored.filter(
      (item): item is MyComment =>
        item &&
        typeof item.id === "string" &&
        typeof item.bookId === "number" &&
        typeof item.text === "string" &&
        typeof item.date === "string",
    );
  } catch {
    return [];
  }
}

/** Os seus comentários de um livro, do mais novo para o mais velho. */
export function myCommentsForBook(bookId: number): MyComment[] {
  return readMyComments()
    .filter((item) => item.bookId === bookId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function save(list: MyComment[]): MyComment[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
}

/** Você comenta. Devolve a lista nova para a tela já mostrar. */
export function addComment(bookId: number, text: string): MyComment[] {
  const clean = text.trim().slice(0, MAX_COMMENT);
  if (!clean) return readMyComments();

  const comment: MyComment = {
    id: `myc-${Date.now()}`,
    bookId,
    text: clean,
    date: new Date().toISOString(),
  };

  return save([...readMyComments(), comment]);
}

/** Apaga um comentário seu. */
export function removeComment(id: string): MyComment[] {
  return save(readMyComments().filter((item) => item.id !== id));
}
