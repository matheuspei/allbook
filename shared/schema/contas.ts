import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  json,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * CONTAS — quem é a pessoa, a senha dela, o perfil público e as preferências.
 *
 * Hoje nada disso existe de verdade: `lib/auth.ts` deixa **qualquer e-mail
 * entrar** e nunca guarda senha (decisão deliberada, porque não havia nada com
 * que conferir). Esta é a camada que transforma aquilo em conta.
 *
 * ⚠️ Duas armadilhas do `docs/BANCO-DE-DADOS.md` são resolvidas aqui, e as duas
 * quebram em silêncio se forem esquecidas:
 *
 * - **2.2 — sair passa a ter outro significado.** Hoje `signOut` apaga só a
 *   sessão, e a biblioteca fica: os dados são do *navegador*, e apagá-los faria
 *   a pessoa perder tudo por ter clicado em "Sair". Com conta, a biblioteca é da
 *   *conta* — e a migração de primeira entrada (o que estava no aparelho sobe
 *   para a conta recém-criada) tem de existir **junto**, não depois.
 * - **2.9 — o endereço do perfil precisa congelar.** Ver `username` abaixo.
 */

/* -------------------------------------------------------------------------- */
/* A conta                                                                     */
/* -------------------------------------------------------------------------- */

export const contas = pgTable(
  "contas",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    email: text("email").notNull().unique(),

    /**
     * A senha **cifrada** (hash), nunca em texto.
     *
     * `lib/auth.ts` diz hoje: "A senha nunca é guardada — nem aqui, nem em lugar
     * nenhum. Guardar senha em texto puro é um hábito ruim que ninguém lembra de
     * desfazer depois". A regra continua valendo: o que entra nesta coluna é o
     * resultado de um algoritmo de derivação (scrypt/argon2), do qual não se
     * volta para a senha original.
     */
    senhaHash: text("senha_hash").notNull(),

    /**
     * O endereço público da página: `/user/<username>`.
     *
     * ⚠️ **Escolhido uma vez e CONGELADO** (armadilha 2.9). Hoje ele é
     * `meuSlug()`, derivado do nome **na hora** — a pessoa muda o nome e todo
     * link que ela já compartilhou morre calado, sem erro nenhum. Aqui vira
     * coluna própria: nasce a partir do nome (mesma regra do `meuSlug()`), e daí
     * em diante só muda se a pessoa pedir.
     *
     * O `unique` é a outra metade da armadilha: sem contas, num empate com um
     * leitor fictício "o seu endereço simplesmente ganha" — regra que não se
     * sustenta quando duas pessoas de verdade se chamam Matheus.
     */
    username: text("username").notNull().unique(),

    nome: text("nome").notNull(),

    /**
     * A foto. Hoje é uma **data URL** reduzida a 256px, guardada dentro do
     * `localStorage` porque não havia onde subir arquivo. Com servidor, esta
     * coluna passa a guardar o **caminho do arquivo enviado** — a conversão faz
     * parte da migração, senão cada perfil carrega uns 40 KB de base64 no meio
     * de toda consulta.
     */
    foto: text("foto"),

    /** Texto livre, no máximo 300 caracteres (`MAX_BIO` de `lib/profile.ts`). */
    bio: text("bio").default("").notNull(),

    criadoEm: timestamp("criado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    /** Última entrada — o `since` da sessão de hoje, que era só informativo. */
    entrouEm: timestamp("entrou_em", { withTimezone: true }),
  },
  (t) => [index("contas_username_idx").on(t.username)],
);

/* -------------------------------------------------------------------------- */
/* Preferências                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Os ajustes de `lib/settings.ts`, uma linha por conta.
 *
 * ⚠️ **Preferência é da conta ou do aparelho?** A pergunta está no checklist e
 * a resposta não é a mesma para todas: velocidade de leitura e privacidade
 * seguem a pessoa entre celulares (**conta**, e por isso estão aqui); "baixar só
 * no Wi-Fi" e o modo de ver a Biblioteca são do **aparelho** e ficam no
 * navegador mesmo — sincronizá-los seria mudar o comportamento do celular de
 * alguém a partir do tablet dela.
 *
 * ⚠️ **Três destas colunas filtram a API, não a tela** (§4.55 do ROTEIRO):
 * `mostrarOuvindoAgora`, `mostrarMeusComentarios` e `mostrarMeusClubes`. Se o
 * servidor mandar o dado e o front esconder, o dado **vazou** — quem abrir a
 * resposta da rede vê tudo.
 */
export const ajustes = pgTable("ajustes", {
  contaId: uuid("conta_id")
    .primaryKey()
    .references(() => contas.id, { onDelete: "cascade" }),

  /** Velocidade inicial do player. Um dos degraus de `SPEED_PRESETS`. */
  velocidade: real("velocidade").default(1.0).notNull(),

  /* --- vitrine da página pública: filtram a API (ver acima) --- */
  mostrarOuvindoAgora: boolean("mostrar_ouvindo_agora").default(true).notNull(),
  mostrarMeusClubes: boolean("mostrar_meus_clubes").default(true).notNull(),
  mostrarMeusComentarios: boolean("mostrar_meus_comentarios").default(true).notNull(),
  mostrarQuemAcompanho: boolean("mostrar_quem_acompanho").default(true).notNull(),

  /**
   * Conta privada: quem quiser seguir precisa da aprovação da pessoa.
   * **Nasce desligada**, por decisão do Matheus em 29/07 — no começo o app
   * precisa de circulação, e quem quer se fechar acha o interruptor.
   */
  contaPrivada: boolean("conta_privada").default(false).notNull(),

  /**
   * Presença por capítulo ("está no cap. 12").
   * **Nasce desligada, e isso foi condição** (§4.58): o mecanismo é recíproco —
   * quem não mostra, não vê —, e reciprocidade pressiona. Escolher ligar tem de
   * ser um ato. A granularidade é grossa de propósito: capítulo, **nunca** ao
   * vivo, porque presença ao vivo revela rotina.
   */
  mostrarMeuCapitulo: boolean("mostrar_meu_capitulo").default(false).notNull(),

  /* --- avisos do sino (§4.92) --- */
  avisarCurtidas: boolean("avisar_curtidas").default(true).notNull(),
  avisarComentarios: boolean("avisar_comentarios").default(true).notNull(),

  /** "Estúdio" (escuro, padrão) ou "Tinta" (claro). Ver `lib/tema.ts`. */
  tema: text("tema").$type<"escuro" | "claro">().default("escuro").notNull(),

  /**
   * A meta semanal de audição, em minutos (`allbook_weekly_goal`). Padrão: 180
   * — 3h por semana ≈ 25 min por dia, um hábito que se sustenta.
   *
   * No navegador ela mora numa chave **separada** dos ajustes de propósito, para
   * "um ajuste não esbarrar no outro" (dois JSONs grandes gravados ao mesmo
   * tempo se sobrescrevem). No banco esse motivo desaparece: colunas se atualizam
   * uma a uma, então ela pode morar aqui sem risco.
   */
  metaSemanalMinutos: integer("meta_semanal_minutos").default(180).notNull(),
});

/* -------------------------------------------------------------------------- */
/* Redefinição de senha                                                        */
/* -------------------------------------------------------------------------- */

/**
 * O "Esqueci minha senha".
 *
 * ⚠️ **Armadilha 2.3, e é literalmente o caso que o Matheus temia:** o link foi
 * **removido** do `pages/Login.tsx` em 25/07 (§4.23) porque não existia senha
 * para recuperar. Com esta tabela ele deixa de ser mentira — e **precisa voltar
 * à tela**, senão fica um botão que sumiu e ninguém lembra de repor.
 *
 * O que se guarda é o **hash** do token, não ele: quem vazar o banco não pode
 * entrar na conta de ninguém com o que leu.
 */
export const redefinicoesDeSenha = pgTable(
  "redefinicoes_de_senha",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiraEm: timestamp("expira_em", { withTimezone: true }).notNull(),
    usadoEm: timestamp("usado_em", { withTimezone: true }),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [index("redefinicoes_conta_idx").on(t.contaId)],
);

/* -------------------------------------------------------------------------- */
/* Sessões                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * A tabela de sessões do `connect-pg-simple` (o pacote já está instalado).
 *
 * **Está declarada aqui só para o `drizzle-kit push` não querer apagá-la**: o
 * push compara o esquema com o banco, e tabela que ele não conhece vira
 * candidata a DROP. O formato (nomes e tipos) é o que o pacote espera — mudar
 * qualquer coluna quebra o login de todo mundo de uma vez.
 */
export const session = pgTable(
  "session",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire", { precision: 6 }).notNull(),
  },
  (t) => [index("IDX_session_expire").on(t.expire)],
);

export type Conta = typeof contas.$inferSelect;
export type ContaNova = typeof contas.$inferInsert;
export type Ajustes = typeof ajustes.$inferSelect;
