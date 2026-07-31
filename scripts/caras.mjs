/**
 * `npm run caras` — baixa **as fotos dos leitores** e **as fotos das
 * comunidades**, uma vez, para dentro do repositório.
 *
 * Pedido do Matheus em 31/07, e **refeito no mesmo dia depois da crítica dele**.
 *
 * ---
 *
 * ## A primeira versão estava errada, e o registro é para não repetir
 *
 * Eu tinha usado **ilustração** (DiceBear) alegando que pôr o rosto de uma pessoa
 * real num perfil fictício usa a imagem de quem não escolheu estar ali. Ele viu na
 * tela e foi direto:
 *
 * > *"Esse tá um avatar fictício, não é o que eu queria. Eu queria realmente o
 * > rosto de pessoas que parecessem pessoas."*
 *
 * É decisão dele, tomada duas vezes (a primeira já dizia *"pode ser uma pessoa
 * real também"*), e vale. **Fica só o registro, sem insistir:** estes rostos são
 * de um banco de avatares de exemplo e servem à maquete; quando houver contas de
 * verdade, quem entra traz a própria foto e nada disto sobrevive.
 *
 * ## O que vem de onde
 *
 * - **Rostos:** `xsgames.co/randomusers` — fotos de rosto, 256×256, um banco feito
 *   para preencher protótipo. O **gênero é escolhido pelo nome** de cada leitor:
 *   dar rosto masculino à "Ana Paula" seria o tipo de descuido que se nota em dois
 *   segundos.
 * - **Capas das comunidades:** cinco fotos **escolhidas a olho, uma a uma**, do
 *   Openverse, todas **CC0 ou domínio público** (uso comercial liberado, sem
 *   marca d'água). A busca automática por etiqueta foi tentada antes e falhou
 *   feio — "noir, detective" devolveu um boneco do Bender de chapéu. Por isso as
 *   URLs estão fixas aqui: foram vistas antes de entrar.
 *
 * ## Como rodar
 *
 * `npm run caras` — sobrescreve o que já existe. Roda **na sua máquina**, nunca
 * durante o uso do app: como as capas dos livros, o resultado vai para o
 * repositório e o AllBook nunca depende de internet para funcionar.
 *
 * O recorte quadrado usa o `sips`, que já vem no macOS — nenhuma dependência nova
 * entrou no projeto por causa disto.
 */

import { execFile } from "node:child_process";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const rodar = promisify(execFile);
const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, "..");
const PASTA_ROSTOS = resolve(RAIZ, "client/src/assets/images/community");
const PASTA_CAPAS = resolve(RAIZ, "client/src/assets/images/comunidades");

/**
 * O gênero de cada leitor, pelo nome — para o rosto não contradizer quem escreve.
 *
 * Lista escrita à mão de propósito: adivinhar gênero por terminação de nome erra
 * em português (Nara, Iara, Caio, Otávio) e erra pior em nome abreviado ("Lia F.",
 * "Vitor H."). Vinte e quatro linhas resolvem sem heurística nenhuma.
 */
const GENERO = {
  "ana-paula": "female",
  "marcos-v": "male",
  "juliana-s": "female",
  ricardo: "male",
  "carla-lima": "female",
  beto: "male",
  "felipe-g": "male",
  luciana: "female",
  "tereza-m": "female",
  "gustavo-a": "male",
  nara: "female",
  elias: "male",
  "bia-costa": "female",
  "hugo-p": "male",
  "sandra-l": "female",
  caio: "male",
  "renata-v": "female",
  otavio: "male",
  "lia-f": "female",
  "dani-r": "female",
  "paulo-s": "male",
  iara: "female",
  "vitor-h": "male",
  "marina-t": "female",
};

/**
 * As capas — **URL fixa, escolhida a olho**.
 *
 * Cada uma foi aberta e conferida antes de entrar aqui. As licenças: `cc0` e
 * `pdm` (domínio público), ou seja, uso comercial e derivados liberados, e sem
 * crédito obrigatório na tela.
 */
const CAPAS = {
  /* Rua de pedra molhada à noite, luzes refletidas — o clima de suspense sem
     precisar de faca nem sangue na capa. */
  "suspense-misterio":
    "https://images.rawpixel.com/editor_1024/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvcHgxMDU5NDA2LWltYWdlLWt3eXJnNzZrLmpwZw.jpg",
  /* Rastros de luz de trânsito em longa exposição. */
  "quem-ouve-no-transito":
    "https://images.rawpixel.com/editor_1024/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvdXB3azYxNzgyNTg4LXdpa2ltZWRpYS1pbWFnZS1rb3diajVvMS5qcGc.jpg",
  /* Estante de livros antigos encadernados em couro. */
  classicos:
    "https://images.rawpixel.com/editor_1024/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvdXB3azYxODA2Nzk2LXdpa2ltZWRpYS1pbWFnZS1rb3dicWNlcC5qcGc.jpg",
  /* Nebulosa de Órion, pelo Hubble (domínio público). */
  "ficcao-cientifica":
    "https://upload.wikimedia.org/wikipedia/commons/a/a0/Orion_Nebula_%28Hubble_Space_Telescope%29.jpg",
  /* Trilha na mata com névoa da manhã. */
  "habitos-vida-real": "https://live.staticflickr.com/65535/52308782577_0e894a61b3_b.jpg",
};

/** O lado da capa depois do recorte — quadrada, como o app a mostra. */
const LADO_CAPA = 640;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

/** Baixa com duas tentativas: falha de rede passageira derrubava itens. */
async function baixar(url, tentativa = 1) {
  try {
    const resposta = await fetch(url, { headers: { "User-Agent": UA } });
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    const bytes = Buffer.from(await resposta.arrayBuffer());
    if (bytes.length < 900) throw new Error(`resposta pequena demais (${bytes.length}b)`);
    return bytes;
  } catch (erro) {
    if (tentativa < 3) {
      await new Promise((r) => setTimeout(r, 700 * tentativa));
      return baixar(url, tentativa + 1);
    }
    throw erro;
  }
}

/**
 * Os slugs saem do próprio `community.ts` — uma lista só, que não desatualiza.
 *
 * ⚠️ **Sem âncora de início de linha**, e isso não é detalhe: metade dos membros
 * está escrita em várias linhas e a outra metade **numa linha só**. Com
 * `^\s*slug:` o script achou 8 de 24 e não reclamou de nada.
 */
async function slugsDaComunidade() {
  const fonte = await readFile(resolve(RAIZ, "client/src/lib/community.ts"), "utf8");
  const achados = [...fonte.matchAll(/slug:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);
  return [...new Set(achados)];
}

async function main() {
  await mkdir(PASTA_ROSTOS, { recursive: true });
  await mkdir(PASTA_CAPAS, { recursive: true });

  const slugs = await slugsDaComunidade();
  console.log(`\n👤 ${slugs.length} rostos\n`);

  let ok = 0;
  /* Um índice por gênero, para dois leitores nunca dividirem a mesma cara. */
  const indice = { female: 8, male: 5 };

  for (const slug of slugs) {
    const genero = GENERO[slug] ?? "female";
    const n = indice[genero];
    indice[genero] += 3;
    const url = `https://xsgames.co/randomusers/assets/avatars/${genero}/${n}.jpg`;
    const destino = resolve(PASTA_ROSTOS, `${slug}.jpg`);
    try {
      await writeFile(destino, await baixar(url));
      console.log(`  ✓ ${slug} (${genero} ${n})`);
      ok += 1;
    } catch (erro) {
      console.log(`  ✗ ${slug} — ${erro.message}`);
    }
  }

  console.log(`\n🖼  ${Object.keys(CAPAS).length} capas de comunidade\n`);
  for (const [id, url] of Object.entries(CAPAS)) {
    const destino = resolve(PASTA_CAPAS, `${id}.jpg`);
    try {
      await writeFile(destino, await baixar(url));
      /* Recorte central quadrado e redução — o app mostra a capa em quadrado, e
         guardar 3 MB de foto de nebulosa no repositório seria desperdício. */
      await rodar("sips", ["-c", String(LADO_CAPA), String(LADO_CAPA), destino], {
        maxBuffer: 1024 * 1024,
      });
      console.log(`  ✓ ${id}`);
    } catch (erro) {
      console.log(`  ✗ ${id} — ${erro.message}`);
    }
  }

  console.log(`\n${ok}/${slugs.length} rostos e as capas estão no repositório.\n`);
}

main();
