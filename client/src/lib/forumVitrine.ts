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

import { readFollowing } from "@/lib/following";
import { CATEGORIAS, categoriaDe, forunsVisiveis, membrosDo, situacaoDe } from "@/lib/forum";
import { topicosDa, type Grupo, type TopicoNaTela } from "@/lib/grupos";

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
 * **Acontecendo agora** — os últimos tópicos com mensagem, de todas as
 * comunidades que você pode ler.
 *
 * É o bloco que responde "tem gente aqui?" sem a pessoa precisar entrar em
 * comunidade nenhuma.
 */
export function acontecendoAgora(limite = 5): { grupo: Grupo; topico: TopicoNaTela }[] {
  const tudo: { grupo: Grupo; topico: TopicoNaTela }[] = [];
  for (const grupo of forunsVisiveis()) {
    for (const topico of topicosDa(grupo.id)) tudo.push({ grupo, topico });
  }
  return tudo
    .sort((a, b) => b.topico.ultimaAtividade.localeCompare(a.topico.ultimaAtividade))
    .slice(0, limite);
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
 * **Para você** — comunidades de fora, com o motivo de estarem sendo sugeridas.
 *
 * Dois motivos, nesta ordem de preferência: **gente que você segue está lá**
 * (o mais forte, e o mesmo critério que a §4.58 usou nas sugestões da
 * Comunidade) e **é da categoria de uma comunidade sua**. Sem motivo, não
 * sugere — recomendação sem porquê é lista aleatória com nome bonito.
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
        return {
          grupo,
          peso: 2,
          motivo:
            conhecidos.length === 1
              ? "alguém que você segue está aqui"
              : `${conhecidos.length} pessoas que você segue estão aqui`,
        };
      }
      const categoria = categoriaDe(grupo.id);
      if (categoria && minhasCategorias.has(categoria)) {
        return { grupo, peso: 1, motivo: `também é de ${categoria.toLowerCase()}` };
      }
      return { grupo, peso: 0, motivo: "" };
    })
    .filter((item) => item.peso > 0)
    .sort((a, b) => b.peso - a.peso)
    .slice(0, limite)
    .map(({ grupo, motivo }) => ({ grupo, motivo }));
}

/** Os números do rodapé da vitrine. */
export function numerosDoForum(): {
  comunidades: number;
  topicos: number;
  mensagens: number;
  pessoas: number;
} {
  const visiveis = forunsVisiveis();
  const pessoas = new Set<string>();
  let topicos = 0;
  let mensagens = 0;

  for (const grupo of visiveis) {
    const movimento = movimentoDe(grupo.id);
    topicos += movimento.topicos;
    mensagens += movimento.mensagens;
    for (const membro of membrosDo(grupo.id)) pessoas.add(membro.slug);
  }

  return { comunidades: visiveis.length, topicos, mensagens, pessoas: pessoas.size };
}
