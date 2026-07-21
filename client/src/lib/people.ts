import { catalog, type Book, type Genre } from "./books";

/**
 * Pessoas do catálogo — autores e narradores.
 *
 * Nada aqui é digitado à mão: a lista é derivada do próprio `catalog`. Assim,
 * ao acrescentar um livro, o autor e o narrador dele ganham perfil sozinhos, e
 * não existe a possibilidade de a lista de pessoas discordar da lista de livros.
 */

/**
 * Fotos das pessoas, achadas automaticamente pelo Vite.
 *
 * Para adicionar uma foto, basta soltar o arquivo em
 * `client/src/assets/images/people/` com o nome igual ao slug da pessoa —
 * `stephen-king.jpg`, `otavio-marques.png`. **Não é preciso mexer em código.**
 * Quem não tiver arquivo continua com o avatar gerado a partir do nome.
 */
const arquivosDeFoto = import.meta.glob("../assets/images/people/*.{jpg,jpeg,png,webp,avif}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const fotosPorSlug: Record<string, string> = Object.fromEntries(
  Object.entries(arquivosDeFoto).map(([caminho, url]) => [
    caminho.split("/").pop()!.replace(/\.\w+$/, ""),
    url,
  ])
);

export type PersonRole = "author" | "narrator";

export interface Person {
  slug: string;
  name: string;
  /** Uma mesma pessoa pode escrever e narrar — daí ser lista, não valor único. */
  roles: PersonRole[];
  photo?: string;
  /** Livros que a pessoa escreveu, do mais bem avaliado para o menos. */
  wrote: Book[];
  /** Livros que a pessoa narrou, do mais bem avaliado para o menos. */
  narrated: Book[];
  /** Gêneros em que atua, do mais frequente para o menos. */
  genres: Genre[];
  /** Quantidade de títulos distintos (escrever e narrar o mesmo livro conta uma vez). */
  titles: number;
  /** Média das notas desses títulos. */
  rating: number;
}

/** "J.R.R. Tolkien" → "j-r-r-tolkien". Sem acentos, para caber numa URL. */
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ordenarPorNota(livros: Book[]): Book[] {
  return [...livros].sort((a, b) => b.rating - a.rating);
}

function construirRegistro(): Map<string, Person> {
  const registro = new Map<string, Person>();

  function garantir(nome: string): Person {
    const slug = slugify(nome);
    let pessoa = registro.get(slug);
    if (!pessoa) {
      pessoa = {
        slug,
        name: nome,
        roles: [],
        photo: fotosPorSlug[slug],
        wrote: [],
        narrated: [],
        genres: [],
        titles: 0,
        rating: 0,
      };
      registro.set(slug, pessoa);
    }
    return pessoa;
  }

  for (const livro of catalog) {
    const autor = garantir(livro.author);
    autor.wrote.push(livro);
    if (!autor.roles.includes("author")) autor.roles.push("author");

    const narrador = garantir(livro.narrator);
    narrador.narrated.push(livro);
    if (!narrador.roles.includes("narrator")) narrador.roles.push("narrator");
  }

  // `Array.from` em vez de espalhar o iterador: o alvo do tsconfig é anterior
  // ao ES2015 e não permite `[...map.values()]`.
  for (const pessoa of Array.from(registro.values())) {
    // Escrever e narrar o mesmo livro não deve contá-lo duas vezes.
    const distintos = new Map<number, Book>();
    for (const livro of [...pessoa.wrote, ...pessoa.narrated]) {
      distintos.set(livro.id, livro);
    }
    const livros = Array.from(distintos.values());

    const frequenciaPorGenero = new Map<Genre, number>();
    for (const livro of livros) {
      frequenciaPorGenero.set(livro.genre, (frequenciaPorGenero.get(livro.genre) ?? 0) + 1);
    }

    pessoa.wrote = ordenarPorNota(pessoa.wrote);
    pessoa.narrated = ordenarPorNota(pessoa.narrated);
    pessoa.titles = livros.length;
    pessoa.rating = livros.reduce((soma, livro) => soma + livro.rating, 0) / livros.length;
    pessoa.genres = Array.from(frequenciaPorGenero.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([genero]) => genero);
  }

  return registro;
}

const registro = construirRegistro();

export const people: Person[] = Array.from(registro.values()).sort((a, b) =>
  a.name.localeCompare(b.name, "pt-BR")
);

export function findPerson(slug: string): Person | undefined {
  return registro.get(slug);
}

export function getBooksByAuthor(name: string): Book[] {
  return ordenarPorNota(catalog.filter((livro) => livro.author === name));
}

export function getBooksByNarrator(name: string): Book[] {
  return ordenarPorNota(catalog.filter((livro) => livro.narrator === name));
}

/** Rótulo em português para os papéis, na ordem em que devem ser exibidos. */
export function roleLabels(person: Person): string[] {
  const rotulos: string[] = [];
  if (person.roles.includes("author")) rotulos.push("Autor");
  if (person.roles.includes("narrator")) rotulos.push("Narrador");
  return rotulos;
}
