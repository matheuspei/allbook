import { useEffect, useRef, useState } from "react";
import { MessageCircle, MoreHorizontal, Pencil, Repeat2, Trash2, Flag } from "lucide-react";

import Reacoes, { LinhaDeRecepcao } from "@/components/comunidade/Reacoes";
import { useToast } from "@/hooks/use-toast";
import { COMENTARIOS_EVENT, totalDeComentarios } from "@/lib/comentariosDePost";
import {
  POSTS_EVENT,
  apagarMeuPost,
  euCompartilhei,
  totalDeCompartilhamentos,
  type Post,
} from "@/lib/posts";

/**
 * A barra de ações do post — **curtir** e o menu de "…".
 *
 * **As três ações da §4.58 são três botões: curtir, comentar, compartilhar.** O
 * menu de "…" guarda o que é raro e destrutivo — editar e apagar no que é seu,
 * denunciar no dos outros.
 *
 * **Compartilhar nasceu dentro do "…" e saiu de lá no mesmo dia**, depois da
 * crítica do Matheus: a Comunidade virou uma rede social, e nela compartilhar é
 * gesto de primeira classe — escondê-lo atrás de um menu é tratá-lo como
 * "denunciar". Ele fica **aceso** quando você já compartilhou, e o número ao lado
 * é **contagem real** (os do esqueleto e o seu), não simulada como a das
 * curtidas: onde existe número verdadeiro, inventar é mentira gratuita.
 *
 * **O contador de curtidas é simulado e estável** (semente pelo id do post), como
 * o progresso dos membros do clube: sem servidor não existe curtida de ninguém
 * além da sua. O que **você** faz é real e fica gravado.
 */
export default function AcoesDoPost({
  post,
  onApagado,
  onEditar,
  comentariosAbertos,
  onComentar,
  compartilhandoAberto,
  onCompartilhar,
}: {
  post: Post;
  onApagado?: () => void;
  /** Liga o modo de edição no cartão — quem desenha o campo é ele. */
  onEditar?: () => void;
  comentariosAbertos?: boolean;
  /** Abre/fecha a conversa. Quem desenha a conversa é o cartão. */
  onComentar?: () => void;
  compartilhandoAberto?: boolean;
  /** Abre/fecha a caixa de compartilhar. Quem a desenha é o cartão. */
  onCompartilhar?: () => void;
}) {
  const { toast } = useToast();
  const [compartilhado, setCompartilhado] = useState(() => euCompartilhei(post.id));
  const [compartilhamentos, setCompartilhamentos] = useState(() =>
    totalDeCompartilhamentos(post.id),
  );
  const [menuAberto, setMenuAberto] = useState(false);
  const [comentarios, setComentarios] = useState(() => totalDeComentarios(post.id));
  const menuRef = useRef<HTMLDivElement>(null);
  const ehMeu = post.autorSlug === undefined;

  /* O contador tem de mudar na hora em que você comenta — e quando o esqueleto
     responde de volta, 2,5 s depois, sem você tocar em nada. */
  useEffect(() => {
    const atualizar = () => setComentarios(totalDeComentarios(post.id));
    window.addEventListener(COMENTARIOS_EVENT, atualizar);
    return () => window.removeEventListener(COMENTARIOS_EVENT, atualizar);
  }, [post.id]);

  /* O mesmo para o compartilhar: ele cria (ou apaga) um post seu, e o botão
     precisa acender e o número mudar sem recarregar a tela. */
  useEffect(() => {
    const atualizar = () => {
      setCompartilhado(euCompartilhei(post.id));
      setCompartilhamentos(totalDeCompartilhamentos(post.id));
    };
    window.addEventListener(POSTS_EVENT, atualizar);
    return () => window.removeEventListener(POSTS_EVENT, atualizar);
  }, [post.id]);

  /* Fecha o menu ao tocar fora — sem isto ele fica aberto enquanto a pessoa
     rola o feed, e vira um cartão com um painel pendurado. */
  useEffect(() => {
    if (!menuAberto) return;
    const fora = (evento: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(evento.target as Node)) setMenuAberto(false);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [menuAberto]);

  return (
    <>
      {/* **Quem recebeu como**, antes da barra de ações: rostos e a frase, e a
          barra de divisão quando a fala dividiu. Ver `LinhaDeRecepcao`. */}
      <LinhaDeRecepcao id={post.id} deOutraPessoa={!ehMeu} autorSlug={post.autorSlug} />

    <div className="mt-1.5 flex items-center gap-1 border-t border-white/[0.06] pt-2.5">
      {/*
        **Curtir e descurtir, e o número abre quem reagiu** (31/07). Antes havia
        só o coração aqui, por uma "decisão nova" minha de 29/07 que **reabria uma
        decisão do Matheus sem fato novo** — ver o cabeçalho de `lib/curtidas.ts`.
        Os dois lados e a lista de quem reagiu moram no `Reacoes`, que é o mesmo
        componente do fórum e do mural: a mesma ação, com a mesma cara, em todo
        lugar (§4.67).
      */}
      <Reacoes
        id={post.id}
        deOutraPessoa={!ehMeu}
        autorSlug={post.autorSlug}
        escala="post"
        className="pl-1.5"
      />

      {/*
        **Comentar entrou em 30/07** — decisão da §4.58 (*"o post tem que curtir e
        comentar, com certeza"*), e o que faltava era o mecanismo: agora existe
        (`lib/comentariosDePost.ts`), raso, um nível.
      */}
      <button
        onClick={onComentar}
        className={`flex items-center gap-1.5 rounded-full px-3 py-3 text-[12px] font-semibold transition-colors ${
          comentariosAbertos ? "text-white" : "text-white/45 hover:text-white/80"
        }`}
        aria-expanded={comentariosAbertos}
        data-testid={`comentar-${post.id}`}
      >
        <MessageCircle className="h-4 w-4" />
        {comentarios > 0 && comentarios}
      </button>

      {/*
        **Compartilhar não aparece no seu próprio post.** Ele já está no seu
        perfil e no feed — não há o que espalhar, e um botão que só pode recusar
        é o botão morto que a §4.23 manda varrer.
      */}
      {!ehMeu && (
        <button
          onClick={onCompartilhar}
          className={`flex items-center gap-1.5 rounded-full px-3 py-3 text-[12px] font-semibold transition-colors ${
            compartilhado || compartilhandoAberto
              ? "text-primary"
              : "text-white/45 hover:text-white/80"
          }`}
          aria-pressed={compartilhado}
          aria-expanded={compartilhandoAberto}
          data-testid={`compartilhar-${post.id}`}
        >
          <Repeat2 className="h-4 w-4" />
          {compartilhamentos > 0 && compartilhamentos}
        </button>
      )}

      <div className="relative ml-auto" ref={menuRef}>
        <button
          onClick={() => setMenuAberto((valor) => !valor)}
          className="grid h-8 w-8 place-items-center rounded-full text-white/35 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Mais ações"
          data-testid={`menu-post-${post.id}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {menuAberto && (
          <div className="absolute bottom-full right-0 z-20 mb-1 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#1c1c1c] shadow-2xl">
            {ehMeu ? (
              <>
                {/*
                  **Editar existe porque o Matheus discordou de mim** (§4.58):
                  *"nas grandes plataformas você consegue editar"*. A condição
                  que ficou é o selo "editado", que a `editarPost` grava sozinha.
                */}
                <button
                  onClick={() => {
                    setMenuAberto(false);
                    onEditar?.();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] transition-colors hover:bg-white/5"
                  data-testid={`editar-${post.id}`}
                >
                  <Pencil className="h-4 w-4 text-white/50" />
                  Editar
                </button>
                <button
                  onClick={() => {
                    apagarMeuPost(post.id);
                    setMenuAberto(false);
                    toast({ title: "Post apagado" });
                    onApagado?.();
                  }}
                  className="flex w-full items-center gap-3 border-t border-white/[0.06] px-4 py-3 text-left text-[13px] transition-colors hover:bg-white/5"
                  data-testid={`apagar-${post.id}`}
                >
                  <Trash2 className="h-4 w-4 text-white/50" />
                  Apagar
                </button>
              </>
            ) : (
              /* Compartilhar saiu daqui e virou botão da barra: **um caminho, não
                 dois** — a mesma régua que fez o `@` substituir os botões de
                 anexo no compositor (§4.61). */
              <button
                onClick={() => {
                  setMenuAberto(false);
                  toast({
                    title: "Denúncia enviada",
                    description: "Ninguém é avisado de que foi você.",
                  });
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] transition-colors hover:bg-white/5"
                data-testid={`denunciar-${post.id}`}
              >
                <Flag className="h-4 w-4 text-white/50" />
                Denunciar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
