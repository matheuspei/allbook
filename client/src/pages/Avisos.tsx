import PageHeader from "@/components/PageHeader";
import AjustesDeAviso from "@/components/perfil/AjustesDeAviso";

/**
 * Notificações (`/avisos`) — **os ajustes**, não a caixa de avisos.
 *
 * A rota se chama `/avisos` de propósito: `/notifications` já existe e é a
 * **lista** do sino. Dois endereços parecidos para coisas diferentes seria
 * repetir, na barra de endereço, exatamente a confusão que esta tela veio
 * desfazer (§4.117).
 *
 * ⚠️ O conteúdo não mora aqui — mora em `components/perfil/AjustesDeAviso.tsx`,
 * pelo mesmo motivo que os ajustes do perfil moram no próprio componente: um
 * dia isto também pode abrir como folha por cima de outra tela.
 */
export default function Avisos() {
  return (
    <div className="min-h-screen bg-background pb-24 text-white" data-testid="avisos-page">
      <PageHeader title="Notificações" fallback="/you" />
      <main className="px-5 pb-4">
        <AjustesDeAviso />
      </main>
    </div>
  );
}
