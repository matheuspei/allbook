import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, MoreHorizontal, Pencil, Repeat2, Trash2, Flag } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { COMENTARIOS_EVENT, totalDeComentarios } from "@/lib/comentariosDePost";
import { alternarCompartilhamento, euCompartilhei } from "@/lib/compartilhados";
import { curtidasDoPost, euCurti, alternarCurtida } from "@/lib/curtidas";
import { apagarMeuPost, type Post } from "@/lib/posts";

/**
 * A barra de ações do post — **curtir** e o menu de "…".
 *
 * **O que está aqui e o que não está, e por quê.** A §4.58 decidiu quatro ações:
 * curtir, comentar, compartilhar e o menu — e desde 30/07 **as quatro
 * funcionam**. Curtir e comentar são botões na barra; **compartilhar mora dentro
 * do "…"**, que foi como a §4.58 o listou (*editar · apagar · compartilhar ·
 * denunciar*).
 *
 * **Considerado e não feito: compartilhar como terceiro botão da barra**, no
 * estilo do "retweet". Ele seria mais visível e alternaria com um toque, mas o
 * gesto é raro perto de curtir e comentar — e três ícones, dos quais um quase
 * nunca é usado, encolhem os dois que são. Fica registrado porque é uma troca
 * defensável nos dois sentidos.
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
}: {
  post: Post;
  onApagado?: () => void;
  /** Liga o modo de edição no cartão — quem desenha o campo é ele. */
  onEditar?: () => void;
  comentariosAbertos?: boolean;
  /** Abre/fecha a conversa. Quem desenha a conversa é o cartão. */
  onComentar?: () => void;
}) {
  const { toast } = useToast();
  const [curtido, setCurtido] = useState(() => euCurti(post.id));
  const [compartilhado, setCompartilhado] = useState(() => euCompartilhei(post.id));
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

  const total = curtidasDoPost(post.id) + (curtido ? 1 : 0);

  return (
    <div className="mt-3 flex items-center gap-1 border-t border-white/[0.06] pt-2.5">
      {/* `py-3`: o alvo passa de 26 para 38 px de altura — **44 no aparelho**, que
          é o mínimo de Apple e Google. Medido, não estimado. Ver o comentário
          longo em `ComentariosDoPost`: o mesmo defeito valia aqui, em menor grau,
          e foi ele que fez o Matheus dizer que "o curtir não está funcionando". */}
      <button
        onClick={() => setCurtido(alternarCurtida(post.id))}
        className={`flex items-center gap-1.5 rounded-full px-3 py-3 text-[12px] font-semibold transition-colors ${
          curtido ? "text-primary" : "text-white/45 hover:text-white/80"
        }`}
        aria-pressed={curtido}
        data-testid={`curtir-${post.id}`}
      >
        <Heart className={`h-4 w-4 ${curtido ? "fill-current" : ""}`} />
        {total > 0 && total}
      </button>

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
              <>
                {/*
                  **Compartilhar = republicar no seu perfil** (§4.58). Não existe
                  em post seu: ele já está no seu perfil e no feed, e não há o que
                  espalhar — por isso a opção mora só neste ramo.
                */}
                <button
                  onClick={() => {
                    const agora = alternarCompartilhamento(post.id);
                    setCompartilhado(agora);
                    setMenuAberto(false);
                    toast({
                      title: agora ? "Compartilhado" : "Compartilhamento desfeito",
                      description: agora
                        ? "O post aparece no seu perfil e no feed, com o seu nome em cima."
                        : undefined,
                    });
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] transition-colors hover:bg-white/5"
                  data-testid={`compartilhar-${post.id}`}
                >
                  <Repeat2
                    className={`h-4 w-4 ${compartilhado ? "text-primary" : "text-white/50"}`}
                  />
                  {compartilhado ? "Desfazer compartilhamento" : "Compartilhar"}
                </button>
                <button
                  onClick={() => {
                    setMenuAberto(false);
                    toast({
                      title: "Denúncia enviada",
                      description: "Ninguém é avisado de que foi você.",
                    });
                  }}
                  className="flex w-full items-center gap-3 border-t border-white/[0.06] px-4 py-3 text-left text-[13px] transition-colors hover:bg-white/5"
                  data-testid={`denunciar-${post.id}`}
                >
                  <Flag className="h-4 w-4 text-white/50" />
                  Denunciar
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
