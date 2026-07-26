import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";
import { randomUUID } from "node:crypto";

const viteLogger = createLogger();

export async function setupVite(server: Server, app: Express) {
  /*
   * `server: serverOptions` **substitui inteiro** o bloco `server` do
   * `vite.config.ts` — não funde. Por isso a lista de hosts precisa ser lida de
   * lá e repassada aqui; escrevê-la de novo (era o caso até 26/07) criava uma
   * segunda fonte da verdade que ninguém lembra de atualizar. Foi exatamente o
   * que aconteceu: liberar `.trycloudflare.com` no `vite.config.ts` não teve
   * efeito nenhum, porque esta linha continuava mandando.
   */
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: viteConfig.server?.allowedHosts ?? ["localhost", "127.0.0.1"],
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use("/{*path}", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${randomUUID()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}