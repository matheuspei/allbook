import { useEffect, useRef, useState } from "react";
import { Heart, MoreHorizontal, Trash2, Flag } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { apagarPost } from "@/lib/mural";
import { curtidasDoPost, euCurti, alternarCurtida } from "@/lib/curtidas";
import { type Post } from "@/lib/posts";

/**
 * A barra de ações do post — **curtir** e o menu de "…".
 *
 * **O que está aqui e o que não está, e por quê.** A §4.58 decidiu quatro ações:
 * curtir, comentar, compartilhar e o menu. Estas duas primeiras já funcionam de
 * verdade; **comentar e compartilhar ficam de fora até terem mecanismo**, porque
 * botão que não faz nada é o beco sem saída que a §4.23 mandou varrer — e num
 * feed ele é pior: a pessoa toca, nada acontece, e ela para de tocar em tudo.
 *
 * **O contador de curtidas é simulado e estável** (semente pelo id do post), como
 * o progresso dos membros do clube: sem servidor não existe curtida de ninguém
 * além da sua. O que **você** faz é real e fica gravado.
 */
export default function AcoesDoPost({ post, onApagado }: { post: Post; onApagado?: () => void }) {
  const { toast } = useToast();
  const [curtido, setCurtido] = useState(() => euCurti(post.id));
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const ehMeu = post.autorSlug === undefined;

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
      <button
        onClick={() => setCurtido(alternarCurtida(post.id))}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${
          curtido ? "text-primary" : "text-white/45 hover:text-white/80"
        }`}
        aria-pressed={curtido}
        data-testid={`curtir-${post.id}`}
      >
        <Heart className={`h-4 w-4 ${curtido ? "fill-current" : ""}`} />
        {total > 0 && total}
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
              <button
                onClick={() => {
                  apagarPost(post.id);
                  setMenuAberto(false);
                  toast({ title: "Post apagado" });
                  onApagado?.();
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] transition-colors hover:bg-white/5"
                data-testid={`apagar-${post.id}`}
              >
                <Trash2 className="h-4 w-4 text-white/50" />
                Apagar
              </button>
            ) : (
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
  );
}
