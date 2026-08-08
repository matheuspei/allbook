import { Link } from "wouter";
import { AudioLines, Play, Users } from "lucide-react";

import { catalog } from "@/lib/books";
import { clubePorId } from "@/lib/clubes";
import { findPerson } from "@/lib/people";
import { postPorId, type ObjetoDoPost } from "@/lib/posts";

/**
 * **O que você marcou com `@`, desenhado** (§4.93).
 *
 * ---
 *
 * **A queixa que criou este arquivo** (31/07): *"quando você marca o livro, ele
 * não aparece o livro. Aquele ícone do livro só aparece o link, te levando ao
 * livro, que é pior ainda"*.
 *
 * É a **mesma** crítica de 30/07 (*"não colocou a capa"*), que na época consertou
 * só o post: lá a primeira menção virou cartão (`objetoDaPrimeiraMencao`), e o
 * comentário ficou para trás — marcar um livro respondendo alguém dava uma
 * palavra laranja e mais nada. Uma regra aplicada em metade dos lugares é pior do
 * que não existir: quem aprendeu o gesto no post o repete no comentário e acha
 * que quebrou.
 *
 * **Este é o cartão pequeno da menção**, e ele serve livro, pessoa e clube — as
 * três coisas que o `@` sabe marcar. O grande (a capa inteira) continua sendo o
 * do post; aqui dentro de um comentário ele roubaria a cena da conversa.
 *
 * **Um pixel, um dono**: a capa e o nome abrem a ficha; o ▶ vai direto para o
 * player. A versão anterior desta peça (`LivroDaResposta`) desenhava o ▶ dentro
 * de um link só, então o botão de ouvir levava à ficha — botão que mente sobre o
 * que faz, que é o que a §4.59 manda varrer.
 */
export default function ObjetoMencionado({
  objeto,
  className,
}: {
  objeto: ObjetoDoPost;
  className?: string;
}) {
  const resumo = resumoDoObjeto(objeto);
  if (!resumo) return null;

  return (
    <div
      className={`mt-1.5 flex items-center gap-2.5 rounded-xl bg-white/[0.06] p-2 ring-1 ring-inset ring-white/10 ${className ?? ""}`}
      data-testid="objeto-mencionado"
    >
      <Link
        href={resumo.href}
        className="flex min-w-0 flex-1 items-center gap-2.5 transition-opacity hover:opacity-75"
      >
        {resumo.capa ? (
          <img
            src={resumo.capa}
            alt=""
            className={
              resumo.redonda
                ? "h-10 w-10 shrink-0 rounded-full object-cover"
                : "h-[52px] w-[36px] shrink-0 rounded-md object-cover"
            }
          />
        ) : (
          <span
            className={`grid shrink-0 place-items-center bg-white/10 text-white/40 ${
              resumo.redonda ? "h-10 w-10 rounded-full" : "h-[52px] w-[36px] rounded-md"
            }`}
          >
            {resumo.icone}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px] font-semibold leading-tight">
            {resumo.titulo}
          </span>
          <span className="mt-0.5 block truncate text-[10px] text-white/40">{resumo.legenda}</span>
          {resumo.extra && (
            <span className="mt-0.5 block truncate text-[10px] text-primary">{resumo.extra}</span>
          )}
        </span>
      </Link>

      {resumo.tocar && (
        <Link
          href={resumo.tocar}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
          aria-label={`Ouvir ${resumo.titulo}`}
          data-testid="ouvir-objeto-mencionado"
        >
          <Play className="ml-px h-3 w-3 fill-current" />
        </Link>
      )}
    </div>
  );
}

/**
 * Qualquer objeto do post reduzido a **uma linha com miniatura**.
 *
 * Mora aqui, e não dentro de quem desenha, porque **dois lugares precisam da
 * mesma redução**: este cartão e a moldura da citação (`PostCitado`). Estava
 * escrita lá dentro; duas cópias divergiriam no primeiro tipo novo de objeto.
 */
export function resumoDoObjeto(objeto: ObjetoDoPost | undefined):
  | {
      capa?: string;
      icone?: React.ReactNode;
      titulo: string;
      legenda: string;
      /** Terceira linha, em laranja — hoje só o narrador. */
      extra?: string;
      /** Para onde a capa e o nome levam. */
      href: string;
      /** Para onde o ▶ leva. Ausente = não há o que tocar. */
      tocar?: string;
      /** Rosto é círculo; capa de livro é retrato. */
      redonda?: boolean;
    }
  | undefined {
  if (!objeto) return undefined;

  if (objeto.tipo === "livro") {
    const livro = catalog.find((item) => item.id === objeto.bookId);
    return livro
      ? {
          capa: livro.cover,
          titulo: livro.title,
          legenda: livro.author,
          extra: `narra ${livro.narrator}`,
          href: `/book/${livro.id}`,
          tocar: `/player/${livro.id}`,
        }
      : undefined;
  }

  if (objeto.tipo === "trecho") {
    const livro = catalog.find((item) => item.id === objeto.citacao.bookId);
    return {
      capa: livro?.cover,
      icone: <AudioLines className="h-4 w-4" />,
      titulo: livro?.title ?? "Trecho",
      legenda: `trecho de ${objeto.citacao.duracaoSec}s`,
      href: `/book/${objeto.citacao.bookId}`,
      tocar: `/player/${objeto.citacao.bookId}`,
    };
  }

  if (objeto.tipo === "clube") {
    const clube = clubePorId(objeto.clubeId);
    if (!clube) return undefined;
    const livro = catalog.find((item) => item.id === clube.ciclo.bookId);
    return {
      capa: livro?.cover,
      icone: <Users className="h-4 w-4" />,
      titulo: clube.nome,
      legenda: livro ? `clube · lendo ${livro.title}` : "clube de leitura",
      href: `/clube/${clube.id}`,
    };
  }

  if (objeto.tipo === "pessoa") {
    const pessoa = findPerson(objeto.slug);
    if (!pessoa) return undefined;
    const narra = pessoa.narrated.length > 0;
    const obras = narra ? pessoa.narrated : pessoa.wrote;
    return {
      capa: pessoa.photo ?? obras[0]?.cover,
      titulo: pessoa.name,
      /* **A legenda nomeia o livro da miniatura**, e isso não é enfeite: sem
         foto, quem preenche o cartão é a capa de uma obra dela (§4.53) — e uma
         capa sem legenda, ao lado do nome de uma pessoa, parece capa errada. */
      legenda: obras[0]
        ? `${narra ? "narra" : "escreveu"} ${obras[0].title}${
            obras.length > 1 ? ` e mais ${obras.length - 1}` : ""
          }`
        : narra
          ? "narração"
          : "autoria",
      /* Só o rosto vira círculo: capa de livro recortada em círculo não se
         reconhece. */
      redonda: Boolean(pessoa.photo),
      href: `/person/${pessoa.slug}`,
    };
  }

  /*
    **Citar uma citação mostra o objeto lá de dentro**, e não uma terceira caixa.
    É o que mantém a moldura em um nível só — e é a razão pela qual compartilhar
    um compartilhamento pôde deixar de ser bloqueado (ver `compartilharPost`).
  */
  const dentro = postPorId(objeto.postId);
  const resumo = resumoDoObjeto(dentro?.objeto);
  return resumo ? { ...resumo, href: `/post/${objeto.postId}` } : undefined;
}
