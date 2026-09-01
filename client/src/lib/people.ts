import { catalog, notaHistoria, notaNarracao, slugify, type Book, type Genre, porNota, mediaDeNotas, autoresDe, narradoresDe } from "./books";

// Reexportado por conveniência: quem lida com pessoas costuma precisar do slug,
// mas a função em si mora em `books.ts` para não criar ciclo entre os módulos.
export { slugify };

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
  /** Média das notas gerais desses títulos. */
  /** A média das notas dos livros da pessoa — falta enquanto nenhum tiver nota. */
  rating?: number;
  /**
   * A nota de cada chapéu, **separada de propósito** (ROTEIRO 4.15).
   *
   * `ratingAutor` é a média das notas de **história** do que a pessoa escreveu;
   * `ratingNarrador`, a média das notas de **narração** do que ela narrou. Antes
   * as duas eram a mesma coisa — a média geral dos livros —, e isso era injusto
   * nos dois sentidos: livro fraco com narração excelente derrubava o narrador,
   * e um texto ótimo mal narrado inflava a nota dele.
   *
   * Só existe o chapéu que a pessoa tem: quem nunca narrou não tem
   * `ratingNarrador`.
   */
  ratingAutor?: number;
  ratingNarrador?: number;
}

function ordenarPorNota(livros: Book[]): Book[] {
  return [...livros].sort(porNota);
}

/** Média de uma lista de notas — `undefined` se a lista está vazia. */
function media(notas: number[]): number | undefined {
  if (notas.length === 0) return undefined;
  return notas.reduce((soma, nota) => soma + nota, 0) / notas.length;
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
        rating: undefined,
      };
      registro.set(slug, pessoa);
    }
    return pessoa;
  }

  /* 🚨 **TODOS os autores e TODOS os narradores** (01/09, §4.154), e não só o
     primeiro. Antes, *Aventuras do Príncipe* — narrado por Paola Molinari,
     Clayton Heringer e Juscelino Filho — só aparecia no perfil da Paola, e os
     outros dois nem existiam como pessoa. */
  for (const livro of catalog) {
    for (const nome of autoresDe(livro)) {
      const autor = garantir(nome);
      autor.wrote.push(livro);
      if (!autor.roles.includes("author")) autor.roles.push("author");
    }
    for (const nome of narradoresDe(livro)) {
      const narrador = garantir(nome);
      narrador.narrated.push(livro);
      if (!narrador.roles.includes("narrator")) narrador.roles.push("narrator");
    }
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
    pessoa.rating = mediaDeNotas(livros);
    // Cada chapéu puxa da sua dimensão: quem escreve responde pela história,
    // quem narra responde pela narração.
    pessoa.ratingAutor = media(
      pessoa.wrote.map(notaHistoria).filter((n): n is number => n !== undefined),
    );
    pessoa.ratingNarrador = media(
      pessoa.narrated.map(notaNarracao).filter((n): n is number => n !== undefined),
    );
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
  return ordenarPorNota(catalog.filter((livro) => autoresDe(livro).includes(name)));
}

export function getBooksByNarrator(name: string): Book[] {
  return ordenarPorNota(catalog.filter((livro) => narradoresDe(livro).includes(name)));
}

/** Rótulo em português para os papéis, na ordem em que devem ser exibidos. */
export function roleLabels(person: Person): string[] {
  const rotulos: string[] = [];
  if (person.roles.includes("author")) rotulos.push("Autor");
  if (person.roles.includes("narrator")) rotulos.push("Narrador");
  return rotulos;
}
