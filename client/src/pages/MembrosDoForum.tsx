import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { Lock } from "lucide-react";

import { AvatarDoForum, Bloco, LinkDoForum, PaginaDoForum } from "@/components/forum/Pecas";
import { EU } from "@/lib/clubes";
import { findMember } from "@/lib/community";
import { forumNaTela, membrosDo, possoLer, souModerador } from "@/lib/forum";
import { GRUPOS_EVENT } from "@/lib/grupos";

/**
 * **Todos os membros de uma comunidade** (`/forum/:id/membros`).
 *
 * Existe pelo mesmo motivo de sempre: a página da comunidade mostra dez rostos e
 * um "ver todos" — e *rótulo que nomeia um conjunto e não leva até ele morre na
 * tela* (§4.59). A ordem é dono → moderadores → resto.
 */
export default function MembrosDoForum() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    const atualizar = () => setVersao((n) => n + 1);
    window.addEventListener(GRUPOS_EVENT, atualizar);
    return () => window.removeEventListener(GRUPOS_EVENT, atualizar);
  }, []);

  const grupo = forumNaTela(id);

  if (!grupo) {
    return (
      <PaginaDoForum titulo="Membros" voltarPara="/forum" testid="membros-missing">
        <div className="px-5 pt-4">
          <Bloco>
            <p className="text-[13px] text-white/55">Esta comunidade não existe mais.</p>
            <div className="mt-3">
              <LinkDoForum href="/forum">Ver todas as comunidades</LinkDoForum>
            </div>
          </Bloco>
        </div>
      </PaginaDoForum>
    );
  }

  if (!possoLer(id)) {
    return (
      <PaginaDoForum titulo={grupo.nome} voltarPara={`/forum/${id}`} testid="membros-privado">
        <div className="px-5 pt-4">
          <Bloco>
            <p className="flex items-start gap-2.5 text-[13px] leading-relaxed text-white/55">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Só quem participa vê os membros desta comunidade.
            </p>
          </Bloco>
        </div>
      </PaginaDoForum>
    );
  }

  const membros = membrosDo(id);

  return (
    <PaginaDoForum
      titulo={grupo.nome}
      voltarPara={`/forum/${id}`}
      testid="membros-do-forum"
      acao={
        souModerador(id) ? (
          <LinkDoForum href={`/forum/${id}/gerenciar`} testid="ir-gerenciar">
            Gerenciar
          </LinkDoForum>
        ) : undefined
      }
    >
      <div className="px-5 pt-4" key={versao}>
        {/* **Grade de três colunas**, como na página de membros do Orkut — e não
            a lista vertical que eu tinha posto na troca de pele (§4.77). */}
        <Bloco titulo={`Membros (${membros.length})`} testid="lista-completa">
          <div className="grid grid-cols-3 gap-3">
            {membros.map(({ slug, papel }) => {
              const membro = slug === EU ? undefined : findMember(slug);
              const nome = slug === EU ? "Você" : (membro?.name ?? "Alguém");
              return (
                <Link
                  key={slug}
                  href={slug === EU ? "/profile" : `/user/${slug}`}
                  className="text-center"
                  data-testid={`membro-${slug}`}
                >
                  <span className="mx-auto block w-[68px]">
                    <AvatarDoForum nome={nome} slug={slug} cor={membro?.color} tamanho={68} />
                  </span>
                  <span className="mt-1.5 block truncate text-[11px] text-white/70">{nome}</span>
                  {papel !== "membro" && (
                    <span className="block text-[9px] font-semibold uppercase tracking-wide text-primary/80">
                      {papel === "dono" ? "dono" : "modera"}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </Bloco>

      </div>
    </PaginaDoForum>
  );
}
