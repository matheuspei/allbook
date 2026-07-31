import { Link, useParams } from "wouter";
import { Lock } from "lucide-react";

import Topicos from "@/components/forum/TopicosDoForum";
import { Bloco, LinkDoForum, PaginaDoForum } from "@/components/forum/Pecas";
import { forumNaTela, possoLer } from "@/lib/forum";

/**
 * **Todos os tópicos de uma comunidade** (`/forum/:id/topicos`).
 *
 * Pedido do Matheus em 31/07: *"deveríamos ter uma página onde abríssemos todos
 * os tópicos, e hoje não tem isso… falta criar páginas"*. As enquetes e os
 * eventos já tinham a sua (§4.78); o tópico, que é o conteúdo **principal** de
 * uma comunidade, não tinha — a tabela inteira ficava solta na página, e não
 * havia para onde ir ver os antigos.
 *
 * Mesma casca das outras duas de propósito: quem aprendeu a navegar numa
 * aprendeu nas três.
 */
export default function TopicosDaComunidade() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  const grupo = forumNaTela(id);

  if (!grupo) {
    return (
      <PaginaDoForum titulo="Tópicos" voltarPara="/forum" testid="topicos-missing">
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
      <PaginaDoForum titulo={grupo.nome} voltarPara={`/forum/${id}`} testid="topicos-privados">
        <div className="px-5 pt-4">
          <Bloco titulo="Comunidade privada">
            <p className="flex items-start gap-2.5 text-[13px] leading-relaxed text-white/55">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Só quem participa desta comunidade vê os tópicos dela.
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
    <PaginaDoForum titulo={grupo.nome} voltarPara={`/forum/${id}`} testid="topicos-page">
      <div className="px-5 pt-4">
        {/* A trilha do Orkut: comunidade › seção. */}
        <p className="mb-2 text-[11px] text-white/35">
          <Link href={`/forum/${id}`} className="text-primary">
            {grupo.nome}
          </Link>
          {" › "}
          <span>Tópicos</span>
        </p>

        <Topicos grupoId={id} modo="todos" />

        <p className="mt-3 text-center">
          <LinkDoForum href={`/forum/${id}`}>« voltar para a comunidade</LinkDoForum>
        </p>
      </div>
    </PaginaDoForum>
  );
}
