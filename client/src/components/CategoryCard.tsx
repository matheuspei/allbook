/**
 * Card de categoria/coleção no estilo Netflix/Storytel: um mosaico de capas
 * reais dos livros da lista, com o nome sobreposto num degradê escuro.
 *
 * Substituiu os blocos de gradiente colorido chapado (um "arco-íris" que dava
 * cara de template feito por IA). Aqui a cor vem das próprias capas do acervo —
 * o card mostra o que tem dentro, como as trilhas do Spotify.
 */
interface CategoryCardProps {
  /** O texto sobreposto — nome do gênero ou da coleção. */
  label: string;
  /** Capas para o mosaico; as 3 primeiras são usadas. */
  covers: string[];
  onClick: () => void;
  testId?: string;
}

export default function CategoryCard({ label, covers, onClick, testId }: CategoryCardProps) {
  // Até 3 fatias verticais. Sem nenhuma capa (lista vazia), o fundo neutro
  // impede que o card fique transparente.
  const tiles = covers.slice(0, 3);

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className="sobre-midia group relative h-28 w-full overflow-hidden rounded-xl bg-white/5 text-left ring-1 ring-white/10 transition-transform active:scale-[0.98]"
    >
      <div className="absolute inset-0 flex">
        {tiles.map((cover, i) => (
          <img
            key={i}
            src={cover}
            alt=""
            aria-hidden="true"
            style={{ width: `${100 / tiles.length}%` }}
            className="h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ))}
      </div>

      {/* Degradê para o nome ler bem por cima de qualquer capa — escuro nos dois
          temas (`veu-de-midia`), porque o nome é branco nos dois. */}
      <div className="veu-de-midia absolute inset-0" />

      <span className="absolute inset-x-0 bottom-0 p-3 font-display text-sm font-bold leading-tight text-white drop-shadow-md">
        {label}
      </span>
    </button>
  );
}
