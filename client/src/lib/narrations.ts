/**
 * As narrações de um livro — porque um livro pode ter mais de uma.
 *
 * **De onde isto veio (26/07, ver ROTEIRO 4.30).** O Matheus descreveu o caso: um
 * pedido chega para um livro que **já está no app**. O AllBook procura outra
 * narração; se não existir, o estúdio grava. E aí a plataforma tem duas narrações
 * da mesma obra. A pergunta dele: sobem dois livros?
 *
 * > "Nesse caso, não subir os dois livros, a gente meio que colocar um botãozinho
 * > dentro do player, onde a pessoa possa trocar quem é a pessoa que está
 * > narrando."
 *
 * **A decisão: um livro, várias narrações.** Dois cartões do mesmo título no
 * catálogo seria o pior dos mundos — a busca devolveria duas vezes a mesma obra,
 * a biblioteca também, e as notas e comentários se dividiriam entre dois lugares
 * quando são da **mesma obra**. Aqui a obra é uma; quem varia é a voz.
 *
 * ## As narrações agora são as DE VERDADE (31/08, §4.147)
 *
 * 🚨 **O seletor esteve morto por 10 dias e ninguém viu.** As narrações extras
 * eram um dicionário escrito à mão — `{7: [...], 102: [...], 105: [...]}` —, e
 * esses são ids das **63 maquetes apagadas em 21/08**. O acervo real começa no
 * id 100.000, então `narrationsOf()` sempre devolvia uma opção só e o seletor
 * (que existe inteiro, em `SeletorDeNarracao.tsx`) nunca aparecia. O Matheus
 * relatou como "hoje só existe a opção de ouvir a narração, e é isso".
 *
 * **De onde elas saem agora:** do próprio catálogo. O acervo trouxe a mesma obra
 * várias vezes — *1984* está lá com 612, 721 e 768 minutos, que são três
 * gravações diferentes —, cada uma como um livro separado. Este arquivo junta as
 * irmãs pelo título da obra e pelo autor, e cada **narrador distinto** dentro
 * do grupo vira uma opção. O agrupamento está descrito em `obterIndice()`, com
 * as três armadilhas que o dado sujo das lojas impõe.
 *
 * ⚠️ **Isto é meia solução, e a metade que falta é a vitrine.** As irmãs
 * continuam aparecendo como cartões separados na Início e na busca — juntá-las
 * lá é trabalho de `/api/catalogo`, e a decisão de qual delas é a ficha única
 * está descrita no §4.147 do ROTEIRO.
 *
 * A escolha fica no `localStorage`, por livro. A tabela `narracao_escolhida` já
 * existe no banco, mas nada a usa ainda — a chave também não está na lista de
 * `lib/sincronizacao.ts`, então a escolha ainda não sobe para a conta.
 */

import { catalog, type Book } from "@/lib/books";
import { narratorKind, type NarratorKind } from "@/lib/studio";

/**
 * O mínimo que estas funções precisam saber de um livro.
 *
 * Não é o `Book` de `books.ts` de propósito: a ficha (`BookDetails`) monta o livro
 * dela com campos extras, e exigir o tipo inteiro só criaria conversão sem
 * ganho. Id e narrador bastam — o resto sai do catálogo, pelo id.
 */
export interface LivroComNarrador {
  id: number;
  narrator: string;
}

const STORAGE_KEY = "allbook_narration_choice";

/** Avisa as telas de que a narração escolhida mudou (mesma aba). */
export const NARRATIONS_EVENT = "allbook:narrations";

export interface Narration {
  /** Estável e legível: `100123:diogo-serrano`. */
  id: string;
  /**
   * O livro **desta gravação** — e ele pode ser diferente do livro da ficha
   * aberta, porque cada narração do acervo entrou como um livro próprio.
   *
   * ⚠️ É por este id que se pede o áudio (`/api/audio/:id/...`). Usar o id da
   * ficha para tocar uma narração escolhida daria a voz errada, calada.
   */
  bookId: number;
  /** Slug da voz/pessoa — serve para a foto e para o link do perfil. */
  slug: string;
  name: string;
  kind: NarratorKind;
  /** Quanto dura esta gravação, quando a loja a anuncia. É o que separa uma
   *  leitura integral de uma versão resumida na hora de escolher. */
  duracaoSegundos?: number;
  /**
   * `principal` é a narração com que o livro entrou no catálogo; `pedido` foi
   * produzida depois, porque alguém pediu. A distinção aparece na interface: ver
   * a narração original e a que nasceu de um pedido no mesmo lugar explica por
   * que existem duas.
   *
   * ⚠️ Nada do acervo é `pedido` — as lojas não produzem sob demanda. Quando o
   * estúdio gravar a primeira, é aqui que ela se declara.
   */
  origem: "principal" | "pedido";
}

/* -------------------------------------------------------------------------- */
/* O índice das obras — como as irmãs se acham                                 */
/* -------------------------------------------------------------------------- */

function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizar(texto: string): string {
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
function chaveDePessoa(nome: string): string {
  return normalizar(nome).split(" ").filter(Boolean).sort().join(" ");
}

/** Nomes que a loja usa quando não sabe quem narra — não são uma voz. */
const SEM_NOME = new Set([
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

/* -------------------------------------------------------------------------- */
/* O título da obra, e o pedaço que a loja pendurou nele                       */
/* -------------------------------------------------------------------------- */

/** Os separadores que a loja usa para pendurar subtítulo e adorno no título. */
const SEPARADORES = [": ", " – ", " — ", " - "];

/**
 * Parte o título em **obra** e **adorno**.
 *
 * ⚠️ **Corta no separador que aparece PRIMEIRO no texto, não no primeiro da
 * lista** — e essa diferença decidiu um caso real. *"O pequeno príncipe -
 * Áudiolivro: Na voz de Glycon Luiz"* tem os dois: procurando `": "` antes,
 * a obra virava *"O pequeno príncipe - Áudiolivro"* e o livro não encontrava as
 * outras narrações. (`tituloDeVitrine()` em `books.ts` tem a mesma ordem fixa;
 * lá o efeito é só estético, aqui muda o agrupamento.)
 *
 * O limite de 48 caracteres e o `i >= 8` são os da vitrine, e pela mesma razão:
 * título curto com dois-pontos costuma ser parte do nome (*Duna: Messias*).
 */
function partirTitulo(book: Book): { obra: string; adorno: string } {
  const titulo = book.title;
  if (!book.subtitle && titulo.length > 48) {
    const cortes = SEPARADORES.map((s) => titulo.indexOf(s)).filter((i) => i >= 8);
    if (cortes.length > 0) {
      const corte = Math.min(...cortes);
      return { obra: normalizar(titulo.slice(0, corte)), adorno: normalizar(titulo.slice(corte)) };
    }
  }
  return { obra: normalizar(titulo), adorno: "" };
}

/** Partículas que não identificam ninguém — "de", "da", "van"… */
const PARTICULAS = new Set(["de", "da", "do", "dos", "das", "e", "van", "von", "del", "la", "le", "of"]);

function palavrasDoNome(nome: string): Set<string> {
  return new Set(normalizar(nome).split(" ").filter((p) => p && !PARTICULAS.has(p)));
}

/**
 * Dois nomes de autor são a mesma pessoa?
 *
 * Um tem de conter o outro, e o que os dois compartilham precisa ter ao menos 4
 * letras. É o que junta **"Saint Exupery"** com **"Antoine de Saint-Exupéry"**
 * e "Machado" com "Machado de Assis", sem juntar "Silva" com "Souza".
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
 * 2. **O nome do "autor" está no adorno do título** — *"O pequeno príncipe -
 *    Áudiolivro: Na voz de Glycon Luiz"*, com "Glycon Luiz" no campo autor. Quem
 *    a loja pôs ali é o narrador, e o Matheus achou este caso na mão.
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
 * Título específico o bastante para carregar sozinho a identidade da obra.
 *
 * Serve de trava para a anexação abaixo: sem ela, todo livro sem autor chamado
 * *"Liderança"* entraria no grupo de qualquer outro *"Liderança"*.
 */
function tituloDistintivo(obra: string): boolean {
  const palavras = obra.split(" ").filter((p) => p && !PARTICULAS.has(p) && !["o", "a", "os", "as", "um", "uma", "no", "na"].includes(p));
  return obra.length >= 10 && palavras.length >= 2;
}

let indice: Map<number, Book[]> | null = null;
let tamanhoDoCatalogoNoIndice = -1;

/**
 * As irmãs de cada livro (id → o grupo inteiro, ele incluído), calculadas uma
 * vez só.
 *
 * ⚠️ O catálogo **nasce vazio e se enche depois** (`carregarCatalogo()`), e
 * `catalog` nunca troca de referência — por isso o índice se refaz quando o
 * tamanho muda, em vez de ser montado na carga do módulo. Sem isso, um índice
 * construído cedo demais ficaria vazio para sempre, sem erro nenhum.
 *
 * **Como um grupo se forma**, dentro de cada título de obra:
 *
 * 1. quem tem autor de verdade forma os grupos, fundindo os nomes que
 *    `mesmoAutor()` reconhece como a mesma pessoa;
 * 2. quem não tem autor utilizável é **anexado ao maior** desses grupos — e só
 *    se ele for maior que todos os outros e o título for distintivo. Empate
 *    entre dois autores homônimos deixa o órfão de fora, que é o certo:
 *    ninguém sabe de quem ele é.
 */
function obterIndice(): Map<number, Book[]> {
  if (indice && tamanhoDoCatalogoNoIndice === catalog.length) return indice;

  const porTitulo = new Map<string, { livro: Book; adorno: string }[]>();
  for (const livro of catalog) {
    const { obra, adorno } = partirTitulo(livro);
    const lista = porTitulo.get(obra);
    if (lista) lista.push({ livro, adorno });
    else porTitulo.set(obra, [{ livro, adorno }]);
  }

  const novo = new Map<number, Book[]>();
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

    for (const grupo of grupos) {
      for (const livro of grupo.livros) novo.set(livro.id, grupo.livros);
    }
  }

  indice = novo;
  tamanhoDoCatalogoNoIndice = catalog.length;
  return novo;
}

function slugDoNome(nome: string): string {
  return semAcento(nome)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function comoNarracao(livro: Book, origem: Narration["origem"]): Narration {
  const slug = slugDoNome(livro.narrator);
  return {
    id: `${livro.id}:${slug}`,
    bookId: livro.id,
    slug,
    name: livro.narrator,
    kind: narratorKind(livro.narrator),
    duracaoSegundos: livro.duracaoSegundos,
    origem,
  };
}

/**
 * Todas as narrações de um livro, a do próprio livro na frente.
 *
 * Sempre devolve **ao menos uma** — a do livro pedido. Assim quem chama nunca
 * precisa tratar lista vazia.
 *
 * **Uma voz, uma opção.** Dentro da obra, as entradas são agrupadas por
 * narrador: a mesma gravação distribuída em duas lojas (é o caso de 697 grupos
 * do acervo) aparece **uma vez**, não duas. E as entradas sem narrador com nome
 * — "Narrador não informado", que é o caso de 5 mil livros — colapsam todas
 * numa só, senão o seletor ofereceria duas opções com o mesmo rótulo e nenhuma
 * forma de distingui-las.
 */
export function narrationsOf(book: LivroComNarrador): Narration[] {
  const noCatalogo = catalog.find((livro) => livro.id === book.id);

  // Livro que não está no catálogo (uma ficha montada à mão, um id antigo):
  // ele é a única narração que se pode afirmar que existe.
  if (!noCatalogo) {
    const slug = slugDoNome(book.narrator);
    return [
      {
        id: `${book.id}:${slug}`,
        bookId: book.id,
        slug,
        name: book.narrator,
        kind: narratorKind(book.narrator),
        origem: "principal",
      },
    ];
  }

  const irmas = obterIndice().get(noCatalogo.id) ?? [noCatalogo];

  const porVoz = new Map<string, Book>();
  for (const irma of irmas) {
    const voz = vozDe(irma);
    // ⚠️ **Entrada sem narrador com nome não vira opção.** São 5 mil livros
    // (o Ubook não informa quem narra), e quase sempre a mesma gravação que a
    // irmã nomeada — só sem o crédito. Oferecê-las encheria o seletor de linhas
    // "Narrador não informado" entre as quais ninguém consegue escolher.
    if (voz === SEM_VOZ) continue;
    const jaTem = porVoz.get(voz);
    if (!jaTem || melhorDaMesmaVoz(irma, jaTem) === irma) porVoz.set(voz, irma);
  }

  // A do livro aberto vem primeiro, sempre: é a que a ficha está mostrando —
  // inclusive quando ela é uma das sem nome, senão a pessoa veria a lista sem a
  // opção em que está.
  const vozDoLivro = vozDe(noCatalogo);
  const lista = [comoNarracao(noCatalogo, "principal")];
  for (const [voz, irma] of porVoz) {
    if (voz === vozDoLivro) continue;
    lista.push(comoNarracao(irma, "principal"));
  }
  return lista;
}

/** A voz de uma entrada, com todos os "não informado" caindo no mesmo balde. */
/** A chave de quem NÃO tem nome de narrador — todos caem no mesmo balde. */
const SEM_VOZ = "(sem nome)";

function vozDe(livro: Book): string {
  const chave = chaveDePessoa(livro.narrator);
  return SEM_NOME.has(chave) ? SEM_VOZ : chave;
}

/**
 * Entre duas entradas da MESMA voz — a mesma gravação vendida em duas lojas —,
 * qual representa a narração.
 *
 * Fica a que anuncia duração: é o que o seletor tem para mostrar, e o que
 * distingue uma leitura integral de uma resumida. Empate, fica a de id menor,
 * que é a que entrou primeiro no catálogo.
 */
function melhorDaMesmaVoz(a: Book, b: Book): Book {
  if (Boolean(a.duracaoSegundos) !== Boolean(b.duracaoSegundos)) {
    return a.duracaoSegundos ? a : b;
  }
  return a.id <= b.id ? a : b;
}

function readChoices(): Record<string, string> {
  try {
    const guardado = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return guardado && typeof guardado === "object" ? guardado : {};
  } catch {
    return {};
  }
}

/**
 * A narração que vale para este livro agora.
 *
 * Se a escolha guardada não existe mais (a lista mudou, o id era de outra
 * versão), cai na principal em silêncio — melhor isso do que a ficha ficar sem
 * narrador por causa de uma chave velha.
 */
export function chosenNarration(book: LivroComNarrador): Narration {
  const lista = narrationsOf(book);
  const escolhido = readChoices()[String(book.id)];
  return lista.find((narracao) => narracao.id === escolhido) ?? lista[0];
}

export function chooseNarration(bookId: number, narrationId: string): void {
  const atual = readChoices();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...atual, [String(bookId)]: narrationId }));
  window.dispatchEvent(new Event(NARRATIONS_EVENT));
}

/** Tem mais de uma voz para escolher? É o que decide se o seletor aparece. */
export function hasChoiceOfNarration(book: LivroComNarrador): boolean {
  return narrationsOf(book).length > 1;
}
