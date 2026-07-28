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

/** Nota do trecho: um lembrete, não uma legenda. Curto de propósito. */
export const MAX_NOTA_TRECHO = 140;

export interface TrechoGuardado extends Citacao {
  id: string;
  /** ISO completo — a lista mostra o mais recente primeiro. */
  guardadoEm: string;
  /**
   * O que você escreveu sobre este trecho — **e que só você lê** (ROTEIRO 4.49).
   *
   * Pedido do Matheus: *"era para a pessoa poder escrever uma coisa no trecho
   * que ela salvou, ainda que seja uma coisa pequena"*. Ela responde "por que
   * guardei isto", que é o que se perde entre cortar e usar.
   *
   * **Privada por construção:** `comoCitacao()` devolve só a `Citacao`, sem a
   * nota, e é a `Citacao` que vai para o mural, o fórum e a sala. Assim não há
   * como um lembrete seu vazar publicado por descuido de uma tela — o texto que
   * as pessoas leem continua sendo o que você escreve no campo da conversa.
   */
  nota?: string;
}

function ler(): TrechoGuardado[] {
  try {
    const guardado = JSON.parse(localStorage.getItem(CHAVE) || "[]");
    if (!Array.isArray(guardado)) return [];
    /* `nota` fica fora da validação de propósito: trecho guardado antes de ela
       existir continua válido, só sem nota. */
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

/**
 * Reapara o corte de um trecho já guardado — **no lugar**, sem criar outro.
 *
 * É o que faz o "guardar num toque" (§4.46) não ser uma decisão final: o toque
 * leva 40 segundos na hora, ouvindo, e o ajuste fino vem depois, com calma. Se o
 * corte novo bater exatamente num trecho que já existe, o outro sai — senão a
 * lista acumularia dois cartões idênticos, que é o que `guardarTrecho` já evita.
 */
export function ajustarTrecho(id: string, inicioSec: number, duracaoSec: number): void {
  const lista = ler();
  const alvo = lista.find((item) => item.id === id);
  if (!alvo) return;

  const corte = criarCitacao(alvo.bookId, inicioSec, duracaoSec);
  gravar(
    lista
      .filter(
        (item) =>
          item.id === id ||
          !(
            item.bookId === corte.bookId &&
            item.inicioSec === corte.inicioSec &&
            item.duracaoSec === corte.duracaoSec
          ),
      )
      .map((item) => (item.id === id ? { ...item, ...corte } : item)),
  );
}

/** Escreve (ou apaga, com texto vazio) a nota do trecho. */
export function anotarTrecho(id: string, nota: string): void {
  const limpo = nota.trim().slice(0, MAX_NOTA_TRECHO);
  gravar(
    ler().map((item) =>
      item.id === id ? { ...item, nota: limpo || undefined } : item,
    ),
  );
}

/** Só a citação, sem o embrulho — o que as telas anexam de fato. */
export function comoCitacao(trecho: TrechoGuardado): Citacao {
  return criarCitacao(trecho.bookId, trecho.inicioSec, trecho.duracaoSec);
}
