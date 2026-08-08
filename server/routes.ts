import type { Express } from "express";
import { type Server } from "http";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { sql } from "drizzle-orm";

import { db } from "./db";
import { registrarAudio } from "./audio";
import { registrarContas } from "./contas";
import { registrarDados } from "./dados";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // As rotas do app vão aqui, todas com o prefixo /api.
  // Quem fala com o banco usa `storage` (server/storage.ts) ou `db` (server/db.ts).

  // Contas: cadastrar, entrar, sair, "esqueci minha senha" (§4.120).
  // Vem primeiro porque instala a sessão e o Passport, que as rotas seguintes
  // podem querer usar para saber quem está pedindo.
  registrarContas(app);

  // Os dados da pessoa: biblioteca, progresso, diário, notas, marcações e
  // trechos (§4.121). Depende da sessão instalada logo acima.
  registrarDados(app);

  // A entrega do áudio: a lista de reprodução e os pedaços (§4.130). Também
  // depende da sessão — sem conta, nenhum byte de narração sai daqui.
  registrarAudio(app);

  /**
   * O banco está de pé? (08/08, §4.119)
   *
   * Existe por um motivo concreto: nenhuma tela lê do banco ainda, então sem
   * esta rota não haveria **nenhuma** forma de descobrir que o Postgres caiu —
   * o app continuaria funcionando pelo `localStorage` e o erro só apareceria
   * meses depois, na primeira tela que dependesse dele.
   *
   * Abra `http://localhost:3000/api/banco/saude`. Se não responder, o serviço
   * caiu: `brew services start postgresql@17`.
   */
  app.get("/api/banco/saude", async (_req, res) => {
    try {
      const [contagem] = await db
        .select({ livros: sql<number>`count(*)::int` })
        .from(sql`livros`);
      return res.json({ ok: true, livros: contagem.livros });
    } catch (erro) {
      return res
        .status(503)
        .json({ ok: false, erro: erro instanceof Error ? erro.message : String(erro) });
    }
  });

  /**
   * Respostas das folhas de proposta.
   *
   * As folhas `client/public/_*.html` são o instrumento de decisão do Matheus.
   * Pedido dele em 01/08: decidir **clicando na própria folha** e apertando
   * "Enviar" — sem ditar números nem copiar texto. O clique cai aqui e vira
   * `_respostas-de-folhas/<folha>.json` na raiz do projeto, que a janela do
   * Claude lê em seguida.
   *
   * A pasta fica na raiz de propósito: fora de `client/public`, para a
   * gravação não fazer o Vite recarregar a folha que ele ainda está olhando.
   */
  app.post("/api/folha/respostas", async (req, res) => {
    const nome = String(req.body?.folha ?? "")
      .replace(/[^a-zA-Z0-9-]/g, "")
      .slice(0, 80);
    if (!nome) {
      return res.status(400).json({ ok: false, erro: "faltou o nome da folha" });
    }
    const pasta = path.resolve(process.cwd(), "_respostas-de-folhas");
    await mkdir(pasta, { recursive: true });
    await writeFile(
      path.join(pasta, `${nome}.json`),
      JSON.stringify(
        { ...req.body, recebidoEm: new Date().toISOString() },
        null,
        2,
      ),
    );
    return res.json({ ok: true });
  });

  /**
   * Qualquer `/api/...` que chegue aqui não existe.
   *
   * ⚠️ **Sem isto, um endereço `/api` errado devolvia a PÁGINA DO APP com
   * HTTP 200** — porque tanto o Vite (desenvolvimento) quanto o `serveStatic`
   * (produção) mandam tudo o que não reconhecem para o `index.html`, que é o
   * certo para as rotas de tela. Apareceu testando a travessia de caminho do
   * áudio (08/08, §4.130): `/api/audio/1/....//mestres/…` respondeu 200, e por
   * um instante pareceu vazamento do arquivo-mestre — era HTML.
   *
   * Não era falha de segurança, mas é uma armadilha de diagnóstico cara: um
   * `fetch` para uma rota que não existe recebe 200 e um HTML, e quebra na hora
   * de ler o JSON, longe da causa. Precisa vir **depois** de todas as rotas
   * `/api` e **antes** do Vite, que é exatamente aqui.
   */
  app.use("/api", (req, res) => {
    res.status(404).json({ erro: `Não existe a rota ${req.method} /api${req.path}` });
  });

  return httpServer;
}
