import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { contas } from "./contas";
import { livros } from "./catalogo";
import { clubes } from "./clubes";

/**
 * COMUNIDADES (os fóruns) — no molde do Orkut: comunidade, tópicos, enquetes e
 * eventos.
 *
 * ⚠️ **Vocabulário, para não trocar as bolas:** desde 05/08 a aba de baixo se
 * chama **"Feed"**, e a palavra *comunidade* vale **só** para estes fóruns
 * (`/forum`). Os posts do Feed estão em `social.ts`, não aqui.
 *
 * ⚠️ **Armadilha do remendo (2.10), em grau alto.** Hoje isto é código +
 * localStorage costurados: os fóruns e os tópicos vêm semeados de
 * `lib/grupos.ts`, e o que a pessoa faz vive em seis chaves separadas
 * (`grupos_participo`, `grupos_meus_topicos`, `grupos_minhas_respostas`,
 * `grupos_meus`, `grupos_capas`, `grupos_moderacao`) mais três de `lib/forum.ts`.
 * Pior: **as duas libs leem as chaves uma da outra por string crua**, para
 * evitar import circular — mexer numa tabela daqui obriga a olhar as duas.
 *
 * ⚠️ **A lista de membros tem de ser UMA SÓ.** Hoje ela é "o que o código diz"
 * mais "o remendo do navegador"; duas listas discordam em silêncio, e a pessoa
 * aparece dentro do fórum numa tela e fora dele na outra.
 *
 * ⚠️ **Imagem enviada é `data:` URL no localStorage** (capa de tópico e imagem
 * da comunidade). Na migração vira **upload de arquivo** — carregar base64
 * dentro de toda consulta é lento e não escala.
 */

/* -------------------------------------------------------------------------- */
/* A comunidade                                                                */
/* -------------------------------------------------------------------------- */

export const foruns = pgTable(
  "foruns",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    nome: text("nome").notNull(),
    /** O ícone — emoji, como as comunidades do Orkut tinham imagem. */
    emoji: text("emoji"),
    descricao: text("descricao").default("").notNull(),
    /** Uma das `CATEGORIAS` de `lib/forum.ts`. */
    categoria: text("categoria"),
    regras: text("regras"),
    idioma: text("idioma"),
    /** Caminho do arquivo enviado (era `data:` URL de 140×140). */
    imagem: text("imagem"),

    donoId: uuid("dono_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),

    /**
     * **Os padrões são os do Orkut**: comunidade nasce **aberta**, **pública** e
     * com **todo mundo podendo criar**. Fechar é escolha do dono, não o estado
     * inicial — comunidade que nasce trancada não recebe ninguém.
     */
    entrada: text("entrada").$type<"aberta" | "moderada" | "fechada">().default("aberta").notNull(),
    /** Não-membro **lê** o fórum, ou nem isso? (a "visibilidade" do Orkut) */
    visibilidade: text("visibilidade").$type<"publica" | "privada">().default("publica").notNull(),

    criarTopicos: text("criar_topicos").$type<"membros" | "moderadores">().default("membros").notNull(),
    criarEnquetes: text("criar_enquetes").$type<"membros" | "moderadores">().default("membros").notNull(),
    criarEventos: text("criar_eventos").$type<"membros" | "moderadores">().default("membros").notNull(),

    /**
     * A enquete que o moderador fixou na página.
     * Sem ninguém fixar nada, o destaque é a **mais votada entre as abertas**;
     * fixando, a escolha do moderador ganha.
     */
    enqueteFixadaId: uuid("enquete_fixada_id"),

    criadoEm: timestamp("criado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    excluidoEm: timestamp("excluido_em", { withTimezone: true }),
  },
  (t) => [index("foruns_categoria_idx").on(t.categoria)],
);

/**
 * Quem está na comunidade — **uma lista só** (ver o aviso do topo).
 *
 * `banido` é definitivo: **não volta a entrar**, como no Orkut. `na_fila` é o
 * pedido esperando aprovação de um fórum `moderada`; `convidado` entra sem pedir
 * num fórum `fechada`.
 */
export const forumMembros = pgTable(
  "forum_membros",
  {
    forumId: uuid("forum_id")
      .notNull()
      .references(() => foruns.id, { onDelete: "cascade" }),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    papel: text("papel").$type<"dono" | "moderador" | "membro">().default("membro").notNull(),
    situacao: text("situacao")
      .$type<"dentro" | "na_fila" | "convidado" | "recusado" | "banido" | "saiu">()
      .default("dentro")
      .notNull(),
    entrouEm: timestamp("entrou_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.forumId, t.contaId] }),
    index("forum_membros_conta_idx").on(t.contaId),
  ],
);

/* -------------------------------------------------------------------------- */
/* Tópicos e respostas                                                         */
/* -------------------------------------------------------------------------- */

export const forumTopicos = pgTable(
  "forum_topicos",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    forumId: uuid("forum_id")
      .notNull()
      .references(() => foruns.id, { onDelete: "cascade" }),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    titulo: text("titulo").notNull(),
    /** Fixado no topo (o 📌 do Orkut). */
    fixado: boolean("fixado").default(false).notNull(),

    /**
     * O livro de que o tópico fala — **a capa dele vira a capa do tópico**, e a
     * capa de livro vem **antes** da imagem enviada na escolha.
     */
    livroId: integer("livro_id").references(() => livros.id, { onDelete: "set null" }),
    /** Imagem enviada pela pessoa; ganha da capa de livro quando existe. */
    capaImagem: text("capa_imagem"),

    criadoEm: timestamp("criado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    trancadoEm: timestamp("trancado_em", { withTimezone: true }),
    apagadoEm: timestamp("apagado_em", { withTimezone: true }),
  },
  (t) => [index("forum_topicos_forum_idx").on(t.forumId, t.fixado, t.criadoEm)],
);

export const forumRespostas = pgTable(
  "forum_respostas",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    topicoId: uuid("topico_id")
      .notNull()
      .references(() => forumTopicos.id, { onDelete: "cascade" }),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    texto: text("texto").notNull(),

    /** Trecho de áudio citado (§4.45) — a mesma peça do clube e da sala. */
    citacaoLivroId: integer("citacao_livro_id").references(() => livros.id, { onDelete: "set null" }),
    citacaoInicioSegundos: integer("citacao_inicio_segundos"),
    citacaoDuracaoSegundos: integer("citacao_duracao_segundos"),

    criadoEm: timestamp("criado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    editadoEm: timestamp("editado_em", { withTimezone: true }),
    apagadoEm: timestamp("apagado_em", { withTimezone: true }),
    /** Ocultada pela moderação do fórum. */
    ocultadoEm: timestamp("ocultado_em", { withTimezone: true }),
  },
  (t) => [index("forum_respostas_topico_idx").on(t.topicoId, t.criadoEm)],
);

/* -------------------------------------------------------------------------- */
/* Enquetes                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * ⚠️ **Os votos de hoje são fictícios e semeados, e morrem em produção.** Uma
 * enquete de verdade **começa zerada** — herdar os números plantados faria a
 * primeira enquete real nascer com dezenas de votos que ninguém deu.
 */
export const forumEnquetes = pgTable(
  "forum_enquetes",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    forumId: uuid("forum_id")
      .notNull()
      .references(() => foruns.id, { onDelete: "cascade" }),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    pergunta: text("pergunta").notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    fechadaEm: timestamp("fechada_em", { withTimezone: true }),
  },
  (t) => [index("forum_enquetes_forum_idx").on(t.forumId)],
);

export const forumEnqueteOpcoes = pgTable(
  "forum_enquete_opcoes",
  {
    enqueteId: uuid("enquete_id")
      .notNull()
      .references(() => forumEnquetes.id, { onDelete: "cascade" }),
    indice: smallint("indice").notNull(),
    texto: text("texto").notNull(),
  },
  (t) => [primaryKey({ columns: [t.enqueteId, t.indice] })],
);

export const forumEnqueteVotos = pgTable(
  "forum_enquete_votos",
  {
    enqueteId: uuid("enquete_id")
      .notNull()
      .references(() => forumEnquetes.id, { onDelete: "cascade" }),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    indice: smallint("indice").notNull(),
    votadoEm: timestamp("votado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.enqueteId, t.contaId] })],
);

/* -------------------------------------------------------------------------- */
/* Eventos                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * O evento da comunidade — dia, hora e lugar, como no formulário do Orkut.
 *
 * `clubeId` é **a ponte que o Matheus pediu** (31/07): o evento *aponta* para um
 * clube, como um post anexa um trecho.
 *
 * ⚠️ **E o clube continua sem hora marcada** (§4.39): o encontro do clube é uma
 * rodada assíncrona de dois ou três dias, porque quem ouve audiolivro ouve
 * dirigindo e às 23h. Se o evento com hora virasse o encontro do clube, o clube
 * teria **dois** encontros com o mesmo nome e os avisos falariam de duas coisas
 * diferentes.
 */
export const forumEventos = pgTable(
  "forum_eventos",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    forumId: uuid("forum_id")
      .notNull()
      .references(() => foruns.id, { onDelete: "cascade" }),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    titulo: text("titulo").notNull(),
    data: date("data").notNull(),
    /** "21:00". Fica à parte do dia, como no formulário do Orkut. */
    hora: text("hora"),
    local: text("local"),
    descricao: text("descricao"),
    /** A ponte para um clube de leitura. Ver o aviso acima. */
    clubeId: uuid("clube_id").references(() => clubes.id, { onDelete: "set null" }),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    canceladoEm: timestamp("cancelado_em", { withTimezone: true }),
  },
  (t) => [index("forum_eventos_forum_idx").on(t.forumId, t.data)],
);

/**
 * Quem vai ao evento.
 *
 * ⚠️ Duas chaves de hoje **morrem aqui**: as presenças fictícias semeadas, e
 * `allbook_forum_presencas_outros` — que é dado fictício **persistido** pela
 * simulação de convite. Com servidor não há o que migrar: quem confirma é gente.
 */
export const forumPresencas = pgTable(
  "forum_presencas",
  {
    eventoId: uuid("evento_id")
      .notNull()
      .references(() => forumEventos.id, { onDelete: "cascade" }),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    presenca: text("presenca").$type<"vou" | "talvez" | "nao">().notNull(),
    respondidoEm: timestamp("respondido_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.eventoId, t.contaId] })],
);

export const forumConvitesDeEvento = pgTable(
  "forum_convites_de_evento",
  {
    eventoId: uuid("evento_id")
      .notNull()
      .references(() => forumEventos.id, { onDelete: "cascade" }),
    deContaId: uuid("de_conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    paraContaId: uuid("para_conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.eventoId, t.paraContaId] })],
);

export type Forum = typeof foruns.$inferSelect;
export type ForumTopico = typeof forumTopicos.$inferSelect;
export type ForumResposta = typeof forumRespostas.$inferSelect;
export type ForumEvento = typeof forumEventos.$inferSelect;
