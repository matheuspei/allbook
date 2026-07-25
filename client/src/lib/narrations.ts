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
 * **O que é dado de exemplo, para não confundir depois:** as narrações extras
 * (`narracoesExtras`) são fictícias, como o resto do catálogo. Elas existem para
 * o seletor ter o que mostrar. Todas as vozes são do AllBook Studio — porque hoje
 * **nenhum áudio humano existe no app**, e `studio.ts` já registra isso.
 *
 * A escolha fica no `localStorage`, por livro. Quando houver servidor, ela vira
 * campo do usuário e nada nas telas muda: elas já leem de função, não da chave.
 */

import { narratorKind, studioVoices, type NarratorKind } from "@/lib/studio";

/**
 * O mínimo que estas funções precisam saber de um livro.
 *
 * Não é o `Book` de `books.ts` de propósito: a ficha (`BookDetails`) monta o livro
 * dela com campos extras, e exigir o tipo inteiro só criaria conversão sem
 * ganho. Id e narrador bastam para saber quantas vozes existem.
 */
export interface LivroComNarrador {
  id: number;
  narrator: string;
}

const STORAGE_KEY = "allbook_narration_choice";

/** Avisa as telas de que a narração escolhida mudou (mesma aba). */
export const NARRATIONS_EVENT = "allbook:narrations";

export interface Narration {
  /** Estável e legível: `7:diogo-serrano`. */
  id: string;
  bookId: number;
  /** Slug da voz/pessoa — serve para a foto e para o link do perfil. */
  slug: string;
  name: string;
  kind: NarratorKind;
  /**
   * `principal` é a narração com que o livro entrou no catálogo; `pedido` foi
   * produzida depois, porque alguém pediu. A distinção aparece na interface: ver
   * a narração original e a que nasceu de um pedido no mesmo lugar explica por
   * que existem duas.
   */
  origem: "principal" | "pedido";
}

/**
 * Narrações extras por id de livro (além da que já está no `books.ts`).
 *
 * **Três livros só**, de propósito: o seletor deve ser a exceção, não o enfeite
 * que aparece em toda ficha. Quem não tem extra não mostra seletor nenhum.
 */
const narracoesExtras: Record<number, string[]> = {
  // Duna, hoje com Rafael Nogueira — Diogo Serrano é a voz seca, outro registro
  // para a mesma obra longa.
  7: ["diogo-serrano"],
  // Hábitos Atômicos, hoje com Maitê Cunha.
  102: ["bruno-sampaio"],
  // O Iluminado, hoje com Otávio Marques.
  105: ["camila-ferraz"],
};

const vozPorNome = new Map(studioVoices.map((voz) => [voz.name, voz]));
const vozPorSlug = new Map(studioVoices.map((voz) => [voz.slug, voz]));

function slugDoNome(nome: string): string {
  const voz = vozPorNome.get(nome);
  if (voz) return voz.slug;

  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Todas as narrações de um livro, a principal na frente.
 *
 * Sempre devolve **ao menos uma** — a do próprio `books.ts`. Assim quem chama
 * nunca precisa tratar lista vazia.
 */
export function narrationsOf(book: LivroComNarrador): Narration[] {
  const principal: Narration = {
    id: `${book.id}:${slugDoNome(book.narrator)}`,
    bookId: book.id,
    slug: slugDoNome(book.narrator),
    name: book.narrator,
    kind: narratorKind(book.narrator),
    origem: "principal",
  };

  const extras = (narracoesExtras[book.id] ?? []).flatMap((slug) => {
    const voz = vozPorSlug.get(slug);
    if (!voz || slug === principal.slug) return [];

    return [
      {
        id: `${book.id}:${slug}`,
        bookId: book.id,
        slug,
        name: voz.name,
        kind: narratorKind(voz.name),
        origem: "pedido",
      } satisfies Narration,
    ];
  });

  return [principal, ...extras];
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
