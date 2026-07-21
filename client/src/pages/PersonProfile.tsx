import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PenLine, Mic, Compass, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import PersonAvatar, { hueDoNome } from "@/components/PersonAvatar";
import BookGrid from "@/components/BookGrid";
import { findPerson, roleLabels, type Person } from "@/lib/people";
import { getBooksByGenre } from "@/lib/books";
import { commentAuthorOf, commentsForPerson } from "@/lib/person-comments";
import {
  dislikeCount,
  likeCount,
  readReactions,
  toggleReaction,
  type Reaction,
  type Reactions,
} from "@/lib/reactions";

/**
 * Perfil de uma pessoa do catálogo — autor, narrador, ou os dois.
 *
 * É uma tela só para os dois papéis, e não duas telas parecidas: quem escreve
 * também pode narrar, e nesse caso as duas listas aparecem na mesma página em
 * vez de a pessoa ter dois perfis desconexos.
 */
export default function PersonProfile({ params }: { params: { slug: string } }) {
  const person = findPerson(params.slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params.slug]);

  if (!person) {
    return (
      <>
        <PageHeader title="Perfil" />
        <div className="px-6 py-20 text-center">
          <p className="font-display text-lg font-bold text-white">Pessoa não encontrada</p>
          <p className="mt-2 text-sm text-white/50">
            Não há ninguém com este endereço no catálogo do AllBook.
          </p>
        </div>
      </>
    );
  }

  const hue = hueDoNome(person.name);
  const papeis = roleLabels(person);

  // Sugestão de descoberta: outros títulos do gênero principal da pessoa. Sem
  // isto, o perfil de quem tem um livro só ficaria com meia tela vazia.
  const generoPrincipal = person.genres[0];
  const idsDaPessoa = new Set([...person.wrote, ...person.narrated].map((livro) => livro.id));
  const relacionados = generoPrincipal
    ? getBooksByGenre(generoPrincipal)
        .filter((livro) => !idsDaPessoa.has(livro.id))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 6)
    : [];

  return (
    <div className="pb-10" data-testid="person-profile">
      <PageHeader title={papeis.join(" e ")} />

      {/* Capa: uma lavagem de cor derivada do nome, a mesma do avatar. */}
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
          <PersonAvatar name={person.name} photo={person.photo} size="xl" />

          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-white">
            {person.name}
          </h1>

          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {papeis.map((papel) => (
              <span
                key={papel}
                className="rounded-full bg-primary/15 px-3 py-1 text-[11px] font-medium text-primary ring-1 ring-primary/30"
              >
                {papel}
              </span>
            ))}
          </div>

          <dl className="mt-6 grid w-full grid-cols-3 gap-2">
            <Estatistica
              rotulo={person.titles === 1 ? "Título" : "Títulos"}
              valor={String(person.titles)}
            />
            <Estatistica rotulo="Nota média" valor={person.rating.toFixed(1)} />
            <Estatistica
              rotulo={person.genres.length === 1 ? "Gênero" : "Gêneros"}
              valor={String(person.genres.length)}
            />
          </dl>

          {person.genres.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {person.genres.map((genero) => (
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

      {person.wrote.length > 0 && (
        <Secao
          icone={<PenLine className="h-4 w-4 text-primary" />}
          titulo="Escreveu"
          quantidade={person.wrote.length}
          testid="section-wrote"
        >
          <BookGrid books={person.wrote} />
        </Secao>
      )}

      {person.narrated.length > 0 && (
        <Secao
          icone={<Mic className="h-4 w-4 text-primary" />}
          titulo="Narrou"
          quantidade={person.narrated.length}
          testid="section-narrated"
        >
          <BookGrid books={person.narrated} showAuthor />
        </Secao>
      )}

      <ComentariosDaPessoa person={person} />

      {relacionados.length > 0 && (
        <Secao
          icone={<Compass className="h-4 w-4 text-primary" />}
          titulo={`Mais de ${generoPrincipal}`}
          quantidade={relacionados.length}
          testid="section-related"
        >
          <BookGrid books={relacionados} showAuthor />
        </Secao>
      )}
    </div>
  );
}

/**
 * O que os leitores dizem sobre esta pessoa.
 *
 * Sem estrelas, de propósito — o motivo está em `lib/person-comments.ts`. Em
 * resumo: nota de pessoa é placar público sobre um profissional, e a nota que
 * de fato ajuda a escolher (a da narração) pertence ao par livro+narrador, não
 * à pessoa em geral.
 */
function ComentariosDaPessoa({ person }: { person: Person }) {
  const comentarios = commentsForPerson(person.slug);
  const [reactions, setReactions] = useState<Reactions>({});

  // Só no navegador, depois de montar: `localStorage` não existe no servidor.
  useEffect(() => {
    setReactions(readReactions());
  }, []);

  function reagir(id: string, reaction: Reaction) {
    setReactions({ ...toggleReaction(id, reaction) });
  }

  return (
    <section className="space-y-3 px-4 pt-7" data-testid="section-person-comments">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-white">
        <MessageSquare className="h-4 w-4 text-primary" />
        O que dizem
        {comentarios.length > 0 && (
          <span className="ml-auto text-xs font-normal text-white/40">
            {comentarios.length} {comentarios.length === 1 ? "comentário" : "comentários"}
          </span>
        )}
      </h2>

      {comentarios.length === 0 ? (
        <p className="py-2 text-sm text-white/40" data-testid="text-no-person-comments">
          Ninguém comentou sobre {person.name.split(" ")[0]} ainda.
        </p>
      ) : (
        <div className="space-y-3">
          {comentarios.map((comentario) => {
            const autor = commentAuthorOf(comentario);
            const minha = reactions[comentario.id];

            return (
              <article
                key={comentario.id}
                className="space-y-3 rounded-xl border border-white/5 bg-white/5 p-4"
                data-testid={`card-person-comment-${comentario.id}`}
              >
                <div className="flex items-center justify-between gap-2">
                  {autor ? (
                    <Link
                      href={`/user/${autor.slug}`}
                      className="flex items-center gap-2 text-sm font-bold text-white hover:text-primary"
                      data-testid={`link-comment-author-${comentario.id}`}
                    >
                      <PersonAvatar name={autor.name} size="sm" />
                      {autor.name}
                    </Link>
                  ) : (
                    <span className="text-sm font-bold text-white/60">Leitor do AllBook</span>
                  )}

                  {/* Qual chapéu está sendo comentado — só aparece em quem tem os dois. */}
                  {person.wrote.length > 0 && person.narrated.length > 0 && (
                    <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/50 ring-1 ring-white/10">
                      {comentario.about === "author" ? "sobre a obra" : "sobre a narração"}
                    </span>
                  )}
                </div>

                <p className="text-sm leading-relaxed text-white/70 italic">"{comentario.text}"</p>

                <div className="flex items-center gap-1">
                  <BotaoDeReacao
                    icone={ThumbsUp}
                    ativo={minha === "like"}
                    numero={likeCount(comentario.likes, minha)}
                    aoClicar={() => reagir(comentario.id, "like")}
                    rotulo="Curtir"
                    testid={`button-like-${comentario.id}`}
                  />
                  <BotaoDeReacao
                    icone={ThumbsDown}
                    ativo={minha === "dislike"}
                    numero={dislikeCount(comentario.dislikes, minha)}
                    aoClicar={() => reagir(comentario.id, "dislike")}
                    rotulo="Descurtir"
                    testid={`button-dislike-${comentario.id}`}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function BotaoDeReacao({
  icone: Icone,
  ativo,
  numero,
  aoClicar,
  rotulo,
  testid,
}: {
  icone: React.ComponentType<{ className?: string }>;
  ativo: boolean;
  numero: number;
  aoClicar: () => void;
  rotulo: string;
  testid: string;
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-label={rotulo}
      aria-pressed={ativo}
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors ${
        ativo ? "bg-primary/15 text-primary" : "text-white/40 hover:bg-white/5 hover:text-white/70"
      }`}
      data-testid={testid}
    >
      <Icone className="h-3.5 w-3.5" />
      {numero}
    </button>
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
  quantidade,
  testid,
  children,
}: {
  icone: React.ReactNode;
  titulo: string;
  quantidade: number;
  testid: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 px-4 pt-7" data-testid={testid}>
      <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-white">
        {icone}
        {titulo}
        <span className="ml-auto text-xs font-normal text-white/40">
          {quantidade} {quantidade === 1 ? "título" : "títulos"}
        </span>
      </h2>
      {children}
    </section>
  );
}
