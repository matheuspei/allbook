import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Bell,
  BookOpen,
  ChevronRight,
  CreditCard,
  Crown,
  Download,
  Flame,
  Headphones,
  HelpCircle,
  LogOut,
  Pencil,
  Settings,
  Share2,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

/**
 * Perfil ("Minha AllBook") — a tela que o 4º item do menu inferior promete.
 * Reúne quem é a pessoa, um resumo do que ela ouviu, as conquistas e os
 * ajustes da conta.
 *
 * Os números de audição são os mesmos que aparecem em `Statistics.tsx` — ainda
 * são fixos no código, porque não existe backend. Quando a API existir, os dois
 * lugares passam a ler da mesma fonte.
 */

const user = {
  name: "Matheus",
  email: "matheus@allbook.com.br",
  initial: "M",
  memberSince: "março de 2025",
  plan: "Premium",
};

const listeningStats = [
  { icon: Headphones, label: "Horas ouvidas", value: "47h", color: "from-blue-500 to-cyan-500" },
  { icon: BookOpen, label: "Títulos", value: "5", color: "from-purple-500 to-pink-500" },
  { icon: Flame, label: "Sequência", value: "3 sem.", color: "from-amber-500 to-orange-500" },
  { icon: Target, label: "Completos", value: "2", color: "from-emerald-500 to-teal-500" },
];

const achievements = [
  { icon: Flame, label: "Constante", description: "3 semanas seguidas ouvindo", unlocked: true },
  { icon: BookOpen, label: "Maratonista", description: "2 audiolivros terminados", unlocked: true },
  { icon: Headphones, label: "Meia-noite", description: "Ouvir depois das 00h", unlocked: true },
  { icon: Trophy, label: "Centenário", description: "100 horas ouvidas", unlocked: false },
];

export default function Profile() {
  const { toast } = useToast();
  const [libraryCount, setLibraryCount] = useState(0);
  const [downloadCount, setDownloadCount] = useState(0);

  useEffect(() => {
    // Mesmas chaves usadas pela tela Biblioteca.
    const savedLibrary = JSON.parse(localStorage.getItem("allbook_library") || "[]");
    const savedDownloads = JSON.parse(localStorage.getItem("allbook_downloads") || "[]");
    setLibraryCount(savedLibrary.length);
    setDownloadCount(savedDownloads.length);
  }, []);

  /** Aviso para as opções cujas telas ainda não foram construídas. */
  function comingSoon(label: string) {
    toast({
      title: `${label} em breve`,
      description: "Essa parte do AllBook ainda está sendo construída.",
    });
  }

  const accountItems = [
    { icon: CreditCard, label: "Plano e assinatura", hint: user.plan, color: "from-amber-500 to-orange-500" },
    { icon: Download, label: "Downloads", hint: `${downloadCount}`, color: "from-blue-500 to-cyan-500" },
    { icon: Bell, label: "Notificações", hint: null, color: "from-purple-500 to-pink-500" },
    { icon: Settings, label: "Configurações", hint: null, color: "from-slate-500 to-slate-400" },
    { icon: HelpCircle, label: "Ajuda e suporte", hint: null, color: "from-emerald-500 to-teal-500" },
  ];

  return (
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="profile-page">
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <Avatar className="w-20 h-20 border-2 border-primary/30">
              <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white font-display font-bold text-2xl">
                {user.initial}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => comingSoon("Editar perfil")}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-[#141414] hover:opacity-90 transition-opacity"
              aria-label="Editar perfil"
              data-testid="button-edit-profile"
            >
              <Pencil className="w-3.5 h-3.5 text-black" />
            </button>
          </div>

          <div className="flex-1 min-w-0 pt-1">
            <h1 className="text-2xl font-bold font-display tracking-tight" data-testid="text-profile-name">
              {user.name}
            </h1>
            <p className="text-sm text-white/50 truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-primary/20 text-primary border-none text-[10px] px-2 gap-1">
                <Crown className="w-3 h-3" />
                {user.plan}
              </Badge>
              <span className="text-[11px] text-white/30">Desde {user.memberSince}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="px-5 space-y-8">
        <section className="space-y-4" data-testid="section-profile-stats">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display">Sua audição</h2>
            <Link
              href="/statistics"
              className="flex items-center gap-1 text-xs text-white/50 hover:text-primary transition-colors"
              data-testid="link-profile-statistics"
            >
              Ver tudo
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {listeningStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="bg-white/5 rounded-xl border border-white/5 p-4 space-y-3"
                  data-testid={`profile-stat-${stat.label.toLowerCase().replace(/ /g, "-")}`}
                >
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xl font-bold font-display leading-none">{stat.value}</p>
                    <p className="text-xs text-white/40 mt-1">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-4" data-testid="section-profile-library">
          <h2 className="text-lg font-bold font-display">Minha lista</h2>
          <Link href="/library">
            <div
              className="bg-white/5 rounded-xl border border-white/5 p-4 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-colors"
              data-testid="card-profile-library"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm">
                    {libraryCount === 0
                      ? "Nenhum título salvo"
                      : `${libraryCount} ${libraryCount === 1 ? "título salvo" : "títulos salvos"}`}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {libraryCount === 0 ? "Explore o catálogo e salve o que quiser ouvir" : "Abrir minha lista"}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-primary transition-colors" />
            </div>
          </Link>
        </section>

        <section className="space-y-4" data-testid="section-profile-achievements">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display">Conquistas</h2>
            <span className="text-xs text-white/40">
              {achievements.filter((a) => a.unlocked).length} de {achievements.length}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <div
                  key={achievement.label}
                  className={`rounded-xl border p-4 space-y-2 ${
                    achievement.unlocked
                      ? "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20"
                      : "bg-white/[0.03] border-white/5"
                  }`}
                  data-testid={`achievement-${achievement.label.toLowerCase()}`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      achievement.unlocked ? "bg-amber-500/20" : "bg-white/5"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${achievement.unlocked ? "text-amber-500" : "text-white/20"}`} />
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${achievement.unlocked ? "text-white" : "text-white/40"}`}>
                      {achievement.label}
                    </p>
                    <p className="text-[11px] text-white/40 leading-snug mt-0.5">{achievement.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-3" data-testid="section-profile-account">
          <h2 className="text-lg font-bold font-display">Conta</h2>

          {accountItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => comingSoon(item.label)}
                className="w-full bg-white/5 rounded-xl border border-white/5 p-4 flex items-center justify-between group hover:bg-white/10 transition-colors text-left"
                data-testid={`profile-item-${item.label.toLowerCase().replace(/ /g, "-")}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-sm">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.hint && <span className="text-white/40 text-sm">{item.hint}</span>}
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-primary transition-colors" />
                </div>
              </button>
            );
          })}
        </section>

        <section className="space-y-3" data-testid="section-profile-actions">
          <button
            onClick={() => comingSoon("Convidar amigos")}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-sm font-bold text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            data-testid="button-profile-invite"
          >
            <Share2 className="w-4 h-4" />
            Convidar amigos
          </button>

          <button
            onClick={() => comingSoon("Sair da conta")}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            data-testid="button-profile-logout"
          >
            <LogOut className="w-4 h-4" />
            Sair da conta
          </button>

          <p className="text-center text-[11px] text-white/20 pt-2 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            AllBook · versão de desenvolvimento
          </p>
        </section>
      </main>
    </div>
  );
}
