import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  BarChart3,
  Bell,
  BookOpen,
  Bookmark,
  ChevronRight,
  CreditCard,
  Download,
  Flame,
  Headphones,
  HelpCircle,
  Plus,
  Settings,
  Share2,
  Trophy,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StatSpotlight, { type StatKey } from "@/components/StatSpotlight";
import { useToast } from "@/hooks/use-toast";
import { initialOf, readProfile, type Profile as UserProfile } from "@/lib/profile";
import { readRecommendations } from "@/lib/recommendations";
import type { Book } from "@/lib/books";

/**
 * Perfil ("Minha AllBook") — a tela do 4º item do menu inferior.
 *
 * Propositalmente sóbria, no espírito do Audible/Storytel: lista corrida em vez
 * de cartões soltos e ícone de uma cor só em vez de um gradiente por item. As
 * conquistas existem, mas discretas — uma fileira, sem medalha colorida.
 *
 * Os números de audição são os mesmos de `Statistics.tsx` — ainda fixos no
 * código, porque não existe backend. Quando a API existir, os dois lugares
 * passam a ler da mesma fonte.
 */

/** O plano ainda é fixo: não existe assinatura de verdade. */
const PLAN = "Premium";

const summary: { value: string; label: string; key: StatKey }[] = [
  { value: "47h", label: "ouvidas", key: "horas" },
  { value: "5", label: "títulos", key: "titulos" },
  { value: "3 sem.", label: "sequência", key: "sequencia" },
  { value: "2", label: "concluídos", key: "concluidos" },
];

const achievements = [
  { icon: Flame, label: "Constante", unlocked: true },
  { icon: BookOpen, label: "Maratonista", unlocked: true },
  { icon: Headphones, label: "Coruja", unlocked: true },
  { icon: Trophy, label: "Centenário", unlocked: false },
];

export default function Profile() {
  const { toast } = useToast();
  const [libraryCount, setLibraryCount] = useState(0);
  const [downloadCount, setDownloadCount] = useState(0);
  const [openStat, setOpenStat] = useState<StatKey | null>(null);
  const [profile, setProfile] = useState<UserProfile>(readProfile);
  const [recommendations, setRecommendations] = useState<Book[]>(readRecommendations);

  useEffect(() => {
    // Relê ao voltar das telas de edição.
    setProfile(readProfile());
    setRecommendations(readRecommendations());

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

  const unlockedCount = achievements.filter((item) => item.unlocked).length;

  // Uma lista só, em duas partes: o que é conteúdo e o que é conta.
  const sections: {
    icon: typeof Bell;
    label: string;
    hint?: string;
    href?: string;
  }[][] = [
    [
      { icon: Bookmark, label: "Minha lista", hint: libraryCount > 0 ? String(libraryCount) : undefined, href: "/library" },
      { icon: BarChart3, label: "Estatísticas", href: "/statistics" },
      { icon: Download, label: "Downloads", hint: downloadCount > 0 ? String(downloadCount) : undefined, href: "/downloads" },
      { icon: Users, label: "Comunidade", href: "/community" },
    ],
    [
      { icon: CreditCard, label: "Plano e assinatura", hint: PLAN },
      { icon: Bell, label: "Notificações", href: "/notifications" },
      { icon: Settings, label: "Configurações" },
      { icon: Share2, label: "Convidar amigos" },
      { icon: HelpCircle, label: "Ajuda e suporte" },
    ],
  ];

  return (
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="profile-page">
      <header className="px-5 pt-8 pb-7">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 shrink-0">
            {profile.photo && (
              <AvatarImage src={profile.photo} alt={profile.name} className="object-cover" />
            )}
            <AvatarFallback className="bg-white/10 text-white font-display font-semibold text-xl">
              {initialOf(profile.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold font-display tracking-tight" data-testid="text-profile-name">
              {profile.name}
            </h1>
            <p className="text-sm text-white/40 truncate mt-0.5">{profile.email}</p>
          </div>
        </div>

        {profile.bio && (
          <p className="text-sm text-white/60 leading-relaxed mt-4" data-testid="text-profile-bio">
            {profile.bio}
          </p>
        )}

        <Link
          href="/profile/edit"
          className="mt-5 w-full flex items-center justify-center py-2.5 rounded-lg border border-white/15 text-sm font-semibold text-white/80 hover:bg-white/5 hover:text-white transition-colors"
          data-testid="button-edit-profile"
        >
          Editar perfil
        </Link>
      </header>

      <section className="px-5" data-testid="section-profile-summary">
        <div className="flex items-center border-y border-white/10 py-5">
          {summary.map((item, idx) => (
            <button
              key={item.label}
              onClick={() => setOpenStat(item.key)}
              className={`flex-1 text-center transition-opacity hover:opacity-60 active:scale-95 duration-150 ${
                idx > 0 ? "border-l border-white/10" : ""
              }`}
              data-testid={`profile-summary-${item.label}`}
            >
              <p className="text-base font-bold font-display leading-none">{item.value}</p>
              <p className="text-[11px] text-white/40 mt-1.5">{item.label}</p>
            </button>
          ))}
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
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1" data-testid="recommendations-row">
            {recommendations.map((book) => (
              <Link
                key={book.id}
                href={`/book/${book.id}`}
                className="w-[68px] shrink-0"
                data-testid={`recommendation-${book.id}`}
              >
                <img
                  src={book.cover}
                  alt={book.title}
                  className="w-full aspect-[3/4] rounded object-cover"
                />
                <p className="text-[10px] text-white/50 leading-tight line-clamp-2 mt-1.5">
                  {book.title}
                </p>
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

        <div className="flex items-start justify-between gap-2">
          {achievements.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex-1 flex flex-col items-center gap-2"
                data-testid={`achievement-${item.label.toLowerCase()}`}
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center border ${
                    item.unlocked ? "border-white/15 bg-white/5" : "border-white/5 border-dashed"
                  }`}
                >
                  <Icon
                    className={`w-[18px] h-[18px] ${item.unlocked ? "text-white/70" : "text-white/15"}`}
                    strokeWidth={1.75}
                  />
                </div>
                <span
                  className={`text-[10px] text-center leading-tight ${
                    item.unlocked ? "text-white/50" : "text-white/20"
                  }`}
                >
                  {item.label}
                </span>
              </div>
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
                  <Icon className="w-[18px] h-[18px] text-white/40 shrink-0" strokeWidth={1.75} />
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

        <button
          onClick={() => comingSoon("Sair da conta")}
          className="w-full text-left py-5 text-sm text-white/40 hover:text-white/70 transition-colors"
          data-testid="button-profile-logout"
        >
          Sair da conta
        </button>
      </main>
    </div>
  );
}
