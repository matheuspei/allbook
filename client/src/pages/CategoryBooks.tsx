import { useEffect } from "react";
import { Link } from "wouter";
import { Star, Library } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BookGrid from "@/components/BookGrid";
import { Button } from "@/components/ui/button";
import { findGenreBySlug, getBooksByGenre, genreGradient, porNota, mediaDeNotas} from "@/lib/books";
import CatalogoVazio from "@/components/CatalogoVazio";

/**
 * Todos os livros de um gênero. É o destino do link de gênero na tela do livro
 * e dos cartões coloridos da Descobrir.
 */
export default function CategoryBooks({ params }: { params: { slug: string } }) {
  const genero = findGenreBySlug(params.slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params.slug]);

  if (!genero) {
    return (
      <>
        <PageHeader title="Categoria" />
        <div className="px-6 py-20 text-center">
          <p className="font-display text-lg font-bold text-white">Categoria não encontrada</p>
          <p className="mt-2 text-sm text-white/50">
            Este gênero não existe no catálogo do AllBook.
          </p>
          {/* A lista de gêneros mora na aba Buscar desde 26/07 (ROTEIRO 4.32). */}
          <Link href="/search">
            <Button className="mt-6">Ver todos os gêneros</Button>
          </Link>
        </div>
      </>
    );
  }

  const livros = getBooksByGenre(genero).sort(porNota);
  const notaMedia = mediaDeNotas(livros);

  return (
    <div className="pb-10" data-testid="category-books">
      <PageHeader title={genero} />

      {/* Faixa com o mesmo gradiente que o gênero tem na grade da Descobrir,
          para a pessoa reconhecer de onde veio. */}
      <header className={`relative overflow-hidden bg-gradient-to-br ${genreGradient(genero)}`}>
        <div aria-hidden="true" className="absolute inset-0 bg-black/25" />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-background"
        />

        {/* `sobre-midia`: o gradiente do gênero é cor viva e fixa nos dois temas,
            então o texto em cima dele tem de continuar branco no tema claro. Vai
            só no bloco do texto, e não no `header`, porque o degradê da base usa
            `to-background` — dentro de `sobre-midia` isso viraria preto. */}
        <div className="sobre-midia relative px-4 pb-8 pt-7">
          <h1 className="font-display text-3xl font-bold tracking-tight text-white drop-shadow">
            {genero}
          </h1>
          <div className="mt-3 flex items-center gap-4 text-sm text-white/90">
            <span className="flex items-center gap-1.5">
              <Library className="h-4 w-4" />
              {livros.length} {livros.length === 1 ? "título" : "títulos"}
            </span>
            {/* Gênero sem livro não tem média: "0.0 de média" é um número que
                não existe, e parece nota péssima em vez de ausência (§4.134). */}
            {notaMedia !== undefined && (
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-white text-white" />
                {notaMedia.toFixed(1)} de média
              </span>
            )}
          </div>
        </div>
      </header>

      <section className="px-4 pt-6" data-testid="category-grid">
        {livros.length === 0 ? (
          <CatalogoVazio
            titulo={`Nada em ${genero} ainda`}
            descricao="Este gênero está esperando as primeiras narrações. Se você já sabe qual livro quer ouvir, é só pedir."
          />
        ) : (
          <BookGrid books={livros} showAuthor />
        )}
      </section>
    </div>
  );
}
