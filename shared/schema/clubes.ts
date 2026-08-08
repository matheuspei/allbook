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
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { contas } from "./contas";
import { generos, livros } from "./catalogo";

/**
 * CLUBES DE LEITURA — a turma, o ciclo, o mural, as rodadas, a votação e as
 * pautas.
 *
 * ⚠️ É o **caso máximo da armadilha do remendo** (2.10): hoje
 * `allbook_clubes` não guarda clubes — guarda *diferenças* ("entrei neste",
 * "renomeei aquele", "removi fulano") aplicadas por cima de clubes que vivem no
 * **código**, com ids como `misterio` e `exorcista`. Na migração, cada clube
 * semeado tem de virar linha **antes** de o remendo ser aplicado; senão a
 * entrada aponta para um clube que não existe, e ninguém vê erro — o clube
 * simplesmente some da lista da pessoa.
 *
 * ⚠️ E do **dono implícito** (2.11): `donoSlug` vale a constante `EU` quando o
 * clube é seu. `EU` não é ninguém no banco — vira o `id` da conta na migração.
 */

/* -------------------------------------------------------------------------- */
/* O clube                                                                     */
/* -------------------------------------------------------------------------- */

export const clubes = pgTable(
  "clubes",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    nome: text("nome").notNull(),
    descricao: text("descricao").default("").notNull(),
    donoId: uuid("dono_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    /** O gênero que dá a cara do clube — usado para sugerir. */
    generoSlug: text("genero_slug").references(() => generos.slug),

    /**
     * Quantas pessoas cabem. Vazio = sem limite.
     *
     * Pedido do Matheus (§4.40), e tem razão de produto: com quatro pessoas todo
     * mundo responde a todo mundo; com quarenta a conversa vira mural de avisos
     * e ninguém se sente responsável por aparecer.
     */
    limite: integer("limite"),

    /**
     * Clube fechado: **entrar depende do moderador**.
     *
     * Não confundir com `limite`: vaga controla *quantos*, isto controla *quem*.
     * A distinção importa porque o Matheus defendeu a privacidade da sala ao
     * vivo apoiado neste poder (§4.81) — e, ao conferir, ele **não existia**.
     */
    privado: boolean("privado").default(false).notNull(),

    /**
     * Clube ao vivo — a turma ouve junto, em sessões marcadas (§4.81).
     *
     * ⚠️ **Não é um segundo tipo de clube, é uma vocação**: tudo continua
     * existindo (rodada, mural, votação, estante), só muda o que a tela oferece
     * primeiro. Foi assim, e não com dois tipos separados, porque a §4.43 já
     * registrou o que acontece quando duas coisas parecidas viram entidades
     * diferentes — elas divergem, e o app passa a ter dois lugares para a mesma
     * pergunta.
     */
    aoVivo: boolean("ao_vivo").default(false).notNull(),

    criadoEm: timestamp("criado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [index("clubes_dono_idx").on(t.donoId)],
);

/**
 * Quem está no clube — **uma lista só**.
 *
 * ⚠️ Hoje os membros são "código + remendo": a turma vem semeada do arquivo e o
 * que a pessoa fez (entrou, saiu, foi removido) é uma correção guardada à parte.
 * No banco **a lista tem de ser uma só**, senão as duas discordam e ninguém
 * descobre até alguém sumir de uma tela e continuar na outra.
 *
 * `situacao` cobre a fila de espera (quando o `limite` encheu) e a fila de
 * aprovação (quando o clube é `privado`) — são estados da mesma relação, não
 * tabelas diferentes.
 */
export const clubeMembros = pgTable(
  "clube_membros",
  {
    clubeId: uuid("clube_id")
      .notNull()
      .references(() => clubes.id, { onDelete: "cascade" }),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    papel: text("papel").$type<"dono" | "moderador" | "membro">().default("membro").notNull(),
    situacao: text("situacao")
      .$type<"dentro" | "na_fila" | "aguardando_aprovacao" | "saiu" | "removido">()
      .default("dentro")
      .notNull(),
    entrouEm: timestamp("entrou_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.clubeId, t.contaId] }),
    index("clube_membros_conta_idx").on(t.contaId),
  ],
);

/* -------------------------------------------------------------------------- */
/* Ciclos — e a estante é a mesma tabela                                       */
/* -------------------------------------------------------------------------- */

/**
 * O ciclo: o livro da vez, quando começa e quando é o encontro.
 *
 * **A "estante" do clube não é uma tabela à parte** — é esta mesma, filtrada por
 * `terminadoEm` preenchido. No front são dois campos (`ciclo` e `estante`), e
 * separá-los aqui criaria duas verdades sobre o mesmo livro: o que está no ciclo
 * atual teria de ser copiado para a estante ao terminar, e cópia é onde o dado
 * racha.
 */
export const clubeCiclos = pgTable(
  "clube_ciclos",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    clubeId: uuid("clube_id")
      .notNull()
      .references(() => clubes.id, { onDelete: "cascade" }),
    livroId: integer("livro_id")
      .notNull()
      .references(() => livros.id, { onDelete: "cascade" }),
    inicio: date("inicio").notNull(),
    /** O encontro — quando a turma conversa sobre o livro inteiro. */
    encontro: date("encontro").notNull(),
    /** Preenchido = já foi para a estante. */
    terminadoEm: timestamp("terminado_em", { withTimezone: true }),
  },
  (t) => [index("clube_ciclos_clube_idx").on(t.clubeId, t.inicio)],
);

/**
 * Os marcos do ciclo ("até o capítulo 6, na terça").
 *
 * São **semanais** de propósito: clube existe para caber na vida de gente
 * ocupada, e a semana é a unidade em que as pessoas se organizam. Um marco por
 * dia vira cobrança; um só no fim, ninguém lê até a véspera.
 */
export const clubeMarcos = pgTable(
  "clube_marcos",
  {
    cicloId: uuid("ciclo_id")
      .notNull()
      .references(() => clubeCiclos.id, { onDelete: "cascade" }),
    numero: smallint("numero").notNull(),
    /** Até este capítulo, inclusive. */
    capitulo: integer("capitulo").notNull(),
    prazo: date("prazo").notNull(),
  },
  (t) => [primaryKey({ columns: [t.cicloId, t.numero] })],
);

/* -------------------------------------------------------------------------- */
/* Mural                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * As mensagens do mural do clube (`allbook_mural`).
 *
 * `capitulo` vazio = conversa geral (combinar horário, dar oi, falar da
 * narração), e aí todo mundo lê — a ausência tem significado, como na âncora do
 * comentário de livro.
 *
 * ⚠️ **A moderação hoje só vale neste aparelho**: ocultar uma mensagem esconde
 * ela para você. Com servidor vira **estado global** — é preciso decidir se a
 * moderação local de cada um migra ou zera, e a resposta não é óbvia: migrar
 * significa aplicar a todo mundo o que uma pessoa escondeu só para si.
 */
export const clubeMural = pgTable(
  "clube_mural",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    clubeId: uuid("clube_id")
      .notNull()
      .references(() => clubes.id, { onDelete: "cascade" }),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    texto: text("texto").notNull(),
    /** De que capítulo a mensagem fala. Vazio = conversa geral. */
    capitulo: integer("capitulo"),
    /** Marcado por quem escreveu **ou** pelo moderador. */
    spoiler: boolean("spoiler").default(false).notNull(),

    /** Trecho de áudio citado — a mesma peça da sala e do fórum (§4.45). */
    citacaoLivroId: integer("citacao_livro_id").references(() => livros.id, { onDelete: "set null" }),
    citacaoInicioSegundos: integer("citacao_inicio_segundos"),
    citacaoDuracaoSegundos: integer("citacao_duracao_segundos"),

    criadoEm: timestamp("criado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    /** Ocultado pela moderação do clube. Ver o aviso acima. */
    ocultadoEm: timestamp("ocultado_em", { withTimezone: true }),
    ocultadoPor: uuid("ocultado_por").references(() => contas.id, { onDelete: "set null" }),
  },
  (t) => [index("clube_mural_clube_idx").on(t.clubeId, t.criadoEm)],
);

/* -------------------------------------------------------------------------- */
/* Rodadas de conversa                                                         */
/* -------------------------------------------------------------------------- */

/** A pergunta da semana, com prazo — **e sem hora marcada** (§4.39). */
export const clubeRodadas = pgTable(
  "clube_rodadas",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    clubeId: uuid("clube_id")
      .notNull()
      .references(() => clubes.id, { onDelete: "cascade" }),
    pergunta: text("pergunta").notNull(),
    /** Até quando dá para responder. */
    fecha: date("fecha").notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    encerradaEm: timestamp("encerrada_em", { withTimezone: true }),
  },
  (t) => [index("clube_rodadas_clube_idx").on(t.clubeId, t.fecha)],
);

/** As respostas — **texto escrito pela pessoa**, então dói se sumir. */
export const clubeRodadaRespostas = pgTable(
  "clube_rodada_respostas",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    rodadaId: uuid("rodada_id")
      .notNull()
      .references(() => clubeRodadas.id, { onDelete: "cascade" }),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    texto: text("texto").notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [index("clube_respostas_rodada_idx").on(t.rodadaId)],
);

/* -------------------------------------------------------------------------- */
/* Votação do próximo livro                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A escolha do próximo livro do clube.
 *
 * ⚠️ **O efeito de uma votação encerrada é um ciclo novo** — hoje ele mora em
 * `allbook_clubes` enquanto o voto mora em `allbook_rodadas`: *"as duas migram
 * juntas ou o estado racha"*. Aqui elas já estão no mesmo banco, e encerrar uma
 * votação deve criar a linha em `clube_ciclos` na **mesma transação**.
 *
 * De 2 a 5 opções, com **3 sugerido**. O argumento é contraintuitivo e vale
 * lembrar: *com 5 opções e 8 pessoas, o vencedor sai com 3 votos* — cinco
 * pessoas ficam com um livro que não escolheram. Mais opção parece mais
 * democracia e é o contrário. O 5 só passou a caber porque quem perde agora tem
 * saída: funda o próprio clube (§4.58).
 */
export const clubeVotacoes = pgTable(
  "clube_votacoes",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    clubeId: uuid("clube_id")
      .notNull()
      .references(() => clubes.id, { onDelete: "cascade" }),
    fecha: date("fecha").notNull(),
    encerradaEm: timestamp("encerrada_em", { withTimezone: true }),
    /** O ciclo que nasceu do resultado. Ver o aviso acima. */
    cicloResultanteId: uuid("ciclo_resultante_id").references(() => clubeCiclos.id, {
      onDelete: "set null",
    }),
  },
  (t) => [index("clube_votacoes_clube_idx").on(t.clubeId)],
);

export const clubeVotacaoOpcoes = pgTable(
  "clube_votacao_opcoes",
  {
    votacaoId: uuid("votacao_id")
      .notNull()
      .references(() => clubeVotacoes.id, { onDelete: "cascade" }),
    livroId: integer("livro_id")
      .notNull()
      .references(() => livros.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.votacaoId, t.livroId] })],
);

/** Um voto por pessoa por votação — o `primaryKey` é quem garante. */
export const clubeVotos = pgTable(
  "clube_votos",
  {
    votacaoId: uuid("votacao_id")
      .notNull()
      .references(() => clubeVotacoes.id, { onDelete: "cascade" }),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    livroId: integer("livro_id")
      .notNull()
      .references(() => livros.id, { onDelete: "cascade" }),
    votadoEm: timestamp("votado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.votacaoId, t.contaId] })],
);

/* -------------------------------------------------------------------------- */
/* Pautas — voto ANÔNIMO                                                       */
/* -------------------------------------------------------------------------- */

/**
 * As pautas do clube: uma pergunta com 2 a 4 opções de texto ("mudamos o dia do
 * encontro?"). Uma opção não é escolha; cinco ninguém lê antes de votar.
 *
 * ⚠️ **O voto é anônimo por regra — "número aberto, nome fechado".** A tabela
 * `clube_pauta_votos` guarda quem votou (senão não há como impedir voto duplo),
 * **mas a API não pode expor quem votou em quê.** É a diferença entre um endpoint
 * que devolve contagens e um que devolve a lista: o segundo quebra a promessa
 * feita na tela sem nenhum erro aparecer.
 */
export const clubePautas = pgTable(
  "clube_pautas",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    clubeId: uuid("clube_id")
      .notNull()
      .references(() => clubes.id, { onDelete: "cascade" }),
    /** Até 140 caracteres. */
    pergunta: text("pergunta").notNull(),
    fecha: date("fecha").notNull(),
    criadaEm: timestamp("criada_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    encerradaEm: timestamp("encerrada_em", { withTimezone: true }),
  },
  (t) => [index("clube_pautas_clube_idx").on(t.clubeId)],
);

export const clubePautaOpcoes = pgTable(
  "clube_pauta_opcoes",
  {
    pautaId: uuid("pauta_id")
      .notNull()
      .references(() => clubePautas.id, { onDelete: "cascade" }),
    indice: smallint("indice").notNull(),
    /** Até 60 caracteres. */
    texto: text("texto").notNull(),
  },
  (t) => [primaryKey({ columns: [t.pautaId, t.indice] })],
);

/** ⚠️ Guarda quem votou só para impedir voto duplo. **Não expor na API.** */
export const clubePautaVotos = pgTable(
  "clube_pauta_votos",
  {
    pautaId: uuid("pauta_id")
      .notNull()
      .references(() => clubePautas.id, { onDelete: "cascade" }),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    indice: smallint("indice").notNull(),
    votadoEm: timestamp("votado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.pautaId, t.contaId] })],
);

/* -------------------------------------------------------------------------- */
/* Convites                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Convites para entrar num clube (`allbook_convites`).
 *
 * ⚠️ **Hoje a resposta do convidado é SIMULADA** — o esqueleto aceita sozinho,
 * porque não há para quem mandar. A simulação morre em produção: isto vira
 * relação entre duas contas, e **não se migra como está** (mesmo caso do
 * `allbook_seguidores`).
 */
export const clubeConvites = pgTable(
  "clube_convites",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    clubeId: uuid("clube_id")
      .notNull()
      .references(() => clubes.id, { onDelete: "cascade" }),
    deContaId: uuid("de_conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    paraContaId: uuid("para_conta_id")
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    estado: text("estado").$type<"pendente" | "aceito" | "recusado">().default("pendente").notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    respondidoEm: timestamp("respondido_em", { withTimezone: true }),
  },
  (t) => [
    unique("clube_convite_unico").on(t.clubeId, t.paraContaId),
    index("clube_convites_para_idx").on(t.paraContaId, t.estado),
  ],
);

export type Clube = typeof clubes.$inferSelect;
export type ClubeMembro = typeof clubeMembros.$inferSelect;
export type ClubeCiclo = typeof clubeCiclos.$inferSelect;
export type MensagemDoClube = typeof clubeMural.$inferSelect;
