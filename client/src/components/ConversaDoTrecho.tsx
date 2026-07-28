import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ChevronRight, MessageSquare, X } from "lucide-react";

import CommentComposer from "@/components/CommentComposer";
import { meuClubeDoLivro } from "@/lib/clubes";
import { commentsForBook } from "@/lib/comments";
import { findMember } from "@/lib/community";
import { myCommentsFor } from "@/lib/myComments";
import { comentariosNoTrecho, rotuloDaAncora } from "@/lib/sala";

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
  onFechar,
}: {
  bookId: number;
  posicaoSec: number;
  onFechar: () => void;
}) {
  /*
   * O ponto fica congelado ao abrir a folha, de propósito: com o áudio rodando,
   * uma âncora que anda enquanto a pessoa digita faria o comentário cair alguns
   * minutos à frente do que ela quis comentar.
   */
  const [ponto] = useState(posicaoSec);

  const todosDoTrecho = comentariosNoTrecho(commentsForBook(bookId), ponto);
  const meusDoTrecho = myCommentsFor({ bookId }).filter(
    (item) =>
      item.positionSec !== undefined &&
      item.positionSec <= ponto + 1 &&
      item.positionSec >= ponto - 300,
  );

  /*
   * O clube entra aqui como **filtro**, não como conversa separada (ROTEIRO
   * 4.40). É a decisão que junta a sala e o clube num mecanismo só: a mensagem é
   * a mesma, presa ao mesmo segundo; a aba escolhe se você quer ouvir a turma ou
   * a casa inteira. Escrever um segundo sistema de mensagens só para o clube foi
   * o que fez o mural virar um chat que qualquer app tem.
   */
  const clube = useMemo(() => meuClubeDoLivro(bookId), [bookId]);
  const [aba, setAba] = useState<"turma" | "todos">("turma");

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
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-[32px] border-t border-white/10 bg-[#1a1a1a] p-6 pb-10 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto -mt-2 mb-5 h-1.5 w-12 rounded-full bg-white/15" />

        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold">Conversa deste trecho</h2>
            <p className="mt-1 text-xs text-white/40">{rotuloDaAncora(bookId, ponto)}</p>
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
        {temAbas && clube && (
          <div className="mb-4 flex gap-2" data-testid="abas-conversa-trecho">
            <Aba
              ligada={aba === "turma"}
              onClick={() => setAba("turma")}
              testid="aba-turma"
            >
              {clube.nome} · {daTurma.length + meusDoTrecho.length}
            </Aba>
            <Aba ligada={aba === "todos"} onClick={() => setAba("todos")} testid="aba-todos">
              De todos · {todosDoTrecho.length + meusDoTrecho.length}
            </Aba>
          </div>
        )}

        <CommentComposer
          alvo={{ bookId }}
          ancoraInicial={ponto}
          placeholder="O que você achou deste trecho?"
        />

        <div className="mt-4 space-y-3">
          {doTrecho.length === 0 && meusDoTrecho.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-xs leading-relaxed text-white/45">
              {temAbas && aba === "turma" ? (
                <>
                  Ninguém da sua turma parou por aqui ainda. O que você escrever fica preso neste
                  ponto — e alguém do clube encontra quando chegar.
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
              {doTrecho.map((comment) => (
                <FalaDoTrecho
                  key={comment.id}
                  nome={findMember(comment.authorSlug)?.name ?? "Alguém"}
                  quando={rotuloDaAncora(bookId, comment.positionSec ?? ponto)}
                  texto={comment.text}
                  spoiler={comment.spoiler}
                />
              ))}
              {meusDoTrecho.map((meu) => (
                <FalaDoTrecho
                  key={meu.id}
                  nome="Você"
                  quando={rotuloDaAncora(bookId, meu.positionSec ?? ponto)}
                  texto={meu.text}
                  spoiler={meu.spoiler}
                  ehSeu
                />
              ))}
            </>
          )}
        </div>

        <Link
          href={`/book/${bookId}`}
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

/**
 * Uma fala dentro da folha.
 *
 * O spoiler aqui **não fica coberto**: tudo o que aparece nesta lista está atrás
 * de onde a pessoa já ouviu, e ela abriu a folha para ler justamente isso. A
 * marca continua visível para dar o aviso — quem prefere não ler, fecha.
 */
function FalaDoTrecho({
  nome,
  quando,
  texto,
  spoiler,
  ehSeu,
}: {
  nome: string;
  quando: string;
  texto: string;
  spoiler?: boolean;
  ehSeu?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/5 p-4" data-testid="fala-do-trecho">
      <div className="flex items-center gap-2 text-xs">
        <span className={`font-bold ${ehSeu ? "text-primary" : "text-white"}`}>{nome}</span>
        <span className="text-white/30">{quando}</span>
        {spoiler && (
          <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-[#f59e0b]">
            spoiler
          </span>
        )}
      </div>
      <p className="mt-1.5 text-sm italic leading-relaxed text-white/70">"{texto}"</p>
    </div>
  );
}
