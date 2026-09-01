/**
 * A OBRA — o que junta as várias gravações do mesmo livro (31/08, §4.151).
 *
 * O acervo entrega **uma entrada por gravação**: *A Arte da Guerra*, de
 * Maquiavel, chega três vezes (duas vozes, uma delas em duas lojas), e
 * *O Príncipe*, cinco. Cada uma virou um livro com id próprio, e a vitrine
 * mostrava um cartão para cada.
 *
 * O Matheus tinha decidido o contrário lá no começo (26/07, §4.30) e cobrou de
 * novo hoje: *"quando tem diversos narradores, a gente só tem que ter um livro,
 * e a gente coloca todos os narradores dentro daquele livro (…) deveria ter só
 * dois livros aqui e não três"*.
 *
 * Este arquivo é a heurística que decide **quais entradas são a mesma obra**.
 * Ele não conhece tela nenhuma: recebe livros e devolve grupos. Quem o usa é o
 * `books.ts` (para montar a vitrine com um representante por obra) e o
 * `narrations.ts` (para listar as vozes daquela obra).
 *
 * ⚠️ **Por que a heurística e não um id da obra:** as lojas não compartilham
 * identificador nenhum. O ISBN, quando existe, é **da gravação** e não da obra —
 * cada audiolivro tem o seu. Sobra o que está escrito: título e autor. O dado
 * vem sujo (nome do narrador no campo autor, autor abreviado, adorno colado no
 * título) e cada regra abaixo existe por causa de um caso real, anotado nela.
 */

import type { Book } from "./books";

/* -------------------------------------------------------------------------- */
/* Normalização                                                                */
/* -------------------------------------------------------------------------- */

function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizar(texto: string): string {
  return semAcento(texto)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * O nome de pessoa como chave, com as palavras ordenadas.
 *
 * ⚠️ Não é capricho: as lojas gravam o mesmo nome de duas formas —
 * "Wallace D. Wattles" na Audible e "Wattles, Wallace D." na Storytel. Ordenado,
 * os dois viram a mesma chave; comparado direto, o mesmo narrador apareceria
 * como duas vozes diferentes na lista.
 */
export function chaveDePessoa(nome: string): string {
  return normalizar(nome).split(" ").filter(Boolean).sort().join(" ");
}

/** Nomes que a loja usa quando não sabe quem é — não são uma pessoa. */
export const SEM_NOME = new Set([
  "",
  "narrador nao informado",
  "informado nao narrador",
  "autor desconhecido",
  "desconhecido",
  "nao informado",
  "informado nao",
  "narrators various",
  "various narrators",
  "ia",
]);

/** Partículas que não identificam ninguém — "de", "da", "van"… */
const PARTICULAS = new Set(["de", "da", "do", "dos", "das", "e", "van", "von", "del", "la", "le", "of"]);

const ARTIGOS = new Set(["o", "a", "os", "as", "um", "uma", "no", "na"]);

function palavrasDoNome(nome: string): Set<string> {
  return new Set(normalizar(nome).split(" ").filter((p) => p && !PARTICULAS.has(p)));
}

/* -------------------------------------------------------------------------- */
/* O título da obra, e o pedaço que a loja pendurou nele                       */
/* -------------------------------------------------------------------------- */

/** Os separadores que a loja usa para pendurar subtítulo e adorno no título. */
const SEPARADORES = [": ", " – ", " — ", " - "];

/**
 * Expressões que denunciam que o nome pendurado no título é de **quem lê**.
 *
 * 🚨 **Sem elas a regra estraga 17 livros para consertar 1.** A primeira versão
 * só exigia que o nome do autor aparecesse no adorno — e aí *"Machado passional:
 * A face íntima de Machado de Assis"*, *"Mascarada: (A Eterna Coleção de Barbara
 * Cartland 54)"* e outros 15 perdiam o autor **correto**, porque a obra fala do
 * próprio autor. Exigindo "na voz de" / "narrado por", sobra exatamente o caso
 * que é: hoje, 1 livro em 13.917.
 */
const MARCAS_DE_NARRACAO = [
  "na voz de",
  "narrado por",
  "narracao de",
  "lido por",
  "interpretado por",
  "voz de",
];

/**
 * Parte o título em **obra** e **adorno**.
 *
 * ⚠️ **Corta no separador que aparece PRIMEIRO no texto, não no primeiro da
 * lista** — e essa diferença decidiu um caso real. *"O pequeno príncipe -
 * Áudiolivro: Na voz de Glycon Luiz"* tem os dois: procurando `": "` antes, a
 * obra virava *"O pequeno príncipe - Áudiolivro"*.
 *
 * **Corta em dois casos**, e o segundo veio dos livros de Maquiavel:
 *
 * 1. **título longo** (mais de 48 caracteres) — a mesma régua da vitrine, pela
 *    mesma razão: título curto com dois-pontos costuma ser parte do nome
 *    (*Duna: Messias*);
 * 2. **o que vem depois do separador é o nome do autor** — *"A Arte da Guerra -
 *    Maquiavel"* (28 caracteres) e *"O Príncipe - Maquiavel"* (22) ficavam de
 *    fora do grupo por serem curtos demais para a regra 1.
 */
export function partirTitulo(book: Book): { obra: string; adorno: string } {
  const titulo = book.title;
  if (book.subtitle) return { obra: normalizar(titulo), adorno: "" };

  const cortes = SEPARADORES.map((s) => titulo.indexOf(s)).filter((i) => i >= 8);
  if (cortes.length === 0) return { obra: normalizar(titulo), adorno: "" };

  const corte = Math.min(...cortes);
  const adorno = normalizar(titulo.slice(corte));
  if (titulo.length > 48 || adornoEhOAutor(adorno, book.author)) {
    return { obra: normalizar(titulo.slice(0, corte)), adorno };
  }
  return { obra: normalizar(titulo), adorno: "" };
}

/** O adorno é só o nome do autor repetido? ("A Arte da Guerra - Maquiavel") */
function adornoEhOAutor(adorno: string, autor: string): boolean {
  const palavras = adorno.split(" ").filter((p) => p && !PARTICULAS.has(p));
  const doAutor = palavrasDoNome(autor);
  if (palavras.length === 0 || doAutor.size === 0) return false;
  return palavras.every((p) => doAutor.has(p));
}

/**
 * O adorno é descartável — não muda de que obra se trata?
 *
 * Vazio, o nome do autor repetido ("A Arte da Guerra - Maquiavel") ou a marca
 * de quem lê ("na voz de Glycon Luiz"). Tudo o mais — "Temp 2. Ep 6", "Volume
 * II", "sons de bosque de bambu" — é conteúdo próprio, e separa episódios de
 * uma série que compartilham o começo do título.
 */
function adornoDescartavel(adorno: string, autor: string): boolean {
  if (!adorno) return true;
  if (adornoEhOAutor(adorno, autor)) return true;
  return MARCAS_DE_NARRACAO.some((marca) => adorno.includes(marca));
}

/* -------------------------------------------------------------------------- */
/* Quem é a mesma pessoa, e quem não identifica ninguém                        */
/* -------------------------------------------------------------------------- */

/**
 * Dois nomes de autor são a mesma pessoa?
 *
 * Um tem de conter o outro, e o que os dois compartilham precisa ter ao menos 4
 * letras. É o que junta **"Saint Exupery"** com **"Antoine de Saint-Exupéry"**,
 * **"Maquiavel"** com "Nicolau Maquiavel" e "Machado" com "Machado de Assis",
 * sem juntar "Silva" com "Souza".
 */
function mesmoAutor(a: Set<string>, b: Set<string>): boolean {
  const comuns = [...a].filter((p) => b.has(p));
  if (comuns.length === 0) return false;
  const contido = [...a].every((p) => b.has(p)) || [...b].every((p) => a.has(p));
  return contido && comuns.some((p) => p.length >= 4);
}

/**
 * Este "autor" não serve para identificar a obra?
 *
 * Dois casos, e **só** estes dois:
 *
 * 1. **Não veio autor nenhum** — 5.014 livros, quase todos do Ubook.
 * 2. **O nome do "autor" está no adorno, com marca de narração** — *"O pequeno
 *    príncipe - Áudiolivro: Na voz de Glycon Luiz"*, com "Glycon Luiz" no campo
 *    autor. Quem a loja pôs ali é o narrador; o Matheus achou este caso na mão.
 *
 * 🚨 **Autor igual ao narrador NÃO entra na lista**, e a tentação é grande: são
 * 1.916 livros. Mas autor que narra o próprio livro é o normal do audiolivro
 * independente, não um erro. Tratá-los como "sem autor" fez *Imitadores de
 * Deus*, do Ap. Miguel Ângelo, ser engolido pelo *Imitadores de Deus* do Charles
 * Spurgeon — dois livros diferentes com o mesmo nome.
 */
function autorNaoIdentifica(book: Book, adorno: string): boolean {
  const palavras = palavrasDoNome(book.author);
  if (palavras.size === 0 || SEM_NOME.has(chaveDePessoa(book.author))) return true;
  if (!MARCAS_DE_NARRACAO.some((marca) => adorno.includes(marca))) return false;
  const noAdorno = adorno.split(" ");
  return [...palavras].every((p) => noAdorno.includes(p));
}

/**
 * Título específico o bastante para carregar sozinho a identidade da obra.
 *
 * Trava para a anexação de quem não tem autor: sem ela, todo livro anônimo
 * chamado *"Liderança"* entraria no grupo de qualquer outro *"Liderança"*.
 */
function tituloDistintivo(obra: string): boolean {
  const palavras = obra.split(" ").filter((p) => p && !PARTICULAS.has(p) && !ARTIGOS.has(p));
  return obra.length >= 10 && palavras.length >= 2;
}

/* -------------------------------------------------------------------------- */
/* O agrupamento                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Junta os livros que são a mesma obra. Devolve **um array por obra**, e todo
 * livro aparece em exatamente um deles.
 *
 * **Como um grupo se forma**, dentro de cada título:
 *
 * 1. quem tem autor de verdade forma os grupos, fundindo os nomes que
 *    `mesmoAutor()` reconhece como a mesma pessoa;
 * 2. quem não tem autor utilizável é **anexado ao maior** desses grupos — e só
 *    se ele for maior que todos os outros e o título for distintivo. Empate
 *    entre dois autores homônimos deixa o órfão de fora, que é o certo:
 *    ninguém sabe de quem ele é.
 */
export function agruparEmObras(livros: Book[]): Book[][] {
  /* ---- Duas chaves de título, e a segunda existe por causa do Ubook -------
   *
   * 🚨 **O Ubook entrega o título sem acento, sem pontuação e em minúsculas** —
   * 4.370 dos 4.953 livros dele. *"100% Vendedor: Motivação em vendas para
   * vencer o mercado"* chega como *"100 vendedor motivacao em vendas para
   * vencer o mercado"*, **sem os dois-pontos**. Sem o separador não há corte, a
   * chave curta vira o título inteiro, e ele não encontrava a irmã da Storytel
   * — que é justamente a que tem título, gênero e capítulos de verdade.
   *
   * Por isso cada livro entra por **duas** chaves: o título da obra (cortado) e
   * o **título completo normalizado**, onde a diferença de acento e pontuação
   * já sumiu. Os grupos que compartilharem qualquer livro são fundidos no fim.
   * ⚠️ Isto NÃO junta *Duna* com *Duna: Messias* — os títulos completos são
   * diferentes, e a chave curta continua com a régua de 48 caracteres.        */
  const porTitulo = new Map<string, { livro: Book; adorno: string }[]>();
  const guardar = (chave: string, entrada: { livro: Book; adorno: string }) => {
    const lista = porTitulo.get(chave);
    if (lista) lista.push(entrada);
    else porTitulo.set(chave, [entrada]);
  };
  for (const livro of livros) {
    const { obra, adorno } = partirTitulo(livro);
    /* 🚨 **A partição pelo adorno impede que uma SÉRIE vire um livro só.**
     * "Leia a Bula - Temp 2. Ep 6: O Significado da Vida" e os outros 14
     * episódios têm todos a mesma obra curta ("leia a bula"); sem esta trava
     * viravam **uma ficha e 14 gravações**, e o podcast sumia da vitrine. O
     * mesmo acontecia com as 13 faixas da "Coleção Sons Relaxantes".
     *
     * A régua: adorno **descartável** (vazio, o nome do autor, ou "na voz de
     * fulano") entra no núcleo da obra; adorno com conteúdo próprio só se junta
     * a outro **idêntico** — que é a mesma edição vendida em duas lojas.        */
    const assinatura = adornoDescartavel(adorno, livro.author) ? "" : `#${adorno}`;
    guardar(obra + assinatura, { livro, adorno });
    /* A chave do título completo NÃO leva assinatura: ali os dois textos já são
     * a mesma frase inteira, e é ela que casa o título estragado do Ubook com a
     * irmã completa da Storytel. */
    const completo = normalizar(`${livro.title} ${livro.subtitle ?? ""}`);
    if (completo && completo !== obra + assinatura) guardar(completo, { livro, adorno });
  }

  const parciais: Book[][] = [];
  for (const [obra, entradas] of porTitulo) {
    const grupos: { autor: Set<string>; livros: Book[] }[] = [];
    const orfaos: Book[] = [];

    for (const { livro, adorno } of entradas) {
      if (autorNaoIdentifica(livro, adorno)) {
        orfaos.push(livro);
        continue;
      }
      const palavras = palavrasDoNome(livro.author);
      const grupo = grupos.find((g) => mesmoAutor(palavras, g.autor));
      if (grupo) {
        for (const p of palavras) grupo.autor.add(p);
        grupo.livros.push(livro);
      } else {
        grupos.push({ autor: palavras, livros: [livro] });
      }
    }

    if (orfaos.length > 0) {
      const ordenados = [...grupos].sort((a, b) => b.livros.length - a.livros.length);
      const dominante =
        ordenados.length > 0 &&
        tituloDistintivo(obra) &&
        (ordenados.length === 1 || ordenados[0].livros.length > ordenados[1].livros.length);
      if (dominante) ordenados[0].livros.push(...orfaos);
      else grupos.push({ autor: new Set(), livros: orfaos });
    }

    for (const grupo of grupos) parciais.push(grupo.livros);
  }

  /* ---- Fundir o que as duas chaves acharem em comum --------------------- */
  const pai = new Map<number, number>();
  const raiz = (id: number): number => {
    let atual = id;
    while (pai.get(atual) !== atual) {
      const acima = pai.get(atual)!;
      pai.set(atual, pai.get(acima)!);
      atual = acima;
    }
    return atual;
  };
  for (const grupo of parciais) {
    for (const livro of grupo) if (!pai.has(livro.id)) pai.set(livro.id, livro.id);
  }
  for (const grupo of parciais) {
    for (let i = 1; i < grupo.length; i++) {
      const a = raiz(grupo[0].id);
      const b = raiz(grupo[i].id);
      if (a !== b) pai.set(a, b);
    }
  }

  const porRaiz = new Map<number, Book[]>();
  const jaVisto = new Set<number>();
  for (const grupo of parciais) {
    for (const livro of grupo) {
      if (jaVisto.has(livro.id)) continue;
      jaVisto.add(livro.id);
      const r = raiz(livro.id);
      const lista = porRaiz.get(r);
      if (lista) lista.push(livro);
      else porRaiz.set(r, [livro]);
    }
  }
  return [...porRaiz.values()];
}

/**
 * Quantos sinais de português de verdade o título carrega: acentos, cedilha e
 * pontuação (`%`, `:`, `?`, `—`).
 *
 * ⚠️ **Maiúsculas no meio NÃO contam, e já contaram.** Elas fariam o *Title
 * Case* ganhar — "Motivação Em Vendas Para Vencer O Mercado" venceria
 * "Motivação em vendas para vencer o mercado", que é o português correto e, no
 * caso real, era também a gravação com os capítulos nomeados.
 *
 * 🚨 **Serve para escolher entre dois textos do MESMO título** — não para
 * comparar obras diferentes. O Ubook manda 4.370 dos seus 4.953 títulos sem
 * acento, sem pontuação e em minúsculas; a mesma obra na Storytel ou no
 * Tocalivros vem inteira. Sem este critério, a vitrine mostrava a versão
 * estragada porque ela é, por definição, a mais curta.
 */
function riquezaDoTitulo(titulo: string): number {
  const acentos = titulo.length - semAcento(titulo).length;
  const pontuacao = (titulo.match(/[%:;,!?()–—"']/g) ?? []).length;
  return acentos + pontuacao;
}

/**
 * Qual das gravações representa a obra na vitrine.
 *
 * A escolha aparece em toda tela — é esta capa, este título e este autor que a
 * pessoa vê antes de abrir. Em ordem:
 *
 * 1. **autor que identifica** — é o que tira *"Escrito por Glycon Luiz"* da
 *    capa de *O Pequeno Príncipe*;
 * 2. **capa de verdade**, e não a tipográfica gerada;
 * 3. **título mais curto** — entre *"A Arte da Guerra"* e *"A Arte da Guerra -
 *    Maquiavel"*, o nome limpo da obra;
 * 4. **duração conhecida**, e por fim o **menor id**, que é quem entrou
 *    primeiro — critério estável, para a vitrine não trocar de capa a cada
 *    importação.
 */
export function representanteDaObra(grupo: Book[], temCapaReal: (livro: Book) => boolean): Book {
  const nota = (livro: Book): number[] => {
    const { adorno } = partirTitulo(livro);
    return [
      autorNaoIdentifica(livro, adorno) ? 1 : 0,
      // ⚠️ **O nome mais completo do autor ganha** — e isso não é detalhe de
      // ficha: o perfil da pessoa (`lib/people.ts`) é derivado do nome que a
      // vitrine mostra. Com "Maquiavel" representando *O Príncipe* e "Nicolau
      // Maquiavel" representando *A Arte da Guerra*, o mesmo homem virava dois
      // perfis, cada um com um livro.
      -palavrasDoNome(livro.author).size,
      temCapaReal(livro) ? 0 : 1,
      // ⚠️ **O título mais RICO ganha do mais curto** — e a ordem entre estes
      // dois critérios decidiu o caso que o Matheus achou. O Ubook entrega
      // *"100 vendedor motivacao em vendas..."*, que é **mais curto** que o
      // *"100% Vendedor: Motivação em vendas..."* da Storytel justamente porque
      // perdeu o `%`, os dois-pontos e todos os acentos. Pelo comprimento, o
      // título estragado representaria a obra.
      -riquezaDoTitulo(livro.title),
      // A gravação que anuncia duração vem antes da que não anuncia: é sinal de
      // ficha mais completa, e na prática é a que também traz capítulo com nome.
      livro.duracaoSegundos ? 0 : 1,
      livro.title.length,
      livro.id,
    ];
  };
  return [...grupo].sort((a, b) => {
    const na = nota(a);
    const nb = nota(b);
    for (let i = 0; i < na.length; i++) {
      if (na[i] !== nb[i]) return na[i] - nb[i];
    }
    return 0;
  })[0];
}
