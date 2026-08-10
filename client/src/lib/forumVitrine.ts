/**
 * **A vitrine das comunidades** — os números e as listas que dão vida à aba.
 *
 * Nasceu em 31/07, do recado do Matheus sobre `/forum`: *"eu acho essa primeira
 * janela muito crua, sem vida nenhuma"*. A tela era um campo de busca, uma
 * grade e uma lista — tudo estático, nada dizendo **o que está acontecendo**.
 *
 * Aqui ficam as contas que uma vitrine viva precisa, e **todas saem de dado que
 * já existe** (tópicos, respostas, membros, categorias). Nenhuma inventa
 * número: quando não há movimento, a função devolve lista vazia e a tela some
 * com o bloco, em vez de mostrar "0 mensagens esta semana" — que é a versão
 * educada de mentir que existe atividade.
 */

import { nomeDoMembro } from "@/lib/clubes";
import { readFollowing } from "@/lib/following";
import { CATEGORIAS, categoriaDe, forunsVisiveis, membrosDo, situacaoDe } from "@/lib/forum";
import { topicosDa, type Grupo } from "@/lib/grupos";

/** A janela do "esta semana" — sete dias, como em toda parte do app. */
const DIAS_DE_ALTA = 7;

export interface Movimento {
  topicos: number;
  mensagens: number;
  /** Tópicos com mensagem nos últimos sete dias. */
  conversasDaSemana: number;
  /** ISO curto da última mensagem, se houver. */
  ultima?: string;
}

function diasDesde(iso: string): number {
  const quando = new Date(`${iso.slice(0, 10)}T12:00:00`).getTime();
  return Math.floor((Date.now() - quando) / 86_400_000);
}

/** "hoje", "ontem", "há 3 dias" — a idade de uma conversa, em português. */
export function haQuantoTempo(iso: string): string {
  const dias = diasDesde(iso);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 30) return `há ${dias} dias`;
  const meses = Math.floor(dias / 30);
  return meses === 1 ? "há um mês" : `há ${meses} meses`;
}

export function movimentoDe(grupoId: string): Movimento {
  const topicos = topicosDa(grupoId);
  let mensagens = 0;
  let conversasDaSemana = 0;
  let ultima: string | undefined;

  for (const topico of topicos) {
    mensagens += topico.totalRespostas;
    if (diasDesde(topico.ultimaAtividade) <= DIAS_DE_ALTA) conversasDaSemana += 1;
    if (!ultima || topico.ultimaAtividade > ultima) ultima = topico.ultimaAtividade;
  }

  return { topicos: topicos.length, mensagens, conversasDaSemana, ultima };
}

/**
 * **Em alta** — as comunidades que se mexeram esta semana, com o motivo escrito.
 *
 * Ordena por conversas da semana e, no empate, por total de mensagens. Fica de
 * fora quem não teve nada nos sete dias: uma vitrine de "em alta" cheia de
 * comunidade parada é o mesmo que não ter vitrine.
 */
export function emAlta(limite = 6): { grupo: Grupo; motivo: string }[] {
  return forunsVisiveis()
    .map((grupo) => ({ grupo, movimento: movimentoDe(grupo.id) }))
    .filter((item) => item.movimento.conversasDaSemana > 0)
    .sort(
      (a, b) =>
        b.movimento.conversasDaSemana - a.movimento.conversasDaSemana ||
        b.movimento.mensagens - a.movimento.mensagens,
    )
    .slice(0, limite)
    .map(({ grupo, movimento }) => ({
      grupo,
      motivo:
        movimento.conversasDaSemana === 1
          ? "1 conversa esta semana"
          : `${movimento.conversasDaSemana} conversas esta semana`,
    }));
}

/**
 * Quantas comunidades há em cada categoria — **todas as categorias, sempre**.
 *
 * ⚠️ **Devolvia só as que tinham comunidade, e isso estava errado** (31/07): a
 * tela dizia "36 no total" e mostrava doze pastilhas, o que o Matheus pegou na
 * hora — *"não aparecem as 36 categorias, e você não consegue pesquisar"*. Uma
 * categoria vazia é um lugar legítimo para ir: quem chega lá vê que está livre
 * e ganha o convite para criar a primeira comunidade do assunto.
 *
 * A ordem é a útil: as com gente primeiro (por tamanho), as vazias depois, em
 * ordem alfabética.
 */
export function porCategoria(): { categoria: string; total: number }[] {
  const conta = new Map<string, number>();
  for (const categoria of CATEGORIAS) conta.set(categoria, 0);
  for (const grupo of forunsVisiveis()) {
    const categoria = categoriaDe(grupo.id);
    if (!categoria) continue;
    conta.set(categoria, (conta.get(categoria) ?? 0) + 1);
  }
  return Array.from(conta, ([categoria, total]) => ({ categoria, total })).sort(
    (a, b) => b.total - a.total || a.categoria.localeCompare(b.categoria),
  );
}

/**
 * O motivo que descreve **o que a comunidade tem** — o único que varia sozinho,
 * porque sai de números que são dela.
 *
 * Serve em dois papéis: é o motivo de quem é sugerido pelo assunto, e é o
 * **desempate** quando o motivo mais forte sairia repetido (ver `sugestoes`).
 * A categoria entra como complemento quando existe.
 */
function motivoDeMovimento(grupoId: string, categoria?: string): string {
  const onde = categoria ? ` em ${categoria.toLowerCase()}` : "";
  const sobre = categoria ? ` sobre ${categoria.toLowerCase()}` : "";
  const { conversasDaSemana, topicos } = movimentoDe(grupoId);

  if (conversasDaSemana > 0) {
    return conversasDaSemana === 1
      ? `1 conversa esta semana${onde}`
      : `${conversasDaSemana} conversas esta semana${onde}`;
  }
  if (topicos > 1) return `${topicos} conversas${sobre}`;
  const pessoas = membrosDo(grupoId).length;
  if (topicos === 1) return `${pessoas} pessoas, e a primeira conversa já começou`;
  return `${pessoas} pessoas, e a conversa ainda vai começar`;
}

/**
 * **Para você** — comunidades de fora, com o motivo de estarem sendo sugeridas.
 *
 * Dois motivos, nesta ordem de preferência: **gente que você segue está lá**
 * (o mais forte, e o mesmo critério que a §4.58 usou nas sugestões da
 * Comunidade) e **é da categoria de uma comunidade sua**. Sem motivo, não
 * sugere — recomendação sem porquê é lista aleatória com nome bonito.
 *
 * ⚠️ **O motivo saía idêntico em cartões seguidos** — "também é de ficção
 * científica", palavra por palavra, três vezes na mesma dobra (apontado na
 * §4.104 e consertado em 08/08). Frase repetida lê como enfeite, não como
 * razão: quem vê três iguais para de ler todas. Duas coisas mudaram, e a
 * segunda é a que resolveu de verdade — ver `semRepetirAFrase` no fim do
 * arquivo. Nenhum número é inventado: todos saem de `movimentoDe`.
 */
export function sugestoes(limite = 3): { grupo: Grupo; motivo: string }[] {
  const sigo = readFollowing();
  const minhasCategorias = new Set(
    forunsVisiveis()
      .filter((grupo) => situacaoDe(grupo.id) === "dentro")
      .map((grupo) => categoriaDe(grupo.id))
      .filter((item): item is string => Boolean(item)),
  );

  return forunsVisiveis()
    .filter((grupo) => situacaoDe(grupo.id) !== "dentro")
    .map((grupo) => {
      const conhecidos = membrosDo(grupo.id).filter((membro) => sigo.includes(membro.slug));
      if (conhecidos.length > 0) {
        /*
         * ⚠️ **Dizia "alguém que você segue está aqui"** — e saía igual em
         * quatro cartões seguidos (visto na tela em 08/08). Com o nome, cada
         * cartão diz uma coisa diferente **e** diz mais: "a Juliana está aqui"
         * é motivo; "alguém" é categoria de motivo. O nome já é público em todo
         * o app (perfil, comentário, membro do clube), então não vaza nada — e
         * quem você segue você sabe quem é.
         */
        const primeiro = nomeDoMembro(conhecidos[0].slug);
        return {
          grupo,
          peso: 2,
          motivo:
            conhecidos.length === 1
              ? `${primeiro} está aqui`
              : conhecidos.length === 2
                ? `${primeiro} e mais 1 que você segue estão aqui`
                : `${primeiro} e mais ${conhecidos.length - 1} que você segue estão aqui`,
        };
      }
      const categoria = categoriaDe(grupo.id);
      if (categoria && minhasCategorias.has(categoria)) {
        return { grupo, peso: 1, motivo: motivoDeMovimento(grupo.id, categoria) };
      }
      return { grupo, peso: 0, motivo: "" };
    })
    .filter((item) => item.peso > 0)
    .sort((a, b) => b.peso - a.peso)
    .slice(0, limite);
}

/**
 * **Nenhuma frase de motivo aparece duas vezes na mesma lista.**
 *
 * A primeira tentativa de consertar a repetição (08/08) trocou "alguém que você
 * segue está aqui" pelo nome da pessoa — e na tela **continuou igual**: eu sigo
 * uma pessoa só, ela está em quatro comunidades, e os quatro cartões passaram a
 * dizer "Juliana S. está aqui". **A lição:** trocar o texto não conserta
 * repetição quando o *dado* é o mesmo; o desempate tem que ser outro dado.
 *
 * Então o motivo mais forte fica com o **primeiro** cartão — é dele que a frase
 * informa mais — e os seguintes caem para o que descreve cada comunidade por si.
 * A ordem nunca muda: quem entra primeiro é quem tem o motivo mais forte.
 *
 * ⚠️ **Roda na lista final da tela, não dentro de `sugestoes`.** O carrossel
 * "Recomendado para você" é feito de **duas** fontes (`sugestoes` + `emAlta`),
 * e as duas escrevem motivo; limpar só uma delas deixaria a repetição
 * atravessar a emenda.
 *
 * Empate ainda é possível (duas comunidades novas, do mesmo tamanho, sem
 * conversa). Aí a frase igual é a verdade: não há o que as separe.
 */
export function semRepetirAFrase(
  lista: { grupo: Grupo; motivo: string }[],
): { grupo: Grupo; motivo: string }[] {
  const ditas = new Set<string>();
  return lista.map(({ grupo, motivo }) => {
    if (!ditas.has(motivo)) {
      ditas.add(motivo);
      return { grupo, motivo };
    }
    const alternativo = motivoDeMovimento(grupo.id, categoriaDe(grupo.id) ?? undefined);
    ditas.add(alternativo);
    return { grupo, motivo: alternativo };
  });
}
