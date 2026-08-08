import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import * as schema from "@shared/schema";

/**
 * A conexão com o Postgres.
 *
 * **Quem lê o `.env`:** o próprio Node (v20.12+ tem `process.loadEnvFile`), sem
 * pacote nenhum a mais. O arquivo é opcional — em produção as variáveis já vêm
 * do ambiente, e tentar carregá-lo lá quebraria a subida.
 */
try {
  process.loadEnvFile();
} catch {
  /* sem `.env` na pasta: as variáveis vêm do ambiente, como em produção */
}

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "Falta o DATABASE_URL. Copie o `.env.example` para `.env` " +
      "(`cp .env.example .env`) e confira se o Postgres está no ar: " +
      "`brew services list | grep postgres`.",
  );
}

/**
 * Um **pool** de conexões, não uma conexão só: cada pedido HTTP pega uma
 * emprestada e devolve. Com uma conexão única, dois pedidos ao mesmo tempo
 * ficariam em fila um atrás do outro.
 */
export const pool = new pg.Pool({ connectionString: url });

/**
 * O `db` que o resto do servidor usa.
 *
 * `schema` vai junto para as consultas com relação (`db.query.livros.findMany({
 * with: { autor: true } })`) saberem juntar as tabelas sozinhas.
 */
export const db = drizzle(pool, { schema });
