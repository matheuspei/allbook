import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ChevronRight, LogIn } from "lucide-react";

import PageHeader from "@/components/PageHeader";
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
import { useToast } from "@/hooks/use-toast";
import { readSession, signOut, type Session } from "@/lib/auth";
import { clearPlayback } from "@/lib/playback";
import {
  SPEED_PRESETS,
  formatSpeed,
  readSettings,
  saveSettings,
  type Settings as AppSettings,
} from "@/lib/settings";

/**
 * Configurações (`/settings`).
 *
 * **Só entra aqui o que o app obedece de verdade.** Ficaram de fora, de
 * propósito, os suspeitos de sempre: chave de notificações (não há aviso que
 * chegue de fora), "baixar só no Wi-Fi" (não há download real), tema claro (o
 * app é escuro por decisão de identidade) e idioma (só existe português). Chave
 * que não muda nada é enfeite — o mesmo defeito que fez a primeira versão do
 * Perfil ser rejeitada.
 *
 * O que sobra é honesto: a velocidade com que o player abre, o espaço ocupado
 * neste aparelho e a conta.
 */

/** Chaves do localStorage que a faxina apaga, com o nome que a pessoa reconhece. */
const DATA_KEYS = [
  { key: "allbook_downloads", label: "downloads" },
  { key: "allbook_library", label: "títulos na lista" },
] as const;

type Confirmation = "signOut" | "clearData" | null;

export default function Settings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppSettings>(readSettings);
  const [session, setSession] = useState<Session | null>(readSession);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [confirming, setConfirming] = useState<Confirmation>(null);

  useEffect(() => {
    setSettings(readSettings());
    setSession(readSession());
    setCounts(readCounts());
  }, []);

  function readCounts(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const { key } of DATA_KEYS) {
      try {
        const stored = JSON.parse(localStorage.getItem(key) || "[]");
        result[key] = Array.isArray(stored) ? stored.length : 0;
      } catch {
        result[key] = 0;
      }
    }
    return result;
  }

  function pickSpeed(speed: number) {
    const next = { ...settings, speed };
    setSettings(next);
    saveSettings(next);
  }

  function handleSignOut() {
    signOut();
    setSession(null);
    setConfirming(null);
    toast({
      title: "Você saiu da conta",
      description: "Sua lista e seus downloads continuam neste aparelho.",
    });
  }

  /** Apaga lista, downloads e progresso de escuta. Não mexe no perfil nem na sessão. */
  function handleClearData() {
    for (const { key } of DATA_KEYS) localStorage.removeItem(key);
    clearPlayback();
    setCounts(readCounts());
    setConfirming(null);
    toast({ title: "Dados apagados", description: "Lista, downloads e progresso de escuta voltaram ao zero." });
  }

  const storedTotal = DATA_KEYS.reduce((sum, { key }) => sum + (counts[key] || 0), 0);

  return (
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="settings-page">
      <PageHeader title="Configurações" fallback="/profile" />

      <Section title="Reprodução">
        <p className="text-xs text-white/40 leading-relaxed pb-4">
          A velocidade com que o player começa. Dentro do player dá para mudar a qualquer
          momento — isto é só o ponto de partida.
        </p>
        <div className="flex flex-wrap gap-2 pb-1" data-testid="settings-speed">
          {SPEED_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => pickSpeed(preset)}
              className={`px-3.5 py-2 rounded-lg border text-sm font-medium transition-colors ${
                settings.speed === preset
                  ? "border-primary text-primary bg-primary/10"
                  : "border-white/10 text-white/60 hover:border-white/25 hover:text-white"
              }`}
              data-testid={`settings-speed-${preset}`}
            >
              {formatSpeed(preset)}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Neste aparelho">
        <p className="text-xs text-white/40 leading-relaxed pb-4">
          Sua lista e seus downloads ficam guardados no navegador, não numa conta. Apagar
          aqui não mexe no catálogo do AllBook.
        </p>
        <div className="space-y-1.5 pb-4">
          {DATA_KEYS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-white/60">{label}</span>
              <span className="text-white/40" data-testid={`settings-count-${key}`}>
                {counts[key] || 0}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={() => setConfirming("clearData")}
          disabled={storedTotal === 0}
          className="text-sm text-white/50 hover:text-white disabled:text-white/20 disabled:hover:text-white/20 transition-colors"
          data-testid="button-clear-data"
        >
          Apagar lista e downloads
        </button>
      </Section>

      <Section title="Conta">
        {/*
          Sem sessão não mostramos e-mail nenhum: o do perfil é só um valor
          padrão, e exibi-lo ao lado de "explorando sem conta" faria a tela se
          contradizer.
        */}
        <div className="pb-4">
          {session ? (
            <>
              <p className="text-sm text-white/70" data-testid="settings-account-email">
                {session.email}
              </p>
              <p className="text-xs text-white/30 mt-1">Conta neste navegador</p>
            </>
          ) : (
            <p className="text-sm text-white/50" data-testid="settings-account-email">
              Você está explorando sem conta
            </p>
          )}
        </div>

        <Link
          href="/profile/edit"
          className="w-full flex items-center gap-4 py-3.5 text-left text-sm border-t border-white/10 hover:text-white/70 transition-colors"
          data-testid="settings-item-edit-profile"
        >
          <span className="flex-1">Editar perfil</span>
          <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
        </Link>

        {session ? (
          <button
            onClick={() => setConfirming("signOut")}
            className="w-full py-3.5 text-left text-sm text-white/50 border-t border-white/10 hover:text-white transition-colors"
            data-testid="settings-item-logout"
          >
            Sair da conta
          </button>
        ) : (
          <Link
            href="/login"
            className="w-full flex items-center gap-4 py-3.5 text-left text-sm border-t border-white/10 hover:text-white/70 transition-colors"
            data-testid="settings-item-login"
          >
            <LogIn className="w-[18px] h-[18px] text-white/40 shrink-0" strokeWidth={1.75} />
            <span className="flex-1">Entrar ou criar conta</span>
            <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
          </Link>
        )}
      </Section>

      <div className="px-5 py-8">
        <p className="text-xs text-white/25">AllBook · versão de desenvolvimento</p>
      </div>

      <AlertDialog open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
        <AlertDialogContent className="bg-[#1c1c1c] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display tracking-tight">
              {confirming === "signOut" ? "Sair da conta?" : "Apagar lista e downloads?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              {confirming === "signOut"
                ? "Sua lista, seus downloads e suas recomendações continuam salvos neste aparelho. Só o perfil volta ao padrão."
                : "Os livros que você guardou saem da sua lista e dos downloads. Isso não dá para desfazer."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/15 text-white/80 hover:bg-white/5 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirming === "signOut" ? handleSignOut : handleClearData}
              className="bg-primary text-black hover:bg-primary/90"
              data-testid="button-confirm-settings"
            >
              {confirming === "signOut" ? "Sair" : "Apagar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Bloco com o mesmo título miúdo em caixa alta usado no Perfil. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-5 py-5 border-b border-white/10">
      <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-4">
        {title}
      </h2>
      {children}
    </section>
  );
}
