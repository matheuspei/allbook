import PageHeader from "@/components/PageHeader";
import AjustesDoPerfil from "@/components/perfil/AjustesDoPerfil";

/**
 * Perfil e privacidade (`/privacidade`) — **a lista inteira, de cima a baixo**.
 *
 * **Por que virou tela** (§4.55). Estes interruptores viviam expandidos dentro
 * do painel "Você", e o Matheus apontou a inconsistência: *"essa aba de
 * privacidade está muito grande… nas outras ela não está expandida"*. Todas as
 * outras entradas do painel são uma linha com seta que abre outra tela; só a
 * privacidade estava aberta ali no meio, empurrando o resto para baixo.
 *
 * ⚠️ **O que esta tela mostra não mora aqui** — mora em
 * `components/perfil/AjustesDoPerfil.tsx`, e é a **mesma peça** que a folha do
 * lápis abre dentro do perfil. Isso é a §4.105, e é do Matheus: *"a gente faz
 * uma única lista, descendo de cima até embaixo, de todas essas coisas"*.
 *
 * Antes daquele pedido, esta tela tinha uma **placa** no meio da lista mandando
 * a pessoa para o lápis do perfil (§4.95) — e o lápis tinha uma porta mandando
 * de volta para cá. Ela chamou isso pelo nome: *"a gente clica e vai para outro
 * menu, para outra página, para outra coisa. Não faz muito sentido."* As duas
 * placas morreram: não há mais para onde pingar, porque os dois caminhos chegam
 * na lista completa.
 *
 * **O título mudou junto** — "Privacidade" mentia sobre uma lista que também
 * tem foto, bio e recomendações. O endereço continua `/privacidade`, que é o
 * que o resto do app já linka.
 */
export default function Privacidade() {
  return (
    <div className="min-h-screen bg-[#141414] pb-24 text-white" data-testid="privacidade-page">
      <PageHeader title="Perfil e privacidade" fallback="/you" />
      <main className="px-5 pb-4">
        <AjustesDoPerfil />
      </main>
    </div>
  );
}
