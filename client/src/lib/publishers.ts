import {
  catalog,
  genreSlug,
  publisherNames,
  slugify,
  type Book,
  type Genre,
  porNota,
  mediaDeNotas,
} from "./books";

/**
 * Editoras do catálogo — quem publicou cada livro.
 *
 * ## O que mudou em 31/08 (§4.148)
 *
 * 🚨 **Este arquivo era uma lista escrita à mão** — dez editoras, cada uma com
 * os ids dos livros dela (`bookIds: [7, 8, 303, 131]`). Fazia sentido quando o
 * catálogo eram 63 maquetes no código. Quando as maquetes foram apagadas
 * (21/08) e o acervo real entrou, a lista virou **dez editoras com zero livros
 * cada**, e `publisherOfBook()` passou a devolver `undefined` para os 13.917
 * livros — sem erro nenhum. O bloco "Publicado por" da ficha existia, a tela
 * `/publisher/:slug` existia, e nenhum dos dois nunca aparecia.
 *
 * Agora ele é **derivado**, como `people.ts` sempre foi: a editora de cada
 * livro vem no `Book.publisher` (o slug), o nome de tela vem de
 * `publisherNames`, e tudo o mais — livros, autores, narradores, gêneros,
 * nota — se calcula daqui. Nada é digitado: acrescentou-se um livro, a editora
 * dele ganha perfil sozinha, e não existe a possibilidade de a lista de
 * editoras discordar da lista de livros.
 *
 * ## O que continua valendo do arquivo antigo
 *
 * **Sem ano de fundação, sede ou número de funcionários.** São empresas reais;
 * escrever "fundada em 1986 em São Paulo" sem fonte é inventar dado sobre gente
 * de verdade, e daqui a um mês ninguém saberia que foi chute. O perfil mostra
 * só o que o próprio catálogo do AllBook sabe.
 *
 * ⚠️ **A `linha` (o texto de apresentação) hoje não existe para ninguém.** Ela
 * era escrita à mão para dez editoras; são 692, e escrever 692 frases sem autor
 * seria a mesma invenção. O campo ficou porque a coluna `editoras.linha` existe
 * no banco para o dia em que alguém escrever algumas — a tela se vira sem ela,
 * montando uma frase com os números que o catálogo tem.
 */

/**
 * Uma editora, como as telas a consomem.
 *
 * O desenho é o mesmo de antes, para `PublisherProfile.tsx` não precisar mudar
 * — só a origem dos dados é que virou o catálogo.
 */
export interface Publisher {
  slug: string;
  name: string;
  /** Texto de apresentação curado. Hoje não existe para nenhuma — ver acima. */
  linha?: string;
  /** Livros da editora, do mais bem avaliado para o menos. */
  books: Book[];
  /**
   * Autores publicados, **do mais publicado para o menos**.
   *
   * ⚠️ Deixou de ser ordem alfabética em 31/08. Com dez editoras de meia dúzia
   * de títulos, alfabético era tão bom quanto qualquer coisa; com uma editora
   * de 1.448 livros e centenas de autores, a fileira mostra os primeiros e o
   * resto fica fora da tela — e "os primeiros" tem de querer dizer alguma
   * coisa. Quem publica trinta títulos ali diz mais sobre a casa que quem
   * publica um e começa com A.
   */
  authors: string[];
  /** Narradores que gravaram para ela, do mais frequente para o menos. */
  narrators: string[];
  /**
   * Gêneros que ela cobre, do mais frequente para o menos.
   *
   * ⚠️ **"Sem gênero" fica de fora.** Ele existe como linha da tabela porque
   * `genero_slug` é obrigatório e nem toda ficha do acervo traz categoria — é
   * a ausência de gênero, não um gênero. Numa editora em que ele é o mais
   * frequente, a tela escrevia "sobretudo em Sem gênero", que não diz nada
   * sobre a casa, e ele ainda servia de critério para achar editoras
   * parecidas: duas casas sem nada em comum além de fichas incompletas.
   */
  genres: Genre[];
  titles: number;
  /** Média das notas dos livros — falta enquanto nenhum tiver nota. */
  rating?: number;
}

/* -------------------------------------------------------------------------- */
/* A construção, feita uma vez e refeita se o catálogo recarregar              */
/* -------------------------------------------------------------------------- */

let registro = new Map<string, Publisher>();
let ordenadas: Publisher[] = [];
let porLivro = new Map<number, Publisher>();

/**
 * Quantos livros havia no catálogo quando o registro foi montado.
 *
 * ⚠️ **É o que impede a armadilha do módulo avaliado cedo demais.** O `catalog`
 * nasce vazio e se enche em `carregarCatalogo()`; se este arquivo calculasse
 * tudo na primeira linha, guardaria 692 editoras vazias para sempre. Começando
 * em `-1`, a primeira leitura sempre constrói — e uma recarga do catálogo
 * (tamanho diferente) refaz.
 */
let tamanhoNaMontagem = -1;

/** Ordena por frequência, do mais comum para o menos, com desempate estável. */
function porFrequencia(contagem: Map<string, number>): string[] {
  return Array.from(contagem.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))
    .map(([nome]) => nome);
}

function montar(): void {
  const emConstrucao = new Map<
    string,
    {
      editora: Publisher;
      autores: Map<string, number>;
      narradores: Map<string, number>;
      generos: Map<Genre, number>;
    }
  >();

  for (const livro of catalog) {
    const slug = livro.publisher;
    if (!slug) continue;

    let entrada = emConstrucao.get(slug);
    if (!entrada) {
      entrada = {
        editora: {
          slug,
          // O nome vem da lista que o servidor manda à parte. Na falta dela —
          // catálogo de uma versão anterior —, o slug ainda dá um nome legível,
          // e é melhor que um perfil sem título.
          name: publisherNames.get(slug) ?? slug,
          books: [],
          authors: [],
          narrators: [],
          genres: [],
          titles: 0,
        },
        autores: new Map(),
        narradores: new Map(),
        generos: new Map(),
      };
      emConstrucao.set(slug, entrada);
    }

    entrada.editora.books.push(livro);
    entrada.autores.set(livro.author, (entrada.autores.get(livro.author) ?? 0) + 1);
    entrada.narradores.set(livro.narrator, (entrada.narradores.get(livro.narrator) ?? 0) + 1);
    entrada.generos.set(livro.genre, (entrada.generos.get(livro.genre) ?? 0) + 1);
  }

  registro = new Map();
  porLivro = new Map();

  for (const { editora, autores, narradores, generos } of Array.from(emConstrucao.values())) {
    editora.books.sort(porNota);
    editora.authors = porFrequencia(autores);
    editora.narrators = porFrequencia(narradores);
    editora.genres = porFrequencia(generos).filter((g) => genreSlug(g) !== "sem-genero");
    editora.titles = editora.books.length;
    editora.rating = mediaDeNotas(editora.books);

    registro.set(editora.slug, editora);
    for (const livro of editora.books) porLivro.set(livro.id, editora);
  }

  ordenadas = Array.from(registro.values()).sort(
    (a, b) => b.titles - a.titles || a.name.localeCompare(b.name, "pt-BR"),
  );
  tamanhoNaMontagem = catalog.length;
}

function garantir(): void {
  if (tamanhoNaMontagem !== catalog.length) montar();
}

/* -------------------------------------------------------------------------- */
/* O que as telas usam                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Todas as editoras, da que tem mais títulos para a que tem menos.
 *
 * ⚠️ **É função, e não mais a constante `publishers` de antes.** A lista agora
 * depende do catálogo, que chega do servidor; uma constante seria calculada na
 * avaliação do módulo e podia pegá-lo ainda vazio.
 */
export function allPublishers(): Publisher[] {
  garantir();
  return ordenadas;
}

export function findPublisher(slug: string): Publisher | undefined {
  garantir();
  return registro.get(slug);
}

/** Quem publicou este livro. `undefined` quando a ficha do acervo não trouxe. */
export function publisherOfBook(bookId: number): Publisher | undefined {
  garantir();
  return porLivro.get(bookId);
}

/**
 * Outras editoras, para o fim do perfil.
 *
 * Existe para o perfil de uma editora pequena (dois ou três títulos) não
 * terminar numa parede: em vez de a tela acabar, ela oferece o próximo lugar
 * para ir.
 *
 * ⚠️ **Prefere quem publica o mesmo gênero** (31/08). Antes eram simplesmente
 * as primeiras da lista global — com dez editoras isso dava variedade, com 692
 * daria sempre as mesmas seis maiores no rodapé de todo perfil, e quem chegou
 * numa editora de poesia seria mandado para um catálogo de autoajuda.
 */
export function otherPublishers(slug: string, quantidade = 6): Publisher[] {
  garantir();
  const atual = registro.get(slug);
  const generoPrincipal = atual?.genres[0];

  const outras = ordenadas.filter((editora) => editora.slug !== slug);
  if (!generoPrincipal) return outras.slice(0, quantidade);

  const parecidas = outras.filter((editora) => editora.genres.includes(generoPrincipal));
  // Completa com as maiores quando o gênero não rende o bastante — melhor uma
  // lista cheia de casas grandes do que meia lista.
  const resto = outras.filter((editora) => !editora.genres.includes(generoPrincipal));
  return [...parecidas, ...resto].slice(0, quantidade);
}

/**
 * O slug de uma pessoa (autor/narrador), para linkar o perfil dela a partir do
 * perfil da editora. Fica aqui para a tela não precisar importar `people.ts` só
 * para chamar `slugify`.
 */
export function personSlugOf(nome: string): string {
  return slugify(nome);
}
