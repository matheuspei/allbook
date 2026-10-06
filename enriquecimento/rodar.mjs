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
 *     node rodar.mjs --motor codex --so pessoa,editora  — roda no Codex (ChatGPT)
 *
 * Precisa só de Node e do Claude Code (`claude`) logado — ou, com
 * `--motor codex`, do Codex (`codex`) logado na conta do ChatGPT.
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
 *
 * ## O motor Codex (ideia dele, 06/10 — §4.171 do ROTEIRO)
 *
 * Ele tem ChatGPT Plus e quase não usa: rodar lá tira o peso do plano do
 * Claude. O formato obrigatório é o mesmo (`--output-schema`). Três cuidados:
 *
 * - 🚨 **O Codex carrega o `~/.codex/AGENTS.md` dele em toda chamada** — mesmo
 *   com `--ignore-user-config`. Por isso cada chamada roda com uma casa própria
 *   (`CODEX_HOME`, padrão `~/AllBook-enriquecimento/codex-home`) que só tem uma
 *   cópia do login. O login é copiado de volta quando a cópia renova o token,
 *   senão o Codex do dia a dia dele perderia a sessão.
 * - **O Codex não deixa desligar o comando de terminal nem os subagentes.**
 *   Desligamos tudo o que dá e, depois, conferimos os eventos: tarefa em que
 *   ele usou qualquer coisa além da busca na web vai para `erros/`, mesmo com
 *   resposta boa.
 * - **Não há custo em dólar:** o que se mede é a cota do Plus (5 h e semana),
 *   lida do registro da sessão, antes e depois de cada tarefa.
 *
 * Os resultados vão para `resultados-codex/` (e `registro-codex.jsonl`), para
 * comparar lado a lado com os do Claude sem um pular a tarefa do outro.
 */

import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { appendFile, copyFile, mkdir, mkdtemp, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { formatoDaEditora, formatoDaPessoa, formatoDoLivro } from "./formatos.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const TAREFAS = join(AQUI, "tarefas");
/** As pastas de saída: cada motor na sua, para comparar sem um pular o outro. */
const pastas = (motor) => {
  const sufixo = motor === "codex" ? "-codex" : "";
  return {
    resultados: join(AQUI, "resultados" + sufixo),
    erros: join(AQUI, "erros" + sufixo),
    registro: join(AQUI, `registro${sufixo}.jsonl`),
  };
};

const COTA_ESGOTADA = 75;

function opcoes() {
  const a = process.argv.slice(2);
  const o = { motor: "claude", paralelo: 2, modelo: null, esforco: "high", tetoUsd: 6, minutos: 30, so: null, tarefa: null, limite: Infinity };
  for (let i = 0; i < a.length; i++) {
    const v = a[i + 1];
    switch (a[i]) {
      case "--motor": o.motor = v; i++; break;
      case "--paralelo": o.paralelo = Number(v); i++; break;
      case "--modelo": o.modelo = v; i++; break;
      case "--esforco": o.esforco = v; i++; break;
      case "--teto-usd": o.tetoUsd = Number(v); i++; break;
      case "--minutos": o.minutos = Number(v); i++; break;
      case "--so": o.so = v.split(","); i++; break;
      case "--tarefa": o.tarefa = v.replace(/\.json$/, ""); i++; break;
      case "--limite": o.limite = Number(v); i++; break;
      default: throw new Error(`opção desconhecida: ${a[i]}`);
    }
  }
  if (!["claude", "codex"].includes(o.motor)) throw new Error(`motor desconhecido: ${o.motor} (claude ou codex)`);
  // No Claude o padrão é o Opus; no Codex, o modelo que ele usa no dia a dia.
  o.modelo ??= o.motor === "claude" ? "opus" : modeloDoCodex();
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

/* ------------------------------ o motor Codex ------------------------------ */

const CODEX_DELE = process.env.CODEX_HOME_ORIGEM ?? join(homedir(), ".codex");
const CASA_CODEX = process.env.AGENTE_CODEX_HOME ?? join(homedir(), "AllBook-enriquecimento", "codex-home");

/** O modelo do `config.toml` dele, que a casa isolada não lê. */
function modeloDoCodex() {
  try {
    const m = readFileSync(join(CODEX_DELE, "config.toml"), "utf8").match(/^model\s*=\s*"([^"]+)"/m);
    return m ? m[1] : null;
  } catch { return null; }
}

/**
 * Tudo o que o Codex deixa desligar. ⚠️ **`code_mode_host` fica LIGADO:** é por
 * ele que a busca na web é chamada (`exec` roda `tools.web__run(...)`), e sem
 * ele o agente respondeu de memória em 24 s (06/10). Com o terminal desligado,
 * o `exec` só alcança `web__run`, `clock__curr_time` e `apply_patch` — e o
 * `apply_patch` esbarra na caixa só-leitura. O resto a conferência da sessão
 * pega depois — ver `lerSessao`.
 */
const DESLIGADOS = ["shell_tool", "unified_exec", "browser_use", "browser_use_external", "computer_use",
  "apps", "plugins", "hooks", "image_generation", "multi_agent", "multi_agent_v2", "in_app_browser", "skill_search",
  "tool_suggest", "view_image", "goals", "sleep_tool"];

/** As únicas ferramentas que o `exec` do agente pode chamar: a web e o relógio. */
const FERRAMENTAS_PERMITIDAS = new Set(["web__run", "clock__curr_time"]);
/** As únicas chamadas de primeiro nível aceitas: o `exec` (modo código) e a espera dele. */
const CHAMADAS_PERMITIDAS = new Set(["exec", "wait"]);

const AVISO_CODEX = `## Como trabalhar aqui

Use só a busca e a leitura da web. Não rode comandos, não leia nem escreva
arquivos e não abra subagentes: a tarefa que fizer isso é descartada, mesmo com
a resposta certa. A sua resposta final é só o JSON no formato pedido.

`;

const ultimaRenovacao = async (arquivo) => {
  try { return Date.parse(JSON.parse(await readFile(arquivo, "utf8")).last_refresh) || 0; } catch { return -1; }
};

/**
 * Mantém o login da casa isolada igual ao dele, nos dois sentidos: o mais
 * novo vence. Se a cópia renovar o token e ele não voltar, o Codex do dia a
 * dia dele ficaria com um token que o servidor já trocou.
 */
async function sincronizarLogin() {
  const dele = join(CODEX_DELE, "auth.json"), casa = join(CASA_CODEX, "auth.json");
  await mkdir(CASA_CODEX, { recursive: true, mode: 0o700 });
  const [a, b] = await Promise.all([ultimaRenovacao(dele), ultimaRenovacao(casa)]);
  if (a > b) await copyFile(dele, casa);
  else if (b > a && a >= 0) await copyFile(casa, dele);
}

/**
 * O que a sessão registrou: a cota do Plus ao terminar (5 h e semana, em %),
 * quantas buscas o agente fez e o que ele tentou usar fora da web.
 *
 * É aqui, e não nos eventos do `--json`, que se vê o agente trabalhando: as
 * chamadas do `exec` não aparecem como passos lá fora.
 */
async function lerSessao(idDaSessao) {
  const procurar = async (pasta) => {
    for (const n of await readdir(pasta, { withFileTypes: true }).catch(() => [])) {
      const p = join(pasta, n.name);
      if (n.isDirectory()) { const r = await procurar(p); if (r) return r; }
      else if (n.name.includes(idDaSessao)) return p;
    }
    return null;
  };
  const arquivo = idDaSessao && (await procurar(join(CASA_CODEX, "sessions")));
  if (!arquivo) return { cota: null, buscas: 0, proibidos: ["sessão não encontrada — não dá para conferir"] };
  let cota = null, buscas = 0;
  const proibidos = new Set();
  for (const linha of (await readFile(arquivo, "utf8")).split("\n")) {
    let p;
    try { p = JSON.parse(linha).payload; } catch { continue; }
    if (!p) continue;
    if (p.rate_limits) {
      const rl = p.rate_limits;
      cota = { cinco_horas: rl.primary?.used_percent ?? null, semana: rl.secondary?.used_percent ?? null, esgotou: rl.rate_limit_reached_type ?? null };
    }
    if (p.type === "function_call" || p.type === "custom_tool_call" || p.type === "local_shell_call") {
      const nome = p.name ?? p.type;
      if (!CHAMADAS_PERMITIDAS.has(nome)) { proibidos.add(nome); continue; }
      const codigo = `${p.input ?? ""}${p.arguments ?? ""}`;
      for (const [, f] of codigo.matchAll(/tools\.([A-Za-z0-9_]+)/g)) {
        if (FERRAMENTAS_PERMITIDAS.has(f)) { if (f === "web__run") buscas++; }
        else proibidos.add(`tools.${f}`);
      }
    }
  }
  return { cota, buscas, proibidos: [...proibidos] };
}

async function chamarCodex(o, prompt, formato) {
  await sincronizarLogin();
  // Uma pasta vazia por chamada: o Codex procura AGENTS.md a partir dela.
  const vazia = await mkdtemp(join(tmpdir(), "agente-"));
  const esquema = join(vazia, "..", `${vazia.split("/").pop()}-formato.json`);
  const resposta = join(vazia, "..", `${vazia.split("/").pop()}-resposta.json`);
  await writeFile(esquema, JSON.stringify(formato));
  const args = [
    "exec", "--ignore-rules", "--skip-git-repo-check", "-C", vazia, "-s", "read-only",
    ...(o.modelo ? ["-m", o.modelo] : []),
    "-c", `model_reasoning_effort="${o.esforco}"`, "-c", 'web_search="live"',
    ...DESLIGADOS.flatMap((r) => ["--disable", r]),
    "--output-schema", esquema, "--json", "-o", resposta, "-",
  ];
  const r = await new Promise((resolver) => {
    const filho = spawn("codex", args, { cwd: vazia, env: { ...process.env, CODEX_HOME: CASA_CODEX }, stdio: ["pipe", "pipe", "pipe"] });
    let saida = "", erro = "";
    filho.stdout.on("data", (d) => (saida += d));
    filho.stderr.on("data", (d) => (erro += d));
    const relogio = setTimeout(() => filho.kill("SIGTERM"), o.minutos * 60_000);
    filho.on("close", (codigo, sinal) => { clearTimeout(relogio); resolver({ codigo, sinal, saida, erro }); });
    filho.stdin.end(AVISO_CODEX + prompt);
  });
  await sincronizarLogin();

  const eventos = r.saida.split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const uso = eventos.findLast((e) => e.type === "turn.completed")?.usage ?? null;
  const idDaSessao = eventos.find((e) => e.type === "thread.started")?.thread_id;
  const errosDoCodex = eventos.filter((e) => e.type === "error" || e.type === "turn.failed").map((e) => e.message ?? e.error?.message ?? JSON.stringify(e));
  let resultado = null;
  try { resultado = JSON.parse(await readFile(resposta, "utf8")); } catch { /* fica null */ }
  const sessao = await lerSessao(idDaSessao);
  await rm(vazia, { recursive: true, force: true });
  await rm(esquema, { force: true }); await rm(resposta, { force: true });
  return { ...r, resultado, uso, errosDoCodex, ...sessao };
}

async function main() {
  const o = opcoes();
  const { resultados: RESULTADOS, erros: ERROS, registro: REGISTRO } = pastas(o.motor);
  await mkdir(RESULTADOS, { recursive: true });
  await mkdir(ERROS, { recursive: true });
  const txt = await instrucoes();
  const formatos = { livro: formatoDoLivro(txt.prateleiras), pessoa: formatoDaPessoa(), editora: formatoDaEditora() };

  const todas = (await readdir(TAREFAS)).filter((n) => n.endsWith(".json")).map((n) => n.replace(/\.json$/, "")).sort();
  const fila = todas.filter((n) =>
    (!o.tarefa || n === o.tarefa) &&
    (!o.so || o.so.some((t) => n.startsWith(t + "-"))) &&
    !existsSync(join(RESULTADOS, n + ".json")),
  ).slice(0, o.limite);

  console.log(`${todas.length} tarefas no pacote · ${fila.length} na fila · ${o.paralelo} em paralelo · ${o.motor} ${o.modelo ?? "(padrão)"}/${o.esforco}`);
  if (!fila.length) return;

  let parar = false, falhasEmSerie = 0, feitas = 0, custo = 0;
  const inicio = Date.now();

  async function uma(nome) {
    const tarefa = JSON.parse(await readFile(join(TAREFAS, nome + ".json"), "utf8"));
    const tipo = tarefa.tarefa;
    const prompt = `${txt[tipo]}\n\n## O item\n\n\`\`\`json\n${JSON.stringify(tarefa, null, 2)}\n\`\`\`\n`;
    const t0 = Date.now();
    if (o.motor === "codex") return umaNoCodex(nome, tarefa, prompt, formatos[tipo], t0);
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

  /** A mesma tarefa no Codex: sem dólar, com a cota do Plus e a conferência dos passos. */
  async function umaNoCodex(nome, tarefa, prompt, formato, t0) {
    const r = await chamarCodex(o, prompt, formato);
    const segundos = Math.round((Date.now() - t0) / 1000);
    const textoDoErro = `${r.errosDoCodex.join(" ")} ${r.erro}`;

    if (r.resultado && !r.buscas) r.proibidos.push("nenhuma busca: respondeu de memória");
    if (r.resultado && !r.proibidos.length && r.codigo === 0) {
      const medida = {
        motor: "codex", segundos, buscas: r.buscas, tokens: r.uso, cota_plus: r.cota,
        modelo: o.modelo, esforco: o.esforco, terminado_em: new Date().toISOString(),
      };
      const destino = join(RESULTADOS, nome + ".json");
      await writeFile(destino + ".parcial", JSON.stringify({ tarefa, resultado: r.resultado, medida }, null, 2));
      await rename(destino + ".parcial", destino);
      await appendFile(REGISTRO, JSON.stringify({ nome, ok: true, ...medida }) + "\n");
      falhasEmSerie = 0; feitas++;
      const c = r.cota ? ` · cota 5h ${r.cota.cinco_horas}% · semana ${r.cota.semana}%` : "";
      console.log(`✓ ${nome} · ${segundos}s · ${r.buscas} buscas${c}`);
      return;
    }

    if (SINAIS_DE_COTA.test(textoDoErro) || r.cota?.esgotou) {
      parar = "cota";
      console.log(`⏸ ${nome}: a cota do Plus parece ter acabado — paro sem anotar a tarefa.\n  ${textoDoErro.trim().slice(0, 300)}`);
      return;
    }
    falhasEmSerie++;
    const motivo = r.proibidos.length ? `recusada: ${r.proibidos.join(", ")}`
      : r.sinal ? `cortada após ${o.minutos} min` : !r.resultado ? "sem resposta no formato" : `código ${r.codigo}`;
    await writeFile(join(ERROS, nome + ".json"), JSON.stringify({ nome, motivo, segundos, resultado: r.resultado, erros: r.errosDoCodex, stderr: r.erro.slice(-4000) }, null, 2));
    await appendFile(REGISTRO, JSON.stringify({ nome, ok: false, motivo, segundos, cota_plus: r.cota }) + "\n");
    console.log(`✗ ${nome}: ${motivo} (detalhe em ${ERROS.split("/").pop()}/${nome}.json)`);
    if (falhasEmSerie >= 3) { parar = "falhas"; console.log("⏸ três falhas seguidas — paro para alguém olhar."); }
  }

  const trabalhadores = Array.from({ length: Math.max(1, o.paralelo) }, async () => {
    while (!parar && fila.length) await uma(fila.shift());
  });
  await Promise.all(trabalhadores);

  const min = Math.round((Date.now() - inicio) / 60_000);
  console.log(`\n${feitas} feitas em ${min} min${o.motor === "claude" ? ` · custo equivalente US$ ${custo.toFixed(2)}` : ""} · faltam ${fila.length}`);
  if (parar === "cota") process.exit(COTA_ESGOTADA);
  if (parar === "falhas") process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
