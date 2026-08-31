import { useRef, useState } from "react";
import { ImagePlus, Search, X } from "lucide-react";

import { CAMPO, CapaDoTopico, LinkDoForum } from "@/components/forum/Pecas";
import { useToast } from "@/hooks/use-toast";
import { catalog, livroPorId} from "@/lib/books";
import { encolherImagem } from "@/lib/forum";
import { type CapaDeTopico } from "@/lib/grupos";

/**
 * **Escolher a capa de um tópico** — o livro de que ele fala, ou uma imagem sua.
 *
 * Serve à criação (`NovoTopico`) e à troca depois (`Topico`), e é um componente
 * só por isso: as duas telas oferecem exatamente as mesmas duas opções, e duas
 * cópias divergiriam na primeira mudança.
 *
 * A ordem em que as opções aparecem é a decisão registrada em §4.91: **o livro
 * primeiro**, porque é o caso comum e o único que carrega informação para quem
 * lê a lista; a imagem livre é a saída para o tópico que não é sobre livro.
 */
export default function EscolherCapa({
  capa,
  onMudar,
  emoji,
  semente,
  lado = 56,
}: {
  capa: CapaDeTopico;
  onMudar: (capa: CapaDeTopico) => void;
  /** O emoji da comunidade — a prévia vazia usa ele. */
  emoji?: string;
  /** O que dá a cor do degradê da prévia vazia. */
  semente?: string;
  lado?: number;
}) {
  const { toast } = useToast();
  const arquivoRef = useRef<HTMLInputElement>(null);
  const [buscando, setBuscando] = useState(false);
  const [busca, setBusca] = useState("");

  const livro = capa.bookId ? livroPorId(capa.bookId) : undefined;
  const temCapa = Boolean(capa.imagem || capa.bookId);

  /* Seis resultados bastam: quem procura um livro digita o nome, e uma grade
     maior transformaria isto numa tela de busca. */
  const termo = busca.trim().toLowerCase();
  const achados = termo
    ? catalog
        .filter(
          (item) =>
            item.title.toLowerCase().includes(termo) || item.author.toLowerCase().includes(termo),
        )
        .slice(0, 6)
    : [];

  async function usarImagem(arquivo: File | undefined) {
    if (!arquivo) return;
    try {
      /* 320px, e não os 140 da capa de comunidade: esta imagem também aparece
         num banner largo, nos destaques e no topo do fio. */
      onMudar({ imagem: await encolherImagem(arquivo, 320) });
    } catch {
      toast({ title: "Não deu para usar essa imagem", description: "Tente outro arquivo." });
    }
  }

  return (
    <div>
      <div className="flex items-start gap-3">
        <CapaDoTopico
          imagem={capa.imagem}
          capaDoLivro={livro?.cover}
          emoji={emoji}
          semente={semente}
          lado={lado}
          testid="previa-da-capa"
        />

        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] text-white/40">capa (opcional):</p>

          {temCapa ? (
            <p className="mt-1 flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-[12px] text-white/70">
                {livro ? livro.title : "imagem enviada"}
              </span>
              <LinkDoForum
                onClick={() => onMudar({})}
                className="shrink-0 text-[10.5px] text-white/35 hover:text-destructive"
                testid="tirar-capa"
              >
                tirar
              </LinkDoForum>
            </p>
          ) : (
            <p className="mt-1 flex flex-wrap gap-3">
              <LinkDoForum
                onClick={() => setBuscando((v) => !v)}
                className="inline-flex items-center gap-1"
                testid="capa-por-livro"
              >
                <Search className="h-3 w-3" /> é sobre um livro
              </LinkDoForum>
              <LinkDoForum
                onClick={() => arquivoRef.current?.click()}
                className="inline-flex items-center gap-1"
                testid="capa-por-imagem"
              >
                <ImagePlus className="h-3 w-3" /> enviar imagem
              </LinkDoForum>
            </p>
          )}

          <input
            ref={arquivoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(evento) => usarImagem(evento.target.files?.[0])}
            data-testid="capa-arquivo"
          />
        </div>
      </div>

      {buscando && !temCapa && (
        <div className="mt-2.5 rounded-lg border border-white/[0.08] bg-background/60 p-2.5">
          <div className="flex items-center gap-2">
            <input
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="título ou autor"
              autoFocus
              className={CAMPO}
              data-testid="busca-de-livro"
            />
            <button
              onClick={() => {
                setBuscando(false);
                setBusca("");
              }}
              className="shrink-0 text-white/30 hover:text-white"
              aria-label="fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {termo && achados.length === 0 && (
            <p className="mt-2 text-[11.5px] text-white/35">Nenhum livro com esse nome.</p>
          )}

          {achados.length > 0 && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {achados.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onMudar({ bookId: item.id });
                    setBuscando(false);
                    setBusca("");
                  }}
                  className="w-[62px] shrink-0 text-left"
                  data-testid={`escolher-livro-${item.id}`}
                >
                  <img
                    src={item.cover}
                    alt={item.title}
                    className="h-[88px] w-[62px] rounded-lg object-cover ring-1 ring-white/10"
                  />
                  <span className="mt-1 block truncate text-[9.5px] leading-tight text-white/45">
                    {item.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
