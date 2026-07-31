import { useEffect, useState } from "react";
import { Link } from "wouter";
import { catalog } from "@/lib/books";
import { avatarDeLeitor, findMember } from "@/lib/community";
import { salasAoVivo, situacaoDaSala, SALA_AO_VIVO_EVENT } from "@/lib/salaAoVivo";
import { EU } from "@/lib/clubes";

/**
 * **As salas acontecendo agora**, no alto da Comunidade (ROTEIRO §4.81).
 *
 * A sala aberta é a coisa mais perecível do app: ela **só existe enquanto dura**.
 * Por isso não entra na lista do feed junto com os posts, que ficam — ela fica
 * acima, some sozinha quando o anfitrião encerra, e não deixa buraco.
 *
 * **Sala privada não aparece aqui**, e isso é regra do `salasAoVivo`, não desta
 * tela: o que é a dois não vira vitrine.
 *
 * **Nada de versão vazia.** Sem sala no ar, o componente não desenha nada — quem
 * quer abrir uma tem o *Ouvir junto* no player.
 */
export default function SalasAoVivoNoFeed() {
  const [salas, setSalas] = useState(salasAoVivo);

  useEffect(() => {
    const atualizar = () => setSalas(salasAoVivo());
    window.addEventListener(SALA_AO_VIVO_EVENT, atualizar);
    return () => window.removeEventListener(SALA_AO_VIVO_EVENT, atualizar);
  }, []);

  /*
   * **A sala em que você já está não aparece aqui.** Ela já tem representação
   * permanente na barrinha do rodapé, e um cartão dizendo "entrar te leva ao
   * ponto deles" para quem está dentro é convite para onde a pessoa já foi.
   */
  const agora = salas.filter((sala) => sala.porta !== "marcada" && !sala.presentes.includes(EU));
  if (agora.length === 0) return null;

  return (
    <div className="mt-3 space-y-2" data-testid="salas-ao-vivo-no-feed">
      {agora.map((sala) => {
        const book = catalog.find((item) => item.id === sala.bookId);
        const anfitriao = findMember(sala.anfitriao);
        const situacao = situacaoDaSala(sala);

        return (
          <Link
            key={sala.id}
            href={`/sala/${sala.id}`}
            className="block rounded-2xl bg-red-500/[0.08] p-3.5 ring-1 ring-inset ring-red-500/25 transition-colors hover:bg-red-500/[0.13]"
            data-testid={`sala-no-feed-${sala.id}`}
          >
            <div className="mb-2.5 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <span className="text-[10px] font-extrabold tracking-[0.12em] text-red-300">
                AO VIVO AGORA
              </span>
              <span className="ml-auto text-[10.5px] text-white/30">
                {sala.presentes.length} ouvindo
              </span>
            </div>

            <div className="flex gap-3">
              {book && (
                <img src={book.cover} alt="" className="h-[52px] w-[52px] rounded-lg object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold leading-snug">
                  {anfitriao?.name ?? "Você"} está ouvindo {book?.title ?? "um livro"} com{" "}
                  {Math.max(0, sala.presentes.length - 1)}{" "}
                  {sala.presentes.length - 1 === 1 ? "pessoa" : "pessoas"}
                </div>
                <div className="mt-1 text-[11px] text-white/40">
                  cap. {situacao.capitulo} · entrar te leva ao ponto deles
                </div>
                <div className="mt-2 flex">
                  {sala.presentes.slice(0, 5).map((slug, i) => {
                    const membro = findMember(slug);
                    return (
                      <span
                        key={slug}
                        className={`flex h-[19px] w-[19px] items-center justify-center rounded-full border-2 border-[#141414] bg-gradient-to-br text-[8px] font-bold text-black ${
                          membro?.color ?? "from-primary to-amber-500"
                        } ${i > 0 ? "-ml-1.5" : ""}`}
                        {...avatarDeLeitor(slug)}
                      >
                        {(membro?.name ?? "V").charAt(0)}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
