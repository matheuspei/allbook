import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ChevronRight, EyeOff, MessageSquare, X } from "lucide-react";

import CommentComposer from "@/components/CommentComposer";
import CommentThread from "@/components/CommentThread";
import MeuComentario from "@/components/MeuComentario";
import { meuClubeDoLivro } from "@/lib/clubes";
import { commentsForBook } from "@/lib/comments";
import {
  MEUS_COMENTARIOS_EVENT,
  myCommentsFor,
  removeComment,
  type MyComment,
} from "@/lib/myComments";
import { readReactions, type Reactions } from "@/lib/reactions";
import { comentariosNoTrecho, rotuloDaAncora } from "@/lib/sala";
import RastroDaSessao from "@/components/sala/RastroDaSessao";
import { rastroNoTrecho } from "@/lib/salaAoVivo";

/**
 * A conversa **deste trecho**, aberta de dentro do player.
 *
 * É a metade que faltava da sala do livro (ROTEIRO 4.39): na ficha você lê o
 * que já liberou; aqui você fala e ouve *no ponto em que está*. Enquanto o áudio
 * corre, o contador da barra mostra quando você entra num trecho onde outras
 * pessoas pararam para dizer algo — e é isso que um app de audiolivro pode
 * fazer e um clube de leitura comum não.
 *
 * **Só olha para trás.** A janela vai de cinco minutos atrás até o ponto atual;
 * nada adiante entra, nem contado. Dentro do player a pessoa está *ouvindo*, e
 * um "há 3 mensagens mais à frente" seria um convite a estragar a própria
 * escuta.
 *
 * **O seu comentário nasce preso aqui**, sem precisar ligar nada: o
 * `ancoraInicial` já vem com o segundo em que o áudio está. Na ficha do livro é
 * o contrário — lá o normal é falar da obra inteira.
 */
export default function ConversaDoTrecho({
  bookId,
  posicaoSec,
  adiante = false,
  onFechar,
}: {
  bookId: number;
  posicaoSec: number;
  /**
   * O trecho está **à frente** de onde a pessoa parou (05/08).
   *
   * Só é `true` quando ela tocou de propósito numa marca apagada do trilho —
   * ou seja, escolheu espiar o futuro do livro. A gaveta abre igual, mas diz na
   * cara o que está fazendo: sem esse aviso, a mesma tela apareceria para quem
   * chegou ali ouvindo e para quem pulou, e as duas coisas não são iguais.
   */
  adiante?: boolean;
  onFechar: () => void;
}) {
  /*
   * O ponto fica congelado ao abrir a folha, de propósito: com o áudio rodando,
   * uma âncora que anda enquanto a pessoa digita faria o comentário cair alguns
   * minutos à frente do que ela quis comentar.
   */
  const [ponto] = useState(posicaoSec);

  /** As suas falas presas nos 5 minutos que terminam neste ponto. */
  function meusAqui(livro: number, segundo: number): MyComment[] {
    return myCommentsFor({ bookId: livro }).filter(
      (item) =>
        item.positionSec !== undefined &&
        item.positionSec <= segundo + 1 &&
        item.positionSec >= segundo - 300,
    );
  }

  const todosDoTrecho = comentariosNoTrecho(commentsForBook(bookId), ponto);

  /* As suas falas do trecho vivem no estado para a lista redesenhar quando você
     publica ou apaga uma — o mesmo `MEUS_COMENTARIOS_EVENT` que a sala escuta. */
  const [meusDoTrecho, setMeusDoTrecho] = useState<MyComment[]>(() => meusAqui(bookId, ponto));

  useEffect(() => {
    const atualizar = () => setMeusDoTrecho(meusAqui(bookId, ponto));
    window.addEventListener(MEUS_COMENTARIOS_EVENT, atualizar);
    return () => window.removeEventListener(MEUS_COMENTARIOS_EVENT, atualizar);
  }, [bookId, ponto]);

  function apagarMeu(id: string) {
    removeComment(id);
    setMeusDoTrecho(meusAqui(bookId, ponto));
  }

  /* As curtidas do trecho: mesmo mecanismo da sala, para o número que você vê
     aqui ser o mesmo que aparece lá. */
  const [reactions, setReactions] = useState<Reactions>({});

  useEffect(() => setReactions(readReactions()), []);

  /*
   * O clube entra aqui como **filtro**, não como conversa separada (ROTEIRO
   * 4.40). É a decisão que junta a sala e o clube num mecanismo só: a mensagem é
   * a mesma, presa ao mesmo segundo; a aba escolhe se você quer ouvir a turma ou
   * a casa inteira. Escrever um segundo sistema de mensagens só para o clube foi
   * o que fez o mural virar um chat que qualquer app tem.
   */
  /** Há fala de sessão ao vivo neste trecho? Muda o texto do "ninguém falou". */
  const temRastro = rastroNoTrecho(bookId, ponto).length > 0;

  const clube = useMemo(() => meuClubeDoLivro(bookId), [bookId]);

  /*
   * **A gaveta abre em "De todos", não na turma** (05/08). Abria no clube, e o
   * Matheus mostrou o custo: *"seria mais interessante que a primeira coisa que
   * aparecer fosse as conversas de todos"* — a aba da turma quase sempre está
   * vazia (um clube tem 6 pessoas; o livro tem o app inteiro), então a gaveta
   * abria parecendo que ninguém falou naquele ponto, com a conversa cheia
   * escondida atrás de um toque.
   *
   * A aba do clube **fica**, e é uma linha para tirar se ele quiser: ver o que a
   * *sua turma* disse naquele minuto é diferente de ver o que o mundo disse, e é
   * a mesma decisão da §4.40 (o clube é um filtro da sala, não uma segunda
   * conversa). O que estava errado era o padrão, não a existência.
   */
  const [aba, setAba] = useState<"turma" | "todos">("todos");

  const daTurma = clube
    ? todosDoTrecho.filter((item) => clube.membros.includes(item.authorSlug))
    : [];

  /* Sem clube não há o que escolher: a folha continua sendo a de sempre. */
  const temAbas = clube !== undefined;
  const doTrecho = temAbas && aba === "turma" ? daTurma : todosDoTrecho;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onFechar}
      data-testid="conversa-do-trecho"
    >
      <div
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-[32px] border-t border-white/10 bg-card p-6 pb-10 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto -mt-2 mb-5 h-1.5 w-12 rounded-full bg-white/15" />

        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold">Conversa deste trecho</h2>
            <p className="mt-1 text-xs text-white/40">{rotuloDaAncora(bookId, ponto)}</p>
            {adiante && (
              <p
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary"
                data-testid="aviso-trecho-adiante"
              >
                <EyeOff className="h-3 w-3" />
                Você ainda não chegou aqui — pode ter spoiler
              </p>
            )}
          </div>
          <button
            onClick={onFechar}
            className="rounded-full p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/*
          As abas só nascem quando existe turma. Num livro sem clube elas seriam
          duas pastilhas com o mesmo conteúdo — o tipo de escolha falsa que a
          4.23 mandou varrer.
        */}
        {/* "De todos" vem primeiro e nasce ligada — a ordem na tela acompanha
            qual é o padrão, senão a pastilha da esquerda parece a principal. */}
        {temAbas && clube && (
          <div className="mb-4 flex gap-2" data-testid="abas-conversa-trecho">
            <Aba ligada={aba === "todos"} onClick={() => setAba("todos")} testid="aba-todos">
              De todos · {todosDoTrecho.length + meusDoTrecho.length}
            </Aba>
            <Aba
              ligada={aba === "turma"}
              onClick={() => setAba("turma")}
              testid="aba-turma"
            >
              {clube.nome} · {daTurma.length + meusDoTrecho.length}
            </Aba>
          </div>
        )}

        {/*
          **O convite diz para quem se está falando** (05/08). Era *"O que você
          achou deste trecho?"* — que se lê como caderno de anotações, e foi
          assim que quatro comentários de teste do Matheus foram parar na
          conversa pública de um livro sem ele perceber (*"isso nem tem nada a
          ver com o livro, não sei o que está fazendo aqui"*). O player tem, lado
          a lado, um botão que **anota para você** (Marcar) e esta caixa, que
          **fala com os outros**: se o texto não disser qual é qual, o erro é do
          app, não de quem escreveu.
        */}
        <CommentComposer
          alvo={{ bookId }}
          ancoraInicial={ponto}
          placeholder="Comente este trecho — quem chegar aqui vai ler…"
        />

        <div className="mt-4 space-y-3">
          {doTrecho.length === 0 && meusDoTrecho.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-xs leading-relaxed text-white/45">
              {temAbas && aba === "turma" ? (
                <>
                  Ninguém da sua turma parou por aqui ainda. O que você escrever fica preso neste
                  ponto — e alguém do clube encontra quando chegar.
                </>
              ) : temRastro ? (
                /* Sem esta variante a tela se contradizia: dizia "ninguém parou
                   para comentar" com as falas da sessão logo abaixo. São mesmo
                   coisas diferentes (§4.81) — mas quem lê precisa entender isso
                   em vez de achar que a tela errou. */
                <>
                  Ninguém <b className="text-white/70">comentou</b> por aqui — o que existe neste
                  ponto é conversa de sessão ao vivo, logo abaixo. Comentário fica; conversa de
                  sessão é do momento.
                </>
              ) : (
                <>
                  Ninguém parou para comentar por aqui ainda. O que você escrever fica preso neste
                  ponto — só aparece para quem chegar até ele.
                </>
              )}
            </p>
          ) : (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">
                Nos últimos 5 minutos de áudio
              </p>
              {/*
                ⚠️ **Aqui era o `FalaDoTrecho`, um cartão simplificado — e ele
                tirava da fala tudo o que faz dela conversa** (05/08). O Matheus
                listou os três buracos de uma vez: *"a pessoa que faz o
                comentário: eu não posso comentar em cima do comentário dela, não
                posso clicar no perfil dela, não vejo a foto dela"*. Os três
                existiam porque a gaveta desenhava **um segundo cartão de
                comentário**, mais pobre que o da sala, em vez de usar o mesmo.

                Agora usa o `CommentThread` — o mesmo da conversa do livro. Vem
                junto: foto que amplia, nome que leva ao perfil, curtir,
                responder e denunciar. **Duas peças para a mesma coisa sempre
                divergem, e quem perde é a mais escondida** — que era esta.
              */}
              {doTrecho.map((comment) => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  reactions={reactions}
                  onReactionsChange={setReactions}
                />
              ))}
              {meusDoTrecho.map((meu) => (
                <MeuComentario key={meu.id} comment={meu} onApagar={apagarMeu} />
              ))}
            </>
          )}
        </div>

        {/*
          O que se disse nas **sessões ao vivo** neste ponto (ROTEIRO §4.81).
          Bloco próprio, e não mais itens na lista acima: a decisão do Matheus foi
          que chat ao vivo e discussão do capítulo são **coisas diferentes** — se
          as falas caíssem na mesma lista, essa separação sumiria na tela.
        */}
        <RastroDaSessao bookId={bookId} posicaoSec={ponto} />

        {/*
          **Vai para a conversa, não para a ficha** (ROTEIRO 4.51). Este link
          apontava para `/book/:id` e caía na sinopse: quem tocava em "ver a
          conversa" tinha de rolar a ficha inteira até achar a sala. Porta não
          pode mentir — foi a mesma razão que fez a conversa ganhar endereço
          próprio na §4.41, e a janela B deixou o recado pedindo esta troca no
          quadro de coordenação. Ficou pendente até o Matheus notar de novo.
        */}
        <Link
          href={`/book/${bookId}/conversa`}
          className="mt-5 flex items-center justify-between rounded-xl bg-white/[0.05] px-4 py-3.5 text-sm transition-colors hover:bg-white/10"
          data-testid="link-sala-completa"
        >
          <span className="flex items-center gap-2.5">
            <MessageSquare className="h-4 w-4 text-white/50" />
            Ver a conversa do livro inteiro
          </span>
          <ChevronRight className="h-4 w-4 text-white/25" />
        </Link>
      </div>
    </div>
  );
}

/** Pastilha de aba. Laranja da marca quando ligada — sem cor nova (ROTEIRO 4.40). */
function Aba({
  ligada,
  onClick,
  children,
  testid,
}: {
  ligada: boolean;
  onClick: () => void;
  children: React.ReactNode;
  testid: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`max-w-[52%] truncate rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-colors ${
        ligada
          ? "bg-primary/15 text-primary ring-1 ring-inset ring-primary/40"
          : "bg-white/5 text-white/50 ring-1 ring-inset ring-white/8 hover:text-white/80"
      }`}
      data-testid={testid}
    >
      {children}
    </button>
  );
}
