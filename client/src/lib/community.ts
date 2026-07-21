/**
 * Leitores da comunidade — fictícios, de propósito.
 *
 * Não existe servidor nem cadastro, então não há outros usuários de verdade.
 * Estas pessoas existem para dar o que ver: perfis com bio e recomendações
 * próprias, para o Matheus avaliar como a comunidade vai funcionar antes de
 * existir gente real. Quando houver backend, isto vira uma chamada à API e os
 * perfis passam a ser de pessoas mesmo.
 *
 * As recomendações usam ids que existem no catálogo — nada de capa quebrada.
 */

import { catalog, type Book } from "@/lib/books";

export interface CommunityMember {
  slug: string;
  name: string;
  bio: string;
  /** Cor do avatar, já que ninguém tem foto de verdade. */
  color: string;
  /** Quando entrou, em texto — só para dar densidade ao perfil. */
  memberSince: string;
  hoursListened: number;
  recommendationIds: number[];
}

export const community: CommunityMember[] = [
  {
    slug: "ana-paula",
    name: "Ana Paula",
    bio: "Suspense é meu vício. Se tiver reviravolta no fim, eu já quero.",
    color: "from-rose-500 to-pink-600",
    memberSince: "janeiro de 2025",
    hoursListened: 212,
    recommendationIds: [1, 2, 3, 106, 120],
  },
  {
    slug: "marcos-v",
    name: "Marcos V.",
    bio: "Ouço no trânsito, entre uma reunião e outra. Negócios e biografia.",
    color: "from-amber-500 to-orange-600",
    memberSince: "março de 2025",
    hoursListened: 148,
    recommendationIds: [101, 112, 113, 108],
  },
  {
    slug: "juliana-s",
    name: "Juliana S.",
    bio: "Livro bom é o que me faz perder a hora do almoço. Clássicos, sobretudo.",
    color: "from-violet-500 to-purple-600",
    memberSince: "novembro de 2024",
    hoursListened: 389,
    recommendationIds: [130, 140, 136, 131, 137],
  },
  {
    slug: "ricardo",
    name: "Ricardo",
    bio: "Fui do time que não tinha tempo de ler. Hoje ouço 2h por dia.",
    color: "from-emerald-500 to-teal-600",
    memberSince: "junho de 2025",
    hoursListened: 96,
    recommendationIds: [102, 107, 124],
  },
  {
    slug: "carla-lima",
    name: "Carla Lima",
    bio: "Ficção científica e o que mais me tirar deste século.",
    color: "from-blue-500 to-indigo-600",
    memberSince: "fevereiro de 2025",
    hoursListened: 267,
    recommendationIds: [7, 8, 109, 129, 132],
  },
  {
    slug: "beto",
    name: "Beto",
    bio: "Terror antes de dormir. Sim, eu sei o que estou fazendo.",
    color: "from-red-600 to-rose-700",
    memberSince: "agosto de 2025",
    hoursListened: 74,
    recommendationIds: [104, 105, 144, 145],
  },
];

export function findMember(slug: string): CommunityMember | undefined {
  return community.find((member) => member.slug === slug);
}

/** Os livros recomendados por essa pessoa, já resolvidos e sem ids órfãos. */
export function recommendationsOf(member: CommunityMember): Book[] {
  return member.recommendationIds
    .map((id) => catalog.find((book) => book.id === id))
    .filter((book): book is Book => book !== undefined);
}
