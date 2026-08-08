import { Link } from "wouter";
import { ChevronRight, type LucideIcon } from "lucide-react";

import { Switch } from "@/components/ui/switch";

/**
 * **As peças de uma lista de ajustes** — título de grupo, moldura, porta e
 * interruptor.
 *
 * Nasceram dentro do `AjustesDoPerfil.tsx` (§4.105) e saíram para cá quando a
 * lista deixou de ser uma só: a seção "Quando me avisar" virou a tela
 * `/avisos`, e as duas listas precisam desenhar igual. **Uma peça, dois donos**
 * — o mesmo motivo que fez os ajustes do perfil virarem uma peça compartilhada
 * em vez de dois blocos copiados.
 *
 * Aqui não há regra de produto: é só o desenho. Quem decide **o que** entra em
 * cada lista é quem a monta.
 */

/** O rótulo de um grupo de ajustes — o degrau que quebra a lista longa. */
export function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="px-1 pb-2 pt-5 text-[10.5px] font-semibold uppercase tracking-wider text-white/35">
      {children}
    </h3>
  );
}

/** A moldura dos interruptores — um grupo por assunto. */
export function Cartao({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3.5">{children}</div>
  );
}

/**
 * O que se **escreve** abre página (regra da §4.95): foto, bio e recomendação
 * são formulários, e formulário quer tela.
 *
 * ⚠️ A porta **não fecha a folha** ao navegar — conserto de 04/08. Fechava, e
 * fechar desfaz a entrada `?editar` do histórico: quem tocava em "voltar" na
 * tela seguinte caía no perfil com a folha morta. Navegar já desmonta a folha
 * sozinho; a entrada fica no histórico, e o voltar devolve a pessoa para ela.
 */
export function Porta({
  icone: Icone,
  titulo,
  apoio,
  href,
  testid,
}: {
  icone: LucideIcon;
  titulo: string;
  apoio: string;
  href: string;
  testid: string;
}) {
  return (
    <Link
      href={href}
      className="mb-2 flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-3 transition-colors hover:bg-white/[0.07]"
      data-testid={testid}
    >
      <Icone className="h-[17px] w-[17px] shrink-0 text-primary" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold">{titulo}</span>
        <span className="mt-0.5 block truncate text-[10.5px] text-white/35">{apoio}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-white/25" />
    </Link>
  );
}

/** O que **liga e desliga** resolve no lugar, sem tirar a pessoa da tela. */
export function Interruptor({
  icone: Icone,
  titulo,
  apoio,
  ligado,
  onMudar,
  ultimo,
  testid,
}: {
  icone: LucideIcon;
  titulo: string;
  apoio: string;
  ligado: boolean;
  onMudar: (ligado: boolean) => void;
  ultimo?: boolean;
  testid: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 py-3 ${ultimo ? "" : "border-b border-white/[0.06]"}`}
    >
      <Icone className="h-[17px] w-[17px] shrink-0 text-white/45" />
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold leading-tight">{titulo}</span>
        <span className="mt-0.5 block text-[10.5px] leading-snug text-white/35">{apoio}</span>
      </span>
      <Switch checked={ligado} onCheckedChange={onMudar} aria-label={titulo} data-testid={testid} />
    </div>
  );
}
