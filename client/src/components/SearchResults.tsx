import { Search, Headphones } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMemo } from "react";

import { catalog, type Book } from "@/lib/books";
import { REQUEST_PROMISE } from "@/lib/requests";

/**
 * Resultados da busca no catálogo — componente único, usado pela tela de Busca
 * (`pages/Search.tsx`). Nasceu de dois `SearchResults` quase idênticos que viviam
 * dentro da Início e da Descobrir; agora é a fonte única (ver decisão da busca no
 * ROTEIRO). Recebe o texto já digitado e um jeito de limpar; quem monta o campo é
 * a tela que o usa.
 *
 * A busca é 100% no navegador, sobre o catálogo fixo, em duas etapas:
 * 1. **casamento direto** — título ou autor contendo o texto, já sem acento (é o
 *    que faz "en" trazer "O Senhor dos Anéis" e "habitos" trazer "Hábitos
 *    Atômicos");
 * 2. só quando a primeira não acha nada, **casamento aproximado palavra a
 *    palavra**, que perdoa erro de digitação de verdade.
 *
 * **Por que a etapa 2 deixou de ser o Fuse.js (25/07, ver ROTEIRO 4.18).** O Fuse
 * comparava a consulta com o campo inteiro e aceitava parecença vaga: "carro"
 * devolvia "Carrie, a Estranha", "flor" devolvia "Sem Esforço". O erro em si já
 * era ruim; o efeito colateral era pior — a busca quase nunca admitia que não
 * achou, e assim **a oferta de produzir a narração praticamente não aparecia**,
 * justamente a porta do diferencial do app.
 *
 * **Apertar o limiar do Fuse não resolvia**, e isso foi medido no catálogo real: o
 * limiar que matava "carro → Carrie" matava junto "tolkein → Tolkien", porque
 * acerto e falso positivo caíam na mesma faixa de pontuação. Tolerar erro continua
 * valendo — o que não valia era tolerar semelhança solta.
 */

function normalize(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Distância de edição de Damerau-Levenshtein: quantos toques separam duas
 * palavras. Conta troca de letras vizinhas ("tolkein" → "tolkien") como **um**
 * erro — é o deslize de digitação mais comum, e o Levenshtein puro o cobraria em
 * dobro.
 */
function distancia(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + custo);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[m][n];
}

/**
 * Quantos erros se perdoa numa palavra, pelo tamanho dela.
 *
 * Palavra curta não ganha desconto: com três letras, um erro já vira outra
 * palavra ("gato"/"gata"). Esta escala saiu de medição no catálogo real — é ela
 * que separa "tolkein → Tolkien" (aceito) de "carro → Carrie" (recusado).
 */
function tolerancia(tamanho: number): number {
  if (tamanho <= 3) return 0;
  if (tamanho <= 6) return 1;
  return 2;
}

/** As palavras de conteúdo de um texto — "o", "de", "da" ficam de fora. */
function palavrasDe(texto: string): string[] {
  return normalize(texto)
    .split(/[^a-z0-9]+/)
    .filter((palavra) => palavra.length >= 3);
}

/**
 * Casamento aproximado: **toda** palavra da consulta precisa achar uma parecida
 * no título ou no autor. Exigir todas, e não alguma, é o que impede "o nome do
 * vento" de casar com qualquer livro que tenha uma palavra parecida com "nome".
 */
function pareceCom(query: string, book: Book): boolean {
  const termos = palavrasDe(query);
  if (termos.length === 0) return false;

  const doLivro = [...palavrasDe(book.title), ...palavrasDe(book.author)];
  return termos.every((termo) =>
    doLivro.some((palavra) => distancia(termo, palavra) <= tolerancia(termo.length))
  );
}

export function ResultCard({ book }: { book: Book }) {
  const [, setLocation] = useLocation();

  return (
    <div
      className="group cursor-pointer"
      onClick={() => setLocation(`/book/${book.id}`)}
      data-testid={`card-search-${book.id}`}
    >
      <div className="relative rounded-lg overflow-hidden aspect-[3/4] mb-2 transition-transform duration-200 group-hover:scale-105">
        <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
      </div>
      <h3 className="text-xs font-medium text-white leading-tight line-clamp-2 group-hover:text-primary transition-colors">
        {book.title}
      </h3>
      <p className="text-[10px] text-white/50 mt-0.5 line-clamp-1">{book.author}</p>
    </div>
  );
}

export default function SearchResults({ query, onClear }: { query: string; onClear: () => void }) {
  const results = useMemo(() => {
    if (!query.trim()) return [];

    const q = normalize(query);

    const direct = catalog.filter(
      (book) => normalize(book.title).includes(q) || normalize(book.author).includes(q)
    );

    if (direct.length > 0) return direct;

    return catalog.filter((book) => pareceCom(query, book));
  }, [query]);

  return (
    <section className="px-4 py-4 space-y-4" data-testid="search-results">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-xl text-white tracking-tight">Resultados</h2>
        <span className="text-xs text-white/50">
          {results.length} {results.length === 1 ? "encontrado" : "encontrados"}
        </span>
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {results.map((book) => (
            <ResultCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        /*
          Busca sem resultado é o momento de maior intenção do app inteiro: a
          pessoa disse exatamente o que queria ouvir e o catálogo não tinha.
          Antes isto era um beco — "nenhum resultado" e um botão de limpar. Agora
          é a porta do diferencial: pedir a narração daquele título, que já vai
          preenchido para a tela de pedido. Ver ROTEIRO 4.17.
        */
        <div className="text-center py-14 space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/5">
            <Search className="w-6 h-6 text-white/30" />
          </div>

          <p className="text-white/50">Nenhum resultado para "{query}"</p>

          <div className="space-y-3 pt-1">
            {/* Afirma o que se sabe (não está no catálogo) e oferece com
                firmeza. A versão anterior começava com "talvez", que põe dúvida
                justo onde o app deveria soar seguro do que entrega. */}
            <p className="mx-auto max-w-[17rem] text-sm leading-relaxed text-white/60">
              Este título ainda não está no catálogo. O estúdio grava o livro inteiro e entrega{" "}
              {REQUEST_PROMISE}.
            </p>

            <Link
              href={`/request?titulo=${encodeURIComponent(query.trim())}`}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 h-11 font-bold text-black transition-colors hover:bg-primary/90"
              data-testid="button-request-narration"
            >
              <Headphones className="w-4 h-4" />
              Pedir a narração
            </Link>
          </div>

          <button onClick={onClear} className="text-white/40 text-sm hover:text-white/70 transition-colors" data-testid="button-clear-search">
            Limpar busca
          </button>
        </div>
      )}
    </section>
  );
}
