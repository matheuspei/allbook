import { catalog, slugify, type Book, type Genre } from "./books";

/**
 * Editoras do catálogo — quem publicou cada livro.
 *
 * **Por que mora aqui e não em `books.ts`.** Cada livro poderia ganhar um campo
 * `publisher`, mas a editora é a mesma para dezenas de títulos: repetir o nome
 * 59 vezes convida a erro de digitação ("Companhia das Letras" e "Cia das
 * Letras" viram duas editoras) e obrigaria a mexer no catálogo inteiro. Aqui a
 * relação é declarada uma vez por editora, como lista de ids, e o mapa
 * livro → editora é derivado. Quando houver banco, isto vira uma tabela
 * `publishers` com chave estrangeira em `books` — o formato já é esse.
 *
 * **O que NÃO tem aqui, de propósito: ano de fundação, sede, número de
 * funcionários.** São empresas reais; escrever "fundada em 1986 em São Paulo"
 * sem fonte é inventar dado sobre gente de verdade, e ninguém depois saberia
 * que era chute. A ficha da editora mostra só o que o próprio catálogo do
 * AllBook sabe — títulos, nota média, autores, narradores, gêneros — como
 * `people.ts` já faz com autores e narradores.
 *
 * **A atribuição livro → editora é aproximada.** Boa parte confere com a edição
 * brasileira real (Dan Brown no Arqueiro, Tolkien na HarperCollins, King na
 * Suma), mas parte foi agrupada por afinidade de catálogo para não deixar
 * editora com um título só — perfil de uma linha não mostra nada. Quando o
 * `npm run catalogo` passar a trazer o campo `publishers` da Open Library, é
 * daqui que a lista sai.
 */

interface EditoraCurada {
  slug: string;
  name: string;
  /**
   * Uma linha sobre o **recorte da editora dentro do AllBook** — não sobre a
   * empresa. É o que o catálogo mostra, então é o que dá para afirmar.
   */
  linha: string;
  bookIds: number[];
}

const editorasCuradas: EditoraCurada[] = [
  {
    slug: "aleph",
    name: "Aleph",
    linha: "A casa da ficção científica que fundou o gênero — Herbert, Asimov e as grandes distopias.",
    bookIds: [7, 8, 303, 131],
  },
  {
    slug: "suma",
    name: "Suma",
    linha: "Terror e fantasia de fôlego longo: o catálogo de Stephen King e as sagas que ocupam semanas.",
    bookIds: [104, 105, 305, 306, 145, 109, 132],
  },
  {
    slug: "harpercollins-brasil",
    name: "HarperCollins Brasil",
    linha: "A Terra-média inteira em português, ao lado de não-ficção sobre dinheiro e comportamento.",
    bookIds: [129, 301, 302, 101],
  },
  {
    slug: "companhia-das-letras",
    name: "Companhia das Letras",
    linha: "O maior acervo do AllBook: clássicos que não envelhecem e as biografias de referência.",
    bookIds: [130, 304, 144, 140, 307, 308, 112, 315, 316, 135, 103],
  },
  {
    slug: "intrinseca",
    name: "Intrínseca",
    linha: "Suspense doméstico e romance contemporâneo — os livros que se ouve de uma sentada só.",
    bookIds: [3, 313, 2, 1, 106, 141, 201, 318],
  },
  {
    slug: "arqueiro",
    name: "Arqueiro",
    linha: "Best-seller de aeroporto no melhor sentido: Dan Brown, Nicholas Sparks e thriller de virada.",
    bookIds: [119, 311, 312, 143, 310, 142, 309, 120, 314],
  },
  {
    slug: "sextante",
    name: "Sextante",
    linha: "Produtividade e hábito, do método clássico ao que virou conversa de escritório.",
    bookIds: [102, 107, 321, 4, 124, 5, 108, 113],
  },
  {
    slug: "objetiva",
    name: "Objetiva",
    linha: "Memória e testemunho: quem viveu contando na primeira pessoa.",
    bookIds: [111, 317, 136, 137],
  },
  {
    slug: "rocco",
    name: "Rocco",
    linha: "A editora brasileira de Paulo Coelho — fábula e travessia interior.",
    bookIds: [203, 319],
  },
  {
    slug: "alta-books",
    name: "Alta Books",
    linha: "Educação financeira direta ao ponto, com a série que ensinou o país a falar de ativo e passivo.",
    bookIds: [125, 320],
  },
];

export interface Publisher {
  slug: string;
  name: string;
  linha: string;
  /** Livros da editora, do mais bem avaliado para o menos. */
  books: Book[];
  /** Autores publicados, em ordem alfabética. */
  authors: string[];
  /** Narradores que gravaram para ela, em ordem alfabética. */
  narrators: string[];
  /** Gêneros que ela cobre, do mais frequente para o menos. */
  genres: Genre[];
  titles: number;
  /** Média das notas dos títulos. Zero quando a editora não tem livro no ar. */
  rating: number;
}

function construir(): Publisher[] {
  return editorasCuradas.map((editora) => {
    // `filter` no catálogo em vez de `find` por id, um a um: id que não existe
    // mais (livro retirado) some sozinho em vez de virar buraco na lista.
    const livros = catalog
      .filter((livro) => editora.bookIds.includes(livro.id))
      .sort((a, b) => b.rating - a.rating);

    const frequenciaPorGenero = new Map<Genre, number>();
    for (const livro of livros) {
      frequenciaPorGenero.set(livro.genre, (frequenciaPorGenero.get(livro.genre) ?? 0) + 1);
    }

    const nomesEmOrdem = (nomes: string[]) =>
      Array.from(new Set(nomes)).sort((a, b) => a.localeCompare(b, "pt-BR"));

    return {
      slug: editora.slug,
      name: editora.name,
      linha: editora.linha,
      books: livros,
      authors: nomesEmOrdem(livros.map((livro) => livro.author)),
      narrators: nomesEmOrdem(livros.map((livro) => livro.narrator)),
      genres: Array.from(frequenciaPorGenero.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([genero]) => genero),
      titles: livros.length,
      rating: livros.length
        ? livros.reduce((soma, livro) => soma + livro.rating, 0) / livros.length
        : 0,
    };
  });
}

/** Todas as editoras, da maior lista de títulos para a menor. */
export const publishers: Publisher[] = construir().sort((a, b) => b.titles - a.titles);

const porSlug = new Map(publishers.map((editora) => [editora.slug, editora]));

/**
 * Livro → editora, derivado da lista de cada editora. É um mapa, e não uma
 * varredura a cada chamada, porque a tela do livro pergunta isso a cada abertura.
 */
const editoraPorLivro = new Map<number, Publisher>();
for (const editora of publishers) {
  for (const livro of editora.books) {
    editoraPorLivro.set(livro.id, editora);
  }
}

export function findPublisher(slug: string): Publisher | undefined {
  return porSlug.get(slug);
}

/** Quem publicou este livro. `undefined` se ainda não foi atribuído a ninguém. */
export function publisherOfBook(bookId: number): Publisher | undefined {
  return editoraPorLivro.get(bookId);
}

/**
 * Outras editoras, para o fim do perfil.
 *
 * Existe para o perfil de uma editora pequena (duas ou três obras) não terminar
 * numa parede: em vez de a tela acabar, ela oferece o próximo lugar para ir.
 */
export function otherPublishers(slug: string, quantidade = 6): Publisher[] {
  return publishers.filter((editora) => editora.slug !== slug).slice(0, quantidade);
}

/**
 * O slug de uma pessoa (autor/narrador), para linkar o perfil dela a partir do
 * perfil da editora. Fica aqui para a tela não precisar importar `people.ts` só
 * para chamar `slugify`.
 */
export function personSlugOf(nome: string): string {
  return slugify(nome);
}
