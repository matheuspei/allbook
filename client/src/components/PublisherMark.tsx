import { fundoDoNome } from "@/components/PersonAvatar";
import { cn } from "@/lib/utils";

/**
 * O selo de uma editora — o equivalente do `PersonAvatar` para quem publica.
 *
 * **Quadrado, e não redondo, de propósito.** A bolinha é a linguagem de pessoa
 * no app inteiro (leitor, autor, narrador); editora é marca, não gente. A forma
 * diferente diz isso antes de a pessoa ler o nome, e evita que a linha
 * "Publicado por" na tela do livro pareça mais um autor.
 *
 * A cor vem do mesmo hash de nome do avatar (`fundoDoNome`), então cada editora
 * tem sempre a mesma cor em qualquer tela — vira identidade em vez de sorteio.
 * Nenhuma editora tem logotipo de verdade aqui: usar a marca real de uma empresa
 * exigiria o arquivo dela, e inventar um seria pior.
 */

/** "Companhia das Letras" → "CL". Primeira letra da primeira e da última palavra. */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

const TAMANHOS = {
  sm: { caixa: "h-10 w-10 rounded-lg", texto: "text-xs" },
  md: { caixa: "h-14 w-14 rounded-xl", texto: "text-base" },
  lg: { caixa: "h-20 w-20 rounded-2xl", texto: "text-2xl" },
  xl: { caixa: "h-24 w-24 rounded-2xl", texto: "text-3xl" },
} as const;

export default function PublisherMark({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: keyof typeof TAMANHOS;
  className?: string;
}) {
  const { caixa, texto } = TAMANHOS[size];

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden ring-2 ring-white/15 shadow-lg shadow-black/40",
        caixa,
        className
      )}
      data-testid={`publisher-mark-${name}`}
    >
      <div className="absolute inset-0" style={{ background: fundoDoNome(name) }} />
      {/* Brilho no alto: dá volume e evita o aspecto de retângulo chapado. */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent" />
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 grid place-items-center font-display font-bold tracking-tight text-white",
          texto
        )}
        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.45)" }}
      >
        {iniciais(name)}
      </span>
    </div>
  );
}
