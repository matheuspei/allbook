import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts";
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  Headphones,
  Share2,
  Trophy,
} from "lucide-react";

import PageHeader from "@/components/PageHeader";
import StatSpotlight, { type StatKey } from "@/components/StatSpotlight";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { achievements, unlockedCountFor } from "@/lib/achievements";
import { catalog, slugify } from "@/lib/books";
import { readFollowing } from "@/lib/following";
import {
  GOAL_EVENT,
  METAS_DISPONIVEIS,
  readMetaSemanal,
  rotuloDaMeta,
  setMetaSemanal,
} from "@/lib/goals";
import {
  LISTENING_EVENT,
  diaISO,
  diasAtivos,
  formatarDuracao,
  porDiaDaSemana,
  porFaixaDoDia,
  porLivro,
  segundosNaJanela,
  serieDiaria,
  serieMensal,
  serieSemanal,
  type PontoDaSerie,
} from "@/lib/listening";
import { readMyComments } from "@/lib/myComments";
import {
  PLAYBACK_EVENT,
  playbackEntries,
  playbackPercent,
  readPlaybackList,
  remainingLabel,
} from "@/lib/playback";
import { readRecommendationIds } from "@/lib/recommendations";
import {
  CONCLUIDO_PERCENT,
  generosMaisOuvidos,
  lerDadosDeConquista,
  lerResumo,
  pessoaMaisOuvida,
  type ResumoDeAudicao,
} from "@/lib/stats";

/**
 * Estatísticas (`/statistics`).
 *
 * **O que esta tela era.** Um mostruário de números inventados: "47h ouvidas",
 * "3 semanas seguidas", "2 concluídos" e um gráfico de barras — todos escritos
 * à mão no código, com meses de outubro a fevereiro e um "desde 24 de nov. de
 * 2025" que envelheceu sozinho. Os quatro filtros do gráfico (Hoje /
 * Diariamente / Mensalmente / Total) eram **quatro conjuntos de dados falsos**.
 *
 * **O que mudou.** Passou a existir um diário de audição (`lib/listening.ts`),
 * alimentado pelo próprio player: agora todo número aqui é calculado. O que a
 * tela não consegue calcular, ela não mostra — seção sem dado some, em vez de
 * exibir zero decorativo.
 *
 * **Histórico de demonstração.** O app nasce sem passado, e uma tela vazia não
 * dá para avaliar nem para usar. Na primeira abertura o diário é semeado com
 * ~10 semanas plausíveis, e a tela **avisa** isso no rodapé enquanto sobrar
 * algum dia de exemplo — o uso real vai substituindo dia a dia.
 *
 * **Sobriedade.** Saíram o cartão da sequência com degradê âmbar e troféu
 * grande, o ícone colorido por seção e o quadradinho em degradê do atalho da
 * Biblioteca — a mesma faxina feita nas outras telas (ver ROTEIRO 4.9).
 */

type JanelaKey = "7d" | "12s" | "12m";

const JANELAS: { key: JanelaKey; label: string; titulo: string }[] = [
  { key: "7d", label: "7 dias", titulo: "Últimos 7 dias" },
  { key: "12s", label: "12 semanas", titulo: "Últimas 12 semanas" },
  { key: "12m", label: "12 meses", titulo: "Últimos 12 meses" },
];

const NOMES_DOS_DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

/** A inicial de cada dia, para a fileira da semana. */
const LETRAS_DOS_DIAS = ["D", "S", "T", "Q", "Q", "S", "S"];

const MESES_LONGOS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function somarDias(data: Date, dias: number): Date {
  const copia = new Date(data);
  copia.setDate(copia.getDate() + dias);
  return copia;
}

export default function Statistics() {
  const { toast } = useToast();
  const [openStat, setOpenStat] = useState<StatKey | null>(null);
  /**
   * O gráfico abre em "12 semanas", não em "7 dias": a seção "Sua semana" logo
   * abaixo já conta os últimos 7 dias, e as duas juntas desenhavam a **mesma
   * informação duas vezes**, uma embaixo da outra. Assim cada uma responde a
   * uma pergunta — o gráfico, "como foi ao longo do tempo"; a fileira de
   * círculos, "e nesta semana?".
   */
  const [janela, setJanela] = useState<JanelaKey>("12s");
  const [diaTocado, setDiaTocado] = useState<string | null>(null);
  const [meta, setMeta] = useState(readMetaSemanal);
  const [resumo, setResumo] = useState<ResumoDeAudicao | null>(null);

  /** Relê quando o player credita audição ou quando o progresso muda. */
  useEffect(() => {
    const sincronizar = () => setResumo(lerResumo());
    const sincronizarMeta = () => setMeta(readMetaSemanal());
    sincronizar();
    window.addEventListener(LISTENING_EVENT, sincronizar);
    window.addEventListener(PLAYBACK_EVENT, sincronizar);
    window.addEventListener(GOAL_EVENT, sincronizarMeta);
    return () => {
      window.removeEventListener(LISTENING_EVENT, sincronizar);
      window.removeEventListener(PLAYBACK_EVENT, sincronizar);
      window.removeEventListener(GOAL_EVENT, sincronizarMeta);
    };
  }, []);

  /**
   * "No seu ritmo, você termina X em N dias" — o livro em andamento mais
   * recente, o quanto falta dele e a sua média diária das últimas 2 semanas.
   * Sem ritmo (média zero) a conta não existe, e a seção some.
   */
  const previsao = useMemo(() => {
    if (!resumo) return null;

    const emAndamento = playbackEntries()
      .filter((item) => item.percent > 0 && item.percent < CONCLUIDO_PERCENT)
      .sort((a, b) => b.playback.updatedAt.localeCompare(a.playback.updatedAt))[0];
    if (!emAndamento) return null;

    const mediaDiaria = segundosNaJanela(resumo.diario, 13, 0) / 14;
    if (mediaDiaria < 60) return null;

    const restanteSec = Math.max(
      0,
      emAndamento.playback.durationSec - emAndamento.playback.positionSec
    );
    return {
      entrada: emAndamento,
      mediaDiaria,
      dias: Math.max(1, Math.ceil(restanteSec / mediaDiaria)),
    };
  }, [resumo]);

  const serie = useMemo<PontoDaSerie[]>(() => {
    if (!resumo) return [];
    if (janela === "7d") return serieDiaria(resumo.diario, 7);
    if (janela === "12s") return serieSemanal(resumo.diario, 12);
    return serieMensal(resumo.diario, 12);
  }, [resumo, janela]);

  /**
   * Os últimos 7 dias, um círculo cada.
   *
   * **Aqui morou um mapa de 12×7 quadradinhos, estilo GitHub, e ele saiu.** Era
   * bonito e denso, mas o Matheus travou nele: "não é uma coisa fácil de
   * entender, e isso aqui não pode ser algo que você demora para entender".
   * Numa tela de estatísticas o desenho tem de se explicar no primeiro olhar —
   * sete círculos com a inicial do dia fazem isso; 84 quadradinhos sem legenda
   * exigem que alguém explique.
   */
  const semana = useMemo(() => {
    if (!resumo) return [];
    const hoje = new Date();
    const dias: { chave: string; letra: string; sec: number; hoje: boolean }[] = [];

    for (let atras = 6; atras >= 0; atras--) {
      const data = somarDias(hoje, -atras);
      const chave = diaISO(data);
      dias.push({
        chave,
        letra: LETRAS_DOS_DIAS[data.getDay()],
        sec: resumo.diario[chave]?.sec ?? 0,
        hoje: atras === 0,
      });
    }
    return dias;
  }, [resumo]);

  /** O dia que a pessoa tocou — no celular não existe passar o mouse. */
  const detalheDoDia = useMemo(() => {
    if (!resumo || !diaTocado) return null;
    const dia = resumo.diario[diaTocado];
    const data = new Date(`${diaTocado}T12:00:00`);
    const titulo = `${NOMES_DOS_DIAS[data.getDay()]}, ${data.getDate()} de ${MESES_LONGOS[data.getMonth()]}`;

    if (!dia || dia.sec === 0) return { titulo, texto: "sem audição" };

    const livros = Object.entries(dia.livros)
      .sort((a, b) => b[1] - a[1])
      .flatMap(([id]) => {
        const livro = catalog.find((item) => item.id === Number(id));
        return livro ? [livro.title] : [];
      })
      .slice(0, 2);

    return {
      titulo,
      texto: `${formatarDuracao(dia.sec)}${livros.length ? ` · ${livros.join(", ")}` : ""}`,
    };
  }, [resumo, diaTocado]);

  const generos = useMemo(
    () =>
      resumo
        ? generosMaisOuvidos(resumo.diario)
            // Abaixo de 1% o rótulo viraria "0%", que parece defeito.
            .filter((item) => item.parte >= 0.01)
            .slice(0, 5)
        : [],
    [resumo]
  );
  const autor = useMemo(() => (resumo ? pessoaMaisOuvida(resumo.diario, "author") : null), [resumo]);
  const narrador = useMemo(
    () => (resumo ? pessoaMaisOuvida(resumo.diario, "narrator") : null),
    [resumo]
  );

  const faixas = useMemo(() => {
    if (!resumo) return [];
    const bruto = porFaixaDoDia(resumo.diario);
    const total = Object.values(bruto).reduce((soma, sec) => soma + sec, 0);
    if (total === 0) return [];
    return (Object.entries(bruto) as [keyof typeof bruto, number][])
      .map(([faixa, sec]) => ({ faixa, sec, parte: sec / total }))
      // Faixa zerada não diz nada — "Tarde 0min" só ocupa linha.
      .filter((item) => item.sec > 0)
      .sort((a, b) => b.sec - a.sec);
  }, [resumo]);

  const diaMaisForte = useMemo(() => {
    if (!resumo) return null;
    const dias = porDiaDaSemana(resumo.diario);
    const maior = Math.max(...dias);
    if (maior <= 0) return null;
    return { indice: dias.indexOf(maior), sec: maior };
  }, [resumo]);

  /** Os concluídos, com capa — vale mais que o número solto. */
  const concluidos = useMemo(() => {
    return readPlaybackList()
      .filter((item) => playbackPercent(item) >= CONCLUIDO_PERCENT)
      .flatMap((item) => {
        const livro = catalog.find((b) => b.id === item.bookId);
        return livro ? [livro] : [];
      });
  }, [resumo]);

  const comunidade = useMemo(
    () => ({
      comentarios: readMyComments().length,
      recomendacoes: readRecommendationIds().length,
      seguindo: readFollowing().length,
    }),
    [resumo]
  );

  const livroMaisOuvido = useMemo(() => {
    if (!resumo) return null;
    const topo = porLivro(resumo.diario)[0];
    if (!topo) return null;
    const livro = catalog.find((item) => item.id === topo.bookId);
    return livro ? { livro, sec: topo.sec } : null;
  }, [resumo]);

  // Primeiro quadro: o diário ainda não foi lido (só existe no navegador).
  if (!resumo) {
    return (
      <div className="min-h-screen bg-[#141414] text-white" data-testid="statistics-page">
        <PageHeader title="Estatísticas" fallback="/profile" />
      </div>
    );
  }

  const ativos = diasAtivos(resumo.diario);
  const mediaPorDiaAtivo = ativos > 0 ? resumo.segundos / ativos : 0;
  const totalDaJanela = serie.reduce((soma, ponto) => soma + ponto.sec, 0);

  // As medalhas agora saem dos seus números — ver `lib/achievements.ts`.
  const dadosDeConquista = lerDadosDeConquista(resumo);
  const conquistadas = unlockedCountFor(dadosDeConquista);

  const metaSec = meta * 60;
  const progressoDaMeta = Math.min(resumo.estaSemana / metaSec, 1);
  const faltaParaMeta = Math.max(0, metaSec - resumo.estaSemana);

  /** A frase de contexto do número grande — comparação honesta, sem enfeite. */
  const comparacao = (() => {
    if (resumo.segundos === 0) return "Toque em play em algum livro para começar a contar.";
    if (resumo.semanaPassada === 0 && resumo.estaSemana === 0) return "Nada nos últimos 7 dias.";
    if (resumo.semanaPassada === 0) return `${formatarDuracao(resumo.estaSemana)} nos últimos 7 dias.`;

    const diferenca = resumo.estaSemana - resumo.semanaPassada;
    if (Math.abs(diferenca) < 60) return "Mesmo ritmo da semana passada.";
    return `${formatarDuracao(Math.abs(diferenca))} ${diferenca > 0 ? "a mais" : "a menos"} que na semana anterior.`;
  })();

  const numeros: { icone: typeof Headphones; label: string; valor: string; key: StatKey }[] = [
    { icone: Clock, label: "Horas ouvidas", valor: formatarDuracao(resumo.segundos), key: "horas" },
    {
      icone: BookOpen,
      label: "Títulos começados",
      valor: String(resumo.titulosComecados),
      key: "titulos",
    },
    {
      icone: Flame,
      label: "Sequência",
      valor: resumo.sequenciaDias > 0 ? `${resumo.sequenciaDias} d` : "—",
      key: "sequencia",
    },
    {
      icone: CheckCircle2,
      label: "Concluídos",
      valor: String(resumo.concluidos),
      key: "concluidos",
    },
  ];

  /**
   * Copia um resumo em texto — o botão antigo copiava a URL do localhost.
   * É função de seta atribuída a `const` de propósito: uma `function` seria
   * içada para antes do `if (!resumo)` acima, e o TypeScript deixaria de saber
   * que `resumo` já não é nulo aqui dentro.
   */
  const compartilhar = async () => {
    const linhas = [
      "Minhas estatísticas no AllBook:",
      `• ${formatarDuracao(resumo.segundos)} ouvidas`,
      `• ${resumo.titulosComecados} títulos começados, ${resumo.concluidos} concluídos`,
      resumo.sequenciaDias > 0 ? `• sequência de ${resumo.sequenciaDias} dias` : null,
      generos[0] ? `• gênero favorito: ${generos[0].genero}` : null,
    ].filter(Boolean);

    try {
      await navigator.clipboard.writeText(linhas.join("\n"));
      toast({ title: "Resumo copiado", description: "Agora é só colar onde você quiser." });
    } catch {
      toast({
        title: "Não deu para copiar",
        description: "O navegador bloqueou o acesso à área de transferência.",
      });
    }
  }

  return (
    <div className="min-h-screen bg-[#141414] pb-24 text-white" data-testid="statistics-page">
      <PageHeader title="Estatísticas" fallback="/profile" />

      <StatSpotlight stat={openStat} onClose={() => setOpenStat(null)} resumo={resumo} />

      <main className="space-y-10 px-5 py-6">
        {/* 1. O número que resume tudo. */}
        <section data-testid="section-hero">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/35">
            Você já ouviu
          </p>
          <p
            className="mt-1.5 font-display text-5xl font-bold tracking-tight"
            data-testid="text-total-hours"
          >
            {formatarDuracao(resumo.segundos)}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/45">{comparacao}</p>
        </section>

        {/* 2. Os quatro números, cada um com seu painel de detalhe. */}
        <section className="grid grid-cols-2 gap-3">
          {numeros.map((item) => {
            const Icone = item.icone;
            return (
              <button
                key={item.key}
                onClick={() => setOpenStat(item.key)}
                className="rounded-xl border border-white/5 bg-white/5 p-4 text-left transition-all duration-150 hover:bg-white/10 active:scale-95"
                data-testid={`stat-card-${item.key}`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Icone className="h-[18px] w-[18px] text-primary" />
                </div>
                <p className="mt-3 font-display text-2xl font-bold tracking-tight">{item.valor}</p>
                <p className="mt-0.5 text-[11px] text-white/40">{item.label}</p>
              </button>
            );
          })}
        </section>

        {/* 3. Tempo de escuta — agora com dados de verdade. */}
        <section className="space-y-4" data-testid="section-listening-time">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-xl font-bold tracking-tight">Tempo de escuta</h2>
            <span className="shrink-0 text-xs text-white/40">
              {formatarDuracao(totalDaJanela)} no período
            </span>
          </div>

          <div className="scrollbar-hide flex gap-2 overflow-x-auto">
            {JANELAS.map((item) => (
              <button
                key={item.key}
                onClick={() => setJanela(item.key)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                  janela === item.key
                    ? "bg-white text-black"
                    : "bg-white/[0.07] text-white/70 hover:bg-white/[0.12]"
                }`}
                data-testid={`filter-${item.key}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-white/5 bg-white/5 p-4">
            <p className="text-center text-[11px] uppercase tracking-wider text-white/35">
              {JANELAS.find((j) => j.key === janela)!.titulo}
            </p>
            <div className="mt-3 h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {/* A margem esquerda encosta no eixo, mas não corta: com -18 os
                    rótulos "1h" e "2h" saíam pela metade. */}
                <BarChart data={serie} margin={{ top: 4, right: 4, left: -6, bottom: 0 }}>
                  <XAxis
                    dataKey="rotulo"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                    dy={8}
                    /* Doze rótulos de data ("19/07") não cabem lado a lado no
                       celular — grudavam num borrão. Nessa janela mostramos um
                       sim, um não; nos dias e meses o rótulo é curto e cabe. */
                    interval={janela === "12s" ? 1 : 0}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
                    width={34}
                    tickFormatter={(valor: number) => (valor === 0 ? "0" : `${valor}h`)}
                  />
                  <Bar dataKey="horas" radius={[4, 4, 0, 0]}>
                    {serie.map((ponto, indice) => (
                      <Cell
                        key={ponto.rotulo + indice}
                        /* A última barra é o período corrente: cheia. As outras,
                           um tom abaixo. Período vazio vira um risco, não um buraco. */
                        fill={
                          ponto.sec === 0
                            ? "rgba(255,255,255,0.06)"
                            : indice === serie.length - 1
                              ? "hsl(var(--primary))"
                              : "hsl(var(--primary) / 0.65)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* 4. Constância: um quadradinho por dia, 12 semanas. */}
        <section className="space-y-4" data-testid="section-consistency">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-xl font-bold tracking-tight">Sua semana</h2>
            <span className="shrink-0 text-xs text-white/40">
              {resumo.sequenciaDias === 0
                ? "sequência parada"
                : resumo.sequenciaDias === 1
                  ? "1 dia seguido"
                  : `${resumo.sequenciaDias} dias seguidos`}
            </span>
          </div>

          {/* A meta: o total diz de onde você veio, a meta diz o que perseguir. */}
          <div className="rounded-xl border border-white/5 bg-white/5 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold">Meta da semana</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="rounded-lg px-2 py-1 text-[12px] text-white/55 transition-colors hover:bg-white/5 hover:text-white/80"
                    data-testid="button-goal"
                  >
                    {rotuloDaMeta(meta)} ▾
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-white/10 bg-[#1f1f1f] text-white">
                  {METAS_DISPONIVEIS.map((opcao) => (
                    <DropdownMenuItem
                      key={opcao}
                      onClick={() => {
                        setMeta(opcao);
                        setMetaSemanal(opcao);
                      }}
                      className="gap-2 text-[13px] focus:bg-white/10 focus:text-white"
                      data-testid={`goal-${opcao}`}
                    >
                      <Check className={`h-3.5 w-3.5 ${meta === opcao ? "opacity-100" : "opacity-0"}`} />
                      {rotuloDaMeta(opcao)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${progressoDaMeta * 100}%` }}
                data-testid="goal-progress"
              />
            </div>

            <p className="mt-2 text-xs text-white/45">
              {faltaParaMeta === 0 ? (
                <span className="text-primary">
                  Meta batida — {formatarDuracao(resumo.estaSemana)} nos últimos 7 dias.
                </span>
              ) : (
                <>
                  {formatarDuracao(resumo.estaSemana)} nos últimos 7 dias · faltam{" "}
                  <span className="text-white/70">{formatarDuracao(faltaParaMeta)}</span>
                </>
              )}
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/5 p-4">
            <p className="text-center text-sm text-white/55">
              Você ouviu em{" "}
              <span className="font-semibold text-white">
                {semana.filter((dia) => dia.sec > 0).length} dos últimos 7 dias
              </span>
            </p>

            {/* Cada círculo é um dia, com a inicial dele. Preenchido = ouviu. */}
            <div className="mt-4 flex items-start justify-between gap-1.5">
              {semana.map((dia) => {
                const ouviu = dia.sec > 0;
                return (
                  <button
                    key={dia.chave}
                    type="button"
                    onClick={() => setDiaTocado(dia.chave === diaTocado ? null : dia.chave)}
                    className="flex flex-1 flex-col items-center gap-1.5"
                    aria-label={`${dia.chave}: ${formatarDuracao(dia.sec)}`}
                    data-testid={`day-${dia.chave}`}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-transform ${
                        ouviu ? "bg-primary text-black" : "bg-white/[0.07] text-white/35"
                      } ${dia.hoje ? "ring-1 ring-white/60 ring-offset-2 ring-offset-[#1a1a1a]" : ""} ${
                        dia.chave === diaTocado ? "scale-110" : ""
                      }`}
                    >
                      {dia.letra}
                    </span>
                    <span className="text-[10px] leading-none text-white/30">
                      {ouviu ? formatarDuracao(dia.sec).replace("min", "m").replace("h ", "h") : "—"}
                    </span>
                  </button>
                );
              })}
            </div>

            {detalheDoDia && (
              <div
                className="mt-4 border-t border-white/5 pt-3 text-center text-xs"
                data-testid="day-detail"
              >
                <p className="leading-relaxed">
                  <span className="font-medium text-white/80">{detalheDoDia.titulo}</span>
                  <span className="text-white/45"> — {detalheDoDia.texto}</span>
                </p>
              </div>
            )}
          </div>

          {ativos > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { valor: String(ativos), label: "dias com audição" },
                { valor: `${resumo.melhorSequencia} d`, label: "melhor sequência" },
                { valor: formatarDuracao(mediaPorDiaAtivo), label: "média por dia" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-3 text-center"
                >
                  <p className="font-display text-lg font-bold tracking-tight">{item.valor}</p>
                  <p className="mt-0.5 text-[10px] leading-tight text-white/40">{item.label}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 4b. A previsão — a única linha da tela que olha para a frente. */}
        {previsao && (
          <section data-testid="section-forecast">
            <Link href={`/book/${previsao.entrada.book.id}`}>
              <div className="flex items-center gap-3.5 rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/[0.08]">
                <div className="h-[68px] w-12 shrink-0 overflow-hidden rounded-md border border-white/10">
                  <img
                    src={previsao.entrada.book.cover}
                    alt={previsao.entrada.book.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-white/35">No seu ritmo</p>
                  <p className="mt-1 text-sm font-semibold leading-snug">
                    Você termina {previsao.entrada.book.title} em{" "}
                    {previsao.dias === 1 ? "1 dia" : `${previsao.dias} dias`}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/40">
                    {remainingLabel(previsao.entrada.playback)} · média de{" "}
                    {formatarDuracao(previsao.mediaDiaria)} por dia
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-white/25" />
              </div>
            </Link>
          </section>
        )}

        {/* 5. O ritmo: quando você ouve. */}
        {faixas.length > 0 && (
          <section className="space-y-4" data-testid="section-rhythm">
            <h2 className="font-display text-xl font-bold tracking-tight">Quando você ouve</h2>

            <div className="space-y-2.5 rounded-xl border border-white/5 bg-white/5 p-4">
              {faixas.map((item) => (
                <div key={item.faixa} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-xs capitalize text-white/55">{item.faixa}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                    {/* A barra é comparativa: a maior faixa ocupa a linha toda e
                        as outras se medem contra ela. Usar a fração do total
                        deixava tudo curto e indistinguível. */}
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max((item.sec / faixas[0].sec) * 100, 4)}%` }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right text-[11px] text-white/40">
                    {formatarDuracao(item.sec)}
                  </span>
                </div>
              ))}
            </div>

            {diaMaisForte && (
              <p className="text-sm leading-relaxed text-white/45">
                Seu dia mais forte é{" "}
                <span className="font-medium text-white/80">{NOMES_DOS_DIAS[diaMaisForte.indice]}</span>
                , com {formatarDuracao(diaMaisForte.sec)} acumuladas.
              </p>
            )}
          </section>
        )}

        {/* 6. O que você ouve. */}
        {generos.length > 0 && (
          <section className="space-y-4" data-testid="section-taste">
            <h2 className="font-display text-xl font-bold tracking-tight">O que você ouve</h2>

            <div className="space-y-3 rounded-xl border border-white/5 bg-white/5 p-4">
              {generos.map((item) => (
                <Link key={item.genero} href={`/category/${slugify(item.genero)}`}>
                  <div className="group flex items-center gap-3">
                    <span className="w-28 shrink-0 truncate text-xs text-white/55 group-hover:text-white">
                      {item.genero}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                      {/* Comparativa, como em "Quando você ouve": o gênero do
                          topo enche a linha e os outros se medem contra ele. */}
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.max((item.parte / generos[0].parte) * 100, 4)}%` }}
                      />
                    </div>
                    <span className="w-9 shrink-0 text-right text-[11px] text-white/40">
                      {Math.round(item.parte * 100)}%
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { titulo: "Autor mais ouvido", pessoa: autor },
                { titulo: "Narrador mais ouvido", pessoa: narrador },
              ]
                .filter((item) => item.pessoa)
                .map((item) => (
                  <Link key={item.titulo} href={`/person/${slugify(item.pessoa!.nome)}`}>
                    <div className="h-full rounded-xl border border-white/5 bg-white/[0.03] p-3.5 transition-colors hover:bg-white/[0.06]">
                      <p className="text-[10px] uppercase tracking-wider text-white/35">
                        {item.titulo}
                      </p>
                      <p className="mt-1.5 font-display text-sm font-bold leading-snug tracking-tight">
                        {item.pessoa!.nome}
                      </p>
                      <p className="mt-1 text-[11px] text-white/40">
                        {formatarDuracao(item.pessoa!.sec)} · {item.pessoa!.titulos}{" "}
                        {item.pessoa!.titulos === 1 ? "título" : "títulos"}
                      </p>
                    </div>
                  </Link>
                ))}
            </div>

            {livroMaisOuvido && (
              <Link href={`/book/${livroMaisOuvido.livro.id}`}>
                <div className="flex items-center gap-3.5 rounded-xl border border-white/5 bg-white/[0.03] p-3.5 transition-colors hover:bg-white/[0.06]">
                  <div className="h-[68px] w-12 shrink-0 overflow-hidden rounded-md border border-white/10">
                    <img
                      src={livroMaisOuvido.livro.cover}
                      alt={livroMaisOuvido.livro.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-white/35">
                      Livro que mais tomou seu tempo
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold">
                      {livroMaisOuvido.livro.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/40">
                      {formatarDuracao(livroMaisOuvido.sec)} ouvidas
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-white/25" />
                </div>
              </Link>
            )}
          </section>
        )}

        {/* 7. Concluídos, com capa. */}
        {concluidos.length > 0 && (
          <section className="space-y-3" data-testid="section-finished">
            <h2 className="font-display text-xl font-bold tracking-tight">
              {concluidos.length === 1
                ? "Você terminou 1 livro"
                : `Você terminou ${concluidos.length} livros`}
            </h2>
            <div className="scrollbar-hide -mx-5 flex snap-x snap-mandatory scroll-pl-5 gap-3 overflow-x-auto px-5 pb-1">
              {concluidos.map((livro) => (
                <Link
                  key={livro.id}
                  href={`/book/${livro.id}`}
                  className="min-w-[92px] max-w-[92px] snap-start"
                >
                  <div className="aspect-[3/4] overflow-hidden rounded-lg border border-white/10 shadow-lg shadow-black/40">
                    <img src={livro.cover} alt={livro.title} className="h-full w-full object-cover" />
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug">{livro.title}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 8. Conquistas — a grade fica no Perfil; aqui vai o placar. */}
        <section data-testid="section-achievements">
          <Link href="/profile">
            <div className="flex items-center gap-3.5 rounded-xl border border-white/5 bg-white/5 px-4 py-3.5 transition-colors hover:bg-white/[0.08]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Trophy className="h-[18px] w-[18px] text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {conquistadas} de {achievements.length} conquistas
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(conquistadas / achievements.length) * 100}%` }}
                  />
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-white/25" />
            </div>
          </Link>
        </section>

        {/* 9. O rastro na comunidade. */}
        <section className="space-y-3" data-testid="section-community">
          <h2 className="font-display text-xl font-bold tracking-tight">Na comunidade</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { valor: comunidade.comentarios, label: "comentários", href: "/community" },
              {
                valor: comunidade.recomendacoes,
                label: "recomendações",
                href: "/profile/recommendations",
              },
              { valor: comunidade.seguindo, label: "seguindo", href: "/community" },
            ].map((item) => (
              <Link key={item.label} href={item.href}>
                <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-3.5 text-center transition-colors hover:bg-white/[0.06]">
                  <p className="font-display text-xl font-bold tracking-tight">{item.valor}</p>
                  <p className="mt-0.5 text-[10px] leading-tight text-white/40">{item.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <Button
          onClick={compartilhar}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 text-sm font-bold text-white hover:bg-white/15"
          data-testid="button-share-stats"
        >
          <Share2 className="h-4 w-4" />
          Copiar meu resumo
        </Button>

        {resumo.temExemplo && (
          <p className="text-center text-[11px] leading-relaxed text-white/30">
            Parte do histórico é de demonstração, para a tela não nascer vazia. O que você ouvir de
            verdade vai substituindo dia a dia.
          </p>
        )}
      </main>
    </div>
  );
}
