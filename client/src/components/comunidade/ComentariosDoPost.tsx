import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Check, Send, Trash2 } from "lucide-react";

import CampoComMencao from "@/components/comunidade/CampoComMencao";
import ObjetoMencionado from "@/components/comunidade/ObjetoMencionado";
import {
  MELHOR_RESPOSTA_EVENT,
  marcarMelhorResposta,
  melhorRespostaDe,
  possoMarcar,
} from "@/lib/melhorResposta";
import Reacoes from "@/components/comunidade/Reacoes";
import TextoDoPost from "@/components/comunidade/TextoDoPost";
import { useToast } from "@/hooks/use-toast";
import {
  COMENTARIOS_EVENT,
  apagarComentario,
  comentar,
  comentarioRecebido,
  comentariosDoPost,
  objetoDoComentario,
  reacaoDoEsqueleto,
  type ComentarioDePost,
} from "@/lib/comentariosDePost";
import { addNotification } from "@/lib/notifications";
import { findMember, fotoDoMembro, avatarDeLeitor } from "@/lib/community";
import { initialOf, readProfile } from "@/lib/profile";
import { objetoDaPrimeiraMencao, type Mencao, type Post } from "@/lib/posts";

/**
 * A conversa embaixo de um post — **rasa, um nível** (§4.58).
 *
 * **Abre fechada, e isso não é economia de tela.** Um feed em que cada post
 * carrega cinco comentários abertos deixa de ser feed: a pessoa rola dez telas
 * para ver quatro posts. O que fica visível é **quantos** são; quem se interessa
 * abre. É o mesmo raciocínio do compositor, que também nasce fechado.
 *
 * **Responder não cria fio.** A resposta entra na mesma lista com `@Fulano` na
 * frente — a decisão do raso. Já existem duas conversas profundas no app (a do
 * livro e a do clube); uma terceira com fios aninhados esconderia a conversa
 * dentro dela mesma.
 *
 * **O campo é o mesmo do compositor** (`CampoComMencao`), então dá para citar um
 * livro dentro de um comentário — que é metade das respostas de "o que ouço
 * agora?".
 */
export default function ComentariosDoPost({ post }: { post: Post }) {
  const { toast } = useToast();
  const perfil = readProfile();
  const [lista, setLista] = useState<ComentarioDePost[]>(() => comentariosDoPost(post.id));
  const [texto, setTexto] = useState("");
  const [mencoes, setMencoes] = useState<Mencao[]>([]);
  const [respondeA, setRespondeA] = useState<string | undefined>();
  /**
   * **O cartão que a resposta vai carregar** (§4.93) — desenhado enquanto se
   * escreve, e não só depois de enviar.
   *
   * Sem esta prévia, remover o botão "responder com um livro" tiraria junto a
   * única confirmação de que o livro entrou: o grifo laranja diz *"pegou o
   * nome"*, mas não diz *"vai sair com capa"*.
   */
  const objetoDaResposta = useMemo(
    () => objetoDaPrimeiraMencao(mencoes, texto),
    [mencoes, texto],
  );
  const [melhor, setMelhor] = useState<string | undefined>(() => melhorRespostaDe(post.id));
  const podeMarcar = possoMarcar(post.id);
  /** Contador que só serve para pedir foco ao campo (ver `responder`). */
  const [pedidoDeFoco, setPedidoDeFoco] = useState(0);

  useEffect(() => {
    const atualizar = () => {
      setLista(comentariosDoPost(post.id));
      setMelhor(melhorRespostaDe(post.id));
    };
    window.addEventListener(COMENTARIOS_EVENT, atualizar);
    window.addEventListener(MELHOR_RESPOSTA_EVENT, atualizar);
    return () => {
      window.removeEventListener(COMENTARIOS_EVENT, atualizar);
      window.removeEventListener(MELHOR_RESPOSTA_EVENT, atualizar);
    };
  }, [post.id]);

  function enviar() {
    const feito = comentar(post.id, texto, { respondeA, mencoes });
    if (!feito) return;
    setTexto("");
    setMencoes([]);
    setRespondeA(undefined);

    /*
      **O esqueleto responde de volta, e por que isso não é enfeite.** Sem
      servidor, um comentário seu cairia no vazio — e a pessoa nunca veria como a
      conversa se comporta. Quem responde é o autor do post, se ele existir: é
      quem responderia de verdade. Quando houver servidor, isto sai inteiro.

      **Só responde em post de outra pessoa.** O esqueleto reagindo ao próprio
      dono do post seria o app conversando consigo mesmo.

      Sem `clearTimeout` de propósito: a gravação é no `localStorage`, então ela
      vale mesmo se a pessoa já tiver fechado os comentários ou rolado o feed —
      e ela encontra a resposta quando voltar.
    */
    if (post.autorSlug !== undefined) {
      window.setTimeout(() => {
        const reacao = reacaoDoEsqueleto(post.autorSlug, perfil.name);
        comentarioRecebido({ postId: post.id, ...reacao });
        /* E o sino acende — era o pedido do Matheus na §4.58: *"eu tenho que ser
           notificado"* quando alguém interage com o que você escreveu. O toque no
           aviso abre `/post/:id`, com a conversa aberta. */
        addNotification({ fromSlug: reacao.autorSlug, postId: post.id, text: reacao.texto });
      }, 2500);
    }
  }

  /**
   * Começa a responder alguém: põe o `@Nome` no campo, marca a quem responde **e
   * traz o cursor para lá**.
   *
   * O foco não é detalhe: sem ele, quem toca "Responder" e começa a digitar
   * escreve no vazio — o botão fica com o foco e a frase se perde. Foi um bug de
   * verdade, pego na tela em 30/07.
   */
  function responder(nome: string) {
    setRespondeA(nome);
    setTexto((atual) => (atual.startsWith(`@${nome}`) ? atual : `@${nome} `));
    setPedidoDeFoco((n) => n + 1);
  }

  return (
    <div className="mt-2.5 border-t border-white/[0.06] pt-2.5" data-testid={`comentarios-${post.id}`}>
      {/*
        **O campo fica em cima, e a lista é do mais novo para o mais velho.**

        Estava ao contrário até 30/07, e o Matheus achou o defeito usando:
        *"eu acabei de comentar e o meu comentário foi lá pra baixo, muito ruim"*.
        Inverter a ordem sozinho não bastava — com o campo embaixo, o que você
        acabou de escrever apareceria **acima** do campo, fora do olhar. As duas
        coisas juntas fazem o comentário novo nascer **logo abaixo de onde você
        digitou**, que é o que YouTube e Facebook fazem.
      */}
      <div className="flex items-start gap-2.5">
        {perfil.photo ? (
          <img src={perfil.photo} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-orange-600 text-[10px] font-bold">
            {initialOf(perfil.name)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <CampoComMencao
            texto={texto}
            mencoes={mencoes}
            onMudar={(novoTexto, novasMencoes) => {
              setTexto(novoTexto);
              setMencoes(novasMencoes);
              /* Apagou o "@Nome" do começo? Deixou de ser resposta a alguém. */
              if (respondeA && !novoTexto.includes(`@${respondeA}`)) setRespondeA(undefined);
            }}
            placeholder={respondeA ? `Responder ${respondeA}…` : "Escrever um comentário…"}
            focarQuando={pedidoDeFoco}
            linhas={1}
            className="max-h-32 text-[12.5px]"
          />
        </div>

        <button
          onClick={enviar}
          disabled={texto.trim().length === 0}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-black transition-opacity disabled:opacity-25"
          aria-label="Enviar comentário"
          data-testid={`enviar-comentario-${post.id}`}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {/*
        **A prévia do que a menção vai virar** (§4.93).

        Aqui havia um botão "responder com um livro", com busca própria, e o
        Matheus o derrubou pelo mesmo motivo que já tinha derrubado os botões de
        anexo do compositor em 30/07: *"não precisa ter o botão de responder com
        o livro, se você já pode simplesmente colocar o @ e marcar o livro"*.
        Dois caminhos para a mesma coisa, e o segundo era o que menos gente
        acharia.
      */}
      {objetoDaResposta && (
        <div className="ml-[38px]">
          <ObjetoMencionado objeto={objetoDaResposta} />
        </div>
      )}

      {lista.length > 0 && (
        <div className="mt-3 space-y-2.5">
          {/* **A melhor resposta sobe ao topo** (§4.92). Ela é o que a pergunta
              foi buscar; deixá-la na ordem cronológica faria quem chega ter de
              ler as cinco para achar a que resolveu. */}
          {[...lista]
            .sort((a, b) => Number(b.id === melhor) - Number(a.id === melhor))
            .map((comentario) => (
            <UmComentario
              key={comentario.id}
              comentario={comentario}
              ehMelhor={comentario.id === melhor}
              podeMarcar={podeMarcar}
              onMarcar={() => {
                const marcou = marcarMelhorResposta(post.id, comentario.id);
                toast({
                  title: marcou ? "Marcada como melhor resposta" : "Desmarcada",
                  description: marcou
                    ? "Ela sobe ao topo, e a pergunta aparece como resolvida."
                    : undefined,
                });
              }}
              onResponder={responder}
              onApagado={() => toast({ title: "Comentário apagado" })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UmComentario({
  comentario,
  ehMelhor,
  podeMarcar,
  onMarcar,
  onResponder,
  onApagado,
}: {
  comentario: ComentarioDePost;
  /** Foi marcada como a que resolveu a pergunta (§4.92). */
  ehMelhor?: boolean;
  /** Você é quem perguntou — só você marca. */
  podeMarcar?: boolean;
  onMarcar: () => void;
  onResponder: (nome: string) => void;
  onApagado: () => void;
}) {
  const meuPerfil = readProfile();
  const ehMeu = comentario.autorSlug === undefined;
  const membro = comentario.autorSlug ? findMember(comentario.autorSlug) : undefined;
  const nome = ehMeu ? meuPerfil.name : (membro?.name ?? "Leitor");
  const objeto = objetoDoComentario(comentario);

  return (
    <div className="flex items-start gap-2.5" data-testid={`comentario-${comentario.id}`}>
      {ehMeu && meuPerfil.photo ? (
        <img src={meuPerfil.photo} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
      ) : (
        <Link
          href={ehMeu ? "/profile" : `/user/${comentario.autorSlug}`}
          className={`relative grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br ${
            membro?.color ?? "from-primary to-orange-600"
          } text-[10px] font-bold`} {...avatarDeLeitor(membro?.slug)}
        >
          {comentario.autorSlug && fotoDoMembro(comentario.autorSlug) ? (
            <img
              src={fotoDoMembro(comentario.autorSlug)}
              alt={nome}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            nome.charAt(0)
          )}
        </Link>
      )}

      <div className="min-w-0 flex-1">
        <div
          className={`rounded-xl rounded-tl-sm px-3 py-2 ${
            ehMelhor
              ? "bg-emerald-400/[0.07] ring-1 ring-inset ring-emerald-400/30"
              : "bg-white/[0.05]"
          }`}
        >
          {/* **O selo verde, e não uma estrela** — verde é "resolvido" no resto
              do app, e a palavra diz o que a cor sozinha não diria. */}
          {ehMelhor && (
            <span className="mb-1 flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-emerald-400">
              <Check className="h-3 w-3" strokeWidth={3} /> melhor resposta
            </span>
          )}
          <Link
            href={ehMeu ? "/profile" : `/user/${comentario.autorSlug}`}
            className="text-[12px] font-semibold hover:text-primary"
          >
            {nome}
          </Link>
          {/* O "@Fulano" do raso: sem ele, num post com cinco vozes não dá para
              saber quem fala com quem. */}
          {/*
            O `@Fulano` entra no texto quando não está lá — os comentários do
            esqueleto guardam o nome no campo `respondeA`, não escrito na frase.
            Ele fica **texto**, não link: mencionar pessoas ficou fora de propósito
            (§4.58), e aqui o nome serve para orientar a leitura, não para navegar.
          */}
          <TextoDoPost
            texto={
              comentario.respondeA && !comentario.texto.startsWith(`@${comentario.respondeA}`)
                ? `@${comentario.respondeA} ${comentario.texto}`
                : comentario.texto
            }
            mencoes={comentario.mencoes}
            className="mt-0.5 text-[12.5px] leading-relaxed text-white/80"
          />
          {/* **O que o comentário marcou com `@`, desenhado** (§4.93): livro,
              autor, narrador ou clube. Vem depois do texto porque o texto
              costuma ser o porquê ("curto, e o fim te dá um tapa"). */}
          {objeto && <ObjetoMencionado objeto={objeto} />}
        </div>

        {/*
          ⚠️ **A área de toque destes botões é maior que o desenho deles.**

          O Matheus relatou que *"esse curtir não está funcionando"*. Fui medir: ele
          **funciona** — grava e o coração acende. O que não funcionava era o
          **dedo acertar**: o botão tinha **19×14 px**, cerca de 22×16 no aparelho,
          contra os 44 que Apple e Google recomendam. É o mesmo defeito das
          bolinhas da conversa no player, que ele já tinha achado: *"é muito
          pequeno e o dedo da pessoa é muito grande"*.

          O conserto é `py-2 -my-2`: o padding cria a área de toque, a margem
          negativa devolve o espaço ao layout. **O desenho não muda; o alvo
          dobra.** Aumentar a fonte estragaria a hierarquia — comentário não pode
          competir com o post.
        */}
        <div className="mt-0.5 flex items-center gap-1 pl-1">
          <span className="py-3 pr-2 text-[10.5px] text-white/25">{quando(comentario.date)}</span>
          {/* Curtir **e descurtir**, com a lista de quem reagiu no número — o
              mesmo componente do post, do fórum e do mural (31/07). */}
          <Reacoes
            id={comentario.id}
            deOutraPessoa={!ehMeu}
            autorSlug={comentario.autorSlug}
            className="pr-1"
          />
          <button
            onClick={() => onResponder(nome)}
            className="-my-3 px-2 py-3 text-[10.5px] font-semibold text-white/35 transition-colors hover:text-white/70"
            data-testid={`responder-${comentario.id}`}
          >
            Responder
          </button>
          {/* **Só quem perguntou marca**, e não em resposta sua: escolher a
              própria resposta como a melhor é um botão que só serve para
              enganar a lista de perguntas. */}
          {podeMarcar && !ehMeu && (
            <button
              onClick={onMarcar}
              className={`-my-3 px-2 py-3 text-[10.5px] font-semibold transition-colors ${
                ehMelhor ? "text-emerald-400" : "text-white/35 hover:text-emerald-400"
              }`}
              data-testid={`marcar-melhor-${comentario.id}`}
            >
              {ehMelhor ? "✓ resolveu" : "resolveu?"}
            </button>
          )}
          {ehMeu && (
            <button
              onClick={() => {
                apagarComentario(comentario.id);
                onApagado();
              }}
              className="-my-3 px-2 py-3 text-white/20 transition-colors hover:text-red-300"
              aria-label="Apagar comentário"
              data-testid={`apagar-comentario-${comentario.id}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** A mesma escala do cartão, mais curta — aqui o espaço é apertado. */
function quando(iso: string): string {
  const minutos = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `${horas} h`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? "ontem" : `${dias} d`;
}
