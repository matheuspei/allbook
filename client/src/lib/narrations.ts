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
 * **A vitrine também já junta** (31/08, §4.151): `catalog` tem um representante
 * por obra, e as outras gravações vivem em `irmasDaObra()`. Este arquivo lê
 * dali — a heurística de "que livros são a mesma obra" mora em `lib/obras.ts`,
 * usada pelos dois.
 *
 * A escolha fica no `localStorage`, por livro. A tabela `narracao_escolhida` já
 * existe no banco, mas nada a usa ainda — a chave também não está na lista de
 * `lib/sincronizacao.ts`, então a escolha ainda não sobe para a conta.
 */

import { irmasDaObra, livroPorId, type Book } from "@/lib/books";
import { SEM_NOME, chaveDePessoa } from "@/lib/obras";
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
/* Quem é a mesma voz                                                          */
/* -------------------------------------------------------------------------- */

/**
 * ⚠️ **A heurística de "que livros são a mesma obra" mora em `lib/obras.ts`**
 * desde 31/08 (§4.151), porque o `books.ts` passou a precisar dela para montar
 * a vitrine com uma ficha por obra. Aqui ficou só o que é de narração.
 */

function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
  const noCatalogo = livroPorId(book.id);

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

  const irmas = irmasDaObra(noCatalogo.id);

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
