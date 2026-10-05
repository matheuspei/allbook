#!/usr/bin/env node
/**
 * Roda o agente de enriquecimento sobre as tarefas do pacote.
 *
 *     node rodar.mjs                      — tudo o que ainda não tem resultado
 *     node rodar.mjs --paralelo 4         — quantas tarefas ao mesmo tempo (padrão 2)
 *     node rodar.mjs --so livro           — só um tipo (livro, pessoa, editora)
 *     node rodar.mjs --tarefa livro-108233  — uma tarefa só
 *     node rodar.mjs --limite 10          — para depois de N tarefas
 *     node rodar.mjs --modelo opus --esforco high --teto-usd 6 --minutos 30
 *
 * Precisa só de Node e do Claude Code (`claude`) logado. Nada mais.
 *
 * ## As garantias
 *
 * - **Retomável.** Cada tarefa terminada vira `resultados/<tarefa>.json`, e
 *   tarefa com resultado é pulada. Caiu a conta, a luz ou a máquina: rode de
 *   novo e ele continua de onde parou.
 * - **Limite de uso não estraga nada.** Se o Claude disser que a cota acabou, o
 *   programa para de abrir tarefas novas e sai com código 75 — sem anotar a
 *   tarefa como feita (ela seria pulada para sempre sem ter sido pesquisada).
 * - **Isolado.** Cada chamada roda com `--safe-mode` (sem CLAUDE.md, ganchos,
 *   plugins nem servidores MCP da máquina) e só com as ferramentas de busca e
 *   leitura da web. O agente não lê nem escreve arquivo nenhum: quem grava o
 *   resultado é este programa.
 * - **Teto por tarefa.** `--teto-usd` e `--minutos` cortam a tarefa que cavar
 *   demais; ela vai para `erros/` e pode ser refeita depois.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { appendFile, mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { formatoDaEditora, formatoDaPessoa, formatoDoLivro } from "./formatos.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const TAREFAS = join(AQUI, "tarefas");
const RESULTADOS = join(AQUI, "resultados");
const ERROS = join(AQUI, "erros");
const REGISTRO = join(AQUI, "registro.jsonl");

const COTA_ESGOTADA = 75;

function opcoes() {
  const a = process.argv.slice(2);
  const o = { paralelo: 2, modelo: "opus", esforco: "high", tetoUsd: 6, minutos: 30, so: null, tarefa: null, limite: Infinity };
  for (let i = 0; i < a.length; i++) {
    const v = a[i + 1];
    switch (a[i]) {
      case "--paralelo": o.paralelo = Number(v); i++; break;
      case "--modelo": o.modelo = v; i++; break;
      case "--esforco": o.esforco = v; i++; break;
      case "--teto-usd": o.tetoUsd = Number(v); i++; break;
      case "--minutos": o.minutos = Number(v); i++; break;
      case "--so": o.so = v; i++; break;
      case "--tarefa": o.tarefa = v.replace(/\.json$/, ""); i++; break;
      case "--limite": o.limite = Number(v); i++; break;
      default: throw new Error(`opção desconhecida: ${a[i]}`);
    }
  }
  return o;
}

async function instrucoes() {
  const ler = (n) => readFile(join(AQUI, n), "utf8");
  const prateleiras = JSON.parse(await ler("prateleiras.json"));
  const lista = prateleiras.map((p) => `- ${p.rotulo}${p.dica ? ` — ${p.dica}` : ""}`).join("\n");
  const comuns = await ler("instrucoes-comuns.md");
  return {
    prateleiras: prateleiras.map((p) => p.rotulo),
    livro: comuns + "\n\n" + (await ler("instrucoes-livro.md")).replace("{{PRATELEIRAS}}", lista),
    pessoa: comuns + "\n\n" + (await ler("instrucoes-pessoa.md")),
    editora: comuns + "\n\n" + (await ler("instrucoes-editora.md")),
  };
}

/** Texto que indica cota esgotada. Os prováveis — a parada por 3 falhas em série é a rede. */
const SINAIS_DE_COTA = /usage limit|rate limit|limit reached|quota|too many requests|overloaded|credit balance/i;

function chamarClaude(o, prompt, formato) {
  const args = [
    "-p", "--safe-mode", "--no-session-persistence",
    "--model", o.modelo, "--effort", o.esforco,
    "--tools", "WebSearch,WebFetch", "--allowedTools", "WebSearch,WebFetch",
    "--permission-prompts", "none",
    "--max-budget-usd", String(o.tetoUsd),
    "--output-format", "json", "--json-schema", JSON.stringify(formato),
  ];
  return new Promise((resolver) => {
    const filho = spawn("claude", args, { cwd: AQUI, stdio: ["pipe", "pipe", "pipe"] });
    let saida = "", erro = "";
    filho.stdout.on("data", (d) => (saida += d));
    filho.stderr.on("data", (d) => (erro += d));
    const relogio = setTimeout(() => filho.kill("SIGTERM"), o.minutos * 60_000);
    filho.on("close", (codigo, sinal) => { clearTimeout(relogio); resolver({ codigo, sinal, saida, erro }); });
    filho.stdin.end(prompt);
  });
}

async function main() {
  const o = opcoes();
  await mkdir(RESULTADOS, { recursive: true });
  await mkdir(ERROS, { recursive: true });
  const txt = await instrucoes();
  const formatos = { livro: formatoDoLivro(txt.prateleiras), pessoa: formatoDaPessoa(), editora: formatoDaEditora() };

  const todas = (await readdir(TAREFAS)).filter((n) => n.endsWith(".json")).map((n) => n.replace(/\.json$/, "")).sort();
  const fila = todas.filter((n) =>
    (!o.tarefa || n === o.tarefa) &&
    (!o.so || n.startsWith(o.so + "-")) &&
    !existsSync(join(RESULTADOS, n + ".json")),
  ).slice(0, o.limite);

  console.log(`${todas.length} tarefas no pacote · ${fila.length} na fila · ${o.paralelo} em paralelo · ${o.modelo}/${o.esforco}`);
  if (!fila.length) return;

  let parar = false, falhasEmSerie = 0, feitas = 0, custo = 0;
  const inicio = Date.now();

  async function uma(nome) {
    const tarefa = JSON.parse(await readFile(join(TAREFAS, nome + ".json"), "utf8"));
    const tipo = tarefa.tarefa;
    const prompt = `${txt[tipo]}\n\n## O item\n\n\`\`\`json\n${JSON.stringify(tarefa, null, 2)}\n\`\`\`\n`;
    const t0 = Date.now();
    const r = await chamarClaude(o, prompt, formatos[tipo]);
    const segundos = Math.round((Date.now() - t0) / 1000);

    let d = null;
    try { d = JSON.parse(r.saida); } catch { /* fica null */ }
    const textoDoErro = `${d?.result ?? ""} ${r.erro}`;

    if (d && !d.is_error && d.structured_output) {
      const medida = {
        custo_usd: d.total_cost_usd, segundos, turnos: d.num_turns,
        buscas: d.usage?.server_tool_use?.web_search_requests ?? null,
        modelo: o.modelo, esforco: o.esforco, terminado_em: new Date().toISOString(),
      };
      const destino = join(RESULTADOS, nome + ".json");
      await writeFile(destino + ".parcial", JSON.stringify({ tarefa, resultado: d.structured_output, medida }, null, 2));
      await rename(destino + ".parcial", destino);
      await appendFile(REGISTRO, JSON.stringify({ nome, ok: true, ...medida }) + "\n");
      falhasEmSerie = 0; feitas++; custo += d.total_cost_usd ?? 0;
      console.log(`✓ ${nome} · ${segundos}s · US$ ${(d.total_cost_usd ?? 0).toFixed(2)} · ${d.num_turns} turnos`);
      return;
    }

    if (SINAIS_DE_COTA.test(textoDoErro) || d?.api_error_status === 429) {
      parar = "cota";
      console.log(`⏸ ${nome}: a cota parece ter acabado — paro sem anotar a tarefa.\n  ${textoDoErro.trim().slice(0, 300)}`);
      return;
    }
    falhasEmSerie++;
    const motivo = r.sinal ? `cortada após ${o.minutos} min` : d?.subtype ?? `código ${r.codigo}`;
    await writeFile(join(ERROS, nome + ".json"), JSON.stringify({ nome, motivo, segundos, resposta: d, stderr: r.erro.slice(-4000) }, null, 2));
    await appendFile(REGISTRO, JSON.stringify({ nome, ok: false, motivo, segundos, custo_usd: d?.total_cost_usd ?? null }) + "\n");
    console.log(`✗ ${nome}: ${motivo} (detalhe em erros/${nome}.json)`);
    if (falhasEmSerie >= 3) { parar = "falhas"; console.log("⏸ três falhas seguidas — paro para alguém olhar."); }
  }

  const trabalhadores = Array.from({ length: Math.max(1, o.paralelo) }, async () => {
    while (!parar && fila.length) await uma(fila.shift());
  });
  await Promise.all(trabalhadores);

  const min = Math.round((Date.now() - inicio) / 60_000);
  console.log(`\n${feitas} feitas em ${min} min · custo equivalente US$ ${custo.toFixed(2)} · faltam ${fila.length}`);
  if (parar === "cota") process.exit(COTA_ESGOTADA);
  if (parar === "falhas") process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
