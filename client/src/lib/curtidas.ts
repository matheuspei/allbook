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
 * O que **você** escreveu começa em zero de propósito: fingir que estranhos
 * curtiram o que você acabou de escrever seria a mentira mais fácil de perceber, e
 * a que mais desmoraliza o resto.
 *
 * **Serve post e comentário** (30/07), porque curtir é **uma ação só no app** e não
 * uma por lugar — a inconsistência que o Matheus apontou na §4.58. Os ids do
 * esqueleto são `p-esq-…` (post) e `c-esq-…` (comentário); os seus são `…-meu-…` e
 * caem no zero.
 */
export function curtidasDoPost(id: string): number {
  const doEsqueleto = id.startsWith("p-esq-") || id.startsWith("c-esq-");
  if (!doEsqueleto) return 0;
  let semente = 0;
  for (let i = 0; i < id.length; i += 1) semente = (semente * 31 + id.charCodeAt(i)) % 9973;
  /* Comentário ganha número menor que post: uma resposta com 12 corações e o
     post com 3 seria a hierarquia invertida, e a tela contaria uma mentira. */
  return id.startsWith("c-esq-") ? semente % 6 : semente % 14;
}
