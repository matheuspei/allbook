/**
 * Quem publicou o livro — do `_ficha.json` do acervo até a tabela `editoras`
 * (31/08, §4.148).
 *
 * Existe como módulo próprio pelo mesmo motivo de `carimbos.ts`: **dois
 * comandos precisam da mesma regra**. O `npm run acervo importar` cria as
 * editoras na primeira passada e o `npm run acervo fichas` as reconcilia
 * depois, quando o baixalivro descobrir as que faltam. Se cada um montasse o
 * slug do seu jeito, a mesma editora nasceria duas vezes.
 *
 * ## De onde a editora vem — e por que não do lugar óbvio
 *
 * 🚨 **Não vem do `catalogo.sqlite`.** Ele tem uma coluna `editora`, e era dela
 * que a importação lia, mas só a **Audible** a preenche (1.592 de 1.597); as
 * outras três lojas mandam vazio. O resultado era 1.289 livros com editora
 * contra 12.628 sem — e como a Audible está fora da vitrine (§4.141), **nenhum
 * livro visível tinha editora nenhuma**.
 *
 * Ela mora no **`_ficha.json` de cada livro do "pronto"**, no campo
 * `ficha.EDITORA`: **12.918 de 14.575 (88,6%)**, nas quatro lojas. O
 * baixalivro a colhe da página do produto e a grava também nas tags do
 * arquivo. Os 11,4% que faltam são trabalho ainda por fazer lá — e é para eles
 * que existe o `npm run acervo fichas`.
 *
 * ## As duas regras que evitam editora duplicada e link quebrado
 *
 * 1. **Variantes do mesmo nome viram uma editora só.** "Mundo Cristão" (134
 *    livros) e "Editora Mundo Cristão" (131) são a mesma casa; sem juntá-las, o
 *    app teria dois perfis, cada um com metade do catálogo, e nenhum dos dois
 *    estaria certo. A junção é por `chaveDeEditora`, e quem dá o nome ao grupo
 *    é a variante **mais frequente**. Medido em 31/08: 724 nomes brutos → 692
 *    editoras, 32 grupos juntados, e conferidos um a um (nenhum juntou casas
 *    diferentes).
 * 2. 🚨 **Slug criado nunca muda.** O slug é endereço (`/publisher/sextante`) e
 *    é por ele que o app guarda quem a pessoa **acompanha** (`tipo: "editora"`
 *    em `lib/acompanhando.ts`). Trocá-lo numa passada seguinte deixaria o
 *    seguimento apontando para o vazio, sem erro nenhum. Por isso
 *    `resolverEditoras` recebe o que já está no banco e **reusa o slug de lá**
 *    sempre que a chave bate; a escolha pela frequência só decide nomes que
 *    ainda não existem.
 */

/**
 * Valores que a ficha traz na casa da editora e que **não são editora**.
 *
 * "Independente" aparece em 137 livros e é o oposto de uma editora: é a
 * ausência dela. Virar perfil juntaria 137 livros sem relação nenhuma sob uma
 * marca que não existe — pior que não mostrar nada.
 */
const NAO_E_EDITORA = new Set([
  "independente",
  "independent",
  "independentemente",
  "desconhecida",
  "desconhecido",
  "nao informado",
  "não informado",
  "sem editora",
  "n/a",
  "na",
  "-",
  "--",
]);

/** O mesmo `slugify` do resto da importação (sem acento, minúsculo, com traço). */
export function slugDeEditora(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * O nome da editora, limpo — ou `null` quando não há editora.
 *
 * Corta espaço em excesso e barra os valores da lista acima. Nome de uma letra
 * também sai: não identifica ninguém e viraria um perfil chamado "A".
 */
export function nomeDeEditora(bruto: string | null | undefined): string | null {
  const nome = (bruto ?? "").replace(/\s+/g, " ").trim();
  if (nome.length < 2) return null;
  if (NAO_E_EDITORA.has(nome.toLowerCase())) return null;
  return nome;
}

/**
 * A chave que junta as variantes do **mesmo** nome. Serve só para comparar —
 * nunca vira slug nem aparece na tela.
 *
 * Tira o "Editora"/"Grupo"/"Edições" da frente e o "Editora"/"Ltda"/"Publishing"
 * de trás, além de acento e caixa. É o que faz "SuperSônica" e "Supersônica",
 * "LVM" e "LVM Editora", "Pottermore" e "Pottermore Publishing" caírem no mesmo
 * balde.
 *
 * ⚠️ O `|| slugDeEditora(nome)` no fim não é excesso: uma editora chamada
 * literalmente "Editora" ficaria com chave vazia, e chave vazia juntaria tudo.
 */
export function chaveDeEditora(nome: string): string {
  const s = slugDeEditora(nome)
    .replace(/^(editora|editorial|edicoes|grupo|ed)-/, "")
    .replace(/-(editora|editorial|edicoes|ltda|s-a|sa|me|eireli|publishing|publisher|books|livros)$/, "");
  return s || slugDeEditora(nome);
}

/** Uma editora resolvida: o endereço dela e o nome que a tela mostra. */
export interface EditoraResolvida {
  slug: string;
  nome: string;
}

/**
 * Decide slug e nome de cada editora vista, respeitando as já existentes.
 *
 * @param nomes      todo nome de editora colhido nesta passada (com repetição —
 *                   é a contagem que escolhe o nome do grupo)
 * @param jaNoBanco  as editoras que o banco já tem (`slug` → `nome`)
 * @returns          nome bruto → a editora resolvida
 */
export function resolverEditoras(
  nomes: Iterable<string>,
  jaNoBanco: Iterable<{ slug: string; nome: string }>,
): Map<string, EditoraResolvida> {
  // Quantas vezes cada nome bruto apareceu — é o critério de quem batiza o grupo.
  const frequencia = new Map<string, number>();
  for (const bruto of nomes) {
    const nome = nomeDeEditora(bruto);
    if (nome) frequencia.set(nome, (frequencia.get(nome) ?? 0) + 1);
  }

  // O que o banco já decidiu, por chave. A primeira que aparecer manda: rodar de
  // novo não pode remexer endereço que já está em uso.
  const doBanco = new Map<string, EditoraResolvida>();
  for (const editora of jaNoBanco) {
    const chave = chaveDeEditora(editora.nome);
    if (!doBanco.has(chave)) doBanco.set(chave, { slug: editora.slug, nome: editora.nome });
  }

  // Agrupa os nomes desta passada e elege o mais frequente de cada grupo.
  const grupos = new Map<string, { nome: string; vezes: number }[]>();
  for (const [nome, vezes] of frequencia) {
    const chave = chaveDeEditora(nome);
    const lista = grupos.get(chave) ?? [];
    lista.push({ nome, vezes });
    grupos.set(chave, lista);
  }

  const resolvido = new Map<string, EditoraResolvida>();
  for (const [chave, lista] of grupos) {
    // Desempate alfabético para a escolha não depender da ordem de leitura do
    // disco — duas passadas no mesmo acervo têm de dar o mesmo slug.
    lista.sort((a, b) => b.vezes - a.vezes || a.nome.localeCompare(b.nome, "pt-BR"));
    const escolhida = doBanco.get(chave) ?? {
      slug: slugDeEditora(lista[0].nome),
      nome: lista[0].nome,
    };
    for (const { nome } of lista) resolvido.set(nome, escolhida);
  }

  return resolvido;
}
