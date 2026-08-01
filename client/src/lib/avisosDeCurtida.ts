/**
 * **“Ana Paula e mais 3 curtiram seu post”** — o aviso que faltava (§4.92).
 *
 * ---
 *
 * **A regra vinha decidida desde 29/07** (§4.58, resposta à dúvida 2): *“ser
 * notificado das interações (curtiram, comentaram, responderam ao seu
 * comentário)”*, com a parte fina já resolvida — **curtidas chegam agrupadas**
 * (“Ana e mais 3 curtiram seu post”, nunca um aviso por curtida) e **descurtida
 * não notifica**. A auditoria de 31/07 encontrou o resultado: só o comentário
 * avisava. Curtir não gerava nada, agrupado ou não.
 *
 * ---
 *
 * **O problema que este arquivo teve de resolver primeiro.** `curtidasDoPost`
 * devolve **zero** para o que é seu, e a razão está escrita lá: *“fingir que
 * estranhos curtiram o que você acabou de escrever seria a mentira mais fácil de
 * perceber”*. Ela está certa — e, tomada ao pé da letra, tornaria este aviso
 * impossível: sem curtida no que é seu, não há o que notificar.
 *
 * **A saída é o tempo, que é o que faltava na regra original.** “Acabei de
 * escrever” e “escrevi ontem” não são a mesma coisa: o defeito era fingir
 * plateia **imediata**, não fingir plateia. Então:
 *
 * - **nas 2 primeiras horas, nada** — ninguém viu ainda, e é o caso que a regra
 *   antiga protegia;
 * - **depois, as curtidas entram devagar**, um teto que cresce com a idade do
 *   post até ~6 pessoas;
 * - **a quantidade é semeada pelo id**, como todo número fictício do app, para
 *   não dançar a cada desenho.
 *
 * **Nada disto é gravado.** O aviso é *derivado* do post: se você apagar o post,
 * o aviso some junto, sem estado órfão para limpar. O que mora no `localStorage`
 * é só quais avisos você já leu.
 */

import { community, type CommunityMember } from "@/lib/community";
import { quemReagiu } from "@/lib/curtidas";
import { todosOsPosts, type Post } from "@/lib/posts";
import { readSettings } from "@/lib/settings";

const LIDOS_KEY = "allbook_avisos_curtida_lidos";

/** Antes disto, ninguém viu o seu post ainda. */
const CARENCIA_HORAS = 2;

/** A cada 6 horas cabe mais uma pessoa, até este teto. */
const TETO = 6;

export interface AvisoDeCurtida {
  id: string;
  postId: string;
  /** Quem curtiu, em ordem — o primeiro dá nome ao aviso. */
  quem: CommunityMember[];
  /** Um pedaço do post, para você saber qual é sem abrir. */
  trecho: string;
  /** ISO: quando a última curtida "chegou". É o que ordena o sino. */
  date: string;
  lido: boolean;
}

function horasDesde(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}

function semear(texto: string): number {
  let n = 0;
  for (let i = 0; i < texto.length; i += 1) n = (n * 31 + texto.charCodeAt(i)) % 99991;
  return n;
}

function lerLidos(): string[] {
  try {
    const guardado = JSON.parse(localStorage.getItem(LIDOS_KEY) || "[]");
    return Array.isArray(guardado) ? guardado : [];
  } catch {
    return [];
  }
}

/** Quem curtiu um post **seu**, em função de quanto tempo ele está no ar. */
function quemCurtiuOMeu(post: Post): CommunityMember[] {
  const horas = horasDesde(post.date);
  if (horas < CARENCIA_HORAS) return [];

  const teto = Math.min(TETO, 1 + Math.floor(horas / 6));
  const quantos = semear(post.id) % (teto + 1);
  if (quantos === 0) return [];

  /* `quemReagiu` com `totais` devolve gente de verdade de `community.ts`,
     embaralhada de forma estável pelo id — os mesmos nomes que a lista "quem
     reagiu" do post mostra. Duas telas discordando sobre quem curtiu é o tipo de
     incoerência que se acha em dez segundos. */
  const gente = quemReagiu(post.id, "curtiu", { totais: { curtiu: quantos, descurtiu: 0 } });
  return gente.length > 0 ? gente : community.slice(0, quantos);
}

/**
 * Os avisos de curtida, prontos para o sino.
 *
 * Um por post, nunca um por curtida — a regra da §4.58. Devolve vazio quando o
 * aviso está desligado nas Configurações.
 */
export function avisosDeCurtida(): AvisoDeCurtida[] {
  if (!readSettings().avisarCurtidas) return [];

  const lidos = new Set(lerLidos());

  return todosOsPosts()
    .filter((post) => post.autorSlug === undefined) // só o que é seu
    .map((post) => {
      const quem = quemCurtiuOMeu(post);
      if (quem.length === 0) return undefined;

      /* A data do aviso é a da **última** curtida, e ela é derivada da idade do
         post: uma hora depois da carência, mais uma a cada pessoa. Assim o aviso
         não fica preso à data do post e sobe no sino conforme engorda. */
      const chegou = new Date(
        new Date(post.date).getTime() + (CARENCIA_HORAS + quem.length) * 3_600_000,
      );
      const agora = Date.now();

      return {
        id: `curtida-${post.id}`,
        postId: post.id,
        quem,
        trecho: post.texto.slice(0, 80),
        date: new Date(Math.min(chegou.getTime(), agora)).toISOString(),
        lido: lidos.has(`curtida-${post.id}`),
      } satisfies AvisoDeCurtida;
    })
    .filter((aviso): aviso is AvisoDeCurtida => aviso !== undefined);
}

/** Marca um aviso como lido. */
export function marcarCurtidaLida(id: string): void {
  const lidos = lerLidos();
  if (lidos.includes(id)) return;
  try {
    localStorage.setItem(LIDOS_KEY, JSON.stringify([...lidos, id]));
  } catch {
    /* sem storage o aviso volta a aparecer não-lido; a tela já mostrou */
  }
}

/** Marca todos como lidos — o "marcar todas" do sino. */
export function marcarTodasCurtidasLidas(): void {
  const todos = avisosDeCurtida().map((aviso) => aviso.id);
  const juntos = [...lerLidos(), ...todos].filter((id, i, lista) => lista.indexOf(id) === i);
  try {
    localStorage.setItem(LIDOS_KEY, JSON.stringify(juntos));
  } catch {
    /* idem */
  }
}

/**
 * **Como o aviso é escrito.** Um nome e a conta do resto, que é a forma que a
 * §4.58 decidiu: *"Ana e mais 3 curtiram seu post"*.
 */
export function textoDoAviso(aviso: AvisoDeCurtida): string {
  const [primeiro, ...resto] = aviso.quem;
  const nome = primeiro?.name ?? "Alguém";
  if (resto.length === 0) return `${nome} curtiu seu post`;
  /* Sem a palavra "pessoas": é a forma exata que a §4.58 escreveu ("Ana e mais 3
     curtiram seu post"), e a longa não cabia numa linha — a tela cortava o "seu
     post", que é justamente o que diz do que o aviso fala. */
  return `${nome} e mais ${resto.length} curtiram seu post`;
}
