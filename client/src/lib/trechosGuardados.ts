/**
 * Os trechos que você guardou — o "clipboard" da citação de áudio.
 *
 * **Por que isto existe, e é uma decisão de desenho** (ROTEIRO 4.45). O Matheus
 * pediu que desse para citar um trecho **também no fórum e no clube**, e deixou
 * a forma comigo: *"como é que a gente vai fazer para a pessoa conseguir pegar
 * esse trecho e mencionar nesse campo? Aí é com você"*.
 *
 * A resposta: **cortar se faz ouvindo; anexar se faz escrevendo.** São dois
 * momentos diferentes e distantes, e a ferramenta tem de respeitar isso —
 * ninguém corta um trecho de dentro de uma caixa de texto, porque ali estaria
 * chutando o minuto sem ouvir. Então o trecho passa a ser uma **coisa
 * guardada**: você corta no player, ele fica aqui, e depois você anexa em
 * qualquer lugar que aceite escrever.
 *
 * É também o que a maquete da janela B já previa: a aba **"Guardados"** no feed
 * da Comunidade sai de graça desta lista.
 *
 * **O trecho é a peça que circula.** A mesma `Citacao` vale na sala do livro, no
 * mural do clube, no fórum e no feed — um mecanismo, não quatro parecidos, que é
 * a lição que a §4.40 cobrou caro.
 */

import { criarCitacao, type Citacao } from "@/lib/citacoes";

export const TRECHOS_EVENT = "allbook:trechos";

const CHAVE = "allbook_trechos_guardados";

export interface TrechoGuardado extends Citacao {
  id: string;
  /** ISO completo — a lista mostra o mais recente primeiro. */
  guardadoEm: string;
}

function ler(): TrechoGuardado[] {
  try {
    const guardado = JSON.parse(localStorage.getItem(CHAVE) || "[]");
    if (!Array.isArray(guardado)) return [];
    return guardado.filter(
      (item): item is TrechoGuardado =>
        item &&
        typeof item.id === "string" &&
        typeof item.bookId === "number" &&
        typeof item.inicioSec === "number" &&
        typeof item.duracaoSec === "number",
    );
  } catch {
    return [];
  }
}

function gravar(lista: TrechoGuardado[]): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {
    /* sem storage o trecho não persiste; a tela já mostrou o efeito */
  }
  window.dispatchEvent(new Event(TRECHOS_EVENT));
}

/** Os seus trechos, do mais recente para o mais antigo. */
export function trechosGuardados(): TrechoGuardado[] {
  return ler().sort((a, b) => b.guardadoEm.localeCompare(a.guardadoEm));
}

/** Já existe um trecho igual? Evita a lista encher de duplicatas do mesmo corte. */
export function jaGuardado(citacao: Citacao): boolean {
  return ler().some(
    (item) =>
      item.bookId === citacao.bookId &&
      item.inicioSec === citacao.inicioSec &&
      item.duracaoSec === citacao.duracaoSec,
  );
}

/**
 * Guarda um trecho. Devolve o que ficou guardado — ou o que já existia.
 *
 * Guardar o mesmo corte duas vezes não cria duas entradas: a pessoa que toca
 * "guardar" de novo quer garantir que está lá, não quer uma cópia.
 */
export function guardarTrecho(citacao: Citacao): TrechoGuardado {
  const lista = ler();
  const existente = lista.find(
    (item) =>
      item.bookId === citacao.bookId &&
      item.inicioSec === citacao.inicioSec &&
      item.duracaoSec === citacao.duracaoSec,
  );
  if (existente) return existente;

  const novo: TrechoGuardado = {
    ...criarCitacao(citacao.bookId, citacao.inicioSec, citacao.duracaoSec),
    id: `tr-${Date.now()}`,
    guardadoEm: new Date().toISOString(),
  };
  gravar([...lista, novo]);
  return novo;
}

export function esquecerTrecho(id: string): void {
  gravar(ler().filter((item) => item.id !== id));
}

/** Só a citação, sem o embrulho — o que as telas anexam de fato. */
export function comoCitacao(trecho: TrechoGuardado): Citacao {
  return criarCitacao(trecho.bookId, trecho.inicioSec, trecho.duracaoSec);
}
