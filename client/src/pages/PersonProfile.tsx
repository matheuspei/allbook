import { useEffect } from "react";
import { Link } from "wouter";
import { PenLine, Mic, Compass, AudioLines } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import PersonAvatar, { hueDoNome } from "@/components/PersonAvatar";
import BookGrid from "@/components/BookGrid";
import ProfileComments from "@/components/ProfileComments";
import { findPerson, roleLabels } from "@/lib/people";
import { getBooksByGenre } from "@/lib/books";
import { commentsForPerson } from "@/lib/comments";
import { STUDIO_NAME, findVoice } from "@/lib/studio";

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
  const primeiroNome = person.name.split(" ")[0];
  const ehAutorENarrador = person.wrote.length > 0 && person.narrated.length > 0;

  /**
   * Qual nota vai na caixa: a do chapéu que a pessoa mais veste no catálogo.
   * A do outro chapéu, quando existe, vira a linha discreta logo abaixo.
   */
  const escreveMais = person.wrote.length >= person.narrated.length;
  const daObra = { rotulo: "Nota da obra", valor: person.ratingAutor ?? person.rating };
  const daNarracao = { rotulo: "Nota da narração", valor: person.ratingNarrador ?? person.rating };
  const notaPrincipal = escreveMais ? daObra : daNarracao;
  const notaSecundaria = ehAutorENarrador
    ? {
        texto: escreveMais
          ? `Na narração, a média é ${daNarracao.valor.toFixed(1)}.`
          : `Na obra escrita, a média é ${daObra.valor.toFixed(1)}.`,
      }
    : null;

  /**
   * Se este narrador é uma voz do AllBook Studio. É **aqui** — e na tela do
   * estúdio — que se diz que a voz é sintética: uma vez, no lugar onde a pessoa
   * veio saber quem narra. Na ficha de cada livro isso viraria aviso repetido.
   */
  const voz = findVoice(person.slug);

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
          <PersonAvatar
            name={person.name}
            photo={person.photo}
            size="xl"
            ampliavel
            legenda={papeis.join(" e ")}
          />

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

          {voz && (
            <div className="mt-3 flex flex-col items-center gap-2">
              <Link
                href="/studio"
                className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[11px] text-white/60 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white/80"
                data-testid="link-studio-voice"
              >
                <AudioLines className="h-3 w-3 text-primary" />
                Voz sintética do {STUDIO_NAME}
              </Link>
              <p className="max-w-sm text-[13px] leading-relaxed text-white/55">{voz.timbre}</p>
            </div>
          )}

          <dl className="mt-6 grid w-full grid-cols-3 gap-2">
            <Estatistica
              rotulo={person.titles === 1 ? "Título" : "Títulos"}
              valor={String(person.titles)}
            />
            {/*
              A nota da caixa é a do chapéu principal — o que a pessoa mais faz
              no catálogo. Antes era uma "Nota média" só, a média geral dos
              livros, e ela dizia a coisa errada: quem narra respondia pela
              qualidade do texto, e quem escreve respondia pela leitura (ver
              ROTEIRO 4.15). Quem faz os dois ganha a segunda nota logo abaixo,
              em vez de uma quarta caixa que apertaria a grade no celular.
            */}
            <Estatistica rotulo={notaPrincipal.rotulo} valor={notaPrincipal.valor.toFixed(1)} />
            <Estatistica
              rotulo={person.genres.length === 1 ? "Gênero" : "Gêneros"}
              valor={String(person.genres.length)}
            />
          </dl>

          {notaSecundaria && (
            <p className="mt-2 text-[11px] text-white/40" data-testid="text-second-rating">
              {notaSecundaria.texto}
            </p>
          )}

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

      {/*
        O mesmo bloco de comentários do perfil de editora — inclusive a caixa de
        escrever, que aqui não existia: a tela só mostrava o que os leitores
        fictícios tinham dito, sem jeito de responder. O selo "sobre a obra" /
        "sobre a narração" só aparece em quem escreve E narra; em quem faz uma
        coisa só ele seria ruído, porque não há o que distinguir.
      */}
      <ProfileComments
        comentarios={commentsForPerson(person.slug)}
        alvo={{ personSlug: person.slug }}
        placeholder={`O que você acha do trabalho de ${person.name}?`}
        vazio={`Ninguém comentou sobre ${primeiroNome} ainda. Seja o primeiro.`}
        etiqueta={(comentario) =>
          ehAutorENarrador
            ? comentario.about === "author"
              ? "sobre a obra"
              : "sobre a narração"
            : undefined
        }
        testid="section-person-comments"
      />

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
