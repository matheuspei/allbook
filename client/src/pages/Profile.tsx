import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  BarChart3,
  Bell,
  BookOpen,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  Flame,
  HelpCircle,
  LogIn,
  Plus,
  Settings,
  Share2,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import StatSpotlight, { type StatKey } from "@/components/StatSpotlight";
import { useToast } from "@/hooks/use-toast";
import { readSession, signOut, type Session } from "@/lib/auth";
import { initialOf, readProfile, type Profile as UserProfile } from "@/lib/profile";
import { readRecommendations } from "@/lib/recommendations";
import { achievements, unlockedCount, unlockedAchievements, type Achievement } from "@/lib/achievements";
import type { Book } from "@/lib/books";

/**
 * Perfil ("Minha AllBook") — a tela do 4º item do menu inferior.
 *
 * Propositalmente sóbria, no espírito do Audible/Storytel: lista corrida em vez
 * de cartões soltos e ícone de uma cor só em vez de um gradiente por item.
 *
 * As conquistas fogem dessa sobriedade de propósito: eram quatro e discretas,
 * viraram uma grade de medalhas (fonte em `lib/achievements.ts`), com as
 * desbloqueadas na cor da marca — o Matheus quis troféus de verdade, para
 * engajar (ver ROTEIRO). Tocar numa medalha mostra a dica da meta.
 *
 * Os números de audição são os mesmos de `Statistics.tsx` — ainda fixos no
 * código, porque não existe backend. Quando a API existir, os dois lugares
 * passam a ler da mesma fonte.
 */

/** O plano ainda é fixo: não existe assinatura de verdade. */
const PLAN = "Premium";

const summary: { value: string; label: string; key: StatKey; icon: LucideIcon }[] = [
  { value: "47h", label: "ouvidas", key: "horas", icon: Clock },
  { value: "5", label: "títulos", key: "titulos", icon: BookOpen },
  { value: "3 sem.", label: "sequência", key: "sequencia", icon: Flame },
  { value: "2", label: "concluídos", key: "concluidos", icon: CheckCircle2 },
];

export default function Profile() {
  const { toast } = useToast();
  const [libraryCount, setLibraryCount] = useState(0);
  const [downloadCount, setDownloadCount] = useState(0);
  const [openStat, setOpenStat] = useState<StatKey | null>(null);
  const [profile, setProfile] = useState<UserProfile>(readProfile);
  const [recommendations, setRecommendations] = useState<{ book: Book; note: string }[]>(readRecommendations);
  const [session, setSession] = useState<Session | null>(readSession);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  useEffect(() => {
    // Relê ao voltar das telas de edição.
    setProfile(readProfile());
    setRecommendations(readRecommendations());
    setSession(readSession());

    // Mesmas chaves usadas pelas telas Biblioteca e Downloads.
    const savedLibrary = JSON.parse(localStorage.getItem("allbook_library") || "[]");
    const savedDownloads = JSON.parse(localStorage.getItem("allbook_downloads") || "[]");
    setLibraryCount(Array.isArray(savedLibrary) ? savedLibrary.length : 0);
    setDownloadCount(Array.isArray(savedDownloads) ? savedDownloads.length : 0);
  }, []);

  /** Aviso para as opções cujas telas ainda não foram construídas. */
  function comingSoon(label: string) {
    toast({
      title: `${label} em breve`,
      description: "Essa parte do AllBook ainda está sendo construída.",
    });
  }

  /**
   * Sair de verdade. Só a sessão cai: biblioteca, downloads e recomendações
   * ficam onde estão (ver o comentário de `signOut`). O perfil volta ao padrão,
   * por isso relemos os dois logo em seguida.
   */
  function handleSignOut() {
    signOut();
    setSession(null);
    setProfile(readProfile());
    setConfirmSignOut(false);
    toast({
      title: "Você saiu da conta",
      description: "Sua lista e seus downloads continuam neste aparelho.",
    });
  }

  /**
   * Tocar numa medalha mostra o que ela significa. Para as ainda bloqueadas,
   * vira a dica da meta que falta — é o que puxa a pessoa a voltar e engajar.
   */
  function showAchievement(item: Achievement) {
    toast({
      title: item.unlocked ? `🏆 ${item.label}` : `🔒 ${item.label}`,
      description: item.unlocked
        ? item.description
        : `Ainda não conquistada — ${item.description}`,
    });
  }

  // Uma lista só, em duas partes: o que é conteúdo e o que é conta.
  const sections: {
    icon: typeof Bell;
    label: string;
    hint?: string;
    href?: string;
    color: string;
  }[][] = [
    [
      { icon: Bookmark, label: "Minha lista", hint: libraryCount > 0 ? String(libraryCount) : undefined, href: "/library", color: "from-amber-500 to-orange-600" },
      { icon: BarChart3, label: "Estatísticas", href: "/statistics", color: "from-violet-500 to-purple-600" },
      { icon: Download, label: "Downloads", hint: downloadCount > 0 ? String(downloadCount) : undefined, href: "/downloads", color: "from-blue-500 to-cyan-500" },
      { icon: Users, label: "Comunidade", href: "/community", color: "from-rose-500 to-pink-600" },
    ],
    [
      { icon: CreditCard, label: "Plano e assinatura", hint: PLAN, color: "from-emerald-500 to-teal-600" },
      { icon: Bell, label: "Notificações", href: "/notifications", color: "from-red-500 to-rose-600" },
      { icon: Settings, label: "Configurações", href: "/settings", color: "from-slate-500 to-slate-600" },
      { icon: Share2, label: "Convidar amigos", color: "from-fuchsia-500 to-purple-600" },
      { icon: HelpCircle, label: "Ajuda e suporte", color: "from-cyan-500 to-blue-600" },
    ],
  ];

  return (
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="profile-page">
      <header className="relative px-5 pt-8 pb-7 overflow-hidden">
        {/* Brilho da cor da marca no topo — dá o ar "premium" sem pesar. */}
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-primary/25 via-primary/[0.06] to-transparent pointer-events-none" />

        <div className="relative flex items-center gap-4">
          {/* Anel em degradê da marca ao redor do avatar. */}
          <div className="p-[2.5px] rounded-full bg-gradient-to-br from-primary to-amber-400 shrink-0">
            <Avatar className="w-16 h-16 border-2 border-[#141414]">
              {profile.photo && (
                <AvatarImage src={profile.photo} alt={profile.name} className="object-cover" />
              )}
              <AvatarFallback className="bg-[#1e1e1e] text-white font-display font-semibold text-xl">
                {initialOf(profile.name)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-display tracking-tight truncate" data-testid="text-profile-name">
                {profile.name}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold shrink-0">
                {PLAN}
              </span>
            </div>
            <p className="text-sm text-white/40 truncate mt-0.5">{profile.email}</p>
          </div>
        </div>

        {profile.bio && (
          <p className="relative text-sm text-white/60 leading-relaxed mt-4" data-testid="text-profile-bio">
            {profile.bio}
          </p>
        )}

        {/* Troféus estampados — só os conquistados, na cor da marca. */}
        {unlockedAchievements.length > 0 && (
          <div className="relative flex items-center gap-1.5 mt-4 flex-wrap" data-testid="profile-trophies">
            {unlockedAchievements.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  title={item.label}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-md shadow-primary/40 ring-1 ring-primary/40"
                >
                  <Icon className="w-4 h-4 text-white drop-shadow" strokeWidth={2} />
                </div>
              );
            })}
            <span className="text-[11px] text-white/40 ml-1">
              {unlockedAchievements.length} troféus
            </span>
          </div>
        )}

        <Link
          href="/profile/edit"
          className="relative mt-5 w-full flex items-center justify-center py-2.5 rounded-lg border border-white/15 text-sm font-semibold text-white/80 hover:bg-white/5 hover:text-white transition-colors"
          data-testid="button-edit-profile"
        >
          Editar perfil
        </Link>
      </header>

      <section className="px-5 mt-1" data-testid="section-profile-summary">
        <div className="grid grid-cols-4 gap-2">
          {summary.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => setOpenStat(item.key)}
                className="flex flex-col items-center gap-1 rounded-xl bg-white/5 border border-white/10 py-3 transition-colors hover:bg-white/10 active:scale-95 duration-150"
                data-testid={`profile-summary-${item.label}`}
              >
                <Icon className="w-4 h-4 text-primary/80" strokeWidth={2} />
                <p className="text-base font-bold font-display leading-none mt-0.5">{item.value}</p>
                <p className="text-[10px] text-white/40">{item.label}</p>
              </button>
            );
          })}
        </div>
      </section>

      <StatSpotlight stat={openStat} onClose={() => setOpenStat(null)} />

      <section className="px-5 py-5 border-b border-white/10" data-testid="section-profile-recommendations">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
              Recomendo
            </h2>
            <p className="text-[11px] text-white/25 mt-0.5">Visível para a comunidade</p>
          </div>
          <Link
            href="/profile/recommendations"
            className="text-xs font-medium text-primary shrink-0"
            data-testid="link-edit-recommendations"
          >
            {recommendations.length > 0 ? "Editar" : "Montar lista"}
          </Link>
        </div>

        {recommendations.length === 0 ? (
          <Link
            href="/profile/recommendations"
            className="flex items-center gap-3 py-3 text-left"
            data-testid="empty-recommendations"
          >
            <div className="w-11 h-[59px] rounded border border-dashed border-white/15 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4 text-white/25" />
            </div>
            <p className="text-xs text-white/40 leading-relaxed">
              Escolha os livros que você indicaria para alguém.
              <br />
              Eles aparecem no seu perfil, junto do seu nome.
            </p>
          </Link>
        ) : (
          <div className="space-y-3" data-testid="recommendations-row">
            {recommendations.map(({ book, note }) => (
              <Link
                key={book.id}
                href={`/book/${book.id}`}
                className="flex gap-3 group"
                data-testid={`recommendation-${book.id}`}
              >
                <img
                  src={book.cover}
                  alt={book.title}
                  className="w-11 h-[59px] rounded object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                    {book.title}
                  </p>
                  <p className="text-[10px] text-white/40 mt-0.5 line-clamp-1">{book.author}</p>
                  {note && (
                    <p className="text-[11px] text-white/55 leading-snug mt-1 italic">
                      “{note}”
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="px-5 py-5 border-b border-white/10" data-testid="section-profile-achievements">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
            Conquistas
          </h2>
          <span className="text-[11px] text-white/30">
            {unlockedCount} de {achievements.length}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-x-2 gap-y-4">
          {achievements.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => showAchievement(item)}
                className="flex flex-col items-center gap-2 group"
                data-testid={`achievement-${item.id}`}
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                    item.unlocked
                      ? "bg-gradient-to-br from-primary to-orange-600 shadow-lg shadow-primary/30 ring-1 ring-primary/40 group-hover:shadow-primary/50 group-hover:scale-105"
                      : "border border-white/10 border-dashed group-hover:border-white/20"
                  }`}
                >
                  <Icon
                    className={`w-[18px] h-[18px] ${item.unlocked ? "text-white drop-shadow-sm" : "text-white/20"}`}
                    strokeWidth={item.unlocked ? 2 : 1.75}
                  />
                </div>
                <span
                  className={`text-[10px] text-center leading-tight ${
                    item.unlocked ? "text-white/60" : "text-white/25"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <main className="px-5">
        {sections.map((items, sectionIdx) => (
          <div
            key={sectionIdx}
            className="py-2 border-b border-white/10"
            data-testid={`profile-section-${sectionIdx}`}
          >
            {items.map((item) => {
              const Icon = item.icon;

              const content = (
                <>
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-[18px] h-[18px] text-white" strokeWidth={2} />
                  </div>
                  <span className="text-sm flex-1">{item.label}</span>
                  {item.hint && <span className="text-sm text-white/30">{item.hint}</span>}
                  <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
                </>
              );

              const className =
                "w-full flex items-center gap-4 py-3.5 text-left hover:text-white/70 transition-colors";
              const testId = `profile-item-${item.label.toLowerCase().replace(/ /g, "-")}`;

              return item.href ? (
                <Link key={item.label} href={item.href} className={className} data-testid={testId}>
                  {content}
                </Link>
              ) : (
                <button
                  key={item.label}
                  onClick={() => comingSoon(item.label)}
                  className={className}
                  data-testid={testId}
                >
                  {content}
                </button>
              );
            })}
          </div>
        ))}

        {/*
          Quem não tem sessão não vê "Sair" — vê o convite para entrar. O app
          continua aberto sem conta de propósito (decisão registrada no roteiro);
          este é só o caminho para quem quiser entrar.
        */}
        {session ? (
          <button
            onClick={() => setConfirmSignOut(true)}
            className="w-full text-left py-5 text-sm text-white/40 hover:text-white/70 transition-colors"
            data-testid="button-profile-logout"
          >
            Sair da conta
          </button>
        ) : (
          <Link
            href="/login"
            className="w-full flex items-center gap-4 py-5 text-sm text-white/40 hover:text-white/70 transition-colors"
            data-testid="button-profile-login"
          >
            <LogIn className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />
            <span className="flex-1">Entrar ou criar conta</span>
            <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
          </Link>
        )}
      </main>

      <AlertDialog open={confirmSignOut} onOpenChange={setConfirmSignOut}>
        <AlertDialogContent className="bg-[#1c1c1c] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display tracking-tight">
              Sair da conta?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              Sua lista, seus downloads e suas recomendações continuam salvos neste aparelho.
              Só o perfil volta ao padrão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/15 text-white/80 hover:bg-white/5 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignOut}
              className="bg-primary text-black hover:bg-primary/90"
              data-testid="button-confirm-logout"
            >
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
