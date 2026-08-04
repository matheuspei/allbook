#!/usr/bin/env node
// A trava contra o apodrecimento da documentação (criada em 04/08/2026).
//
// A poda daquele dia achou 7 afirmações falsas no CLAUDE.md — menu com nomes
// errados, dependência desinstalada listada como stack, tela extinta como
// prioridade. Documento que espelha o código apodrece em silêncio; este script
// confere as afirmações VERIFICÁVEIS antes de cada commit (hook pre-commit),
// para o erro aparecer no dia em que nasce, não um ano depois.
//
// O que ele confere:
//   1. CLAUDE.md (ERRO, bloqueia o commit):
//      - todo caminho de arquivo/pasta citado existe no disco;
//      - todo `npm run X` citado existe no package.json;
//      - toda rota citada (ex.: `/profile/edit`) existe no App.tsx;
//      - todo script `scripts/*.sh|mjs` citado existe.
//   2. docs/ROTEIRO.md (AVISO, não bloqueia — o roteiro fala do passado, e
//      "o arquivo X foi apagado" é uma frase verdadeira sobre coisa morta):
//      - caminhos client/src citados que não existem;
//      - folhas `client/public/_*.html` citadas que não existem.
//
// Rodar à mão: npm run docs:check

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (p) => readFileSync(resolve(RAIZ, p), "utf8");

const erros = [];   // CLAUDE.md — bloqueiam
const avisos = [];  // ROTEIRO.md — só avisam

// ---------- fontes de verdade ----------
const pkg = JSON.parse(ler("package.json"));
const appTsx = ler("client/src/App.tsx");
const rotasReais = new Set(
  [...appTsx.matchAll(/path="([^"]+)"/g)].map((m) => m[1])
);

// ---------- utilitários ----------
function caminhosCitados(texto) {
  // caminhos com barra e extensão ou pasta conhecida, citados em crase ou não
  // (sem espaço na classe: "scripts/x.sh status" cita o caminho + argumento)
  const re =
    /(?:^|[\s`(])((?:client|server|shared|docs|scripts|script|\.githooks|lib|pages|components)\/[\w\-./*{},]*[\w/])/gm;
  const achados = new Set();
  for (const m of texto.matchAll(re)) {
    let bruto = m[1];
    // "X.tsx, apagado no mesmo dia" é frase VERDADEIRA sobre coisa morta —
    // só é citação podre quando o texto trata o caminho como vivo
    const depois = texto.slice(m.index, m.index + m[0].length + 90);
    if (/apagad|removid|exclu[íi]d|não existe mais|morreu|deletad/i.test(depois))
      continue;
    // expande client/src/pages/{A,B}.tsx
    const chaves = bruto.match(/^(.*)\{([^}]+)\}(.*)$/);
    const variantes = chaves
      ? chaves[2].split(",").map((x) => chaves[1] + x.trim() + chaves[3])
      : [bruto];
    for (const v of variantes) {
      if (v.includes("*") || v.includes("<") || v.endsWith("/")) continue;
      achados.add(v.trim());
    }
  }
  return [...achados];
}

function conferirCaminhos(texto, destino, prefixoOpcional) {
  for (const c of caminhosCitados(texto)) {
    const candidatos = [c];
    if (prefixoOpcional && !c.startsWith(prefixoOpcional))
      candidatos.push(prefixoOpcional + c);
    if (!candidatos.some((x) => existsSync(resolve(RAIZ, x))))
      destino.push(`caminho citado não existe: ${c}`);
  }
}

// ---------- 1. CLAUDE.md: tem de estar 100% verdadeiro ----------
const claude = ler("CLAUDE.md");

conferirCaminhos(claude, erros, "client/src/");

for (const m of claude.matchAll(/npm run ([\w:-]+)/g)) {
  if (!pkg.scripts?.[m[1]])
    erros.push(`\`npm run ${m[1]}\` citado no CLAUDE.md não existe no package.json`);
}

for (const m of claude.matchAll(/`(\/[\w:/-]+)`/g)) {
  const rota = m[1];
  if (rota.startsWith("/api")) continue; // rotas de API vivem em server/routes.ts
  if (!/^\/[a-z]/.test(rota)) continue;
  if (![...rotasReais].some((r) => r === rota || r.startsWith(rota + "/")))
    erros.push(`rota \`${rota}\` citada no CLAUDE.md não existe no App.tsx`);
}

// ---------- 2. ROTEIRO vivo: avisos ----------
const roteiro = ler("docs/ROTEIRO.md");
conferirCaminhos(roteiro, avisos, "client/src/");
for (const m of roteiro.matchAll(/client\/public\/(_[\w.-]+\.html)/g)) {
  if (!existsSync(resolve(RAIZ, "client/public", m[1])))
    avisos.push(`folha citada não existe mais: client/public/${m[1]}`);
}

// ---------- veredito ----------
const unicos = (xs) => [...new Set(xs)];

if (unicos(avisos).length) {
  console.log("⚠️  docs:check — avisos no docs/ROTEIRO.md (não bloqueiam):");
  for (const a of unicos(avisos)) console.log("   • " + a);
}

if (unicos(erros).length) {
  console.error("\n✖ docs:check — o CLAUDE.md afirma coisas que o código desmente:");
  for (const e of unicos(erros)) console.error("   • " + e);
  console.error(
    "\nConserte o CLAUDE.md (ou o código) antes de commitar." +
      " Para pular em emergência: git commit --no-verify\n"
  );
  process.exit(1);
}

console.log("✓ docs:check — o CLAUDE.md confere com o código.");
