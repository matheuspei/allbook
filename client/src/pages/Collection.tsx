import { useEffect } from "react";
import { Link } from "wouter";
import { Star, Library } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BookGrid from "@/components/BookGrid";
import { Button } from "@/components/ui/button";
import { findListBySlug, getBooksForCollection } from "@/lib/collections";
import CatalogoVazio from "@/components/CatalogoVazio";

/**
 * Uma coleção da tela Início ("Só na AllBook", "Favoritos"…). Espelha a tela de
 * categoria (`CategoryBooks`) de propósito, para as duas terem a mesma cara: a
 * faixa colorida no topo, contagem e nota média, e a grade de capas embaixo.
 */
export default function Collection({ params }: { params: { slug: string } }) {
  const colecao = findListBySlug(params.slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params.slug]);

  if (!colecao) {
    return (
      <>
        <PageHeader title="Coleção" />
        <div className="px-6 py-20 text-center">
          <p className="font-display text-lg font-bold text-white">Coleção não encontrada</p>
          <p className="mt-2 text-sm text-white/50">
            Esta coleção não existe no AllBook.
          </p>
          <Link href="/">
            <Button className="mt-6">Voltar ao início</Button>
          </Link>
        </div>
      </>
    );
  }

  const livros = getBooksForCollection(colecao);
  const notaMedia = livros.length
    ? livros.reduce((soma, livro) => soma + livro.rating, 0) / livros.length
    : 0;

  return (
    <div className="pb-10" data-testid="collection-books">
      <PageHeader title={colecao.label} />

      <header className={`relative overflow-hidden bg-gradient-to-br ${colecao.gradient}`}>
        <div aria-hidden="true" className="absolute inset-0 bg-black/25" />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-background"
        />

        {/* `sobre-midia`: cor viva e fixa nos dois temas — o texto segue branco.
            Só no bloco do texto: o degradê da base usa `to-background`. */}
        <div className="sobre-midia relative px-4 pb-8 pt-7">
          <h1 className="font-display text-3xl font-bold tracking-tight text-white drop-shadow">
            {colecao.label}
          </h1>
          <p className="mt-1 max-w-md text-sm text-white/90 drop-shadow">
            {colecao.description}
          </p>
          <div className="mt-3 flex items-center gap-4 text-sm text-white/90">
            <span className="flex items-center gap-1.5">
              <Library className="h-4 w-4" />
              {livros.length} {livros.length === 1 ? "título" : "títulos"}
            </span>
            {/* Coleção sem livro não tem média — "0.0" lê como nota péssima,
                não como ausência (§4.134). */}
            {livros.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-white text-white" />
                {notaMedia.toFixed(1)} de média
              </span>
            )}
          </div>
        </div>
      </header>

      <section className="px-4 pt-6" data-testid="collection-grid">
        {livros.length === 0 ? (
          <CatalogoVazio
            titulo="Esta lista ainda está vazia"
            descricao="A curadoria volta quando o acervo entrar. Enquanto isso, você pode pedir a narração de um livro."
          />
        ) : (
          <BookGrid books={livros} showAuthor />
        )}
      </section>
    </div>
  );
}
