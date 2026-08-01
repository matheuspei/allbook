import type { Express } from "express";
import { type Server } from "http";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.createUser(user) or storage.getUserByUsername(username)

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

  return httpServer;
}
