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
import { asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "./db";
import { generos, livros, pessoas } from "@shared/schema";

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
  author: string;
  narrator: string;
  /** Endereço da capa servida por `/capas/…`, ou `null` para a tipográfica. */
  cover: string | null;
  rating: number;
  genre: string;
  story?: number;
  performance?: number;
  originalTitle?: string;
  year?: number;
  pages?: number;
  isbn?: string;
  synopsis?: string;
  sinopse?: string;
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

export async function lerCatalogo(): Promise<RespostaDoCatalogo> {
  const [linhasDeGenero, linhasDeLivro] = await Promise.all([
    db.select().from(generos).orderBy(asc(generos.ordem)),
    db
      .select({
        id: livros.id,
        titulo: livros.titulo,
        autor: autor.nome,
        narrador: narrador.nome,
        capa: livros.capa,
        nota: livros.nota,
        genero: generos.rotulo,
        notaHistoria: livros.notaHistoria,
        notaNarracao: livros.notaNarracao,
        tituloOriginal: livros.tituloOriginal,
        ano: livros.ano,
        paginas: livros.paginas,
        isbn: livros.isbn,
        sinopseImportada: livros.sinopseImportada,
        sinopse: livros.sinopse,
      })
      .from(livros)
      .innerJoin(autor, eq(livros.autorSlug, autor.slug))
      .innerJoin(narrador, eq(livros.narradorSlug, narrador.slug))
      .innerJoin(generos, eq(livros.generoSlug, generos.slug))
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
        author: l.autor,
        narrator: l.narrador,
        // A capa vem como NOME de arquivo no banco (`7.jpg`); quem monta o
        // endereço é aqui, para o cliente não precisar saber onde ela mora.
        cover: l.capa ? `/capas/${l.capa}` : null,
        rating: l.nota,
        genre: l.genero,
        story: l.notaHistoria ?? undefined,
        performance: l.notaNarracao ?? undefined,
        originalTitle: l.tituloOriginal ?? undefined,
        year: l.ano ?? undefined,
        pages: l.paginas ?? undefined,
        isbn: l.isbn ?? undefined,
        synopsis: l.sinopseImportada ?? undefined,
        sinopse: l.sinopse ?? undefined,
      }),
    ),
  };
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
}
