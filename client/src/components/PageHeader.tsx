import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useCabecalhoRecolhido } from "@/hooks/use-cabecalho-recolhido";

/**
 * Cabeçalho das telas internas: seta de voltar + título.
 *
 * O voltar usa o histórico do navegador em vez de um destino fixo no código.
 * Assim ele devolve a pessoa exatamente para onde ela estava — quem entrou em
 * Estatísticas pelo Perfil volta ao Perfil, quem entrou pela Biblioteca volta à
 * Biblioteca. Fixar o destino era o que fazia o botão "voltar" mentir.
 *
 * `fallback` só é usado quando não há histórico (a pessoa abriu a URL direto).
 */
export default function PageHeader({
  title,
  fallback = "/",
  action,
}: {
  title: string;
  fallback?: string;
  action?: React.ReactNode;
}) {
  const [, setLocation] = useLocation();
  // Quando o TopNav se recolhe (§4.106), este cabeçalho sobe junto para o
  // lugar dele — senão ficava um vão de 56px com o conteúdo passando dentro.
  const recolhido = useCabecalhoRecolhido();

  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation(fallback);
    }
  }

  return (
    <header
      /**
       * O deslocamento tem de bater com a altura do `TopNav`: uma fileira só,
       * 56px (h-14), em qualquer largura. Já houve uma segunda fileira de links
       * em telas estreitas (88px no total) — ela se foi, e o `top-[88px]` que
       * ficou para trás abria um vão de 32px no celular por onde o conteúdo
       * aparecia ao rolar.
       */
      // Fundo fechado (§4.104): a 95% o conteúdo rolado transparecia por trás.
      className={`sticky z-30 bg-[#141414] border-b border-white/5 transition-[top] duration-300 ${
        recolhido ? "top-0" : "top-14"
      }`}
      data-testid="page-header"
    >
      <div className="flex items-center gap-3 px-4 h-14">
        <button
          onClick={goBack}
          className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Voltar"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold font-display tracking-tight flex-1 line-clamp-1">
          {title}
        </h1>
        {action}
      </div>
    </header>
  );
}
