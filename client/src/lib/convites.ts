/**
 * Convite para clube — **o item 5 da ordem da §4.58**.
 *
 * Nasceu de uma das cinco capturas que o Matheus trouxe em 29/07 ("convidar
 * alguém para o clube pela página dela"), aprovada pelos dois na hora. As regras
 * foram fechadas na mesma conversa:
 *
 * - **Qualquer membro convida**, não só o dono. Um clube cresce por quem já está
 *   dentro; exigir o moderador para cada convite transforma ele em porteiro e o
 *   clube para de crescer quando ele dorme. **Quem remove continua sendo o
 *   dono** — convidar é abrir a porta, remover é decisão de moderação.
 * - **O convite morre quando o clube enche** — a vaga que ele prometia não
 *   existe mais, e um convite que leva a "clube lotado" é o beco sem saída da
 *   §4.23.
 * - **E morre quando o ciclo começa**: entrar no meio do livro é chegar numa
 *   conversa que já tem spoiler. Quem quiser entrar depois entra pela página do
 *   clube, sabendo que está atrasado; o que não pode é o app **convidar** para
 *   isso.
 *
 * ---
 *
 * ⚠️ **Os dois lados existem, e um deles é simulado** — como no resto da maquete
 * (`community.ts`), não há a outra pessoa para receber ou mandar de verdade:
 *
 * - **Você convida** alguém: o convite fica pendente e a pessoa **responde
 *   sozinha** alguns segundos depois (aceita, quase sempre), entra na turma e o
 *   sino acende. É o mesmo recurso do comentário que recebe resposta (§4.62), e
 *   existe pelo mesmo motivo: sem ele, convidar cai no vazio e ninguém descobre
 *   como o ciclo se fecha.
 * - **Você recebe** um convite semeado, para o lado de aceitar não nascer morto.
 *
 * Quando houver servidor — e ele vai existir —, some a simulação e ficam as
 * mesmas telas: o que muda é quem responde.
 */

import {
  EU,
  adicionarMembro,
  clubeCheio,
  clubePorId,
  entrarNoClube,
  estaComecando,
} from "@/lib/clubes";
import { findMember } from "@/lib/community";
import { addNotification } from "@/lib/notifications";

const CHAVE = "allbook_convites";

export const CONVITES_EVENT = "allbook:convites";

export interface Convite {
  id: string;
  clubeId: string;
  /** Quem convidou. `EU` quando foi você. */
  deSlug: string;
  /** Quem foi convidado. `EU` quando o convite é para você. */
  paraSlug: string;
  date: string;
  estado: "pendente" | "aceito" | "recusado";
}

/**
 * O convite que o esqueleto te manda.
 *
 * **Existe para o lado de receber não nascer morto**: sem ele, "aceitar no sino"
 * seria uma tela que ninguém veria antes de haver servidor. O clube escolhido é
 * um dos semeados que ainda não começou — o mesmo critério que o feed usa para
 * convidar (§4.64), e pela mesma razão: dá para entrar desde o capítulo 1.
 */
const SEMEADO: Convite = {
  id: "cv-esq-1",
  /* "Não durmo mais" — o de estreia mais próxima entre os semeados. */
  clubeId: "exorcista",
  deSlug: "carla-lima",
  paraSlug: EU,
  date: new Date(Date.now() - 5 * 3600_000).toISOString(),
  estado: "pendente",
};

function ler(): Convite[] {
  try {
    const guardado = JSON.parse(localStorage.getItem(CHAVE) || "[]");
    if (!Array.isArray(guardado)) return [];
    return guardado.filter(
      (item): item is Convite =>
        item &&
        typeof item.id === "string" &&
        typeof item.clubeId === "string" &&
        typeof item.paraSlug === "string",
    );
  } catch {
    return [];
  }
}

function gravar(lista: Convite[]): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {
    /* sem storage o convite não persiste; a tela já mostrou o efeito */
  }
  window.dispatchEvent(new Event(CONVITES_EVENT));
}

/** Todos, os seus e o semeado — o semeado só enquanto ninguém respondeu. */
function todos(): Convite[] {
  const meus = ler();
  const respondido = meus.some((item) => item.id === SEMEADO.id);
  return respondido ? meus : [...meus, SEMEADO];
}

/**
 * Dá para convidar alguém para este clube?
 *
 * Uma função só para as três regras, porque a tela precisa **explicar** o não —
 * botão que some sem dizer por quê faz a pessoa achar que o app quebrou.
 */
export function podeConvidarPara(clubeId: string, slug: string): { pode: boolean; motivo?: string } {
  const clube = clubePorId(clubeId);
  if (!clube) return { pode: false, motivo: "Este clube não existe mais" };
  if (clube.membros.includes(slug)) return { pode: false, motivo: "Já está na turma" };
  if (clubeCheio(clube)) return { pode: false, motivo: "Clube lotado" };
  if (!estaComecando(clube)) return { pode: false, motivo: "O ciclo já começou" };
  if (convitePendente(clubeId, slug)) return { pode: false, motivo: "Convite enviado" };
  return { pode: true };
}

export function convitePendente(clubeId: string, slug: string): boolean {
  return todos().some(
    (item) => item.clubeId === clubeId && item.paraSlug === slug && item.estado === "pendente",
  );
}

/** Os convites que **você** recebeu e ainda não respondeu. */
export function convitesParaMim(): Convite[] {
  return todos()
    .filter((item) => item.paraSlug === EU && item.estado === "pendente")
    /* Convite para clube que encheu ou já começou **some da lista**: as regras
       valem depois de enviado, senão o convite vira uma promessa vencida. */
    .filter((item) => {
      const clube = clubePorId(item.clubeId);
      return clube !== undefined && !clubeCheio(clube) && estaComecando(clube);
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Convida alguém. Devolve `false` quando alguma das regras barra. */
export function convidar(clubeId: string, slug: string): boolean {
  if (!podeConvidarPara(clubeId, slug).pode) return false;
  gravar([
    ...ler(),
    {
      id: `cv-${Date.now()}`,
      clubeId,
      deSlug: EU,
      paraSlug: slug,
      date: new Date().toISOString(),
      estado: "pendente",
    },
  ]);
  return true;
}

/**
 * A resposta do convidado, alguns segundos depois — a parte simulada.
 *
 * **Aceita quase sempre, mas não sempre.** Um app em que todo convite é aceito
 * ensina errado: quem usa passa a achar que convidar é gratuito, e não é. Um em
 * cada quatro recusa, sem drama e sem motivo exposto — recusar convite não deve
 * cobrar explicação de ninguém.
 */
export function simularResposta(clubeId: string, slug: string): void {
  window.setTimeout(() => {
    const convite = ler().find(
      (item) => item.clubeId === clubeId && item.paraSlug === slug && item.estado === "pendente",
    );
    if (!convite) return;

    /* Sorteio estável pelo id do convite (nada de `Math.random`, que faria a
       mesma tela dizer coisas diferentes a cada desenho). */
    let semente = 0;
    for (let i = 0; i < convite.id.length; i += 1) {
      semente = (semente * 31 + convite.id.charCodeAt(i)) % 9973;
    }
    const aceitou = semente % 4 !== 0;
    const clube = clubePorId(clubeId);
    const nome = findMember(slug)?.name.split(" ")[0] ?? "Alguém";

    gravar(
      ler().map((item) =>
        item.id === convite.id ? { ...item, estado: aceitou ? "aceito" : "recusado" } : item,
      ),
    );
    if (aceitou) adicionarMembro(clubeId, slug);

    addNotification({
      fromSlug: slug,
      clubeId,
      text: aceitou
        ? `${nome} entrou no clube ${clube?.nome ?? ""}.`
        : `${nome} não pôde entrar no clube ${clube?.nome ?? ""} desta vez.`,
    });
  }, 3000);
}

/** Você aceitou: **entra na turma** e o convite sai da lista de pendentes. */
export function aceitarConvite(id: string): string | undefined {
  const convite = todos().find((item) => item.id === id);
  if (!convite) return undefined;
  gravar([...ler().filter((item) => item.id !== id), { ...convite, estado: "aceito" }]);
  /* Entrar acontece **aqui**, e não na tela: aceitar um convite e não entrar
     seriam dois passos para uma decisão só, e a tela que esquecesse o segundo
     deixaria a pessoa fora do clube achando que entrou. */
  entrarNoClube(convite.clubeId);
  return convite.clubeId;
}

export function recusarConvite(id: string): void {
  const convite = todos().find((item) => item.id === id);
  if (!convite) return;
  gravar([
    ...ler().filter((item) => item.id !== id),
    { ...convite, estado: "recusado" },
  ]);
}
