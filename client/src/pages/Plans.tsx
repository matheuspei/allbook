import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  BookOpen,
  Bookmark,
  ChevronRight,
  Download,
  Headphones,
  Mic,
  Users,
  type LucideIcon,
} from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { catalog } from "@/lib/books";
import { totalBookmarks } from "@/lib/bookmarks";
import { readFollowing } from "@/lib/following";
import { readDownloads, readLibrary } from "@/lib/library";
import { readMyComments } from "@/lib/myComments";
import { readPlaybackList } from "@/lib/playback";
import { readProfile } from "@/lib/profile";
import { readRequests } from "@/lib/requests";
import { defaultSettings, formatSpeed, readSettings } from "@/lib/settings";

/**
 * "Meu acesso" — o que o AllBook te dá, e o quanto disso **você já está usando**.
 *
 * **Como esta tela era, e por que mudou (26/07).** Ela nasceu no slot de "Planos"
 * e, por decisão do Matheus em 24/07, não fala de preço nem insinua cobrança —
 * isso continua valendo e não mudou aqui. O que mudou é o conteúdo. A versão
 * antiga listava seis recursos com uma frase cada ("Catálogo completo — todos os
 * audiolivros, sem bloqueio"), e ele voltou perguntando por que a tela existia:
 *
 * > "Qual é a ideia do botão Meu acesso? Os botões não fazem nada, não estou
 * > entendendo por que ele existe."
 *
 * Dois defeitos reais, e ele acertou os dois. (1) As linhas usavam o desenho dos
 * itens de menu do Perfil — cartão, ícone laranja, título e subtítulo — mas eram
 * `div`: **texto fantasiado de botão**. (2) O conteúdo dizia o óbvio. Ninguém
 * precisa que o app informe que existe um catálogo: isso se vê usando.
 *
 * **A virada: em vez de listar o que existe, mostrar o que é seu.** Cada linha
 * traz **o seu número** — livros na lista, baixados, pessoas que você segue,
 * pedidos feitos, marcações — e **leva ao lugar** (agora é botão de verdade).
 * Quem já usa vê o próprio retrato; quem ainda não usou recebe um convite com
 * caminho, e o ícone fica apagado para a diferença ser visível de longe.
 *
 * **Fronteira com a tela Estatísticas, para as duas não dizerem a mesma coisa:**
 * Estatísticas é sobre **audição** (horas, livros terminados, gêneros, troféus).
 * Aqui é sobre **recursos** — o que do app você está aproveitando. Nenhum número
 * de hora ou de livro lido aparece nesta tela, de propósito.
 *
 * **"Sem anúncios" saiu da lista e virou rodapé:** é o único benefício sem número
 * possível, e item sem número quebraria o padrão que a tela acabou de criar.
 */

interface Recurso {
  chave: string;
  icon: LucideIcon;
  titulo: string;
  /** O que dizer quando a pessoa **já usa** — com o número dela. */
  emUso: string;
  /** O que dizer quando ainda não usou: convite, nunca cobrança. */
  convite: string;
  usado: boolean;
  destino: string;
}

function montarRecursos(): Recurso[] {
  const lista = readLibrary();
  const baixados = readDownloads();
  const seguindo = readFollowing();
  const comentarios = readMyComments();
  const pedidos = readRequests();
  const marcacoes = totalBookmarks();
  const comecados = readPlaybackList();
  const velocidade = readSettings().speed;
  const mexeuNoPlayer = marcacoes > 0 || velocidade !== defaultSettings.speed;

  // O player leva para onde a pessoa parou; sem histórico, mandá-la ao player de
  // um livro sorteado seria estranho — nesse caso o convite é escolher um livro.
  const destinoDoPlayer = comecados.length > 0 ? "/player/current" : "/discover";

  const partesDoPlayer = [
    marcacoes > 0 ? `${marcacoes} ${marcacoes === 1 ? "marcação" : "marcações"}` : null,
    velocidade !== defaultSettings.speed ? `velocidade ${formatSpeed(velocidade)}` : null,
  ].filter(Boolean);

  return [
    {
      chave: "catalogo",
      icon: BookOpen,
      titulo: "Catálogo completo",
      emUso: `${catalog.length} títulos liberados · você já começou ${comecados.length}`,
      convite: `${catalog.length} títulos liberados, sem bloqueio. Comece por um.`,
      usado: comecados.length > 0,
      destino: "/discover",
    },
    {
      chave: "player",
      icon: Headphones,
      titulo: "Player completo",
      emUso: `${partesDoPlayer.join(" · ")} — e tem temporizador e modo carro`,
      convite: "Velocidade, marcações, temporizador e modo carro esperando você.",
      usado: mexeuNoPlayer,
      destino: destinoDoPlayer,
    },
    {
      chave: "lista",
      icon: Bookmark,
      titulo: "Minha lista",
      emUso: `${lista.length} ${lista.length === 1 ? "livro guardado" : "livros guardados"} para ouvir`,
      convite: "Guarde o que você quer ouvir depois. Sua lista está vazia.",
      usado: lista.length > 0,
      destino: "/library",
    },
    {
      chave: "downloads",
      icon: Download,
      titulo: "Downloads",
      emUso: `${baixados.length} ${baixados.length === 1 ? "livro baixado" : "livros baixados"} para ouvir sem internet`,
      convite: "Baixe um livro e ouça no avião, no metrô, sem internet.",
      usado: baixados.length > 0,
      destino: "/downloads",
    },
    {
      chave: "comunidade",
      icon: Users,
      titulo: "Comunidade",
      emUso: [
        seguindo.length > 0
          ? `seguindo ${seguindo.length} ${seguindo.length === 1 ? "leitor" : "leitores"}`
          : null,
        comentarios.length > 0
          ? `${comentarios.length} ${comentarios.length === 1 ? "comentário seu" : "comentários seus"}`
          : null,
      ]
        .filter(Boolean)
        .join(" · "),
      convite: "Veja o que outros leitores estão ouvindo e diga o que achou.",
      usado: seguindo.length > 0 || comentarios.length > 0,
      destino: "/community",
    },
    {
      chave: "pedido",
      icon: Mic,
      titulo: "Pedir um livro",
      emUso: `${pedidos.length} ${pedidos.length === 1 ? "pedido feito" : "pedidos feitos"} — o AllBook narra o que não existe`,
      convite: "Nenhum pedido ainda. Qualquer livro pode virar audiolivro aqui.",
      usado: pedidos.length > 0,
      destino: "/request",
    },
  ];
}

export default function Plans() {
  const [, navegar] = useLocation();
  const primeiroNome = readProfile().name?.trim().split(/\s+/)[0] ?? "";

  // Os números vêm do `localStorage`, que só existe no navegador — daí ler depois
  // de montar, como o resto do app faz.
  const [recursos, setRecursos] = useState<Recurso[]>([]);

  useEffect(() => {
    setRecursos(montarRecursos());
    window.scrollTo(0, 0);
  }, []);

  const emUso = recursos.filter((recurso) => recurso.usado).length;
  const total = recursos.length;
  const faltando = recursos.filter((recurso) => !recurso.usado);

  return (
    <div className="min-h-screen bg-[#141414] pb-24 text-white" data-testid="plans-page">
      <PageHeader title="Meu acesso" fallback="/profile" />

      <header className="relative overflow-hidden px-5 pb-6 pt-8">
        {/* Brilho sutil da marca, no mesmo espírito do Perfil — premium sem pesar. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/20 via-primary/[0.04] to-transparent" />
        <div className="relative">
          <h2
            className="font-display text-2xl font-bold tracking-tight"
            data-testid="text-access-title"
          >
            {primeiroNome ? `Tudo seu, ${primeiroNome}.` : "Está tudo liberado."}
          </h2>

          {/*
            A frase antiga era "você tem o AllBook inteiro nas mãos, é só ouvir" —
            verdadeira e vazia. Agora a mesma ideia vem **provada**: quantos dos
            recursos você já pôs para trabalhar. Texto e um filete, sem medalha
            nem porcentagem gigante: gamificação em destaque foi rejeitada no
            Perfil (ver ROTEIRO, "Estilo: evitar a cara de IA").
          */}
          {total > 0 && (
            <>
              <p className="mt-2 text-sm leading-relaxed text-white/55" data-testid="text-access-usage">
                Você tem o AllBook inteiro liberado e já está usando{" "}
                <span className="font-semibold text-white">
                  {emUso} {emUso === 1 ? "recurso" : "recursos"} de {total}
                </span>
                .
              </p>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${(emUso / total) * 100}%` }}
                />
              </div>
            </>
          )}
        </div>
      </header>

      <main className="px-5">
        <div className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 bg-white/5">
          {recursos.map((recurso) => {
            const Icon = recurso.icon;
            return (
              <button
                key={recurso.chave}
                type="button"
                onClick={() => navegar(recurso.destino)}
                className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-white/[0.07] active:bg-white/10"
                data-testid={`access-${recurso.chave}`}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${
                    recurso.usado ? "bg-primary/10" : "bg-white/[0.06]"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${recurso.usado ? "text-primary" : "text-white/30"}`}
                    strokeWidth={2}
                  />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-tight">{recurso.titulo}</span>
                  <span
                    className={`mt-0.5 block text-xs leading-snug ${
                      recurso.usado ? "text-white/45" : "text-white/35"
                    }`}
                  >
                    {recurso.usado ? recurso.emUso : recurso.convite}
                  </span>
                </span>

                <ChevronRight className="h-4 w-4 shrink-0 text-white/25" />
              </button>
            );
          })}
        </div>

        {/*
          O fecho muda de tom conforme o retrato: com tudo em uso, é elogio; com
          coisa sobrando, aponta **o que** falta pelo nome. Genérico ("aproveite à
          vontade", a frase antiga) não ajuda ninguém a dar o próximo passo.
        */}
        {recursos.length > 0 && (
          <div className="mt-5 space-y-1 px-2 text-center">
            {faltando.length > 0 && (
              <p className="text-xs leading-relaxed text-white/45" data-testid="text-access-missing">
                Falta experimentar:{" "}
                <span className="text-white/60">
                  {faltando.map((recurso) => recurso.titulo).join(", ")}
                </span>
                .
              </p>
            )}
            <p className="text-xs leading-relaxed text-white/30">
              {faltando.length === 0
                ? "Você está usando o AllBook inteiro. E sem anúncios, sempre."
                : "Sem anúncios, sempre. Nada interrompe a sua escuta."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
