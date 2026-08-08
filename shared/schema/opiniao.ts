import { sql } from "drizzle-orm";
import {
  boolean,
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
import { editoras, livros, pessoas } from "./catalogo";

/**
 * OPINIÃO — notas, comentários, respostas, reações, recomendações e denúncias.
 *
 * ⚠️ Esta camada é a que mais depende de **decidir o destino da ficção**
 * (armadilha 2.4), e isso tem de acontecer **antes** de abrir para gente real:
 *
 * - `lib/comments.ts` tem ~90 comentários fixos de livro, pessoa e editora. Se
 *   sumirem, os perfis ficam vazios; se ficarem, misturam com os de verdade.
 * - `lib/replies.ts` faz a resposta "chegar" por um esqueleto de seis falas
 *   fixas. Isso **tem de sair** quando houver gente.
 * - `lib/reactions.ts` soma a sua curtida sobre um **número base fixo no
 *   código**. Com banco esse número some, e **todas as contagens mudam de
 *   valor** — a tela não quebra, só passa a mostrar outro número.
 */

/* -------------------------------------------------------------------------- */
/* Avaliações                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * A nota que a pessoa deu a um livro (`allbook_ratings`).
 *
 * **As duas dimensões são independentes e opcionais**: dá para avaliar só a
 * história, só a narração, ou as duas. Exigir as duas afastaria quem tem opinião
 * formada sobre uma só — e é comum (livro bom com narração morna, ou o
 * contrário).
 *
 * A herança sai daqui, e é o motivo de elas serem separadas (§4.15): a média de
 * `historia` é a nota do **autor**; a de `narracao`, a do **narrador**. Antes as
 * duas eram a nota geral, o que punia o narrador de um livro fraco e inflava o
 * de um texto ótimo mal lido.
 */
export const avaliacoes = pgTable(
  "avaliacoes",
  {
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    livroId: integer("livro_id")
      .notNull()
      .references(() => livros.id, { onDelete: "cascade" }),
    /** 1 a 5 — a obra, o texto. Herda para o autor. */
    historia: smallint("historia"),
    /** 1 a 5 — a performance desta edição. Herda para o narrador. */
    narracao: smallint("narracao"),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.contaId, t.livroId] })],
);

/* -------------------------------------------------------------------------- */
/* Comentários e respostas                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Os comentários — de livro, de pessoa e de editora — **e as respostas a eles**.
 *
 * Hoje são duas chaves separadas (`allbook_my_comments` e `allbook_replies`).
 * Aqui viram uma tabela só, com `paiId` apontando para o comentário respondido:
 * resposta é comentário com pai, e duplicar a estrutura só faria as duas
 * divergirem com o tempo.
 *
 * **A conversa é plana (um nível só)**, como já é: responder a uma resposta
 * guarda o pai original e o nome de quem se respondeu em `respondendoA` — sem
 * isso, num fio com várias vozes não dá para saber quem fala com quem.
 *
 * **Exatamente um alvo por comentário.** No front o tipo em união já impede
 * escrever um comentário que é de livro e de editora ao mesmo tempo; aqui a
 * regra vira `alvo` mais as três colunas, das quais só uma é preenchida.
 * Comentário sem alvo nenhum é lixo — não teria como voltar à tela.
 */
export const comentarios = pgTable(
  "comentarios",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),

    /** Qual das três colunas de alvo está preenchida. */
    alvo: text("alvo").$type<"livro" | "pessoa" | "editora">().notNull(),
    alvoLivroId: integer("alvo_livro_id").references(() => livros.id, { onDelete: "cascade" }),
    alvoPessoaSlug: text("alvo_pessoa_slug").references(() => pessoas.slug, { onDelete: "cascade" }),
    alvoEditoraSlug: text("alvo_editora_slug").references(() => editoras.slug, { onDelete: "cascade" }),

    /** Até 600 caracteres. Curto de propósito: comentário, não resenha. */
    texto: text("texto").notNull(),

    /** A resposta aponta para o comentário de primeiro nível. */
    paiId: uuid("pai_id"),
    /** O "@Fulano" de quem se está respondendo, na conversa plana. */
    respondendoA: text("respondendo_a"),

    /**
     * Em que segundo do áudio a pessoa estava — a âncora da sala do livro
     * (§4.39). **Vazio quer dizer que ela falou do livro em geral**, e aí todo
     * mundo lê: a ausência tem significado próprio, não é campo esquecido.
     */
    posicaoSegundos: integer("posicao_segundos"),
    /** Marcado como spoiler: o texto fica atrás de um toque para os outros. */
    spoiler: boolean("spoiler").default(false).notNull(),
    /**
     * Se o comentário **cita** um trecho, quanto ele dura (§4.43). O início é a
     * âncora acima — guardar o início duas vezes deixaria os dois divergirem.
     */
    duracaoSegundos: integer("duracao_segundos"),

    criadoEm: timestamp("criado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    /**
     * Quando foi editado. Vazio = nunca.
     *
     * ⚠️ Existe para o selo **"editado"** (§4.58). Sem ele, o autor vira o
     * sentido do texto depois de comentado e as respostas anteriores ficam sem
     * pé — quem lê não tem como saber que a pergunta mudou.
     */
    editadoEm: timestamp("editado_em", { withTimezone: true }),
    /** Apagado pela pessoa. Some da tela, mas o fio não perde o encadeamento. */
    apagadoEm: timestamp("apagado_em", { withTimezone: true }),
  },
  (t) => [
    index("comentarios_livro_idx").on(t.alvoLivroId, t.criadoEm),
    index("comentarios_pessoa_idx").on(t.alvoPessoaSlug),
    index("comentarios_editora_idx").on(t.alvoEditoraSlug),
    index("comentarios_pai_idx").on(t.paiId),
    index("comentarios_conta_idx").on(t.contaId, t.criadoEm),
  ],
);

/**
 * A **melhor resposta** de uma pergunta (`allbook_melhor_resposta`).
 *
 * ⚠️ Regra a honrar na API: **só quem perguntou marca**. Não é poder de
 * moderador — a coluna `marcadaPor` existe justamente para o servidor poder
 * conferir que quem marcou é o autor do comentário-pai.
 */
export const melhorResposta = pgTable("melhor_resposta", {
  perguntaId: uuid("pergunta_id")
    .primaryKey()
    .references(() => comentarios.id, { onDelete: "cascade" }),
  respostaId: uuid("resposta_id")
    .notNull()
    .references(() => comentarios.id, { onDelete: "cascade" }),
  marcadaPor: uuid("marcada_por")
    .notNull()
    .references(() => contas.id, { onDelete: "cascade" }),
  marcadaEm: timestamp("marcada_em", { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
});

/* -------------------------------------------------------------------------- */
/* Reações — UMA tabela para o app inteiro                                     */
/* -------------------------------------------------------------------------- */

/**
 * Curtir e descurtir.
 *
 * ⚠️ **É uma tabela só, e isso é ordem do checklist** (3.1): *"Curtir precisa
 * valer no app inteiro — hoje só a conversa do livro usa `reactions.ts`. Ao
 * migrar, a tabela de reações é uma só, com o tipo do alvo"*. Hoje são duas
 * chaves que fazem quase a mesma coisa (`allbook_reactions` e
 * `allbook_curtidas`), e a segunda **já trocou de formato uma vez**
 * (lista → mapa). Unificar agora evita a terceira.
 *
 * `alvoId` é polimórfico de propósito — aponta para comentário, post, resposta
 * de fórum ou mensagem de clube, que são tabelas diferentes. Por isso não há
 * chave estrangeira: quem apaga o alvo apaga a reação junto, na mesma operação.
 *
 * **Tocar de novo no que já estava marcado desfaz**, e curtir depois de
 * descurtir troca uma pela outra: são exclusivas. Por isso é uma linha por
 * (conta, alvo), não uma por clique.
 */
export const reacoes = pgTable(
  "reacoes",
  {
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    alvoTipo: text("alvo_tipo")
      .$type<"comentario" | "post" | "resposta_forum" | "mensagem_clube" | "topico_forum">()
      .notNull(),
    alvoId: uuid("alvo_id").notNull(),
    reacao: text("reacao").$type<"curtiu" | "descurtiu">().notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.contaId, t.alvoTipo, t.alvoId] }),
    index("reacoes_alvo_idx").on(t.alvoTipo, t.alvoId),
  ],
);

/* -------------------------------------------------------------------------- */
/* Recomendações                                                               */
/* -------------------------------------------------------------------------- */

/**
 * "O que eu recomendo" (`allbook_recommendations`), com o porquê.
 *
 * ⚠️ **Não existe interruptor de privacidade para isto, por decisão do
 * Matheus**: *"já que ela está recomendando, ela quer que as pessoas vejam"*.
 * Recomendar é um ato deliberadamente público — esconder seria desfazer o gesto.
 * **Não inventar uma chave de vitrine para esta tabela no backend.**
 */
export const recomendacoes = pgTable(
  "recomendacoes",
  {
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    livroId: integer("livro_id")
      .notNull()
      .references(() => livros.id, { onDelete: "cascade" }),
    /** O porquê. Vazio = a pessoa ainda não escreveu nada. */
    nota: text("nota").default("").notNull(),
    recomendadoEm: timestamp("recomendado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.contaId, t.livroId] })],
);

/* -------------------------------------------------------------------------- */
/* Denúncias                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * O que a pessoa denunciou (`allbook_denuncias`).
 *
 * ⚠️ **Migrar como denúncia ABERTA, com data** — no navegador isto é só um
 * "escondido para mim"; no servidor vira **fila de revisão**, e uma denúncia que
 * chega já fechada nunca é lida por ninguém. `situacao` nasce em `aberta`.
 */
export const denuncias = pgTable(
  "denuncias",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    alvoTipo: text("alvo_tipo")
      .$type<"comentario" | "post" | "resposta_forum" | "mensagem_clube" | "conta">()
      .notNull(),
    alvoId: uuid("alvo_id").notNull(),
    motivo: text("motivo").$type<"spoiler" | "ofensa" | "outro">().notNull(),
    detalhe: text("detalhe"),
    situacao: text("situacao")
      .$type<"aberta" | "acolhida" | "recusada">()
      .default("aberta")
      .notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    revisadoEm: timestamp("revisado_em", { withTimezone: true }),
  },
  (t) => [index("denuncias_situacao_idx").on(t.situacao, t.criadoEm)],
);

export type Avaliacao = typeof avaliacoes.$inferSelect;
export type Comentario = typeof comentarios.$inferSelect;
export type Reacao = typeof reacoes.$inferSelect;
export type Denuncia = typeof denuncias.$inferSelect;
