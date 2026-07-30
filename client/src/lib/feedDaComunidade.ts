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

import { activityFeed, suggestions, type ActivityEvent, type Suggestion } from "@/lib/activity";
import { readLibrary } from "@/lib/library";
import { type Grupo, type TopicoNaTela, participoDa, todosOsGrupos, topicosDa } from "@/lib/grupos";
import {
  clubeCheio,
  clubesComecando,
  clubesParaDescobrir,
  souMembro,
  type Clube,
} from "@/lib/clubes";
import { postsDeQuemVoceSegue, todosOsPosts, type Post } from "@/lib/posts";
import { trechosQuentes, type TrechoQuente } from "@/lib/trechosQuentes";

/** As duas lentes: a comunidade toda, ou só quem você segue (§4.58). */
export type Lente = "todos" | "seguindo";

export type ItemDoFeed =
  /**
   * Um post — **inclusive os compartilhamentos**, que desde 30/07 são posts com
   * outro post dentro (ver `ObjetoDoPost` em `posts.ts`). Quem sabe desenhar as
   * duas formas é o cartão; aqui elas são a mesma coisa.
   */
  | { tipo: "post"; chave: string; data: string; post: Post }
  | { tipo: "clube"; chave: string; clube: Clube; comecando: boolean }
  | { tipo: "forum"; chave: string; grupo: Grupo; topico: TopicoNaTela }
  /** Os pedaços de áudio que estão circulando (§4.58, item 8). */
  | { tipo: "trechos"; chave: string; trechos: TrechoQuente[] }
  /**
   * O que alguém **fez** (recomendou um livro, comentou nele) — e não o que
   * escreveu. **Só na lente "Seguindo"**, que é a regra que o Matheus deu na
   * §4.53: *"o post dela aparece nos dois; o que não aparece nos dois são
   * atividades"*.
   */
  | { tipo: "atividade"; chave: string; data: string; evento: ActivityEvent }
  /** "Combina com você" — o bloco fixo que virou **cartão ocasional** (§4.58). */
  | { tipo: "sugestoes"; chave: string; sugestoes: Suggestion[] };

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
 * Os trechos quentes ficam **entre os dois convites**, e mais perto do topo que
 * o fórum de propósito: diferente deles, isto não é convite — é **conteúdo**, e
 * é o conteúdo que só este app tem. Quem rolar cinco cartões merece ouvir algo.
 */
const POSICAO_DOS_TRECHOS = 5;

/**
 * Onde entra o "Combina com você" na lente "Seguindo".
 *
 * **Era um bloco fixo no alto da aba Pessoas e virou cartão ocasional** (§4.58,
 * decisão 7). O receio era do Matheus e é o mesmo meu: uma parede de gente
 * transforma a Comunidade em catálogo de perfis, que é o que falhou onze vezes
 * (§4.53). Como cartão, ele aparece **depois** de você já ter lido o que as
 * pessoas fizeram — sugestão em resposta a um contexto, não vitrine na entrada.
 */
const POSICAO_DAS_SUGESTOES = 5;

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

  /* Os que têm data ficam num tipo mais estreito até a ordenação acabar: é o que
     deixa claro — para quem lê e para o compilador — que **só eles** entram na
     cronologia. Clube e fórum chegam depois, por posição. */
  const cronologicos: Extract<ItemDoFeed, { tipo: "post" | "atividade" }>[] = posts.map(
    (post) => ({ tipo: "post", chave: post.id, data: post.date, post }),
  );

  /*
    **A atividade só existe na "Seguindo", e é isto que separa as duas lentes.**

    A regra é do Matheus (§4.53, repetida na §4.58): *"o post dela aparece tanto
    no Feed geral como no Seguindo… o que não aparece nos dois são atividades"*.
    Faz sentido pelo que cada uma responde: o Feed responde *o que se está
    dizendo na comunidade*; o Seguindo, *o que andaram fazendo as pessoas que eu
    escolhi*. Recomendação e comentário de um estranho não são resposta para
    nenhuma das duas — seriam a parede de gente que falhou onze vezes (§4.53).

    Elas entram **na mesma cronologia dos posts**, e não numa faixa separada: o
    dia de quem você segue é um só, e partir a tela em "posts" e "atividades"
    obrigaria a pessoa a ler duas listas para saber o que aconteceu.
  */
  if (lente === "seguindo") {
    /* Teto baixo de propósito: a atividade é o degrau de baixo (ver
       `LinhaDeAtividade`), e quarenta linhas de "recomendou" viram a parede de
       gente que a §4.53 diz ter afundado onze maquetes. */
    for (const evento of activityFeed(12)) {
      cronologicos.push({
        tipo: "atividade",
        chave: `a-${evento.id}`,
        data: evento.date,
        evento,
      });
    }
  }

  cronologicos.sort((a, b) => b.data.localeCompare(a.data));

  /*
    **O mesmo cartão nunca aparece duas vezes seguidas — mas citar não é repetir.**

    Defeito visto na tela, não no código (30/07): compartilhada a pergunta do
    Ricardo, o feed mostrava a versão do Felipe e, três cartões abaixo, a mesma
    pergunta de novo. As grandes redes convivem com isso porque entre as duas
    cópias passam centenas de posts; **aqui passam dois**, e a tela parece quebrada.

    A regra distingue os dois gestos, e a distinção é o ponto:

    - **Recompartilhamento simples** (sem texto) mostra o cartão original inteiro,
      então ter os dois é ter o mesmo cartão duas vezes: o original some, e fica a
      versão com a linha de quem republicou. Nada se perde — autor, texto e data
      continuam ali.
    - **Citação** (com texto) é post novo, com fala nova, e o original aparece
      dentro dela só como moldura pequena. Aqui os dois **ficam**: esconder o
      original seria trocar o cartão grande do trecho por uma miniatura, por causa
      de um comentário de outra pessoa.

    A limpeza é **por lente**: na "Seguindo" de quem não segue o Felipe, o
    compartilhamento nem entrou na lista, e o original fica no lugar dele.
  */
  const recompartilhados = new Set<string>();
  const itens: ItemDoFeed[] = cronologicos.filter((item) => {
    if (item.tipo !== "post") return true;
    const objeto = item.post.objeto;
    if (objeto?.tipo === "post" && !item.post.texto.trim()) {
      /* Dois recompartilhamentos simples do mesmo post seriam dois cartões
         idênticos: vale o mais recente, que é o primeiro desta lista. */
      if (recompartilhados.has(objeto.postId)) return false;
      recompartilhados.add(objeto.postId);
      return true;
    }
    return !recompartilhados.has(item.post.id);
  });
  /*
    **"Combina com você" na Seguindo, e não no Feed geral.** Sugerir gente faz
    sentido onde a pergunta é *de quem eu quero saber* — no Feed geral, ao lado de
    posts de estranhos, seria oferecer mais estranhos.

    **Entra mesmo em lista curta**, ao contrário dos cartões de convite: quanto
    menos gente você segue, mais o cartão serve. Numa lista de dois itens ele
    encosta no fim; numa cheia, fica na quinta posição.
  */
  if (lente === "seguindo") {
    const sugestoes = suggestions(
      readLibrary().map((item) => item.id),
      3,
    );
    if (sugestoes.length > 0) {
      itens.splice(Math.min(POSICAO_DAS_SUGESTOES, itens.length), 0, {
        tipo: "sugestoes",
        chave: "sugestoes",
        sugestoes,
      });
    }
    return itens;
  }

  if (itens.length < MINIMO_PARA_INTERCALAR) return itens;

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

  /* **Um trecho só não vira cartão.** Com um item, o carrossel é um player
     solto com etiqueta pomposa — e "circulando" fica sendo mentira. */
  const trechos = trechosQuentes();
  if (trechos.length >= 2 && itens.length >= POSICAO_DOS_TRECHOS) {
    paraInserir.push({
      posicao: POSICAO_DOS_TRECHOS,
      item: { tipo: "trechos", chave: "trechos-quentes", trechos },
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
