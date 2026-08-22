/**
 * Os cabeçalhos de segurança e a confiança no proxy — §4.135 do ROTEIRO.
 *
 * Duas coisas moram aqui, e as duas só fazem sentido juntas: o AllBook vai
 * ficar **atrás da Cloudflare**, e um servidor atrás de proxy precisa saber
 * disso, senão erra o IP de quem pede e deixa de emitir o cookie seguro.
 */
import helmet from "helmet";
import type { Express } from "express";

const emProducao = process.env.NODE_ENV === "production";

/**
 * De onde o áudio pode ser tocado, além do próprio domínio.
 *
 * Enquanto `server/audio.ts` entrega os segmentos pelo próprio Express, isto
 * fica vazio e `'self'` basta. Quando a rota passar a **redirecionar** para a
 * URL assinada do R2 (§4.135), o domínio do balde entra aqui — senão a política
 * de conteúdo barra o `<audio>` e o sintoma é um player mudo, sem erro de rede.
 *
 * Aceita vários, separados por vírgula: `AUDIO_CDN=audio.allbook.com.br`
 */
const origensDeAudio = (process.env.AUDIO_CDN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * ⚠️ **`trust proxy` quebra em silêncio quando falta.**
 *
 * Atrás da Cloudflare, todo pedido chega com o IP do proxy. Sem esta linha:
 *
 * - `req.ip` vira o IP da Cloudflare para **todo mundo**, e o limite de
 *   `server/audio.ts` (600 segmentos/min por conta) passa a contar a plateia
 *   inteira como se fosse uma pessoa só;
 * - o Express considera a conexão insegura e **não emite** o cookie de sessão
 *   marcado como `secure` (`server/contas.ts`), e ninguém consegue entrar.
 *
 * O `1` é o número de saltos de proxy em que se confia. Um, porque é a
 * Cloudflare e nada mais. Confiar em salto demais deixa qualquer um forjar o
 * `X-Forwarded-For` e se passar por outro IP — por isso em desenvolvimento,
 * onde não há proxy nenhum, isto fica **desligado**.
 */
export function confiarNoProxy(app: Express) {
  const saltos = process.env.TRUST_PROXY
    ? Number(process.env.TRUST_PROXY)
    : emProducao
      ? 1
      : 0;

  app.set("trust proxy", saltos || false);
  return saltos;
}

/**
 * Os cabeçalhos.
 *
 * A política de conteúdo (CSP) é o item que mais quebra site, e ela quebra
 * **calada**: o navegador simplesmente não executa o que barrou. Por isso ela
 * só vale em produção — em desenvolvimento o Vite injeta script embutido, usa
 * `eval` para trocar módulo a quente e abre um websocket, e uma política
 * estrita mataria os três.
 */
export function cabecalhosDeSeguranca() {
  return helmet({
    /*
     * HSTS: o navegador passa a recusar HTTP neste domínio por um ano, sem
     * nem tentar. Só em produção — em `localhost` isto trancaria o
     * desenvolvimento em HTTPS que não existe.
     *
     * `preload` fica **desligado por padrão de propósito**: entrar na lista de
     * preload dos navegadores é fácil e sair leva meses. Ligue com
     * `HSTS_PRELOAD=1` no dia de submeter o domínio, não antes.
     */
    hsts: emProducao
      ? {
          maxAge: 31_536_000, // 1 ano
          includeSubDomains: true,
          preload: process.env.HSTS_PRELOAD === "1",
        }
      : false,

    contentSecurityPolicy: emProducao
      ? {
          directives: {
            defaultSrc: ["'self'"],
            // O bundle é estático e servido por nós; nada de terceiro.
            scriptSrc: ["'self'"],
            /*
             * `unsafe-inline` no estilo não é descuido: Radix e Tailwind
             * escrevem `style=""` direto no elemento (posição de menu, altura
             * de acordeão). Sem isto, a interface desmonta.
             */
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            mediaSrc: ["'self'", "blob:", ...origensDeAudio],
            connectSrc: ["'self'", ...origensDeAudio],
            fontSrc: ["'self'", "data:"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            /*
             * `'self'` e não `'none'`: as folhas de prévia em `client/public`
             * abrem a interface dentro de um iframe para simular o celular
             * (§4.131). `'none'` mataria a moldura.
             */
            frameAncestors: ["'self'"],
            upgradeInsecureRequests: [],
          },
        }
      : false,

    /*
     * O COEP isola a página de todo recurso que não mande cabeçalho de
     * consentimento — inclui capa hospedada fora e player embutido. É útil
     * para quem precisa de `SharedArrayBuffer`; aqui só quebraria coisa.
     */
    crossOriginEmbedderPolicy: false,

    /*
     * `same-site` e não `same-origin`: as capas podem passar a sair de um
     * subdomínio (`capas.allbook…`), e `same-origin` as barraria.
     */
    crossOriginResourcePolicy: { policy: "same-site" },

    // Sai no `Referer` a origem, nunca o caminho — o título do livro que a
    // pessoa estava lendo não vaza para o site de destino.
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  });
}

/**
 * `Permissions-Policy` — o helmet não escreve este, e ele é barato: desliga na
 * raiz aquilo que o AllBook nunca vai pedir. Se um script hostil entrar por
 * uma brecha, não consegue nem tentar abrir a câmera.
 */
export function permissoesDoNavegador() {
  const politica = [
    "camera=()",
    "microphone=()",
    "geolocation=()",
    "payment=()",
    "usb=()",
    "interest-cohort=()",
  ].join(", ");

  return (_req: unknown, res: { setHeader: (n: string, v: string) => void }, next: () => void) => {
    res.setHeader("Permissions-Policy", politica);
    next();
  };
}
