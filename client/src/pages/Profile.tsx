import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Bell,
  BarChart3,
  Bookmark,
  ChevronRight,
  CreditCard,
  Download,
  HelpCircle,
  Settings,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

/**
 * Perfil ("Minha AllBook") — a tela do 4º item do menu inferior.
 *
 * Propositalmente sóbria, no espírito do Audible/Storytel: lista corrida em vez
 * de cartões soltos, ícone de uma cor só em vez de gradiente por item, e a cor
 * de destaque guardada para o que realmente importa. Nada de gamificação.
 *
 * Os números de audição são os mesmos de `Statistics.tsx` — ainda fixos no
 * código, porque não existe backend. Quando a API existir, os dois lugares
 * passam a ler da mesma fonte.
 */

const user = {
  name: "Matheus",
  email: "matheus@allbook.com.br",
  initial: "M",
  plan: "Premium",
};

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

  const summary = [
    { value: "47h", label: "ouvidas" },
    { value: "5", label: "títulos" },
    { value: "2", label: "concluídos" },
  ];

  // Uma lista só, em duas partes: o que é conteúdo e o que é conta.
  const sections: {
    items: {
      icon: typeof Bell;
      label: string;
      hint?: string;
      href?: string;
    }[];
  }[] = [
    {
      items: [
        { icon: Bookmark, label: "Minha lista", hint: libraryCount > 0 ? String(libraryCount) : undefined, href: "/library" },
        { icon: BarChart3, label: "Estatísticas", href: "/statistics" },
        { icon: Download, label: "Downloads", hint: downloadCount > 0 ? String(downloadCount) : undefined },
      ],
    },
    {
      items: [
        { icon: CreditCard, label: "Plano e assinatura", hint: user.plan },
        { icon: Bell, label: "Notificações" },
        { icon: Settings, label: "Configurações" },
        { icon: HelpCircle, label: "Ajuda e suporte" },
      ],
    },
  ];

  return (
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="profile-page">
      <header className="px-5 pt-8 pb-7">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarFallback className="bg-white/10 text-white font-display font-semibold text-xl">
              {user.initial}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold font-display tracking-tight" data-testid="text-profile-name">
              {user.name}
            </h1>
            <p className="text-sm text-white/40 truncate mt-0.5">{user.email}</p>
          </div>

          <button
            onClick={() => comingSoon("Editar perfil")}
            className="text-xs font-medium text-white/50 hover:text-white transition-colors shrink-0"
            data-testid="button-edit-profile"
          >
            Editar
          </button>
        </div>
      </header>

      <section className="px-5" data-testid="section-profile-summary">
        <div className="flex items-center border-y border-white/10 py-5">
          {summary.map((item, idx) => (
            <div
              key={item.label}
              className={`flex-1 text-center ${idx > 0 ? "border-l border-white/10" : ""}`}
              data-testid={`profile-summary-${item.label}`}
            >
              <p className="text-lg font-bold font-display leading-none">{item.value}</p>
              <p className="text-[11px] text-white/40 mt-1.5">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <main className="px-5">
        {sections.map((section, sectionIdx) => (
          <div
            key={sectionIdx}
            className="py-2 border-b border-white/10"
            data-testid={`profile-section-${sectionIdx}`}
          >
            {section.items.map((item) => {
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
