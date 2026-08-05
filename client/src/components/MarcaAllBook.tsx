/**
 * A marca do AllBook — o símbolo e o nome.
 *
 * **Escolhida por ele em 05/08**, na folha `_logo-A.html`, entre seis desenhos
 * (estante-equalizador, o "A" feito de livro aberto, livro com play, esta,
 * livro que transmite, marcador-onda).
 *
 * **O desenho: a página que vira som.** A página da esquerda é sólida; onde
 * estaria a da direita há quatro linhas que encurtam e desbotam. Aquelas linhas
 * são ao mesmo tempo **texto e onda sonora** — a ambiguidade é o ponto, porque é
 * literalmente o que o AllBook faz: o livro que só existe escrito vira voz. Foi
 * por isso que ele preferiu esta às outras cinco; as demais dizem "audiolivro",
 * só esta diz *o que este app tem de diferente*.
 *
 * **O nome, e por que ele inverteu.** Até 05/08 o topo trazia "**All**" em
 * laranja e "Book" em branco. Ele escolheu o contrário — "All" branco, "**Book**"
 * laranja. Faz sentido: o laranja passa a cair sobre a palavra que o símbolo
 * ilustra, e "All" deixa de competir com ele.
 *
 * **Por que não é imagem.** Tentamos gerar a logo em IA de imagem antes disto e
 * o que voltou foram cenários de biblioteca com uma marca carimbada em cima —
 * e, mesmo se tivesse acertado, seria PNG. Marca precisa ser **vetor**: estica
 * sem borrar, troca de cor por CSS e encolhe até 16 px sem virar borrão. Está
 * desenhada aqui, em código, pelo mesmo motivo dos `GenreIcon`.
 *
 * **A cor vem de quem chama** (`currentColor`), como nos ícones de gênero. O
 * símbolo sozinho é `<SimboloAllBook />`; o conjunto símbolo + nome é o padrão.
 *
 * O irmão deste arquivo é `client/public/favicon.svg` — o mesmo desenho, em
 * laranja sobre quadrado escuro (o traje que ele escolheu para o ícone). **Mexeu
 * num, mexa no outro.**
 */

/** As opacidades das quatro linhas — a página se desfazendo à direita.
 *  Não descer abaixo de `.34`: a última linha some no tamanho de ícone. */
const LINHAS = [
  { y: 15, largura: 24, opacidade: 1 },
  { y: 25, largura: 17, opacidade: 0.74 },
  { y: 35, largura: 22, opacidade: 0.52 },
  { y: 45, largura: 13, opacidade: 0.34 },
];

/** Só o símbolo, sem o nome. Para o ícone da aba, avatares e lugares apertados. */
export function SimboloAllBook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="currentColor" aria-hidden="true">
      {/* A página da esquerda, sólida — a curva de dentro é a lombada. */}
      <path d="M29 16 C22 11 14 10 7 12 L7 48 C14 46 22 47 29 52 Z" />
      {LINHAS.map((linha) => (
        <rect
          key={linha.y}
          x="35"
          y={linha.y}
          width={linha.largura}
          height="5.4"
          rx="2.7"
          opacity={linha.opacidade}
        />
      ))}
    </svg>
  );
}

/**
 * A marca inteira: símbolo + "AllBook".
 *
 * `compacta` deixa só o símbolo — serve para telas estreitas, se um dia o topo
 * precisar ceder espaço.
 */
export default function MarcaAllBook({
  className,
  compacta = false,
}: {
  className?: string;
  compacta?: boolean;
}) {
  return (
    <span className={`flex items-center gap-2 ${className ?? ""}`}>
      <SimboloAllBook className="h-[22px] w-[22px] shrink-0 text-primary" />
      {!compacta && (
        <span className="font-display text-xl font-bold tracking-tight">
          {/* "All" branco, "Book" laranja — a escolha dele de 05/08 (era o contrário). */}
          <span className="text-foreground">All</span>
          <span className="text-primary">Book</span>
        </span>
      )}
    </span>
  );
}
