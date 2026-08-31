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

import { type Book, livroPorId } from "@/lib/books";
import { comments, type Comment } from "@/lib/comments";
import { community, findMember, type CommunityMember } from "@/lib/community";
import { readFollowing } from "@/lib/following";
import { readPlaybackList } from "@/lib/playback";

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
      const book = livroPorId(item.bookId);
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
    // Resposta a outro comentário não é atividade própria: fora do fio ela
    // aparece sem contexto — e ainda tomava o lugar do comentário de primeiro
    // nível da mesma pessoa no mesmo livro.
    if (comment.parentId) continue;
    if (!following.includes(comment.authorSlug)) continue;
    const member = findMember(comment.authorSlug);
    const book = comment.bookId ? livroPorId(comment.bookId) : undefined;
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
      // Se a pessoa comentou mais de uma vez no mesmo livro, mostra o mais
      // recente — antes ficava o último do array, que podia ser o mais antigo.
      comment:
        existente?.comment && existente.comment.date > comment.date
          ? existente.comment
          : comment,
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
      .map((id) => livroPorId(id)?.genre)
      .filter((genre) => genre !== undefined),
  );

  // O que VOCÊ já abriu no player — é o que permite os dois motivos mais
  // fortes: estar no mesmo livro agora, e recomendar o que você já ouviu.
  const meusLivros = readPlaybackList();
  const idsQueOuvi = new Set(meusLivros.map((item) => item.bookId));

  const scored = candidates.map((member) => {
    const books = recommendedBooks(member);
    const shared = books.filter((book) => libraryIds.includes(book.id));
    const jaOuvi = books.filter((book) => idsQueOuvi.has(book.id));
    const sameGenre = books.filter((book) => myGenres.has(book.genre));

    // A coincidência mais forte que existe: vocês dois estão DENTRO do mesmo
    // livro, agora. Não há motivo melhor para conhecer alguém.
    const mesmoLivro = member.ouvindoAgora
      ? meusLivros.find((item) => item.bookId === member.ouvindoAgora?.bookId)
      : undefined;
    if (mesmoLivro && member.ouvindoAgora) {
      const livro = livroPorId(mesmoLivro.bookId);
      const delta = member.ouvindoAgora.chapter - mesmoLivro.chapter;
      const posicao =
        delta > 0
          ? `${delta} ${delta === 1 ? "capítulo" : "capítulos"} à sua frente`
          : delta < 0
            ? `${-delta} ${delta === -1 ? "capítulo" : "capítulos"} atrás de você`
            : "no mesmo capítulo que você";
      return {
        member,
        books: livro ? [livro] : books.slice(0, 3),
        reason: `Está ouvindo ${livro ? `“${livro.title}”` : "o mesmo livro"} — ${posicao}`,
        weight: 200,
      };
    }

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

    // Recomendar o que você JÁ ouviu é afinidade comprovada — mais forte que
    // gênero, mais fraca que a sua lista (que é desejo seu, declarado).
    if (jaOuvi.length > 0) {
      return {
        member,
        books: jaOuvi.slice(0, 3),
        reason:
          jaOuvi.length === 1
            ? `Recomenda “${jaOuvi[0].title}”, que você já ouviu`
            : `Recomenda ${jaOuvi.length} livros que você já ouviu`,
        weight: 80 + jaOuvi.length,
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
      reason: books.length === 1 ? "1 recomendação" : `${books.length} recomendações`,
      weight: books.length,
    };
  });

  return scored
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
    .map(({ member, reason, books }) => ({ member, reason, books }));
}

/* ------------------------------------------------------------------ *
 * Os blocos da Comunidade refeita (ROTEIRO 4.41)
 * ------------------------------------------------------------------ */

/** Alguém no meio de um livro, agora — com o livro já resolvido. */
export interface AudicaoDeAgora {
  member: CommunityMember;
  book: Book;
  chapter: number;
}

/**
 * Quem está ouvindo o quê neste momento. É o bloco que abre a Comunidade: a
 * única coisa que só um app de audiolivro pode mostrar, e que existe antes de
 * você seguir qualquer pessoa.
 */
export function ouvindoAgoraNaComunidade(): AudicaoDeAgora[] {
  return community.flatMap((member) => {
    if (!member.ouvindoAgora) return [];
    const book = livroPorId(member.ouvindoAgora?.bookId);
    return book ? [{ member, book, chapter: member.ouvindoAgora.chapter }] : [];
  });
}

/*
 * Havia aqui um `recomendacoesRecentes` para o bloco "Recomendado pela sua
 * roda" — criado e absorvido no MESMO dia (28/07): o Mural (`lib/mural.ts`)
 * mostra as recomendações como um tipo do feed, e o mesmo conteúdo em dois
 * blocos era redundância. O bloco saiu da Comunidade junto.
 */

function recommendedBooks(member: CommunityMember): Book[] {
  return member.recommendations
    .map((item) => livroPorId(item.bookId))
    .filter((book): book is Book => book !== undefined);
}

/* ------------------------------------------------------------------ *
 * A vitrine "Onde a conversa está" (critério refeito em 28/07)
 * ------------------------------------------------------------------ */
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
