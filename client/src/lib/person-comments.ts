/**
 * Comentários sobre uma **pessoa** — o autor ou o narrador, não o livro.
 *
 * ## Por que é um arquivo separado de `comments.ts`
 *
 * Motivo circunstancial: `comments.ts` estava sendo editado noutra janela
 * quando isto foi escrito, e escrever nele em paralelo já tinha quase custado
 * trabalho alheio uma vez. **Unificar os dois numa lista só, com um campo de
 * alvo (livro ou pessoa), é tarefa pendente** — está registrada no roteiro.
 *
 * Motivo de fundo, que sobrevive à unificação: comentar um livro e comentar
 * quem narra são coisas diferentes. Ver a decisão da estrela, logo abaixo.
 *
 * ## Não há estrela aqui, e isso é de propósito
 *
 * Comentário de livro tem nota de 1 a 5. Este **não tem**, por duas razões:
 *
 * 1. **Nota de pessoa é nota de gente.** Dar três estrelas a um livro é
 *    opinião sobre uma obra; dar três estrelas a *Rafael Nogueira* é um placar
 *    público sobre um profissional, que ele carrega para sempre e não pode
 *    responder. Um app de audiolivro vive de narrador querer narrar nele.
 * 2. **A nota útil da narração é por edição, não por pessoa.** O mesmo narrador
 *    pode ser perfeito num romance e errado num livro técnico. "Nota do
 *    narrador" mistura os dois e não ajuda ninguém a escolher o que ouvir —
 *    quem decide quer saber se *esta* narração é boa. Essa nota pertence ao
 *    par livro+narrador, e é a decisão em aberto da estrela, no roteiro.
 *
 * Sobra o que de fato ajuda: impressão em texto ("fala rápido demais",
 * "as vozes das personagens são ótimas"), ordenada pelo que os outros acharam
 * útil. As curtidas vêm de `reactions.ts`, o mesmo mecanismo dos comentários
 * de livro — o que não se duplicou aqui.
 */

import { findPerson, type Person } from "@/lib/people";
import { findMember, type CommunityMember } from "@/lib/community";

export interface PersonComment {
  id: string;
  /** `slug` de quem escreveu, em `community.ts`. */
  authorSlug: string;
  /** `slug` de quem está sendo comentado, em `people.ts`. */
  personSlug: string;
  /**
   * Sobre qual papel a pessoa está falando. O mesmo nome pode escrever e
   * narrar, e "escreve bem" não é elogio à narração — sem isto os dois
   * assuntos ficariam empilhados sem distinção.
   */
  about: "author" | "narrator";
  text: string;
  /** ISO. */
  date: string;
  likes: number;
  dislikes: number;
}

/**
 * Esqueleto de comentários, escrito à mão como o resto do protótipo.
 *
 * Os slugs de pessoa saem do nome pelo `slugify` — os nomes usados aqui são de
 * autores e narradores que existem em `books.ts`.
 */
export const personComments: PersonComment[] = [
  // — Rafael Nogueira, narrador de ficção científica —
  { id: "p1", authorSlug: "carla-lima", personSlug: "rafael-nogueira", about: "narrator", likes: 34, dislikes: 2, date: "2026-07-18", text: "Ele dá voz diferente para cada personagem sem cair na imitação. É raro e faz muita diferença em livro longo." },
  { id: "p2", authorSlug: "beto", personSlug: "rafael-nogueira", about: "narrator", likes: 9, dislikes: 6, date: "2026-07-04", text: "Bom, mas respira demais nas pausas. Só reparei porque ouço em 1,5x." },

  // — Frank Herbert, autor —
  { id: "p3", authorSlug: "carla-lima", personSlug: "frank-herbert", about: "author", likes: 41, dislikes: 3, date: "2026-07-13", text: "Constrói mundo melhor do que constrói personagem, e mesmo assim ninguém chegou perto." },
  { id: "p4", authorSlug: "felipe-g", personSlug: "frank-herbert", about: "author", likes: 12, dislikes: 8, date: "2026-06-25", text: "Os apêndices são metade da graça e some tudo no áudio. Não é culpa dele, mas pesa." },

  // — Lívia Bonfim, narradora de biografia —
  { id: "p5", authorSlug: "juliana-s", personSlug: "livia-bonfim", about: "narrator", likes: 27, dislikes: 0, date: "2026-07-16", text: "A voz dela combina com memória, com alguém contando a própria vida. Em ficção eu não sei se funcionaria igual." },

  // — Diogo Serrano, narrador de terror —
  { id: "p9", authorSlug: "beto", personSlug: "diogo-serrano", about: "narrator", likes: 38, dislikes: 5, date: "2026-07-12", text: "Sabe exatamente onde parar de falar. Metade do susto num livro de terror é o silêncio, e ele entende isso." },

  // — Stephen King, autor —
  { id: "p6", authorSlug: "beto", personSlug: "stephen-king", about: "author", likes: 52, dislikes: 11, date: "2026-07-10", text: "Escreve criança melhor do que qualquer um. Os finais são outra conversa." },
  { id: "p7", authorSlug: "ana-paula", personSlug: "stephen-king", about: "author", likes: 18, dislikes: 4, date: "2026-06-19", text: "Entrei pelos filmes e demorei a entender que o medo, nele, é quase sempre sobre a cidade e não sobre o monstro." },

  // — Morgan Housel, autor —
  { id: "p8", authorSlug: "marcos-v", personSlug: "morgan-housel", about: "author", likes: 22, dislikes: 1, date: "2026-07-07", text: "Escreve sobre dinheiro sem vender nada. Já é mais do que a estante inteira do lado." },
];

/** Engajamento: curtidas **mais** descurtidas — a mesma conta de `comments.ts`. */
export function personEngagementOf(comment: PersonComment): number {
  return comment.likes + comment.dislikes;
}

/**
 * Os comentários sobre uma pessoa, do mais engajado para o menos. Empate
 * desfaz pela data, para o mais recente vir antes.
 */
export function commentsForPerson(personSlug: string): PersonComment[] {
  return personComments
    .filter((item) => item.personSlug === personSlug)
    .sort(
      (a, b) =>
        personEngagementOf(b) - personEngagementOf(a) || b.date.localeCompare(a.date),
    );
}

/** Quem escreveu o comentário. `undefined` se o slug não existir mais. */
export function commentAuthorOf(comment: PersonComment): CommunityMember | undefined {
  return findMember(comment.authorSlug);
}

/** Sobre quem é o comentário. */
export function personOf(comment: PersonComment): Person | undefined {
  return findPerson(comment.personSlug);
}
