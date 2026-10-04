import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Star, Library } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BookGrid from "@/components/BookGrid";
import { Button } from "@/components/ui/button";
import {
  findGenreBySlug,
  generosDe,
  getBooksByGenre,
  genreGradient,
  porNota,
  mediaDeNotas,
  subcategoriasDe,
} from "@/lib/books";
import CatalogoVazio from "@/components/CatalogoVazio";

/**
 * Todos os livros de uma prateleira. É o destino do link de gênero na tela do
 * livro e dos cards da grade de gêneros do Catálogo.
 *
 * **Subcategoria é botão AQUI DENTRO, não card solto no Catálogo** (04/10,
 * §4.170): Cristianismo e Católicos apareciam ao lado de Romance, e a fusão de
 * Religião tinha saído pela metade. "Todos" é a prateleira inteira; cada botão
 * filtra pelos livros que a loja marcou com aquela subcategoria.
 */
/** Quantas capas entram por vez — a mesma régua da busca (§4.168). */
const LOTE = 60;

export default function CategoryBooks({ params }: { params: { slug: string } }) {
  const genero = findGenreBySlug(params.slug);
  const [botao, setBotao] = useState<string | null>(null);
  const [visiveis, setVisiveis] = useState(LOTE);

  useEffect(() => {
    window.scrollTo(0, 0);
    setBotao(null);
  }, [params.slug]);

  // Trocar de botão recomeça do primeiro lote.
  useEffect(() => setVisiveis(LOTE), [params.slug, botao]);

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

  const todos = getBooksByGenre(genero).sort(porNota);
  const notaMedia = mediaDeNotas(todos);
  const botoes = subcategoriasDe(genero);
  const livros = botao ? todos.filter((book) => generosDe(book).includes(botao)) : todos;

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
              {todos.length} {todos.length === 1 ? "título" : "títulos"}
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

      {botoes.length > 0 && (
        <div
          className="scrollbar-hide flex gap-2 overflow-x-auto px-4 pt-5"
          data-testid="category-subcategories"
        >
          {[null, ...botoes].map((rotulo) => {
            const ativo = botao === rotulo;
            return (
              <button
                key={rotulo ?? "todos"}
                onClick={(evento) => {
                  setBotao(rotulo);
                  // Mesmo gesto das pílulas da Biblioteca: o botão escolhido
                  // vem para o meio, em vez de ficar cortado na borda.
                  evento.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                }}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  ativo ? "bg-white text-background" : "bg-white/[0.07] text-white/70 hover:bg-white/[0.12]"
                }`}
                data-testid={`chip-subcategory-${rotulo ?? "todos"}`}
              >
                {rotulo ?? "Todos"}
              </button>
            );
          })}
        </div>
      )}

      <section className="px-4 pt-6" data-testid="category-grid">
        {livros.length === 0 ? (
          <CatalogoVazio
            titulo={`Nada em ${genero} ainda`}
            descricao="Este gênero está esperando as primeiras narrações. Se você já sabe qual livro quer ouvir, é só pedir."
          />
        ) : (
          <>
            {/* 🚨 Em lotes, como a busca (§4.168): juntar as prateleiras fez
                Religião ter 3.088 livros, e desenhar todos de uma vez — cada um
                pedindo a capa — travava o celular de quem abre pelo túnel. */}
            <BookGrid books={livros.slice(0, visiveis)} showAuthor />
            {livros.length > visiveis && (
              <button
                type="button"
                onClick={() => setVisiveis((n) => n + LOTE)}
                className="mt-6 h-11 w-full rounded-lg bg-white/10 text-sm font-medium text-white transition-colors hover:bg-white/20"
                data-testid="button-more-category"
              >
                Mostrar mais {Math.min(LOTE, livros.length - visiveis)} de {livros.length - visiveis}
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
