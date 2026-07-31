import { useEffect } from "react";
import { Link } from "wouter";
import { Library, PenLine, Mic, Building2, ChevronRight } from "lucide-react";

import BotaoDeAcompanhar from "@/components/BotaoDeAcompanhar";
import PageHeader from "@/components/PageHeader";
import PublisherMark from "@/components/PublisherMark";
import PersonAvatar, { hueDoNome } from "@/components/PersonAvatar";
import BookGrid from "@/components/BookGrid";
import ProfileComments from "@/components/ProfileComments";
import { findPublisher, otherPublishers, personSlugOf } from "@/lib/publishers";
import { findPerson } from "@/lib/people";
import { commentsForPublisher } from "@/lib/comments";

/**
 * Perfil de uma editora — quem publica os livros do catálogo.
 *
 * **Por que existe.** Autor e narrador já tinham perfil; a editora, que é a
 * terceira assinatura de todo audiolivro, não tinha nenhuma — o nome dela nem
 * aparecia na tela do livro. Quem gosta do trabalho de uma casa (a tradução dos
 * clássicos, a escolha de quem narra) não tinha onde ver o resto do catálogo
 * dela nem onde dizer o que achou.
 *
 * A tela é irmã de `PersonProfile`: mesmo cabeçalho tingido, mesmas estatísticas
 * e o mesmo bloco de comentários (`ProfileComments`, compartilhado). O que muda
 * é o miolo — além dos livros, ela lista **as pessoas** que a editora publica e
 * grava, cada uma levando ao perfil próprio.
 */
export default function PublisherProfile({ params }: { params: { slug: string } }) {
  const publisher = findPublisher(params.slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params.slug]);

  if (!publisher) {
    return (
      <>
        <PageHeader title="Editora" />
        <div className="px-6 py-20 text-center">
          <p className="font-display text-lg font-bold text-white">Editora não encontrada</p>
          <p className="mt-2 text-sm text-white/50">
            Não há nenhuma editora com este endereço no catálogo do AllBook.
          </p>
        </div>
      </>
    );
  }

  const hue = hueDoNome(publisher.name);
  const comentarios = commentsForPublisher(publisher.slug);
  const outras = otherPublishers(publisher.slug);

  return (
    <div className="pb-10" data-testid="publisher-profile">
      <PageHeader title="Editora" />

      {/* Capa: a mesma lavagem de cor do perfil de pessoa, derivada do nome. */}
      <header className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-45"
          style={{
            background: `radial-gradient(115% 75% at 50% 0%, hsl(${hue} 70% 42%) 0%, transparent 68%)`,
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#141414]"
        />

        <div className="relative flex flex-col items-center px-4 pb-6 pt-8 text-center">
          <PublisherMark name={publisher.name} size="xl" />

          <h1
            className="mt-4 font-display text-2xl font-bold tracking-tight text-white"
            data-testid="text-publisher-name"
          >
            {publisher.name}
          </h1>

          <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/55">{publisher.linha}</p>

          {/* Seguir a editora — §4.84. */}
          <BotaoDeAcompanhar
            tipo="editora"
            slug={publisher.slug}
            nome={publisher.name}
            className="mt-5 w-full max-w-xs text-left"
          />

          <dl className="mt-6 grid w-full grid-cols-3 gap-2">
            <Estatistica
              rotulo={publisher.titles === 1 ? "Título" : "Títulos"}
              valor={String(publisher.titles)}
            />
            <Estatistica rotulo="Nota média" valor={publisher.rating.toFixed(1)} />
            <Estatistica
              rotulo={publisher.authors.length === 1 ? "Autor" : "Autores"}
              valor={String(publisher.authors.length)}
            />
          </dl>

          {publisher.genres.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {publisher.genres.map((genero) => (
                <span
                  key={genero}
                  className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/60 ring-1 ring-white/10"
                >
                  {genero}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      <Secao
        icone={<Library className="h-4 w-4 text-primary" />}
        titulo="No catálogo"
        contagem={`${publisher.titles} ${publisher.titles === 1 ? "título" : "títulos"}`}
        testid="section-publisher-books"
      >
        <BookGrid books={publisher.books} showAuthor />
      </Secao>

      <Secao
        icone={<PenLine className="h-4 w-4 text-primary" />}
        titulo="Quem ela publica"
        contagem={`${publisher.authors.length} ${publisher.authors.length === 1 ? "autor" : "autores"}`}
        testid="section-publisher-authors"
      >
        <FileiraDePessoas nomes={publisher.authors} />
      </Secao>

      <Secao
        icone={<Mic className="h-4 w-4 text-primary" />}
        titulo="Quem narra para ela"
        contagem={`${publisher.narrators.length} ${
          publisher.narrators.length === 1 ? "narrador" : "narradores"
        }`}
        testid="section-publisher-narrators"
      >
        <FileiraDePessoas nomes={publisher.narrators} />
      </Secao>

      <ProfileComments
        comentarios={comentarios}
        alvo={{ publisherSlug: publisher.slug }}
        placeholder={`O que você acha do trabalho da ${publisher.name}?`}
        vazio={`Ninguém comentou sobre a ${publisher.name} ainda. Seja o primeiro.`}
        testid="section-publisher-comments"
      />

      {outras.length > 0 && (
        <Secao
          icone={<Building2 className="h-4 w-4 text-primary" />}
          titulo="Outras editoras"
          contagem={`${outras.length}`}
          testid="section-other-publishers"
        >
          <div className="space-y-2">
            {outras.map((editora) => (
              <Link
                key={editora.slug}
                href={`/publisher/${editora.slug}`}
                className="flex items-center gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/5 transition-colors hover:bg-white/10"
                data-testid={`link-publisher-${editora.slug}`}
              >
                <PublisherMark name={editora.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white">
                    {editora.name}
                  </span>
                  <span className="block truncate text-[11px] text-white/40">
                    {editora.titles} {editora.titles === 1 ? "título" : "títulos"} ·{" "}
                    {editora.genres[0]}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
              </Link>
            ))}
          </div>
        </Secao>
      )}
    </div>
  );
}

/**
 * Autores ou narradores da editora, cada um levando ao perfil dele.
 *
 * Fileira que rola de lado, e não grade: o nome é curto e a lista pode ter
 * quinze pessoas — em grade viraria uma parede que empurra os comentários para
 * fora da tela.
 */
function FileiraDePessoas({ nomes }: { nomes: string[] }) {
  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
      {nomes.map((nome) => {
        const pessoa = findPerson(personSlugOf(nome));
        return (
          <Link
            key={nome}
            href={`/person/${personSlugOf(nome)}`}
            className="flex w-20 shrink-0 flex-col items-center gap-2 text-center"
            data-testid={`link-person-${personSlugOf(nome)}`}
          >
            <PersonAvatar name={nome} photo={pessoa?.photo} size="md" />
            <span className="text-[11px] leading-snug text-white/70 line-clamp-2">{nome}</span>
          </Link>
        );
      })}
    </div>
  );
}

/** Mesmo tratamento de superfície dos cartões da tela Estatísticas. */
function Estatistica({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/5 px-2 py-3">
      <dd className="font-display text-xl font-bold text-white">{valor}</dd>
      <dt className="mt-0.5 text-[10px] uppercase tracking-wide text-white/40">{rotulo}</dt>
    </div>
  );
}

function Secao({
  icone,
  titulo,
  contagem,
  testid,
  children,
}: {
  icone: React.ReactNode;
  titulo: string;
  contagem: string;
  testid: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 px-4 pt-7" data-testid={testid}>
      <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-white">
        {icone}
        {titulo}
        <span className="ml-auto text-xs font-normal text-white/40">{contagem}</span>
      </h2>
      {children}
    </section>
  );
}
