import { Link } from "wouter";

import { resumoDoObjeto } from "@/components/comunidade/ObjetoMencionado";
import { findMember, avatarDeLeitor } from "@/lib/community";
import { initialOf, readProfile } from "@/lib/profile";
import { type Post } from "@/lib/posts";

/**
 * O post de outra pessoa **dentro do seu**, quando você compartilha escrevendo
 * algo em cima (a "citação").
 *
 * ---
 *
 * **Por que aqui a moldura menor é certa, se em outro lugar eu a rejeitei.**
 *
 * No recompartilhamento simples (sem texto), o cartão original aparece inteiro,
 * com uma linha em cima dizendo quem republicou — aninhar ali seria espremer a
 * capa sem ganhar nada, e foi rejeitado por isso. Na **citação** a situação é
 * outra: existem **duas falas**, a sua e a dele, e a tela precisa dizer de quem é
 * cada uma. A moldura é o que faz isso, e é por isso que toda rede social a usa
 * exatamente neste caso e não no outro.
 *
 * **O que ela mostra é o mínimo para reconhecer o post**: quem, o que disse (três
 * linhas no máximo) e uma miniatura do objeto. Repetir o cartão grande de capa
 * aqui dentro faria a citação competir com a sua própria fala — e quem lê já pode
 * abrir o original com um toque.
 */
export default function PostCitado({ post }: { post: Post }) {
  const membro = post.autorSlug ? findMember(post.autorSlug) : undefined;
  const meuPerfil = readProfile();
  const ehMeu = post.autorSlug === undefined;
  const nome = ehMeu ? meuPerfil.name : (membro?.name ?? "Leitor");
  const objeto = resumoDoObjeto(post.objeto);

  return (
    <Link
      href={`/post/${post.id}`}
      className="mt-3 block rounded-xl border border-white/10 bg-black/25 p-3 transition-colors hover:bg-black/40"
      data-testid={`post-citado-${post.id}`}
    >
      <div className="flex items-center gap-2">
        {ehMeu && meuPerfil.photo ? (
          <img src={meuPerfil.photo} alt="" className="h-6 w-6 rounded-full object-cover" />
        ) : (
          <span
            className={`grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-to-br ${
              membro?.color ?? "from-primary to-primary/60"
            } text-[10px] font-bold`} {...avatarDeLeitor(membro?.slug)}
          >
            {ehMeu ? initialOf(meuPerfil.name) : nome.charAt(0)}
          </span>
        )}
        <span className="truncate text-[12px] font-semibold text-white/80">{nome}</span>
      </div>

      {post.texto && (
        <p className="mt-1.5 line-clamp-3 text-[12.5px] leading-relaxed text-white/60">
          {post.texto}
        </p>
      )}

      {objeto && (
        <div className="mt-2 flex items-center gap-2.5">
          {objeto.capa ? (
            <img
              src={objeto.capa}
              alt=""
              className="h-[52px] w-[35px] shrink-0 rounded object-cover ring-1 ring-white/10"
            />
          ) : (
            <span className="grid h-[52px] w-[35px] shrink-0 place-items-center rounded bg-white/10 text-white/40">
              {objeto.icone}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-semibold">{objeto.titulo}</span>
            <span className="block truncate text-[11px] text-white/40">{objeto.legenda}</span>
          </span>
        </div>
      )}
    </Link>
  );
}

/* A redução de um objeto a uma linha com miniatura mora em `ObjetoMencionado` —
   ela é a mesma que o cartão da menção usa dentro do comentário (§4.93). Estava
   escrita aqui dentro, e duas cópias divergiriam no primeiro tipo novo. */
