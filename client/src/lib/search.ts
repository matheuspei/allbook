/**
 * Abrir a busca a partir de qualquer tela.
 *
 * A busca em si (o campo e a lista de resultados) mora dentro da tela Início
 * (`Home.tsx`) como um overlay de tela cheia. O botão de lupa, porém, fica no
 * TopNav, que é global. Este arquivo é a ponte entre os dois: a lupa chama
 * `openSearch()` e a Início escuta o evento e abre o campo.
 *
 * O padrão (um evento no `window` que outra parte da tela escuta) é o mesmo do
 * `playback.ts` — o React não repassa esse tipo de aviso entre componentes
 * irmãos sozinho.
 *
 * O `pending` cobre o caso de a lupa ser tocada em OUTRA tela: aí o TopNav
 * navega para a Início, mas o evento é disparado antes de a Início montar e
 * registrar o ouvinte — ele se perderia. Guardando o pedido numa variável, a
 * Início o consome assim que monta.
 */

export const SEARCH_OPEN_EVENT = "allbook:search-open";

let pending = false;

/** Pede para abrir a busca. Chamado pela lupa do TopNav. */
export function openSearch(): void {
  pending = true;
  window.dispatchEvent(new Event(SEARCH_OPEN_EVENT));
}

/**
 * Há um pedido de busca em aberto? Devolve `true` uma única vez e zera o
 * pedido. A Início chama isto ao montar (para o caso de a lupa ter sido tocada
 * em outra tela) e também dentro do ouvinte do evento (para zerar o pedido).
 */
export function consumeSearchRequest(): boolean {
  const was = pending;
  pending = false;
  return was;
}
