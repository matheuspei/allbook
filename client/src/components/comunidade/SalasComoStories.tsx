import { useEffect, useState } from "react";
import { Link } from "wouter";

import { livroPorId } from "@/lib/books";
import { avatarDeLeitor, findMember } from "@/lib/community";
import { EU } from "@/lib/clubes";
import { SALA_AO_VIVO_EVENT, salasAoVivo } from "@/lib/salaAoVivo";

/**
 * **As salas ao vivo como stories** — a fileira que abre a Comunidade (§4.100).
 *
 * Decisão do Matheus (04/08, à noite): *"colocaríamos a parte do ao vivo como se
 * fosse tipo um Stories, porque é uma coisa que as pessoas já estão
 * acostumadas"*. O anel colorido em volta do rosto é o vocabulário que o
 * Instagram ensinou ao mundo: **tem coisa acontecendo com essa pessoa, toque**.
 * Aqui o anel é vermelho-laranja de AO VIVO, e tocar te põe **dentro da sala,
 * no ponto da turma** — substitui o cartão vermelho que ocupava três linhas.
 *
 * As regras vêm do cartão que ele substitui (§4.81): sala privada não aparece
 * (regra do `salasAoVivo`), sala marcada ainda-não-começada não aparece, a sala
 * em que você já está não aparece (a barrinha do rodapé já a representa), e sem
 * sala nenhuma a fileira some inteira — nada de versão vazia.
 */
export default function SalasComoStories() {
  const [salas, setSalas] = useState(salasAoVivo);

  useEffect(() => {
    const atualizar = () => setSalas(salasAoVivo());
    atualizar();
    window.addEventListener(SALA_AO_VIVO_EVENT, atualizar);
    return () => window.removeEventListener(SALA_AO_VIVO_EVENT, atualizar);
  }, []);

  const agora = salas.filter((sala) => sala.porta !== "marcada" && !sala.presentes.includes(EU));
  // Fileira com UM story entrega app vazio (§4.104, decisão dele na folha):
  // com menos de 2 salas a fileira some inteira, como já sumia com zero.
  if (agora.length < 2) return null;

  return (
    <section className="mb-1" data-testid="salas-como-stories">
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
        {agora.map((sala) => {
          const anfitriao = findMember(sala.anfitriao);
          const book = livroPorId(sala.bookId);
          return (
            <Link
              key={sala.id}
              href={`/sala/${sala.id}`}
              className="w-[72px] shrink-0 text-center"
              data-testid={`story-sala-${sala.id}`}
              aria-label={`Entrar na sala de ${anfitriao?.name ?? "leitor"}${book ? `, ouvindo ${book.title}` : ""}`}
            >
              <div className="relative mx-auto h-[68px] w-[68px]">
                {/* O anel do story: gradiente de AO VIVO, girando devagar para
                    dizer "agora" sem precisar de texto piscando. */}
                {/* O anel era laranja→âmbar; com a direção "Estúdio" (§4.112)
                    ele passou a girar nos tons do vermelho de gravação. */}
                <span className="absolute inset-0 animate-[spin_6s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,#FF4438,#ff8a80,#e11d48,#FF4438)]" />
                <span className="absolute inset-[3px] rounded-full bg-background" />
                <span
                  className={`absolute inset-[6px] flex items-center justify-center rounded-full bg-gradient-to-br font-display text-xl font-bold ${anfitriao?.color ?? "from-primary to-primary/60"}`}
                  {...avatarDeLeitor(sala.anfitriao)}
                >
                  {(anfitriao?.name ?? "V").charAt(0)}
                </span>
                {book && (
                  <img
                    src={book.cover}
                    alt=""
                    className="absolute -bottom-0.5 -right-1 h-[30px] w-[21px] rounded-[3px] border-2 border-background object-cover"
                  />
                )}
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-[4px] bg-red-500 px-1.5 py-px text-[7.5px] font-extrabold tracking-wide text-white">
                  AO VIVO
                </span>
              </div>
              <p className="mt-2.5 truncate text-[10.5px] text-white/60">
                {(anfitriao?.name ?? "Você").split(" ")[0]}
              </p>
              <p className="truncate text-[9px] text-white/30">{sala.presentes.length} ouvindo</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
