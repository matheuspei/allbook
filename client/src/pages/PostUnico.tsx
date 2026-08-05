import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft } from "lucide-react";

import CartaoDePost from "@/components/comunidade/CartaoDePost";
import { MURAL_EVENT } from "@/lib/mural";
import { POSTS_EVENT, todosOsPosts, type Post } from "@/lib/posts";

/**
 * Um post sozinho, com a conversa aberta (`/post/:id`).
 *
 * **Por que ela existe.** Quando alguém comenta no seu post, o aviso do sino
 * precisa levar **ao post** — e até 30/07 não havia para onde: o feed é
 * cronológico, e um post de dois dias atrás está a dez telas de rolagem. Aviso que
 * leva ao lugar aproximado é o mesmo defeito que a §4.51 já tinha cobrado (a
 * resposta que caía na sinopse em vez da conversa).
 *
 * **A conversa vem aberta** (`abrirSempre`): no feed ela abre sob demanda, porque
 * ali o assunto é a lista; aqui quem chegou chegou por ela.
 *
 * Serve também de destino para o **compartilhar**, quando ele existir (item 3 da
 * §4.58) — republicar um post precisa de um endereço para o post.
 */
export default function PostUnico() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null | undefined>(undefined);

  useEffect(() => {
    const atualizar = () => setPost(todosOsPosts().find((item) => item.id === id) ?? null);
    atualizar();
    window.addEventListener(POSTS_EVENT, atualizar);
    window.addEventListener(MURAL_EVENT, atualizar);
    return () => {
      window.removeEventListener(POSTS_EVENT, atualizar);
      window.removeEventListener(MURAL_EVENT, atualizar);
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-[#141414] pb-24 text-white" data-testid="post-unico-page">
      <header className="px-5 pb-3 pt-7">
        <Link
          href="/community"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white/45 transition-colors hover:text-white"
          data-testid="voltar-comunidade"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Feed
        </Link>
      </header>

      <div className="px-5">
        {post === undefined ? null : post === null ? (
          /* Post apagado — pelo dono, ou por você em outro momento. Diz o que
             aconteceu em vez de mostrar tela em branco. */
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
            <p className="text-[13px] leading-relaxed text-white/55">
              Este post não existe mais. Ele pode ter sido apagado por quem escreveu.
            </p>
            <Link
              href="/community"
              className="mt-3 inline-block text-[12px] font-bold text-primary"
              data-testid="ir-comunidade"
            >
              Ir para o Feed
            </Link>
          </div>
        ) : (
          <CartaoDePost post={post} abrirSempre />
        )}
      </div>
    </div>
  );
}
