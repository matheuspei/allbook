import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Bell, ChevronRight, Sparkles } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import PersonAvatar from "@/components/PersonAvatar";
import PublisherMark from "@/components/PublisherMark";
import {
  ACOMPANHANDO_EVENT,
  acompanhados,
  linkDoAlvo,
  minhasNovidades,
  nomeDoAlvo,
  novidadesDe,
  papelDoAlvo,
  type Alvo,
} from "@/lib/acompanhando";
import { catalog, porNota, livroPorId} from "@/lib/books";
import { libraryBooks } from "@/lib/library";
import { findPerson } from "@/lib/people";
import { personSlugOf, publisherOfBook } from "@/lib/publishers";

/**
 * **Acompanhando** (`/acompanhando`) — quem você segue no catálogo e o que há
 * de novo.
 *
 * A segunda metade do pedido de 31/07: *"talvez até ter um acesso mais rápido
 * àquilo quando elas quiserem"*. A primeira metade é o aviso; esta é a porta.
 *
 * **A tela abre pelas novidades, não pela lista.** Quem entra aqui quer saber
 * *o que mudou* — a lista de quem você segue é consulta, e vem depois. Quando
 * não há novidade nenhuma, a lista assume o topo e a tela diz isso com todas as
 * letras, em vez de fingir movimento.
 *
 * **Vazia, ela sugere** — a partir dos autores e narradores dos livros da sua
 * biblioteca. Tela que nasce vazia e não oferece o primeiro passo é a que a
 * §4.23 manda evitar.
 */
export default function Acompanhando() {
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    const atualizar = () => setVersao((n) => n + 1);
    window.addEventListener(ACOMPANHANDO_EVENT, atualizar);
    return () => window.removeEventListener(ACOMPANHANDO_EVENT, atualizar);
  }, []);

  /* `versao` só força a releitura — os dados moram no localStorage. */
  const lista = versao >= 0 ? acompanhados() : [];
  const novidades = minhasNovidades();

  return (
    <div className="min-h-screen bg-background pb-28 text-white" data-testid="acompanhando-page">
      <PageHeader title="Seguindo" fallback="/profile" />

      <div className="space-y-6 px-5 pt-4">
        {lista.length === 0 ? (
          <Vazio />
        ) : (
          <>
            {novidades.length > 0 && (
              <section className="space-y-3" data-testid="novidades">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-display text-lg font-bold">Novidades</h2>
                  <span className="text-xs text-white/35">
                    {novidades.length} {novidades.length === 1 ? "novidade" : "novidades"}
                  </span>
                </div>

                <div className="space-y-2">
                  {novidades.map((item) => {
                    const livro = livroPorId(item.bookId);
                    return (
                      <Link
                        key={item.id}
                        href={`/book/${item.bookId}`}
                        className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-2.5 transition-colors hover:bg-white/[0.07]"
                        data-testid={`novidade-${item.id}`}
                      >
                        {livro && (
                          <img
                            src={livro.cover}
                            alt=""
                            className="h-12 w-12 shrink-0 rounded-lg object-cover"
                          />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-semibold leading-snug">
                            {item.texto}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-white/35">
                            {item.tipo === "narracao" ? "Nova narração" : "Novo no catálogo"} ·{" "}
                            <span className="text-primary">{nomeDoAlvo(item.alvo)}</span>
                          </span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-white/20" />
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="space-y-3" data-testid="lista-acompanhados">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-lg font-bold">Você segue</h2>
                <span className="text-xs text-white/35">{lista.length}</span>
              </div>

              <div className="space-y-2">
                {lista.map((alvo) => (
                  <LinhaDoAlvo key={`${alvo.tipo}:${alvo.slug}`} alvo={alvo} />
                ))}
              </div>
            </section>

            {novidades.length === 0 && (
              <p className="text-center text-[11px] leading-relaxed text-white/25">
                Nenhuma novidade por enquanto. Quando um livro ou uma narração de quem você segue
                chegar, ele aparece aqui e no sino.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Uma linha da lista — foto, nome, papel e quantas novidades tem agora. */
function LinhaDoAlvo({ alvo }: { alvo: Alvo }) {
  const nome = nomeDoAlvo(alvo);
  const pessoa = alvo.tipo === "pessoa" ? findPerson(alvo.slug) : undefined;
  const novidades = novidadesDe(alvo);

  return (
    <Link
      href={linkDoAlvo(alvo)}
      className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-2.5 transition-colors hover:bg-white/[0.07]"
      data-testid={`acompanhado-${alvo.tipo}-${alvo.slug}`}
    >
      {alvo.tipo === "pessoa" ? (
        <PersonAvatar name={nome} photo={pessoa?.photo} size="sm" />
      ) : (
        <PublisherMark name={nome} size="sm" />
      )}

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{nome}</span>
        <span className="mt-0.5 block text-[11px] text-white/35">
          {papelDoAlvo(alvo)}
          {novidades.length > 0 && (
            <span className="text-primary">
              {" · "}
              {novidades.length} {novidades.length === 1 ? "novidade" : "novidades"}
            </span>
          )}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-white/20" />
    </Link>
  );
}

/**
 * A tela sem ninguém — explica o que ganha quem segue e **oferece o primeiro
 * passo**, tirado da sua biblioteca (quem escreveu e quem narrou o que você
 * guardou).
 */
function Vazio() {
  const meus = libraryBooks().slice(0, 6);
  const sugestoes: { nome: string; slug: string }[] = [];
  const vistos = new Set<string>();

  for (const { book } of meus) {
    for (const nome of [book.author, book.narrator]) {
      const pessoa = catalogPersonSlug(nome);
      if (!pessoa || vistos.has(pessoa)) continue;
      vistos.add(pessoa);
      sugestoes.push({ nome, slug: pessoa });
    }
  }

  /* Sem biblioteca, sugere editoras dos livros mais bem avaliados — sempre há
     alguma porta para abrir. */
  const editoras =
    sugestoes.length > 0
      ? []
      : catalog
          .slice()
          .sort(porNota)
          .slice(0, 6)
          .map((livro) => publisherOfBook(livro.id))
          .filter((item, indice, lista) =>
            item ? lista.findIndex((outra) => outra?.slug === item.slug) === indice : false,
          )
          .slice(0, 4);

  return (
    <div className="space-y-5 pt-6 text-center" data-testid="acompanhando-vazio">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/5">
        <Bell className="h-8 w-8 text-white/20" />
      </div>

      <div className="space-y-2">
        <p className="font-display text-lg font-bold">Você ainda não segue ninguém</p>
        <p className="mx-auto max-w-sm text-[13px] leading-relaxed text-white/45">
          Seguindo um autor, um narrador, uma editora ou o AllBook Studio, você é avisado quando
          houver livro ou narração nova — e chega neles por aqui, sem procurar.
        </p>
      </div>

      {(sugestoes.length > 0 || editoras.length > 0) && (
        <div className="space-y-2 pt-2 text-left">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-white/50">
            <Sparkles className="h-3 w-3 text-primary" />
            {sugestoes.length > 0 ? "De quem você já ouve" : "Para começar"}
          </p>

          {sugestoes.slice(0, 5).map((item) => (
            <Link
              key={item.slug}
              href={`/person/${item.slug}`}
              className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-2.5 transition-colors hover:bg-white/[0.07]"
              data-testid={`sugestao-${item.slug}`}
            >
              <PersonAvatar name={item.nome} photo={findPerson(item.slug)?.photo} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.nome}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-white/20" />
            </Link>
          ))}

          {editoras.map(
            (editora) =>
              editora && (
                <Link
                  key={editora.slug}
                  href={`/publisher/${editora.slug}`}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-2.5 transition-colors hover:bg-white/[0.07]"
                  data-testid={`sugestao-${editora.slug}`}
                >
                  <PublisherMark name={editora.name} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {editora.name}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-white/20" />
                </Link>
              ),
          )}
        </div>
      )}
    </div>
  );
}

/**
 * O slug de uma pessoa do catálogo pelo nome — `undefined` se ela não existe.
 *
 * Usa o `personSlugOf` de `publishers.ts` em vez de refazer a normalização:
 * duas versões da mesma regra divergem, e é assim que um nome com acento vira
 * link quebrado.
 */
function catalogPersonSlug(nome: string): string | undefined {
  const slug = personSlugOf(nome);
  return findPerson(slug) ? slug : undefined;
}
