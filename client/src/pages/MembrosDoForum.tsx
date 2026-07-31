import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";

import { BarraOrkut, Caixa, FotoOrkut, LinkOrkut, PaginaOrkut } from "@/components/forum/Orkut";
import { EU } from "@/lib/clubes";
import { findMember } from "@/lib/community";
import { forumNaTela, membrosDo, possoLer, souModerador } from "@/lib/forum";
import { GRUPOS_EVENT } from "@/lib/grupos";

/**
 * **Todos os membros de uma comunidade** (`/forum/:id/membros`).
 *
 * O Orkut tinha esta página, e ela existe aqui pelo mesmo motivo prático: a
 * página da comunidade mostra oito rostos e um "ver todos" — e *rótulo que nomeia
 * um conjunto e não leva até ele morre na tela* (§4.59). Numa comunidade de trinta
 * pessoas, os oito primeiros não respondem "quem está aqui dentro?".
 *
 * A ordem é a de lá: **dono, moderadores, depois o resto**.
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
      <PaginaOrkut testid="membros-missing">
        <BarraOrkut />
        <div className="p-2.5">
          <Caixa titulo="membros">
            <p className="text-[#666]">Esta comunidade não existe mais.</p>
            <p className="mt-2">
              <LinkOrkut href="/forum">« voltar para as comunidades</LinkOrkut>
            </p>
          </Caixa>
        </div>
      </PaginaOrkut>
    );
  }

  /* Comunidade privada esconde a lista junto com o conteúdo: saber quem está
     dentro é metade do que uma comunidade fechada guarda. */
  if (!possoLer(id)) {
    return (
      <PaginaOrkut testid="membros-privado">
        <BarraOrkut onde={grupo.nome} />
        <div className="p-2.5">
          <Caixa titulo="comunidade privada">
            <p className="text-[#666]">Só quem participa vê os membros desta comunidade.</p>
            <p className="mt-2">
              <LinkOrkut href={`/forum/${id}`}>« ver a comunidade</LinkOrkut>
            </p>
          </Caixa>
        </div>
      </PaginaOrkut>
    );
  }

  const membros = membrosDo(id);

  return (
    <PaginaOrkut testid="membros-do-forum">
      <BarraOrkut onde={`${grupo.nome} › membros`} />

      <div className="p-2.5" key={versao}>
        <p className="mb-1.5 text-[10px] text-[#666]">
          <LinkOrkut href={`/forum/${id}`}>{grupo.nome}</LinkOrkut>
          {" › membros"}
        </p>

        <Caixa
          titulo={`membros (${membros.length})`}
          testid="lista-completa"
          acao={
            souModerador(id) ? (
              <LinkOrkut href={`/forum/${id}/gerenciar`} testid="ir-gerenciar">
                gerenciar »
              </LinkOrkut>
            ) : undefined
          }
        >
          <div className="grid grid-cols-3 gap-2.5">
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
                    <FotoOrkut nome={nome} tamanho={68} />
                  </span>
                  <span className="mt-1 block truncate text-[10px] text-[#1a4fa0] hover:underline">
                    {nome}
                  </span>
                  {papel !== "membro" && (
                    <span className="block text-[9px] text-[#888]">
                      {papel === "dono" ? "dono" : "moderador"}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </Caixa>

        <p className="mt-2 text-center text-[10px]">
          <LinkOrkut href={`/forum/${id}`}>« voltar para a comunidade</LinkOrkut>
        </p>
      </div>
    </PaginaOrkut>
  );
}
