import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

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
import { clearPlayback } from "@/lib/playback";

/**
 * **Neste aparelho** (`/settings`) — o que o AllBook guarda no seu navegador.
 *
 * **Só entra aqui o que o app obedece de verdade.** Ficaram de fora, de
 * propósito, os suspeitos de sempre: chave de notificações (não há aviso que
 * chegue de fora), "baixar só no Wi-Fi" (não há download real), tema claro (o
 * app é escuro por decisão de identidade) e idioma (só existe português). Chave
 * que não muda nada é enfeite — o mesmo defeito que fez a primeira versão do
 * Perfil ser rejeitada.
 *
 * ---
 *
 * ⚠️ **Esvaziada em 31/07 (§4.85), e o motivo é do Matheus:** *"quando você vai
 * em perfil e clica em reprodução e download, tem muita coisa nessa página que é
 * ruim. A configuração de reprodução não faz sentido, você já muda isso no
 * player. E ter editar conta aqui não faz sentido — nem entrar ou criar
 * conta."*
 *
 * Ele está certo nas duas, e as duas saíram:
 *
 * - **A velocidade** virou responsabilidade do player, que agora **lembra** a
 *   que você escolheu (antes ele esquecia, e era por isso que existia um ajuste
 *   aqui). Duas telas para a mesma decisão é uma a mais.
 * - **Conta, editar perfil e entrar** eram de outro assunto. Já moram no painel
 *   `/you`, na seção "Conta", e no lápis do perfil — aqui só faziam a porta
 *   mentir sobre o destino.
 *
 * O que sobra é o que o nome promete: **o espaço ocupado neste aparelho**.
 */

/** Chaves do localStorage que a faxina apaga, com o nome que a pessoa reconhece. */
const DATA_KEYS = [
  { key: "allbook_downloads", label: "downloads" },
  { key: "allbook_library", label: "títulos na lista" },
] as const;

export default function Settings() {
  const { toast } = useToast();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
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

  /** Apaga lista, downloads e progresso de escuta. Não mexe no perfil nem na sessão. */
  function handleClearData() {
    for (const { key } of DATA_KEYS) localStorage.removeItem(key);
    clearPlayback();
    setCounts(readCounts());
    setConfirmando(false);
    toast({ title: "Dados apagados", description: "Lista, downloads e progresso de escuta voltaram ao zero." });
  }

  const storedTotal = DATA_KEYS.reduce((sum, { key }) => sum + (counts[key] || 0), 0);

  return (
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="settings-page">
      <PageHeader title="Neste aparelho" fallback="/you" />

      <Section title="O que está guardado">
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
          onClick={() => setConfirmando(true)}
          disabled={storedTotal === 0}
          className="text-sm text-white/50 hover:text-white disabled:text-white/20 disabled:hover:text-white/20 transition-colors"
          data-testid="button-clear-data"
        >
          Apagar lista e downloads
        </button>
      </Section>

      {/* A porta para o que está baixado — quem chega aqui querendo mexer nos
          downloads quer ver quais são, não só o número. */}
      <Section title="Os arquivos">
        <Link
          href="/downloads"
          className="flex w-full items-center gap-4 py-1 text-left text-sm transition-colors hover:text-white/70"
          data-testid="settings-item-downloads"
        >
          <span className="flex-1">Ver os títulos baixados</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-white/20" />
        </Link>
      </Section>

      {/* Conta saiu daqui em 31/07 (§4.85) — mora no painel `/you`. A linha
          abaixo existe para quem veio procurar aqui não achar que ela sumiu. */}
      <div className="px-5 pt-5">
        <p className="text-xs leading-relaxed text-white/30">
          Conta, perfil e privacidade ficam em{" "}
          <Link href="/you" className="font-semibold text-primary">
            Configurações
          </Link>
          .
        </p>
      </div>

      <div className="px-5 py-8">
        <p className="text-xs text-white/25">AllBook · versão de desenvolvimento</p>
      </div>

      <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
        <AlertDialogContent className="bg-[#1c1c1c] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display tracking-tight">
              Apagar lista e downloads?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              Os livros que você guardou saem da sua lista e dos downloads. Isso não dá para
              desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/15 text-white/80 hover:bg-white/5 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearData}
              className="bg-primary text-black hover:bg-primary/90"
              data-testid="button-confirm-settings"
            >
              Apagar
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
