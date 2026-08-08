import { useState } from "react";
import { Link, useParams } from "wouter";
import { Check, Plus, Users } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { avatarDeLeitor, findMember, type CommunityMember } from "@/lib/community";
import { isFollowing, toggleFollow } from "@/lib/following";
import { initialOf, readProfile } from "@/lib/profile";
import { meSegue, seguidoresDe, seguindoDe } from "@/lib/rede";

/**
 * **Quem segue a pessoa, e quem ela segue** (§4.94) — as duas listas que o
 * número do perfil abre.
 *
 * **Número que não abre nada é enfeite** (§4.59). Foi a régua que o Matheus
 * aplicou ao selo de pergunta (*"esse ícone precisa ser clicável"*), e ela vale
 * igual aqui: pôr "8 seguidores" no perfil da Juliana sem poder ver quem são
 * seria trocar um buraco por um adorno.
 *
 * **Você aparece na lista, e no topo.** Se você segue a pessoa, é você quem
 * abre a lista de seguidores dela — o mesmo raciocínio do "Você e mais 10
 * gostaram" do post. É o que faz o botão "Seguir" ter consequência visível.
 *
 * **Cada linha traz o botão de seguir.** Uma lista de nomes em que não se pode
 * fazer nada é um beco: quem abre "quem a Juliana segue" está procurando gente
 * para seguir, e mandá-la abrir cada perfil para isso é pedir seis toques onde
 * cabe um.
 */
export default function SeguidoresDaPessoa() {
  return <Lista modo="seguidores" />;
}

export function SeguindoDaPessoa() {
  return <Lista modo="seguindo" />;
}

function Lista({ modo }: { modo: "seguidores" | "seguindo" }) {
  const params = useParams<{ slug: string }>();
  const membro = findMember(params.slug ?? "");

  if (!membro) {
    return (
      <div className="min-h-screen bg-background pb-24 text-white">
        <PageHeader title="Leitor não encontrado" fallback="/community" />
      </div>
    );
  }

  const primeiroNome = membro.name.split(" ")[0];
  const gente = modo === "seguidores" ? seguidoresDe(membro.slug) : seguindoDe(membro.slug);
  /* **Onde você entra em cada lista.** Nos seguidores dela, se você a segue; em
     quem ela segue, se ela te segue (isso vem de `seguidores.ts`, a sua lista de
     verdade — não de sorteio). */
  const voceEstaNaLista = modo === "seguidores" ? isFollowing(membro.slug) : meSegue(membro.slug);

  return (
    <div className="min-h-screen bg-background pb-24 text-white" data-testid={`pagina-${modo}`}>
      <PageHeader
        title={modo === "seguidores" ? `Seguidores de ${primeiroNome}` : `${primeiroNome} segue`}
        fallback={`/user/${membro.slug}`}
      />

      <div className="px-5 pt-4">
        {gente.length === 0 && !voceEstaNaLista ? (
          <div className="py-10 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white/[0.06]">
              <Users className="h-6 w-6 text-white/25" />
            </div>
            <p className="mt-3 text-sm text-white/40">
              {modo === "seguidores"
                ? `Ninguém segue ${primeiroNome} ainda.`
                : `${primeiroNome} ainda não segue ninguém.`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {voceEstaNaLista && <VoceNaLista />}
            {gente.map((pessoa) => (
              <LinhaDeLeitor key={pessoa.slug} pessoa={pessoa} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Você, no topo da lista — leva ao seu perfil, e não tem botão de seguir. */
function VoceNaLista() {
  const perfil = readProfile();

  return (
    <Link
      href="/profile"
      className="flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/[0.06] p-3"
      data-testid="linha-voce"
    >
      {perfil.photo ? (
        <img src={perfil.photo} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/60 font-display text-sm font-bold">
          {initialOf(perfil.name)}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-sm font-bold">{perfil.name}</span>
        <span className="block text-[11.5px] text-primary">você</span>
      </span>
    </Link>
  );
}

function LinhaDeLeitor({ pessoa }: { pessoa: CommunityMember }) {
  const [seguindo, setSeguindo] = useState(() => isFollowing(pessoa.slug));

  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.04] p-3"
      data-testid={`linha-${pessoa.slug}`}
    >
      <Link href={`/user/${pessoa.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br ${pessoa.color} font-display text-sm font-bold`}
          {...avatarDeLeitor(pessoa.slug)}
        >
          {pessoa.name.charAt(0)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-sm font-bold">{pessoa.name}</span>
          <span className="block truncate text-[11.5px] text-white/40">{pessoa.bio}</span>
        </span>
      </Link>

      <button
        onClick={() => setSeguindo(toggleFollow(pessoa.slug))}
        className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[11.5px] font-semibold transition-colors ${
          seguindo
            ? "bg-white/[0.06] text-white/50 hover:bg-white/12 hover:text-white"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
        data-testid={`seguir-${pessoa.slug}`}
      >
        {seguindo ? (
          <>
            <Check className="h-3.5 w-3.5" strokeWidth={3} /> Seguindo
          </>
        ) : (
          <>
            <Plus className="h-3.5 w-3.5" strokeWidth={3} /> Seguir
          </>
        )}
      </button>
    </div>
  );
}
