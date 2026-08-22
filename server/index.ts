import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import {
  confiarNoProxy,
  cabecalhosDeSeguranca,
  permissoesDoNavegador,
} from "./seguranca";

const app = express();

/*
 * Segurança antes de tudo o mais — §4.135 do ROTEIRO.
 *
 * A ordem importa: `trust proxy` tem de valer antes de qualquer rota ler
 * `req.ip` ou gravar cookie, e os cabeçalhos têm de sair também nas respostas
 * de erro, que nascem do primeiro middleware que falhar.
 */
const saltosDeProxy = confiarNoProxy(app);
app.use(cabecalhosDeSeguranca());
app.use(permissoesDoNavegador());

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const httpServer = createServer(app);
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "3000", 10);

  /*
   * **Escuta em toda a rede local, não só em `127.0.0.1`** (26/07).
   *
   * Com `127.0.0.1` o servidor só atendia a própria máquina — abrir
   * `http://<ip-da-máquina>:3000` no celular dava "não foi possível conectar".
   * E testar no celular de verdade é a única forma de ver coisas que o
   * navegador do computador não reproduz: o **teclado** subindo (ou não) ao
   * focar um campo, o toque, o tamanho real da tela (ver ROTEIRO 4.37).
   *
   * `HOST` permite voltar a fechar quando se quiser: `HOST=127.0.0.1`.
   * Isto vale para **desenvolvimento na rede de casa**; em produção o servidor
   * fica atrás de um proxy, que é quem cuida do que fica exposto.
   */
  const host = process.env.HOST || "0.0.0.0";
  httpServer.listen(port, host, () => {
    log(`serving on port ${port} (host ${host})`);
    log(
      saltosDeProxy
        ? `confiando em ${saltosDeProxy} proxy — req.ip vem do X-Forwarded-For`
        : "sem proxy — req.ip é a conexão direta",
      "seguranca",
    );
  });
})();
