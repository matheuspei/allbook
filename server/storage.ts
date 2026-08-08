import { eq } from "drizzle-orm";

import { contas, type Conta, type ContaNova } from "@shared/schema";
import { db } from "./db";

/**
 * A porta de entrada do servidor para o banco.
 *
 * **O que era aqui antes:** `MemStorage`, uma lista na memória com três métodos
 * — *"some quando o servidor desliga"* (armadilha 2.8 do
 * `docs/BANCO-DE-DADOS.md`). Ela foi trocada pelo Postgres de verdade em 08/08
 * (§4.119), **antes** de qualquer dado de usuário passar por aqui, que era
 * exatamente o que o checklist mandava.
 *
 * A interface fica: quem chama não precisa saber de onde o dado vem, e trocar o
 * banco de lugar não mexe em quem usa.
 */
export interface IStorage {
  getConta(id: string): Promise<Conta | undefined>;
  getContaPorEmail(email: string): Promise<Conta | undefined>;
  getContaPorUsername(username: string): Promise<Conta | undefined>;
  criarConta(conta: ContaNova): Promise<Conta>;
}

export class PgStorage implements IStorage {
  async getConta(id: string): Promise<Conta | undefined> {
    const [conta] = await db.select().from(contas).where(eq(contas.id, id)).limit(1);
    return conta;
  }

  async getContaPorEmail(email: string): Promise<Conta | undefined> {
    const [conta] = await db
      .select()
      .from(contas)
      .where(eq(contas.email, email.trim().toLowerCase()))
      .limit(1);
    return conta;
  }

  /** O endereço público `/user/<username>`. Ver a armadilha 2.9. */
  async getContaPorUsername(username: string): Promise<Conta | undefined> {
    const [conta] = await db.select().from(contas).where(eq(contas.username, username)).limit(1);
    return conta;
  }

  async criarConta(conta: ContaNova): Promise<Conta> {
    const [criada] = await db.insert(contas).values(conta).returning();
    return criada;
  }
}

export const storage = new PgStorage();
