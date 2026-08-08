import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Search, Shield, X } from "lucide-react";

import {
  Bloco,
  CAMPO,
  CapaDaComunidade,
  LinkDoForum,
  PaginaDoForum,
} from "@/components/forum/Pecas";
import {
  capaDaComunidade,
  categoriaDe,
  configDo,
  iconeDaCategoria,
  minhasComunidades,
  souModerador,
} from "@/lib/forum";
import { haQuantoTempo, movimentoDe } from "@/lib/forumVitrine";
import { GRUPOS_EVENT, type Grupo } from "@/lib/grupos";

type Ordem = "movimento" | "az" | "modero";

const ORDENS: { chave: Ordem; nome: string }[] = [
  { chave: "movimento", nome: "Movimento" },
  { chave: "az", nome: "A–Z" },
  { chave: "modero", nome: "Que eu modero" },
];

/**
 * **Todas as suas comunidades** (`/forum/minhas`) — ROTEIRO §4.92.
 *
 * ---
 *
 * **Pedido do Matheus em 31/07**, olhando a grade de `/forum`: *"deveria ter
 * sempre um link que eu pudesse clicar em Minhas comunidades, onde eu abrisse
 * uma página que mostrasse todas as minhas comunidades. Eu sinto falta disso."*
 *
 * Ele deu duas saídas — esta página, ou tirar a grade de lá e deixar só no “…”.
 * Ao ver as duas desenhadas, escolheu **as duas coisas, cada uma no seu papel**:
 * o resumo de seis fica em `/forum` para quem só está passando, e esta página é
 * para quem procura. Mesmo desenho da página de tópicos (§4.91).
 *
 * **E ela não é a grade com mais linhas** — essa foi a crítica que derrubou a
 * primeira página de tópicos, e vale aqui: uma página que só repete o que já se
 * via não é uma página. O que ela acrescenta é **por que abrir cada uma**:
 * quantas conversas se mexeram esta semana, quando foi a última, e onde você é
 * moderador. Mais busca e três ordenações.
 */
export default function MinhasComunidades() {
  const [versao, setVersao] = useState(0);
  const [ordem, setOrdem] = useState<Ordem>("movimento");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const atualizar = () => setVersao((v) => v + 1);
    window.addEventListener(GRUPOS_EVENT, atualizar);
    return () => window.removeEventListener(GRUPOS_EVENT, atualizar);
  }, []);

  /* `minhasComunidades` é a fonte única — o menu “…” conta pela mesma função,
     e foi essa duplicata que fez o menu dizer 4 com 5 na tela (§4.92). */
  const minhas = useMemo(() => minhasComunidades(), [versao]);

  const termo = busca.trim().toLowerCase();
  const lista = useMemo(() => {
    let fora = minhas;
    if (termo) {
      fora = fora.filter(
        (grupo) =>
          grupo.nome.toLowerCase().includes(termo) ||
          (categoriaDe(grupo.id) ?? "").toLowerCase().includes(termo),
      );
    }
    if (ordem === "modero") fora = fora.filter((grupo) => souModerador(grupo.id));

    const ordenada = [...fora];
    if (ordem === "az") {
      ordenada.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    } else {
      /* Movimento: o que se mexeu esta semana primeiro; empate, mais mensagens. */
      ordenada.sort((a, b) => {
        const ma = movimentoDe(a.id);
        const mb = movimentoDe(b.id);
        return mb.conversasDaSemana - ma.conversasDaSemana || mb.mensagens - ma.mensagens;
      });
    }
    return ordenada;
  }, [minhas, termo, ordem, versao]);

  const totalMensagens = minhas.reduce((soma, grupo) => soma + movimentoDe(grupo.id).mensagens, 0);

  return (
    <PaginaDoForum titulo="Minhas comunidades" voltarPara="/forum" testid="minhas-comunidades-page">
      <div className="px-5 pt-4">
        <p className="mb-3 text-[11px] text-white/35">
          <Link href="/forum" className="text-primary">
            Comunidades
          </Link>
          {" › "}
          <span>Minhas</span>
        </p>

        {minhas.length === 0 ? (
          <Bloco titulo="Nenhuma ainda">
            <p className="text-[13px] leading-relaxed text-white/55">
              Você ainda não participa de nenhuma comunidade.
            </p>
            <div className="mt-3">
              <LinkDoForum href="/forum">ver todas as comunidades »</LinkDoForum>
            </div>
          </Bloco>
        ) : (
          <>
            <p className="mb-3 text-[12px] text-white/40">
              {minhas.length} {minhas.length === 1 ? "comunidade" : "comunidades"} ·{" "}
              {totalMensagens} {totalMensagens === 1 ? "mensagem" : "mensagens"} ao todo
            </p>

            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
              <input
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="buscar nas minhas"
                className={`${CAMPO} pl-8 ${busca ? "pr-8" : ""}`}
                data-testid="buscar-minhas"
              />
              {busca && (
                <button
                  onClick={() => setBusca("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                  aria-label="limpar a busca"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {ORDENS.map((item) => (
                <button
                  key={item.chave}
                  onClick={() => setOrdem(item.chave)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-colors ${
                    ordem === item.chave
                      ? "bg-white text-background"
                      : "bg-white/[0.06] text-white/55 hover:bg-white/10 hover:text-white"
                  }`}
                  data-testid={`ordem-${item.chave}`}
                >
                  {item.nome}
                </button>
              ))}
            </div>

            <Bloco
              titulo={
                termo || ordem === "modero"
                  ? `${lista.length} ${lista.length === 1 ? "comunidade" : "comunidades"}`
                  : "Todas as suas"
              }
              testid="lista-minhas-comunidades"
            >
              {lista.length === 0 ? (
                <p className="text-[13px] text-white/40">
                  {termo
                    ? `Nenhuma das suas com “${busca.trim()}”.`
                    : "Você não modera nenhuma comunidade."}
                </p>
              ) : (
                <div>
                  {lista.map((grupo) => (
                    <LinhaDaMinha key={grupo.id} grupo={grupo} />
                  ))}
                </div>
              )}
            </Bloco>
          </>
        )}

        <p className="mt-3 text-center">
          <LinkDoForum href="/forum">« todas as comunidades</LinkDoForum>
        </p>
      </div>
    </PaginaDoForum>
  );
}

/**
 * Uma linha: a capa, o nome e **o motivo de abrir agora**.
 *
 * O motivo é o que a grade de `/forum` não conseguia dar — lá cabem imagem e
 * nome, e mais nada. Aqui a linha diz se a conversa está viva, quando foi a
 * última mensagem, e se a casa é sua para moderar.
 */
function LinhaDaMinha({ grupo }: { grupo: Grupo }) {
  const movimento = movimentoDe(grupo.id);
  const modero = souModerador(grupo.id);
  const categoria = categoriaDe(grupo.id);

  return (
    <Link
      href={`/forum/${grupo.id}`}
      className="flex items-center gap-3 border-b border-white/[0.05] py-2.5 last:border-0"
      data-testid={`minha-${grupo.id}`}
    >
      <CapaDaComunidade
        imagem={configDo(grupo.id).imagem}
        foto={capaDaComunidade(grupo.id)}
        emoji={grupo.emoji}
        semente={grupo.id}
        lado={42}
      />

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="min-w-0 truncate text-[13.5px] font-semibold">{grupo.nome}</span>
          {modero && <Shield className="h-3 w-3 shrink-0 text-primary/70" />}
        </span>

        {/* A linha do porquê. O verde só quando houve movimento **esta semana** —
            senão a cor deixaria de significar coisa. */}
        <span className="mt-0.5 block text-[10.5px] leading-tight">
          {movimento.conversasDaSemana > 0 ? (
            <span className="text-primary/85">
              {movimento.conversasDaSemana}{" "}
              {movimento.conversasDaSemana === 1 ? "conversa" : "conversas"} esta semana
            </span>
          ) : movimento.ultima ? (
            <span className="text-white/35">última mensagem {haQuantoTempo(movimento.ultima)}</span>
          ) : (
            <span className="text-white/25">nenhuma conversa ainda</span>
          )}
          {modero && <span className="text-white/30"> · você modera</span>}
        </span>

        {categoria && (
          <span className="mt-0.5 block truncate text-[10px] text-white/25">
            {iconeDaCategoria(categoria)} {categoria} · {movimento.topicos}{" "}
            {movimento.topicos === 1 ? "tópico" : "tópicos"}
          </span>
        )}
      </span>
    </Link>
  );
}
