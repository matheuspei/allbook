import { ChevronRight, Share2, Trophy, TrendingUp, Headphones, BookOpen, Target, Flame } from "lucide-react";
import { Link } from "wouter";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Statistics() {
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState("Mensalmente");

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

  const quickStats = [
    { icon: Headphones, label: "Horas ouvidas", value: "47h", color: "from-blue-500 to-cyan-500" },
    { icon: BookOpen, label: "Títulos", value: "5", color: "from-purple-500 to-pink-500" },
    { icon: Flame, label: "Sequência", value: "3 sem.", color: "from-amber-500 to-orange-500" },
    { icon: Target, label: "Completos", value: "2", color: "from-emerald-500 to-teal-500" },
  ];

  const handleShare = () => {
    toast({
      title: "Estatísticas compartilhadas!",
      description: "O link das suas estatísticas foi copiado para a área de transferência.",
    });
  };

  return (
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="statistics-page">
      <PageHeader title="Estatísticas" fallback="/profile" />

      <main className="px-5 py-6 space-y-8">
        <div className="grid grid-cols-2 gap-3">
          {quickStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white/5 rounded-xl border border-white/5 p-4 space-y-3" data-testid={`stat-card-${stat.label.toLowerCase().replace(/ /g, '-')}`}>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-2xl font-bold">{stat.value}</span>
                  <p className="text-[11px] text-white/40 mt-0.5">{stat.label}</p>
                </div>
              </div>
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
          <h2 className="text-lg font-bold font-display">Você tem 5 títulos na sua Biblioteca</h2>
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
