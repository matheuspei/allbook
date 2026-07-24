import coverScifi from "@/assets/images/cover-scifi.png";
import coverSelfhelp from "@/assets/images/cover-selfhelp.png";
import coverRomance from "@/assets/images/cover-romance.png";
import coverMystery from "@/assets/images/cover-mystery.png";
import coverBusiness from "@/assets/images/cover-business.png";
import coverBiography from "@/assets/images/cover-biography.png";
import coverHorror from "@/assets/images/cover-horror.png";
import coverProductivity from "@/assets/images/cover-productivity.png";

import { fichasImportadas } from "./catalog-enriched";

export type Genre =
  | "Ficção Científica"
  | "Romance"
  | "Terror"
  | "Mistério"
  | "Negócios"
  | "Biografia"
  | "Autoajuda"
  | "Produtividade";

export interface Book {
  id: number;
  title: string;
  author: string;
  /**
   * Quem narra o audiolivro. O elenco é pequeno e recorrente de propósito: um
   * narrador com um título só teria um perfil sem nada para mostrar.
   */
  narrator: string;
  cover: string;
  rating: number;
  genre: Genre;

  // Daqui para baixo vem tudo do `npm run catalogo`, que busca na Open Library.
  // É opcional porque um livro recém-acrescentado só ganha esses campos depois
  // que o script rodar de novo.
  /** Título no idioma original — é por ele que o script busca. */
  originalTitle?: string;
  year?: number;
  pages?: number;
  isbn?: string;
  synopsis?: string;
}

/** O que é digitado à mão. O resto da ficha o script preenche. */
type BookCurado = Omit<Book, "originalTitle" | "year" | "pages" | "isbn" | "synopsis">;

/**
 * Capas reais baixadas pelo script, uma por id (`covers/7.jpg`). Quem ainda não
 * tem arquivo continua com a imagem genérica do gênero, definida logo abaixo.
 */
const arquivosDeCapa = import.meta.glob("../assets/images/covers/*.{jpg,jpeg,png,webp}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const capasPorId: Record<string, string> = Object.fromEntries(
  Object.entries(arquivosDeCapa).map(([caminho, url]) => [
    caminho.split("/").pop()!.replace(/\.\w+$/, ""),
    url,
  ])
);

/**
 * Catálogo fixo do app. Enquanto não existe backend, esta é a fonte única
 * dos livros — Home, Descobrir, Detalhes, Categoria e os perfis de pessoa leem
 * daqui, para não duplicar dados.
 * Quando a API existir, trocar por chamadas com TanStack Query.
 */
const catalogoCurado: BookCurado[] = [
  // Ficção Científica
  { id: 7, title: "Duna", author: "Frank Herbert", narrator: "Rafael Nogueira", cover: coverScifi, rating: 4.9, genre: "Ficção Científica" },
  { id: 8, title: "Fundação", author: "Isaac Asimov", narrator: "Diogo Serrano", cover: coverScifi, rating: 4.8, genre: "Ficção Científica" },
  { id: 109, title: "O Problema dos 3 Corpos", author: "Cixin Liu", narrator: "Diogo Serrano", cover: coverScifi, rating: 4.6, genre: "Ficção Científica" },
  { id: 129, title: "O Senhor dos Anéis", author: "J.R.R. Tolkien", narrator: "Rafael Nogueira", cover: coverScifi, rating: 4.9, genre: "Ficção Científica" },
  { id: 130, title: "1984", author: "George Orwell", narrator: "Diogo Serrano", cover: coverScifi, rating: 4.8, genre: "Ficção Científica" },
  { id: 131, title: "Admirável Mundo Novo", author: "Aldous Huxley", narrator: "Diogo Serrano", cover: coverScifi, rating: 4.7, genre: "Ficção Científica" },
  { id: 132, title: "A Guerra dos Tronos", author: "George R. R. Martin", narrator: "Rafael Nogueira", cover: coverScifi, rating: 4.9, genre: "Ficção Científica" },
  { id: 301, title: "O Hobbit", author: "J.R.R. Tolkien", narrator: "Rafael Nogueira", cover: coverScifi, rating: 4.8, genre: "Ficção Científica" },
  { id: 302, title: "O Silmarillion", author: "J.R.R. Tolkien", narrator: "Rafael Nogueira", cover: coverScifi, rating: 4.4, genre: "Ficção Científica" },
  { id: 303, title: "Eu, Robô", author: "Isaac Asimov", narrator: "Rafael Nogueira", cover: coverScifi, rating: 4.7, genre: "Ficção Científica" },
  { id: 304, title: "A Revolução dos Bichos", author: "George Orwell", narrator: "Diogo Serrano", cover: coverScifi, rating: 4.7, genre: "Ficção Científica" },

  // Romance
  { id: 140, title: "Orgulho e Preconceito", author: "Jane Austen", narrator: "Helena Vasques", cover: coverRomance, rating: 4.8, genre: "Romance" },
  { id: 141, title: "Como Eu Era Antes de Você", author: "Jojo Moyes", narrator: "Helena Vasques", cover: coverRomance, rating: 4.7, genre: "Romance" },
  { id: 142, title: "É Assim que Acaba", author: "Colleen Hoover", narrator: "Helena Vasques", cover: coverRomance, rating: 4.6, genre: "Romance" },
  { id: 143, title: "Um Amor para Recordar", author: "Nicholas Sparks", narrator: "Helena Vasques", cover: coverRomance, rating: 4.5, genre: "Romance" },
  { id: 307, title: "Razão e Sensibilidade", author: "Jane Austen", narrator: "Helena Vasques", cover: coverRomance, rating: 4.6, genre: "Romance" },
  { id: 308, title: "Emma", author: "Jane Austen", narrator: "Helena Vasques", cover: coverRomance, rating: 4.5, genre: "Romance" },
  { id: 309, title: "Todas as Suas (Im)perfeições", author: "Colleen Hoover", narrator: "Helena Vasques", cover: coverRomance, rating: 4.5, genre: "Romance" },
  { id: 310, title: "Diário de uma Paixão", author: "Nicholas Sparks", narrator: "Helena Vasques", cover: coverRomance, rating: 4.6, genre: "Romance" },

  // Terror
  { id: 104, title: "It: A Coisa", author: "Stephen King", narrator: "Otávio Marques", cover: coverHorror, rating: 4.8, genre: "Terror" },
  { id: 105, title: "O Iluminado", author: "Stephen King", narrator: "Otávio Marques", cover: coverHorror, rating: 4.9, genre: "Terror" },
  { id: 144, title: "Drácula", author: "Bram Stoker", narrator: "Diogo Serrano", cover: coverHorror, rating: 4.6, genre: "Terror" },
  { id: 145, title: "O Exorcista", author: "William Peter Blatty", narrator: "Otávio Marques", cover: coverHorror, rating: 4.5, genre: "Terror" },
  { id: 305, title: "Carrie, a Estranha", author: "Stephen King", narrator: "Otávio Marques", cover: coverHorror, rating: 4.6, genre: "Terror" },
  { id: 306, title: "Misery", author: "Stephen King", narrator: "Otávio Marques", cover: coverHorror, rating: 4.7, genre: "Terror" },

  // Mistério
  { id: 1, title: "O massacre da família Hope", author: "Riley Sager", narrator: "Cid Moreira", cover: coverMystery, rating: 4.5, genre: "Mistério" },
  { id: 2, title: "A empregada", author: "Freida McFadden", narrator: "Camila Ferraz", cover: coverMystery, rating: 4.8, genre: "Mistério" },
  { id: 3, title: "Garota Exemplar", author: "Gillian Flynn", narrator: "Camila Ferraz", cover: coverMystery, rating: 4.6, genre: "Mistério" },
  { id: 106, title: "A Paciente Silenciosa", author: "Alex Michaelides", narrator: "Cid Moreira", cover: coverMystery, rating: 4.5, genre: "Mistério" },
  { id: 119, title: "O Código Da Vinci", author: "Dan Brown", narrator: "Cid Moreira", cover: coverMystery, rating: 4.4, genre: "Mistério" },
  { id: 120, title: "A Garota no Trem", author: "Paula Hawkins", narrator: "Camila Ferraz", cover: coverMystery, rating: 4.6, genre: "Mistério" },
  { id: 311, title: "Anjos e Demônios", author: "Dan Brown", narrator: "Cid Moreira", cover: coverMystery, rating: 4.5, genre: "Mistério" },
  { id: 312, title: "Inferno", author: "Dan Brown", narrator: "Cid Moreira", cover: coverMystery, rating: 4.3, genre: "Mistério" },
  { id: 313, title: "Objetos Cortantes", author: "Gillian Flynn", narrator: "Camila Ferraz", cover: coverMystery, rating: 4.4, genre: "Mistério" },
  { id: 314, title: "Escrito na Água", author: "Paula Hawkins", narrator: "Camila Ferraz", cover: coverMystery, rating: 4.2, genre: "Mistério" },

  // Negócios
  { id: 101, title: "A Psicologia Financeira", author: "Morgan Housel", narrator: "Roberto Rocha", cover: coverBusiness, rating: 4.8, genre: "Negócios" },
  { id: 108, title: "Pense de Novo", author: "Adam Grant", narrator: "Roberto Rocha", cover: coverBusiness, rating: 4.7, genre: "Negócios" },
  { id: 125, title: "Pai Rico, Pai Pobre", author: "Robert T. Kiyosaki", narrator: "Roberto Rocha", cover: coverBusiness, rating: 4.6, genre: "Negócios" },
  { id: 320, title: "Quadrante do Fluxo de Dinheiro", author: "Robert T. Kiyosaki", narrator: "Roberto Rocha", cover: coverBusiness, rating: 4.4, genre: "Negócios" },

  // Biografia
  { id: 103, title: "A Terra Prometida", author: "Barack Obama", narrator: "Túlio Bandeira", cover: coverBiography, rating: 4.7, genre: "Biografia" },
  { id: 111, title: "Minha História", author: "Michelle Obama", narrator: "Lívia Bonfim", cover: coverBiography, rating: 4.8, genre: "Biografia" },
  { id: 112, title: "Steve Jobs", author: "Walter Isaacson", narrator: "Túlio Bandeira", cover: coverBiography, rating: 4.7, genre: "Biografia" },
  { id: 113, title: "A Marca da Vitória", author: "Phil Knight", narrator: "Túlio Bandeira", cover: coverBiography, rating: 4.8, genre: "Biografia" },
  { id: 135, title: "Eu Sou Malala", author: "Malala Yousafzai", narrator: "Lívia Bonfim", cover: coverBiography, rating: 4.8, genre: "Biografia" },
  { id: 136, title: "O Diário de Anne Frank", author: "Anne Frank", narrator: "Lívia Bonfim", cover: coverBiography, rating: 4.9, genre: "Biografia" },
  { id: 137, title: "Em Busca de Sentido", author: "Viktor E. Frankl", narrator: "Lívia Bonfim", cover: coverBiography, rating: 4.8, genre: "Biografia" },
  { id: 315, title: "Einstein: Sua Vida, Seu Universo", author: "Walter Isaacson", narrator: "Túlio Bandeira", cover: coverBiography, rating: 4.7, genre: "Biografia" },
  { id: 316, title: "Leonardo da Vinci", author: "Walter Isaacson", narrator: "Túlio Bandeira", cover: coverBiography, rating: 4.6, genre: "Biografia" },
  { id: 317, title: "A Luz Que Há em Nós", author: "Michelle Obama", narrator: "Lívia Bonfim", cover: coverBiography, rating: 4.6, genre: "Biografia" },

  // Autoajuda
  { id: 4, title: "O clube das 5 da manhã", author: "Robin Sharma", narrator: "Tiago Abravanel", cover: coverSelfhelp, rating: 4.7, genre: "Autoajuda" },
  { id: 201, title: "A Sutil Arte de Ligar o F*da-se", author: "Mark Manson", narrator: "Tiago Abravanel", cover: coverSelfhelp, rating: 4.5, genre: "Autoajuda" },
  { id: 203, title: "O Alquimista", author: "Paulo Coelho", narrator: "Tiago Abravanel", cover: coverSelfhelp, rating: 4.7, genre: "Autoajuda" },
  { id: 318, title: "Tudo é F*da", author: "Mark Manson", narrator: "Tiago Abravanel", cover: coverSelfhelp, rating: 4.3, genre: "Autoajuda" },
  { id: 319, title: "Brida", author: "Paulo Coelho", narrator: "Tiago Abravanel", cover: coverSelfhelp, rating: 4.2, genre: "Autoajuda" },

  // Produtividade
  { id: 5, title: "Organize-se", author: "Ciara Conlon", narrator: "Maitê Cunha", cover: coverProductivity, rating: 4.3, genre: "Produtividade" },
  { id: 102, title: "Hábitos Atômicos", author: "James Clear", narrator: "Maitê Cunha", cover: coverProductivity, rating: 4.9, genre: "Produtividade" },
  { id: 107, title: "Essencialismo", author: "Greg McKeown", narrator: "Maitê Cunha", cover: coverProductivity, rating: 4.6, genre: "Produtividade" },
  { id: 124, title: "Os 7 Hábitos", author: "Stephen R. Covey", narrator: "Maitê Cunha", cover: coverProductivity, rating: 4.8, genre: "Produtividade" },
  { id: 321, title: "Sem Esforço", author: "Greg McKeown", narrator: "Maitê Cunha", cover: coverProductivity, rating: 4.5, genre: "Produtividade" },
];

/**
 * O catálogo que o app usa: o que foi curado à mão, com a capa real e a ficha
 * da Open Library por cima quando existirem.
 */
export const catalog: Book[] = catalogoCurado.map((livro) => ({
  ...livro,
  cover: capasPorId[livro.id] ?? livro.cover,
  ...(fichasImportadas[livro.id] ?? {}),
}));

/** Gêneros na ordem em que aparecem na grade da tela Descobrir. */
export const genres: { label: Genre; gradient: string }[] = [
  { label: "Ficção Científica", gradient: "from-indigo-600 to-blue-500" },
  { label: "Romance", gradient: "from-pink-600 to-rose-500" },
  { label: "Terror", gradient: "from-red-800 to-orange-700" },
  { label: "Mistério", gradient: "from-slate-700 to-slate-500" },
  { label: "Negócios", gradient: "from-amber-600 to-orange-500" },
  { label: "Biografia", gradient: "from-teal-600 to-emerald-500" },
  { label: "Autoajuda", gradient: "from-purple-700 to-violet-500" },
  { label: "Produtividade", gradient: "from-cyan-600 to-sky-500" },
];

/**
 * "Ficção Científica" → "ficcao-cientifica". Sem acentos, para caber numa URL.
 *
 * Mora aqui, e não em `people.ts`, porque `people.ts` importa deste arquivo —
 * o contrário criaria um ciclo entre os dois módulos.
 */
export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function genreSlug(genre: Genre): string {
  return slugify(genre);
}

export function findGenreBySlug(slug: string): Genre | undefined {
  return genres.find((genero) => genreSlug(genero.label) === slug)?.label;
}

/** O gradiente do gênero, usado na grade da Descobrir e no topo da Categoria. */
export function genreGradient(genre: Genre): string {
  return genres.find((genero) => genero.label === genre)?.gradient ?? "from-slate-700 to-slate-500";
}

/**
 * Duração estimada do audiolivro a partir do número de páginas.
 *
 * Um audiolivro roda perto de 9.000 palavras por hora e uma página tem umas 275
 * palavras — dá mais ou menos uma hora a cada 33 páginas. É **estimativa**, não
 * medição: quando houver arquivo de áudio de verdade, trocar pelo tempo real.
 * Ainda assim é melhor que os "5h 00m" fixos que todo livro mostrava antes.
 */
export function duracaoEstimada(pages?: number): string | undefined {
  if (!pages) return undefined;

  const totalDeMinutos = Math.round((pages / 33) * 60);
  const horas = Math.floor(totalDeMinutos / 60);
  const minutos = totalDeMinutos % 60;
  return `${horas}h ${String(minutos).padStart(2, "0")}min`;
}

/** Busca livros por id, mantendo a ordem pedida e ignorando ids inexistentes. */
export function getBooksByIds(ids: number[]): Book[] {
  return ids
    .map((id) => catalog.find((book) => book.id === id))
    .filter((book): book is Book => book !== undefined);
}

export function getBooksByGenre(genre: Genre): Book[] {
  return catalog.filter((book) => book.genre === genre);
}
