import { getBooksByIds, type Book } from "./books";

/**
 * As coleções coloridas da tela Início — "Só na AllBook", "Best-sellers
 * Internacionais", "Favoritos" etc. Não são gêneros (isso é `genres` em
 * `books.ts`, que a Descobrir usa); são **listas curadas à mão** que atravessam
 * vários gêneros, no espírito das trilhas do Netflix e do Spotify.
 *
 * Cada card da Início aponta para a tela `/collection/:slug`, que mostra os
 * livros desta lista. Para mudar o que aparece num card, edite os `bookIds`
 * abaixo — são os `id` dos livros no catálogo. Id que não existe é ignorado
 * sozinho, então dá para mexer sem medo de quebrar a tela.
 *
 * 🚨 **Toda a curadoria foi ESVAZIADA em 21/08, e não foi limpeza de arrumação
 * (§4.134).** Estas listas apontavam para os ids das 63 maquetes — 7, 101, 102…
 * Deixá-las escritas com o catálogo apagado montaria uma armadilha silenciosa:
 * quando o acervo de verdade entrar, um livro real que calhasse de receber o id
 * 7 apareceria em "Só na AllBook" **por acaso**, e ninguém teria como suspeitar
 * de onde aquilo veio. Lista vazia não desenha cartão nem fileira (as guardas
 * estão em `Home.tsx`), então o app simplesmente não mostra a coleção até
 * alguém curá-la de novo.
 *
 * ⚠️ **A estrutura fica de propósito** — slug, rótulo, gradiente e descrição.
 * O que se perdeu foi a escolha dos livros, que era sobre um catálogo que não
 * existe mais; o desenho das prateleiras continua valendo.
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
    bookIds: [],
  },
  {
    slug: "best-sellers-internacionais",
    label: "Best-sellers Internacionais",
    gradient: "from-blue-600 to-teal-500",
    description: "Os campeões de venda que o mundo todo está ouvindo.",
    bookIds: [],
  },
  {
    slug: "mais-ouvidos",
    label: "Mais Ouvidos",
    gradient: "from-pink-600 to-rose-500",
    description: "Os títulos que mais tocaram no AllBook.",
    bookIds: [],
  },
  {
    slug: "favoritos",
    label: "Favoritos",
    gradient: "from-teal-500 to-cyan-400",
    description: "Os queridinhos dos leitores, de todos os gêneros.",
    bookIds: [],
  },
  {
    slug: "o-brasil-curtiu",
    label: "O Brasil Curtiu",
    gradient: "from-red-700 to-rose-600",
    description: "O que está bombando entre os leitores brasileiros.",
    bookIds: [],
  },
  {
    slug: "lancamentos",
    label: "Lançamentos",
    gradient: "from-purple-700 to-violet-500",
    description: "Chegaram agora ao catálogo.",
    bookIds: [],
  },
  {
    slug: "para-maratonar",
    label: "Para Maratonar",
    gradient: "from-teal-600 to-emerald-500",
    description: "Sagas e séries para ouvir sem parar.",
    bookIds: [],
  },
  {
    slug: "autoajuda-e-negocios",
    label: "Autoajuda & Negócios",
    gradient: "from-amber-600 to-orange-500",
    description: "Ideias para crescer na vida e no trabalho.",
    bookIds: [],
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
    bookIds: [],
  },
  {
    slug: "proximas-historias",
    label: "Descubra suas próximas histórias",
    gradient: "from-indigo-600 to-blue-500",
    description: "Sugestões para a sua próxima aventura.",
    bookIds: [],
  },
  {
    slug: "sugestoes",
    // Sem o emoji de fogo desde §4.104: era o único título de seção com emoji
    // no app inteiro — os grandes marcam destaque com tipografia, não figurinha.
    label: "Sugestões que você vai adorar",
    gradient: "from-rose-600 to-orange-500",
    description: "Escolhidos a dedo para o seu gosto.",
    bookIds: [],
  },
  {
    slug: "desenvolvimento-e-negocios",
    label: "Desenvolvimento e Negócios",
    gradient: "from-amber-600 to-orange-500",
    description: "Para crescer na carreira e nas ideias.",
    bookIds: [],
  },
  {
    slug: "biografias",
    label: "Biografias e Histórias Reais",
    gradient: "from-teal-600 to-emerald-500",
    description: "Vidas e trajetórias que valem a escuta.",
    bookIds: [],
  },
];

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
