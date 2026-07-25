import {
  BookUser,
  Briefcase,
  Fingerprint,
  Ghost,
  Heart,
  ListChecks,
  Rocket,
  Sprout,
  type LucideIcon,
} from "lucide-react";

import type { Genre } from "./books";

/**
 * Um ícone para cada gênero — o sinal visual que substituiu a cor.
 *
 * **Por que existe (26/07).** A lista de gêneros da Início nasceu com uma
 * barrinha no gradiente de cada gênero: oito cores diferentes numa lista só.
 * Nas palavras do Matheus: *"quando você coloca uma coisa colorida, talvez cai
 * um pouco no padrão… a gente já tava brigando sobre isso"* — é a mesma queixa
 * que já tinha derrubado os cards de gradiente chapado (ver ROTEIRO, "Estilo:
 * evitar a cara de IA"). Ícone monocromático diz o mesmo — *que assunto é este*
 * — sem o arco-íris.
 *
 * **Uma cor só, a da marca.** Os ícones ficam em cinza claro e só acendem em
 * laranja no toque. Oito cores viram enfeite; uma cor vira identidade.
 *
 * **Como foram escolhidos:** cada um é o objeto mais direto do gênero, não uma
 * metáfora. Impressão digital para Mistério (a pista do detetive), broto para
 * Autoajuda (crescer), livro-com-pessoa para Biografia (a vida de alguém).
 * Evitamos de propósito a lupa (é o ícone da busca no menu) e a pessoa sozinha
 * (é o ícone do perfil) — ícone repetido em dois sentidos confunde.
 *
 * Mora num arquivo próprio, e não em `books.ts`, porque lá são **dados** do
 * catálogo; ícone é aparência, e outras telas (a página do gênero, a Descobrir)
 * podem querer o mesmo mapa depois.
 */
export const genreIcons: Record<Genre, LucideIcon> = {
  "Ficção Científica": Rocket,
  Romance: Heart,
  Terror: Ghost,
  Mistério: Fingerprint,
  Negócios: Briefcase,
  Biografia: BookUser,
  Autoajuda: Sprout,
  Produtividade: ListChecks,
};
