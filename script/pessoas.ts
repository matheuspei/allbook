/**
 * Quem é gente, e quem só está ocupando o lugar de gente (15/09, §4.160).
 *
 * ## Por que este arquivo existe
 *
 * O acervo entrega **1.092 livros com o nome de uma editora no campo do autor**
 * e 377 no campo do narrador. *"Cresça Brasil Editora S.A."* escreve e narra
 * 160 livros; *"MAX EDITORIAL"*, 178. Cada um desses nomes vira **perfil de
 * pessoa** no app — com avatar, botão de seguir e uma prateleira de obras.
 *
 * 🚨 **E não dá para resolver com regra estrutural** — o Matheus derrubou a
 * minha tentativa em 31/08, e ele estava certo. Dentro do banco, **Blake Pierce
 * e LIBROTEKA são idênticos**: autor igual à editora nos dois, mesmo número de
 * livros, mesma forma. Só que um é escritor que publica com o próprio nome e o
 * outro é uma casa que assina compilações anônimas. **Só o nome os separa, e
 * quem lê nome é gente.** Daí a lista abaixo ser conferida à mão, uma por uma,
 * e não uma heurística.
 *
 * ## O que acontece com o nome que entra na lista
 *
 * ⚠️ **Ele não é apagado — é MOVIDO para o campo certo.** Sai de autor/narrador
 * e entra em editora, criando a editora se ela ainda não existir. É a lição da
 * §4.152 aplicada aqui: *"Cresça Brasil"* no campo do autor é dado errado, mas
 * é dado — jogá-lo fora perderia a única informação que o livro tem. Depois da
 * mudança a linha some da ficha sozinha, pela regra da §4.159.
 *
 * ⚠️ **Nada disso sobrescreve o acervo.** A lista mora aqui, no código, e é
 * aplicada na leitura da ficha — mesmo desenho de `LOJAS_FORA_DA_VITRINE`
 * (§4.145). Tirar um nome daqui desfaz a correção dele na passada seguinte.
 */

/* -------------------------------------------------------------------------- */
/* A lista, conferida nome a nome                                             */
/* -------------------------------------------------------------------------- */

/**
 * Os slugs que **não são pessoa**, apesar de estarem em campo de pessoa.
 *
 * O número entre parênteses é quantos livros o nome ocupava quando a linha foi
 * escrita (15/09). Todos foram olhados um a um: quem tem narrador próprio e
 * capa de livro de verdade ficou **fora** da lista.
 */
export const NAO_E_PESSOA = new Set([
  /* --- editoras e selos, o caso mais comum ------------------------------- */
  "max-editorial", //               (178) "MAX EDITORIAL" — a editora em caixa alta
  "cresca-brasil-editora-s-a", //   (160) audiocursos; o autor é o instrutor, quando o site diz
  "libroteka", //                    (93) compilações que a própria sinopse diz serem "da LIBROTEKA"
  "avante-editorial", //             (97) 94 dos 97 sem editora nenhuma — é ela
  "editora-mundo-cristao", //        (84) Bíblia NVT; a obra não tem autor moderno
  "ubook", //                        (67) a própria loja assinando
  "editora-online", //               (57) contos clássicos recontados
  "ubk-publishing-house", //         (44) resumos de livros
  "36-linhas", //                    (40) coleção de sons e salmos
  "36linhas", //                     (33) a mesma casa, sem o espaço
  "narrakids", //                    (24) selo infantil
  "edicase", //                      (21) editora
  "1000-words-com", //               (21) curso de idioma
  "pharmacology-university", //      (19) instituição
  "on-line-editora", //              (18) editora
  "umbanda-eu-curto", //             (18) canal/selo
  "storytel-original", //            (18) selo da loja
  "law-of-attraction", //            (14) selo temático; o narrador é "Gabriel"
  "astral-cultural", //              (14) editora
  "tocalivros", //                   (13) a própria loja
  "editora-crista-evangelica", //    (11) editora
  "purely-sounds-institute", //      (10) instituição
  "ciranda-cultural", //             (10) editora
  "tocalivros-studios", //            (9) o estúdio da loja
  "disal-editora", //                 (8) editora
  "esandiar-institute", //            (8) instituição
  "best-reads-hq24", //               (6) selo; o narrador é "Gabriel"
  "digital-world", //                 (5) selo de audiobooks genéricos
  "charles-river-editors", //         (4) editora
  "camelot-editora", //               (4) editora
  "edicoes-loyola", //                (4) editora

  /* --- estúdios de narração: narram para editoras diferentes -------------- */
  "volyo-audiobooks", //              (8) narra para Cobé, Insight e outras
  "multicast", //                     (7) narra para Autografia e Fradique
  "ediciones-beltran", //            (12) a editora da Dama Beltrán

  /* --- cursos de idioma, que assinam o próprio material ------------------- */
  "lingo-jump", //                   (39)
  "lingo-wave", //                   (27)
]);

/**
 * 🚨 **Quem foi olhado e FICOU DE FORA da lista, para ninguém "arrumar" depois.**
 *
 * Todos têm autor igual à editora — a forma exata da LIBROTEKA —, e todos são
 * gente de verdade. Esta lista não é usada pelo código: ela existe para que a
 * próxima pessoa que olhar a tabela não conclua que faltou classificá-los.
 *
 * - **Blake Pierce** (37) — escritor de séries policiais, publica com o próprio
 *   nome; o narrador é outra pessoa. O Matheus confirmou.
 * - **Annie Noor** (23), **Charlie Mason** (16), **Morgan Rice** (15),
 *   **Frederick Lederman** (12), **Sophie Love** (8), **Edward Collins** (8),
 *   **Giovanni Rigters** (7) — autores independentes.
 * - **Donnefar Skedar** (18) — *Sexo Oculto*, *A Agonia de um Vampiro*, com
 *   narradores diferentes em cada livro.
 * - **Dama Beltrán** (14) — romancista da Ediciones Beltrán (a editora **está**
 *   na lista; a autora, não).
 * - **Batuta Ribeiro** (8) — contos de terror, narração sintética variada.
 * - **Heitor K. Rodrigues** (6), **Cacau Hygino** (6), **Ivan macedo** (6),
 *   **Moustafa Gadalla** (6), **Alex Hormozi** (6), **Cláudio Pires** (4),
 *   **Fernando H. De Marchi** (4) — o caso amador que o Matheus descreveu: a
 *   pessoa escreveu, gravou e publicou sozinha. Isso é normal, não é defeito.
 */
export const OLHADOS_E_SAO_GENTE = [
  "blake-pierce",
  "annie-noor",
  "charlie-mason",
  "morgan-rice",
  "frederick-lederman",
  "sophie-love",
  "edward-collins",
  "giovanni-rigters",
  "donnefar-skedar",
  "dama-beltran",
  "batuta-ribeiro",
  "heitor-k-rodrigues",
  "cacau-hygino",
  "ivan-macedo",
  "moustafa-gadalla",
  "alex-hormozi",
  "claudio-pires",
  "fernando-h-de-marchi",
];

/* -------------------------------------------------------------------------- */
/* Nome invertido: "Poe, Edgar Allan" → "Edgar Allan Poe"                      */
/* -------------------------------------------------------------------------- */

/**
 * Partículas que não começam nome — se a cauda começa por uma delas, a vírgula
 * não estava separando sobrenome de nome.
 */
const PARTICULAS = new Set(["de", "da", "do", "dos", "das", "e", "van", "von", "del", "la", "le"]);

/**
 * Desvira um nome escrito como **"Sobrenome, Nome"** (15/09, §4.160).
 *
 * 🚨 **A Storytel escreve assim, e só ela** — *"Poe, Edgar Allan"*,
 * *"Wattles, Wallace D."*, *"de Assis, Machado"*, *"Shakespeare, William"*.
 * São **196 nomes**, e pelo menos 6 já tinham perfil no formato direto: o mesmo
 * escritor com dois perfis, cada um com parte da obra.
 *
 * ⚠️ **Só desvira o que tem EXATAMENTE uma vírgula**, e nunca uma lista. Nas
 * outras lojas a vírgula separa créditos — *"Paola Molinari, Clayton Heringer,
 * Juscelino Filho"* são três pessoas —, e quem parte lista é `partirCreditos()`
 * no importador, com a loja como régua (§4.154). Aqui a entrada já chega
 * partida: se ainda tem vírgula, é inversão.
 *
 * Devolve `null` quando não é caso de desvirar, para quem chama não precisar
 * comparar strings.
 */
export function desinverter(nome: string): string | null {
  const limpo = nome.replace(/\s+/g, " ").trim();
  const partes = limpo.split(",");
  if (partes.length !== 2) return null;

  const sobrenome = partes[0].trim();
  const resto = partes[1].trim();
  if (!sobrenome || !resto) return null;

  // "Thoreau, H. D., Thoreau, H. D." já caiu fora pelo length !== 2.
  // "Silva, Jr." e afins: cauda curta demais não é primeiro nome.
  if (resto.length < 2) return null;

  // ⚠️ Cauda que não começa por letra não é primeiro nome: *"Délia, (Maria
  // Benedita Câmara Bormann)"* é pseudônimo com o nome civil entre parênteses,
  // e desvirar daria "(Maria Benedita Câmara Bormann) Délia".
  if (!/^\p{L}/u.test(resto)) return null;

  // ⚠️ "de Assis, Machado" tem partícula no SOBRENOME, e isso é normal — o que
  // não pode é a CAUDA começar por partícula ("Machado, de Assis" seria outra
  // coisa), porque aí a vírgula não separava sobrenome de nome.
  const primeiraDaCauda = resto.split(" ")[0]?.toLowerCase() ?? "";
  if (PARTICULAS.has(primeiraDaCauda)) return null;

  const direto = `${resto} ${sobrenome}`;
  return direto === limpo ? null : direto;
}
