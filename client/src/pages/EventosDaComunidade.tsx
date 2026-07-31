import { Link, useParams } from "wouter";
import { Lock } from "lucide-react";

import { Eventos } from "@/components/forum/ConteudoDaComunidade";
import { Bloco, LinkDoForum, PaginaDoForum } from "@/components/forum/Pecas";
import { forumNaTela, possoLer } from "@/lib/forum";

/**
 * **Todos os eventos de uma comunidade** (`/forum/:id/eventos`).
 *
 * A mesma régua das enquetes (§4.80): a página da comunidade mostra **os dois
 * próximos** por inteiro, o resto em linha, e a lista completa mora aqui —
 * paginada de 10 em 10, com os próximos primeiro.
 */
export default function EventosDaComunidade() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  const grupo = forumNaTela(id);

  if (!grupo) {
    return (
      <PaginaDoForum titulo="Eventos" voltarPara="/forum" testid="eventos-missing">
        <div className="px-5 pt-4">
          <Bloco titulo="Comunidade">
            <p className="text-[13px] text-white/55">Esta comunidade não existe mais.</p>
            <div className="mt-3">
              <LinkDoForum href="/forum">« todas as comunidades</LinkDoForum>
            </div>
          </Bloco>
        </div>
      </PaginaDoForum>
    );
  }

  if (!possoLer(id)) {
    return (
      <PaginaDoForum titulo={grupo.nome} voltarPara={`/forum/${id}`} testid="eventos-privados">
        <div className="px-5 pt-4">
          <Bloco titulo="Comunidade privada">
            <p className="flex items-start gap-2.5 text-[13px] leading-relaxed text-white/55">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Só quem participa desta comunidade vê os eventos dela.
            </p>
            <div className="mt-3">
              <LinkDoForum href={`/forum/${id}`}>« ver a comunidade</LinkDoForum>
            </div>
          </Bloco>
        </div>
      </PaginaDoForum>
    );
  }

  return (
    <PaginaDoForum titulo={grupo.nome} voltarPara={`/forum/${id}`} testid="eventos-page">
      <div className="px-5 pt-4">
        <p className="mb-2 text-[11px] text-white/35">
          <Link href={`/forum/${id}`} className="text-primary">
            {grupo.nome}
          </Link>
          {" › "}
          <span>Eventos</span>
        </p>

        <Eventos grupoId={id} modo="todas" />

        <p className="mt-3 text-center">
          <LinkDoForum href={`/forum/${id}`}>« voltar para a comunidade</LinkDoForum>
        </p>
      </div>
    </PaginaDoForum>
  );
}
