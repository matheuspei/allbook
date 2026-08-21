import { Mic } from "lucide-react";
import { useLocation } from "wouter";

/**
 * O que aparece quando **não há um livro sequer** no catálogo.
 *
 * Isto nasceu em 21/08, quando as 63 maquetes foram apagadas para o acervo de
 * verdade entrar (§4.134): pela primeira vez o app foi aberto com o catálogo
 * vazio, e o que se viu foi esqueleto — um retângulo preto de 600px onde ficava
 * o destaque, oito cartões de coleção sem capa e cinco fileiras com título e
 * "Ver tudo" sem nada dentro. Nenhum erro, nenhuma explicação: só vazio.
 *
 * **Não é uma tela de erro, e é de propósito que ela não peça desculpa.** Sem
 * catálogo, o AllBook não fica sem o que oferecer — fica exatamente com aquilo
 * que o distingue de qualquer outra loja: narrar sob demanda o livro que ainda
 * não existe em áudio (ROTEIRO §4.17). Por isso o vazio leva direto ao pedido,
 * em vez de mandar a pessoa "voltar mais tarde".
 *
 * ⚠️ Ela vale para o catálogo **inteiro** vazio. Lista específica sem itens
 * (uma coleção, um gênero, a biblioteca) não usa isto: some da tela, e quem faz
 * isso são as guardas de `Home.tsx` — fileira sem livro não se desenha.
 */
export default function CatalogoVazio({
  titulo = "O catálogo está sendo montado",
  descricao = "As narrações estão a caminho. Enquanto isso, você já pode dizer qual livro quer ouvir — e o AllBook produz.",
}: {
  titulo?: string;
  descricao?: string;
}) {
  const [, setLocation] = useLocation();

  return (
    <section
      className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-8 text-center"
      data-testid="catalogo-vazio"
    >
      {/* Pastilha com a cor cheia, não esmaecida: no tema claro `bg-primary/15`
          vira rosa-bebê sobre o papel (§4.116). */}
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <Mic className="h-6 w-6" />
      </span>

      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold text-white">{titulo}</h2>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-white/60">
          {descricao}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setLocation("/request")}
        className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
        data-testid="botao-pedir-do-vazio"
      >
        Pedir uma narração
      </button>
    </section>
  );
}
