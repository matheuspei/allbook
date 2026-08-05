import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, MessageSquare } from "lucide-react";

import CommentComposer from "@/components/CommentComposer";
import CommentThread from "@/components/CommentThread";
import MeuComentario from "@/components/MeuComentario";
import { commentsForBook } from "@/lib/comments";
import { desfazerDenuncia, idsEscondidos, MODERACAO_EVENT } from "@/lib/moderacao";
import {
  MEUS_COMENTARIOS_EVENT,
  myCommentsFor,
  removeComment,
  type MyComment,
} from "@/lib/myComments";
import { PLAYBACK_EVENT } from "@/lib/playback";
import { myRatingOf } from "@/lib/ratings";
import { comecouOLivro, posicaoNoLivro, separarSala } from "@/lib/sala";
import type { Reactions } from "@/lib/reactions";

/**
 * A sala do livro — a conversa de quem está ouvindo este livro.
 *
 * **O que ela tem que uma caixa de comentários não tem:** cada comentário pode
 * estar preso a um segundo do áudio, e o que está à frente de onde você chegou
 * não aparece. A trava não depende de ninguém declarar onde está — o player já
 * sabe. A regra inteira mora em `lib/sala.ts`; aqui só se desenha.
 *
 * **Três decisões de tela, todas com motivo:**
 *
 * 1. **O que está adiante aparece contado, não escondido.** "+3 mensagens à
 *    frente" mostra que a sala está viva sem entregar nada. Some por completo
 *    seria pior: quem chega num livro que ainda não começou veria uma sala
 *    morta — justo quem está decidindo se vai ouvir.
 * 2. **Comentário sem âncora aparece para todo mundo.** É a fala sobre o livro
 *    inteiro ("a narração é ótima"), que não estraga nada e é o que dá conteúdo
 *    à ficha de quem nunca abriu o livro.
 * 3. **A caixa de escrever vem antes da lista.** Foi o que resolveu o livro sem
 *    comentário semeado ficar mudo, e aqui vale igual.
 */
export default function SalaDoLivro({
  bookId,
  reactions,
  onReactionsChange,
}: {
  bookId: number;
  reactions: Reactions;
  onReactionsChange: (next: Reactions) => void;
}) {
  /*
   * A posição vive no estado (e não numa leitura direta a cada desenho) para a
   * sala se abrir **enquanto** a pessoa ouve: o player salva o progresso a cada
   * poucos segundos e avisa pelo mesmo evento que a barrinha escuta. Voltar do
   * player com dez minutos a mais já traz comentário novo liberado.
   */
  const [posicao, setPosicao] = useState(() => posicaoNoLivro(bookId));
  const [comecou, setComecou] = useState(() => comecouOLivro(bookId));

  useEffect(() => {
    const atualizar = () => {
      setPosicao(posicaoNoLivro(bookId));
      setComecou(comecouOLivro(bookId));
    };
    atualizar();
    window.addEventListener(PLAYBACK_EVENT, atualizar);
    return () => window.removeEventListener(PLAYBACK_EVENT, atualizar);
  }, [bookId]);

  /*
   * O que você escondeu ao denunciar não some do mundo — some da **sua** tela,
   * e com volta: a linha do fim conta quantos são e devolve todos de uma vez.
   * Denúncia sem desfazer é armadilha num alvo pequeno de celular.
   */
  const [escondidos, setEscondidos] = useState<Set<string>>(() => idsEscondidos());

  useEffect(() => {
    const atualizar = () => setEscondidos(idsEscondidos());
    window.addEventListener(MODERACAO_EVENT, atualizar);
    return () => window.removeEventListener(MODERACAO_EVENT, atualizar);
  }, []);

  const todos = commentsForBook(bookId).filter((item) => !escondidos.has(item.id));
  const escondidosAqui = commentsForBook(bookId).filter((item) => escondidos.has(item.id));
  const { visiveis, adiante, adianteItens } = separarSala(todos, posicao);

  /*
   * **Você pode abrir o que está à frente** (05/08). A trava continua ligada por
   * padrão — ninguém tropeça num spoiler —, mas deixou de ser parede: um toque
   * mostra tudo, e cada fala aberta vem com o selo de que está adiante.
   *
   * **Não fica guardado de propósito.** Sair da tela e voltar recoloca a trava.
   * Destravar custa um toque; um spoiler custa o livro. Se ele quiser que fique
   * lembrado por livro, é trocar este `useState` por uma chave no armazenamento.
   */
  const [mostrarAdiante, setMostrarAdiante] = useState(false);

  useEffect(() => setMostrarAdiante(false), [bookId]);

  /*
   * **As suas falas entram na conversa, não antes dela** (04/08, §4.87).
   *
   * Antes elas saíam empilhadas dentro do `CommentComposer`, coladas na caixa de
   * escrever — e o Matheus abriu "A Paciente Silenciosa" e viu quase só a
   * própria voz. O filtro estava certo; o lugar é que estava errado.
   *
   * **A ordem é a do livro, e não a do engajamento.** Sem âncora primeiro (é
   * fala sobre a obra inteira, que todo mundo lê a qualquer momento), depois por
   * minuto crescente. É a única ordem que faz a lista contar a mesma história
   * que o trilho do player — e agora que a conversa vive lá dentro, elas
   * precisam concordar.
   *
   * **As suas nunca ficam travadas:** você lê o que escreveu mesmo estando à
   * frente de onde parou. Esconder de você a própria fala seria absurdo.
   */
  const [meus, setMeus] = useState<MyComment[]>(() => myCommentsFor({ bookId }));

  useEffect(() => {
    const atualizar = () => setMeus(myCommentsFor({ bookId }));
    atualizar();
    window.addEventListener(MEUS_COMENTARIOS_EVENT, atualizar);
    return () => window.removeEventListener(MEUS_COMENTARIOS_EVENT, atualizar);
  }, [bookId]);

  const minhaNota = myRatingOf(bookId);

  type NaSala =
    | { tipo: "outro"; ordem: number; item: (typeof visiveis)[number] }
    | { tipo: "meu"; ordem: number; item: MyComment };

  const conversa: NaSala[] = [
    ...visiveis.map((item) => ({
      tipo: "outro" as const,
      ordem: item.positionSec ?? -1,
      item,
    })),
    ...meus.map((item) => ({ tipo: "meu" as const, ordem: item.positionSec ?? -1, item })),
  ].sort((a, b) => a.ordem - b.ordem);

  function apagarMeu(id: string) {
    removeComment(id);
    setMeus(myCommentsFor({ bookId }));
  }

  return (
    <div className="space-y-3" data-testid="sala-do-livro">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-bold">Conversa</h2>
        {todos.length > 0 && (
          <span className="text-xs text-white/35">
            {todos.length} {todos.length === 1 ? "mensagem" : "mensagens"}
          </span>
        )}
      </div>

      <p className="text-xs leading-relaxed text-white/40">
        O que alguém comenta em um ponto do áudio só aparece quando você chega lá.
      </p>

      {/* `listarMeus={false}`: quem desenha as suas falas aqui é a lista abaixo,
          na ordem do livro — ver o comentário longo em cima de `conversa`. */}
      <CommentComposer alvo={{ bookId }} listarMeus={false} />

      {conversa.map((linha) =>
        linha.tipo === "meu" ? (
          <MeuComentario
            key={linha.item.id}
            comment={linha.item}
            nota={minhaNota}
            onApagar={apagarMeu}
          />
        ) : (
          <CommentThread
            key={linha.item.id}
            comment={linha.item}
            reactions={reactions}
            onReactionsChange={onReactionsChange}
          />
        ),
      )}

      {adiante > 0 && !mostrarAdiante && (
        <Adiante quantas={adiante} comecou={comecou} onMostrar={() => setMostrarAdiante(true)} />
      )}

      {/* Aberto por escolha sua: cada fala vem com o selo de que está à frente,
          para não se confundir com o que já estava liberado. */}
      {mostrarAdiante &&
        adianteItens.map((comment) => (
          <div key={comment.id} className="relative" data-testid={`adiante-aberto-${comment.id}`}>
            <p className="mb-1 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[#f59e0b]">
              <EyeOff className="h-3 w-3" />
              à frente de onde você está
            </p>
            <CommentThread
              comment={comment}
              reactions={reactions}
              onReactionsChange={onReactionsChange}
            />
          </div>
        ))}

      {mostrarAdiante && adiante > 0 && (
        <button
          type="button"
          onClick={() => setMostrarAdiante(false)}
          className="w-full rounded-xl border border-white/10 py-2.5 text-xs font-semibold text-white/45 transition-colors hover:text-white/80"
          data-testid="sala-esconder-adiante"
        >
          Esconder as {adiante} de novo
        </button>
      )}

      {todos.length === 0 && escondidosAqui.length === 0 && <SalaVazia />}

      {escondidosAqui.length > 0 && (
        <button
          type="button"
          onClick={() => escondidosAqui.forEach((item) => desfazerDenuncia(item.id))}
          className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-left transition-colors hover:bg-white/[0.05]"
          data-testid="sala-escondidos"
        >
          <span className="text-xs text-white/35">
            {escondidosAqui.length}{" "}
            {escondidosAqui.length === 1 ? "comentário escondido" : "comentários escondidos"} por você
          </span>
          <span className="text-xs font-semibold text-primary">Mostrar</span>
        </button>
      )}
    </div>
  );
}

/**
 * As mensagens presas mais à frente.
 *
 * O texto muda conforme a pessoa **já começou** ou não: para quem está ouvindo,
 * é uma promessa ("aparecem conforme você avança"); para quem nunca abriu, é um
 * convite — e é o que impede a sala de parecer vazia na ficha de um livro novo.
 */
/**
 * O que está à frente — **e o botão para abrir mesmo assim** (05/08).
 *
 * Antes isto era só um aviso com cadeado: informava e não deixava fazer nada. O
 * Matheus derrubou: *"não gosto dessa trava de spoiler forçada… gosto da ideia
 * de o usuário poder ver, desde que ele saiba que provavelmente vai ter spoiler.
 * Hoje está bloqueado completamente"*. Ele tem razão — **cadeado sem chave é
 * decisão tomada no lugar da pessoa**, e o app inteiro foi construído no
 * princípio oposto (o véu do spoiler no comentário sempre teve "ver mesmo
 * assim").
 *
 * O aviso continua sendo o padrão, e o texto diz **o que há do outro lado** em
 * vez de só contar: quem toca sabe exatamente o que está aceitando.
 */
function Adiante({
  quantas,
  comecou,
  onMostrar,
}: {
  quantas: number;
  comecou: boolean;
  onMostrar: () => void;
}) {
  return (
    <div
      className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5"
      data-testid="sala-adiante"
    >
      <div className="flex items-center gap-3">
        <Lock className="h-4 w-4 shrink-0 text-white/30" />
        <p className="text-xs leading-relaxed text-white/45">
          <span className="font-semibold text-white/70">
            {quantas} {quantas === 1 ? "mensagem presa" : "mensagens presas"}
          </span>{" "}
          {comecou
            ? "em trechos à frente de onde você parou. Elas aparecem conforme você avança."
            : "em trechos deste livro. Comece a ouvir e elas vão se abrindo."}
        </p>
      </div>
      <button
        type="button"
        onClick={onMostrar}
        className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
        data-testid="sala-mostrar-adiante"
      >
        <Eye className="h-3.5 w-3.5" />
        Mostrar mesmo assim — pode ter spoiler
      </button>
    </div>
  );
}

/**
 * Sala sem nenhuma mensagem — o caso da maioria dos livros do catálogo.
 *
 * Em vez de um "seja o primeiro" solto, três perguntas para destravar quem não
 * sabe o que escrever. São de propósito perguntas que **não dependem do final**:
 * servem a quem está no primeiro capítulo e não criam spoiler ao serem
 * respondidas.
 */
function SalaVazia() {
  return (
    <div
      className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-5"
      data-testid="sala-vazia"
    >
      <div className="flex items-center gap-2.5">
        <MessageSquare className="h-4 w-4 text-white/30" />
        <p className="text-sm font-semibold">Ninguém comentou este livro ainda</p>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-white/45">
        Comece a conversa. Se faltar assunto:
      </p>
      <ul className="mt-2.5 space-y-1.5 text-xs text-white/55">
        <li>· O que te fez escolher este livro?</li>
        <li>· A narração combina com a história?</li>
        <li>· Teve algum trecho que você repetiu?</li>
      </ul>
    </div>
  );
}
