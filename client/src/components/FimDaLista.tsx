/**
 * O fim de verdade das telas de vitrine (§4.104).
 *
 * A Início e a Busca terminavam num vão morto de ~170px: o `pb-24` delas somava
 * com o `pb-20` que o App já dá para a barra de baixo. O padding duplo saiu e
 * entrou este fecho discreto — rolagem que acaba em marca, não em vazio.
 */
export default function FimDaLista() {
  return (
    <footer
      className="flex flex-col items-center gap-1 pt-10 pb-4"
      data-testid="fim-da-lista"
    >
      <span className="font-display font-extrabold text-sm tracking-tight text-white/20">
        <span className="text-primary/30">All</span>Book
      </span>
      <span className="text-[11px] text-white/25">Você chegou ao fim.</span>
    </footer>
  );
}
