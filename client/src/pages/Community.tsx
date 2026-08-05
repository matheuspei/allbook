import { useEffect, useState } from "react";
import { avatarDeLeitor } from "@/lib/community";
import { Link } from "wouter";

import CartaoDePost from "@/components/comunidade/CartaoDePost";
import CartaoDeSugestoes from "@/components/comunidade/CartaoDeSugestoes";
import LinhaDeAtividade from "@/components/comunidade/LinhaDeAtividade";
import { ConviteDeClube, ConviteDeForum, TrechosQuentes } from "@/components/comunidade/CartaoDeConvite";
import Compositor from "@/components/comunidade/Compositor";
import SalasComoStories from "@/components/comunidade/SalasComoStories";
import { POSTS_EVENT } from "@/lib/posts";
import { montarFeed, type ItemDoFeed, type Lente } from "@/lib/feedDaComunidade";
import SalasAoVivoNoFeed from "@/components/sala/SalasAoVivoNoFeed";
import { MURAL_EVENT } from "@/lib/mural";
import { ouvindoAgoraNaComunidade, type AudicaoDeAgora } from "@/lib/activity";
import { readFollowing } from "@/lib/following";

/**
 * Comunidade (`/community`) — **uma tela só: o feed**, desde 01/08 (§4.92).
 *
 * O que as pessoas escreveram, nas duas lentes (Para você · Seguindo), com os
 * cartões de clube e de fórum intercalados. Fórum e clube se acham pelo
 * **quadradinho do topo** (o painel, §4.100 — mora no `TopNav`, ao lado da
 * logo) e por esses cartões — a aba "Fóruns" que existia aqui era um link
 * disfarçado de aba, e saiu com o resto da fileira morta.
 *
 * **A aba "Pessoas" morreu em 30/07**, e não por espaço: é a decisão 7 da
 * §4.58. Ela tinha três blocos e cada um teve um destino —
 *
 * - **"Combina com você"** virou **cartão ocasional dentro do Seguindo**, para
 *   não ser parede de perfis (é o que falhou onze vezes, §4.53);
 * - **"Ouvindo agora"** mudou de lugar, também para o Seguindo: é **atividade**,
 *   e a regra que separa as lentes diz que atividade só existe ali;
 * - **"Todo mundo"** e a **fileira "Seguindo"** morreram. Gente se descobre pelo
 *   que ela escreve — cada post traz o botão de seguir —, e não numa lista
 *   telefônica. *(Se fizer falta, o lugar de uma lista de pessoas é a Busca, não
 *   uma aba da Comunidade.)*
 */

/**
 * As duas lentes, com os nomes do X (05/08, ordem dele com o app do X na mão).
 *
 * ⚠️ **"Para você" é nome emprestado, não promessa cumprida — e ele sabe.** No X
 * essa aba é algoritmo; aqui a lista é **cronológica pura**, como a §4.58
 * decidiu. Levantei o ponto e ele respondeu antes de eu terminar: *"já adianto
 * que o código faz cronologia, não tem nenhum algoritmo… isso aí é tudo por
 * ordem"*. Fica registrado para quem ler depois: **o nome está adiantado ao
 * comportamento**. O dia em que houver escolha de verdade, ele vira verdadeiro
 * sem precisar de outra tela; até lá, o que salva a promessa é que o montador
 * (`lib/feedDaComunidade`) **intercala** sugestões, clube, fórum e trechos
 * quentes — não é uma lista crua.
 *
 * As chaves internas seguem `todos`/`seguindo`: são o contrato com o montador e
 * com o `Lente`, e renomear só o rótulo é o que muda de verdade na tela.
 */
const LENTES: { key: Lente; label: string }[] = [
  { key: "todos", label: "Para você" },
  { key: "seguindo", label: "Seguindo" },
];

/**
 * **O topo da Comunidade** — uma fileira só, e o “…” ao lado do título
 * (ROTEIRO §4.92).
 *
 * ---
 *
 * **O que estava aqui e saiu.** Havia uma fileira `Feed · Fóruns` acima do
 * compositor, e a §4.72 encontrou três defeitos nela de uma vez:
 *
 * - **“Feed” era botão morto** — você já está nele; tocar não mudava nada.
 * - **“Fóruns” não era aba**, era um `setLocation("/forum")` vestido de pastilha:
 *   parecia trocar de conteúdo e trocava de tela.
 * - **`AbaGrupos` nunca era desenhada.** O estado `"grupos"` deixou de existir
 *   quando os fóruns viraram destino (§4.74), e a função ficou no arquivo por
 *   mais um dia inteiro — 128 linhas de código morto.
 *
 * **E a decisão original já dizia isso**, desde 29/07 (§4.57): *“A Comunidade
 * abre no feed, sem fileira de ícones no topo. **Feed · Seguindo são as únicas
 * coisas fixas ali** — e não são destinos: são duas lentes do mesmo conteúdo.”*
 *
 * Fórum e clube não sumiram: estão no **painel do quadradinho** (para quem
 * procura) e nos **cartões do feed** (para quem só está passando) — que é
 * exatamente a divisão que a §4.57 desenhou.
 */
export default function Community() {
  return (
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="community-page">
      {/* **O cabeçalho morreu em 04/08 (§4.100), por decisão do Matheus:** o
          título "Comunidade" repetia a aba do menu de baixo, e o subtítulo era
          decorativo. A tela abre direto no que acontece: os stories do ao vivo,
          o compositor e o feed. O painel (ex-menu "…") virou o quadradinho do
          canto do topo, ao lado da logo — ele mora no `TopNav`. */}
      <FeedDePosts />
    </div>
  );
}

/**
 * A fita de quem está no meio de um livro **agora** — só de quem você segue.
 *
 * **Mudou de lugar em 30/07** (§4.58, decisão 7): morava no alto da Comunidade,
 * com a comunidade inteira, e passou a viver dentro da lente Seguindo. O motivo é
 * a regra que separa as duas lentes — isto é **atividade**, e atividade responde
 * à pergunta *o que andaram fazendo as pessoas que eu escolhi*.
 *
 * **O que se perde, e fica anotado:** era a primeira coisa que se via na
 * Comunidade, e é a única vitrine que só um app de audiolivro tem. Atrás de uma
 * lente, quem nunca tocar em "Seguindo" não a verá. Se fizer falta, a saída é uma
 * versão compacta no alto do Feed — não desfazer a regra.
 */
function OuvindoAgora({ seguindo }: { seguindo: string[] }) {
  const [audicoes, setAudicoes] = useState<AudicaoDeAgora[]>([]);

  useEffect(() => {
    setAudicoes(ouvindoAgoraNaComunidade().filter((item) => seguindo.includes(item.member.slug)));
  }, [seguindo]);

  if (audicoes.length === 0) return null;

  return (
    <section className="mt-3" data-testid="community-listening-now">
      <h2 className="mb-2.5 flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-wider text-white/40">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
        </span>
        Ouvindo agora
      </h2>

      {/* A fita de capas: livros no lugar de rostos, moldura de "ao vivo". */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {audicoes.map(({ member, book, chapter }) => (
          <Link
            key={member.slug}
            href={`/user/${member.slug}`}
            className="w-[80px] shrink-0 group"
            data-testid={`listening-${member.slug}`}
          >
            <div className="relative h-[106px] w-[80px] overflow-hidden rounded-xl border-2 border-primary/55">
              <img src={book.cover} alt={book.title} className="h-full w-full object-cover" />
              <span
                className={`absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-black bg-gradient-to-br ${member.color} text-[8px] font-bold`} {...avatarDeLeitor(member.slug)}
              >
                {member.name.charAt(0)}
              </span>
              <span className="absolute bottom-1.5 right-1 rounded-full bg-black/75 px-1.5 py-0.5 text-[8px]">
                cap. {chapter}
              </span>
            </div>
            <p className="mt-1.5 truncate text-center text-[10px] text-white/55 transition-colors group-hover:text-white">
              {member.name.split(" ")[0]}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

/**
 * O feed — a Comunidade nova (ROTEIRO §4.53–§4.58).
 *
 * **O que já está de pé:** o cartão nas quatro formas, o **compositor** no topo,
 * as duas lentes, curtir, comentar, editar, apagar, **compartilhar** e os
 * **cartões de clube e de fórum intercalados** — com isso o item 3 da ordem da
 * §4.58 fecha.
 *
 * Ordem cronológica pura, sem algoritmo — decisão registrada na §4.58. Quem
 * monta a lista (e onde os cartões de convite entram) é `lib/feedDaComunidade`.
 */
function FeedDePosts() {
  const [itens, setItens] = useState<ItemDoFeed[]>([]);
  const [lente, setLente] = useState<Lente>("todos");
  const [seguindo, setSeguindo] = useState<string[]>([]);

  useEffect(() => {
    const atualizar = () => {
      const quemEuSigo = readFollowing();
      setSeguindo(quemEuSigo);
      setItens(montarFeed(lente, quemEuSigo));
    };
    atualizar();
    /* Dois eventos, pelos dois formatos de post seu: o novo (`allbook_posts`) e
       os herdados do mural (ver `CHAVE_POSTS`). O compartilhar não precisa de um
       terceiro — ele **é** um post, e dispara o mesmo aviso. */
    window.addEventListener(POSTS_EVENT, atualizar);
    window.addEventListener(MURAL_EVENT, atualizar);
    return () => {
      window.removeEventListener(POSTS_EVENT, atualizar);
      window.removeEventListener(MURAL_EVENT, atualizar);
    };
    /*
      **A lente entra nas dependências**, e isso é o que faz trocar de lente
      remontar a lista: sem ela, o efeito guardaria para sempre a lente do
      primeiro desenho, e "Seguindo" mostraria o feed inteiro.
    */
  }, [lente]);

  return (
    <div className="px-5 pt-5" data-testid="feed-de-posts">
      {/* O ao vivo abre a tela, como stories (§4.100) — o vocabulário que todo
          mundo já conhece: anel colorido = tem coisa acontecendo, toque. Sala é
          a coisa mais perecível do app (§4.81), por isso vive acima de tudo e
          some sozinha quando não há nenhuma. */}
      <SalasComoStories />

      <Compositor />

      {/*
        **As duas lentes.** Ficam **aqui**, embaixo do compositor, e não nas abas
        do alto: as de cima dizem *que parte da Comunidade* (Feed · Fóruns ·
        Pessoas), e estas dizem *de quem*. Misturar os dois critérios numa fileira
        só é o que a régua da casa proíbe — uma fileira de pílulas carrega um
        critério, não dois.
      */}
      {/*
        **As lentes viraram as abas do X (05/08).** Eram duas pílulas pequenas
        num canto; ele mandou copiar o par "Para você · Seguindo" do app do X —
        duas abas de **largura igual**, texto grande, **sublinhado embaixo da
        ativa** e uma divisória fina de ponta a ponta. O azul do X virou o
        laranja da marca.

        **Elas sangram até as bordas** (`-mx-5`), porque a divisória cortada no
        meio da tela leria como caixa, e não como separador — é o que faz a barra
        parecer parte da estrutura da tela em vez de um filtro solto.

        **A posição não subiu para o topo absoluto, e é de propósito.** No X as
        abas são a primeira coisa porque abaixo delas só existe o feed. Aqui, os
        stories de sala ao vivo e o compositor **não mudam com a lente** — pô-las
        acima deles prometeria um governo que elas não têm. Ficam onde governam:
        logo acima do que a lente troca.
      */}
      <div className="mt-4 -mx-5 flex border-b border-white/10" data-testid="feed-lentes">
        {LENTES.map((item) => {
          const ativa = lente === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setLente(item.key)}
              className="relative flex-1 px-2 pb-3 pt-1"
              data-testid={`feed-lente-${item.key}`}
            >
              <span
                className={`text-[15px] transition-colors ${
                  ativa ? "font-bold text-white" : "font-medium text-white/45"
                }`}
              >
                {item.label}
              </span>
              {/* O sublinhado cobre quase toda a aba, como no X — não só a
                  palavra. `-bottom-px` para ele cair EM CIMA da divisória, e não
                  acima dela, senão sobram dois traços paralelos. */}
              {ativa && (
                <span className="absolute inset-x-5 -bottom-px h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* A fita de "ouvindo agora" mora **dentro do Seguindo** desde 30/07 — é
          atividade, e atividade só existe nesta lente (§4.58, decisão 7). */}
      {lente === "seguindo" && <OuvindoAgora seguindo={seguindo} />}

      <div className="mt-3 space-y-3">
        {itens.map((item) => {
          if (item.tipo === "post") return <CartaoDePost key={item.chave} post={item.post} />;
          if (item.tipo === "atividade")
            return <LinhaDeAtividade key={item.chave} evento={item.evento} />;
          if (item.tipo === "sugestoes")
            return <CartaoDeSugestoes key={item.chave} sugestoes={item.sugestoes} />;
          if (item.tipo === "trechos")
            return <TrechosQuentes key={item.chave} trechos={item.trechos} />;
          if (item.tipo === "clube")
            return (
              <ConviteDeClube key={item.chave} clube={item.clube} comecando={item.comecando} />
            );
          return <ConviteDeForum key={item.chave} grupo={item.grupo} topico={item.topico} />;
        })}
      </div>

      {/*
        **Estado vazio do "Seguindo", com saída.** Quem não segue ninguém veria uma
        lista vazia e não saberia por quê. A saída **é o cartão "Combina com
        você"**, que o montador coloca aqui mesmo — desde que a aba Pessoas morreu
        (§4.58, decisão 7), ele é o lugar de começar a seguir gente. O texto abaixo
        só explica o vazio; quem resolve é o cartão (§4.23: nada de tela morta).
      */}
      {lente === "seguindo" && itens.filter((item) => item.tipo !== "sugestoes").length === 0 && (
        <div className="mt-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
          <p className="text-[13px] leading-relaxed text-white/55">
            {seguindo.length === 0
              ? "Você ainda não segue ninguém — é por isso que aqui está vazio. Comece pelas sugestões acima, ou siga quem escreveu algo que você gostou no feed."
              : "Quem você segue não publicou nada ainda."}
          </p>
          <button
            onClick={() => setLente("todos")}
            className="mt-3 text-[12px] font-bold text-primary"
            data-testid="voltar-feed-todos"
          >
            Ver o feed inteiro
          </button>
        </div>
      )}
    </div>
  );
}
