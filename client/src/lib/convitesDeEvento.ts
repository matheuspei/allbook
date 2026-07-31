/**
 * **Convidar alguém para um evento** — a segunda peça da ponte pedida em 31/07.
 *
 * O Matheus perguntou: *"se eu criar um evento convidando uma pessoa para ir
 * para o clube de leituras, eu consigo linkar isso a um clube?"*. O anexo do
 * clube está em `forumConteudo.ts`; aqui está o **convidar uma pessoa**, que
 * também não existia — o `convites.ts` convida para **clube**, que é outra
 * coisa.
 *
 * ---
 *
 * **As regras, e cada uma tem motivo:**
 *
 * - **Quem participa convida.** Mesmo princípio do convite de clube: exigir o
 *   moderador transforma ele em porteiro e o encontro para de crescer quando
 *   ele dorme.
 * - **Só dá para chamar quem poderia estar lá.** Em comunidade pública, a lista
 *   é a turma da comunidade mais quem você segue. Em comunidade privada, só a
 *   turma — chamar alguém para um evento que ela não pode nem abrir é o beco
 *   sem saída da §4.23.
 * - **Evento que já passou não aceita convite.** A tela explica o não em vez de
 *   esconder o botão: botão que some sem dizer por quê faz a pessoa achar que o
 *   app quebrou.
 * - **O convite não dá acesso ao fórum nem entrada no clube.** Ele confirma
 *   presença, e só. Entrar no clube continua sendo decisão de quem entra, pelo
 *   botão do cartão do clube dentro do evento.
 *
 * ⚠️ **A resposta é simulada, como no `convites.ts`.** Não há a outra pessoa
 * para receber: alguns segundos depois ela responde sozinha (quase sempre
 * "vou"), a contagem do evento sobe e o sino acende. Quando houver servidor,
 * some a simulação e ficam as mesmas telas — o que muda é quem responde.
 */

import { community, findMember } from "@/lib/community";
import { readFollowing } from "@/lib/following";
import { EU } from "@/lib/clubes";
import { configDo, membrosDo } from "@/lib/forum";
import {
  eventoPorId,
  presencaDe,
  registrarPresencaDe,
  type Evento,
  type Presenca,
} from "@/lib/forumConteudo";
import { addNotification } from "@/lib/notifications";

const CHAVE = "allbook_convites_de_evento";

export const CONVITES_DE_EVENTO_EVENT = "allbook:convites-de-evento";

export interface ConviteDeEvento {
  id: string;
  eventoId: string;
  /** Quem foi chamado — slug de `community.ts`. */
  paraSlug: string;
  date: string;
}

function ler(): ConviteDeEvento[] {
  try {
    const guardado = JSON.parse(localStorage.getItem(CHAVE) || "[]");
    return Array.isArray(guardado) ? (guardado as ConviteDeEvento[]) : [];
  } catch {
    return [];
  }
}

function gravar(lista: ConviteDeEvento[]): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {
    /* sem storage não persiste; a tela já mostrou o efeito */
  }
  window.dispatchEvent(new Event(CONVITES_DE_EVENTO_EVENT));
}

/** Quem você já chamou para este evento. */
export function convidadosDo(eventoId: string): string[] {
  return ler()
    .filter((item) => item.eventoId === eventoId)
    .map((item) => item.paraSlug);
}

/**
 * A lista de quem dá para chamar, na ordem em que a tela mostra.
 *
 * A turma da comunidade primeiro (é quem vai, na prática), depois quem você
 * segue. Comunidade privada corta a segunda metade — ver o cabeçalho.
 */
export function quemPossoConvidar(evento: Evento): string[] {
  const daComunidade = membrosDo(evento.grupoId)
    .map((item) => item.slug)
    .filter((slug) => slug !== EU);

  const publica = configDo(evento.grupoId).visibilidade === "publica";
  const seguidos = publica
    ? readFollowing().filter((slug) => !daComunidade.includes(slug))
    : [];

  /* Só gente que existe em `community.ts` — slug órfão viraria linha sem nome. */
  return [...daComunidade, ...seguidos].filter((slug) =>
    community.some((membro) => membro.slug === slug),
  );
}

/**
 * Dá para convidar esta pessoa? Uma função só, porque a tela precisa
 * **explicar** o não.
 */
export function podeConvidarParaEvento(
  eventoId: string,
  slug: string,
): { pode: boolean; motivo?: string } {
  const evento = eventoPorId(eventoId);
  if (!evento) return { pode: false, motivo: "Este evento não existe mais" };
  if (new Date(`${evento.data}T12:00:00`).getTime() < Date.now() - 86_400_000) {
    return { pode: false, motivo: "O evento já passou" };
  }
  if (evento.autorSlug === slug) return { pode: false, motivo: "É quem organiza" };

  /* A resposta vem **antes** do convite na ordem das checagens: quem já
     respondeu deve aparecer com a resposta ("vai", "talvez"), não com um
     "convite enviado" que soa como espera eterna — pego na tela em 31/07. */
  const respondeu = presencaDe(eventoId, slug);
  if (respondeu) {
    return {
      pode: false,
      motivo: respondeu === "vou" ? "vai" : respondeu === "talvez" ? "talvez" : "não vai",
    };
  }
  if (convidadosDo(eventoId).includes(slug)) return { pode: false, motivo: "aguardando resposta" };
  return { pode: true };
}

/** Convida. Devolve `false` quando alguma regra barra. */
export function convidarParaEvento(eventoId: string, slug: string): boolean {
  if (!podeConvidarParaEvento(eventoId, slug).pode) return false;
  gravar([
    ...ler(),
    { id: `ce-${Date.now()}`, eventoId, paraSlug: slug, date: new Date().toISOString() },
  ]);
  simularResposta(eventoId, slug);
  return true;
}

/**
 * A resposta do convidado, alguns segundos depois — a parte simulada.
 *
 * **Vai quase sempre, mas não sempre.** Um app em que todo convite vira
 * presença ensina errado: quem usa passa a achar que chamar é gratuito, e não
 * é. O sorteio é **estável pelo id do convite** (nada de `Math.random`, que
 * faria a mesma tela dizer coisas diferentes a cada desenho).
 */
function simularResposta(eventoId: string, slug: string): void {
  window.setTimeout(() => {
    const convite = ler().find(
      (item) => item.eventoId === eventoId && item.paraSlug === slug,
    );
    const evento = eventoPorId(eventoId);
    if (!convite || !evento) return;
    if (presencaDe(eventoId, slug)) return; // já respondeu

    let semente = 0;
    for (let i = 0; i < convite.id.length; i += 1) {
      semente = (semente * 31 + convite.id.charCodeAt(i)) % 9973;
    }
    const sorte = semente % 10;
    const resposta: Presenca = sorte < 6 ? "vou" : sorte < 8 ? "talvez" : "nao";

    registrarPresencaDe(eventoId, slug, resposta);

    const nome = findMember(slug)?.name.split(" ")[0] ?? "Alguém";
    addNotification({
      fromSlug: slug,
      forumId: evento.grupoId,
      text:
        resposta === "vou"
          ? `${nome} vai a "${evento.titulo}".`
          : resposta === "talvez"
            ? `${nome} respondeu talvez a "${evento.titulo}".`
            : `${nome} não vai poder ir a "${evento.titulo}".`,
    });
  }, 3000);
}
