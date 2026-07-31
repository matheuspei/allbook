import { Link, useParams } from "wouter";
import { Lock } from "lucide-react";

import { Enquetes } from "@/components/forum/ConteudoDaComunidade";
import { Bloco, LinkDoForum, PaginaDoForum } from "@/components/forum/Pecas";
import { forumNaTela, possoLer } from "@/lib/forum";

/**
 * **Todas as enquetes de uma comunidade** (`/forum/:id/enquetes`).
 *
 * Nasceu da pergunta do Matheus em 31/07: *"se você for criando muita enquete,
 * a página fica muito longa. Digamos que você tenha 15 enquetes — vai empilhar
 * uma em cima da outra? Seria legal a enquete mais falada, ou o moderador
 * escolher qual aparece na página principal, e uma página linkando todas."*
 *
 * É o que o Orkut fazia: **resumo na comunidade, lista completa numa página à
 * parte**. Aqui elas continuam votáveis — quem veio ver todas veio para votar
 * em alguma —, com paginação de 10 em 10.
 */
export default function EnquetesDaComunidade() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  const grupo = forumNaTela(id);

  if (!grupo) {
    return (
      <PaginaDoForum titulo="Enquetes" voltarPara="/forum" testid="enquetes-missing">
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
      <PaginaDoForum titulo={grupo.nome} voltarPara={`/forum/${id}`} testid="enquetes-privadas">
        <div className="px-5 pt-4">
          <Bloco titulo="Comunidade privada">
            <p className="flex items-start gap-2.5 text-[13px] leading-relaxed text-white/55">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Só quem participa desta comunidade vê as enquetes dela.
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
    <PaginaDoForum titulo={grupo.nome} voltarPara={`/forum/${id}`} testid="enquetes-page">
      <div className="px-5 pt-4">
        {/* A trilha do Orkut: comunidade › seção. */}
        <p className="mb-2 text-[11px] text-white/35">
          <Link href={`/forum/${id}`} className="text-primary">
            {grupo.nome}
          </Link>
          {" › "}
          <span>Enquetes</span>
        </p>

        <Enquetes grupoId={id} modo="todas" />

        <p className="mt-3 text-center">
          <LinkDoForum href={`/forum/${id}`}>« voltar para a comunidade</LinkDoForum>
        </p>
      </div>
    </PaginaDoForum>
  );
}
