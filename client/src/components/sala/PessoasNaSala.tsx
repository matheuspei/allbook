import { useState } from "react";
import { UserPlus, X } from "lucide-react";
import { avatarDeLeitor, findMember, type CommunityMember } from "@/lib/community";
import { EU } from "@/lib/clubes";
import { readFollowing } from "@/lib/following";
import { convidarParaSala, souAnfitriao, tirarDaSala, type SalaAoVivo } from "@/lib/salaAoVivo";
import { useToast } from "@/hooks/use-toast";

/**
 * **Quem está na sala — e os dois poderes que faltavam** (ROTEIRO §4.81).
 *
 * ---
 *
 * Achados na auditoria que o Matheus pediu. Ele tinha citado a moderação como
 * poder existente do anfitrião (*"ele já tem poder de banir as pessoas"*), e
 * dentro da sala não havia nenhum: o anfitrião só podia **encerrar tudo**, que é
 * punir a sala inteira pelo comportamento de um. E convidar só funcionava na
 * criação — sala que esvaziava não tinha como chamar reforço.
 *
 * **Remover da sala não é banir do clube.** Vale enquanto a sala durar; o
 * banimento do clube atravessa ciclos e mora em `Gerenciar`. Misturar os dois
 * daria ao dono da sala um poder sobre a turma que ele não tem.
 */
export default function PessoasNaSala({
  sala,
  onFechar,
}: {
  sala: SalaAoVivo;
  onFechar: () => void;
}) {
  const { toast } = useToast();
  const [escolhidos, setEscolhidos] = useState<string[]>([]);
  const euMando = souAnfitriao(sala);

  const podeChamar = readFollowing()
    .map((slug) => findMember(slug))
    .filter((pessoa): pessoa is CommunityMember => pessoa !== undefined)
    .filter(
      (pessoa) =>
        !sala.presentes.includes(pessoa.slug) && !(sala.convidados ?? []).includes(pessoa.slug),
    );

  function chamar() {
    convidarParaSala(sala.id, escolhidos);
    toast({
      title: escolhidos.length === 1 ? "Convite enviado" : `${escolhidos.length} convites enviados`,
      description: "Quem aceitar entra no ponto em que a turma estiver.",
    });
    setEscolhidos([]);
    onFechar();
  }

  return (
    <div
      className="fixed inset-0 z-[160] flex items-end bg-black/55 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onFechar}
      data-testid="folha-pessoas-na-sala"
    >
      <div
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-[28px] border-t border-white/10 bg-card p-5 pb-9 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto -mt-1 mb-4 h-1.5 w-12 rounded-full bg-white/15" />

        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold">Quem está na sala</h2>
            <p className="mt-0.5 text-xs text-white/40">
              {sala.presentes.length} {sala.presentes.length === 1 ? "pessoa" : "pessoas"}
              {(sala.convidados?.length ?? 0) > 0 && ` · ${sala.convidados!.length} chamadas`}
            </p>
          </div>
          <button
            onClick={onFechar}
            className="rounded-full p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-1.5">
          {sala.presentes.map((slug) => {
            const membro = findMember(slug);
            const nome = slug === EU ? "Você" : membro?.name ?? slug;
            const ehAnfitriao = slug === sala.anfitriao;

            return (
              <div
                key={slug}
                className="flex items-center gap-2.5 rounded-xl bg-white/[0.035] px-3 py-2.5"
                data-testid={`na-sala-${slug}`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-bold text-black ${
                    membro?.color ?? "from-primary to-primary/60"
                  }`}
                  {...avatarDeLeitor(slug === EU ? undefined : slug)}
                >
                  {nome.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">{nome}</span>
                  {ehAnfitriao && (
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary">
                      anfitrião
                    </span>
                  )}
                </span>

                {euMando && !ehAnfitriao && (
                  <button
                    onClick={() => {
                      tirarDaSala(sala.id, slug);
                      toast({
                        title: `${nome} saiu da sala`,
                        description: "Não volta enquanto esta sala durar.",
                      });
                    }}
                    className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white/35 transition-colors hover:bg-red-500/15 hover:text-red-300"
                    data-testid={`tirar-${slug}`}
                  >
                    Remover da sala
                  </button>
                )}
              </div>
            );
          })}

          {(sala.convidados ?? []).map((slug) => {
            const membro = findMember(slug);
            return (
              <div
                key={slug}
                className="flex items-center gap-2.5 rounded-xl bg-white/[0.02] px-3 py-2.5 opacity-50"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-bold text-black ${
                    membro?.color ?? "from-primary to-primary/60"
                  }`}
                  {...avatarDeLeitor(slug)}
                >
                  {(membro?.name ?? "?").charAt(0)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px]">{membro?.name ?? slug}</span>
                <span className="text-[10.5px] text-white/30">chamada…</span>
              </div>
            );
          })}
        </div>

        {/* Chamar mais gente **com a sala no ar** — faltava, e sala que esvazia
            não tinha como chamar reforço. */}
        {podeChamar.length > 0 && (
          <>
            <h3 className="mb-2.5 mt-6 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/35">
              <UserPlus className="h-3.5 w-3.5" />
              Chamar mais gente
            </h3>
            <div className="flex flex-wrap gap-2">
              {podeChamar.map((pessoa) => {
                const marcada = escolhidos.includes(pessoa.slug);
                return (
                  <button
                    key={pessoa.slug}
                    onClick={() =>
                      setEscolhidos((atual) =>
                        marcada
                          ? atual.filter((slug) => slug !== pessoa.slug)
                          : [...atual, pessoa.slug],
                      )
                    }
                    className={`flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 transition-colors ${
                      marcada
                        ? "bg-primary/15 ring-1 ring-inset ring-primary/45"
                        : "bg-white/[0.05] ring-1 ring-inset ring-white/10"
                    }`}
                    data-testid={`chamar-${pessoa.slug}`}
                  >
                    <span
                      className={`flex h-[22px] w-[22px] items-center justify-center rounded-full bg-gradient-to-br text-[9px] font-bold text-black ${pessoa.color}`}
                      {...avatarDeLeitor(pessoa.slug)}
                    >
                      {pessoa.name.charAt(0)}
                    </span>
                    <span className="text-[12px] font-medium">{pessoa.name}</span>
                  </button>
                );
              })}
            </div>

            {escolhidos.length > 0 && (
              <button
                onClick={chamar}
                className="mt-4 w-full rounded-xl bg-primary py-3 font-display text-[13.5px] font-bold text-primary-foreground"
                data-testid="button-chamar-para-sala"
              >
                Chamar {escolhidos.length}{" "}
                {escolhidos.length === 1 ? "pessoa" : "pessoas"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
