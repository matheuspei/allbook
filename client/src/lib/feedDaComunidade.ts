/**
 * O que o feed da Comunidade mostra, **em uma lista só** — posts, o que foi
 * compartilhado, e os cartões de clube e de fórum intercalados.
 *
 * ---
 *
 * **Por que existe um montador em vez de a tela juntar tudo.**
 *
 * O feed deixou de ser "a lista de posts" no momento em que a §4.58 decidiu duas
 * coisas: que **compartilhar** republica o post de outra pessoa (e portanto o
 * mesmo post pode aparecer em dois lugares, por motivos diferentes), e que
 * **clube e fórum não ficam enterrados numa gaveta — eles aparecem como cartões
 * no feed** (item 7 do quadro de decisões). Com isso a lista passou a ter tipos
 * diferentes de item, e quem decide a mistura precisa ser um lugar só: espalhar
 * essa regra pela tela é como se perde o controle da ordem.
 *
 * **A ordem continua cronológica pura** para tudo que tem data (post e
 * compartilhamento) — decisão de 29/07, sem algoritmo. Os cartões de clube e de
 * fórum **não têm data que valha**: entram em posições fixas, contadas a partir
 * do topo, e é por isso que eles não bagunçam a cronologia — quem lê continua
 * conseguindo prever a ordem.
 */

import { type Grupo, type TopicoNaTela, participoDa, todosOsGrupos, topicosDa } from "@/lib/grupos";
import {
  clubeCheio,
  clubesComecando,
  clubesParaDescobrir,
  souMembro,
  type Clube,
} from "@/lib/clubes";
import { meusCompartilhamentos } from "@/lib/compartilhados";
import {
  compartilhamentosDoEsqueleto,
  postsDeQuemVoceSegue,
  todosOsPosts,
  type Post,
} from "@/lib/posts";

/** As duas lentes: a comunidade toda, ou só quem você segue (§4.58). */
export type Lente = "todos" | "seguindo";

export type ItemDoFeed =
  /** Um post, do jeito que foi escrito. */
  | { tipo: "post"; chave: string; data: string; post: Post }
  /**
   * O mesmo post, republicado por alguém — a linha "Fulano compartilhou" em
   * cima e o cartão original embaixo, **sem caixa dentro de caixa**.
   */
  | {
      tipo: "compartilhado";
      chave: string;
      data: string;
      post: Post;
      /** Quem compartilhou. **Ausente = você.** */
      porSlug?: string;
    }
  | { tipo: "clube"; chave: string; clube: Clube; comecando: boolean }
  | { tipo: "forum"; chave: string; grupo: Grupo; topico: TopicoNaTela };

/**
 * Onde os cartões de clube e de fórum entram, contando do topo.
 *
 * **Não é gosto: é o que impede o convite de virar propaganda.** No topo, o
 * cartão de clube seria a primeira coisa da Comunidade — e a Comunidade é das
 * pessoas, não do app oferecendo coisa. Depois de três posts, quem chegou já leu
 * gente antes de receber convite. O fórum vem bem mais abaixo porque é o item
 * menos visual dos dois (não tem capa), e dois convites seguidos leem como
 * anúncio.
 */
const POSICAO_DO_CLUBE = 3;
const POSICAO_DO_FORUM = 8;

/**
 * Abaixo disto, nada é intercalado.
 *
 * Um cartão de convite no meio de dois posts é tempero; no meio de **um** post é
 * a tela inteira. Feed curto é feed de quem está começando — e é justamente
 * quando o app não pode parecer que está vendendo alguma coisa.
 */
const MINIMO_PARA_INTERCALAR = 4;

/**
 * O clube que vale mostrar a quem não está nele.
 *
 * **Prefere o que ainda vai estrear**, e essa é a diferença para a vitrine da
 * tela de Clubes (que usa `clubesParaDescobrir` e de propósito **exclui** os que
 * não começaram, porque lá eles têm prateleira própria). Aqui não há prateleira,
 * e clube que ainda não começou é o de maior valor para quem chega: dá para
 * entrar **desde o primeiro capítulo**, em vez de alcançar uma turma no meio do
 * livro. Ele ainda traz o que um feed cronológico entende — um prazo.
 */
function clubeParaOFeed(): { clube: Clube; comecando: boolean } | undefined {
  /* **Clube lotado não entra.** Convite para uma porta fechada é o beco sem
     saída que a §4.23 manda varrer — e é pior que um botão morto, porque a
     pessoa só descobre depois de se interessar. */
  const aberto = (clube: Clube) => !souMembro(clube) && !clubeCheio(clube);

  const estreando = clubesComecando().filter(aberto);
  if (estreando.length > 0) return { clube: estreando[0], comecando: true };
  const emAndamento = clubesParaDescobrir().filter(aberto);
  return emAndamento.length > 0 ? { clube: emAndamento[0], comecando: false } : undefined;
}

/**
 * O fio de fórum mais vivo — **por atividade recente, não por tamanho**.
 *
 * Um tópico com 40 respostas de três meses atrás está morto; um com 4 de ontem
 * está acontecendo, e é nele que alguém que chega tem o que dizer. O total de
 * respostas fica só como desempate.
 *
 * **Fio seu não entra:** você não precisa ser convidado para a conversa que você
 * mesmo começou — seria o app te mostrando a sua própria voz.
 */
function topicoParaOFeed(): { grupo: Grupo; topico: TopicoNaTela } | undefined {
  const candidatos = todosOsGrupos().flatMap((grupo) =>
    topicosDa(grupo.id)
      .filter((topico) => !topico.meu)
      .map((topico) => ({ grupo, topico })),
  );

  return candidatos.sort(
    (a, b) =>
      b.topico.ultimaAtividade.localeCompare(a.topico.ultimaAtividade) ||
      b.topico.totalRespostas - a.topico.totalRespostas ||
      /* Empatado o resto, o fórum de que você **não** participa vem antes: para
         quem já está dentro, o tópico não é novidade — ele está a um toque na
         aba Fóruns. */
      Number(participoDa(a.grupo.id)) - Number(participoDa(b.grupo.id)),
  )[0];
}

/**
 * A lista pronta para a tela.
 *
 * `seguindo` é a lista de slugs de quem você segue — vem da tela porque ela já a
 * mantém em estado, e assim o montador não lê o `localStorage` a cada desenho.
 */
export function montarFeed(lente: Lente, seguindo: string[]): ItemDoFeed[] {
  const posts = lente === "seguindo" ? postsDeQuemVoceSegue(seguindo) : todosOsPosts();
  const porId = new Map(todosOsPosts().map((post) => [post.id, post]));

  /* Os que têm data ficam num tipo mais estreito até a ordenação acabar: é o que
     deixa claro — para quem lê e para o compilador — que **só eles** entram na
     cronologia. Clube e fórum chegam depois, por posição. */
  const cronologicos: (Extract<ItemDoFeed, { tipo: "post" | "compartilhado" }>)[] = posts.map(
    (post) => ({ tipo: "post", chave: post.id, data: post.date, post }),
  );

  /* Os seus compartilhamentos, sempre; os do esqueleto, só na lente "Todos" —
     na "Seguindo" eles obedecem à mesma regra dos posts: só de quem você segue. */
  const republicacoes = [
    ...meusCompartilhamentos().map((item) => ({ ...item, porSlug: undefined })),
    ...compartilhamentosDoEsqueleto().filter(
      (item) => lente === "todos" || seguindo.includes(item.porSlug),
    ),
  ];

  for (const item of republicacoes) {
    const post = porId.get(item.postId);
    /* Post apagado pelo autor leva o compartilhamento junto — republicar não dá
       posse do que o outro escreveu (ver `compartilhados.ts`). */
    if (!post) continue;
    /* Compartilhar o **seu próprio** post não existe, mas o esqueleto é escrito à
       mão e um engano ali viraria "você compartilhou você". */
    if (item.porSlug === undefined && post.autorSlug === undefined) continue;
    cronologicos.push({
      tipo: "compartilhado",
      chave: `c-${item.porSlug ?? "eu"}-${item.postId}`,
      data: item.date,
      post,
      ...(item.porSlug ? { porSlug: item.porSlug } : {}),
    });
  }

  cronologicos.sort((a, b) => b.data.localeCompare(a.data));

  /*
    **Um post aparece uma vez só — e quem ganha é o compartilhamento.**

    Defeito visto na tela, não no código (30/07): o feed mostrava a pergunta do
    Ricardo compartilhada pelo Felipe e, três cartões abaixo, a mesma pergunta de
    novo. As grandes redes convivem com isso porque entre as duas cópias passam
    centenas de posts; **aqui passam dois**, e o feed parece quebrado.

    Como a lista já está do mais novo para o mais velho e o compartilhamento é
    sempre posterior ao post, **guardar a primeira ocorrência** deixa a versão
    compartilhada e descarta a original. Nada se perde: o cartão continua
    mostrando o autor, o texto e a data dele — só ganha uma linha em cima
    dizendo quem republicou.

    A limpeza é **por lente**: na "Seguindo" de quem não segue o Felipe o
    compartilhamento nem entrou na lista, e o post original fica no lugar dele.
  */
  const vistos = new Set<string>();
  const itens: ItemDoFeed[] = cronologicos.filter((item) => {
    if (vistos.has(item.post.id)) return false;
    vistos.add(item.post.id);
    return true;
  });
  if (itens.length < MINIMO_PARA_INTERCALAR) return itens;

  /*
    **Os cartões de convite só entram na lente "Todos".** A "Seguindo" responde a
    uma pergunta precisa — *o que as pessoas que eu sigo andaram fazendo* —, e
    clube que ninguém que você segue mencionou não é resposta para ela. É a mesma
    régua que manda a atividade ficar só ali: cada lente responde a uma pergunta.
  */
  if (lente !== "todos") return itens;

  const paraInserir: { posicao: number; item: ItemDoFeed }[] = [];

  const clube = clubeParaOFeed();
  if (clube) {
    paraInserir.push({
      posicao: POSICAO_DO_CLUBE,
      item: {
        tipo: "clube",
        chave: `clube-${clube.clube.id}`,
        clube: clube.clube,
        comecando: clube.comecando,
      },
    });
  }

  const forum = topicoParaOFeed();
  if (forum && itens.length >= POSICAO_DO_FORUM) {
    paraInserir.push({
      posicao: POSICAO_DO_FORUM,
      item: {
        tipo: "forum",
        chave: `forum-${forum.topico.id}`,
        grupo: forum.grupo,
        topico: forum.topico,
      },
    });
  }

  /* De trás para a frente: inserir pelo começo empurraria as posições
     seguintes, e o segundo cartão cairia um lugar depois do combinado. */
  for (const { posicao, item } of paraInserir.sort((a, b) => b.posicao - a.posicao)) {
    itens.splice(posicao, 0, item);
  }

  return itens;
}
