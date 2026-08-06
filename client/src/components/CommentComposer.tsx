import { useEffect, useState } from "react";
import { EyeOff, Headphones, Quote, Star, Trash2 } from "lucide-react";

import CitacaoDeAudio from "@/components/CitacaoDeAudio";
import { useToast } from "@/hooks/use-toast";
import CortadorDeTrecho from "@/components/CortadorDeTrecho";
import { MAX_CITACAO_SEC, criarCitacao } from "@/lib/citacoes";
import { initialOf, readProfile } from "@/lib/profile";
import {
  addComment,
  removeComment,
  myCommentsFor,
  MAX_COMMENT,
  type CommentTarget,
  type MyComment,
} from "@/lib/myComments";
import { myRatingOf, RATINGS_EVENT, type MinhaAvaliacao } from "@/lib/ratings";
import { comecouOLivro, posicaoNoLivro, rotuloDaAncora } from "@/lib/sala";

/**
 * Escrever um comentário de primeiro nível — e ver/apagar os seus.
 *
 * **Por que existe:** antes NÃO dava para comentar. `comments.ts` só tinha o
 * esqueleto fixo de leitores fictícios, sem caixa de escrever, então livro sem
 * comentário semeado (a maioria) ficava mudo, com um "ninguém comentou ainda" e
 * nenhum jeito de mudar isso. Agora qualquer livro recebe comentário, guardado no
 * `localStorage` (via `myComments.ts`), com o seu nome de perfil como autor.
 *
 * **Serve aos três alvos** — livro, pessoa (autor/narrador) e editora —, porque a
 * caixa é a mesma em qualquer um deles: identidade, campo, contador e botão. Um
 * componente por tela de perfil só criaria três caixas para divergirem depois.
 * Quem chama passa o alvo e o texto de convite.
 *
 * **A sua nota aparece no seu comentário** (26/07, a pedido do Matheus, no
 * formato da Amazon): quem lê "achei fraco" precisa ver quantas estrelas isso
 * valeu. Ela sai de `ratings.ts` — ou seja, é a nota **atual**, não uma cópia
 * congelada no momento em que você escreveu: avaliação e comentário são a mesma
 * opinião, e mudar a nota tem de mudar o que o comentário mostra. Só em livro;
 * em perfil de pessoa e de editora não há nota (ver `comments.ts`).
 *
 * **Sem curtir/responder no próprio comentário, de propósito:** reagir ou
 * responder a si mesmo não faz sentido no esqueleto.
 */
export default function CommentComposer({
  alvo,
  placeholder = "Deixe seu comentário sobre este livro…",
  ancoraInicial,
  listarMeus = true,
}: {
  alvo: CommentTarget;
  /** O convite dentro do campo. Muda com o alvo: livro, pessoa ou editora. */
  placeholder?: string;
  /**
   * Desenhar os seus comentários logo abaixo da caixa.
   *
   * **Ligado por padrão, e desligado só pela sala do livro** (04/08). O Matheus
   * abriu a conversa de "A Paciente Silenciosa" e viu quase só a própria voz:
   * *"aparece um monte de coisa que eu tinha escrito"*. A causa não era o filtro
   * — os comentários estavam no livro certo — era **o lugar**: os seus vinham
   * todos empilhados no topo, colados na caixa, e a fala das outras pessoas
   * começava depois deles. Numa sala presa ao áudio isso é duplamente errado,
   * porque quebra a ordem do livro.
   *
   * Na sala, portanto, quem mistura é ela (`SalaDoLivro`), por minuto. Em perfil
   * de pessoa e de editora não há âncora nem ordem de áudio, e a lista aqui
   * continua sendo o certo.
   */
  listarMeus?: boolean;
  /**
   * Prender o comentário neste segundo do áudio, já ligado ao abrir.
   *
   * Quem passa isto é o **player**: lá a pessoa está ouvindo aquele trecho, e a
   * intenção de falar *sobre ele* é óbvia. Na ficha do livro a caixa nasce
   * desligada, porque ali o comum é falar da obra inteira — e comentário preso
   * a um ponto só aparece para quem já chegou nele.
   */
  ancoraInicial?: number;
}) {
  const { toast } = useToast();
  const perfil = readProfile();
  const [texto, setTexto] = useState("");
  const [meus, setMeus] = useState<MyComment[]>(() => myCommentsFor(alvo));

  const bookId = alvo.bookId;
  /*
   * A âncora oferecida: a que veio do player, ou o ponto onde a pessoa parou
   * neste livro. Só existe para alvo-livro e para quem já começou — não faz
   * sentido prender no segundo zero de um livro que nunca se abriu.
   */
  const pontoAtual =
    bookId !== undefined && (ancoraInicial !== undefined || comecouOLivro(bookId))
      ? ancoraInicial ?? posicaoNoLivro(bookId)
      : undefined;
  const [prender, setPrender] = useState(ancoraInicial !== undefined);
  /*
   * A citação (ROTEIRO 4.43): `null` = comentário de texto puro. Ela é um **par
   * de pontas**, e não mais um comprimento a partir da âncora — o Matheus pediu
   * corte de verdade, *"exatamente o local onde ele quer citar"*, e para isso o
   * início também precisa andar. A âncora do comentário passa a ser o **início
   * do trecho**, que é o que faz sentido: é dali que a citação fala.
   */
  const [trecho, setTrecho] = useState<{ inicio: number; fim: number } | null>(null);
  const [spoiler, setSpoiler] = useState(false);

  // A sua nota deste livro, para estampar no seu comentário. Reage ao evento de
  // avaliação: mudar as estrelas ali em cima muda estas aqui na hora, sem F5.
  const [minhaNota, setMinhaNota] = useState<MinhaAvaliacao | null>(() =>
    alvo.bookId !== undefined ? myRatingOf(alvo.bookId) : null,
  );
  useEffect(() => {
    if (alvo.bookId === undefined) return;
    const atualizar = () => setMinhaNota(myRatingOf(alvo.bookId!));
    atualizar();
    window.addEventListener(RATINGS_EVENT, atualizar);
    return () => window.removeEventListener(RATINGS_EVENT, atualizar);
  }, [alvo.bookId]);

  function publicar() {
    const limpo = texto.trim();
    if (!limpo) return;

    /* Com trecho cortado, a âncora é o início dele: é de lá que a citação fala. */
    const ancora =
      trecho !== null ? trecho.inicio : prender && pontoAtual !== undefined ? pontoAtual : undefined;
    const citado = trecho !== null ? trecho.fim - trecho.inicio : undefined;
    addComment(alvo, limpo, { positionSec: ancora, spoiler, duracaoSec: citado });

    setMeus(myCommentsFor(alvo));
    setTexto("");
    setSpoiler(false);
    setTrecho(null);
    toast({
      title: citado ? `Trecho de ${citado}s citado` : "Comentário publicado",
      description:
        ancora !== undefined && bookId !== undefined
          ? citado
            ? `Quem tocar ouve de ${rotuloDaAncora(bookId, ancora)} e para no fim do trecho.`
            : `Preso em ${rotuloDaAncora(bookId, ancora)} — só quem chegou aí vai ler.`
          : undefined,
    });
  }

  function apagar(id: string) {
    removeComment(id);
    setMeus(myCommentsFor(alvo));
    toast({ title: "Comentário apagado" });
  }

  const inicial = initialOf(perfil.name);

  const identidade = (
    <div className="flex items-center gap-2">
      <span className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[11px] font-bold shrink-0">
        {inicial}
      </span>
      <span className="text-sm font-bold">
        {perfil.name} <span className="font-normal text-white/30">· você</span>
      </span>
    </div>
  );

  return (
    <>
      <div
        className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3"
        data-testid="comment-composer"
      >
        {identidade}

        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value.slice(0, MAX_COMMENT))}
          placeholder={placeholder}
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 resize-none"
          data-testid="comment-input"
        />

        {/*
          As duas escolhas da sala, e elas só aparecem em comentário de livro.
          Ficam **acima** do botão de publicar de propósito: são decisões sobre
          quem vai poder ler, e decidir isso depois de mandar não existe.
        */}
        {bookId !== undefined && (
          <div className="flex flex-wrap gap-2">
            {pontoAtual !== undefined && (
              <Interruptor
                ligado={prender}
                onToggle={() => setPrender((v) => !v)}
                icone={<Headphones className="h-3 w-3" />}
                testid="comment-anchor-toggle"
                titulo={
                  prender
                    ? `Preso em ${rotuloDaAncora(bookId, pontoAtual)}`
                    : `Prender em ${rotuloDaAncora(bookId, pontoAtual)}`
                }
              />
            )}
            <Interruptor
              ligado={spoiler}
              onToggle={() => setSpoiler((v) => !v)}
              icone={<EyeOff className="h-3 w-3" />}
              testid="comment-spoiler-toggle"
              titulo="Contém spoiler"
              cor="ambar"
            />

            {/*
              **Citar um trecho** (ROTEIRO 4.43). Só aparece com a âncora ligada,
              e não como um terceiro interruptor solto: citar é uma variação de
              "preso aqui", não uma opção paralela. Desligado por padrão — a
              maioria dos comentários é texto.
            */}
            {prender && pontoAtual !== undefined && (
              <Interruptor
                ligado={trecho !== null}
                onToggle={() =>
                  setTrecho((v) =>
                    v === null
                      ? { inicio: pontoAtual, fim: pontoAtual + MAX_CITACAO_SEC }
                      : null,
                  )
                }
                icone={<Quote className="h-3 w-3" />}
                testid="comment-citacao-toggle"
                titulo={trecho !== null ? `Cortando ${trecho.fim - trecho.inicio}s` : "Citar o trecho"}
              />
            )}
          </div>
        )}

        {/*
          O cortador só aparece depois de a citação ser ligada: uma faixa de onda
          permanente numa caixa que quase sempre recebe só texto seria ruído.
        */}
        {bookId !== undefined && trecho !== null && (
          <div className="space-y-2">
            <CortadorDeTrecho
              bookId={bookId}
              inicio={trecho.inicio}
              fim={trecho.fim}
              onChange={(inicio, fim) => setTrecho({ inicio, fim })}
            />
            <CitacaoDeAudio
              citacao={criarCitacao(bookId, trecho.inicio, trecho.fim - trecho.inicio)}
              compacto
            />
          </div>
        )}

        {bookId !== undefined && prender && pontoAtual !== undefined && (
          <p className="text-[11px] leading-relaxed text-white/35">
            Só quem já ouviu até esse ponto vai ler o que você escrever.
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/25">
            {texto.length}/{MAX_COMMENT}
          </span>
          <button
            onClick={publicar}
            disabled={texto.trim().length === 0}
            className="text-sm font-semibold text-primary disabled:text-white/20 transition-colors"
            data-testid="comment-send"
          >
            Comentar
          </button>
        </div>
      </div>

      {listarMeus && meus.map((c) => (
        <div
          key={c.id}
          className="bg-white/5 p-4 rounded-xl border border-white/5"
          data-testid={`my-comment-${c.id}`}
        >
          <div className="flex items-center justify-between">
            {identidade}
            <button
              onClick={() => apagar(c.id)}
              className="text-white/25 hover:text-white/60 transition-colors p-1"
              aria-label="Apagar meu comentário"
              data-testid={`delete-comment-${c.id}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <MinhasEstrelas nota={minhaNota} />

          {/*
            No **seu** comentário o texto nunca fica coberto — você já sabe o que
            escreveu. O que aparece é o estado dele para os outros: onde ficou
            preso e se está marcado como spoiler.
          */}
          {(c.positionSec !== undefined || c.spoiler) && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {c.positionSec !== undefined && c.bookId !== undefined && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary"
                  data-testid="my-comment-anchor"
                >
                  <Headphones className="h-3 w-3" />
                  {rotuloDaAncora(c.bookId, c.positionSec)}
                </span>
              )}
              {c.spoiler && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                  <EyeOff className="h-3 w-3" />
                  Marcado como spoiler
                </span>
              )}
            </div>
          )}

          <p className="text-sm text-white/70 leading-relaxed italic mt-1">"{c.text}"</p>
        </div>
      ))}
    </>
  );
}

/**
 * Uma escolha ligada/desligada, no formato de pastilha.
 *
 * Pastilha e não caixinha de marcar: no celular a área de toque de um checkbox
 * é pequena demais, e aqui as duas opções mudam **quem vai ler** o comentário —
 * merecem ser vistas de longe e acertadas de primeira.
 */
function Interruptor({
  ligado,
  onToggle,
  icone,
  titulo,
  testid,
  cor = "marca",
}: {
  ligado: boolean;
  onToggle: () => void;
  icone: React.ReactNode;
  titulo: string;
  testid: string;
  cor?: "marca" | "ambar";
}) {
  const aceso =
    cor === "ambar"
      ? "bg-primary/15 text-primary ring-primary/40"
      : "bg-primary/15 text-primary ring-primary/40";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={ligado}
      data-testid={testid}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ring-1 transition-colors ${
        ligado ? aceso : "bg-white/[0.04] text-white/40 ring-white/10 hover:text-white/70"
      }`}
    >
      {icone}
      {titulo}
    </button>
  );
}

/**
 * As suas estrelas dentro do seu comentário.
 *
 * **Mostra as duas dimensões separadas** — história e narração —, e não uma
 * média: as duas são independentes em `ratings.ts` (dá para avaliar só uma), e
 * uma média esconderia justamente o caso mais interessante, o do livro bom com
 * narração morna. Some por inteiro se você ainda não avaliou nada: comentar não
 * obriga a dar nota.
 */
function MinhasEstrelas({ nota }: { nota: MinhaAvaliacao | null }) {
  if (!nota || (nota.historia === undefined && nota.narracao === undefined)) return null;

  const linhas = [
    { rotulo: "História", valor: nota.historia },
    { rotulo: "Narração", valor: nota.narracao },
  ].filter((linha): linha is { rotulo: string; valor: number } => linha.valor !== undefined);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1" data-testid="my-comment-rating">
      {linhas.map((linha) => (
        <span
          key={linha.rotulo}
          className="flex items-center gap-1"
          aria-label={`${linha.rotulo}: ${linha.valor} de 5 estrelas`}
        >
          {[1, 2, 3, 4, 5].map((valor) => (
            <Star
              key={valor}
              className={`h-3.5 w-3.5 ${
                valor <= linha.valor ? "fill-primary text-primary" : "text-white/15"
              }`}
            />
          ))}
          <span className="ml-0.5 text-[10px] uppercase tracking-wider text-white/35">
            {linha.rotulo}
          </span>
        </span>
      ))}
    </div>
  );
}
