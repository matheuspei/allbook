/**
 * O uso do áudio — a tabela que existe para **barrar raspagem em escala**.
 *
 * ---
 *
 * ## Por que uma tabela, e não só um contador na memória (08/08, §4.130)
 *
 * A §4.34 separou três objetivos que costumam ser confundidos, e disse qual
 * deles é o que importa: **impedir a cópia em escala**. Uma pessoa gravando um
 * livro para si não machuca o AllBook; **mil títulos saindo pela mesma conta em
 * duas horas**, sim — é o concorrente levando o acervo que custou caro produzir.
 *
 * A defesa mais barata contra isso não é criptografia: é **contar quantos livros
 * distintos uma conta abriu por dia**. E esse número precisa **sobreviver ao
 * reinício do servidor**, senão quem raspa só precisa esperar o próximo deploy.
 * Por isso é tabela, e não uma variável.
 *
 * ⚠️ **O que NÃO é gravado aqui, de propósito:** cada segmento servido. Um livro
 * de 10h são ~6.000 segmentos; gravar um por um seriam 6.000 escritas para
 * alguém simplesmente ouvir um livro. A rajada curta é barrada em memória (ver
 * `server/audio.ts`); o banco guarda só a **abertura**, que é uma linha por
 * livro por dia — e é justamente o número que denuncia raspagem.
 */

import { sql } from "drizzle-orm";
import { index, integer, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { livros } from "./catalogo";
import { contas } from "./contas";

export const audioAcessos = pgTable(
  "audio_acessos",
  {
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    /** Dia local da pessoa, em ISO curto ("2026-08-08") — como `audicaoDia`. */
    dia: text("dia").notNull(),
    livroId: integer("livro_id")
      .notNull()
      .references(() => livros.id, { onDelete: "cascade" }),
    /**
     * Quantas vezes a lista de reprodução foi pedida naquele dia.
     *
     * Um número alto aqui **não** é suspeito sozinho — o player repede a lista
     * ao retomar, e quem ouve em duas sessões abre duas vezes. O sinal que
     * importa é quantas **linhas** a conta tem no dia, não o valor da coluna.
     */
    aberturas: integer("aberturas").default(1).notNull(),
    primeiroEm: timestamp("primeiro_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    ultimoEm: timestamp("ultimo_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.contaId, t.dia, t.livroId] }),
    // A pergunta que a rota faz a cada abertura: quantos livros esta conta já
    // abriu hoje? Sem o índice, ela varre a tabela inteira a cada play.
    index("audio_acessos_conta_dia_idx").on(t.contaId, t.dia),
  ],
);
