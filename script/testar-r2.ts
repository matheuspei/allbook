/**
 * Prova o caminho inteiro até o balde, com um arquivo de brinquedo.
 *
 * `npm run r2:testar`
 *
 * Existe porque credencial errada não falha na hora: falha no meio de um lote
 * de milhares de arquivos, depois de já ter gasto escrita paga. Cinco segundos
 * aqui evitam isso — e o arquivo de teste é apagado no fim, então não fica
 * ocupando o nível gratuito.
 */
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { armazenamento, ondeFica } from "../server/armazenamento";

const CHAVE = "_teste/ola.txt";
const CONTEUDO = `teste do AllBook — ${new Date().toISOString()}\n`;

function ok(t: string) { console.log(`  ✅ ${t}`); }
function nao(t: string) { console.log(`  ❌ ${t}`); }

const pasta = await mkdtemp(path.join(tmpdir(), "allbook-r2-"));
const local = path.join(pasta, "ola.txt");
await writeFile(local, CONTEUDO);

console.log(`\nArmazenamento em uso: ${ondeFica()}\n`);

if (armazenamento.nome === "pasta local") {
  console.log(
    "⚠️  AUDIO_S3_ENDPOINT não está no `.env` — este teste rodaria contra o\n" +
      "    disco, o que não prova nada sobre a nuvem. Preencha as quatro\n" +
      "    variáveis do balde e rode de novo.\n",
  );
  process.exit(1);
}

let falhou = false;
try {
  await armazenamento.guardar(CHAVE, local);
  ok("subiu o arquivo (PUT)");

  const existe = await armazenamento.existe(CHAVE);
  existe ? ok("o balde confirma que ele está lá (HEAD)") : (nao("HEAD não achou"), (falhou = true));

  const bytes = await armazenamento.tamanho(CHAVE);
  bytes === Buffer.byteLength(CONTEUDO)
    ? ok(`tamanho confere: ${bytes} bytes`)
    : (nao(`tamanho diferente: ${bytes} vs ${Buffer.byteLength(CONTEUDO)}`), (falhou = true));

  const fluxo = await armazenamento.abrir(CHAVE);
  const pedacos: Buffer[] = [];
  for await (const p of fluxo) pedacos.push(Buffer.from(p));
  Buffer.concat(pedacos).toString() === CONTEUDO
    ? ok("baixou de volta e o conteúdo bate (GET)")
    : (nao("o conteúdo voltou diferente"), (falhou = true));

  const lista = await armazenamento.listar("_teste");
  lista.includes(CHAVE) ? ok(`listagem achou (${lista.length} chave(s))`) : (nao("listagem não achou"), (falhou = true));

  const url = await armazenamento.urlTemporaria(CHAVE, 60);
  if (!url) { nao("não devolveu URL assinada"); falhou = true; }
  else {
    const r = await fetch(url);
    const texto = await r.text();
    r.ok && texto === CONTEUDO
      ? ok("URL assinada de 60s funciona sem credencial — é o caminho do player")
      : (nao(`URL assinada devolveu ${r.status}`), (falhou = true));
  }
} catch (erro) {
  nao(`quebrou: ${erro instanceof Error ? erro.message : erro}`);
  falhou = true;
} finally {
  try {
    await armazenamento.apagar("_teste");
    ok("apagou o arquivo de teste — o balde ficou limpo");
  } catch {
    nao("NÃO consegui apagar o arquivo de teste; apague `_teste/` à mão");
  }
  await rm(pasta, { recursive: true, force: true });
}

console.log(falhou ? "\n❌ o caminho até o balde NÃO está funcionando\n" : "\n✅ o balde está pronto para receber livros\n");
process.exit(falhou ? 1 : 0);
