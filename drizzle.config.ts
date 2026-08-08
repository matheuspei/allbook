import { defineConfig } from "drizzle-kit";

/**
 * O `drizzle-kit` não lê o `.env` sozinho — quem lê é o Node (v20.12+), sem
 * pacote nenhum a mais. Sem esta linha, o `npm run db:push` reclamaria de
 * `DATABASE_URL` vazio mesmo com o arquivo ali do lado.
 */
try {
  process.loadEnvFile();
} catch {
  /* sem `.env`: as variáveis vêm do ambiente */
}

/**
 * Configuração do Drizzle Kit — a ferramenta que lê o esquema em
 * `shared/schema/` e cria (ou altera) as tabelas de verdade no Postgres.
 *
 * **Este arquivo não existia**, e por isso o `npm run db:push` do `package.json`
 * quebrava desde sempre. Ele nasce junto com o banco (08/08, ROTEIRO §4.119).
 *
 * O esquema é uma **pasta**, um arquivo por assunto, não um `schema.ts` só: o
 * app tem 61 chaves de dados e um arquivo único passaria de duas mil linhas,
 * onde ninguém acha nada. O `./shared/schema/index.ts` reexporta tudo, então
 * `import { livros } from "@shared/schema"` continua valendo.
 */
export default defineConfig({
  out: "./drizzle",
  schema: "./shared/schema/*.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  /** Mostra o SQL que vai rodar — útil para conferir o que o push mudou. */
  verbose: true,
  /**
   * `strict` fica **desligado de propósito**: ligado, todo `db:push` para e
   * espera um "sim" digitado no terminal — e comando que trava esperando
   * resposta é comando que a sessão do Claude não consegue rodar. A proteção
   * que importa continua de pé: o push mostra o SQL antes, e mudança
   * destrutiva de verdade (apagar coluna com dado) ele pergunta de qualquer
   * jeito.
   */
  strict: false,
});
