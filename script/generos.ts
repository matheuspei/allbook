/**
 * As prateleiras do app: o que é gênero, e quando duas lojas dizem a mesma
 * coisa com nomes diferentes (21/09, §4.163).
 *
 * ## Por que existe
 *
 * Cada loja batiza a própria prateleira. A mesma estante de religião chegava
 * **quatro vezes** na Descobrir:
 *
 * | rótulo | livros | loja |
 * |---|---|---|
 * | Religião e Espiritualidade | 1.260 | Tocalivros e Audible |
 * | Religião | 953 | Ubook |
 * | Religião & Espiritualidade | 507 | Storytel |
 * | Espiritualidade | 359 | Ubook |
 *
 * 🚨 **Em 31/08 eu recusei juntar por conta própria, e estava certo:** o Ubook
 * usa *"Religião"* e *"Espiritualidade"* como prateleiras **distintas**, de
 * propósito, e apagar essa diferença é decisão de quem manda na vitrine. Levei
 * a ele, e em 21/09 ele decidiu: *"a gente deveria juntar tudo por religião,
 * mas talvez criar subcategorias dentro de religião para poder separar (…) isso
 * deveria estar num lugar só."*
 *
 * **A separação que ele quer já existe** e não custa nada: a trilha da ficha
 * (§4.158) guarda *"Religião > Cristianismo"*, *"Religião e Espiritualidade >
 * Católicos"*. Juntando os topos, os 3.079 livros ficam num card só — e dentro
 * dele continuam separados por **Cristianismo (1.542)**, **Católicos (255)**,
 * **Evangélica (268)**, **Bíblico (60)** e **Matriz Africana (51)**.
 */

/* -------------------------------------------------------------------------- */
/* Rótulos que não são prateleira                                             */
/* -------------------------------------------------------------------------- */

/**
 * Rótulos que a loja usa como **raiz da árvore ou etiqueta comercial**, e que
 * não dizem nada sobre o livro.
 *
 * 🚨 *"Livros"* é a raiz da árvore do Tocalivros e apareceu em **1.477
 * livros** — viraria o segundo maior "gênero" da Descobrir, à frente de Ficção.
 * *"Geral"* é a ausência de sub-gênero, não um sub-gênero. Mesma razão de
 * `NAO_E_EDITORA`: a ausência da coisa não é a coisa.
 */
export const NAO_E_GENERO = new Set([
  "livros",
  "livro",
  "livros gratis",
  "audiolivros",
  "audiolivro",
  "ebooks",
  "ebook",
  "geral",
  "outros",
  "diversos",
  "varios",
  "sem categoria",
  "todos",
]);

/* -------------------------------------------------------------------------- */
/* Prateleiras que são a mesma, com nomes diferentes                          */
/* -------------------------------------------------------------------------- */

/**
 * De qual rótulo para qual — **decisão do Matheus, não heurística** (21/09).
 *
 * ⚠️ **Só entra aqui o que ele mandar juntar.** A tentação de juntar por
 * parecença é grande e está errada: o Tocalivros usa *"Literatura"* e
 * *"Literatura e Ficção"* ao mesmo tempo, e a Storytel separa *"Kids"* de
 * *"Juvenil"* — cada um desses pares é uma distinção que a fonte fez de
 * propósito. Juntar é escolher qual nome sobrevive, e isso é desenho de
 * vitrine.
 *
 * ⚠️ **O destino tem de ser o rótulo que fica**, escrito exatamente como vai
 * aparecer na tela — é ele que batiza o card.
 */
const MESMA_PRATELEIRA = new Map<string, string>([
  /* --- religião: quatro prateleiras viram uma (21/09) --------------------- */
  ["religiao", "Religião e Espiritualidade"],
  ["religiao-espiritualidade", "Religião e Espiritualidade"], // o "&" da Storytel
  ["espiritualidade", "Religião e Espiritualidade"],

  /* --- o mesmo nome com grafia diferente ---------------------------------- */
  ["evangelicos", "Evangélica"],
  ["saude-bem-estar", "Saúde e Bem-Estar"], // "Saúde & Bem Estar" do Ubook
]);

/**
 * ⚠️ **`Esoterismo` (46 livros) NÃO entra na fusão de religião**, e é escolha.
 * Tarô, astrologia e horóscopo são outra estante — quem procura livro cristão
 * não está procurando isso, e o Ubook os separa. Se ele quiser juntar depois, é
 * uma linha no mapa acima.
 */
export const FORA_DA_FUSAO_DE_RELIGIAO = ["esoterismo"];

/**
 * O rótulo que este gênero deve ter na tela.
 *
 * Devolve o próprio nome quando não há fusão — assim quem chama não precisa
 * saber se o mapa tem ou não a chave.
 */
export function rotuloCanonico(rotulo: string, slug: string): string {
  return MESMA_PRATELEIRA.get(slug) ?? rotulo;
}
