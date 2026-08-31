/**
 * O Mural — o feed da Comunidade (28/07, decisão do Matheus).
 *
 * **A virada que isto é:** em 21/07 ficou registrado "não é um feed tipo
 * Instagram/Facebook". O Matheus revisitou em 28/07: *"o seguir não mostra o
 * que a pessoa está fazendo… uma atualização constante"* — a decisão antiga
 * foi tomada quando a Comunidade era um diretório morto, e o que ela tinha de
 * essencial fica de pé aqui: **nada de social no Início**, e nada de post
 * solto.
 *
 * **A trava que separa o Mural de um Twitter: todo post nasce amarrado a um
 * livro.** Quem escreve, escreve *sobre o que está ouvindo* — o app anexa o
 * livro em reprodução (dá para trocar). Não existe caixa de texto sem capa ao
 * lado. É o que mantém a moderação do tamanho do app e faz de cada post uma
 * porta para um audiolivro, que é o destino de tudo aqui.
 *
 * **Tipos fechados, todos nascidos da audição** — o feed junta o que o
 * esqueleto já produzia (recomendou, comentou, avaliou, está ouvindo) com o
 * tipo novo, o "disse". Os seus acontecimentos entram da mesma forma
 * (conclusões e avaliações têm data real; recomendações passaram a ganhar
 * data ao serem criadas).
 *
 * Sem seguir ninguém o mural mostra a comunidade inteira — feed vazio no
 * primeiro dia era exatamente o defeito da Comunidade antiga. Seguindo
 * alguém, ele passa a ser só de quem você segue (mais você).
 */

import { catalog, type Book, livroPorId} from "@/lib/books";
import { clubePorId } from "@/lib/clubes";
import { comments, ehAvaliacao } from "@/lib/comments";
import { community, type CommunityMember } from "@/lib/community";
import { estadoNaSala, posicaoNoLivro, type EstadoNaSala } from "@/lib/sala";

const STORAGE_KEY = "allbook_mural_posts";

/** Aviso de que o mural mudou — a tela relê sem recarregar. */
export const MURAL_EVENT = "allbook:mural";

/** Curto de propósito: mural é conversa de corredor, não resenha. */
export const MAX_POST = 280;

/**
 * Um post seu, guardado no navegador. A âncora é **um livro OU um clube** —
 * o Matheus abriu o leque em 28/07: *"a pessoa pode estar pedindo uma
 * recomendação… poderia mencionar um livro ou um clube"*. O que não existe é
 * post sem âncora nenhuma: essa é a trava que fica.
 */
export interface MeuPost {
  id: string;
  /** Um livro do catálogo… */
  bookId?: number;
  /** …ou um clube. Sempre exatamente um dos dois. */
  clubeId?: string;
  texto: string;
  /** ISO completo. */
  date: string;
}

/** Quem fez algo no mural: um leitor do esqueleto, ou você. */
export interface AutorDoMural {
  nome: string;
  /** Slug de `community.ts`; ausente = é você. */
  slug?: string;
  /** Classe de gradiente do avatar (membro) — você usa a sua foto. */
  cor?: string;
  souEu: boolean;
}

/** Um acontecimento no mural. O `tipo` fecha o vocabulário do feed. */
export type ItemDoMural = {
  id: string;
  date: string;
  autor: AutorDoMural;
  book: Book;
} & (
  | {
      tipo: "disse";
      texto: string;
      meuPostId?: string;
      /** Post ancorado num clube: o `book` é o livro da vez do clube. */
      clube?: { id: string; nome: string };
    }
  | { tipo: "recomendou"; note: string }
  | { tipo: "comentou"; texto: string; estado: EstadoNaSala }
  | { tipo: "avaliou"; nota: number; texto?: string }
  | { tipo: "ouvindo"; chapter: number }
  | { tipo: "terminou" }
);

/* ------------------------------------------------------------------ *
 * Os seus posts
 * ------------------------------------------------------------------ */

export function readMeusPosts(): MeuPost[] {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(stored)) return [];
    return stored.filter(
      (item): item is MeuPost =>
        item &&
        typeof item.id === "string" &&
        typeof item.texto === "string" &&
        typeof item.date === "string" &&
        // A âncora: um livro ou um clube — post solto não passa nem por aqui.
        (Number.isFinite(Number(item.bookId)) || typeof item.clubeId === "string"),
    );
  } catch {
    return [];
  }
}

function gravar(lista: MeuPost[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  window.dispatchEvent(new Event(MURAL_EVENT));
}

/** A âncora de um post: um livro do catálogo ou um clube seu. */
export type AlvoDoPost = { bookId: number } | { clubeId: string };

/** Publica. Devolve a lista nova; texto vazio ou âncora inexistente não entram. */
export function publicarNoMural(texto: string, alvo: AlvoDoPost): MeuPost[] {
  const clean = texto.trim().slice(0, MAX_POST);
  const existe =
    "bookId" in alvo
      ? catalog.some((book) => book.id === alvo.bookId)
      : clubePorId(alvo.clubeId) !== undefined;
  if (!clean || !existe) return readMeusPosts();

  const post: MeuPost = {
    id: `post-${Date.now()}`,
    ...alvo,
    texto: clean,
    date: new Date().toISOString(),
  };
  const lista = [...readMeusPosts(), post];
  gravar(lista);
  return lista;
}

export function apagarPost(id: string): MeuPost[] {
  const lista = readMeusPosts().filter((item) => item.id !== id);
  gravar(lista);
  return lista;
}

/* ------------------------------------------------------------------ *
 * O feed
 * ------------------------------------------------------------------ */

function autorDoMembro(member: CommunityMember): AutorDoMural {
  return { nome: member.name, slug: member.slug, cor: member.color, souEu: false };
}
function livro(bookId: number): Book | undefined {
  return livroPorId(bookId);
}

/**
 * Tudo que UM leitor do esqueleto fez, na língua do mural: recomendou, está
 * ouvindo, avaliou, comentou (com a trava viajando junto). É a peça que o
 * feed geral e o perfil da pessoa compartilham — o mesmo acontecimento tem a
 * mesma cara em qualquer tela (a régua da 4.20).
 */
function itensDoMembro(member: CommunityMember): ItemDoMural[] {
  const itens: ItemDoMural[] = [];

  for (const rec of member.recommendations) {
    const book = livro(rec.bookId);
    if (!book) continue;
    itens.push({
      id: `rec-${member.slug}-${rec.bookId}`,
      date: rec.date,
      autor: autorDoMembro(member),
      book,
      tipo: "recomendou",
      note: rec.note ?? "",
    });
  }

  if (member.ouvindoAgora) {
    const book = livro(member.ouvindoAgora.bookId);
    if (book) {
      itens.push({
        // "Agora" é presente, não passado: data de hoje para ficar no topo.
        id: `agora-${member.slug}`,
        date: new Date().toISOString(),
        autor: autorDoMembro(member),
        book,
        tipo: "ouvindo",
        chapter: member.ouvindoAgora.chapter,
      });
    }
  }

  for (const comment of comments) {
    if (comment.authorSlug !== member.slug) continue;
    if (comment.bookId === undefined || comment.parentId) continue;
    const book = livro(comment.bookId);
    if (!book) continue;

    if (ehAvaliacao(comment) && comment.rating !== undefined) {
      itens.push({
        id: `aval-${comment.id}`,
        date: comment.date,
        autor: autorDoMembro(member),
        book,
        tipo: "avaliou",
        nota: comment.rating,
        texto: comment.text,
      });
    } else {
      itens.push({
        id: `com-${comment.id}`,
        date: comment.date,
        autor: autorDoMembro(member),
        book,
        // A trava viaja junto: o texto de um trecho à frente (ou marcado como
        // spoiler) não vaza no feed — aparece fechado, com o motivo.
        estado: estadoNaSala(comment, posicaoNoLivro(comment.bookId)),
        tipo: "comentou",
        texto: comment.text,
      });
    }
  }

  return itens;
}

/**
 * O mural de UMA pessoa — o que o perfil dela mostra (28/07, pedido do
 * Matheus: o perfil dos membros tinha ficado sem as novidades do mural).
 * `tipos` filtra: o perfil usa só avaliou/comentou, porque as recomendações
 * já têm vitrine própria lá e o "ouvindo" tem bloco próprio.
 */
export function muralDe(
  slug: string,
  tipos?: ItemDoMural["tipo"][],
  limite = 20,
): ItemDoMural[] {
  const member = community.find((item) => item.slug === slug);
  if (!member) return [];
  return itensDoMembro(member)
    .filter((item) => !tipos || tipos.includes(item.tipo))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limite);
}
