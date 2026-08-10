import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
export default defineConfig({
  /*
   * O `cartographer` e o `devBanner` do Replit saíram em 10/08: os dois só
   * carregavam com `REPL_ID` no ambiente, e o projeto roda na máquina do
   * Matheus desde sempre — era código que nunca executava. Ficou o overlay de
   * erro, que roda de verdade em desenvolvimento.
   */
  plugins: [react(), runtimeErrorOverlay(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    /*
     * Quem escuta de verdade é o Express (`server/index.ts`), porque o Vite
     * roda como middleware dele — este `host` fica aqui só por simetria. Para
     * abrir o app no celular pela rede de casa, é o `HOST` de lá que manda.
     */
    host: "127.0.0.1",
    /*
     * **`allowedHosts` é a lista de nomes pelos quais o app aceita ser
     * chamado** — proteção do Vite contra DNS rebinding (um site qualquer
     * apontar um domínio dele para o seu 127.0.0.1 e ler o que aparece).
     *
     * Custou meia hora em 26/07 e por isso está anotado: com um túnel da
     * Cloudflare no ar, o endereço público abria **403 "Blocked request"** —
     * e a mensagem, que explica tudo, **só aparecia no corpo da resposta**,
     * que ninguém lê no celular. Parecia problema de rede; era o Vite
     * recusando um nome que não conhecia. O ponto inicial em
     * `.trycloudflare.com` vale para **qualquer** subdomínio, o que importa
     * porque o túnel sorteia um nome novo a cada vez que sobe.
     */
    allowedHosts: ["localhost", "127.0.0.1", ".trycloudflare.com"],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
