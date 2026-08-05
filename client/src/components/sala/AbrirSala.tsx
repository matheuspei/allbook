import { useState } from "react";
import { useLocation } from "wouter";
import { CalendarDays, Globe, Lock, X } from "lucide-react";
import { catalog } from "@/lib/books";
import { meusClubes } from "@/lib/clubes";
import { avatarDeLeitor, findMember, type CommunityMember } from "@/lib/community";
import { readFollowing } from "@/lib/following";
import { formatarPosicao } from "@/lib/sala";
import { abrirSala, type PortaDaSala } from "@/lib/salaAoVivo";
import { hojeIso, somarDiasIso } from "@/lib/clubes";

/**
 * **Abrir uma sala de escuta** — a folha das três portas.
 *
 * A decisão de arquitetura (ROTEIRO §4.81): **a sala é do player, não do clube.**
 * Dos três casos que o Matheus descreveu, só o marcado é naturalmente de clube —
 * ouvir com uma pessoa não é clube, e abrir para quem quiser é mais uma live da
 * comunidade. Se a sala morasse dentro do clube, o caso de dois ficaria sem lugar.
 *
 * Por isso ela nasce aqui, no ponto em que a pessoa está ouvindo, e o clube é só
 * um dos lugares que a **convoca**.
 */
export default function AbrirSala({
  bookId,
  posicaoSec,
  onFechar,
}: {
  bookId: number;
  posicaoSec: number;
  onFechar: () => void;
}) {
  const [, navigate] = useLocation();
  const [porta, setPorta] = useState<PortaDaSala>("aberta");
  const [clubeId, setClubeId] = useState<string | undefined>(undefined);
  const [escolhidos, setEscolhidos] = useState<string[]>([]);

  const book = catalog.find((item) => item.id === bookId);
  const clubes = meusClubes();
  const gente = readFollowing()
    .map((slug) => findMember(slug))
    .filter((pessoa): pessoa is CommunityMember => pessoa !== undefined);

  function criar() {
    const sala = abrirSala({
      bookId,
      porta,
      posicaoSec,
      clubeId,
      /* Sessão marcada nasce para amanhã às 21h — é só um ponto de partida
         editável, não uma regra: o que importa é ela já existir com data, senão
         "marcar" viraria mais uma tela antes da tela. */
      data: porta === "marcada" ? somarDiasIso(hojeIso(), 1) : undefined,
      hora: porta === "marcada" ? "21:00" : undefined,
      titulo: porta === "marcada" ? `${book?.title ?? "Livro"}, ao vivo` : undefined,
      convidados: escolhidos.length > 0 ? escolhidos : undefined,
    });
    onFechar();
    navigate(`/sala/${sala.id}`);
  }

  return (
    <div
      className="fixed inset-0 z-[160] flex items-end bg-black/55 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onFechar}
      data-testid="folha-abrir-sala"
    >
      <div
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-[28px] border-t border-white/10 bg-[#1a1a1a] p-5 pb-9 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto -mt-1 mb-4 h-1.5 w-12 rounded-full bg-white/15" />

        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold">Ouvir junto</h2>
            <p className="mt-0.5 text-xs text-white/40">
              A sala começa em <b className="text-white/70">{formatarPosicao(posicaoSec)}</b>, onde
              você está
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

        {book && (
          <div className="mb-5 flex items-center gap-3">
            <img src={book.cover} alt="" className="h-14 w-14 rounded-lg object-cover" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{book.title}</div>
              <div className="mt-0.5 text-[11px] text-white/35">{book.narrator}</div>
            </div>
          </div>
        )}

        <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/35">
          Quem pode entrar
        </h3>

        <div className="space-y-2">
          <Porta
            escolhida={porta === "privada"}
            onEscolher={() => setPorta("privada")}
            icone={<Lock className="h-4 w-4" />}
            nome="Só quem eu chamar"
            detalhe="a dois ou em poucos · não aparece para ninguém"
          />
          <Porta
            escolhida={porta === "aberta"}
            onEscolher={() => setPorta("aberta")}
            icone={<Globe className="h-4 w-4" />}
            nome="Aberta agora"
            detalhe="aparece no Feed enquanto durar"
          />
          <Porta
            escolhida={porta === "marcada"}
            onEscolher={() => setPorta("marcada")}
            icone={<CalendarDays className="h-4 w-4" />}
            nome="Marcar para depois"
            detalhe="vira uma sessão com hora, amanhã às 21h"
          />
        </div>

        {/*
          Ligar a sala a um clube (§4.81). Só aparece se você está em algum —
          caixa vazia dizendo "você não tem clube" é a praga que a §4.40 tirou
          destas telas.

          ⚠️ Sala **privada** não oferece clube de propósito: o que é a dois não
          se pendura num grupo de doze.
        */}
        {clubes.length > 0 && porta !== "privada" && (
          <>
            <h3 className="mb-2.5 mt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-white/35">
              É de algum clube?
            </h3>
            <div className="space-y-2">
              <Porta
                escolhida={clubeId === undefined}
                onEscolher={() => setClubeId(undefined)}
                icone={<span className="text-[13px]">—</span>}
                nome="De ninguém, só minha"
                detalhe="a sala não fica ligada a clube nenhum"
              />
              {clubes.map((clube) => (
                <Porta
                  key={clube.id}
                  escolhida={clubeId === clube.id}
                  onEscolher={() => setClubeId(clube.id)}
                  icone={<span className="text-[13px]">🎧</span>}
                  nome={clube.nome}
                  detalhe={`${clube.membros.length} ${
                    clube.membros.length === 1 ? "membro" : "membros"
                  } · a sessão aparece na página do clube`}
                />
              ))}
            </div>
          </>
        )}

        {/*
          **Chamar alguém.** Sem isto a porta "só quem eu chamar" não levava a
          lugar nenhum — a sala privada nascia com uma pessoa dentro e ninguém
          para convidar, o que é o oposto do caso que originou a ideia (*"ouvir
          um livro junto com minha namorada"*).

          A lista é **quem você segue**: é a relação que o app já tem e a única
          que faz sentido aqui — chamar estranho para ouvir junto seria spam.
        */}
        {gente.length > 0 && (
          <>
            <h3 className="mb-2.5 mt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-white/35">
              Chamar alguém
              {escolhidos.length > 0 && (
                <span className="ml-2 font-normal normal-case tracking-normal text-white/25">
                  {escolhidos.length} {escolhidos.length === 1 ? "pessoa" : "pessoas"}
                </span>
              )}
            </h3>
            <div className="flex flex-wrap gap-2">
              {gente.map((pessoa) => {
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
                    data-testid={`convidar-${pessoa.slug}`}
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
          </>
        )}

        <button
          onClick={criar}
          className="mt-6 w-full rounded-xl bg-primary py-3.5 font-display text-[14px] font-bold text-black"
          data-testid="button-criar-sala"
        >
          {porta === "marcada" ? "Marcar a sessão" : "Abrir a sala"}
        </button>

        <p className="mt-3 text-center text-[10.5px] leading-relaxed text-white/25">
          {porta === "privada"
            ? "Sala privada não deixa rastro: o que for dito some quando você encerrar."
            : "Ao encerrar, a conversa fica guardada no livro, presa ao minuto de cada fala."}
        </p>
      </div>
    </div>
  );
}

function Porta({
  escolhida,
  onEscolher,
  icone,
  nome,
  detalhe,
}: {
  escolhida: boolean;
  onEscolher: () => void;
  icone: React.ReactNode;
  nome: string;
  detalhe: string;
}) {
  return (
    <button
      onClick={onEscolher}
      className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${
        escolhida
          ? "bg-primary/10 ring-1 ring-inset ring-primary/45"
          : "bg-white/[0.035] ring-1 ring-inset ring-white/10 hover:bg-white/[0.06]"
      }`}
      data-testid={`porta-${nome}`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
          escolhida ? "bg-primary/20 text-primary" : "bg-white/[0.07] text-white/45"
        }`}
      >
        {icone}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold">{nome}</span>
        <span className="mt-0.5 block text-[10.5px] leading-snug text-white/35">{detalhe}</span>
      </span>
      <span
        className={`h-4 w-4 shrink-0 rounded-full ${
          escolhida ? "border-[5px] border-primary" : "border-2 border-white/20"
        }`}
      />
    </button>
  );
}
