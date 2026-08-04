import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  BookOpen,
  Compass,
  Globe,
  Headphones,
  HelpCircle,
  LayoutGrid,
  Plus,
  Radio,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { meusClubes } from "@/lib/clubes";
import { minhasComunidades } from "@/lib/forum";
import { COMENTARIOS_EVENT, temResposta } from "@/lib/comentariosDePost";
import { readFollowing } from "@/lib/following";
import { GRUPOS_EVENT } from "@/lib/grupos";
import { POSTS_EVENT, todosOsPosts } from "@/lib/posts";
import { SALA_AO_VIVO_EVENT, salasAoVivo } from "@/lib/salaAoVivo";
import { meusSeguidores } from "@/lib/seguidores";
import { trechosQuentes } from "@/lib/trechosQuentes";

/**
 * **O painel da Comunidade** — o quadradinho que abre a tela inteira (§4.100).
 *
 * Substitui o menu "…" suspenso (§4.92). Decisão do Matheus (04/08, à noite),
 * com o Facebook como referência: *"em vez de ser uma bolinha, um quadradinho…
 * quando você clica, abre uma aba até o final, pegando toda, como se fosse
 * quase outra janela"* — e ícones nos destinos, como lá.
 *
 * O que NÃO mudou (a regra da §4.57 continua): **o painel só leva ao que é da
 * comunidade**. O que é seu — perfil, trechos guardados, privacidade — mora no
 * avatar (`/you`). E cada cartão mostra a contagem real; destino sem nada a
 * mostrar some (a régua da §4.23).
 */
export default function PainelDaComunidade() {
  const [aberto, setAberto] = useState(false);
  const [, navegar] = useLocation();
  const [dados, setDados] = useState(() => contar());

  useEffect(() => {
    const atualizar = () => setDados(contar());
    atualizar();
    window.addEventListener(GRUPOS_EVENT, atualizar);
    window.addEventListener(POSTS_EVENT, atualizar);
    window.addEventListener(COMENTARIOS_EVENT, atualizar);
    window.addEventListener(SALA_AO_VIVO_EVENT, atualizar);
    return () => {
      window.removeEventListener(GRUPOS_EVENT, atualizar);
      window.removeEventListener(POSTS_EVENT, atualizar);
      window.removeEventListener(COMENTARIOS_EVENT, atualizar);
      window.removeEventListener(SALA_AO_VIVO_EVENT, atualizar);
    };
  }, []);

  useEffect(() => {
    if (!aberto) return;
    const esc = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAberto(false);
    };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [aberto]);

  function ir(rota: string) {
    setAberto(false);
    navegar(rota);
  }

  return (
    <>
      {/* O quadradinho — quadrado de propósito, era o pedido: a bolinha "…"
          virou o botão de grade, à esquerda. */}
      <button
        onClick={() => setAberto(true)}
        aria-label="Abrir o painel da comunidade"
        className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/12 bg-white/[0.06] text-white/70 transition-colors hover:bg-white/12 hover:text-white"
        data-testid="painel-da-comunidade"
      >
        <LayoutGrid className="h-[17px] w-[17px]" />
        {dados.salas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#141414] bg-red-500" />
        )}
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-[90] overflow-y-auto bg-[#141414] animate-in slide-in-from-left duration-200"
          data-testid="painel-da-comunidade-aberto"
        >
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.07] bg-[#141414]/95 px-5 py-4 backdrop-blur">
            <h2 className="font-display text-xl font-bold tracking-tight">Comunidade</h2>
            <button
              onClick={() => setAberto(false)}
              aria-label="Fechar o painel"
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/12 bg-white/[0.06] text-white/70 hover:bg-white/12 hover:text-white"
              data-testid="fechar-painel"
            >
              <X className="h-[17px] w-[17px]" />
            </button>
          </header>

          <div className="px-5 py-5">
            {dados.salas > 0 && (
              <button
                onClick={() => ir(dados.primeiraSala ? `/sala/${dados.primeiraSala}` : "/community")}
                className="mb-4 flex w-full items-center gap-3 rounded-2xl bg-red-500/[0.09] p-4 ring-1 ring-inset ring-red-500/25 transition-colors hover:bg-red-500/[0.14]"
                data-testid="painel-salas"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-500/15">
                  <Radio className="h-5 w-5 text-red-400" />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block text-[14px] font-semibold">Salas ao vivo agora</span>
                  <span className="block text-[11.5px] text-white/40">
                    {dados.salas} {dados.salas === 1 ? "sala aberta" : "salas abertas"} — entre e ouça junto
                  </span>
                </span>
              </button>
            )}

            <Grade>
              <Cartao icone={<Users />} cor="text-sky-400 bg-sky-400/12" rotulo="Minhas comunidades" conta={dados.comunidades} onClick={() => ir("/forum/minhas")} testid="painel-minhas-comunidades" />
              <Cartao icone={<Globe />} cor="text-emerald-400 bg-emerald-400/12" rotulo="Todas as comunidades" onClick={() => ir("/forum")} testid="painel-todas-comunidades" />
              <Cartao icone={<BookOpen />} cor="text-violet-400 bg-violet-400/12" rotulo="Meus clubes" conta={dados.clubes} onClick={() => ir("/clubes/meus")} testid="painel-meus-clubes" />
              <Cartao icone={<Compass />} cor="text-cyan-400 bg-cyan-400/12" rotulo="Todos os clubes" onClick={() => ir("/clubes")} testid="painel-todos-clubes" />
              <Cartao icone={<UserPlus />} cor="text-green-400 bg-green-400/12" rotulo="Quem eu sigo" conta={dados.sigo} onClick={() => ir("/seguidores")} testid="painel-quem-eu-sigo" />
              <Cartao icone={<Users />} cor="text-rose-400 bg-rose-400/12" rotulo="Quem me segue" conta={dados.meSeguem} onClick={() => ir("/seguidores")} testid="painel-quem-me-segue" />
              {dados.perguntas > 0 && (
                <Cartao icone={<HelpCircle />} cor="text-amber-400 bg-amber-400/12" rotulo="Perguntas sem resposta" conta={dados.perguntas} onClick={() => ir("/perguntas")} testid="painel-perguntas" />
              )}
              {dados.trechos > 0 && (
                <Cartao icone={<Headphones />} cor="text-orange-400 bg-orange-400/12" rotulo="Trechos da semana" conta={dados.trechos} onClick={() => ir("/trechos")} testid="painel-trechos" />
              )}
            </Grade>

            <p className="mt-5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/30">
              Criar
            </p>
            <Grade>
              <Cartao icone={<Plus />} cor="text-primary bg-primary/12" rotulo="Criar comunidade" onClick={() => ir("/forum?criar=1")} testid="painel-criar-comunidade" />
              <Cartao icone={<Plus />} cor="text-primary bg-primary/12" rotulo="Criar clube" onClick={() => ir("/clubes/novo")} testid="painel-criar-clube" />
            </Grade>
          </div>
        </div>
      )}
    </>
  );
}

function Grade({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2.5">{children}</div>;
}

function Cartao({
  icone,
  cor,
  rotulo,
  conta,
  onClick,
  testid,
}: {
  icone: React.ReactNode;
  cor: string;
  rotulo: string;
  conta?: number;
  onClick: () => void;
  testid?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-3.5 text-left transition-colors hover:bg-white/[0.08]"
      data-testid={testid}
    >
      <span className={`grid h-9 w-9 place-items-center rounded-full [&>svg]:h-[18px] [&>svg]:w-[18px] ${cor}`}>
        {icone}
      </span>
      <span className="mt-2.5 block text-[13px] font-semibold leading-tight">{rotulo}</span>
      <span className="mt-0.5 block h-[15px] text-[11px] text-white/35">
        {conta !== undefined && conta > 0 ? conta : ""}
      </span>
    </button>
  );
}

/** Os números do painel, todos de dado que já existe — nenhum inventado (§4.92). */
function contar() {
  const salas = salasAoVivo().filter((sala) => !sala.encerradaEm);
  const perguntas = todosOsPosts().filter((post) => post.pergunta && !temResposta(post.id));
  return {
    salas: salas.length,
    primeiraSala: salas[0]?.id,
    comunidades: minhasComunidades().length,
    clubes: meusClubes().length,
    sigo: readFollowing().length,
    meSeguem: meusSeguidores().length,
    perguntas: perguntas.length,
    trechos: trechosQuentes().length,
  };
}
