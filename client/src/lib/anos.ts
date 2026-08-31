/**
 * Os dois anos de um audiolivro: o da **obra** e o da **narração** (§4.149).
 *
 * São coisas diferentes e é fácil confundi-las — *Mais esperto que o diabo* é um
 * texto de 1938 cujo áudio a Tocalivros publicou em 2017. A ficha do livro mostra
 * cada um com o rótulo próprio, e **some com a linha** quando o ano não existe:
 * "ano desconhecido" ocupa espaço para não dizer nada.
 *
 * Quem quiser um ano de livro **usa estas duas funções, nunca `book.year` cru** —
 * é aqui que mora a régua de quando o dado presta.
 */

/** O mínimo que estas funções precisam saber de um livro. */
interface LivroComAnos {
  /** A loja de onde a ficha veio; vazio no que o AllBook Studio gravou. */
  origem?: string;
  /** O ano da **edição em áudio** — a data que a loja anuncia. */
  year?: number;
  /** O ano em que a **obra** foi publicada pela primeira vez. */
  anoObra?: number;
}

/**
 * As lojas cuja data de lançamento **não é** data de lançamento.
 *
 * 🚨 **O Ubook manda a data da coleta.** Medido em 31/08 no acervo: 3.497 dos
 * 4.938 livros de lá estão marcados em 2026, concentrados em maio, junho e julho
 * — os meses em que o acervo foi baixado. Mostrar "narração de 2026" em 71% dos
 * livros de uma loja é errar mais vezes do que acertar, então nessa loja o ano
 * da narração simplesmente não aparece.
 *
 * ⚠️ O dado continua no banco (`livros.ano`), porque é verdade sobre a loja e
 * porque a capa da Home ordena por ele. O que esta lista decide é só o que se
 * mostra na ficha.
 */
const LOJAS_SEM_ANO_DE_AUDIO = ["ubook"];

/** Um ano só passa se for plausível — 4 dígitos, do ano 1000 ao que vem. */
function plausivel(ano: number | undefined): number | undefined {
  if (!ano || !Number.isInteger(ano)) return undefined;
  return ano >= 1000 && ano <= new Date().getFullYear() + 1 ? ano : undefined;
}

/**
 * O ano em que a **obra** foi publicada pela primeira vez, ou nada.
 *
 * Vem do agente do ano do `baixalivro`, que só grava o que consegue provar — por
 * isso não há grau de confiança para mostrar: o que chega aqui é achado.
 */
export function anoDaObra(livro: LivroComAnos): number | undefined {
  return plausivel(livro.anoObra);
}

/**
 * O ano em que **esta narração** foi publicada, ou nada quando a loja não tem
 * data de verdade (ver `LOJAS_SEM_ANO_DE_AUDIO`).
 */
export function anoDaNarracao(livro: LivroComAnos): number | undefined {
  if (livro.origem && LOJAS_SEM_ANO_DE_AUDIO.includes(livro.origem)) return undefined;
  return plausivel(livro.year);
}
