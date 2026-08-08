import { sql } from "drizzle-orm";
import { index, integer, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { contas } from "./contas";
import { livros } from "./catalogo";
import { clubes } from "./clubes";

/**
 * SALA DE ESCUTA AO VIVO — ouvir junto, no mesmo segundo do áudio.
 *
 * ⚠️ **A regra que não pode se perder na migração: sala privada NÃO deixa
 * rastro.** É a promessa feita a quem abre uma sala "só eu e ela" — se o rastro
 * de uma sala privada aparecer no feed depois, a promessa foi quebrada e
 * ninguém vai perceber olhando o código do banco.
 *
 * ⚠️ As salas semeadas **andam com o relógio** (a posição avança sozinha para
 * parecer viva). Isso é simulação e **não se migra**.
 */
export const salas = pgTable(
  "salas",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    livroId: integer("livro_id")
      .notNull()
      .references(() => livros.id, { onDelete: "cascade" }),
    /** Quem abriu **manda**: só o anfitrião move a posição e tira gente. */
    anfitriaoId: uuid("anfitriao_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),

    /**
     * - `privada` — só quem for chamado. **Não deixa rastro.**
     * - `aberta` — qualquer um entra enquanto durar; aparece no feed e nos clubes.
     * - `marcada` — tem hora: é o evento de comunidade da §4.79.
     */
    porta: text("porta").$type<"privada" | "aberta" | "marcada">().notNull(),

    /** Quando a sala foi convocada de um clube — a *sessão de escuta* (§4.81). */
    clubeId: uuid("clube_id").references(() => clubes.id, { onDelete: "set null" }),
    /** Título de sessão marcada ("cap. 9 a 12, ao vivo"). */
    titulo: text("titulo"),
    /** Só para `marcada`: quando começa. */
    data: text("data"),
    hora: text("hora"),

    /**
     * Onde o áudio estava **no instante `marcoEm`**. Só o anfitrião muda.
     *
     * ⚠️ **Não leia este campo sozinho para mostrar na tela.** Ele é uma foto: a
     * posição de verdade é esta **mais** o tempo passado desde `marcoEm`. Sem o
     * marco, a sala ficava congelada no segundo em que foi aberta mesmo
     * "tocando" — defeito achado testando a primeira sala de verdade.
     */
    posicaoSegundos: integer("posicao_segundos").default(0).notNull(),
    marcoEm: timestamp("marco_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    tocando: text("tocando").$type<"sim" | "nao">().default("nao").notNull(),

    abertaEm: timestamp("aberta_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    /** Preenchido ao encerrar: daí em diante a sala é **rastro**, não é sala. */
    encerradaEm: timestamp("encerrada_em", { withTimezone: true }),
  },
  (t) => [index("salas_livro_idx").on(t.livroId), index("salas_clube_idx").on(t.clubeId)],
);

/**
 * Quem está na sala — e em que condição.
 *
 * Os quatro estados eram quatro listas soltas no front, e a distinção entre eles
 * foi cobrada caro:
 *
 * - `presente` — **está dentro agora**.
 * - `confirmado` — **pretende vir** (só sessão marcada). Misturar com `presente`
 *   fazia a agenda do clube mostrar "3 confirmados" contando quem já estava
 *   dentro — um número que não podia subir, porque não havia como confirmar.
 * - `convidado` — chamado e ainda não entrou. **Sem isto a sala privada não
 *   serve para nada**: ela é "só quem eu chamar".
 * - `barrado` — o anfitrião tirou. Não volta **enquanto a sala durar** — é
 *   decisão do momento e morre com a sala, diferente do banimento de clube, que
 *   atravessa ciclos.
 */
export const salaParticipantes = pgTable(
  "sala_participantes",
  {
    salaId: uuid("sala_id")
      .notNull()
      .references(() => salas.id, { onDelete: "cascade" }),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    situacao: text("situacao")
      .$type<"presente" | "confirmado" | "convidado" | "barrado" | "saiu">()
      .notNull(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.salaId, t.contaId] })],
);

/**
 * As falas do chat da sala.
 *
 * `posicaoSegundos` é **em que segundo do áudio a fala foi dita** — é este campo
 * que faz o **rastro** funcionar depois: encerrada a sala, a conversa continua
 * legível ancorada no livro, e não como um bate-papo solto sem contexto.
 *
 * ⚠️ Fala de sala **privada** não vira rastro. Ver o aviso do topo.
 */
export const salaFalas = pgTable(
  "sala_falas",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    salaId: uuid("sala_id")
      .notNull()
      .references(() => salas.id, { onDelete: "cascade" }),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    texto: text("texto").notNull(),
    /** O segundo do áudio em que a fala foi dita — a âncora do rastro. */
    posicaoSegundos: integer("posicao_segundos").notNull(),
    /** Momento real, só para desempatar falas no mesmo segundo. */
    ditaEm: timestamp("dita_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [index("sala_falas_sala_idx").on(t.salaId, t.posicaoSegundos)],
);

/* -------------------------------------------------------------------------- */
/* O que NÃO virou tabela                                                      */
/* -------------------------------------------------------------------------- */

/**
 * `allbook_sessoes_lembradas` (quais lembretes já foram mostrados) e
 * `allbook_rastro_ligado` **morrem inteiras**: a primeira é um paliativo da
 * falta de servidor — com servidor, lembrete é notificação. A segunda mora num
 * **componente** (`components/sala/RastroDaSessao.tsx`), e não numa lib, o que a
 * faz escapar de qualquer varredura por `client/src/lib`.
 */

export type Sala = typeof salas.$inferSelect;
export type FalaDaSala = typeof salaFalas.$inferSelect;
