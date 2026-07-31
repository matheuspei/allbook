/**
 * `npm run caras` — baixa **os rostos dos leitores** e **as capas das
 * comunidades**, uma vez, para dentro do repositório.
 *
 * Pedido do Matheus em 31/07: *"crie caras para os perfis… imagens mesmo, como
 * se fosse uma pessoa real. E também imagens das capas das comunidades que
 * condizem com o que ela está dizendo."*
 *
 * ---
 *
 * ## De onde vem cada coisa, e por quê
 *
 * **Os rostos: DiceBear, estilo `notionists`.** São rostos **gerados**, e essa é
 * a parte importante — não são fotos de pessoas.
 *
 * ⚠️ **Por que não usei foto de gente de verdade**, mesmo ele tendo dito *"pode
 * ser uma pessoa real também"*: pôr o rosto de alguém como perfil de um leitor
 * fictício é usar a imagem de uma pessoa que não escolheu estar ali — e o que a
 * "Ana Paula" escreve no app passa a sair da cara dela. Bancos de rosto
 * fotorrealista **gerado** (thispersondoesnotexist e afins) resolveriam isso, mas
 * todos os que testei estão fora do ar ou bloqueados. Ilustração gerada é o que
 * dá cara sem tomar a de ninguém.
 *
 * **Licença:** `notionists` é **CC0** — uso livre, sem obrigação de atribuição.
 * Foi por isso que ele ganhou de `lorelei` e `micah` (CC BY, que exigiriam
 * crédito visível no app).
 *
 * **Fundo transparente, de propósito:** o avatar entra **por cima do gradiente**
 * que cada leitor já tem em `community.ts`. Sem isso, 26 quadrados pastel
 * brigariam com as capas — e a cor de cada pessoa, que o app usa há semanas para
 * identificá-la, seria jogada fora.
 *
 * ---
 *
 * ## As capas das comunidades **não** são baixadas — e por quê
 *
 * A primeira versão deste script puxava foto temática do **LoremFlickr** por
 * etiqueta. Baixei as cinco e conferi a olho, como o próprio script mandava. O
 * resultado matou a ideia, por dois motivos independentes:
 *
 * 1. **A busca por etiqueta erra feio.** "noir, detective" devolveu um boneco do
 *    Bender de chapéu; "old, books, library" devolveu a fachada de um prédio de
 *    pedra. Capa errada é pior que capa nenhuma.
 * 2. **A licença não serve, e isso é definitivo.** As fotos vieram com marca
 *    d'água `cc-nc-nd` e o nome do autor queimado no canto — **não comercial, sem
 *    derivados**. Num app que vai ser vendido, é impróprio.
 *
 * **O que ficou no lugar é melhor e é do próprio produto:** a capa de uma
 * comunidade é o **mosaico das capas dos livros** daquele assunto, montado na
 * tela (ver `capaDaComunidade`, em `lib/forum.ts`). Zero download, zero licença
 * de terceiros — e a capa de livro é a peça de design mais cuidada do AllBook.
 *
 * ## Como rodar
 *
 * `npm run caras` — sobrescreve o que já existe. Roda **na sua máquina**, nunca
 * durante o uso do app: como as capas dos livros, o resultado vai para o
 * repositório e o AllBook nunca depende de internet para funcionar.
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, "..");
const PASTA_ROSTOS = resolve(RAIZ, "client/src/assets/images/community");

/** O estilo escolhido, e o tamanho que a maior tela usa (o dobro, para retina). */
const ESTILO = "notionists";
const LADO = 256;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

/** Baixa com uma segunda tentativa: falha de rede passageira derrubava itens. */
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
 * está escrita em várias linhas e a outra metade **numa linha só**
 * (`{ slug: "tereza-m", name: … }`). Com `^\s*slug:` o script achou 8 de 24 e
 * não reclamou de nada — o tipo de falha que passa despercebida porque o
 * resultado *parece* certo.
 */
async function slugsDaComunidade() {
  const fonte = await readFile(resolve(RAIZ, "client/src/lib/community.ts"), "utf8");
  const achados = [...fonte.matchAll(/slug:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);
  return [...new Set(achados)];
}

async function main() {
  await mkdir(PASTA_ROSTOS, { recursive: true });

  const slugs = await slugsDaComunidade();
  console.log(`\n👤 ${slugs.length} rostos (${ESTILO}, fundo transparente)\n`);

  let ok = 0;
  for (const slug of slugs) {
    const url =
      `https://api.dicebear.com/9.x/${ESTILO}/png` +
      `?seed=${encodeURIComponent(slug)}&size=${LADO}&backgroundColor=transparent`;
    try {
      await writeFile(resolve(PASTA_ROSTOS, `${slug}.png`), await baixar(url));
      console.log(`  ✓ ${slug}`);
      ok += 1;
    } catch (erro) {
      console.log(`  ✗ ${slug} — ${erro.message}`);
    }
  }

  console.log(
    `\n${ok}/${slugs.length} rostos salvos em client/src/assets/images/community/.\n` +
      `As capas das comunidades não vêm daqui — são mosaico das capas dos livros\n` +
      `do assunto, montado na tela (ver o cabeçalho deste arquivo).\n`,
  );
}

main();
