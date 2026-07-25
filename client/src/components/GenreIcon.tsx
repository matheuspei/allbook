import type { ReactNode } from "react";

import type { Genre } from "@/lib/books";

/**
 * Os ícones dos gêneros — desenhados para o AllBook, não pegos de biblioteca.
 *
 * **Por que existem (26/07, ver ROTEIRO 4.27).** A lista de gêneros da Início
 * passou por três versões no mesmo dia: barrinha colorida por gênero (caiu, era
 * o arco-íris de sempre), ícone pronto da `lucide-react` (caiu, o Matheus queria
 * *"ícones mais bonitos, mas bem elaborados, mais sofisticados"* — e apontou o de
 * Produtividade, uma lista de tarefas, como o mais genérico), e enfim estes.
 *
 * **A regra do conjunto, e é ela que dá o acabamento:** contorno fino **mais um
 * único elemento preenchido** em cada ícone. O planeta tem a cratera cheia, a
 * caveira tem os olhos, o gráfico tem a barra mais alta, a ampulheta tem a areia.
 * Biblioteca pronta é só contorno — o contraste entre linha e sólido é o que
 * separa ícone de prateleira de ícone desenhado, e foi o que ele escolheu ao ver
 * as três propostas lado a lado.
 *
 * **Um SVG só, com o miolo trocado.** O invólucro (viewBox, traço, pontas
 * arredondadas) é o mesmo para todos: é isso que faz os oito parecerem uma
 * família, e não oito desenhos avulsos.
 *
 * Como usar: `<GenreIcon genre="Terror" className="h-5 w-5 text-white/45" />`.
 * A cor vem do `text-*` de quem chama (`currentColor`), então o ícone acende
 * junto com o resto do item.
 */

/** O elemento preenchido de cada ícone — um por desenho, nunca dois. */
const cheio = { fill: "currentColor", stroke: "none" } as const;

const desenhos: Record<Genre, ReactNode> = {
  // Planeta com anel; a cratera é o sólido.
  "Ficção Científica": (
    <>
      <circle cx="12" cy="12" r="6.2" />
      <ellipse cx="12" cy="12" rx="10.6" ry="3.5" transform="rotate(-22 12 12)" />
      <circle cx="9.7" cy="10.2" r="1.5" {...cheio} />
    </>
  ),

  // Dois corações — o pequeno é o sólido.
  Romance: (
    <>
      <path d="M10 19.6S3.2 15.1 3.2 10.2A3.9 3.9 0 0 1 10 7.5a3.9 3.9 0 0 1 6.8 2.7c0 4.9-6.8 9.4-6.8 9.4Z" />
      <path
        d="M18.2 10.4s-3.2-2.1-3.2-4.4a1.85 1.85 0 0 1 3.2-1.2 1.85 1.85 0 0 1 3.2 1.2c0 2.3-3.2 4.4-3.2 4.4Z"
        {...cheio}
      />
    </>
  ),

  // Caveira; os olhos são o sólido (dois círculos, mas um só elemento visual).
  Terror: (
    <>
      <path d="M12 2.8c-4.3 0-7.4 3-7.4 6.9 0 2.2 1 3.7 2.1 4.7.5.4.8 1 .8 1.6v1.6a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2V16c0-.6.3-1.2.8-1.6 1.1-1 2.1-2.5 2.1-4.7 0-3.9-3.1-6.9-7.4-6.9Z" />
      <circle cx="9.3" cy="10.4" r="1.6" {...cheio} />
      <circle cx="14.7" cy="10.4" r="1.6" {...cheio} />
      <path d="M10.6 19.6v-2.1M13.4 19.6v-2.1" />
    </>
  ),

  // Chave antiga — a pista do detetive. O furo é o sólido.
  Mistério: (
    <>
      <circle cx="8.2" cy="8.2" r="4.4" />
      <circle cx="8.2" cy="8.2" r="1.5" {...cheio} />
      <path d="M11.3 11.3 20 20" />
      <path d="M17.4 20.1 19 18.5M14.8 17.5l1.6-1.6" />
    </>
  ),

  // Gráfico de barras; a mais alta é o sólido.
  Negócios: (
    <>
      <path d="M3.2 20.2h17.6" />
      <rect x="4.6" y="13.4" width="3.8" height="4.6" rx="1.1" />
      <rect x="10.1" y="9.2" width="3.8" height="8.8" rx="1.1" />
      <rect x="15.6" y="4.8" width="3.8" height="13.2" rx="1.1" {...cheio} />
    </>
  ),

  // Retrato em moldura — a vida de alguém. A cabeça é o sólido.
  Biografia: (
    <>
      <rect x="4.2" y="2.8" width="15.6" height="18.4" rx="2.6" />
      <circle cx="12" cy="10" r="2.7" {...cheio} />
      <path d="M7.6 17.8c.9-2.2 2.5-3.3 4.4-3.3s3.5 1.1 4.4 3.3" />
    </>
  ),

  // Broto crescendo; a folha maior é o sólido.
  Autoajuda: (
    <>
      <path d="M12 20.4v-8.2" />
      <path d="M12 12.4c0-3.4 2.4-6 5.9-6 0 3.4-2.4 6-5.9 6Z" {...cheio} />
      <path d="M12 16.2c0-2.7-2-4.8-4.9-4.8 0 2.7 2 4.8 4.9 4.8Z" />
      {/* Base curta de propósito: larga demais, o desenho vira taça em 18px. */}
      <path d="M9.7 20.4h4.6" />
    </>
  ),

  // Ampulheta no lugar da lista de tarefas; a areia acumulada é o sólido.
  Produtividade: (
    <>
      <path d="M6.6 3h10.8M6.6 21h10.8" />
      <path d="M8.2 3v3c0 1.3.6 2.5 1.7 3.2L12 10.7l2.1-1.5C15.2 8.5 15.8 7.3 15.8 6V3" />
      <path d="M8.2 21v-3c0-1.3.6-2.5 1.7-3.2L12 13.3l2.1 1.5c1.1.7 1.7 1.9 1.7 3.2v3" />
      <path d="M9.9 19.4c.5-1.4 1.2-2.1 2.1-2.1s1.6.7 2.1 2.1Z" {...cheio} />
    </>
  ),
};

export default function GenreIcon({
  genre,
  className = "",
  /** 1.4 é o traço que casa com o peso do texto da lista. */
  strokeWidth = 1.4,
}: {
  genre: Genre;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {desenhos[genre]}
    </svg>
  );
}
