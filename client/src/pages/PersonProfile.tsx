import { useEffect } from "react";
import { useLocation } from "wouter";
import { Star, PenLine, Mic, Compass } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import PersonAvatar, { hueDoNome } from "@/components/PersonAvatar";
import { findPerson, roleLabels } from "@/lib/people";
import { getBooksByGenre, type Book } from "@/lib/books";

/**
 * Perfil de uma pessoa do catálogo — autor, narrador, ou os dois.
 *
 * É uma tela só para os dois papéis, e não duas telas parecidas: quem escreve
 * também pode narrar, e nesse caso as duas listas aparecem na mesma página em
 * vez de a pessoa ter dois perfis desconexos.
 */
export default function PersonProfile({ params }: { params: { slug: string } }) {
  const [, setLocation] = useLocation();
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

  function abrirLivro(id: number) {
    setLocation(`/book/${id}`);
  }

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
          <GradeDeLivros livros={person.wrote} aoAbrir={abrirLivro} />
        </Secao>
      )}

      {person.narrated.length > 0 && (
        <Secao
          icone={<Mic className="h-4 w-4 text-primary" />}
          titulo="Narrou"
          quantidade={person.narrated.length}
          testid="section-narrated"
        >
          <GradeDeLivros livros={person.narrated} aoAbrir={abrirLivro} />
        </Secao>
      )}

      {relacionados.length > 0 && (
        <Secao
          icone={<Compass className="h-4 w-4 text-primary" />}
          titulo={`Mais de ${generoPrincipal}`}
          quantidade={relacionados.length}
          testid="section-related"
        >
          <GradeDeLivros livros={relacionados} aoAbrir={abrirLivro} />
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

function GradeDeLivros({
  livros,
  aoAbrir,
}: {
  livros: Book[];
  aoAbrir: (id: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {livros.map((livro) => (
        <button
          key={livro.id}
          type="button"
          onClick={() => aoAbrir(livro.id)}
          aria-label={`${livro.title}, de ${livro.author}`}
          className="group text-left"
          data-testid={`card-person-book-${livro.id}`}
        >
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl shadow-lg shadow-black/40 ring-1 ring-white/10 transition-transform duration-200 group-hover:scale-[1.04] group-active:scale-[0.98]">
            <img src={livro.cover} alt="" className="h-full w-full object-cover" />
          </div>
          <span className="mt-2 block min-h-[32px] text-[12px] font-medium leading-snug text-white line-clamp-2">
            {livro.title}
          </span>
          <span className="mt-0.5 flex items-center gap-1 text-[11px] text-white/60">
            <Star className="h-3 w-3 shrink-0 fill-[#f59e0b] text-[#f59e0b]" />
            {livro.rating.toFixed(1)}
          </span>
        </button>
      ))}
    </div>
  );
}
