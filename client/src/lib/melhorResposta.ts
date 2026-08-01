/**
 * **A resposta que resolveu a pergunta** (§4.92).
 *
 * ---
 *
 * **Decidido em 29/07** (§4.58) junto com o "responder com um livro", e não
 * construído. Sem isto, a pergunta nunca fecha: a lista de `/perguntas` sabe
 * dizer o que **não** tem resposta nenhuma, mas não sabe dizer o que já foi
 * resolvido — e quem perguntou não tem como apontar qual das cinco indicações
 * era a boa.
 *
 * **Quem marca é quem perguntou, e ninguém mais.** Não é moderação: é a única
 * pessoa que sabe se a resposta serviu. Um moderador que decidisse isso estaria
 * respondendo por ela.
 *
 * **Marcar de novo desmarca** — o mesmo gesto do curtir e do fixar, e evita um
 * segundo botão só para desfazer. Marcar outra troca: uma pergunta tem uma
 * melhor resposta, não um pódio.
 */

import { comentariosDoPost, objetoDoComentario } from "@/lib/comentariosDePost";
import { todosOsPosts } from "@/lib/posts";

const CHAVE = "allbook_melhor_resposta";

/** Avisa que a marca mudou — as telas releem sem recarregar. */
export const MELHOR_RESPOSTA_EVENT = "allbook:melhor-resposta";

type Mapa = Record<string, string>;

function ler(): Mapa {
  try {
    const guardado = JSON.parse(localStorage.getItem(CHAVE) || "{}");
    return guardado && typeof guardado === "object" && !Array.isArray(guardado) ? guardado : {};
  } catch {
    return {};
  }
}

function gravar(mapa: Mapa): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(mapa));
  } catch {
    /* sem storage a marca não persiste; a tela já mostrou o efeito */
  }
  window.dispatchEvent(new Event(MELHOR_RESPOSTA_EVENT));
}

/** O id do comentário marcado como melhor resposta deste post, se houver. */
export function melhorRespostaDe(postId: string): string | undefined {
  return ler()[postId];
}

/**
 * Você pode marcar a melhor resposta deste post?
 *
 * Só no que é **seu** (em `posts.ts`, ausência de `autorSlug` significa "eu") e
 * só quando **é pergunta** — marcar "a melhor resposta" num post que não
 * perguntou nada é dar prêmio a quem só estava conversando.
 */
export function possoMarcar(postId: string): boolean {
  const post = todosOsPosts().find((item) => item.id === postId);
  return post?.autorSlug === undefined && post?.pergunta === true;
}

/**
 * Marca (ou desmarca) a melhor resposta. Devolve `true` se passou a estar
 * marcada.
 */
export function marcarMelhorResposta(postId: string, comentarioId: string): boolean {
  if (!possoMarcar(postId)) return false;
  const mapa = ler();
  const tinha = mapa[postId] === comentarioId;
  if (tinha) {
    delete mapa[postId];
  } else {
    mapa[postId] = comentarioId;
  }
  gravar(mapa);
  return !tinha;
}

/**
 * A pergunta está **resolvida**, e com qual livro.
 *
 * É o que a lista de `/perguntas` mostra: a que já tem melhor resposta vira uma
 * indicação com capa, em vez de mais uma linha de índice. Devolve o `bookId` só
 * quando a resposta escolhida traz um livro — resposta em texto puro resolve a
 * pergunta do mesmo jeito, mas não tem capa para mostrar.
 */
export function resolvidaCom(postId: string): { comentarioId: string; bookId?: number; quem?: string } | undefined {
  const id = melhorRespostaDe(postId);
  if (!id) return undefined;
  const comentario = comentariosDoPost(postId).find((item) => item.id === id);
  /* A marca pode apontar para um comentário apagado — nesse caso a pergunta
     volta a ser aberta, em vez de dizer "resolvida" e não mostrar por quê. */
  if (!comentario) return undefined;
  /* O livro sai do **cartão** do comentário, e não do campo `bookId` — desde a
     §4.93 quem responde com um livro o faz marcando `@Nome` no texto, e ler só o
     campo antigo deixaria a resposta marcada sem capa. */
  const objeto = objetoDoComentario(comentario);
  return {
    comentarioId: id,
    ...(objeto?.tipo === "livro" ? { bookId: objeto.bookId } : {}),
    ...(comentario.autorSlug ? { quem: comentario.autorSlug } : {}),
  };
}
