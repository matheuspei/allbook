import { useEffect, useState } from "react";
import { Link } from "wouter";

import { Bloco, BotaoDoForum, CAMPO, LinkDoForum } from "@/components/forum/Pecas";
import { useToast } from "@/hooks/use-toast";
import { possoCriar, souModerador } from "@/lib/forum";
import {
  GRUPOS_EVENT,
  MAX_TITULO,
  alternarFixado,
  alternarTopicoEscondido,
  apagarMeuTopico,
  criarTopico,
  topicosDa,
  type TopicoNaTela,
} from "@/lib/grupos";

/** Quantos tópicos a página da comunidade mostra antes do "ver todos". */
const RESUMO = 5;

/** Quantos por página em `/forum/:id/topicos`. */
const POR_PAGINA = 15;

/**
 * **Os tópicos de uma comunidade** — resumo na página dela, lista completa em
 * `/forum/:id/topicos` (ROTEIRO §4.83).
 *
 * ---
 *
 * **Por que passou a existir.** O Matheus, em 31/07: *"esses tópicos aqui tá
 * muito ruim, tanto os tópicos como as enquetes… deveríamos ter uma página onde
 * abríssemos todos os tópicos, e hoje não tem isso"*.
 *
 * Ele está certo, e o defeito era o **oposto** do que a §4.78 corrigiu nas
 * enquetes: enquete ganhou destaque + página com todas, e o tópico ficou com a
 * **tabela inteira solta na página da comunidade**. Vinte tópicos viravam vinte
 * linhas, empurrando enquetes, eventos e membros para baixo — e sem nenhum lugar
 * para "ver os antigos".
 *
 * **É o mesmo desenho do Orkut, e o mesmo que as enquetes já usavam:** resumo em
 * cima, lista completa à parte. Nada de conteúdo novo — só um lugar para ele.
 */
export default function Topicos({
  grupoId,
  modo = "resumo",
}: {
  grupoId: string;
  modo?: "resumo" | "todos";
}) {
  const { toast } = useToast();
  const [criando, setCriando] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [pagina, setPagina] = useState(0);
  const [topicos, setTopicos] = useState<TopicoNaTela[]>(() => topicosDa(grupoId));

  useEffect(() => {
    const atualizar = () => setTopicos(topicosDa(grupoId));
    atualizar();
    window.addEventListener(GRUPOS_EVENT, atualizar);
    return () => window.removeEventListener(GRUPOS_EVENT, atualizar);
  }, [grupoId]);

  const dentro = possoCriar(grupoId, "topicos");
  const criar = dentro ? (
    <LinkDoForum onClick={() => setCriando((v) => !v)} testid="grupo-create-topic">
      criar tópico »
    </LinkDoForum>
  ) : undefined;

  const paginas = Math.max(1, Math.ceil(topicos.length / POR_PAGINA));
  const atual = Math.min(pagina, paginas - 1);

  const visiveis =
    modo === "todos"
      ? topicos.slice(atual * POR_PAGINA, atual * POR_PAGINA + POR_PAGINA)
      : topicos.slice(0, RESUMO);
  const escondidos = modo === "resumo" ? topicos.length - visiveis.length : 0;

  return (
    <Bloco
      titulo={modo === "todos" ? "Todos os tópicos" : "Fóruns"}
      testid={modo === "todos" ? "todos-os-topicos" : "grupo-topicos"}
      acao={criar}
    >
      {criando && (
        <div
          className="mb-3 rounded-xl border border-white/10 bg-white/[0.04] p-2.5"
          data-testid="grupo-composer"
        >
          <p className="mb-1 text-[10.5px] text-white/40">assunto do tópico:</p>
          <input
            value={titulo}
            onChange={(evento) => setTitulo(evento.target.value.slice(0, MAX_TITULO))}
            autoFocus
            className={CAMPO}
            data-testid="grupo-topic-title"
          />
          <div className="mt-2 flex items-center gap-2">
            <BotaoDoForum
              primario
              disabled={titulo.trim().length === 0}
              onClick={() => {
                if (criarTopico(grupoId, titulo)) {
                  setTitulo("");
                  setCriando(false);
                  toast({ title: "Tópico criado" });
                }
              }}
              testid="grupo-topic-publish"
            >
              Criar tópico
            </BotaoDoForum>
            <BotaoDoForum onClick={() => setCriando(false)}>Cancelar</BotaoDoForum>
          </div>
        </div>
      )}

      {topicos.length === 0 ? (
        <p className="text-[13px] text-white/40">Nenhum tópico ainda.</p>
      ) : (
        /* **Tabela com a coluna de mensagens**, como no fórum de lá: o número à
           direita é o que diz onde a conversa está acontecendo. */
        <table className="w-full border-collapse" data-testid="tabela-de-topicos">
          <thead>
            <tr className="border-b border-white/[0.08] text-left">
              <th className="pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/35">
                tópico
              </th>
              <th className="pb-1.5 pl-2 text-right text-[10px] font-semibold uppercase tracking-wider text-white/35">
                msgs
              </th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((topico) => (
              <tr
                key={topico.id}
                className="border-b border-white/[0.05] align-top last:border-0"
                data-testid={`topico-${topico.id}`}
              >
                <td className="py-2 pr-2">
                  <Link
                    href={`/forum/${grupoId}/topico/${topico.id}`}
                    className="text-[13.5px] font-semibold leading-snug text-white hover:text-primary"
                  >
                    {topico.fixado && <span className="mr-1">📌</span>}
                    {topico.titulo}
                  </Link>
                  <span className="mt-0.5 block text-[11px] text-white/35">
                    por {topico.meu ? "Você" : (topico.autor?.name ?? "Alguém")} ·{" "}
                    {new Date(topico.ultimaAtividade).toLocaleDateString("pt-BR")}
                  </span>
                  {(souModerador(grupoId) || topico.meu) && (
                    <span className="mt-1 flex gap-3">
                      {souModerador(grupoId) && !topico.meu && (
                        <>
                          <LinkDoForum
                            onClick={() => {
                              const fixou = alternarFixado(grupoId, topico.id);
                              toast({ title: fixou ? "Tópico fixado" : "Tópico solto" });
                            }}
                            className="text-[10.5px] text-white/35 hover:text-white/70"
                            testid={`fixar-${topico.id}`}
                          >
                            {topico.fixado ? "soltar" : "fixar"}
                          </LinkDoForum>
                          <LinkDoForum
                            onClick={() => {
                              alternarTopicoEscondido(grupoId, topico.id);
                              toast({ title: "Tópico removido do fórum" });
                            }}
                            className="text-[10.5px] text-white/35 hover:text-red-300"
                            testid={`esconder-${topico.id}`}
                          >
                            remover
                          </LinkDoForum>
                        </>
                      )}
                      {topico.meu && (
                        <LinkDoForum
                          onClick={() => {
                            apagarMeuTopico(topico.id);
                            toast({ title: "Tópico apagado" });
                          }}
                          className="text-[10.5px] text-white/35 hover:text-red-300"
                          testid={`topico-delete-${topico.id}`}
                        >
                          apagar
                        </LinkDoForum>
                      )}
                    </span>
                  )}
                </td>
                <td className="py-2 pl-2 text-right text-[13px] text-white/45">
                  {topico.totalRespostas}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* A porta para a lista completa. Só aparece quando há o que não coube —
          "ver todos (5)" numa lista de 5 é um toque para não ver nada novo. */}
      {escondidos > 0 && (
        <p className="mt-2.5 border-t border-white/[0.06] pt-2.5">
          <LinkDoForum href={`/forum/${grupoId}/topicos`} testid="ver-todos-os-topicos">
            ver todos os tópicos ({topicos.length}) »
          </LinkDoForum>
        </p>
      )}

      {modo === "todos" && paginas > 1 && (
        <p className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-white/[0.06] pt-2.5">
          <span className="text-[10.5px] text-white/35">páginas:</span>
          {Array.from({ length: paginas }, (_, n) => (
            <button
              key={n}
              onClick={() => setPagina(n)}
              className={`text-[11.5px] font-semibold transition-colors ${
                n === atual ? "text-white" : "text-primary hover:opacity-80"
              }`}
              data-testid={`pagina-${n + 1}`}
            >
              {n + 1}
            </button>
          ))}
        </p>
      )}
    </Bloco>
  );
}
