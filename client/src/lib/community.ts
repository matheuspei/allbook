/**
 * Leitores da comunidade — fictícios, de propósito.
 *
 * Não existe servidor nem cadastro, então não há outros usuários de verdade.
 * Estas pessoas são o **esqueleto**: perfis com bio, recomendações e comentários
 * próprios, para dar o que ver enquanto a comunidade de gente real não existe.
 * Quando houver backend, isto vira uma chamada à API e os perfis passam a ser de
 * pessoas mesmo — o resto das telas não muda.
 *
 * As recomendações usam ids que existem no catálogo — nada de capa quebrada.
 */

import { catalog, type Book } from "@/lib/books";

/**
 * Um livro que a pessoa pôs na lista pública dela, com a data em que pôs.
 *
 * A data não é enfeite: é ela que permite dizer "Ana Paula recomendou Duna"
 * na ordem certa, na tela de Comunidade. Sem data, recomendação é um conjunto
 * sem antes e depois, e não dá para montar acontecimento nenhum.
 */
export interface Recommendation {
  bookId: number;
  /** ISO. */
  date: string;
}

export interface CommunityMember {
  slug: string;
  name: string;
  bio: string;
  /** Cor do avatar, já que ninguém tem foto de verdade. */
  color: string;
  /** Quando entrou, em texto — só para dar densidade ao perfil. */
  memberSince: string;
  hoursListened: number;
  recommendations: Recommendation[];
}

export const community: CommunityMember[] = [
  {
    slug: "ana-paula",
    name: "Ana Paula",
    bio: "Suspense é meu vício. Se tiver reviravolta no fim, eu já quero.",
    color: "from-rose-500 to-pink-600",
    memberSince: "janeiro de 2025",
    hoursListened: 212,
    recommendations: [
      { bookId: 2, date: "2026-07-20" },
      { bookId: 1, date: "2026-07-14" },
      { bookId: 120, date: "2026-06-30" },
      { bookId: 3, date: "2026-06-11" },
      { bookId: 106, date: "2026-05-27" },
    ],
  },
  {
    slug: "marcos-v",
    name: "Marcos V.",
    bio: "Ouço no trânsito, entre uma reunião e outra. Negócios e biografia.",
    color: "from-amber-500 to-orange-600",
    memberSince: "março de 2025",
    hoursListened: 148,
    recommendations: [
      { bookId: 112, date: "2026-07-18" },
      { bookId: 113, date: "2026-07-07" },
      { bookId: 101, date: "2026-06-16" },
      { bookId: 108, date: "2026-05-30" },
    ],
  },
  {
    slug: "juliana-s",
    name: "Juliana S.",
    bio: "Livro bom é o que me faz perder a hora do almoço. Clássicos, sobretudo.",
    color: "from-violet-500 to-purple-600",
    memberSince: "novembro de 2024",
    hoursListened: 389,
    recommendations: [
      { bookId: 140, date: "2026-07-15" },
      { bookId: 136, date: "2026-07-01" },
      { bookId: 130, date: "2026-06-18" },
      { bookId: 131, date: "2026-06-02" },
      { bookId: 137, date: "2026-05-19" },
    ],
  },
  {
    slug: "ricardo",
    name: "Ricardo",
    bio: "Fui do time que não tinha tempo de ler. Hoje ouço 2h por dia.",
    color: "from-emerald-500 to-teal-600",
    memberSince: "junho de 2025",
    hoursListened: 96,
    recommendations: [
      { bookId: 107, date: "2026-07-21" },
      { bookId: 102, date: "2026-07-04" },
      { bookId: 124, date: "2026-06-09" },
    ],
  },
  {
    slug: "carla-lima",
    name: "Carla Lima",
    bio: "Ficção científica e o que mais me tirar deste século.",
    color: "from-blue-500 to-indigo-600",
    memberSince: "fevereiro de 2025",
    hoursListened: 267,
    recommendations: [
      { bookId: 7, date: "2026-07-13" },
      { bookId: 109, date: "2026-06-26" },
      { bookId: 8, date: "2026-06-15" },
      { bookId: 129, date: "2026-05-24" },
      { bookId: 132, date: "2026-05-06" },
    ],
  },
  {
    slug: "beto",
    name: "Beto",
    bio: "Terror antes de dormir. Sim, eu sei o que estou fazendo.",
    color: "from-red-600 to-rose-700",
    memberSince: "agosto de 2025",
    hoursListened: 74,
    recommendations: [
      { bookId: 105, date: "2026-07-11" },
      { bookId: 104, date: "2026-06-29" },
      { bookId: 144, date: "2026-06-12" },
      { bookId: 145, date: "2026-05-21" },
    ],
  },
  {
    slug: "felipe-g",
    name: "Felipe G.",
    bio: "Comecei pelo dinheiro e fiquei pelas histórias. Investimento e psicologia.",
    color: "from-cyan-500 to-blue-600",
    memberSince: "abril de 2025",
    hoursListened: 131,
    recommendations: [
      { bookId: 101, date: "2026-07-17" },
      { bookId: 137, date: "2026-06-20" },
      { bookId: 125, date: "2026-05-14" },
    ],
  },
  {
    slug: "luciana",
    name: "Luciana",
    bio: "Reouço o que gostei. Livro bom aguenta a segunda vez.",
    color: "from-fuchsia-500 to-purple-600",
    memberSince: "dezembro de 2024",
    hoursListened: 305,
    recommendations: [
      { bookId: 203, date: "2026-07-10" },
      { bookId: 102, date: "2026-07-02" },
      { bookId: 4, date: "2026-06-23" },
      { bookId: 201, date: "2026-06-08" },
    ],
  },
];

/**
 * Acha o leitor pelo nome como ele aparece escrito, por exemplo num comentário
 * de livro ("Marcos V."). É por aqui que os comentários viram links de perfil.
 */
export function findMemberByName(name: string): CommunityMember | undefined {
  const wanted = normalizeName(name);
  return community.find((member) => normalizeName(member.name) === wanted);
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function findMember(slug: string): CommunityMember | undefined {
  return community.find((member) => member.slug === slug);
}

/**
 * Os livros recomendados por essa pessoa, do mais recente para o mais antigo e
 * sem ids órfãos.
 */
export function recommendationsOf(member: CommunityMember): Book[] {
  return [...member.recommendations]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((item) => catalog.find((book) => book.id === item.bookId))
    .filter((book): book is Book => book !== undefined);
}
