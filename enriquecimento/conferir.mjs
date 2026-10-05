#!/usr/bin/env node
/**
 * Confere os resultados sem consultar nada: só regras que acham erro de graça.
 *
 *     node conferir.mjs            — o resumo e cada aviso
 *
 * Não apaga nem corrige: aponta. Quem decide é a importação, do lado de lá.
 * Os testes vêm dos erros que já aconteceram (§4.136 e §4.159 do ROTEIRO):
 * valor sem prova, ano da obra depois do ano do áudio, foto sem prova de
 * identidade, ano fora de qualquer faixa possível.
 */

import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const ESTE_ANO = new Date().getFullYear();

function camposComValor(objeto) {
  return Object.entries(objeto).filter(([, v]) => v && typeof v === "object" && "valor" in v && "provas" in v && v.valor !== null);
}

function semProva(campo) {
  return !campo.provas.length || campo.provas.some((p) => !/^https?:\/\//.test(p.url) || (p.citacao ?? "").trim().length < 8);
}

function conferirLivro(t, r, aviso) {
  for (const [nome, c] of camposComValor(r)) if (semProva(c)) aviso(`${nome} = ${JSON.stringify(c.valor)} sem prova completa`);
  const obra = r.ano_obra.valor, audio = r.ano_audio.valor;
  if (obra !== null && (obra < -3000 || obra > ESTE_ANO)) aviso(`ano_obra impossível: ${obra}`);
  if (audio !== null && (audio < 1930 || audio > ESTE_ANO)) aviso(`ano_audio impossível: ${audio}`);
  if (obra !== null && audio !== null && obra > audio) aviso(`ano_obra ${obra} depois do ano_audio ${audio}`);
  if (audio !== null && t.ano_na_loja && t.ano_na_loja_serve && Math.abs(audio - t.ano_na_loja) > 1)
    aviso(`ano_audio ${audio} discorda da loja (${t.ano_na_loja})`);
  if (obra !== null && obra === audio && r.tipo === "livro" && r.edicao === "integral")
    aviso(`ano_obra igual ao do áudio (${obra}) — confira se não é a data da loja`);
  if (r.id !== t.id) aviso(`id trocado: ${r.id} ≠ ${t.id}`);
}

function conferirPerfil(t, r, aviso, imagem) {
  for (const [nome, c] of camposComValor(r)) if (semProva(c)) aviso(`${nome} = ${JSON.stringify(c.valor)} sem prova completa`);
  if (r.bio.texto && !r.bio.provas.length) aviso("bio sem fonte");
  const palavras = r.bio.texto ? r.bio.texto.split(/\s+/).length : 0;
  if (palavras > 260) aviso(`bio longa demais (${palavras} palavras)`);
  const f = r[imagem];
  if (f.url_imagem && !f.prova_de_identidade) aviso(`${imagem} sem prova de identidade`);
  if (f.url_imagem && !/^https?:\/\//.test(f.url_imagem)) aviso(`${imagem} com endereço inválido`);
  if (r.identificacao.confianca === "baixa" && (r.bio.texto || f.url_imagem)) aviso("identidade incerta, mas trouxe bio ou imagem");
  if (r.nascimento && r.morte && r.nascimento.valor && r.morte.valor && r.morte.valor < r.nascimento.valor) aviso("morte antes do nascimento");
  if (r.slug !== t.slug) aviso(`slug trocado: ${r.slug} ≠ ${t.slug}`);
}

async function main() {
  const pasta = join(AQUI, "resultados");
  const nomes = (await readdir(pasta)).filter((n) => n.endsWith(".json")).sort();
  let avisos = 0, custo = 0, segundos = 0;
  const contagem = {};
  for (const n of nomes) {
    const { tarefa: t, resultado: r, medida } = JSON.parse(await readFile(join(pasta, n), "utf8"));
    const lista = [];
    const aviso = (m) => lista.push(m);
    if (t.tarefa === "livro") conferirLivro(t, r, aviso);
    else conferirPerfil(t, r, aviso, t.tarefa === "pessoa" ? "foto" : "logo");
    custo += medida?.custo_usd ?? 0; segundos += medida?.segundos ?? 0;
    contagem[t.tarefa] = (contagem[t.tarefa] ?? 0) + 1;
    avisos += lista.length;
    console.log(`${lista.length ? "⚠" : "✓"} ${n.replace(/\.json$/, "")}${lista.map((m) => `\n    · ${m}`).join("")}`);
  }
  console.log(`\n${nomes.length} resultados (${Object.entries(contagem).map(([k, v]) => `${v} ${k}`).join(", ")}) · ${avisos} avisos`);
  console.log(`custo equivalente US$ ${custo.toFixed(2)} · ${Math.round(segundos / 60)} min de agente`);
}

main().catch((e) => { console.error(e); process.exit(1); });
