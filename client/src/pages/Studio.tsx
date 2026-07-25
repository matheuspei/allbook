import { useEffect } from "react";
import { Link } from "wouter";
import { AudioLines, Mic, Library, ChevronRight } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import PersonAvatar from "@/components/PersonAvatar";
import BookGrid from "@/components/BookGrid";
import {
  STUDIO_COMO_FUNCIONA,
  STUDIO_SOBRE,
  booksByVoice,
  studioBooks,
  studioVoices,
} from "@/lib/studio";
import { findPerson } from "@/lib/people";

/**
 * A casa das narrações — onde o crédito "Produzido por AllBook Studio" leva.
 *
 * **Por que é uma tela, e não só um rótulo na ficha do livro.** O crédito
 * precisa levar a algum lugar, senão vira texto morto no meio de três linhas
 * clicáveis. E é aqui que a explicação de como a narração é feita cabe: dita uma
 * vez, no lugar onde a pessoa veio procurar, em vez de repetida em cada um dos
 * 59 livros como advertência.
 *
 * Herda o formato do perfil de editora (cabeçalho tingido, estatísticas,
 * seções) porque é o mesmo tipo de página — uma ficha de quem assina o trabalho.
 * O que muda é a cor: aqui a lavagem é a da marca, não um hash de nome, porque
 * o estúdio é o próprio AllBook.
 */
export default function Studio() {
  const livros = studioBooks();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const notaMedia = livros.length
    ? livros.reduce((soma, livro) => soma + livro.rating, 0) / livros.length
    : 0;

  return (
    <div className="pb-10" data-testid="studio-page">
      <PageHeader title="Estúdio" />

      <header className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(115% 75% at 50% 0%, hsl(24 100% 50%) 0%, transparent 68%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#141414]"
        />

        <div className="relative flex flex-col items-center px-4 pb-6 pt-8 text-center">
          <div className="grid h-24 w-24 place-items-center rounded-2xl bg-white/10 ring-2 ring-white/15 shadow-lg shadow-black/40 backdrop-blur-sm">
            <AudioLines className="h-11 w-11 text-primary" />
          </div>

          {/* A marca escrita como no TopNav, para o estúdio ser lido como parte
              do AllBook e não como uma empresa terceirizada. */}
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">
            <span className="text-primary">All</span>
            <span className="text-white">Book</span>
            <span className="ml-1.5 font-normal text-white/70">Studio</span>
          </h1>

          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/55">{STUDIO_SOBRE}</p>

          <dl className="mt-6 grid w-full grid-cols-3 gap-2">
            <Estatistica rotulo="Vozes" valor={String(studioVoices.length)} />
            <Estatistica rotulo="Títulos" valor={String(livros.length)} />
            <Estatistica rotulo="Nota média" valor={notaMedia.toFixed(1)} />
          </dl>
        </div>
      </header>

      <section className="px-4 pt-2" data-testid="section-studio-how">
        <p className="rounded-xl border border-white/5 bg-white/5 p-4 text-[13px] leading-relaxed text-white/60">
          {STUDIO_COMO_FUNCIONA}
        </p>
      </section>

      <Secao
        icone={<Mic className="h-4 w-4 text-primary" />}
        titulo="As vozes da casa"
        contagem={`${studioVoices.length} vozes`}
        testid="section-studio-voices"
      >
        <div className="space-y-2">
          {studioVoices.map((voz) => {
            const pessoa = findPerson(voz.slug);
            const titulos = booksByVoice(voz.slug).length;

            return (
              <Link
                key={voz.slug}
                href={`/person/${voz.slug}`}
                className="flex items-start gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/5 transition-colors hover:bg-white/10"
                data-testid={`link-voice-${voz.slug}`}
              >
                <PersonAvatar name={voz.name} photo={pessoa?.photo} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="truncate text-sm font-semibold text-white">{voz.name}</span>
                    <span className="shrink-0 text-[11px] text-white/35">
                      {titulos} {titulos === 1 ? "título" : "títulos"}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-white/45">
                    {voz.timbre}
                  </span>
                </span>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-white/30" />
              </Link>
            );
          })}
        </div>
      </Secao>

      {livros.length > 0 && (
        <Secao
          icone={<Library className="h-4 w-4 text-primary" />}
          titulo="Produzido aqui"
          contagem={`${livros.length} títulos`}
          testid="section-studio-books"
        >
          <BookGrid books={livros} showAuthor />
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
