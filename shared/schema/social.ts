import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { contas } from "./contas";
import { editoras, livros, pessoas } from "./catalogo";

/**
 * SOCIAL — seguir, publicar, comentar, ser avisado.
 *
 * ⚠️ **Leia a seção 3.1 do `docs/BANCO-DE-DADOS.md` antes de mexer aqui.** A
 * tela de seguidores já existe e funciona, mas **os seguidores são fictícios**:
 * vêm de `community.ts`, porque ninguém pode pedir para te seguir sem servidor.
 * O que a pessoa faz (aceitar, recusar, remover) vale de verdade — o que é
 * fingido é a **origem**. Esta camada é o contrato que o servidor tem de honrar.
 */

/* -------------------------------------------------------------------------- */
/* Seguidores                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Quem segue quem (`allbook_following` + `allbook_seguidores`).
 *
 * ⚠️ **É uma relação com ESTADO, não uma lista** — e essa é a primeira linha do
 * contrato. O front já pensa assim (`lib/seguidores.ts`), mas guarda só os
 * *seus* lados dela.
 *
 * As regras que a interface já promete, e que o servidor tem de cumprir:
 *
 * - **Pedido só existe com a conta privada ligada.** Com conta pública, seguir é
 *   imediato: o registro nasce `aceito` e **nenhuma linha `pendente` deve ser
 *   criada** — a tela esconde a aba de pedidos, e um pendente invisível ficaria
 *   preso para sempre.
 * - **Ligar a conta privada não expulsa quem já seguia** (é o que o aviso da
 *   tela diz, e o que o Instagram faz). Se um dia isso mudar, muda o texto junto.
 * - **Recusar e remover são silenciosos.** A tela promete em letras miúdas:
 *   *"Ninguém é avisado quando você recusa ou remove"*. **Não emitir
 *   notificação** nesses dois casos.
 * - **Aceitar depois de ter removido volta a valer**: o estado novo substitui o
 *   velho em vez de conviver com ele — por isso é uma linha por par, com uma
 *   coluna de situação, e não um histórico de eventos.
 * - **Remover seguidor precisa existir na API desde o primeiro dia.** É a peça
 *   que só dói depois: sem ela, um "sim" dado às pressas vale para sempre.
 */
export const seguidores = pgTable(
  "seguidores",
  {
    /** Quem segue. */
    seguidorId: uuid("seguidor_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    /** Quem é seguido. */
    seguidoId: uuid("seguido_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    situacao: text("situacao")
      .$type<"pendente" | "aceito" | "recusado" | "removido">()
      .notNull(),
    pedidoEm: timestamp("pedido_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    respondidoEm: timestamp("respondido_em", { withTimezone: true }),
  },
  (t) => [
    primaryKey({ columns: [t.seguidorId, t.seguidoId] }),
    index("seguidores_seguido_idx").on(t.seguidoId, t.situacao),
  ],
);

/* -------------------------------------------------------------------------- */
/* Quem a pessoa acompanha (autores, narradores, editoras, o Studio)           */
/* -------------------------------------------------------------------------- */

/**
 * `allbook_acompanhando` — a quarta porta do perfil (§4.84).
 *
 * Diferente de `seguidores`: ali é gente que também pode te seguir de volta;
 * aqui é **catálogo** — autor, narrador, editora ou o próprio AllBook Studio.
 * Não há reciprocidade nem pedido.
 *
 * ⚠️ As "novidades" que a tela mostra hoje têm **data semeada**; com banco a
 * data passa a ser a real (`livros.criadoEm`), e o que era plantado some.
 */
export const acompanhando = pgTable(
  "acompanhando",
  {
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    tipo: text("tipo").$type<"pessoa" | "editora" | "studio">().notNull(),
    /** Slug da pessoa/editora. O Studio é único e usa `allbook-studio`. */
    slug: text("slug").notNull(),
    desdeEm: timestamp("desde_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.contaId, t.tipo, t.slug] })],
);

/* -------------------------------------------------------------------------- */
/* Posts                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * O post do feed da Comunidade.
 *
 * ⚠️ **Hoje existem DOIS formatos convivendo de propósito** —
 * `allbook_posts` (novo) e `allbook_mural_posts` (legado). A migração converte
 * **os dois** nesta tabela; converter só o novo deixa metade dos posts para trás
 * sem erro nenhum.
 *
 * ⚠️ **O post não obedece à tranca da conta privada** (§4.54): ele vai ao feed
 * geral mesmo com a conta fechada — escrever já é o ato de tornar público. Só a
 * **atividade** (está ouvindo, comentou, avaliou, entrou num clube) é restrita a
 * seguidores. Confundir os dois esconderia o que a pessoa quis publicar.
 *
 * **A ordem do feed é cronológica pura — sem algoritmo.**
 */
export const posts = pgTable(
  "posts",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    texto: text("texto").notNull(),

    /**
     * O que vai anexado ao post. Exatamente uma das colunas `objeto*` é
     * preenchida, conforme o tipo — ou nenhuma, num post de texto puro.
     *
     * `post` é como **compartilhar** funciona: o compartilhamento é um post que
     * carrega outro, e não uma lista de ids à parte (30/07).
     */
    objetoTipo: text("objeto_tipo").$type<"livro" | "trecho" | "clube" | "pessoa" | "post">(),
    objetoLivroId: integer("objeto_livro_id").references(() => livros.id, { onDelete: "set null" }),
    objetoPessoaSlug: text("objeto_pessoa_slug").references(() => pessoas.slug, { onDelete: "set null" }),
    objetoClubeId: uuid("objeto_clube_id"),
    objetoPostId: uuid("objeto_post_id"),
    /** Do trecho citado: o livro é `objetoLivroId`. Teto de 40s. */
    trechoInicioSegundos: integer("trecho_inicio_segundos"),
    trechoDuracaoSegundos: integer("trecho_duracao_segundos"),

    /**
     * Post que espera resposta ("Terminei Duna, sigo na série?").
     * É **um tipo de post, e não uma aba separada** (29/07): aba dividiria a
     * comunidade em duas plateias.
     */
    pergunta: boolean("pergunta").default(false).notNull(),

    criadoEm: timestamp("criado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    /** ⚠️ Alimenta o selo "editado" — ver o mesmo campo em `comentarios`. */
    editadoEm: timestamp("editado_em", { withTimezone: true }),
    apagadoEm: timestamp("apagado_em", { withTimezone: true }),
  },
  (t) => [index("posts_feed_idx").on(t.criadoEm), index("posts_conta_idx").on(t.contaId, t.criadoEm)],
);

/**
 * Comentários de post (`allbook_comentarios_post`).
 *
 * Fica **separado** de `comentarios` (que é da conversa do livro/pessoa/editora)
 * porque tem uma peça que o outro não tem: a **resposta que É um livro** (§4.92)
 * — responder "que livro eu leio depois?" apontando um título do catálogo, em
 * vez de digitar o nome dele.
 *
 * A lista é **plana**: `respondeA` guarda o nome de quem se responde, senão num
 * post com cinco vozes não dá para saber quem fala com quem.
 */
export const comentariosDePost = pgTable(
  "comentarios_de_post",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    texto: text("texto").notNull(),
    /** O "@Fulano" da conversa plana. */
    respondeA: text("responde_a"),
    /** A resposta que é um livro (§4.92). */
    livroRespostaId: integer("livro_resposta_id").references(() => livros.id, { onDelete: "set null" }),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    editadoEm: timestamp("editado_em", { withTimezone: true }),
    apagadoEm: timestamp("apagado_em", { withTimezone: true }),
  },
  (t) => [index("comentarios_post_idx").on(t.postId, t.criadoEm)],
);

/**
 * As menções `@` dentro de um post ou de um comentário de post — as palavras do
 * texto que viram link.
 *
 * Guardadas em tabela, e não varridas do texto na leitura, porque o rótulo é o
 * nome **como estava escrito na hora**: se o livro for renomeado depois, o texto
 * antigo continua fazendo sentido e o link continua indo ao lugar certo.
 */
export const mencoes = pgTable(
  "mencoes",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    ondeTipo: text("onde_tipo").$type<"post" | "comentario_de_post">().notNull(),
    ondeId: uuid("onde_id").notNull(),
    /** O nome como aparece no texto, **sem** o `@`. */
    rotulo: text("rotulo").notNull(),
    alvoTipo: text("alvo_tipo").$type<"livro" | "clube" | "pessoa">().notNull(),
    alvoLivroId: integer("alvo_livro_id").references(() => livros.id, { onDelete: "set null" }),
    alvoPessoaSlug: text("alvo_pessoa_slug").references(() => pessoas.slug, { onDelete: "set null" }),
    alvoClubeId: uuid("alvo_clube_id"),
  },
  (t) => [index("mencoes_onde_idx").on(t.ondeTipo, t.ondeId)],
);

/* -------------------------------------------------------------------------- */
/* Notificações                                                                */
/* -------------------------------------------------------------------------- */

/**
 * O sino (`allbook_notifications`, `allbook_system_read`,
 * `allbook_avisos_curtida_lidos`, `allbook_avisos_clube`).
 *
 * ⚠️ **Os eventos que o servidor emite, e os que ele NÃO emite** (§4.55):
 *
 * | Aconteceu | Emite? |
 * |---|---|
 * | Pediu para seguir (só com conta privada) | `pediu_para_seguir` |
 * | Começou a seguir (conta pública) | `comecou_a_seguir` |
 * | **Recusou um pedido** | **nada** |
 * | **Removeu um seguidor** | **nada** |
 * | Curtiram o que você escreveu | `curtiu`, **agrupado** |
 * | Comentaram / responderam | `comentou` / `respondeu` |
 *
 * ⚠️ **Curtidas são agrupadas** ("Ana e mais 3 curtiram seu post") — a regra da
 * §4.58. Um evento por curtida vira enxurrada e mata o valor do sino. Por isso a
 * linha guarda o **alvo** e o servidor conta quantas pessoas curtiram aquele
 * alvo desde a última leitura, em vez de empilhar um aviso por clique.
 *
 * ⚠️ **O contador do sino soma os pedidos pendentes.** Hoje o `TopNav` faz essa
 * soma no cliente para evitar import circular; com API, é **um número só** vindo
 * do servidor — dois cálculos separados divergem no dia em que um deles mudar.
 *
 * Os avisos respeitam `ajustes.avisarCurtidas` e `ajustes.avisarComentarios`.
 */
export const notificacoes = pgTable(
  "notificacoes",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    /** Quem recebe. */
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    /** Quem causou. Vazio nos avisos de sistema. */
    deContaId: uuid("de_conta_id").references(() => contas.id, { onDelete: "cascade" }),
    tipo: text("tipo")
      .$type<
        | "pediu_para_seguir"
        | "comecou_a_seguir"
        | "respondeu"
        | "comentou"
        | "curtiu"
        | "convite_de_clube"
        | "convite_de_evento"
        | "pedido_pronto"
        | "sistema"
      >()
      .notNull(),

    /** Para onde o toque leva. Um aviso sem destino não leva a lugar nenhum. */
    destinoTipo: text("destino_tipo").$type<"livro" | "post" | "clube" | "forum" | "perfil" | "pedido">(),
    destinoLivroId: integer("destino_livro_id").references(() => livros.id, { onDelete: "cascade" }),
    destinoPostId: uuid("destino_post_id").references(() => posts.id, { onDelete: "cascade" }),
    destinoId: uuid("destino_id"),

    texto: text("texto"),
    lidaEm: timestamp("lida_em", { withTimezone: true }),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [index("notificacoes_conta_idx").on(t.contaId, t.criadoEm)],
);

/* -------------------------------------------------------------------------- */
/* O que NÃO virou tabela — e dizer isso é decisão, não esquecimento           */
/* -------------------------------------------------------------------------- */

/**
 * **Presença por capítulo** (`lib/presenca.ts`) não tem tabela, de propósito: o
 * capítulo em que alguém está já se deduz de `progresso` + `capitulos`. Guardar
 * de novo criaria dois números que podem discordar.
 *
 * O que a API precisa aplicar é a **regra**, não o dado: só entre quem se segue
 * **nos dois sentidos**, e só entre quem tem `ajustes.mostrarMeuCapitulo`
 * ligado dos dois lados — *quem não mostra, não vê*. E a granularidade é
 * capítulo, **nunca ao vivo**.
 *
 * `allbook_miniplayer`, `allbook_playing`, `allbook_ultima_tela`,
 * `allbook_library_view` e `allbook_library_sort` também ficam de fora: são
 * estado de tela ou preferência do aparelho, e morrem com a aba por desenho.
 */

export type Seguidor = typeof seguidores.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type ComentarioDePost = typeof comentariosDePost.$inferSelect;
export type Notificacao = typeof notificacoes.$inferSelect;
