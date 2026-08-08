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
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { contas } from "./contas";
import { livros, pessoas } from "./catalogo";

/**
 * BIBLIOTECA E AUDIÇÃO — o que a pessoa guardou, onde ela parou, o que ouviu, o
 * que marcou e o que cortou.
 *
 * É a camada que **mais dói se sumir**, e por isso é a primeira da migração de
 * dados de usuário (§4 do checklist). Dentro dela a ordem também não é
 * arbitrária: `marcacoes` e `trechos_guardados` guardam **texto escrito pela
 * pessoa** — perder uma nota é perder trabalho dela, não uma preferência que se
 * refaz num toque.
 */

/* -------------------------------------------------------------------------- */
/* Minha lista                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * A "Minha lista" (`allbook_library`).
 *
 * Guarda só o **id do livro**, nunca uma cópia do título, do autor ou da capa —
 * o formato antigo copiava o livro inteiro e a URL da capa muda a cada build do
 * Vite, então a cópia envelhecia e a Biblioteca mostrava capa quebrada. A tabela
 * repete a lição de propósito.
 */
export const biblioteca = pgTable(
  "biblioteca",
  {
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    livroId: integer("livro_id")
      .notNull()
      .references(() => livros.id, { onDelete: "cascade" }),
    adicionadoEm: timestamp("adicionado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.contaId, t.livroId] })],
);

/* -------------------------------------------------------------------------- */
/* Downloads                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Os livros baixados (`allbook_downloads`).
 *
 * ⚠️ **É do aparelho, não da conta** — o arquivo está *naquele* celular.
 * Sincronizar cegamente faria o tablet de alguém anunciar como "baixado" um
 * arquivo que só existe no celular dela. Por isso a chave inclui `aparelho`: o
 * servidor sabe **onde** cada cópia está, e a lista que a pessoa vê é a do
 * aparelho em que ela está.
 *
 * ⚠️ Hoje **nenhum byte é gravado** — `allbook_downloads` é só uma marca. O
 * download de verdade fica **só no app**, nunca no navegador: no navegador o
 * arquivo cai no disco da pessoa, e aí não há proteção nenhuma.
 */
export const downloads = pgTable(
  "downloads",
  {
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    livroId: integer("livro_id")
      .notNull()
      .references(() => livros.id, { onDelete: "cascade" }),
    /** Identificador do celular/tablet. Ver o aviso acima. */
    aparelho: text("aparelho").notNull(),
    baixadoEm: timestamp("baixado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.contaId, t.livroId, t.aparelho] })],
);

/* -------------------------------------------------------------------------- */
/* Onde parou                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * O progresso de cada livro começado (`allbook_playback` + `allbook_finished`).
 *
 * ⚠️ **A posição é em segundos, e isso é uma bomba-relógio conhecida**
 * (armadilha 2.5): quando o áudio de verdade entrar, as durações mudam — e se a
 * vinheta de abertura tiver 8s, **toda posição já salva aponta 8 segundos fora
 * do lugar**. Não dá erro nenhum; só faz todo mundo retomar torto. A conversão
 * usa `livros.vinhetaSegundos` e tem de rodar na mesma migração que trouxer o
 * áudio.
 *
 * `concluidoEm` existe separado da posição porque o app sabia que um livro
 * *está* concluído (basta olhar a posição), mas não *quando* — e sem a data não
 * dá para dizer "você terminou 3 livros em julho". Um livro conta como concluído
 * acima de 95% (era 98%, e baixou porque audiolivro termina em créditos e
 * agradecimentos que quase ninguém ouve).
 */
export const progresso = pgTable(
  "progresso",
  {
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    livroId: integer("livro_id")
      .notNull()
      .references(() => livros.id, { onDelete: "cascade" }),
    posicaoSegundos: integer("posicao_segundos").default(0).notNull(),
    /** Capítulo em que a pessoa está, começando em 1. */
    capitulo: integer("capitulo").default(1).notNull(),
    /**
     * A duração que o player usou para calcular a porcentagem.
     *
     * ⚠️ **Não é a mesma coisa que `livros.duracaoSegundos`, e por isso mora
     * aqui.** Hoje a duração é *estimada* pelo número de páginas; quando o áudio
     * real entrar, a do livro passa a ser medida — e guardar a que valia na hora
     * é o que permite saber que uma porcentagem antiga foi calculada sobre outra
     * régua, em vez de a barra de progresso simplesmente pular de lugar.
     */
    duracaoSegundos: integer("duracao_segundos").default(0).notNull(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    /** Quando cruzou os 95%. Vazio = ainda em andamento. */
    concluidoEm: timestamp("concluido_em", { withTimezone: true }),
  },
  (t) => [
    primaryKey({ columns: [t.contaId, t.livroId] }),
    index("progresso_conta_idx").on(t.contaId, t.atualizadoEm),
  ],
);

/* -------------------------------------------------------------------------- */
/* Diário de audição                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Quanto tempo a pessoa ouviu (`allbook_listening`) — a base das Estatísticas.
 *
 * ⚠️ **São TRÊS tabelas, e não uma, por um motivo apurado ao ligar de verdade
 * (08/08, §4.121).** A primeira versão tinha uma tabela só, com chave
 * `(dia, hora, livro)` — o que parece mais normalizado e é **errado**: o app
 * nunca soube qual livro foi ouvido em qual hora. O diário guarda
 * `{ sec, horas: {hora→seg}, livros: {id→seg} }`, ou seja, **dois recortes
 * independentes do mesmo total**. Uma tabela cruzada obrigaria a inventar o
 * cruzamento na migração, e inventar dado é exatamente o que este projeto não
 * faz — números plantados que ninguém depois sabe que foram plantados.
 *
 * `audicaoDia` é o total (a régua da meta semanal), `audicaoPorHora` dá o
 * "horário preferido" e `audicaoPorLivro` dá o ranking de livros.
 *
 * ⚠️ **`exemplo` marca o histórico semeado**, e é a razão de a chave
 * `allbook_listening_seeded` existir. **Semeadura tem de morrer em produção**:
 * usuário novo que recebe um histórico que não é dele vê números bonitos e
 * falsos. Em produção esta coluna é sempre `false`.
 *
 * (O teto de 120s por avanço, que impede um arraste na barra de creditar horas
 * que ninguém ouviu, continua sendo regra de quem **escreve** aqui.)
 */
export const audicaoDia = pgTable(
  "audicao_dia",
  {
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    /** Dia local da pessoa, em ISO curto ("2026-08-08"). */
    dia: text("dia").notNull(),
    segundos: integer("segundos").default(0).notNull(),
    /** Veio do histórico de demonstração? Ver o aviso acima. */
    exemplo: boolean("exemplo").default(false).notNull(),
  },
  (t) => [primaryKey({ columns: [t.contaId, t.dia] })],
);

/** Segundos por hora do dia (0–23) — daqui sai o "horário preferido". */
export const audicaoPorHora = pgTable(
  "audicao_por_hora",
  {
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    dia: text("dia").notNull(),
    hora: smallint("hora").notNull(),
    segundos: integer("segundos").default(0).notNull(),
  },
  (t) => [primaryKey({ columns: [t.contaId, t.dia, t.hora] })],
);

/** Segundos por livro naquele dia — daqui sai o ranking de mais ouvidos. */
export const audicaoPorLivro = pgTable(
  "audicao_por_livro",
  {
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    dia: text("dia").notNull(),
    livroId: integer("livro_id")
      .notNull()
      .references(() => livros.id, { onDelete: "cascade" }),
    segundos: integer("segundos").default(0).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.contaId, t.dia, t.livroId] }),
    index("audicao_livro_idx").on(t.contaId, t.livroId),
  ],
);

/* -------------------------------------------------------------------------- */
/* Marcações — TEXTO DA PESSOA                                                 */
/* -------------------------------------------------------------------------- */

/**
 * As marcações do tocador (`allbook_bookmarks`): um ponto no áudio, com nota.
 *
 * ⚠️ **Prioridade máxima de sincronização.** É uma das duas chaves com texto
 * escrito pela pessoa — perder uma nota é perder trabalho dela. Deve ser das
 * primeiras a sincronizar e a que mais merece exportação antes da migração.
 *
 * `capitulo` fica guardado junto, e não recalculado na leitura, como já é hoje.
 */
export const marcacoes = pgTable(
  "marcacoes",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    livroId: integer("livro_id")
      .notNull()
      .references(() => livros.id, { onDelete: "cascade" }),
    posicaoSegundos: integer("posicao_segundos").notNull(),
    capitulo: integer("capitulo").default(1).notNull(),
    /** Vazia é o normal: marcar é um toque só. */
    nota: text("nota").default("").notNull(),
    /**
     * O id que a marcação tem **no navegador** (`"7-1200"`, ou um sorteado).
     *
     * ⚠️ **Sem esta coluna a sincronização DUPLICA cada marcação.** O navegador
     * guarda o seu id; o banco gera outro. Na volta, o front veria um item com
     * id diferente, não reconheceria que é o mesmo, e ficaria com dois — e a
     * cada nova sincronização, mais um. Guardar o id de lá é o que mantém a
     * identidade dos dois lados. Vale igual para `trechos_guardados`.
     */
    idLocal: text("id_local"),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [
    index("marcacoes_conta_livro_idx").on(t.contaId, t.livroId),
    unique("marcacoes_id_local").on(t.contaId, t.idLocal),
  ],
);

/* -------------------------------------------------------------------------- */
/* Trechos guardados — TEXTO DA PESSOA, e a nota é privada                     */
/* -------------------------------------------------------------------------- */

/**
 * Os trechos cortados no player (`allbook_trechos_guardados`) — a peça que
 * circula: a mesma citação vale na sala do livro, no mural do clube, no fórum e
 * no feed. Um mecanismo, não quatro parecidos (a lição que a §4.40 cobrou caro).
 *
 * ⚠️ **A `nota` é privada por construção** (§4.49): hoje `comoCitacao()` a
 * remove antes de o trecho ir para qualquer lugar público. **No banco, essa
 * separação vale na API, não só na tela** — se o servidor mandar a nota junto e
 * o front esconder, o lembrete particular de alguém já saiu pela rede.
 *
 * A duração respeita o teto de 40 segundos (`MAX_CITACAO_SEC`) e o piso de 3.
 */
export const trechosGuardados = pgTable(
  "trechos_guardados",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    livroId: integer("livro_id")
      .notNull()
      .references(() => livros.id, { onDelete: "cascade" }),
    inicioSegundos: integer("inicio_segundos").notNull(),
    duracaoSegundos: integer("duracao_segundos").notNull(),
    /** Até 140 caracteres. **Nunca sai numa resposta pública.** */
    nota: text("nota"),
    /** O id do trecho no navegador. Ver o aviso em `marcacoes.idLocal`. */
    idLocal: text("id_local"),
    guardadoEm: timestamp("guardado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [
    index("trechos_conta_idx").on(t.contaId, t.guardadoEm),
    unique("trechos_id_local").on(t.contaId, t.idLocal),
  ],
);

/* -------------------------------------------------------------------------- */
/* Narrações                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * As narrações de um livro — o mesmo título pode ter mais de uma voz.
 *
 * `principal` é a narração com que o livro entrou no catálogo; `pedido` foi
 * produzida depois, porque **alguém pediu** — e é a ideia central do AllBook.
 * Ver as duas no mesmo lugar é o que explica ao leitor por que existem duas.
 */
export const narracoes = pgTable(
  "narracoes",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    livroId: integer("livro_id")
      .notNull()
      .references(() => livros.id, { onDelete: "cascade" }),
    pessoaSlug: text("pessoa_slug")
      .notNull()
      .references(() => pessoas.slug),
    origem: text("origem").$type<"principal" | "pedido">().default("principal").notNull(),
    arquivoMestre: text("arquivo_mestre"),
    duracaoSegundos: integer("duracao_segundos"),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [index("narracoes_livro_idx").on(t.livroId)],
);

/** Qual voz a pessoa escolheu para cada livro (`allbook_narration_choice`). */
export const narracaoEscolhida = pgTable(
  "narracao_escolhida",
  {
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    livroId: integer("livro_id")
      .notNull()
      .references(() => livros.id, { onDelete: "cascade" }),
    narracaoId: uuid("narracao_id")
      .notNull()
      .references(() => narracoes.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.contaId, t.livroId] })],
);

/* -------------------------------------------------------------------------- */
/* Conquistas                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Os troféus ganhos e **a data de cada um** (`allbook_achievements_won`).
 *
 * Só o que foi conquistado vira linha — a lista de troféus possíveis continua
 * sendo código (`lib/achievements.ts`), porque é regra do produto, não dado da
 * pessoa. `chave` é o id do troféu lá.
 */
export const conquistas = pgTable(
  "conquistas",
  {
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    chave: text("chave").notNull(),
    ganhoEm: timestamp("ganho_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.contaId, t.chave] })],
);

export type ItemDaBiblioteca = typeof biblioteca.$inferSelect;
export type Progresso = typeof progresso.$inferSelect;
export type Marcacao = typeof marcacoes.$inferSelect;
export type TrechoGuardado = typeof trechosGuardados.$inferSelect;
export type Narracao = typeof narracoes.$inferSelect;
