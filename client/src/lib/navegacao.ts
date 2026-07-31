/**
 * **Qual foi a última tela do app com navegação** — a saída das telas cheias.
 *
 * ---
 *
 * **O problema que isto resolve, achado pelo Matheus em 31/07.**
 *
 * O AllBook tem telas cheias, sem menu: o player, o login e a sala de escuta ao
 * vivo. Elas voltam de dois jeitos, e os dois davam no mesmo lugar errado:
 *
 * - o player minimiza com `history.back()`;
 * - a sala minimizava indo para o player.
 *
 * Resultado: **sala → player → sala → player**, sem fim. Nas palavras dele:
 * *"ele fica nesse limbo… a forma de sair disso é clicar em voltar [do
 * navegador], mas as pessoas deveriam poder voltar dentro do aplicativo mesmo"*.
 * Duas telas cheias devolvendo uma para a outra nunca chegam a uma tela com
 * menu.
 *
 * **A regra que resolve:** minimizar uma tela cheia devolve para a **última tela
 * do app que tinha navegação** — nunca para outra tela cheia. Se não houver
 * nenhuma (a pessoa abriu o app direto num endereço de sala), cai na Comunidade,
 * que é onde as salas vivem.
 *
 * Fica no `sessionStorage` de propósito: é por **aba**, e uma volta de ontem não
 * tem por que decidir a saída de hoje.
 */

const CHAVE = "allbook_ultima_tela";

/** Para onde a Comunidade aponta quando não há nada guardado. */
const PADRAO = "/community";

/** As rotas sem menu — de onde não adianta voltar, porque são o problema. */
export function ehTelaCheia(rota: string): boolean {
  return rota.startsWith("/player") || rota.startsWith("/sala/") || rota === "/login";
}

/** Chamado a cada troca de rota; só guarda o que serve de destino. */
export function guardarTelaNavegavel(rota: string): void {
  if (ehTelaCheia(rota)) return;
  try {
    sessionStorage.setItem(CHAVE, rota);
  } catch {
    /* Aba anônima com armazenamento bloqueado: o padrão resolve. */
  }
}

/** Para onde uma tela cheia deve devolver a pessoa. */
export function ultimaTelaNavegavel(): string {
  try {
    const guardada = sessionStorage.getItem(CHAVE);
    return guardada && !ehTelaCheia(guardada) ? guardada : PADRAO;
  } catch {
    return PADRAO;
  }
}
