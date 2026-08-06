import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Bell,
  ChevronRight,
  HelpCircle,
  LogIn,
  Lock,
  Settings,
  Share2,
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
import PageHeader from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { readSession, signOut, type Session } from "@/lib/auth";
import { initialOf, readProfile, type Profile } from "@/lib/profile";
import { SEGUIDORES_EVENT, pedidosPendentes } from "@/lib/seguidores";
import { readSettings } from "@/lib/settings";
import { TEMAS, TEMA_EVENT, readTema } from "@/lib/tema";

/**
 * "Configurações" (`/you`) — os ajustes da sua conta.
 *
 * Nasceu em 28/07 (ROTEIRO 4.41) como o painel privado "Você", com duas
 * seções: **Seu conteúdo** e **Conta**. A regra de então é a que continua
 * valendo entre esta tela e o `/profile`: **separar por dono** — a página
 * pública é para quem te visita, esta é para você.
 *
 * **A metade de cima saiu em 05/08 (§4.103), por ordem dele:** *"a gente
 * deveria colocar lá também estatística, conquista e downloads… ele está um
 * pouco escondido hoje"*. Estava: notas, trechos, downloads, estatísticas e
 * conquistas custavam **três toques** (avatar → perfil → engrenagem). Foram
 * todos para o **Menu do hambúrguer**, onde custam dois, de qualquer tela.
 * Nada foi apagado — mudou de porta, e a porta velha fechou (sem duplicar).
 *
 * **A linha de corte:** o Menu leva a **lugares** (páginas que se visita para
 * ver algo seu); esta tela guarda os **ajustes** — conta, privacidade,
 * aparelho, ajuda e sair. Por isso o nome deixou de ser "Você".
 *
 * Segue a sobriedade das listas do app (uma cor de ícone, divisórias finas) —
 * a regra "evitar a cara de IA" do ROTEIRO.
 */

interface LinhaDoPainel {
  icon: LucideIcon;
  label: string;
  hint?: string;
  href?: string;
  /** Ação executada aqui mesmo, para o que não é uma tela. */
  onSelect?: () => void;
}

function GrupoDoPainel({ titulo, items }: { titulo: string; items: LinhaDoPainel[] }) {
  return (
    <section className="px-5" data-testid={`you-group-${titulo.toLowerCase().replace(/ /g, "-")}`}>
      <h2 className="pt-5 pb-1 text-[11px] font-semibold text-white/40 uppercase tracking-wider">
        {titulo}
      </h2>
      <div className="border-b border-white/10">
        {items.map((item) => {
          const Icon = item.icon;
          const content = (
            <>
              <div className="w-9 h-9 rounded-lg bg-white/[0.06] ring-1 ring-white/10 flex items-center justify-center shrink-0">
                <Icon className="w-[18px] h-[18px] text-white/80" strokeWidth={1.8} />
              </div>
              <span className="text-sm flex-1">{item.label}</span>
              {item.hint && <span className="text-sm text-white/30">{item.hint}</span>}
              <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
            </>
          );

          const className =
            "w-full flex items-center gap-4 py-3.5 text-left hover:text-white/70 transition-colors";
          const testId = `you-item-${item.label.toLowerCase().replace(/ /g, "-")}`;

          return item.href ? (
            <Link key={item.label} href={item.href} className={className} data-testid={testId}>
              {content}
            </Link>
          ) : (
            <button key={item.label} onClick={item.onSelect} className={className} data-testid={testId}>
              {content}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function You() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile>(readProfile);
  const [session, setSession] = useState<Session | null>(readSession);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [pedidos, setPedidos] = useState(0);

  useEffect(() => {
    // Relê ao voltar da edição do perfil, que muda nome, foto e e-mail.
    setProfile(readProfile());
    setSession(readSession());
  }, []);

  /* Os pedidos pendentes viram a etiqueta da linha "Privacidade". Relê ao
     montar (quem volta de lá pode ter ligado a tranca) e no evento. */
  useEffect(() => {
    const atualizar = () => setPedidos(pedidosPendentes(readSettings().contaPrivada).length);
    atualizar();
    window.addEventListener(SEGUIDORES_EVENT, atualizar);
    return () => window.removeEventListener(SEGUIDORES_EVENT, atualizar);
  }, []);

  /* O tema em vigor aparece como etiqueta da linha "Neste aparelho" (§4.112).
     É o rastro que ensina onde ele mora: sem isso, "tema" é a coisa que todo
     mundo procura e ninguém acha, porque o nome da porta fala de aparelho. */
  const [tema, setTemaAtual] = useState(readTema);
  useEffect(() => {
    const atualizar = () => setTemaAtual(readTema());
    window.addEventListener(TEMA_EVENT, atualizar);
    window.addEventListener("storage", atualizar);
    return () => {
      window.removeEventListener(TEMA_EVENT, atualizar);
      window.removeEventListener("storage", atualizar);
    };
  }, []);

  /**
   * Convidar alguém para o AllBook — funciona de verdade, sem servidor: quem
   * compartilha é o próprio aparelho (folha nativa; sem ela, copia o texto).
   * Veio do antigo menu do Perfil, intacto.
   */
  async function convidarAmigos() {
    const convite =
      "Estou ouvindo audiolivros em português no AllBook — dá até para pedir um livro que ainda não existe em áudio.";
    const url = window.location.origin;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "AllBook", text: convite, url });
        return;
      } catch {
        // Fechar a folha de compartilhamento não é erro.
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${convite} ${url}`);
      toast({ title: "Convite copiado", description: "Cole onde quiser para chamar alguém." });
    } catch {
      toast({
        title: "Não deu para copiar",
        description: "Seu navegador bloqueou a área de transferência.",
      });
    }
  }

  /** Sair de verdade. Só a sessão cai — lista, downloads e recomendações ficam. */
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

  const conta: LinhaDoPainel[] = [
    { icon: Bell, label: "Notificações", href: "/notifications" },
    /* Uma linha como as outras, e não uma seção aberta (ROTEIRO 4.55). O número
       de pedidos aparece aqui porque é a única pendência do painel que espera
       resposta sua — o resto é ajuste, não fila. */
    /* O nome cresceu junto com a tela (§4.105): ela deixou de ser só
       interruptor de privacidade e passou a ser a lista inteira do perfil —
       foto e bio, o que a página mostra, quem pode te seguir, quando o sino
       toca. "Privacidade" sozinho subestimava o destino. */
    {
      icon: Lock,
      label: "Perfil e privacidade",
      hint: pedidos > 0 ? `${pedidos} pedido${pedidos === 1 ? "" : "s"}` : undefined,
      href: "/privacidade",
    },
    /* Era "Reprodução e download" e prometia o que a tela não entregava: lá
       dentro havia conta, editar perfil e entrar (§4.85). A tela ficou só com o
       que está guardado no aparelho, e o nome passou a dizer isso. */
    {
      icon: Settings,
      label: "Neste aparelho",
      hint: TEMAS.find((t) => t.id === tema)?.nome,
      href: "/settings",
    },
    { icon: Share2, label: "Convidar amigos", onSelect: convidarAmigos },
    { icon: HelpCircle, label: "Ajuda e suporte", href: "/help" },
  ];

  return (
    <div className="min-h-screen pb-24 bg-background text-white" data-testid="you-page">
      <PageHeader title="Configurações" fallback="/profile" />

      {/* Quem você é — e a porta para editar. O e-mail mora aqui, não na página
          pública: é cadastro, não conteúdo. */}
      <section className="px-5 pt-6 pb-5 border-b border-white/10 flex items-center gap-4">
        <Avatar className="w-12 h-12">
          {profile.photo && (
            <AvatarImage src={profile.photo} alt={profile.name} className="object-cover" />
          )}
          <AvatarFallback className="bg-card text-white font-display font-semibold">
            {initialOf(profile.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold font-display tracking-tight truncate" data-testid="you-name">
            {profile.name}
          </p>
          <p className="text-xs text-white/40 truncate mt-0.5">{profile.email}</p>
        </div>
        <Link
          href="/profile/edit"
          className="shrink-0 text-xs font-semibold text-white/70 border border-white/15 rounded-full px-3.5 py-1.5 hover:bg-white/5 transition-colors"
          data-testid="you-edit-profile"
        >
          Editar
        </Link>
      </section>


      {/*
        **A privacidade virou uma linha** (ROTEIRO 4.55). Os interruptores viviam
        expandidos aqui, e o Matheus apontou a inconsistência: todas as outras
        entradas do painel são uma linha com seta que abre outra tela — só esta
        estava aberta no meio, empurrando o resto para baixo. Foram para
        `/privacidade`.

        "Quem te segue" também saiu daqui: foi para a **sua página**, que é onde
        se procura seguidor (mesmo pedido, mesmo dia).
      */}
      <GrupoDoPainel titulo="Conta" items={conta} />

      <div className="px-5">
        {session ? (
          <button
            onClick={() => setConfirmSignOut(true)}
            className="w-full text-left py-5 text-sm text-white/40 hover:text-white/70 transition-colors"
            data-testid="you-logout"
          >
            Sair da conta
          </button>
        ) : (
          <Link
            href="/login"
            className="w-full flex items-center gap-4 py-5 text-sm text-white/40 hover:text-white/70 transition-colors"
            data-testid="you-login"
          >
            <LogIn className="w-4 h-4" />
            Entrar ou criar conta
          </Link>
        )}
      </div>

      <AlertDialog open={confirmSignOut} onOpenChange={setConfirmSignOut}>
        <AlertDialogContent className="max-w-sm bg-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Sua lista, seus downloads e suas recomendações continuam salvos neste aparelho.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-signout">Ficar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut} data-testid="confirm-signout">
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
