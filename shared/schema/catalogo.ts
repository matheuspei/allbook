import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

/**
 * O CATÁLOGO — livros, gêneros, pessoas, editoras, coleções e capítulos.
 *
 * É a primeira camada do banco de propósito (§4 do `docs/BANCO-DE-DADOS.md`):
 * não tem nenhum dado de usuário dentro, então errar aqui é barato — refaz-se a
 * ingestão e pronto. Nada de biblioteca, progresso ou comentário mora neste
 * arquivo.
 *
 * Hoje estes dados são **arquivos de código**: `lib/books.ts` (curado à mão),
 * `lib/catalog-enriched.ts` (gerado pelo `npm run catalogo`), `lib/people.ts` e
 * `lib/publishers.ts` (derivados), `lib/collections.ts` e `lib/studio.ts`. O
 * script `script/ingestao-catalogo.ts` copia tudo isso para cá.
 */

/* -------------------------------------------------------------------------- */
/* Gêneros                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Os 8 gêneros da tela Descobrir. Viram tabela — e não uma coluna de texto no
 * livro — porque cada um carrega o **gradiente** do card e a **ordem** em que
 * aparece na grade, que hoje moram no array `genres` de `books.ts`.
 */
export const generos = pgTable("generos", {
  /** `ficcao-cientifica` — o mesmo que `genreSlug()` gera hoje, e o que vai na URL. */
  slug: text("slug").primaryKey(),
  /** "Ficção Científica", com acento, que é o que a tela mostra. */
  rotulo: text("rotulo").notNull().unique(),
  /** `from-indigo-600 to-blue-500` — classes do Tailwind, iguais às de hoje. */
  gradiente: text("gradiente").notNull(),
  /** Posição na grade da Descobrir. */
  ordem: integer("ordem").notNull(),
});

/* -------------------------------------------------------------------------- */
/* Pessoas — autores, narradores e as vozes do Studio                          */
/* -------------------------------------------------------------------------- */

/**
 * Autores e narradores.
 *
 * **A chave primária é o slug, não um número.** Hoje o endereço do perfil é
 * `/person/stephen-king` e a foto é achada pelo arquivo `people/stephen-king.jpg`
 * — o slug já é a identidade da pessoa no app inteiro. Trocá-lo por um id
 * numérico quebraria links e fotos sem dar erro nenhum.
 *
 * **O papel (autor / narrador) NÃO é coluna, de propósito.** Ele se deduz da
 * relação com os livros — quem tem livro escrito é autor, quem tem livro narrado
 * é narrador. É o mesmo raciocínio do `lib/people.ts` de hoje, cujo comentário
 * diz o porquê: assim "não existe a possibilidade de a lista de pessoas
 * discordar da lista de livros".
 *
 * As notas (`rating`, `ratingAutor`, `ratingNarrador`) também não são colunas:
 * são médias dos livros, e média guardada envelhece calada na primeira
 * avaliação nova.
 */
export const pessoas = pgTable("pessoas", {
  /** `stephen-king`, `otavio-marques`. */
  slug: text("slug").primaryKey(),
  nome: text("nome").notNull(),
  /**
   * Nome do arquivo de foto (`stephen-king.jpg`), sem caminho. Vazio = o app
   * gera o avatar a partir do nome, como já faz.
   */
  foto: text("foto"),

  /**
   * Quem narra: `studio` (voz sintética da casa) ou `humana` (gravou de
   * verdade). **Vazio quer dizer que a pessoa não narra** — é só autora.
   *
   * Hoje isso é a função `narratorKind()` de `lib/studio.ts`, que compara o
   * slug com a lista de vozes. Vira coluna porque, quando entrar a primeira
   * narração humana de verdade, é este campo que faz o crédito do Studio sumir
   * da ficha daquele livro.
   */
  tipoDeVoz: text("tipo_de_voz").$type<"studio" | "humana">(),
  /** Como a voz soa e onde funciona melhor. Só as vozes do Studio têm. */
  timbre: text("timbre"),
});

/* -------------------------------------------------------------------------- */
/* Editoras                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Quem publicou o **livro** — não confundir com quem produziu o **áudio**, que
 * é o AllBook Studio (a separação é decisão de 25/07, ver `lib/studio.ts`).
 *
 * O `lib/publishers.ts` de hoje já anteviu esta tabela: "Quando houver banco,
 * isto vira uma tabela `publishers` com chave estrangeira em `books` — o formato
 * já é esse". É exatamente o que está aqui.
 *
 * **Sem ano de fundação, sede ou tamanho**, pela mesma razão de lá: são
 * empresas reais, e inventar dado sobre elas é mentira que ninguém detecta
 * depois.
 */
export const editoras = pgTable("editoras", {
  slug: text("slug").primaryKey(),
  nome: text("nome").notNull(),
  /** Uma linha sobre o recorte da editora **dentro do AllBook**. */
  linha: text("linha").notNull(),
});

/* -------------------------------------------------------------------------- */
/* Livros                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * O livro.
 *
 * ⚠️ **O `id` é escrito à mão e tem de ser preservado** (armadilha 2.1 do
 * `docs/BANCO-DE-DADOS.md`). Não é `serial`: o valor vem do `lib/books.ts`
 * (7 = Duna, 102 = Hábitos Atômicos…) e está gravado em dezenas de lugares no
 * navegador de quem já usa o app — biblioteca, progresso, avaliações,
 * comentários, downloads, pedidos — além dos arquivos de capa
 * (`covers/<id>.jpg`). Um id remapeado não dá erro: só faz cada pessoa abrir o
 * livro errado.
 */
export const livros = pgTable(
  "livros",
  {
    /** Vem de `books.ts`. **Nunca** gerar automaticamente (ver acima). */
    id: integer("id").primaryKey(),
    titulo: text("titulo").notNull(),

    autorSlug: text("autor_slug")
      .notNull()
      .references(() => pessoas.slug),
    narradorSlug: text("narrador_slug")
      .notNull()
      .references(() => pessoas.slug),
    /** Pode faltar: nem todo livro foi atribuído a uma editora. */
    editoraSlug: text("editora_slug").references(() => editoras.slug),
    generoSlug: text("genero_slug")
      .notNull()
      .references(() => generos.slug),

    /** A nota geral, de 0 a 5. */
    nota: real("nota").notNull(),
    /**
     * As duas notas separadas: `notaHistoria` é a obra (o texto) e
     * `notaNarracao` é a leitura desta edição.
     *
     * **Opcionais de propósito** — só quem tem ficha curada as tem. Preencher
     * as duas para todo livro seria inventar número, e daqui a um mês ninguém
     * saberia que foi chute (ROTEIRO §4.15). Quem lê cai na `nota` geral
     * quando faltam.
     */
    notaHistoria: real("nota_historia"),
    notaNarracao: real("nota_narracao"),

    // Daqui para baixo, o que o `npm run catalogo` traz da Open Library.
    /** Título no idioma original — é por ele que a busca de capas funciona. */
    tituloOriginal: text("titulo_original"),
    ano: integer("ano"),
    paginas: integer("paginas"),
    isbn: text("isbn"),
    /** A sinopse importada, em inglês. Fica de reserva. */
    sinopseImportada: text("sinopse_importada"),
    /** A sinopse curada em PT-BR (§4.104). **Vence** a importada na ficha. */
    sinopse: text("sinopse"),
    /** Nome do arquivo de capa (`7.jpg`). Vazio = capa tipográfica gerada. */
    capa: text("capa"),

    /* ---- Áudio (nada disso existe ainda; ver seção 2.5 do BANCO-DE-DADOS) --- */

    /**
     * Caminho do **MP3 mestre** — o arquivo que o estúdio entrega.
     *
     * ⚠️ Regra irreversível do projeto: o mestre é guardado e **nunca é
     * servido**. O que o app toca são os segmentos gerados na ingestão pelo
     * `ffmpeg`. Com o mestre em mãos, o corte pode ser refeito a qualquer
     * momento; perdê-lo é o único erro que não tem volta.
     */
    arquivoMestre: text("arquivo_mestre"),
    /**
     * Duração **medida** do áudio, em segundos. Enquanto for vazia, o app segue
     * estimando pelo número de páginas (≈1h a cada 33), como faz hoje.
     */
    duracaoSegundos: integer("duracao_segundos"),
    /**
     * Quantos segundos a vinheta de abertura do AllBook ocupa.
     *
     * ⚠️ Existe porque **a vinheta desloca o livro inteiro**: se a abertura tem
     * 8s, todo marcador de capítulo anda 8s e toda posição já salva em
     * `allbook_playback` passa a apontar 8 segundos fora do lugar. Guardar o
     * número é o que permite recalcular em vez de descobrir pelo ouvido.
     */
    vinhetaSegundos: integer("vinheta_segundos").default(0).notNull(),

    criadoEm: timestamp("criado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [
    index("livros_genero_idx").on(t.generoSlug),
    index("livros_autor_idx").on(t.autorSlug),
    index("livros_narrador_idx").on(t.narradorSlug),
    index("livros_editora_idx").on(t.editoraSlug),
  ],
);

/* -------------------------------------------------------------------------- */
/* Capítulos                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Os capítulos de um livro.
 *
 * ⚠️ Hoje a lista de capítulos é **gerada por conta**, não medida
 * (`lib/chapters.ts`) — não existe áudio. A tabela nasce vazia e só se enche na
 * ingestão do áudio de verdade, **depois** de a vinheta ter sido colada (senão
 * cada marcador nasce deslocado; ver `vinhetaSegundos` acima).
 */
export const capitulos = pgTable(
  "capitulos",
  {
    id: serial("id").primaryKey(),
    livroId: integer("livro_id")
      .notNull()
      .references(() => livros.id, { onDelete: "cascade" }),
    numero: integer("numero").notNull(),
    titulo: text("titulo").notNull(),
    /** Onde o capítulo começa dentro do áudio completo, em segundos. */
    inicioSegundos: integer("inicio_segundos").notNull(),
    duracaoSegundos: integer("duracao_segundos").notNull(),
  },
  (t) => [unique("capitulos_livro_numero").on(t.livroId, t.numero)],
);

/* -------------------------------------------------------------------------- */
/* Coleções — as fileiras e os cards da tela Início                            */
/* -------------------------------------------------------------------------- */

/**
 * As listas curadas que atravessam gêneros ("Só na AllBook", "Para Maratonar").
 * `tipo` separa as duas famílias que hoje são dois arrays em
 * `lib/collections.ts`: `card` são os cards coloridos, `fileira` são as fileiras
 * horizontais da Início. As duas abrem a mesma tela `/collection/:slug`.
 */
export const colecoes = pgTable("colecoes", {
  slug: text("slug").primaryKey(),
  rotulo: text("rotulo").notNull(),
  gradiente: text("gradiente").notNull(),
  descricao: text("descricao").notNull(),
  tipo: text("tipo").$type<"card" | "fileira">().notNull(),
  ordem: integer("ordem").notNull(),
});

/**
 * Que livros estão em cada coleção, **na ordem curada** — por isso a coluna
 * `ordem`: a lista de hoje é um array, e array tem ordem que uma tabela não tem
 * de graça.
 */
export const colecoesLivros = pgTable(
  "colecoes_livros",
  {
    colecaoSlug: text("colecao_slug")
      .notNull()
      .references(() => colecoes.slug, { onDelete: "cascade" }),
    livroId: integer("livro_id")
      .notNull()
      .references(() => livros.id, { onDelete: "cascade" }),
    ordem: integer("ordem").notNull(),
  },
  (t) => [primaryKey({ columns: [t.colecaoSlug, t.livroId] })],
);

/* -------------------------------------------------------------------------- */
/* Relações (para as consultas do Drizzle saberem juntar as tabelas)           */
/* -------------------------------------------------------------------------- */

export const livrosRelations = relations(livros, ({ one, many }) => ({
  autor: one(pessoas, { fields: [livros.autorSlug], references: [pessoas.slug], relationName: "autor" }),
  narrador: one(pessoas, { fields: [livros.narradorSlug], references: [pessoas.slug], relationName: "narrador" }),
  editora: one(editoras, { fields: [livros.editoraSlug], references: [editoras.slug] }),
  genero: one(generos, { fields: [livros.generoSlug], references: [generos.slug] }),
  capitulos: many(capitulos),
  colecoes: many(colecoesLivros),
}));

export const pessoasRelations = relations(pessoas, ({ many }) => ({
  escreveu: many(livros, { relationName: "autor" }),
  narrou: many(livros, { relationName: "narrador" }),
}));

export const editorasRelations = relations(editoras, ({ many }) => ({
  livros: many(livros),
}));

export const generosRelations = relations(generos, ({ many }) => ({
  livros: many(livros),
}));

export const capitulosRelations = relations(capitulos, ({ one }) => ({
  livro: one(livros, { fields: [capitulos.livroId], references: [livros.id] }),
}));

export const colecoesRelations = relations(colecoes, ({ many }) => ({
  livros: many(colecoesLivros),
}));

export const colecoesLivrosRelations = relations(colecoesLivros, ({ one }) => ({
  colecao: one(colecoes, { fields: [colecoesLivros.colecaoSlug], references: [colecoes.slug] }),
  livro: one(livros, { fields: [colecoesLivros.livroId], references: [livros.id] }),
}));

/* -------------------------------------------------------------------------- */
/* Tipos                                                                       */
/* -------------------------------------------------------------------------- */

export type Genero = typeof generos.$inferSelect;
export type Pessoa = typeof pessoas.$inferSelect;
export type Editora = typeof editoras.$inferSelect;
export type Livro = typeof livros.$inferSelect;
export type LivroNovo = typeof livros.$inferInsert;
export type Capitulo = typeof capitulos.$inferSelect;
export type Colecao = typeof colecoes.$inferSelect;
