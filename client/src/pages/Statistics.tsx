import { ChevronRight, Share2, Trophy, TrendingUp, Headphones, BookOpen, Target, Flame } from "lucide-react";
import { Link } from "wouter";
import PageHeader from "@/components/PageHeader";
import StatSpotlight, { type StatKey } from "@/components/StatSpotlight";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { readLibrary } from "@/lib/library";

export default function Statistics() {
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState("Mensalmente");
  const [openStat, setOpenStat] = useState<StatKey | null>(null);

  // A contagem de títulos vem da biblioteca real (localStorage), a mesma que
  // Perfil e Biblioteca mostram — antes era um "5" escrito à mão que
  // contradizia as outras telas.
  const [libraryCount, setLibraryCount] = useState(0);
  useEffect(() => {
    // lib/library.ts já engole storage corrompido e devolve lista vazia.
    setLibraryCount(readLibrary().length);
  }, []);

  const chartData: Record<string, any[]> = {
    "Hoje": [
      { name: "08:00", hours: 0.5 },
      { name: "12:00", hours: 1.2 },
      { name: "16:00", hours: 0.8 },
      { name: "20:00", hours: 0.3 },
    ],
    "Diariamente": [
      { name: "Seg", hours: 1.5 },
      { name: "Ter", hours: 2.1 },
      { name: "Qua", hours: 1.8 },
      { name: "Qui", hours: 2.5 },
      { name: "Sex", hours: 1.2 },
      { name: "Sáb", hours: 0.5 },
      { name: "Dom", hours: 0.8 },
    ],
    "Mensalmente": [
      { name: "out.", hours: 0 },
      { name: "nov.", hours: 2 },
      { name: "dez.", hours: 2 },
      { name: "jan.", hours: 0 },
      { name: "fev.", hours: 0 },
    ],
    "Total": [
      { name: "2022", hours: 45 },
      { name: "2023", hours: 120 },
      { name: "2024", hours: 85 },
      { name: "2025", hours: 150 },
    ]
  };

  // Mesma chave usada no Perfil: os dois lugares abrem o mesmo painel.
  const quickStats: { icon: typeof Headphones; label: string; value: string; key: StatKey }[] = [
    { icon: Headphones, label: "Horas ouvidas", value: "47h", key: "horas" },
    { icon: BookOpen, label: "Títulos", value: String(libraryCount), key: "titulos" },
    { icon: Flame, label: "Sequência", value: "3 sem.", key: "sequencia" },
    { icon: Target, label: "Concluídos", value: "2", key: "concluidos" },
  ];

  // Copia de verdade — o toast antigo anunciava a cópia sem copiar nada.
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copiado!",
        description: "O link das suas estatísticas foi copiado para a área de transferência.",
      });
    } catch {
      toast({
        title: "Não deu para copiar",
        description: "O navegador bloqueou o acesso à área de transferência.",
      });
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="statistics-page">
      <PageHeader title="Estatísticas" fallback="/profile" />

      <StatSpotlight stat={openStat} onClose={() => setOpenStat(null)} />

      <main className="px-5 py-6 space-y-8">
        <div className="grid grid-cols-2 gap-3">
          {quickStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <button
                key={idx}
                onClick={() => setOpenStat(stat.key)}
                className="bg-white/5 rounded-xl border border-white/5 p-4 space-y-3 text-left hover:bg-white/10 active:scale-95 transition-all duration-150"
                data-testid={`stat-card-${stat.label.toLowerCase().replace(/ /g, '-')}`}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" strokeWidth={2} />
                </div>
                <div>
                  <span className="text-2xl font-bold">{stat.value}</span>
                  <p className="text-[11px] text-white/40 mt-0.5">{stat.label}</p>
                </div>
              </button>
            );
          })}
        </div>

        <section className="space-y-5" data-testid="section-listening-time">
          <h2 className="text-lg font-bold font-display flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            Tempo de escuta
          </h2>
          
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {["Hoje", "Diariamente", "Mensalmente", "Total"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === filter
                    ? "bg-white text-black"
                    : "bg-white/10 text-white/60 hover:bg-white/15"
                }`}
                data-testid={`filter-${filter.toLowerCase()}`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="bg-white/5 rounded-xl border border-white/5 p-5 space-y-4">
            <h3 className="text-center text-xs font-medium text-white/40 uppercase tracking-wider" data-testid="text-chart-title">
              {activeFilter === "Hoje" ? "Horas dedicadas hoje" : 
               activeFilter === "Diariamente" ? "Horas dedicadas por dia" :
               activeFilter === "Mensalmente" ? "Horas dedicadas por mês" :
               "Horas dedicadas por ano"}
            </h3>
            
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData[activeFilter]}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                    dx={-5}
                  />
                  <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                    {chartData[activeFilter].map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.hours > 0 ? "#f59e0b" : "rgba(255,255,255,0.05)"} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <Button 
            onClick={handleShare}
            className="w-full h-11 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white"
            data-testid="button-share-stats"
          >
            <Share2 className="w-4 h-4" />
            Compartilhar estatísticas
          </Button>
        </section>

        <section className="space-y-4" data-testid="section-weekly-stats">
          <h2 className="text-lg font-bold font-display">Sua sequência semanal</h2>
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20 p-6 space-y-5">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center">
                <Trophy className="w-9 h-9 text-amber-500" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold" data-testid="text-streak-count">3 semanas seguidas 🔥</h3>
                <p className="text-sm text-white/50 px-4">
                  Você ouviu pelo menos 1 dia toda semana por 3 semanas desde 24 de nov. de 2025.
                </p>
              </div>
            </div>
            
            <div className="flex justify-center gap-2 pt-2">
              {["S", "T", "Q", "Q", "S", "S", "D"].map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    i < 4 ? "bg-amber-500 text-black" : "bg-white/10 text-white/30"
                  }`}>
                    {i < 4 ? "✓" : day}
                  </div>
                  <span className="text-[9px] text-white/30">{day}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4" data-testid="section-library-count">
          <h2 className="text-lg font-bold font-display">
            {libraryCount === 0
              ? "Sua Biblioteca ainda está vazia"
              : libraryCount === 1
                ? "Você tem 1 título na sua Biblioteca"
                : `Você tem ${libraryCount} títulos na sua Biblioteca`}
          </h2>
          <Link href="/library">
            <div className="bg-white/5 rounded-xl border border-white/5 p-4 flex items-center justify-between hover:bg-white/8 transition-colors cursor-pointer" data-testid="card-library-link">
              <div className="flex items-center gap-4">
                <div className="w-10 h-14 bg-gradient-to-br from-amber-500/30 to-orange-600/30 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-amber-500" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-bold text-sm">Ver Biblioteca</h3>
                  <p className="text-xs text-white/40">Acesse seus audiolivros salvos</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/20" />
            </div>
          </Link>
        </section>
      </main>
    </div>
  );
}
