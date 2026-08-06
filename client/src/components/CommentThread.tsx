import { useState } from "react";
import { useLocation } from "wouter";
import { CornerDownRight, EyeOff, Flag, Headphones, Star, ThumbsDown, ThumbsUp, Trash2, User, X } from "lucide-react";

import AvatarAmpliavel from "@/components/AvatarAmpliavel";
import QuemReagiu from "@/components/comunidade/QuemReagiu";
import { useToast } from "@/hooks/use-toast";
import { repliesTo, type Comment } from "@/lib/comments";
import { findMember, findMemberByName, avatarDeLeitor } from "@/lib/community";
import { denunciar, type MotivoDaDenuncia } from "@/lib/moderacao";
import { addNotification } from "@/lib/notifications";
import { savePlaying } from "@/lib/playback";
import { initialOf, readProfile } from "@/lib/profile";
import CitacaoDeAudio from "@/components/CitacaoDeAudio";
import { citacaoDoComentario } from "@/lib/citacoes";
import { rotuloDaAncora } from "@/lib/sala";
import {
  addIncomingReply,
  addReply,
  myRepliesTo,
  removeReply,
  simulatedReplyBack,
  MAX_REPLY,
  type MyReply,
} from "@/lib/replies";
import {
  dislikeCount,
  likeCount,
  toggleReaction,
  type Reaction,
  type Reactions,
} from "@/lib/reactions";

/**
 * Um comentário e a conversa embaixo dele.
 *
 * Mora fora do `BookDetails` porque aquela tela já é grande demais, e porque a
 * conversa é uma coisa fechada em si: o comentário, as respostas dos outros, as
 * suas respostas e a caixa de escrever.
 *
 * **Um nível só de resposta.** Responder a uma resposta continua na mesma
 * conversa (o `parentId` é sempre o comentário de cima), com uma marca de
 * "@Fulano" para não se perder quem fala com quem. No celular, um terceiro
 * nível de recuo já não caberia.
 */
export default function CommentThread({
  comment,
  reactions,
  onReactionsChange,
}: {
  comment: Comment;
  reactions: Reactions;
  onReactionsChange: (next: Reactions) => void;
}) {
  const { toast } = useToast();
  // Guarda a quem a caixa aberta responde. `null` = fechada; "" = responde ao
  // comentário de cima; um nome = responde àquela resposta.
  const [respondendoA, setRespondendoA] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [locais, setLocais] = useState<MyReply[]>(() => myRepliesTo(comment.id));
  /*
   * Spoiler marcado à mão começa coberto e só abre no toque — a âncora no áudio
   * não cobre quem está atrás e fala do fim (ROTEIRO 4.39). Vale por comentário
   * e por visita: fechar a tela cobre de novo.
   */
  const [revelado, setRevelado] = useState(false);

  const respostas = repliesTo(comment.id);
  const total = respostas.length + locais.length;
  const bookId = comment.bookId;

  function reagir(id: string, reaction: Reaction) {
    onReactionsChange(toggleReaction(id, reaction));
  }

  function abrirResposta(paraNome: string) {
    setRespondendoA(paraNome);
    setTexto("");
  }

  function fechar() {
    setRespondendoA(null);
    setTexto("");
  }

  function enviar() {
    const limpo = texto.trim();
    if (limpo.length === 0 || bookId === undefined) return;

    const menção = respondendoA || undefined;
    addReply(comment.id, bookId, limpo, menção);

    // A simulação: o leitor a quem você respondeu reage, ali mesmo, e você é
    // avisado. É o esqueleto "dando o que ver" — no servidor, quem recebe o
    // aviso é a outra pessoa. Se você respondeu a uma resposta, quem reage é
    // quem a escreveu; senão, o autor do comentário.
    const perfil = readProfile();
    // Quem reage é quem você marcou: se respondeu a uma resposta, a pessoa
    // daquela resposta (pelo nome); senão, o autor do comentário de cima.
    const alvoSlug = respondendoA
      ? findMemberByName(respondendoA)?.slug ?? comment.authorSlug
      : comment.authorSlug;
    const back = simulatedReplyBack(alvoSlug, perfil.name);
    addIncomingReply({
      parentId: comment.id,
      bookId,
      fromSlug: back.fromSlug,
      text: back.text,
      replyToName: back.replyToName,
    });
    addNotification({ fromSlug: back.fromSlug, bookId, text: back.text });

    setLocais(myRepliesTo(comment.id));
    fechar();
  }

  function apagar(id: string) {
    removeReply(id);
    setLocais(myRepliesTo(comment.id));
    toast({ title: "Resposta apagada" });
  }

  return (
    <div
      className="bg-white/5 p-4 rounded-xl border border-white/5"
      data-testid={`card-review-${comment.id}`}
    >
      <AutorDoComentario slug={comment.authorSlug} />

      {/*
        **A estrela saiu do fio em 28/07 — mudou de casa, não morreu.** Ela
        tinha voltado em 26/07 no formato Amazon (nota junto da frase), quando
        esta lista ERA a seção de comentários do livro. No dia seguinte a lista
        virou a sala de conversa (4.39), e a resenha estrelada no meio do papo
        foi o que fez o Matheus apontar: "você não sabe o que é conversa, o que
        é comentário". A separação (4.41): **nota = avaliação; âncora =
        conversa** — comentário com nota e sem âncora agora mora na seção
        "Avaliações" da ficha (`AvaliacoesDoLivro`, onde a estrela continua no
        formato Amazon), e este fio mostra só papo. Os 3 híbridos semeados
        (nota + âncora) ficam aqui COMO conversa, sem exibir a estrela — a nota
        deles segue valendo na média (`notasDoLivro`).
      */}

      {/*
        O carimbo da âncora: em que ponto do áudio a pessoa estava. Tocar nele
        abre o player exatamente ali — o mesmo caminho (`?t=`) que as marcações
        já usavam. É o que faz a conversa e a audição serem a mesma coisa, e não
        duas telas separadas (ROTEIRO 4.39).
      */}
      {bookId !== undefined && comment.positionSec !== undefined && (
        <CarimboDaAncora bookId={bookId} positionSec={comment.positionSec} />
      )}

      {comment.spoiler && !revelado ? (
        <VeuDeSpoiler onRevelar={() => setRevelado(true)} />
      ) : (
        <>
          <p className="text-sm text-white/70 leading-relaxed italic mt-1">"{comment.text}"</p>
          {/*
            O trecho citado fica **atrás do véu de spoiler** junto com o texto, e
            não ao lado dele: um trecho de 40 segundos do capítulo 9 entrega tanto
            quanto a frase que o acompanha (ROTEIRO 4.43).
          */}
          {(() => {
            const citacao = citacaoDoComentario({ ...comment, bookId });
            return citacao ? <CitacaoDeAudio citacao={citacao} compacto /> : null;
          })()}
        </>
      )}

      <Acoes
        id={comment.id}
        likes={comment.likes}
        dislikes={comment.dislikes}
        reaction={reactions[comment.id]}
        onReact={reagir}
        replyCount={total}
        onReply={bookId !== undefined ? () => abrirResposta("") : undefined}
        onDenunciar={(motivo) => {
          denunciar(comment.id, motivo);
          toast({
            title: "Escondido para você",
            description:
              motivo === "spoiler"
                ? "Marcamos como spoiler. Enquanto não há servidor, isto vale só neste aparelho."
                : "Enquanto não há servidor, isto vale só neste aparelho.",
          });
        }}
      />

      {total > 0 && (
        <div
          className="mt-3 pl-3 border-l border-white/10 space-y-3"
          data-testid={`replies-${comment.id}`}
        >
          {respostas.map((resposta) => (
            <div key={resposta.id}>
              <AutorDoComentario slug={resposta.authorSlug} small />
              <Texto replyToName={undefined} text={resposta.text} />
              <Acoes
                id={resposta.id}
                likes={resposta.likes}
                dislikes={resposta.dislikes}
                reaction={reactions[resposta.id]}
                onReact={reagir}
                small
                onReply={
                  bookId !== undefined
                    ? () => abrirResposta(findMember(resposta.authorSlug)?.name ?? "")
                    : undefined
                }
              />
            </div>
          ))}

          {locais.map((resposta) =>
            resposta.fromSlug ? (
              <RespostaRecebida
                key={resposta.id}
                resposta={resposta}
                reaction={reactions[resposta.id]}
                onReact={reagir}
                onReply={
                  bookId !== undefined
                    ? () => abrirResposta(findMember(resposta.fromSlug!)?.name ?? "")
                    : undefined
                }
              />
            ) : (
              <MinhaResposta key={resposta.id} resposta={resposta} onApagar={apagar} />
            ),
          )}
        </div>
      )}

      {respondendoA !== null && bookId !== undefined && (
        <div className="mt-3 pl-3 border-l border-white/10" data-testid={`reply-box-${comment.id}`}>
          {respondendoA && (
            <div className="flex items-center gap-1.5 mb-2 text-[11px] text-white/40">
              <CornerDownRight className="w-3 h-3" />
              Respondendo a <span className="text-primary font-medium">{respondendoA}</span>
              <button
                onClick={fechar}
                className="ml-0.5 hover:text-white/70"
                aria-label="Cancelar resposta a esta pessoa"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <textarea
            value={texto}
            onChange={(event) => setTexto(event.target.value.slice(0, MAX_REPLY))}
            placeholder="Escreva sua resposta…"
            rows={3}
            autoFocus
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 resize-none"
            data-testid={`reply-input-${comment.id}`}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-white/25">
              {texto.length}/{MAX_REPLY}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={fechar}
                className="text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={enviar}
                disabled={texto.trim().length === 0}
                className="text-xs font-semibold text-primary disabled:text-white/20 transition-colors"
                data-testid={`reply-send-${comment.id}`}
              >
                Responder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** O texto de uma resposta, com o "@Fulano" destacado quando há menção. */
function Texto({ replyToName, text }: { replyToName?: string; text: string }) {
  return (
    <p className="text-xs text-white/60 leading-relaxed mt-1.5">
      {replyToName && <span className="text-primary font-medium">@{replyToName} </span>}
      {text}
    </p>
  );
}

/** Uma resposta que um leitor mandou de volta para você (a simulação). */
function RespostaRecebida({
  resposta,
  reaction,
  onReact,
  onReply,
}: {
  resposta: MyReply;
  reaction: Reaction | undefined;
  onReact: (id: string, reaction: Reaction) => void;
  onReply?: () => void;
}) {
  return (
    <div data-testid={`incoming-reply-${resposta.id}`}>
      <AutorDoComentario slug={resposta.fromSlug!} small />
      <Texto replyToName={resposta.replyToName} text={resposta.text} />
      <Acoes id={resposta.id} likes={0} dislikes={0} reaction={reaction} onReact={onReact} small onReply={onReply} />
    </div>
  );
}

/** Uma resposta sua: mesmo formato das outras, mais o botão de apagar. */
function MinhaResposta({
  resposta,
  onApagar,
}: {
  resposta: MyReply;
  onApagar: (id: string) => void;
}) {
  const profile = readProfile();

  return (
    <div data-testid={`my-reply-${resposta.id}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AvatarAmpliavel
            nome={profile.name}
            foto={profile.photo || undefined}
            inicial={initialOf(profile.name)}
            legenda="você"
          >
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-bold shrink-0 overflow-hidden">
              {profile.photo ? (
                <img src={profile.photo} alt="" className="h-full w-full object-cover" />
              ) : (
                initialOf(profile.name)
              )}
            </span>
          </AvatarAmpliavel>
          <span className="text-xs font-bold">
            {profile.name} <span className="font-normal text-white/30">· você</span>
          </span>
        </div>
        <button
          onClick={() => onApagar(resposta.id)}
          className="text-white/25 hover:text-white/60 transition-colors p-1"
          aria-label="Apagar minha resposta"
          data-testid={`delete-reply-${resposta.id}`}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      <Texto replyToName={resposta.replyToName} text={resposta.text} />
    </div>
  );
}

/**
 * Curtir, descurtir e responder.
 *
 * As duas reações mostram número e as duas pesam igual na ordem dos
 * comentários — o porquê e o risco estão em `reactions.ts`. O "Responder" é um
 * botão **à parte** do contador de respostas: juntá-los fazia o "Responder"
 * sumir justo nos comentários que já tinham conversa.
 */
function Acoes({
  id,
  likes,
  dislikes,
  reaction,
  onReact,
  onReply,
  replyCount,
  small,
  onDenunciar,
}: {
  id: string;
  likes: number;
  dislikes: number;
  reaction: Reaction | undefined;
  onReact: (id: string, reaction: Reaction) => void;
  onReply?: () => void;
  replyCount?: number;
  small?: boolean;
  /** Só no comentário de primeiro nível — resposta some junto com ele. */
  onDenunciar?: (motivo: MotivoDaDenuncia) => void;
}) {
  const size = small ? "w-3 h-3" : "w-3.5 h-3.5";
  /*
    **O número abre quem reagiu** (31/07). Aqui os dois botões existem desde
    21/07, mas o contador não levava a lugar nenhum — a mesma régua da §4.59 que
    o Matheus aplica sempre: *rótulo que nomeia um conjunto e não leva até ele
    morre na tela*. Agora o ícone reage e o número abre a folha, como no feed.

    Os totais vêm de fora (`likes`/`dislikes` do `comments.ts`, escritos à mão),
    e é por isso que `quemReagiu` aceita `totais`: a lista tem de caber no
    número que já estava na tela, não sortear o seu.
  */
  const totais = { curtiu: likeCount(likes, reaction), descurtiu: dislikeCount(dislikes, reaction) };
  const [vendoQuem, setVendoQuem] = useState<Reaction | undefined>();
  const opcoesDaLista = {
    deOutraPessoa: true,
    escala: "fala" as const,
    totais: {
      curtiu: totais.curtiu - (reaction === "like" ? 1 : 0),
      descurtiu: totais.descurtiu - (reaction === "dislike" ? 1 : 0),
    },
  };

  return (
    <div className={`flex flex-wrap items-center gap-1 ${small ? "mt-1.5" : "pt-3"}`}>
      <button
        type="button"
        onClick={() => onReact(id, "like")}
        className={`flex items-center px-2 py-1 -ml-2 rounded-md text-xs transition-colors ${
          reaction === "like" ? "text-primary" : "text-white/40 hover:text-white/70"
        }`}
        aria-pressed={reaction === "like"}
        aria-label="Curtir"
        data-testid={`button-like-${id}`}
      >
        <ThumbsUp className={size} strokeWidth={1.75} fill={reaction === "like" ? "currentColor" : "none"} />
      </button>
      {totais.curtiu > 0 && (
        <button
          type="button"
          onClick={() => setVendoQuem("like")}
          className={`-ml-1 rounded-md px-1.5 py-1 text-xs transition-colors ${
            reaction === "like" ? "text-primary" : "text-white/40 hover:text-white"
          }`}
          aria-label={`Ver quem curtiu (${totais.curtiu})`}
          data-testid={`ver-curtiram-${id}`}
        >
          {totais.curtiu}
        </button>
      )}

      <button
        type="button"
        onClick={() => onReact(id, "dislike")}
        className={`flex items-center px-2 py-1 rounded-md text-xs transition-colors ${
          reaction === "dislike" ? "text-white/80" : "text-white/40 hover:text-white/70"
        }`}
        aria-pressed={reaction === "dislike"}
        aria-label="Descurtir"
        data-testid={`button-dislike-${id}`}
      >
        <ThumbsDown className={size} strokeWidth={1.75} fill={reaction === "dislike" ? "currentColor" : "none"} />
      </button>
      {totais.descurtiu > 0 && (
        <button
          type="button"
          onClick={() => setVendoQuem("dislike")}
          className={`-ml-1 rounded-md px-1.5 py-1 text-xs transition-colors ${
            reaction === "dislike" ? "text-white/80" : "text-white/40 hover:text-white"
          }`}
          aria-label={`Ver quem descurtiu (${totais.descurtiu})`}
          data-testid={`ver-descurtiram-${id}`}
        >
          {totais.descurtiu}
        </button>
      )}

      {vendoQuem && (
        <QuemReagiu
          id={id}
          opcoes={opcoesDaLista}
          inicial={vendoQuem === "like" ? "curtiu" : "descurtiu"}
          suaReacao={reaction === "like" ? "curtiu" : reaction === "dislike" ? "descurtiu" : undefined}
          onFechar={() => setVendoQuem(undefined)}
        />
      )}

      {/* Contador de respostas: só informa, não é botão. */}
      {replyCount !== undefined && replyCount > 0 && (
        <span className="flex items-center gap-1.5 px-2 py-1 text-xs text-white/30">
          <CornerDownRight className={size} strokeWidth={1.75} />
          {replyCount}
        </span>
      )}

      {onReply && (
        <button
          type="button"
          onClick={onReply}
          className="px-2 py-1 rounded-md text-xs font-medium text-white/50 hover:text-white transition-colors"
          data-testid={`button-reply-${id}`}
        >
          Responder
        </button>
      )}

      {onDenunciar && <BotaoDeDenuncia onDenunciar={onDenunciar} id={id} />}
    </div>
  );
}

/**
 * Denunciar, em dois toques.
 *
 * O primeiro toque abre as opções; o segundo escolhe o motivo. Um toque só
 * seria perigoso demais para um alvo pequeno ao lado de "Responder" — e os
 * motivos importam: **spoiler** é o dano típico da sala do livro, e é o que a
 * moderação vai querer separar de ofensa quando houver fila de verdade.
 */
function BotaoDeDenuncia({
  id,
  onDenunciar,
}: {
  id: string;
  onDenunciar: (motivo: MotivoDaDenuncia) => void;
}) {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="ml-auto rounded-md p-1.5 text-white/20 transition-colors hover:text-white/60"
        aria-label="Denunciar este comentário"
        data-testid={`button-report-${id}`}
      >
        <Flag className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>
    );
  }

  /*
   * Aberto, ocupa a **linha inteira** (`w-full`) em vez de disputar espaço com
   * curtir e responder: espremido na mesma linha, o "cancelar" saía da tela do
   * celular — e cancelar é justamente a saída de quem tocou sem querer.
   */
  return (
    <div className="mt-1 flex w-full items-center justify-end gap-1 text-[11px]">
      <span className="text-white/30">Esconder:</span>
      <button
        type="button"
        onClick={() => onDenunciar("spoiler")}
        className="rounded-md px-1.5 py-1 font-semibold text-primary transition-colors hover:bg-white/10"
        data-testid={`report-spoiler-${id}`}
      >
        spoiler
      </button>
      <button
        type="button"
        onClick={() => onDenunciar("ofensa")}
        className="rounded-md px-1.5 py-1 font-semibold text-white/60 transition-colors hover:bg-white/10"
      >
        ofensa
      </button>
      <button
        type="button"
        onClick={() => setAberto(false)}
        className="rounded-md px-1.5 py-1 text-white/30 transition-colors hover:bg-white/10"
      >
        cancelar
      </button>
    </div>
  );
}

/**
 * Quem escreveu. Dois toques diferentes no mesmo bloco, como no Instagram:
 * **a foto amplia** ali mesmo, **o nome leva ao perfil** — é dali que sai o
 * "seguir". Antes a foto também levava ao perfil; virou o gesto de ampliar
 * porque é o que se espera ao tocar numa foto, e o nome continua sendo o
 * caminho para o perfil (com o rótulo dizendo isso, para quem usa leitor de
 * tela). Slug que não existe mais aparece sem link nem ampliação, em vez de
 * prometer uma tela vazia.
 */
/**
 * As cinco estrelas que a pessoa deu ao livro, junto do que ela escreveu.
 *
 * Cheias em âmbar, vazias em branco apagado — o mesmo par de cores das estrelas
 * de avaliar (`AvaliarLivro`), para as duas telas falarem a mesma língua. O
 * `aria-label` diz "avaliou este livro", que é o que o desenho quer dizer e o
 * leitor de tela não tem como adivinhar.
 *
 * Exportada porque desde 28/07 quem a desenha é a seção **Avaliações**
 * (`AvaliacoesDoLivro`) — no fio de conversa ela não aparece mais.
 */
export function NotaDoComentario({ nota }: { nota: number }) {
  return (
    <div
      className="mt-3 flex items-center gap-0.5"
      aria-label={`Avaliou este livro com ${nota} de 5 estrelas`}
      data-testid="comment-rating"
    >
      {[1, 2, 3, 4, 5].map((valor) => (
        <Star
          key={valor}
          className={`h-3.5 w-3.5 ${
            valor <= nota ? "fill-primary text-primary" : "text-white/15"
          }`}
        />
      ))}
    </div>
  );
}

/**
 * "cap. 7 · 12:40" — onde no áudio a pessoa estava quando escreveu.
 *
 * É botão, não etiqueta: leva ao ponto exato no player. O ícone é o fone de
 * propósito — deixa claro que aquilo é uma posição de **escuta**, não a hora em
 * que o comentário foi postado, que é o que um relógio sugeriria.
 */
function CarimboDaAncora({ bookId, positionSec }: { bookId: number; positionSec: number }) {
  const [, navegar] = useLocation();

  return (
    <button
      type="button"
      onClick={() => {
        savePlaying(true);
        navegar(`/player/${bookId}?t=${positionSec}`);
      }}
      className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20"
      aria-label={`Ouvir este trecho: ${rotuloDaAncora(bookId, positionSec)}`}
      data-testid="comment-anchor"
    >
      <Headphones className="h-3 w-3" />
      {rotuloDaAncora(bookId, positionSec)}
    </button>
  );
}

/**
 * O comentário que a própria pessoa marcou como spoiler.
 *
 * Cobre o texto em vez de escondê-lo: saber que **existe** um comentário ali
 * não estraga nada, e é o que dá à sala a cara de conversa cheia em vez de
 * lugar vazio. Só o conteúdo fica atrás do toque.
 */
function VeuDeSpoiler({ onRevelar }: { onRevelar: () => void }) {
  return (
    <button
      type="button"
      onClick={onRevelar}
      className="mt-2 flex w-full items-center gap-2.5 rounded-lg bg-white/[0.06] px-3 py-2.5 text-left transition-colors hover:bg-white/10"
      data-testid="comment-spoiler-veil"
    >
      <EyeOff className="h-4 w-4 shrink-0 text-primary" />
      <span className="text-xs text-white/50">
        <span className="font-semibold text-primary">Contém spoiler</span> — toque para ver
      </span>
    </button>
  );
}

function AutorDoComentario({ slug, small }: { slug: string; small?: boolean }) {
  const [, navegar] = useLocation();
  const membro = findMember(slug);

  const tamanho = small ? "w-5 h-5 text-[9px]" : "w-7 h-7 text-[11px]";
  const texto = small ? "text-xs" : "text-sm";

  const avatar = (
    <span
      className={`${tamanho} rounded-full flex items-center justify-center shrink-0 font-bold ${
        membro
          ? `bg-gradient-to-br ${membro.color} text-white`
          : "bg-gradient-to-br from-primary/30 to-primary/15 text-primary"
      }`}
      {...avatarDeLeitor(membro?.slug)}
    >
      {membro ? membro.name.charAt(0) : <User className="w-3 h-3" />}
    </span>
  );

  if (!membro) {
    return (
      <div className="flex items-center gap-2">
        {avatar}
        <span className={`${texto} font-bold`}>Leitor do AllBook</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <AvatarAmpliavel
        nome={membro.name}
        slug={membro.slug}
        inicial={membro.name.charAt(0)}
        fundoClasse={`bg-gradient-to-br ${membro.color}`}
        legenda="Leitor do AllBook"
      >
        {avatar}
      </AvatarAmpliavel>

      <button
        type="button"
        onClick={() => navegar(`/user/${membro.slug}`)}
        className={`${texto} font-bold hover:text-primary transition-colors`}
        aria-label={`Ver o perfil de ${membro.name}`}
        data-testid={`link-reviewer-${membro.slug}`}
      >
        {membro.name}
      </button>
    </div>
  );
}
