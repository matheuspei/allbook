import { sql } from "drizzle-orm";
import { index, integer, pgTable, smallint, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { contas } from "./contas";
import { livros, pessoas } from "./catalogo";

/**
 * PEDIDOS E ASSINATURA — a ideia central do AllBook, e como ela se paga.
 *
 * O AllBook não é o catálogo: é **narrar sob demanda o livro que ainda não
 * existe em áudio**, em até 24 horas. Esta é a camada que faz essa promessa
 * deixar de ser uma tela.
 *
 * ⚠️ **Hoje o pedido não sai do aparelho** (armadilha 2.6): `/request` grava no
 * navegador e o pedido nasce e **permanece** em `recebido` — não há fila,
 * servidor nem estúdio ligado. A tela é honesta com a pessoa, mas a promessa
 * pública é de 24 horas.
 */

/* -------------------------------------------------------------------------- */
/* Pedidos                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Um pedido de narração.
 *
 * As quatro etapas não são decorativas — a segunda é a que responde a pergunta
 * que a pessoa não tinha como responder sozinha: **já existe narração deste
 * livro?** É ali que o pedido se divide em "trazer a que existe" ou "gravar do
 * zero". (Por isso ela se chama assim, e não "procurando o texto", nome antigo
 * que escondia a bifurcação.)
 */
export const pedidos = pgTable(
  "pedidos",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),

    /** O que a pessoa quer ouvir. Único campo obrigatório (até 120 caracteres). */
    titulo: text("titulo").notNull(),
    autor: text("autor"),
    /** Detalhe livre: edição preferida, idioma, "é o da capa azul" (até 300). */
    observacao: text("observacao"),

    /**
     * A voz escolhida.
     *
     * ⚠️ **Vazio quer dizer "o estúdio escolhe", e esse é o padrão** — não um
     * campo esquecido. Quem não conhece as vozes não deve ser obrigado a
     * escolher uma para poder pedir. A ausência tem significado próprio.
     *
     * **Vale só quando o estúdio grava** (§4.28): se o livro já tem narração
     * publicada, o AllBook traz a que existe e a voz não se aplica.
     */
    vozSlug: text("voz_slug").references(() => pessoas.slug, { onDelete: "set null" }),

    situacao: text("situacao")
      .$type<"recebido" | "procurando" | "produzindo" | "pronto" | "recusado">()
      .default("recebido")
      .notNull(),

    /** O livro que nasceu do pedido, quando fica pronto. */
    livroId: integer("livro_id").references(() => livros.id, { onDelete: "set null" }),

    /**
     * O id que o pedido tem **no navegador**.
     *
     * ⚠️ Mesmo motivo de `marcacoes.idLocal`: sem ele, a sincronização
     * **duplica o pedido** a cada rodada — o navegador guarda o id dele, o banco
     * gera outro, e na volta o front não reconhece que é o mesmo. Foi um defeito
     * de verdade, achado testando as duas vezes (§4.121 e §4.122).
     */
    idLocal: text("id_local"),

    criadoEm: timestamp("criado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    prontoEm: timestamp("pronto_em", { withTimezone: true }),
  },
  (t) => [
    index("pedidos_conta_idx").on(t.contaId, t.criadoEm),
    /** A fila do estúdio: o que está aberto, na ordem de chegada. */
    index("pedidos_fila_idx").on(t.situacao, t.criadoEm),
    unique("pedidos_id_local").on(t.contaId, t.idLocal),
  ],
);

/* -------------------------------------------------------------------------- */
/* Assinatura                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * A assinatura da pessoa (`lib/assinatura.ts`, construída em 08/08 pela janela
 * B, §4.118).
 *
 * As faixas são **Ouvir · Ouvir e pedir · Ouvir e pedir mais** — nomes trocados
 * de propósito em relação à maquete, que chamava a de cima de "Sem limite de
 * fila" ao lado do número 3. Um nome que promete "sem limite" ao lado de um
 * limite é a primeira coisa que alguém aponta.
 *
 * ⚠️ **Nada aqui cobra.** Assinar grava uma linha, como o login de hoje. Quando
 * o pagamento entrar, quem muda é só a camada de cobrança — e é aqui que a
 * referência do gateway vai morar.
 *
 * ⚠️ **O avulso exige assinatura ativa** (decisão da janela B, não da folha):
 * sem isso, um pedido avulso de R$ 39,90 solto sai mais barato que o plano de
 * R$ 49,90 e fura a escada inteira.
 */
export const assinaturas = pgTable("assinaturas", {
  contaId: uuid("conta_id")
    .primaryKey()
    .references(() => contas.id, { onDelete: "cascade" }),

  plano: text("plano")
    .$type<"nenhum" | "ouvir" | "pedir" | "pedirMais">()
    .default("nenhum")
    .notNull(),

  /** Pedidos guardados. Nunca passa do teto de 3. */
  creditos: smallint("creditos").default(0).notNull(),

  /**
   * O pedido de boas-vindas ainda está disponível?
   *
   * ⚠️ **Nasce `false` e só vira `true` quando a assinatura entra — nunca no
   * cadastro.** A folha nomeou o buraco: sem isso, dá para abusar criando
   * contas. E como é **uma vez na vida da conta**, trocar de plano não o
   * devolve — é o que `boasVindasUsado` guarda.
   */
  boasVindas: text("boas_vindas").$type<"sim" | "nao">().default("nao").notNull(),
  boasVindasUsado: text("boas_vindas_usado").$type<"sim" | "nao">().default("nao").notNull(),

  /** `AAAA-MM` da última vez que o crédito mensal entrou. */
  ultimaRecarga: text("ultima_recarga").default("").notNull(),

  /** Referência do gateway de pagamento. Vazia enquanto nada cobra. */
  referenciaDePagamento: text("referencia_de_pagamento"),

  criadoEm: timestamp("criado_em", { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
});

/**
 * Cada vez que um crédito de pedido entrou ou saiu.
 *
 * Não existe hoje, e faz falta no primeiro suporte: sem extrato, "sumiu um
 * crédito meu" é palavra contra palavra. É a tabela mais barata de criar agora e
 * a mais cara de reconstruir depois — dado que não foi gravado não volta.
 */
export const creditosDeMovimento = pgTable(
  "creditos_de_movimento",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    /** Positivo entra, negativo sai. */
    quantidade: smallint("quantidade").notNull(),
    motivo: text("motivo")
      .$type<"recarga_mensal" | "boas_vindas" | "avulso" | "pedido" | "estorno" | "ajuste">()
      .notNull(),
    pedidoId: uuid("pedido_id").references(() => pedidos.id, { onDelete: "set null" }),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [index("creditos_conta_idx").on(t.contaId, t.criadoEm)],
);

export type Pedido = typeof pedidos.$inferSelect;
export type Assinatura = typeof assinaturas.$inferSelect;
