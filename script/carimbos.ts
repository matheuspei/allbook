/**
 * Os carimbos que ligam o acervo do `baixalivro` ao AllBook (30/08, §4.138).
 *
 * Existe como módulo próprio porque **dois scripts precisam do mesmo carimbo**:
 * `importar-acervo.ts` grava o que a ficha declara hoje (`vinhetaFicha`) e
 * `ingerir-audio.ts` grava o que o áudio de fato levou (`vinhetaIngerida`). Se
 * cada um montasse a string do seu jeito, a comparação entre os dois — que é a
 * única razão de os campos existirem — daria diferente sem nada ter mudado.
 */

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { statSync } from "node:fs";

/**
 * O carimbo comparável da vinheta declarada numa ficha — `a1/f15@2026-08-21`.
 *
 * Junta as três coisas que, juntas, dizem "é a mesma vinheta": qual abertura,
 * qual fecho e em que dia foram trocadas. Guardado assim, e não em três
 * colunas, comparar duas vinhetas é um `=`.
 */
export function carimboDeVinheta(v: unknown): string | null {
  if (!v || typeof v !== "object") return null;
  const d = v as Record<string, unknown>;
  const parte = (k: string) => (typeof d[k] === "string" ? (d[k] as string) : "?");
  return `${parte("abertura")}/${parte("fecho")}@${parte("em")}`;
}

export interface CarimbosDaFicha {
  /** O `gerado_em` da ficha, como veio (ISO sem fuso). */
  geradoEm: string | null;
  /** O carimbo da vinheta, ou `null` se este livro ainda não foi vinhetado. */
  vinheta: string | null;
  /** A sinopse conferida pelo baixalivro, quando a ficha a traz. */
  sinopse: string | null;
}

const VAZIO: CarimbosDaFicha = { geradoEm: null, vinheta: null, sinopse: null };

/** Lê o `_ficha.json` de uma pasta do "pronto". Ficha ilegível devolve vazio. */
export async function carimbosDaFicha(pasta: string | null): Promise<CarimbosDaFicha> {
  if (!pasta) return VAZIO;
  const caminho = join(pasta, "_ficha.json");
  if (!existsSync(caminho)) return VAZIO;
  try {
    const d = JSON.parse(await readFile(caminho, "utf8"));
    const texto = d?.ficha?.SINOPSE;
    return {
      geradoEm: typeof d?.gerado_em === "string" ? d.gerado_em : null,
      vinheta: carimboDeVinheta(d?.vinheta),
      sinopse: typeof texto === "string" && texto.trim() ? texto.trim() : null,
    };
  } catch {
    /* ficha ilegível não impede o livro de entrar — só fica sem carimbo */
    return VAZIO;
  }
}

/**
 * Os carimbos a partir do que o `npm run audio` recebe: um arquivo **ou** a
 * pasta do livro. Com arquivo, a ficha é a da pasta que o contém.
 */
export async function carimbosDaEntrada(entrada: string): Promise<CarimbosDaFicha> {
  if (!existsSync(entrada)) return VAZIO;
  return carimbosDaFicha(statSync(entrada).isDirectory() ? entrada : dirname(entrada));
}
