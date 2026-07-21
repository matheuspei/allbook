/**
 * Curtir e descurtir um comentário.
 *
 * **A decisão de produto que está embutida aqui: os dois lados não são
 * simétricos.**
 *
 * - **Os dois contam para a ordem**, somados. Discordar também é engajar: o
 *   comentário que dividiu trinta pessoas moveu mais gente do que o que agradou
 *   a cinco, e quem chega depois quer ler os dois lados. A ordenação está em
 *   `engagementOf`, em `comments.ts`.
 * - **Só a curtida vira número na tela.** O contador de descurtidas não é
 *   mostrado: placar negativo público vira punição a quem escreveu, e num app
 *   com pouca gente duas descurtidas já parecem um veredito — o resultado é
 *   gente deixando de comentar. Ele pesa na ordem sem virar troféu às avessas.
 *
 * **Risco conhecido desta escolha:** ordenar por engajamento total premia o
 * comentário polêmico, que é o motor conhecido de seção de comentários tóxica.
 * Num app de audiolivro o risco é pequeno, mas se um dia o topo virar briga, o
 * lugar de mexer é `engagementOf`.
 *
 * Guardado no `localStorage`, como o resto do protótipo.
 */

const STORAGE_KEY = "allbook_reactions";

export type Reaction = "like" | "dislike";

/** `{ [id do comentário]: "like" | "dislike" }` — só as suas reações. */
export type Reactions = Record<string, Reaction>;

export function readReactions(): Reactions {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return {};

    const result: Reactions = {};
    for (const [id, value] of Object.entries(stored)) {
      if (value === "like" || value === "dislike") result[id] = value;
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Aplica a reação e devolve o mapa novo.
 *
 * Tocar de novo no que já estava marcado **desfaz** — é como funciona em
 * qualquer lugar, e sem isso não haveria como voltar atrás de um toque errado.
 * Curtir depois de descurtir troca uma pela outra: são exclusivas.
 */
export function toggleReaction(commentId: string, reaction: Reaction): Reactions {
  const current = readReactions();

  if (current[commentId] === reaction) {
    delete current[commentId];
  } else {
    current[commentId] = reaction;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  return { ...current };
}

/** O número que aparece na tela: a base do comentário mais a sua curtida. */
export function likeCount(baseLikes: number, reaction: Reaction | undefined): number {
  return baseLikes + (reaction === "like" ? 1 : 0);
}
