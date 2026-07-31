/**
 * Reagir a uma fala do app — **curtir e descurtir**, com **quem** reagiu.
 *
 * ---
 *
 * ⚠️ **Correção de um erro meu, em 31/07. Vale ler antes de mexer.**
 *
 * Este arquivo nasceu (29/07, §4.59) sabendo **só curtir**, com um argumento que
 * eu apresentei como "decisão nova, tomada construindo": *post é fala de alguém, e
 * um contador de "não gostei" embaixo dela azeda o feed*.
 *
 * **Aquele argumento já tinha sido derrubado pelo Matheus — duas vezes — em
 * 21/07**, quando o curtir/descurtir da conversa do livro foi decidido:
 *
 * > *"Curtir e descurtir são tudo engajamento."* · *"Polêmica engaja — gerar
 * > sentimento, bom ou ruim, é o que faz a pessoa se interessar."*
 *
 * E o roteiro tinha fechado aquilo com todas as letras: *"Risco conhecido e
 * aceito (o Claude discordou duas vezes, o Matheus decidiu, e está decidido)…
 * **Não reabrir sem fato novo**"*. Não havia fato novo. Eu reabri assim mesmo, e
 * a §4.58 ainda mandava o contrário: levar `reactions.ts` — que tem **os dois
 * lados** — para o fórum, o mural do clube e a Comunidade.
 *
 * **Agora os dois existem aqui**, com a gramática que ele decidiu lá: exclusivos
 * entre si, tocar de novo desfaz, e **os dois mostram número**.
 *
 * ---
 *
 * **A lista de quem reagiu vem do mesmo lugar que o número, de propósito.**
 *
 * Enquanto só havia contador, ele podia ser um número solto tirado de uma
 * semente. Com a lista aberta, número e nomes **têm de bater** — 15 curtidas numa
 * comunidade de 13 pessoas é uma mentira que a própria tela denuncia no primeiro
 * toque. Por isso `quemReagiu` é a fonte, e o contador é o tamanho dela.
 *
 * ⚠️ **O que é simulado:** quem reagiu ao que **os outros** escreveram — sem
 * servidor não existe reação de ninguém além da sua. A escolha é **estável**
 * (semente pelo id), como o progresso dos membros do clube: número que muda a
 * cada desenho da tela é interface mentindo de forma visível.
 *
 * **O que é real:** a **sua** reação, gravada no `localStorage`.
 */

import { community, type CommunityMember } from "@/lib/community";

const CHAVE = "allbook_curtidas";

export const CURTIDAS_EVENT = "allbook:curtidas";

export type Reacao = "curtiu" | "descurtiu";

/** `{ [id da fala]: "curtiu" | "descurtiu" }` — **só as suas**. */
type MinhasReacoes = Record<string, Reacao>;

/**
 * Lê o que está guardado, **convertendo o formato antigo**.
 *
 * Até 31/07 isto era uma lista de ids curtidos (`string[]`). Quem já usava o app
 * tem esse formato no navegador, e perder as curtidas numa troca de formato seria
 * apagar trabalho de quem testou. Lista antiga vira mapa de "curtiu".
 */
function ler(): MinhasReacoes {
  try {
    const guardado = JSON.parse(localStorage.getItem(CHAVE) || "{}");

    if (Array.isArray(guardado)) {
      const convertido: MinhasReacoes = {};
      for (const id of guardado) if (typeof id === "string") convertido[id] = "curtiu";
      return convertido;
    }

    if (!guardado || typeof guardado !== "object") return {};
    const resultado: MinhasReacoes = {};
    for (const [id, valor] of Object.entries(guardado)) {
      if (valor === "curtiu" || valor === "descurtiu") resultado[id] = valor;
    }
    return resultado;
  } catch {
    return {};
  }
}

function gravar(mapa: MinhasReacoes): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(mapa));
  } catch {
    /* sem storage a reação não persiste; a tela já mostrou o efeito */
  }
  window.dispatchEvent(new Event(CURTIDAS_EVENT));
}

/** A sua reação a esta fala, se houver. */
export function minhaReacao(id: string): Reacao | undefined {
  return ler()[id];
}

/**
 * Aplica a reação e devolve o estado novo.
 *
 * **Tocar de novo no que já estava marcado desfaz**, e **curtir depois de
 * descurtir troca uma pela outra** — a mesma gramática do `reactions.ts` da
 * conversa do livro, decidida pelo Matheus em 21/07. Duas gramáticas para o mesmo
 * gesto seria o defeito que a §4.67 varreu.
 */
export function alternarReacao(id: string, reacao: Reacao): Reacao | undefined {
  const atual = ler();
  if (atual[id] === reacao) {
    delete atual[id];
    gravar(atual);
    return undefined;
  }
  atual[id] = reacao;
  gravar(atual);
  return reacao;
}

export interface OpcoesDeReacao {
  /**
   * A fala é de outra pessoa? **Quem sabe é a tela**, e por isso isto é
   * parâmetro em vez de adivinhação: no fórum e no mural do clube os ids não
   * seguem um padrão que diga de quem é, e adivinhar pelo formato faria o app
   * fingir curtidas no que **você** escreveu.
   */
  deOutraPessoa?: boolean;
  /** "fala" é a escala pequena: resposta de fórum, comentário, mural. */
  escala?: "post" | "fala";
  /**
   * O autor da fala, para ele não aparecer reagindo a si mesmo — detalhe que só
   * fica visível quando a lista abre, e que denunciaria a simulação.
   */
  autorSlug?: string;
  /**
   * Quando o número **já existe e é curado**, em vez de sorteado.
   *
   * É o caso da conversa do livro: os comentários de `comments.ts` trazem
   * `likes`/`dislikes` escritos à mão, e a lista tem de **caber neles** — senão a
   * folha abriria com sete nomes embaixo de um "12". A lista continua sendo a
   * mesma gente estável; só o tamanho vem de fora.
   */
  totais?: { curtiu: number; descurtiu: number };
}

/** Números pequenos e coerentes com o tamanho da comunidade. */
const TETO: Record<"post" | "fala", { curtiu: number; descurtiu: number }> = {
  /*
    **A descurtida é bem mais rara que a curtida, e isso não é censura ao
    contrário.** É o que se observa em qualquer lugar onde as duas existem: quem
    discorda comenta, quem concorda toca no coração. Um feed em que metade das
    falas leva descurtida não seria "honesto", seria uma comunidade que não é esta.
  */
  post: { curtiu: 13, descurtiu: 4 },
  fala: { curtiu: 6, descurtiu: 2 },
};

/** Semente estável: o mesmo id devolve sempre a mesma sequência. */
function semear(id: string, tempero: number): number {
  let semente = tempero;
  for (let i = 0; i < id.length; i += 1) semente = (semente * 31 + id.charCodeAt(i)) % 99991;
  return semente;
}

/**
 * **Quem** reagiu — a fonte de verdade, da qual o número é derivado.
 *
 * As duas listas saem de **uma permutação só** da comunidade, embaralhada pela
 * semente do id: os primeiros curtiram, os seguintes descurtiram. Com isso
 * ninguém aparece **nos dois lados** da mesma fala, que é a incoerência que a
 * pessoa acha em dez segundos abrindo as duas listas.
 */
export function quemReagiu(
  id: string,
  reacao: Reacao,
  opcoes: OpcoesDeReacao = {},
): CommunityMember[] {
  const deOutra = opcoes.deOutraPessoa ?? (id.startsWith("p-esq-") || id.startsWith("c-esq-"));
  /* Com total vindo de fora, a fala pode ser sua e ainda ter gente — é o caso da
     conversa do livro, onde o comentário é seu e as curtidas são do catálogo. */
  if (!deOutra && !opcoes.totais) return [];

  const escala = opcoes.escala ?? (id.startsWith("c-esq-") ? "fala" : "post");
  const candidatos = community.filter((membro) => membro.slug !== opcoes.autorSlug);
  if (candidatos.length === 0) return [];

  /* Embaralho estável (Fisher-Yates com gerador determinístico): o mesmo id dá
     sempre a mesma gente, e ids parecidos não dão listas parecidas. */
  const baralho = [...candidatos];
  let estado = semear(id, 7);
  for (let i = baralho.length - 1; i > 0; i -= 1) {
    estado = (estado * 1103515245 + 12345) % 2147483648;
    const j = estado % (i + 1);
    [baralho[i], baralho[j]] = [baralho[j], baralho[i]];
  }

  const teto = TETO[escala];
  /* Os tetos são intenção, não garantia: a comunidade é pequena, e pedir 13
     nomes de uma lista de 12 devolveria menos gente do que o número promete. */
  const quantosCurtiram = Math.min(
    opcoes.totais ? opcoes.totais.curtiu : semear(id, 3) % (teto.curtiu + 1),
    baralho.length,
  );

  if (opcoes.totais) {
    const quantosDescurtiram = Math.min(
      opcoes.totais.descurtiu,
      baralho.length - quantosCurtiram,
    );
    return reacao === "curtiu"
      ? baralho.slice(0, quantosCurtiram)
      : baralho.slice(quantosCurtiram, quantosCurtiram + quantosDescurtiram);
  }

  /*
    **A descurtida é uma fração da curtida, nunca um número solto.** Visto na tela
    em 31/07: sorteando os dois independentes, o primeiro post do feed saiu com
    "3 curtiram · 3 descurtiram" — número possível e leitura errada, porque numa
    comunidade de leitores metade da gente não descurte o que a outra metade
    curtiu. Agora ela é **até ~35% das curtidas**, o que mantém a hierarquia
    visual e ainda deixa a discordância existir, que é o que o Matheus decidiu
    (*"polêmica engaja"*).
  */
  const proporcao = (semear(id, 11) % 36) / 100;
  const quantosDescurtiram = Math.min(
    Math.round(quantosCurtiram * proporcao),
    teto.descurtiu,
    baralho.length - quantosCurtiram,
  );

  return reacao === "curtiu"
    ? baralho.slice(0, quantosCurtiram)
    : baralho.slice(quantosCurtiram, quantosCurtiram + quantosDescurtiram);
}

/**
 * Quantas pessoas curtiram — **fora você**.
 *
 * O que **você** escreveu começa em zero de propósito: fingir que estranhos
 * curtiram o que você acabou de escrever seria a mentira mais fácil de perceber, e
 * a que mais desmoraliza o resto.
 */
export function curtidasDoPost(id: string, opcoes: OpcoesDeReacao = {}): number {
  return quemReagiu(id, "curtiu", opcoes).length;
}
