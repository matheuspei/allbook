/**
 * As **suas** respostas aos comentários.
 *
 * Ficam separadas de `comments.ts` porque são de naturezas diferentes: lá está
 * o esqueleto de leitores fictícios, que é código; aqui está o que *você*
 * escreveu, que é dado e mora no `localStorage`. Misturar os dois faria sua
 * resposta sumir na próxima vez que alguém editasse a lista fixa.
 *
 * Quando houver servidor, isto vira um POST e some daqui — a tela que mostra a
 * conversa não muda, porque ela já junta as duas fontes.
 */

const STORAGE_KEY = "allbook_replies";

export interface MyReply {
  id: string;
  /** O comentário respondido. */
  parentId: string;
  bookId: number;
  text: string;
  /** ISO completo: suas respostas são de hoje, e a hora ordena as de um mesmo dia. */
  date: string;
}

/** Quanto cabe numa resposta. Curto de propósito: conversa, não ensaio. */
export const MAX_REPLY = 500;

export function readMyReplies(): MyReply[] {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(stored)) return [];

    return stored.filter(
      (item): item is MyReply =>
        item &&
        typeof item.id === "string" &&
        typeof item.parentId === "string" &&
        typeof item.text === "string" &&
        typeof item.date === "string",
    );
  } catch {
    return [];
  }
}

/** As suas respostas a um comentário, da mais antiga para a mais nova. */
export function myRepliesTo(parentId: string): MyReply[] {
  return readMyReplies()
    .filter((item) => item.parentId === parentId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Escreve uma resposta. Devolve a lista nova, para a tela já mostrar. */
export function addReply(parentId: string, bookId: number, text: string): MyReply[] {
  const clean = text.trim().slice(0, MAX_REPLY);
  if (!clean) return readMyReplies();

  const reply: MyReply = {
    id: `my-${Date.now()}`,
    parentId,
    bookId,
    text: clean,
    date: new Date().toISOString(),
  };

  const next = [...readMyReplies(), reply];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

/**
 * Apaga uma resposta sua.
 *
 * Só as suas: não existe apagar o comentário dos outros, e não deve existir —
 * quem escreveu é dono do que escreveu.
 */
export function removeReply(id: string): MyReply[] {
  const next = readMyReplies().filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
