import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
  uniqueIndex,
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
  /**
   * Uma linha sobre o recorte da editora **dentro do AllBook**.
   *
   * ⚠️ Deixou de ser obrigatória em 21/08 (§4.134) pelo mesmo motivo da `nota`:
   * é texto **editorial**, escrito por alguém, e as lojas do acervo entregam só
   * o nome da editora. Exigi-la faria a importação inventar uma frase por
   * editora — 4 mil frases sem autor.
   */
  linha: text("linha"),
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
    /**
     * O subtítulo, **separado do título** (30/08, §4.138).
     *
     * A fonte sempre soube separá-los — a tabela `titulos` do acervo tem
     * `titulo` e `subtitulo` em campos distintos —, mas o importador os colava
     * com `": "`. O resultado: 3.033 livros com título acima de 60 caracteres e
     * um deles, com 190, cobrindo a capa inteira no billboard da Início
     * (§4.137). Separado, cada tela decide o que mostrar.
     *
     * Vazio quando a loja não separa (e aí o título pode vir colado mesmo —
     * `tituloDeVitrine()` em `lib/books.ts` é a rede para esse caso).
     */
    subtitulo: text("subtitulo"),

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

    /* ---- Nota: NÃO existe aqui, e é decisão (21/08, §4.134) ---------------

       Havia três colunas de nota no livro — `nota`, `nota_historia` e
       `nota_narracao` —, herdadas das 63 maquetes, que traziam um número
       escrito à mão para cada uma.

       🚨 **Nota de avaliação quem dá é o usuário.** Ela não é um atributo da
       obra: é o que as pessoas acharam dela. Guardá-la como coluna do livro
       permite que alguém escreva ali uma nota que ninguém deu — e foi
       exatamente o que as maquetes faziam. A nota agora **sai de
       `avaliacoes`** (`historia` e `narracao`, uma linha por conta), calculada
       na hora de ler, e só aparece a partir de 5 avaliações, que é a régua que
       `lib/ratings.ts` já usava no navegador. Livro sem avaliação não tem nota
       — e é o caso de todo o acervo, porque nenhuma loja entrega avaliação.  */

    // Daqui para baixo, o que veio da ficha da loja (ou da Open Library, nos
    // livros antigos).
    /** Título no idioma original — é por ele que a busca de capas funciona. */
    tituloOriginal: text("titulo_original"),
    /**
     * O ano da **edição em áudio** — a data que a loja anuncia como lançamento
     * (`titulos.lancamento` do acervo).
     *
     * ⚠️ **Não é o ano da obra**, e confundir os dois é fácil: "Mais esperto que
     * o diabo", texto de 1938, está aqui como 2017 (Tocalivros) e 2026 (Ubook).
     * O ano do texto é o `anoObra`, logo abaixo.
     *
     * 🚨 **No Ubook este campo é a data da COLETA, não do lançamento**: 3.497
     * dos 4.938 livros de lá caíram em 2026, concentrados nos meses em que o
     * acervo foi baixado (medido em 31/08). Por isso a ficha do livro **não**
     * mostra o ano da narração nessa loja — a régua está em
     * `client/src/lib/anos.ts`, num lugar só.
     */
    ano: integer("ano"),
    /**
     * O ano em que a **obra** foi publicada pela primeira vez — o do texto, não
     * o da gravação.
     *
     * Vem de `ficha.ANO` do `_ficha.json`, escrita pelo **agente do ano** do
     * `baixalivro`. Ele **só grava o que consegue provar** e recusa sozinho toda
     * prova que fale em audiolivro, narração ou lançamento em loja
     * (`ano_confiavel`, em `tools/ano_barato.py`). Por isso aqui não existe
     * campo de "confiança": o que está gravado é achado; o que não deu para
     * provar fica **vazio**, e a tela some com a linha.
     *
     * ⚠️ **Quem escreve é `npm run anos`** (`script/anos.ts`), e não a
     * importação do acervo: o agente segue rodando por dias, e reimportar
     * 13.917 livros para pegar um número seria caro. A importação também não
     * pode apagá-lo — ela não conhece este campo.
     */
    anoObra: integer("ano_obra"),
    /**
     * A prova do `anoObra`, como o agente a escreveu: `Wikidata (P577, data de
     * publicação da obra)`, `sinopse da Audible: …`, `loja da Editora Dialética
     * (ISBN …)`.
     *
     * Guardada porque é ela que separa achado de chute — sem a prova, um ano
     * errado é indistinguível de um certo, e foi assim que *100 Consejos de
     * Adiestramiento de Perros* gravou a data do audiolivro como ano da obra.
     */
    anoObraFonte: text("ano_obra_fonte"),
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

    /* ---- De onde este livro veio (21/08, §4.134) --------------------------- */

    /**
     * A loja do acervo de onde a ficha veio (`audible`, `storytel`, `ubook`,
     * `tocalivros`) e o id do título **nela**.
     *
     * ⚠️ **Não é enfeite de procedência: é o que torna a importação
     * idempotente.** O `id` do livro é um número nosso, gerado na primeira
     * importação. Sem um par estável vindo da origem, rodar o importador de
     * novo criaria livros novos para os mesmos títulos — e a biblioteca, o
     * progresso e as marcações de quem já ouviu apontariam para os antigos,
     * que ninguém mais mostraria. O índice único abaixo é o que impede isso.
     *
     * Vazio nos livros que **não** vieram de loja (os que o AllBook Studio
     * gravar a partir de um pedido).
     */
    origemLoja: text("origem_loja"),
    origemId: text("origem_id"),

    /**
     * A pasta deste livro dentro do acervo do `baixalivro` (31/08, §4.142).
     *
     * 🚨 **É o que permite o app TOCAR sem duplicar o acervo.** A ingestão do
     * `npm run audio` converte o livro em segmentos HLS — e o acervo inteiro
     * convertido daria **840 GB ao lado dos 1,34 TB que já existem**, num SSD
     * com 179 GB livres. Guardando a pasta, o servidor lê o MP3 que já está
     * lá e serve o capítulo pedido; nada é copiado, nada é convertido, e os
     * 13.917 livros tocam.
     *
     * Vazio nos livros que não vieram do acervo.
     */
    pastaAcervo: text("pasta_acervo"),

    /* ---- Os carimbos da sincronização (30/08, §4.138) --------------------- */

    /**
     * Quando o `_ficha.json` deste livro foi montado no baixalivro — o campo
     * `gerado_em` da ficha, copiado como veio.
     *
     * É **texto ISO**, não `timestamp`: a origem grava sem fuso
     * (`2026-08-17T09:36:27`) e inventar um fuso na entrada seria pior que não
     * ter. Como ISO ordena igual em texto, `>` e `max()` continuam valendo.
     *
     * Serve para uma pergunta só, e ela importa: *quais livros mudaram de ficha
     * desde a última importação?* Sem isto, o importador reescreve os 13.917
     * sempre — funciona, mas não sabe dizer o que mudou, e o Matheus fica sem
     * saber se a correção que ele fez lá já chegou aqui.
     */
    fichaGeradaEm: text("ficha_gerada_em"),

    /**
     * A vinheta que a **ficha declara** hoje, como carimbo comparável
     * (`a1/f15@2026-08-21`), ou vazio se este livro ainda não foi vinhetado.
     *
     * Quem cola a vinheta nos arquivos é o `vinhetar.py`, no baixalivro, e ele
     * anota no `_ficha.json` qual abertura, qual fecho e em que dia. Este campo
     * é a cópia desse carimbo no momento da importação.
     */
    vinhetaFicha: text("vinheta_ficha"),

    /**
     * A vinheta com que o áudio foi **de fato ingerido** — gravada pelo
     * `npm run audio`, não pelo importador.
     *
     * ⚠️ **É a comparação entre este campo e `vinhetaFicha` que responde "este
     * áudio está velho?".** Diferentes = a vinheta foi trocada depois da
     * ingestão, e trocar vinheta **desloca toda posição salva** daquele livro
     * (a armadilha que `vinhetaSegundos` existe para consertar). Sem os dois
     * carimbos, uma narração desatualizada não tem como se declarar — e o erro
     * só apareceria no ouvido de quem retomasse o livro no lugar errado.
     *
     * Vazio = não há áudio ingerido para este livro.
     */
    vinhetaIngerida: text("vinheta_ingerida"),

    criadoEm: timestamp("criado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [
    uniqueIndex("livros_origem_idx").on(t.origemLoja, t.origemId),
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
    /**
     * Onde o capítulo começa dentro do áudio completo, e quanto dura — em
     * segundos.
     *
     * ⚠️ **Podem faltar, e é de propósito** (31/08, §4.141). Os capítulos
     * passaram a entrar na **importação do acervo**, não só na ingestão do
     * áudio: 100% das fichas trazem número e título de verdade, mas a duração
     * de cada um só vem completa da Audible (100%) e da Storytel (99%) — no
     * Tocalivros são 32% e no Ubook, **nenhuma**.
     *
     * Vazio quer dizer *"ainda não medimos"*, e a tela mostra o capítulo sem
     * tempo. O que **não** se faz é preencher com estimativa: era exatamente
     * isso que o gerador de capítulos de maquete fazia, e foi por isso que ele
     * saiu. Quem preenche depois é `npm run audio` (mede com ffprobe ao ingerir)
     * ou `npm run acervo medir-capitulos`.
     */
    inicioSegundos: integer("inicio_segundos"),
    duracaoSegundos: integer("duracao_segundos"),
    /**
     * O nome do arquivo deste capítulo dentro de `livros.pastaAcervo`.
     *
     * ⚠️ **Só o nome, nunca o caminho completo** — é o que impede que um
     * pedido possa apontar para fora da pasta do livro. Quem monta o caminho é
     * o servidor, juntando `pastaAcervo` + este nome.
     */
    arquivo: text("arquivo"),
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
