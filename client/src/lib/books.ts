import coverScifi from "@/assets/images/cover-scifi.png";
import coverSelfhelp from "@/assets/images/cover-selfhelp.png";
import coverRomance from "@/assets/images/cover-romance.png";
import coverMystery from "@/assets/images/cover-mystery.png";
import coverBusiness from "@/assets/images/cover-business.png";
import coverBiography from "@/assets/images/cover-biography.png";
import coverHorror from "@/assets/images/cover-horror.png";
import coverProductivity from "@/assets/images/cover-productivity.png";

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
  cover: string;
  rating: number;
  genre: Genre;
}

/**
 * Catálogo fixo do app. Enquanto não existe backend, esta é a fonte única
 * dos livros — Home e Descobrir leem daqui, para não duplicar dados.
 * Quando a API existir, trocar por chamadas com TanStack Query.
 */
export const catalog: Book[] = [
  // Ficção Científica
  { id: 7, title: "Duna", author: "Frank Herbert", cover: coverScifi, rating: 4.9, genre: "Ficção Científica" },
  { id: 8, title: "Fundação", author: "Isaac Asimov", cover: coverScifi, rating: 4.8, genre: "Ficção Científica" },
  { id: 109, title: "O Problema dos 3 Corpos", author: "Cixin Liu", cover: coverScifi, rating: 4.6, genre: "Ficção Científica" },
  { id: 129, title: "O Senhor dos Anéis", author: "J.R.R. Tolkien", cover: coverScifi, rating: 4.9, genre: "Ficção Científica" },
  { id: 130, title: "1984", author: "George Orwell", cover: coverScifi, rating: 4.8, genre: "Ficção Científica" },
  { id: 131, title: "Admirável Mundo Novo", author: "Aldous Huxley", cover: coverScifi, rating: 4.7, genre: "Ficção Científica" },
  { id: 132, title: "A Guerra dos Tronos", author: "George R. R. Martin", cover: coverScifi, rating: 4.9, genre: "Ficção Científica" },

  // Romance
  { id: 140, title: "Orgulho e Preconceito", author: "Jane Austen", cover: coverRomance, rating: 4.8, genre: "Romance" },
  { id: 141, title: "Como Eu Era Antes de Você", author: "Jojo Moyes", cover: coverRomance, rating: 4.7, genre: "Romance" },
  { id: 142, title: "É Assim que Acaba", author: "Colleen Hoover", cover: coverRomance, rating: 4.6, genre: "Romance" },
  { id: 143, title: "Um Amor para Recordar", author: "Nicholas Sparks", cover: coverRomance, rating: 4.5, genre: "Romance" },

  // Terror
  { id: 104, title: "It: A Coisa", author: "Stephen King", cover: coverHorror, rating: 4.8, genre: "Terror" },
  { id: 105, title: "O Iluminado", author: "Stephen King", cover: coverHorror, rating: 4.9, genre: "Terror" },
  { id: 144, title: "Drácula", author: "Bram Stoker", cover: coverHorror, rating: 4.6, genre: "Terror" },
  { id: 145, title: "O Exorcista", author: "William Peter Blatty", cover: coverHorror, rating: 4.5, genre: "Terror" },

  // Mistério
  { id: 1, title: "O massacre da família Hope", author: "Riley Sager", cover: coverMystery, rating: 4.5, genre: "Mistério" },
  { id: 2, title: "A empregada", author: "Freida McFadden", cover: coverMystery, rating: 4.8, genre: "Mistério" },
  { id: 3, title: "Garota Exemplar", author: "Gillian Flynn", cover: coverMystery, rating: 4.6, genre: "Mistério" },
  { id: 106, title: "A Paciente Silenciosa", author: "Alex Michaelides", cover: coverMystery, rating: 4.5, genre: "Mistério" },
  { id: 119, title: "O Código Da Vinci", author: "Dan Brown", cover: coverMystery, rating: 4.4, genre: "Mistério" },
  { id: 120, title: "A Garota no Trem", author: "Paula Hawkins", cover: coverMystery, rating: 4.6, genre: "Mistério" },

  // Negócios
  { id: 101, title: "A Psicologia Financeira", author: "Morgan Housel", cover: coverBusiness, rating: 4.8, genre: "Negócios" },
  { id: 108, title: "Pense de Novo", author: "Adam Grant", cover: coverBusiness, rating: 4.7, genre: "Negócios" },
  { id: 125, title: "Pai Rico, Pai Pobre", author: "Robert T. Kiyosaki", cover: coverBusiness, rating: 4.6, genre: "Negócios" },

  // Biografia
  { id: 103, title: "A Terra Prometida", author: "Barack Obama", cover: coverBiography, rating: 4.7, genre: "Biografia" },
  { id: 111, title: "Minha História", author: "Michelle Obama", cover: coverBiography, rating: 4.8, genre: "Biografia" },
  { id: 112, title: "Steve Jobs", author: "Walter Isaacson", cover: coverBiography, rating: 4.7, genre: "Biografia" },
  { id: 113, title: "A Marca da Vitória", author: "Phil Knight", cover: coverBiography, rating: 4.8, genre: "Biografia" },
  { id: 135, title: "Eu Sou Malala", author: "Malala Yousafzai", cover: coverBiography, rating: 4.8, genre: "Biografia" },
  { id: 136, title: "O Diário de Anne Frank", author: "Anne Frank", cover: coverBiography, rating: 4.9, genre: "Biografia" },
  { id: 137, title: "Em Busca de Sentido", author: "Viktor E. Frankl", cover: coverBiography, rating: 4.8, genre: "Biografia" },

  // Autoajuda
  { id: 4, title: "O clube das 5 da manhã", author: "Robin Sharma", cover: coverSelfhelp, rating: 4.7, genre: "Autoajuda" },
  { id: 201, title: "A Sutil Arte de Ligar o F*da-se", author: "Mark Manson", cover: coverSelfhelp, rating: 4.5, genre: "Autoajuda" },
  { id: 203, title: "O Alquimista", author: "Paulo Coelho", cover: coverSelfhelp, rating: 4.7, genre: "Autoajuda" },

  // Produtividade
  { id: 5, title: "Organize-se", author: "Ciara Conlon", cover: coverSelfhelp, rating: 4.3, genre: "Produtividade" },
  { id: 102, title: "Hábitos Atômicos", author: "James Clear", cover: coverProductivity, rating: 4.9, genre: "Produtividade" },
  { id: 107, title: "Essencialismo", author: "Greg McKeown", cover: coverProductivity, rating: 4.6, genre: "Produtividade" },
  { id: 124, title: "Os 7 Hábitos", author: "Stephen R. Covey", cover: coverProductivity, rating: 4.8, genre: "Produtividade" },
];

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

/** Busca livros por id, mantendo a ordem pedida e ignorando ids inexistentes. */
export function getBooksByIds(ids: number[]): Book[] {
  return ids
    .map((id) => catalog.find((book) => book.id === id))
    .filter((book): book is Book => book !== undefined);
}

export function getBooksByGenre(genre: Genre): Book[] {
  return catalog.filter((book) => book.genre === genre);
}
