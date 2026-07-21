/**
 * Build de producao.
 *
 * Gera duas coisas dentro de dist/:
 *   dist/public/   -> o frontend, montado pelo Vite (server/static.ts serve daqui)
 *   dist/index.cjs -> o servidor Express empacotado (npm start roda este arquivo)
 */
import { build as viteBuild } from "vite";
import { build as esbuild } from "esbuild";

async function main() {
  console.log("[build] montando o frontend com o Vite...");
  await viteBuild();

  console.log("[build] empacotando o servidor com o esbuild...");
  await esbuild({
    entryPoints: ["server/index.ts"],
    outfile: "dist/index.cjs",
    bundle: true,
    platform: "node",
    target: "node20",
    format: "cjs",
    // Em CJS nao existe import.meta; server/static.ts usa import.meta.dirname
    // para achar dist/public, entao trocamos pelo equivalente do CJS.
    define: { "import.meta.dirname": "__dirname" },
    // O middleware de desenvolvimento do Vite so e carregado quando
    // NODE_ENV !== production, entao fica de fora do pacote.
    external: ["vite", "./vite", "../vite.config"],
    logLevel: "info",
  });

  console.log("[build] pronto: dist/public e dist/index.cjs");
}

main().catch((err) => {
  console.error("[build] falhou:", err);
  process.exit(1);
});
