/**
 * O que as pessoas que você segue andaram fazendo.
 *
 * **Isto não é um feed de rede social**, e a limitação é proposital: existem
 * exatamente **dois** tipos de acontecimento — alguém recomendou um livro e
 * alguém comentou num livro. Os dois terminam numa capa clicável, porque o
 * destino do AllBook é sempre o audiolivro; a comunidade é o caminho, não o
 * lugar onde se fica. Nada disso aparece na tela Início.
 *
 * Ordem cronológica simples, do mais novo para o mais velho. Sem "relevância",
 * sem repique, sem rolagem infinita — se um dia isso fizer falta, é porque a
 * comunidade cresceu, e aí a conversa é outra.
 */

import { catalog, type Book } from "@/lib/books";
import { comments, type Comment } from "@/lib/comments";
import { community, findMember, type CommunityMember } from "@/lib/community";
import { readFollowing } from "@/lib/following";

/**
 * Um acontecimento é **uma pessoa e um livro**, não uma ação solta.
 *
 * Isso apareceu testando: quem recomenda um livro em geral também comenta nele,
 * e a tela mostrava duas linhas seguidas com a mesma capa — na cabeça de quem
 * lê, é um acontecimento só. Aqui os dois vêm juntos: `recommended` diz se ela
 * pôs na lista, `comment` traz o que ela escreveu, e pelo menos um dos dois
 * existe.
 */
export interface ActivityEvent {
  id: string;
  /** A mais recente entre a recomendação e o comentário. */
  date: string;
  member: CommunityMember;
  book: Book;
  recommended: boolean;
  comment?: Comment;
}

/**
 * A atividade de quem você segue. Sem seguir ninguém, devolve lista vazia — e a
 * tela mostra sugestões no lugar, em vez de um vazio sem saída.
 */
export function activityFeed(limit = 40): ActivityEvent[] {
  const following = readFollowing();
  if (following.length === 0) return [];

  // Chave "quem+qual livro": é o que junta a recomendação e o comentário.
  const porPessoaELivro = new Map<string, ActivityEvent>();

  for (const slug of following) {
    const member = findMember(slug);
    if (!member) continue; // seguia alguém que sumiu do esqueleto

    for (const item of member.recommendations) {
      const book = catalog.find((entry) => entry.id === item.bookId);
      if (!book) continue;
      const key = `${slug}-${item.bookId}`;
      porPessoaELivro.set(key, {
        id: key,
        date: item.date,
        member,
        book,
        recommended: true,
      });
    }
  }

  for (const comment of comments) {
    if (!following.includes(comment.authorSlug)) continue;
    const member = findMember(comment.authorSlug);
    const book = catalog.find((entry) => entry.id === comment.bookId);
    if (!member || !book) continue;

    const key = `${comment.authorSlug}-${comment.bookId}`;
    const existente = porPessoaELivro.get(key);

    porPessoaELivro.set(key, {
      id: key,
      // A data mais recente das duas manda: é a última vez que a pessoa mexeu
      // nesse livro, e é por ela que a linha deve se ordenar.
      date: existente && existente.date > comment.date ? existente.date : comment.date,
      member,
      book,
      recommended: existente?.recommended ?? false,
      comment,
    });
  }

  return Array.from(porPessoaELivro.values())
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

/**
 * A quem seguir, **com um motivo visível**.
 *
 * O defeito da primeira Comunidade era ser um índice alfabético: não havia razão
 * para clicar num nome e não noutro. Aqui cada sugestão vem com o porquê — a
 * pessoa recomenda livros que estão na sua lista, ou do gênero que você guarda.
 * Sem nada na lista, o critério cai para quem mais recomenda, que ao menos é um
 * critério.
 */
export interface Suggestion {
  member: CommunityMember;
  reason: string;
  /** As capas que justificam a sugestão. */
  books: Book[];
}

export function suggestions(libraryIds: number[], limit = 4): Suggestion[] {
  const following = readFollowing();
  const candidates = community.filter((member) => !following.includes(member.slug));

  const myGenres = new Set(
    libraryIds
      .map((id) => catalog.find((book) => book.id === id)?.genre)
      .filter((genre) => genre !== undefined),
  );

  const scored = candidates.map((member) => {
    const books = recommendedBooks(member);
    const shared = books.filter((book) => libraryIds.includes(book.id));
    const sameGenre = books.filter((book) => myGenres.has(book.genre));

    if (shared.length > 0) {
      return {
        member,
        books: shared.slice(0, 3),
        reason:
          shared.length === 1
            ? "Recomenda um livro que está na sua lista"
            : `Recomenda ${shared.length} livros que estão na sua lista`,
        weight: 100 + shared.length,
      };
    }

    if (sameGenre.length > 0) {
      const genre = sameGenre[0].genre;
      return {
        member,
        books: sameGenre.slice(0, 3),
        reason: `Ouve ${genre}, como você`,
        weight: 50 + sameGenre.length,
      };
    }

    return {
      member,
      books: books.slice(0, 3),
      reason: `${books.length} recomendações`,
      weight: books.length,
    };
  });

  return scored
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
    .map(({ member, reason, books }) => ({ member, reason, books }));
}

function recommendedBooks(member: CommunityMember): Book[] {
  return member.recommendations
    .map((item) => catalog.find((book) => book.id === item.bookId))
    .filter((book): book is Book => book !== undefined);
}

/** "2026-07-20" → "há 1 dia". Data crua num acontecimento social não diz nada. */
export function relativeDate(iso: string, now = new Date()): string {
  const then = new Date(`${iso}T12:00:00`);
  const days = Math.round((now.getTime() - then.getTime()) / 86_400_000);

  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  if (days < 14) return "há 1 semana";
  if (days < 31) return `há ${Math.floor(days / 7)} semanas`;
  if (days < 60) return "há 1 mês";
  return `há ${Math.floor(days / 30)} meses`;
}
