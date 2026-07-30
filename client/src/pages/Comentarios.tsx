import { Link, useParams } from "wouter";

import PageHeader from "@/components/PageHeader";
import { ItemDoFeed } from "@/components/MuralDaComunidade";
import { catalog } from "@/lib/books";
import { findMember } from "@/lib/community";
import { muralDe } from "@/lib/mural";
import { readMyComments } from "@/lib/myComments";
import { findPerson } from "@/lib/people";
import { findPublisher } from "@/lib/publishers";
import { relativeDate } from "@/lib/activity";

/**
 * "O que eu disse" em página inteira — **os comentários, e só eles**.
 *
 * Segunda das três páginas que os ícones do perfil precisavam existir para poder
 * apontar (§4.56, construído em 30/07 — ver `Recomendacoes.tsx` para o porquê da
 * mesma página servir os dois lados).
 *
 * **Comentário e post não moram mais juntos.** Antes o perfil tinha um bloco "O
 * que eu disse" que misturava os dois, limitado a três linhas. Agora o post tem o
 * lugar dele — o corpo do perfil — e aqui fica o que é comentário: o que você
 * falou **dentro** de um livro, de um autor ou de uma editora. Separar é o que
 * permite as duas coisas terem a forma certa: o post é cartão com capa, o
 * comentário é linha com destino.
 */
export default function Comentarios() {
  const params = useParams<{ slug?: string }>();
  const membro = params.slug ? findMember(params.slug) : undefined;

  if (params.slug && !membro) {
    return (
      <div className="min-h-screen bg-[#141414] pb-24 text-white">
        <PageHeader title="Leitor não encontrado" fallback="/community" />
      </div>
    );
  }

  const titulo = membro ? `O que ${membro.name.split(" ")[0]} disse` : "O que eu disse";

  return (
    <div className="min-h-screen bg-[#141414] pb-24 text-white" data-testid="pagina-comentarios">
      <PageHeader title={titulo} fallback={membro ? `/user/${membro.slug}` : "/profile"} />

      <div className="px-5 pt-2">
        {membro ? <DosOutros slug={membro.slug} /> : <OsMeus />}
      </div>
    </div>
  );
}

/**
 * Os comentários de outra pessoa, na língua do mural.
 *
 * Reusa o `ItemDoFeed` em vez de desenhar uma lista nova, e a razão está no
 * comentário que já existia na `UserProfile`: o `ItemDoFeed` traz de graça a
 * separação entre avaliação e conversa (estrela num, cadeado no outro) e **a
 * trava de spoiler** — uma lista crua vazava texto de trecho à frente.
 */
function DosOutros({ slug }: { slug: string }) {
  const itens = muralDe(slug, ["avaliou", "comentou"], 40);

  if (itens.length === 0) {
    return <p className="py-8 text-sm text-white/40">Ainda não disse nada nos livros.</p>;
  }

  return (
    <div data-testid="comentarios-de-outro">
      {itens.map((item) => (
        <ItemDoFeed key={item.id} item={item} />
      ))}
    </div>
  );
}

/**
 * Os seus comentários — **com o alvo resolvido**, seja livro, gente ou editora.
 *
 * O `MyComment` guarda um dos três alvos e nada mais; quem sabe o que cada um
 * significa na tela é aqui. Sem isso a lista mostraria "comentário" sem dizer
 * **onde**, que é a informação que faz a linha valer alguma coisa.
 */
function OsMeus() {
  const meus = readMyComments();

  if (meus.length === 0) {
    return (
      <p className="py-8 text-sm leading-relaxed text-white/40">
        Você ainda não comentou em nada. Os comentários ficam dentro do livro, do autor ou da
        editora — e aparecem reunidos aqui.
      </p>
    );
  }

  return (
    <div className="divide-y divide-white/5" data-testid="meus-comentarios">
      {meus.map((item) => {
        const alvo = alvoDoComentario(item);
        return (
          <div key={item.id} className="flex gap-3 py-3.5" data-testid={`meu-comentario-${item.id}`}>
            {alvo?.capa ? (
              <Link href={alvo.href} className="shrink-0">
                <img
                  src={alvo.capa}
                  alt=""
                  className="h-[62px] w-[44px] rounded object-cover ring-1 ring-white/10"
                />
              </Link>
            ) : (
              <span className="grid h-[62px] w-[44px] shrink-0 place-items-center rounded bg-white/[0.06] text-[10px] text-white/30">
                sem capa
              </span>
            )}

            <div className="min-w-0 flex-1">
              {alvo && (
                <Link
                  href={alvo.href}
                  className="block truncate text-[12px] font-semibold text-white/70 transition-colors hover:text-primary"
                >
                  {alvo.rotulo}
                </Link>
              )}
              <p className="mt-1 text-[13px] leading-relaxed text-white/80">“{item.text}”</p>
              <p className="mt-1 text-[10.5px] text-white/25">
                {relativeDate(item.date.slice(0, 10))}
                {item.spoiler && " · marcado como spoiler"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Onde o comentário foi deixado, pronto para a tela. */
function alvoDoComentario(item: {
  bookId?: number;
  personSlug?: string;
  publisherSlug?: string;
}): { capa?: string; rotulo: string; href: string } | undefined {
  if (item.bookId !== undefined) {
    const livro = catalog.find((book) => book.id === item.bookId);
    return livro
      ? { capa: livro.cover, rotulo: livro.title, href: `/book/${livro.id}/conversa` }
      : undefined;
  }
  if (item.personSlug) {
    const pessoa = findPerson(item.personSlug);
    if (!pessoa) return undefined;
    const capa = pessoa.photo ?? [...pessoa.narrated, ...pessoa.wrote][0]?.cover;
    return { capa, rotulo: pessoa.name, href: `/person/${pessoa.slug}` };
  }
  if (item.publisherSlug) {
    const editora = findPublisher(item.publisherSlug);
    return editora
      ? { rotulo: editora.name, href: `/publisher/${editora.slug}` }
      : undefined;
  }
  return undefined;
}
