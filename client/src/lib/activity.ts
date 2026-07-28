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
import { comments, ehAvaliacao, type Comment } from "@/lib/comments";
import { community, findMember, type CommunityMember } from "@/lib/community";
import { readFollowing } from "@/lib/following";
import { readLibrary } from "@/lib/library";
import { readPlaybackList } from "@/lib/playback";
import { posicaoNoLivro, separarSala } from "@/lib/sala";

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
    // Resposta a outro comentário não é atividade própria: fora do fio ela
    // aparece sem contexto — e ainda tomava o lugar do comentário de primeiro
    // nível da mesma pessoa no mesmo livro.
    if (comment.parentId) continue;
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
      .map((id) => catalog.find((book) => book.id === id)?.genre)
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
      const livro = catalog.find((book) => book.id === mesmoLivro.bookId);
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
    const book = catalog.find((entry) => entry.id === member.ouvindoAgora?.bookId);
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
    .map((item) => catalog.find((book) => book.id === item.bookId))
    .filter((book): book is Book => book !== undefined);
}

/* ------------------------------------------------------------------ *
 * A vitrine "Onde a conversa está" (critério refeito em 28/07)
 * ------------------------------------------------------------------ */

/** Um livro na vitrine de conversas, com a prévia do que VOCÊ pode ler. */
export interface SalaNaVitrine {
  bookId: number;
  /** Mensagens de conversa (avaliação não conta — ela mora noutra seção). */
  total: number;
  liberadas: number;
  previa: Comment[];
  /** Você está no meio deste livro — é por isso que ele subiu. */
  estouOuvindo: boolean;
}

/** Papo dos últimos 14 dias: é o que separa "está" de "já esteve". */
const JANELA_DE_AGORA_DIAS = 14;

/**
 * Os livros da vitrine de conversas da Comunidade — **em ordem de interesse
 * seu**, não de volume histórico.
 *
 * O Matheus perguntou (28/07) qual era o critério, e a resposta expôs o
 * defeito do antigo (`livrosComConversa`, em `sala.ts`): "os 6 livros com
 * mais mensagens desde sempre". Não olhava você, não olhava o calendário — e
 * ainda contava as resenhas, que desde a separação nem moram mais na
 * conversa. O bloco se chama "onde a conversa **está**", e o critério
 * respondia onde ela **já esteve**.
 *
 * A ordem, ditada pelo Matheus ("os que a gente está ouvindo, os da
 * biblioteca, depois os últimos temas que você ouviu — um algoritmo mais ou
 * menos nessa ordem"), do degrau mais forte para o mais fraco:
 * 1. **Livros que você está ouvindo** — o papo do SEU livro interessa antes
 *    de qualquer outro (e a trava garante que você só vê o que já pode ler);
 * 2. **Livros da sua biblioteca** — interesse declarado, ainda sem audição;
 * 3. **Livros dos gêneros que você ouviu por último** — o tema te acompanha
 *    mesmo quando o título é outro;
 * 4. **Papo novo** — mensagens dos últimos 14 dias;
 * 5. **Volume total**, como desempate.
 *
 * A prévia continua com a regra da sala (que é da janela A, reusada por
 * import): só o que você já pode ler, nunca spoiler, no máximo 2.
 */
export function vitrineDeConversas(limite = 6): SalaNaVitrine[] {
  const progresso = readPlaybackList();
  const ouvindo = new Set(progresso.map((item) => item.bookId));
  const naLista = new Set(readLibrary().map((item) => item.id));

  // "Os últimos temas que você ouviu": os gêneros dos 5 livros mais recentes
  // do seu progresso — a lista já vem do mais novo para o mais velho.
  const generosRecentes = new Set(
    progresso
      .slice(0, 5)
      .map((item) => catalog.find((book) => book.id === item.bookId)?.genre)
      .filter((genre): genre is Book["genre"] => genre !== undefined),
  );

  const corte = new Date();
  corte.setDate(corte.getDate() - JANELA_DE_AGORA_DIAS);
  const dataCorte = corte.toISOString().slice(0, 10);

  const porLivro = new Map<number, Comment[]>();
  for (const item of comments) {
    // Só conversa de primeiro nível: resenha tem seção própria na ficha.
    if (item.bookId === undefined || item.parentId || ehAvaliacao(item)) continue;
    const lista = porLivro.get(item.bookId) ?? [];
    lista.push(item);
    porLivro.set(item.bookId, lista);
  }

  return Array.from(porLivro.entries())
    .map(([bookId, lista]) => {
      const { visiveis } = separarSala(lista, posicaoNoLivro(bookId));
      const recentes = lista.filter((item) => item.date >= dataCorte).length;
      const genero = catalog.find((book) => book.id === bookId)?.genre;
      return {
        bookId,
        total: lista.length,
        liberadas: visiveis.length,
        previa: visiveis.filter((item) => !item.spoiler).slice(0, 2),
        estouOuvindo: ouvindo.has(bookId),
        recentes,
        // Livro da sua lista fica entre "estou dentro" e "estranhos": você
        // declarou interesse, mas ainda não entrou.
        naMinhaLista: naLista.has(bookId),
        doMeuTema: genero !== undefined && generosRecentes.has(genero),
      };
    })
    .sort(
      (a, b) =>
        Number(b.estouOuvindo) - Number(a.estouOuvindo) ||
        Number(b.naMinhaLista) - Number(a.naMinhaLista) ||
        Number(b.doMeuTema) - Number(a.doMeuTema) ||
        b.recentes - a.recentes ||
        b.total - a.total,
    )
    .slice(0, limite)
    .map(({ bookId, total, liberadas, previa, estouOuvindo }) => ({
      bookId,
      total,
      liberadas,
      previa,
      estouOuvindo,
    }));
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
