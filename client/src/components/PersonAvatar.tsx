import { cn } from "@/lib/utils";

/**
 * Avatar de autor ou narrador.
 *
 * Usa a foto quando existe uma em `assets/images/people/`. Quando não existe —
 * que é o caso hoje —, desenha um avatar a partir do próprio nome: as iniciais
 * sobre um gradiente escolhido por um hash do nome. Como o hash é estável, a
 * mesma pessoa tem sempre a mesma cor, em qualquer tela do app; a cor vira
 * parte da identidade dela em vez de parecer sorteio.
 */

/**
 * Hash simples e determinístico. Não precisa ser criptográfico, só estável.
 * Exportado porque a tela de perfil tinge o fundo com a mesma cor do avatar.
 */
export function hueDoNome(nome: string): number {
  let hash = 0;
  for (let i = 0; i < nome.length; i++) {
    hash = (hash * 31 + nome.charCodeAt(i)) % 360;
  }
  return hash;
}

/** "J.R.R. Tolkien" → "JT". Primeira letra do primeiro e do último nome. */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

const TAMANHOS = {
  sm: { caixa: "h-10 w-10", texto: "text-xs" },
  md: { caixa: "h-14 w-14", texto: "text-base" },
  lg: { caixa: "h-24 w-24", texto: "text-2xl" },
  xl: { caixa: "h-28 w-28", texto: "text-3xl" },
} as const;

export type AvatarSize = keyof typeof TAMANHOS;

export default function PersonAvatar({
  name,
  photo,
  size = "md",
  className,
}: {
  name: string;
  photo?: string;
  size?: AvatarSize;
  className?: string;
}) {
  const { caixa, texto } = TAMANHOS[size];
  const hue = hueDoNome(name);

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full ring-2 ring-white/15 shadow-lg shadow-black/40",
        caixa,
        className
      )}
      data-testid={`avatar-${name}`}
    >
      {photo ? (
        <img src={photo} alt={name} className="h-full w-full object-cover" />
      ) : (
        <>
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(145deg, hsl(${hue} 65% 46%), hsl(${(hue + 45) % 360} 70% 28%))`,
            }}
          />
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
        </>
      )}
    </div>
  );
}
