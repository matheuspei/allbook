/**
 * A ingestão do áudio — o estúdio entrega o arquivo, isto vira livro tocável.
 *
 * ```
 *   npm run audio                          o que já tem áudio e o que falta
 *   npm run audio <id> <arquivo|pasta>     ingere o áudio de um livro
 *   npm run audio refazer <id>             refaz a partir do mestre guardado
 *   npm run audio remover <id>             apaga a entrega (o mestre FICA)
 * ```
 *
 * É a armadilha **2.5** do `docs/BANCO-DE-DADOS.md` começando a sair do papel.
 *
 * ---
 *
 * ## As três regras que este script existe para cumprir
 *
 * **1. O mestre é copiado ANTES de qualquer processamento.** Se o `ffmpeg`
 * falhar no meio, o original já está a salvo. É a única perda sem volta do
 * projeto (§4.34): com o mestre em mãos, tudo o mais se refaz.
 *
 * **2. O mestre nunca é servido.** O que o app toca são segmentos de ~6s gerados
 * aqui. Um arquivo inteiro exposto é o acervo saindo pela porta.
 *
 * **3. Os capítulos são calculados DEPOIS da vinheta.** Se a abertura tem 8s,
 * todo marcador anda 8s — e isso não dá erro nenhum, só faz todo mundo retomar
 * fora do lugar. É o exemplo canônico de quebra silenciosa do
 * `BANCO-DE-DADOS.md`, e por isso `livros.vinhetaSegundos` existe.
 *
 * ## De onde vêm os capítulos (em ordem de preferência)
 *
 * 1. **Embutidos no arquivo** — `.m4b` de audiolivro traz os capítulos nos
 *    metadados, com título e tempo. É a melhor fonte: veio do estúdio.
 * 2. **Um arquivo por capítulo**, numa pasta. A ordem é a dos nomes, comparados
 *    com `numeric: true` — senão `10` viria antes de `2`.
 * 3. **Arquivo único sem metadados** — vira um bloco só, e o script avisa.
 */

import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";

import { asc, eq, sql } from "drizzle-orm";

import { capitulos, livros, progresso } from "@shared/schema";
import {
  armazenamento,
  chaveDaLista,
  chaveDaVinheta,
  chaveDoMestre,
  ondeFica,
  prefixoDaEntrega,
} from "../server/armazenamento";
import { db, pool } from "../server/db";

const rodar = promisify(execFile);

/* -------------------------------------------------------------------------- */
/* Os números da entrega — num lugar só                                        */
/* -------------------------------------------------------------------------- */

/**
 * **64 kbps, mono, AAC.** É a régua da indústria para fala: a voz humana não
 * ganha nada com estéreo nem com banda larga, e o dobro do bitrate dobraria a
 * conta de armazenamento e de banda sem ninguém ouvir diferença. Um livro de 10h
 * dá ~290 MB (§4.128).
 *
 * **AAC e não MP3** porque o formato de entrega é HLS, e AAC é o que todo player
 * toca — inclusive o Safari, que é obrigatório no iPhone. O mestre continua
 * sendo o MP3 que o estúdio mandou; isto aqui é a cópia de trabalho.
 */
const BITRATE = process.env.AUDIO_BITRATE ?? "64k";
/** Segundos por segmento. 6s é o padrão de fato do HLS. */
const SEGMENTO = 6;

/** O que a ingestão aceita como áudio. `.m4b` é o formato de audiolivro. */
const EXTENSOES = new Set([".mp3", ".m4a", ".m4b", ".aac", ".wav", ".flac", ".ogg", ".opus"]);

/* -------------------------------------------------------------------------- */
/* Conversar com o ffmpeg                                                      */
/* -------------------------------------------------------------------------- */

type Faixa = { caminho: string; nome: string; segundos: number };
type Marcador = { titulo: string; inicio: number; fim: number };

async function duracaoDe(arquivo: string): Promise<number> {
  const { stdout } = await rodar("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "csv=p=0",
    arquivo,
  ]);
  const segundos = Number.parseFloat(stdout.trim());
  if (!Number.isFinite(segundos) || segundos <= 0) {
    throw new Error(`não consegui medir a duração de ${path.basename(arquivo)}`);
  }
  return segundos;
}

/**
 * Os capítulos gravados dentro do arquivo, se houver.
 *
 * Um `.m4b` de audiolivro traz isto pronto — é a fonte mais confiável que
 * existe, porque veio de quem produziu. Devolve vazio para os formatos que não
 * carregam capítulo (MP3 solto, WAV).
 */
async function capitulosEmbutidos(arquivo: string): Promise<Marcador[]> {
  const { stdout } = await rodar("ffprobe", [
    "-v", "error",
    "-print_format", "json",
    "-show_chapters",
    arquivo,
  ]);
  const dados = JSON.parse(stdout) as {
    chapters?: { start_time: string; end_time: string; tags?: { title?: string } }[];
  };
  return (dados.chapters ?? []).map((c, i) => ({
    titulo: c.tags?.title?.trim() || `Capítulo ${i + 1}`,
    inicio: Number.parseFloat(c.start_time),
    fim: Number.parseFloat(c.end_time),
  }));
}

/* -------------------------------------------------------------------------- */
/* Juntar as faixas de entrada                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Descobre o que foi entregue: um arquivo ou uma pasta de capítulos.
 *
 * ⚠️ A ordem usa `numeric: true` porque a ordem alfabética crua põe o capítulo
 * **10 antes do 2** — e o resultado seria um livro embaralhado que compila,
 * roda e só se descobre ouvindo.
 */
async function faixasDe(entrada: string): Promise<Faixa[]> {
  const info = await stat(entrada).catch(() => null);
  if (!info) throw new Error(`não achei "${entrada}"`);

  const arquivos: string[] = [];
  if (info.isDirectory()) {
    const itens = await readdir(entrada);
    arquivos.push(
      ...itens
        .filter((n) => EXTENSOES.has(path.extname(n).toLowerCase()))
        .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }))
        .map((n) => path.join(entrada, n)),
    );
    if (arquivos.length === 0) {
      throw new Error(`a pasta "${entrada}" não tem nenhum arquivo de áudio`);
    }
  } else {
    if (!EXTENSOES.has(path.extname(entrada).toLowerCase())) {
      throw new Error(`não sei o que fazer com "${path.extname(entrada)}"`);
    }
    arquivos.push(entrada);
  }

  const faixas: Faixa[] = [];
  for (const caminho of arquivos) {
    faixas.push({
      caminho,
      nome: path.basename(caminho),
      segundos: await duracaoDe(caminho),
    });
  }
  return faixas;
}

/**
 * O nome do capítulo a partir do nome do arquivo.
 *
 * `03 - A Travessia.mp3` → `A Travessia`. Quando sobra só o número, devolve
 * "Capítulo N" — melhor um rótulo honesto que um `03` solto na tela.
 */
function tituloDoArquivo(nome: string, numero: number): string {
  const semExtensao = nome.replace(/\.[^.]+$/, "");
  const limpo = semExtensao
    .replace(/^[\s_\-–—.]*\d+[\s_\-–—.]*/, "")
    .replace(/[_]+/g, " ")
    .trim();
  return limpo.length > 0 ? limpo : `Capítulo ${numero}`;
}

/* -------------------------------------------------------------------------- */
/* O passo que junta tudo: vinheta + livro + fatiar                            */
/* -------------------------------------------------------------------------- */

/**
 * Traz a vinheta do armazenamento para o disco, se ela existir.
 *
 * ⚠️ **Ela ainda não existe** (a §4.35 adiou por ser trabalho de marca). O
 * script segue sem ela, grava `vinhetaSegundos = 0` e avisa — e quando o arquivo
 * aparecer, `npm run audio refazer <id>` cola em tudo, porque o mestre está
 * guardado. É exatamente para isto que a regra do mestre existe.
 */
async function baixarVinheta(qual: "abertura" | "fecho", pasta: string): Promise<Faixa | null> {
  const chave = chaveDaVinheta(qual);
  if (!(await armazenamento.existe(chave))) return null;

  const destino = path.join(pasta, `vinheta-${qual}.mp3`);
  await pipeline(await armazenamento.abrir(chave), createWriteStream(destino));
  return { caminho: destino, nome: `vinheta-${qual}`, segundos: await duracaoDe(destino) };
}

/**
 * Concatena tudo e fatia em HLS — **numa chamada só de `ffmpeg`**.
 *
 * ⚠️ Usa o **filtro** `concat` e não o *demuxer* de propósito: o demuxer emenda
 * os arquivos já codificados e carrega junto o silêncio de padding que todo MP3
 * tem nas pontas, que somado em 30 faixas vira quase um segundo de deriva. O
 * filtro decodifica tudo para o mesmo formato antes de emendar, e o resultado
 * bate com a soma das durações — que é justamente o número de onde saem os
 * marcadores de capítulo.
 */
async function fatiar(faixas: Faixa[], destino: string): Promise<void> {
  const entradas = faixas.flatMap((f) => ["-i", f.caminho]);
  const rotulos = faixas.map((_, i) => `[${i}:a]`).join("");
  const filtro = `${rotulos}concat=n=${faixas.length}:v=0:a=1[saida]`;

  await rodar(
    "ffmpeg",
    [
      "-y", "-nostdin",
      ...entradas,
      "-filter_complex", filtro,
      "-map", "[saida]",
      "-vn",
      "-c:a", "aac", "-b:a", BITRATE, "-ac", "1", "-ar", "44100",
      "-f", "hls",
      "-hls_time", String(SEGMENTO),
      "-hls_playlist_type", "vod",
      "-hls_list_size", "0",
      "-hls_segment_filename", path.join(destino, "s%05d.ts"),
      path.join(destino, "lista.m3u8"),
    ],
    // Um livro de 20h leva minutos; o padrão do Node cortaria no meio.
    { maxBuffer: 32 * 1024 * 1024, timeout: 60 * 60 * 1000 },
  );
}

/* -------------------------------------------------------------------------- */
/* O comando principal                                                         */
/* -------------------------------------------------------------------------- */

async function ingerir(livroId: number, entrada: string, guardarMestre: boolean) {
  const [livro] = await db.select().from(livros).where(eq(livros.id, livroId)).limit(1);
  if (!livro) {
    console.error(`Não existe livro com id ${livroId} no banco.`);
    console.error("Rode `npm run db:catalogo` se você acabou de acrescentá-lo em books.ts.");
    process.exit(1);
  }

  console.log(`\n📖 ${livro.titulo}`);
  console.log(`   armazenamento: ${ondeFica()}\n`);

  const faixas = await faixasDe(entrada);
  const somaBruta = faixas.reduce((t, f) => t + f.segundos, 0);
  console.log(
    `   ${faixas.length} faixa(s), ${(somaBruta / 3600).toFixed(2)}h de áudio ` +
      `(${(somaBruta / 60).toFixed(0)} min)`,
  );

  /* --- Regra 1: o mestre vai para o cofre ANTES de processar qualquer coisa - */
  if (guardarMestre) {
    console.log("\n1. guardando o mestre (antes de processar — se o resto falhar, ele está a salvo)");
    for (const faixa of faixas) {
      await armazenamento.guardar(chaveDoMestre(livroId, faixa.nome), faixa.caminho);
    }
    console.log(`   ✓ ${faixas.length} arquivo(s) em mestres/${livroId}/`);
  }

  const temporario = await mkdtemp(path.join(tmpdir(), "allbook-audio-"));
  try {
    /* --- A vinheta, se existir ---------------------------------------------- */
    console.log("\n2. vinheta");
    const abertura = await baixarVinheta("abertura", temporario);
    const fecho = await baixarVinheta("fecho", temporario);
    const vinhetaSegundos = abertura ? abertura.segundos : 0;

    if (abertura) {
      console.log(`   ✓ abertura de ${abertura.segundos.toFixed(1)}s`);
    } else {
      console.log("   — não há vinheta ainda (§4.35: é trabalho de marca, não de código).");
      console.log("     Quando houver, ponha o arquivo em vinhetas/abertura.mp3 e rode");
      console.log(`     \`npm run audio refazer ${livroId}\` — o mestre está guardado.`);
    }
    if (fecho) console.log(`   ✓ fecho de ${fecho.segundos.toFixed(1)}s`);

    /* --- Os marcadores, calculados DEPOIS da vinheta (regra 3) --------------- */
    console.log("\n3. capítulos");
    let marcadores: Marcador[];
    const embutidos = faixas.length === 1 ? await capitulosEmbutidos(faixas[0].caminho) : [];

    if (embutidos.length > 1) {
      console.log(`   ✓ ${embutidos.length} capítulos vindos dos metadados do arquivo`);
      marcadores = embutidos.map((c) => ({
        titulo: c.titulo,
        inicio: c.inicio + vinhetaSegundos,
        fim: c.fim + vinhetaSegundos,
      }));
    } else if (faixas.length > 1) {
      console.log(`   ✓ ${faixas.length} capítulos, um por arquivo`);
      let onde = vinhetaSegundos;
      marcadores = faixas.map((f, i) => {
        const m = { titulo: tituloDoArquivo(f.nome, i + 1), inicio: onde, fim: onde + f.segundos };
        onde += f.segundos;
        return m;
      });
    } else {
      console.log("   ⚠️ um arquivo só e sem capítulos embutidos — vira um bloco único.");
      console.log("      Para ter capítulos, entregue uma PASTA com um arquivo por capítulo,");
      console.log("      ou um .m4b com os marcadores gravados dentro.");
      marcadores = [{ titulo: livro.titulo, inicio: vinhetaSegundos, fim: vinhetaSegundos + somaBruta }];
    }
    if (vinhetaSegundos > 0) {
      console.log(`   ↳ todos deslocados em ${vinhetaSegundos.toFixed(1)}s por causa da vinheta`);
    }

    /* --- Concatenar e fatiar ------------------------------------------------ */
    console.log(`\n4. juntando e fatiando em segmentos de ${SEGMENTO}s (AAC ${BITRATE} mono)`);
    const tudo = [...(abertura ? [abertura] : []), ...faixas, ...(fecho ? [fecho] : [])];
    const saida = path.join(temporario, "entrega");
    await mkdir(saida, { recursive: true });
    await fatiar(tudo, saida);

    const segmentos = (await readdir(saida)).filter((n) => n.endsWith(".ts"));
    console.log(`   ✓ ${segmentos.length} segmentos + a lista`);

    /*
     * ⚠️ **A conferência que impede a quebra silenciosa.** Os capítulos foram
     * calculados somando durações; o áudio de verdade é o que o `ffmpeg`
     * produziu. Se os dois números não baterem, todo marcador está deslocado —
     * e nada nesta tela nem no app daria erro. Medir custa um `ffprobe`.
     */
    const esperado = tudo.reduce((t, f) => t + f.segundos, 0);
    const medido = await duracaoDe(path.join(saida, "lista.m3u8"));
    const desvio = Math.abs(medido - esperado);
    console.log(`   duração: ${(medido / 3600).toFixed(2)}h (esperava ${(esperado / 3600).toFixed(2)}h)`);
    if (desvio > 1) {
      console.log(
        `   ⚠️ ${desvio.toFixed(1)}s de diferença entre a soma e o áudio gerado — ` +
          "os marcadores de capítulo podem estar deslocados nesse tanto.",
      );
    }

    /* --- Entregar ao armazenamento ------------------------------------------ */
    console.log("\n5. publicando");
    await armazenamento.apagar(prefixoDaEntrega(livroId));
    const quantos = await armazenamento.guardarPasta(prefixoDaEntrega(livroId), saida);
    console.log(`   ✓ ${quantos} arquivo(s) em ${prefixoDaEntrega(livroId)}/`);

    /* --- O banco, numa transação só ----------------------------------------- */
    console.log("\n6. banco");
    const vinhetaAntiga = livro.vinhetaSegundos;
    const primeiraVez = livro.duracaoSegundos === null;

    await db.transaction(async (tx) => {
      await tx
        .update(livros)
        .set({
          /*
           * Com um arquivo só, guarda o arquivo; com vários, guarda a **pasta**
           * — senão a coluna apontaria para o capítulo 1 fingindo ser o livro
           * inteiro. Quem refaz lista a pasta, então os dois casos funcionam.
           */
          arquivoMestre:
            faixas.length === 1 ? chaveDoMestre(livroId, faixas[0].nome) : `mestres/${livroId}/`,
          duracaoSegundos: Math.round(medido),
          vinhetaSegundos: Math.round(vinhetaSegundos),
        })
        .where(eq(livros.id, livroId));

      await tx.delete(capitulos).where(eq(capitulos.livroId, livroId));
      await tx.insert(capitulos).values(
        marcadores.map((m, i) => ({
          livroId,
          numero: i + 1,
          titulo: m.titulo,
          inicioSegundos: Math.round(m.inicio),
          duracaoSegundos: Math.round(m.fim - m.inicio),
        })),
      );

      /*
       * ⚠️ **A armadilha 2.5 acontecendo de verdade.** Se a vinheta mudou de
       * tamanho, toda posição já salva aponta para o lugar errado — 8 segundos
       * antes, para sempre, sem erro nenhum. Aqui a diferença é somada nas
       * posições, que é a única hora em que se sabe o número dos dois lados.
       */
      const diferenca = Math.round(vinhetaSegundos) - vinhetaAntiga;
      if (!primeiraVez && diferenca !== 0) {
        const ajustados = await tx
          .update(progresso)
          .set({ posicaoSegundos: sql`greatest(0, ${progresso.posicaoSegundos} + ${diferenca})` })
          // `progresso` tem chave composta `(contaId, livroId)` — não há `id`.
          .where(eq(progresso.livroId, livroId))
          .returning({ contaId: progresso.contaId });
        console.log(
          `   ↳ a vinheta mudou ${diferenca > 0 ? "+" : ""}${diferenca}s: ` +
            `${ajustados.length} posição(ões) salva(s) corrigidas junto`,
        );
      }
    });
    console.log(`   ✓ duração, vinheta e ${marcadores.length} capítulo(s) gravados`);

    /* --- O aviso que só faz sentido na primeira vez -------------------------- */
    if (primeiraVez) {
      const [{ quantos: ouvintes }] = await db
        .select({ quantos: sql<number>`count(*)::int` })
        .from(progresso)
        .where(eq(progresso.livroId, livroId));
      if (ouvintes > 0) {
        console.log(
          `\n⚠️ ${ouvintes} pessoa(s) já tinham posição salva neste livro, e ela veio da\n` +
            "   duração ESTIMADA (a conta por páginas), não medida. Não converti nada:\n" +
            "   não há de onde tirar a equivalência, e chutar seria pior que deixar.",
        );
      }
    }

    console.log(`\n✅ pronto. O app pede a lista em ${chaveDaLista(livroId)}\n`);
  } finally {
    await rm(temporario, { recursive: true, force: true });
  }
}

/**
 * Refaz a entrega a partir do mestre guardado — **sem o arquivo original em
 * mãos**. É o que torna a regra do mestre útil em vez de cerimonial: trocou a
 * vinheta, mudou o bitrate, apareceu um formato novo? Roda de novo.
 */
async function refazer(livroId: number) {
  const mestres = await armazenamento.listar(`mestres/${livroId}`);
  if (mestres.length === 0) {
    console.error(`Não há mestre guardado para o livro ${livroId}.`);
    console.error(`Ingira primeiro: npm run audio ${livroId} <arquivo ou pasta>`);
    process.exit(1);
  }

  const temporario = await mkdtemp(path.join(tmpdir(), "allbook-mestre-"));
  try {
    console.log(`trazendo ${mestres.length} mestre(s) de volta…`);
    for (const chave of mestres) {
      const destino = path.join(temporario, path.basename(chave));
      await pipeline(await armazenamento.abrir(chave), createWriteStream(destino));
    }
    // `false`: o mestre já está guardado — recopiá-lo sobre si mesmo é inútil.
    await ingerir(livroId, temporario, false);
  } finally {
    await rm(temporario, { recursive: true, force: true });
  }
}

async function remover(livroId: number) {
  await armazenamento.apagar(prefixoDaEntrega(livroId));
  await db.transaction(async (tx) => {
    await tx.delete(capitulos).where(eq(capitulos.livroId, livroId));
    await tx
      .update(livros)
      .set({ duracaoSegundos: null, vinhetaSegundos: 0, arquivoMestre: null })
      .where(eq(livros.id, livroId));
  });
  console.log(`entrega do livro ${livroId} apagada. **O mestre continua guardado** —`);
  console.log(`para reconstruir: npm run audio refazer ${livroId}`);
}

async function situacao() {
  const todos = await db
    .select({
      id: livros.id,
      titulo: livros.titulo,
      duracao: livros.duracaoSegundos,
      vinheta: livros.vinhetaSegundos,
    })
    .from(livros)
    .orderBy(asc(livros.id));

  const comAudio = todos.filter((l) => l.duracao !== null);
  console.log(`\narmazenamento: ${ondeFica()}`);
  console.log(`${comAudio.length} de ${todos.length} livros têm áudio de verdade.\n`);

  for (const l of comAudio) {
    const [{ quantos }] = await db
      .select({ quantos: sql<number>`count(*)::int` })
      .from(capitulos)
      .where(eq(capitulos.livroId, l.id));
    console.log(
      `  ${String(l.id).padStart(3)}  ${l.titulo} — ${(l.duracao! / 3600).toFixed(2)}h, ` +
        `${quantos} capítulo(s)${l.vinheta > 0 ? `, vinheta de ${l.vinheta}s` : ", sem vinheta"}`,
    );
  }
  if (comAudio.length > 0) console.log();

  console.log("Ingerir:  npm run audio <id do livro> <arquivo ou pasta de capítulos>");
  console.log("Refazer:  npm run audio refazer <id>      (usa o mestre guardado)\n");
}

/* -------------------------------------------------------------------------- */

async function main() {
  const [comando, ...resto] = process.argv.slice(2);

  switch (comando) {
    case undefined:
    case "situacao":
      await situacao();
      break;
    case "refazer":
      await refazer(Number(resto[0]));
      break;
    case "remover":
      await remover(Number(resto[0]));
      break;
    default: {
      const id = Number(comando);
      if (!Number.isInteger(id)) {
        console.error(`Não conheço "${comando}".`);
        console.error("Use: npm run audio <id> <arquivo|pasta> | refazer <id> | remover <id>");
        process.exitCode = 1;
        return;
      }
      if (!resto[0]) {
        console.error("Falta dizer qual arquivo (ou pasta) foi entregue:");
        console.error(`  npm run audio ${id} ~/Downloads/livro.m4b`);
        console.error(`  npm run audio ${id} ~/Downloads/livro/     # um arquivo por capítulo`);
        process.exitCode = 1;
        return;
      }
      await ingerir(id, path.resolve(resto[0]), true);
    }
  }
}

main()
  .catch((erro) => {
    console.error("\n[áudio] falhou:", erro instanceof Error ? erro.message : erro);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
