import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Check, ChevronRight } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { TEMAS, readTema, setTema, type Tema } from "@/lib/tema";
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
 * chegue de fora), "baixar só no Wi-Fi" (não há download real) e idioma (só
 * existe português). Chave que não muda nada é enfeite — o mesmo defeito que
 * fez a primeira versão do Perfil ser rejeitada.
 *
 * **O tema entrou em 06/08 (§4.112), e era justamente um dos que estavam
 * proibidos aqui:** o app era escuro por decisão de identidade, então um botão
 * de tema claro seria enfeite. Deixou de ser quando ele escolheu a direção
 * "Estúdio" **e** pediu a "Tinta" como alternativa — agora são duas identidades
 * de verdade, e a escolha muda o app inteiro.
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
  const [tema, setTemaAtual] = useState<Tema>(readTema);

  useEffect(() => {
    setCounts(readCounts());
  }, []);

  /** Troca o tema na hora — a tela inteira se repinta enquanto o dedo ainda está nela. */
  function escolherTema(novo: Tema) {
    setTema(novo);
    setTemaAtual(novo);
  }

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
    <div className="min-h-screen pb-24 bg-background text-white" data-testid="settings-page">
      <PageHeader title="Neste aparelho" fallback="/you" />

      {/* A aparência vem primeiro porque é o ajuste que a pessoa vê mudar na
          hora — e porque é o único aqui que muda o app inteiro. */}
      <Section title="Aparência">
        <div className="grid grid-cols-2 gap-3">
          {TEMAS.map((opcao) => {
            const escolhido = tema === opcao.id;
            return (
              <button
                key={opcao.id}
                onClick={() => escolherTema(opcao.id)}
                data-testid={`settings-tema-${opcao.id}`}
                aria-pressed={escolhido}
                className={cn(
                  "rounded-xl border p-2 text-left transition-colors",
                  escolhido
                    ? "border-primary bg-primary/[0.07]"
                    : "border-white/10 hover:border-white/25",
                )}
              >
                <MiniaturaDoTema tema={opcao.id} />
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-sm font-semibold">{opcao.nome}</span>
                  {escolhido && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                </div>
                <p className="mt-0.5 text-xs leading-snug text-white/40">{opcao.descricao}</p>
              </button>
            );
          })}
        </div>
      </Section>

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
        <AlertDialogContent className="bg-card border-white/10 text-white">
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

/**
 * As cores das duas miniaturas, escritas à mão **de propósito**: cada quadradinho
 * mostra um tema que pode não ser o que está em vigor, então ele não pode usar
 * os tokens da página — senão os dois sairiam iguais. São os mesmos valores do
 * `index.css`; mudou lá, muda aqui.
 */
const CORES_DA_MINIATURA: Record<Tema, { fundo: string; superficie: string; tinta: string; acento: string }> = {
  escuro: { fundo: "#121110", superficie: "#1C1A18", tinta: "#F5F1EA", acento: "#FF4438" },
  claro: { fundo: "#F4EFE6", superficie: "#FFFDF9", tinta: "#1A1712", acento: "#C1362F" },
};

/** Um retratinho da tela Início em cada tema — ele escolhe vendo, não lendo. */
function MiniaturaDoTema({ tema }: { tema: Tema }) {
  const cor = CORES_DA_MINIATURA[tema];
  return (
    <div
      className="overflow-hidden rounded-lg p-2"
      style={{ background: cor.fundo }}
      aria-hidden="true"
    >
      {/* o topo: hambúrguer e marca */}
      <div className="flex items-center gap-1">
        <div className="flex flex-col gap-[1.5px]">
          {[0, 1, 2].map((i) => (
            <span key={i} className="block h-[1.5px] w-2 rounded-full" style={{ background: cor.tinta, opacity: 0.7 }} />
          ))}
        </div>
        <span className="h-1.5 w-6 rounded-full" style={{ background: cor.tinta, opacity: 0.85 }} />
      </div>

      {/* a capa em destaque e duas linhas de texto */}
      <div className="mt-2 flex gap-1.5">
        <span className="h-9 w-6 rounded" style={{ background: cor.acento, opacity: 0.85 }} />
        <div className="flex-1 space-y-1 pt-0.5">
          <span className="block h-1.5 w-full rounded-full" style={{ background: cor.tinta, opacity: 0.8 }} />
          <span className="block h-1 w-2/3 rounded-full" style={{ background: cor.tinta, opacity: 0.35 }} />
          <span
            className="mt-1.5 block h-2.5 w-10 rounded-full"
            style={{ background: cor.acento }}
          />
        </div>
      </div>

      {/* a fileira de livros */}
      <div className="mt-2 flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-5 flex-1 rounded-sm"
            style={{ background: cor.superficie, border: `1px solid ${cor.tinta}1f` }}
          />
        ))}
      </div>
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
