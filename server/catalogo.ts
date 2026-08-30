/**
 * O catálogo sai do banco (21/08).
 *
 * Até aqui os livros do app moravam no **código** — `client/src/lib/books.ts`,
 * um array literal com 63 maquetes que 62 arquivos liam. Isso travava três
 * coisas ao mesmo tempo: livro novo não podia nascer de um pedido, o player não
 * tinha como ler capítulo medido, e o acervo de verdade (13.932 narrações já
 * baixadas pelo `baixalivro`) não tinha por onde entrar.
 *
 * Esta rota é a ponte. Ela devolve o catálogo inteiro numa resposta só, no
 * **mesmo formato que o `books.ts` já entregava às telas** — por isso nenhuma
 * tela precisou mudar.
 *
 * ⚠️ **Uma resposta só é decisão consciente, e tem prazo de validade.** Hoje o
 * catálogo cabe folgado (dezenas de livros, poucos KB). O acervo real tem quase
 * 14 mil narrações, e nesse tamanho isto vira alguns MB em toda abertura do
 * app. Quando o catálogo passar de uns poucos milhares, esta rota precisa
 * ganhar paginação — e aí as telas que hoje varrem `catalog` inteiro no
 * navegador (a busca e a grade de gênero) passam a pedir ao servidor. Está
 * escrito aqui para ninguém descobrir isso na marra.
 */

import type { Express } from "express";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "./db";
import { avaliacoes, generos, livros, pessoas } from "@shared/schema";

/**
 * Onde moram as capas dos livros de verdade.
 *
 * As 58 capas de hoje vieram do `npm run catalogo` e estão **dentro** do
 * repositório, empacotadas pelo Vite. Isso funciona para dezenas e não funciona
 * para milhares: capa de acervo é ativo grande e não entra no git, pela mesma
 * razão que o áudio-mestre não entra (`AUDIO_RAIZ`).
 *
 * Por isso a pasta é configurável e nasce **fora** do projeto. Quem quiser
 * mudar mexe no `.env`; o app não precisa saber onde é.
 */
export const CAPAS_RAIZ =
  process.env.CAPAS_RAIZ ?? `${process.env.HOME}/AllBook-capas`;

/** O que a rota devolve por livro — o mesmo desenho da interface `Book`. */
export interface LivroDoCatalogo {
  id: number;
  title: string;
  /**
   * O subtítulo, quando a loja o entrega separado (30/08, §4.138).
   *
   * Não engorda a resposta: até 30/08 ele vinha **dentro** do `title`, colado
   * com `": "` pelo importador. O que muda é que agora cada tela escolhe se o
   * mostra — e o billboard da Início, que não o mostra, parou de ter o título
   * cobrindo a capa (§4.137).
   */
  subtitle?: string;
  author: string;
  narrator: string;
  /** Endereço da capa servida por `/capas/…`, ou `null` para a tipográfica. */
  cover: string | null;
  /** Falta quando o livro ainda não tem avaliação — e é o caso de todo livro
   *  que vem do acervo: nenhuma loja entrega nota. */
  rating?: number;
  genre: string;
  story?: number;
  performance?: number;
  originalTitle?: string;
  year?: number;
  pages?: number;
  isbn?: string;
  duracaoSegundos?: number;
  /** A loja de origem; vazio quando o livro é do AllBook Studio. */
  origem?: string;
}

/**
 * A ficha completa de um livro — hoje, o que a lista **não** carrega.
 *
 * 🚨 A separação nasceu de uma medida (22/08, §4.134.2): com 13.917 livros, a
 * resposta de `/api/catalogo` deu **14 MB**, e **85% disso era sinopse**
 * (10,9 MB). Como o app baixa o catálogo inteiro em toda abertura e a sinopse
 * só é lida em duas telas — a ficha do livro e a descrição do destaque —,
 * mandá-la para os 13.917 era pagar caro por texto que quase nunca se lê.
 */
export interface FichaDoLivro {
  id: number;
  sinopse?: string;
  synopsis?: string;
}

export interface RespostaDoCatalogo {
  generos: { label: string; slug: string; gradient: string }[];
  livros: LivroDoCatalogo[];
}

/**
 * Autor e narrador saem da MESMA tabela (`pessoas`), então o join precisa dela
 * duas vezes, com apelidos diferentes. Sem os apelidos o Drizzle junta os dois
 * na mesma linha e o narrador vira o autor, calado.
 */
const autor = alias(pessoas, "autor");
const narrador = alias(pessoas, "narrador");

/**
 * Quantas avaliações um livro precisa para mostrar média.
 *
 * O mesmo 5 de `MINIMO_PARA_MEDIA` em `client/src/lib/ratings.ts`, e pela mesma
 * razão: com uma ou duas notas, a "média" é a opinião de uma pessoa vestida de
 * consenso. Está escrito duas vezes porque servidor e navegador não partilham
 * módulo — se um dia mudar, muda nos dois.
 */
const MINIMO_PARA_MEDIA = 5;

/**
 * A nota de um livro é a **média das avaliações das pessoas** — nunca um campo
 * dele (21/08, §4.134).
 *
 * 🚨 Isto é o conserto de um erro de modelagem que veio das maquetes: `livros`
 * tinha três colunas de nota, escritas à mão, e um livro podia assim ter nota
 * que ninguém deu. Nota de avaliação quem dá é o usuário. As colunas foram
 * embora; o que existe é esta consulta.
 */
const notasPorLivro = db
  .select({
    livroId: avaliacoes.livroId,
    quantas: sql<number>`count(*)::int`.as("quantas"),
    historia: sql<number>`avg(${avaliacoes.historia})`.as("historia"),
    narracao: sql<number>`avg(${avaliacoes.narracao})`.as("narracao"),
    // A nota geral é a média das duas dimensões que a pessoa deu — e quem
    // avaliou só uma delas entra com a que deu, sem virar meia nota.
    geral: sql<number>`avg((coalesce(${avaliacoes.historia}, ${avaliacoes.narracao}) + coalesce(${avaliacoes.narracao}, ${avaliacoes.historia}))::real / 2)`.as(
      "geral",
    ),
  })
  .from(avaliacoes)
  .groupBy(avaliacoes.livroId)
  .as("notas");

/** Uma casa decimal, que é como a tela mostra. `null` continua `undefined`. */
function arredondar(valor: number | null): number | undefined {
  if (valor === null || valor === undefined) return undefined;
  return Math.round(Number(valor) * 10) / 10;
}

export async function lerCatalogo(): Promise<RespostaDoCatalogo> {
  const [linhasDeGenero, linhasDeLivro] = await Promise.all([
    db.select().from(generos).orderBy(asc(generos.ordem)),
    db
      .select({
        id: livros.id,
        titulo: livros.titulo,
        subtitulo: livros.subtitulo,
        autor: autor.nome,
        narrador: narrador.nome,
        capa: livros.capa,
        genero: generos.rotulo,
        quantasNotas: notasPorLivro.quantas,
        nota: notasPorLivro.geral,
        notaHistoria: notasPorLivro.historia,
        notaNarracao: notasPorLivro.narracao,
        tituloOriginal: livros.tituloOriginal,
        ano: livros.ano,
        paginas: livros.paginas,
        isbn: livros.isbn,
        duracaoSegundos: livros.duracaoSegundos,
        origem: livros.origemLoja,
      })
      .from(livros)
      .innerJoin(autor, eq(livros.autorSlug, autor.slug))
      .innerJoin(narrador, eq(livros.narradorSlug, narrador.slug))
      .innerJoin(generos, eq(livros.generoSlug, generos.slug))
      .leftJoin(notasPorLivro, eq(notasPorLivro.livroId, livros.id))
      .orderBy(asc(livros.id)),
  ]);

  return {
    generos: linhasDeGenero.map((g) => ({
      label: g.rotulo,
      slug: g.slug,
      gradient: g.gradiente,
    })),
    // Os `?? undefined` não são enfeite: `JSON.stringify` **omite** `undefined` e
    // **mantém** `null`. Campo que falta some da resposta em vez de chegar como
    // `null` no cliente, onde viraria "ano: null" impresso numa ficha.
    livros: linhasDeLivro.map(
      (l): LivroDoCatalogo => ({
        id: l.id,
        title: l.titulo,
        subtitle: l.subtitulo ?? undefined,
        author: l.autor,
        narrator: l.narrador,
        // A capa vem como NOME de arquivo no banco (`7.jpg`); quem monta o
        // endereço é aqui, para o cliente não precisar saber onde ela mora.
        cover: l.capa ? `/capas/${l.capa}` : null,
        // Abaixo do mínimo, nenhuma das três notas sai: mostrar só a de
        // história com 2 votos e esconder a geral seria pior que esconder tudo.
        ...(Number(l.quantasNotas ?? 0) >= MINIMO_PARA_MEDIA
          ? {
              rating: arredondar(l.nota),
              story: arredondar(l.notaHistoria),
              performance: arredondar(l.notaNarracao),
            }
          : {}),
        genre: l.genero,
        originalTitle: l.tituloOriginal ?? undefined,
        year: l.ano ?? undefined,
        pages: l.paginas ?? undefined,
        isbn: l.isbn ?? undefined,
        duracaoSegundos: l.duracaoSegundos ?? undefined,
        origem: l.origem ?? undefined,
      }),
    ),
  };
}

/**
 * As sinopses de um punhado de livros, por id.
 *
 * Aceita vários de uma vez porque o billboard da Início mostra 5 destaques e
 * pedi-los um a um seriam 5 idas ao servidor na abertura de toda sessão.
 */
export async function lerFichas(ids: number[]): Promise<FichaDoLivro[]> {
  if (ids.length === 0) return [];
  const linhas = await db
    .select({
      id: livros.id,
      sinopse: livros.sinopse,
      sinopseImportada: livros.sinopseImportada,
    })
    .from(livros)
    .where(inArray(livros.id, ids));

  return linhas.map((l) => ({
    id: l.id,
    sinopse: l.sinopse ?? undefined,
    synopsis: l.sinopseImportada ?? undefined,
  }));
}

export function registrarCatalogo(app: Express) {
  /**
   * O catálogo inteiro. **Sem sessão de propósito** — a vitrine é pública, como
   * em qualquer loja de audiolivro; o que exige conta é ouvir (ver
   * `server/audio.ts`), não olhar.
   */
  app.get("/api/catalogo", async (_req, res) => {
    try {
      return res.json(await lerCatalogo());
    } catch (erro) {
      return res.status(503).json({
        erro: erro instanceof Error ? erro.message : String(erro),
      });
    }
  });

  /**
   * As sinopses, sob demanda: `/api/catalogo/fichas?ids=100418,100002`.
   *
   * ⚠️ Vem **antes** de qualquer rota mais curta de `/api/catalogo/...` que
   * venha a existir, pela mesma regra do `Switch` do wouter: a curta captura a
   * longa.
   */
  app.get("/api/catalogo/fichas", async (req, res) => {
    const ids = String(req.query.ids ?? "")
      .split(",")
      .map((n) => Number(n.trim()))
      .filter((n) => Number.isInteger(n) && n > 0)
      // Um teto, para um endereço à mão não pedir o catálogo inteiro por aqui.
      .slice(0, 50);

    try {
      return res.json(await lerFichas(ids));
    } catch (erro) {
      return res.status(503).json({
        erro: erro instanceof Error ? erro.message : String(erro),
      });
    }
  });
}
