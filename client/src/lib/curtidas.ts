/**
 * Curtir um post do feed.
 *
 * **Por que não reusa `reactions.ts`.** Aquele guarda curtir **e descurtir** de
 * um comentário da conversa do livro, onde a discordância visível é parte do
 * jogo (ver o cabeçalho dele, e a §4.39). No feed a decisão foi outra: só
 * **curtir**. Post não é resenha que se contesta; é fala de alguém, e um
 * contador de "não gostei" embaixo dela azeda o feed — o próprio
 * `reactions.ts` registra esse risco como conhecido e aceito **naquele**
 * contexto, não neste.
 *
 * ⚠️ **O contador dos outros é simulado, e estável.** Sem servidor não existe
 * curtida de ninguém além da sua. A conta vem de uma semente pelo id do post —
 * o mesmo truque do progresso dos membros do clube (`clubes.ts`) e da apuração
 * das pautas: precisa ser **estável**, senão o número muda a cada desenho da
 * tela e a interface passa a mentir de forma visível.
 *
 * O que **você** faz é real e fica no `localStorage`.
 */

const CHAVE = "allbook_curtidas";

export const CURTIDAS_EVENT = "allbook:curtidas";

function ler(): string[] {
  try {
    const guardado = JSON.parse(localStorage.getItem(CHAVE) || "[]");
    return Array.isArray(guardado)
      ? guardado.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function euCurti(postId: string): boolean {
  return ler().includes(postId);
}

/** Curte ou descurte. Devolve o estado novo, para a tela reagir na hora. */
export function alternarCurtida(postId: string): boolean {
  const atual = ler();
  const jaTinha = atual.includes(postId);
  const proximo = jaTinha ? atual.filter((item) => item !== postId) : [...atual, postId];
  try {
    localStorage.setItem(CHAVE, JSON.stringify(proximo));
  } catch {
    /* sem storage a curtida não persiste; a tela já mostrou o efeito */
  }
  window.dispatchEvent(new Event(CURTIDAS_EVENT));
  return !jaTinha;
}

/**
 * Quantas pessoas curtiram — **fora você**.
 *
 * Os seus posts começam em zero de propósito: fingir que estranhos curtiram o
 * que você acabou de escrever seria a mentira mais fácil de perceber, e a que
 * mais desmoraliza o resto.
 */
export function curtidasDoPost(postId: string): number {
  if (!postId.startsWith("p-esq-")) return 0;
  let semente = 0;
  for (let i = 0; i < postId.length; i += 1) semente = (semente * 31 + postId.charCodeAt(i)) % 9973;
  return semente % 14;
}
