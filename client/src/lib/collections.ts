import { getBooksByIds, type Book } from "./books";

/**
 * As coleções coloridas da tela Início — "Só na AllBook", "Best-sellers
 * Internacionais", "Favoritos" etc. Não são gêneros (isso é `genres` em
 * `books.ts`, que a Descobrir usa); são **listas curadas à mão** que atravessam
 * vários gêneros, no espírito das trilhas do Netflix e do Spotify.
 *
 * Cada card da Início aponta para a tela `/collection/:slug`, que mostra os
 * livros desta lista. Para mudar o que aparece num card, edite os `bookIds`
 * abaixo — são os `id` dos livros no catálogo (`books.ts`). Id que não existe é
 * ignorado sozinho, então dá para mexer sem medo de quebrar a tela.
 *
 * A curadoria de agora é um ponto de partida razoável; ajuste à vontade.
 */
export interface Collection {
  /** Pedaço da URL: `/collection/<slug>`. */
  slug: string;
  /** O texto do card, igualzinho na Início e no topo da tela da coleção. */
  label: string;
  /** Mesmo gradiente do card, para a pessoa reconhecer de onde veio. */
  gradient: string;
  /** Uma linha explicando a coleção, mostrada no topo da tela. */
  description: string;
  /** Os livros da coleção, na ordem em que devem aparecer. */
  bookIds: number[];
}

export const collections: Collection[] = [
  {
    slug: "so-na-allbook",
    label: "Só na AllBook",
    gradient: "from-orange-600 to-red-700",
    description: "Produções e destaques exclusivos do AllBook.",
    bookIds: [7, 101, 102, 129, 104, 111, 2, 4],
  },
  {
    slug: "best-sellers-internacionais",
    label: "Best-sellers Internacionais",
    gradient: "from-blue-600 to-teal-500",
    description: "Os campeões de venda que o mundo todo está ouvindo.",
    bookIds: [102, 101, 3, 119, 201, 130, 140, 203, 112, 2],
  },
  {
    slug: "mais-ouvidos",
    label: "Mais Ouvidos",
    gradient: "from-pink-600 to-rose-500",
    description: "Os títulos que mais tocaram no AllBook.",
    bookIds: [7, 105, 129, 132, 102, 136, 104, 130, 113, 137],
  },
  {
    slug: "favoritos",
    label: "Favoritos",
    gradient: "from-teal-500 to-cyan-400",
    description: "Os queridinhos dos leitores, de todos os gêneros.",
    bookIds: [203, 129, 140, 130, 136, 137, 7, 111],
  },
  {
    slug: "o-brasil-curtiu",
    label: "O Brasil Curtiu",
    gradient: "from-red-700 to-rose-600",
    description: "O que está bombando entre os leitores brasileiros.",
    bookIds: [201, 203, 102, 101, 4, 125, 142, 309],
  },
  {
    slug: "lancamentos",
    label: "Lançamentos",
    gradient: "from-purple-700 to-violet-500",
    description: "Chegaram agora ao catálogo.",
    bookIds: [301, 305, 307, 311, 313, 315, 317, 318, 320, 321],
  },
  {
    slug: "para-maratonar",
    label: "Para Maratonar",
    gradient: "from-teal-600 to-emerald-500",
    description: "Sagas e séries para ouvir sem parar.",
    bookIds: [129, 301, 302, 8, 132, 104, 119, 311, 312, 7],
  },
  {
    slug: "autoajuda-e-negocios",
    label: "Autoajuda & Negócios",
    gradient: "from-amber-600 to-orange-500",
    description: "Ideias para crescer na vida e no trabalho.",
    bookIds: [101, 108, 125, 4, 201, 203, 102, 107, 124, 321],
  },
];

/**
 * As fileiras horizontais da tela Início ("Minha lista", "Sugestões que você
 * vai adorar"…). Têm a mesma forma de uma coleção — um título e uma lista de
 * livros —, então o botão "Ver tudo" de cada fileira abre a mesma tela
 * `/collection/:slug`, só que mostrando a fileira inteira numa grade, no estilo
 * "ver tudo" da Netflix. O `label` aqui repete o título da fileira; o gradiente
 * é só a cor da faixa no topo dessa tela.
 */
export const homeRows: Collection[] = [
  {
    slug: "minha-lista",
    label: "Minha lista",
    gradient: "from-orange-600 to-amber-500",
    description: "O que você separou para ouvir.",
    bookIds: [101, 102, 1, 103, 8],
  },
  {
    slug: "proximas-historias",
    label: "Descubra suas próximas histórias",
    gradient: "from-indigo-600 to-blue-500",
    description: "Sugestões para a sua próxima aventura.",
    bookIds: [2, 3, 104, 105, 106, 119, 120],
  },
  {
    slug: "sugestoes",
    label: "🔥 Sugestões que você vai adorar",
    gradient: "from-rose-600 to-orange-500",
    description: "Escolhidos a dedo para o seu gosto.",
    bookIds: [7, 109, 129, 130, 131, 132],
  },
  {
    slug: "desenvolvimento-e-negocios",
    label: "Desenvolvimento e Negócios",
    gradient: "from-amber-600 to-orange-500",
    description: "Para crescer na carreira e nas ideias.",
    bookIds: [4, 107, 5, 108, 124, 125],
  },
  {
    slug: "biografias",
    label: "Biografias e Histórias Reais",
    gradient: "from-teal-600 to-emerald-500",
    description: "Vidas e trajetórias que valem a escuta.",
    bookIds: [111, 112, 113, 135, 136, 137],
  },
];

export function findCollectionBySlug(slug: string): Collection | undefined {
  return collections.find((colecao) => colecao.slug === slug);
}

/**
 * Acha uma lista de livros por slug, seja um card colorido (`collections`) ou
 * uma fileira da Início (`homeRows`) — as duas abrem a mesma tela `/collection`.
 */
export function findListBySlug(slug: string): Collection | undefined {
  return [...collections, ...homeRows].find((lista) => lista.slug === slug);
}

/** Os livros de uma coleção, na ordem curada e sem ids fantasmas. */
export function getBooksForCollection(colecao: Collection): Book[] {
  return getBooksByIds(colecao.bookIds);
}
