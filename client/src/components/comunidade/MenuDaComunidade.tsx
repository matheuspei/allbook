import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  BookOpen,
  HelpCircle,
  Headphones,
  MoreHorizontal,
  Plus,
  Radio,
  Search,
  UserPlus,
  Users,
} from "lucide-react";

import { meusClubes } from "@/lib/clubes";
import { minhasComunidades } from "@/lib/forum";
import { COMENTARIOS_EVENT, temResposta } from "@/lib/comentariosDePost";
import { readFollowing } from "@/lib/following";
import { GRUPOS_EVENT } from "@/lib/grupos";
import { POSTS_EVENT, todosOsPosts } from "@/lib/posts";
import { salasAoVivo } from "@/lib/salaAoVivo";
import { meusSeguidores } from "@/lib/seguidores";
import { trechosQuentes } from "@/lib/trechosQuentes";

/**
 * **O menu “…” da Comunidade** (ROTEIRO §4.92).
 *
 * ---
 *
 * **A decisão que mais tempo tomou, e a que mais demorou a existir.** A §4.57
 * inteira (29/07) foi uma conversa longa que terminou com uma regra escrita:
 *
 * > *“O ‘…’ da Comunidade só leva ao que é da comunidade. O que é seu mora no
 * > avatar.”*
 *
 * A auditoria de 31/07 (§4.72) encontrou o resultado: **não existia menu nenhum,
 * nem o botão**. Isto é ele, com o conteúdo que ficou decidido lá — e mais dois
 * blocos que o Matheus escolheu ao ver a folha desenhada:
 *
 * - **Salas ao vivo agora**, no topo e em vermelho. Sala é a coisa mais perecível
 *   do app: some em uma hora. Some inteira quando não há nenhuma no ar.
 * - **Perguntas e Trechos**, no fim. As duas portas existiam só dentro do feed,
 *   atrás de uma contagem mínima de itens — a auditoria mostrou que, na prática,
 *   ficavam invisíveis. Este é o lugar fixo delas.
 *
 * **O que continua fora, e é o ponto da regra:** perfil, trechos guardados,
 * privacidade, recomendados. Isso é seu, e mora no avatar (`/you`). Pôr aqui
 * também daria duas respostas para “onde eu acho meus trechos”.
 *
 * **Os números não são enfeite:** cada linha mostra quanto tem, e a linha some
 * quando não tem nada — a régua da §4.23. Sem contagem, “Perguntas” é uma promessa
 * vaga; com ela, é *três esperando resposta*.
 */
export default function MenuDaComunidade() {
  const [aberto, setAberto] = useState(false);
  const [, navegar] = useLocation();
  const caixa = useRef<HTMLDivElement>(null);

  const [dados, setDados] = useState(() => contar());

  useEffect(() => {
    const atualizar = () => setDados(contar());
    atualizar();
    window.addEventListener(GRUPOS_EVENT, atualizar);
    window.addEventListener(POSTS_EVENT, atualizar);
    window.addEventListener(COMENTARIOS_EVENT, atualizar);
    return () => {
      window.removeEventListener(GRUPOS_EVENT, atualizar);
      window.removeEventListener(POSTS_EVENT, atualizar);
      window.removeEventListener(COMENTARIOS_EVENT, atualizar);
    };
  }, []);

  /* Fechar tocando fora e com Esc — um menu que só fecha pelo próprio botão
     prende quem abriu por engano. */
  useEffect(() => {
    if (!aberto) return;
    const fora = (evento: MouseEvent) => {
      if (!caixa.current?.contains(evento.target as Node)) setAberto(false);
    };
    const esc = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  function ir(rota: string) {
    setAberto(false);
    navegar(rota);
  }

  return (
    <div className="relative shrink-0" ref={caixa}>
      <button
        onClick={() => setAberto((v) => !v)}
        aria-label="mais da comunidade"
        className={`grid h-9 w-9 place-items-center rounded-full border transition-colors ${
          aberto
            ? "border-primary bg-primary text-black"
            : "border-white/12 bg-white/[0.06] text-white/70 hover:bg-white/12 hover:text-white"
        }`}
        data-testid="menu-da-comunidade"
      >
        <MoreHorizontal className="h-[18px] w-[18px]" />
        {/* O ponto do que é do momento: sala no ar. Só ele — pergunta sem
            resposta e trecho da semana não são urgentes, e ponto que nunca apaga
            deixa de significar coisa. */}
        {!aberto && dados.salas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#141414] bg-red-500" />
        )}
      </button>

      {aberto && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setAberto(false)} />
          <div
            className="absolute right-0 top-11 z-50 w-[230px] overflow-hidden rounded-2xl border border-white/12 bg-[#232323] py-1.5 shadow-2xl shadow-black/60"
            data-testid="menu-da-comunidade-aberto"
          >
            {dados.salas > 0 && (
              <>
                <Item
                  icone={<Radio className="h-4 w-4 text-red-400" />}
                  rotulo="Salas ao vivo agora"
                  conta={dados.salas}
                  destaque
                  onClick={() => ir(dados.primeiraSala ? `/sala/${dados.primeiraSala}` : "/community")}
                  testid="menu-salas"
                />
                <Filete />
              </>
            )}

            <Item
              icone={<Users className="h-4 w-4" />}
              rotulo="Minhas comunidades"
              conta={dados.comunidades}
              onClick={() => ir("/forum/minhas")}
              testid="menu-minhas-comunidades"
            />
            <Item
              icone={<Search className="h-4 w-4" />}
              rotulo="Todas as comunidades"
              onClick={() => ir("/forum")}
              testid="menu-todas-comunidades"
            />
            <Item
              icone={<Plus className="h-4 w-4" />}
              rotulo="Criar comunidade"
              onClick={() => ir("/forum?criar=1")}
              testid="menu-criar-comunidade"
            />

            <Filete />

            <Item
              icone={<BookOpen className="h-4 w-4" />}
              rotulo="Meus clubes"
              conta={dados.clubes}
              onClick={() => ir("/clubes")}
              testid="menu-meus-clubes"
            />
            <Item
              icone={<Search className="h-4 w-4" />}
              rotulo="Todos os clubes"
              onClick={() => ir("/clubes")}
              testid="menu-todos-clubes"
            />
            <Item
              icone={<Plus className="h-4 w-4" />}
              rotulo="Criar clube"
              onClick={() => ir("/clubes/novo")}
              testid="menu-criar-clube"
            />

            <Filete />

            <Item
              icone={<UserPlus className="h-4 w-4" />}
              rotulo="Quem eu sigo"
              conta={dados.sigo}
              onClick={() => ir("/seguidores")}
              testid="menu-quem-eu-sigo"
            />
            <Item
              icone={<Users className="h-4 w-4" />}
              rotulo="Quem me segue"
              conta={dados.meSeguem}
              onClick={() => ir("/seguidores")}
              testid="menu-quem-me-segue"
            />

            {(dados.perguntas > 0 || dados.trechos > 0) && <Filete />}

            {dados.perguntas > 0 && (
              <Item
                icone={<HelpCircle className="h-4 w-4" />}
                rotulo="Perguntas sem resposta"
                conta={dados.perguntas}
                onClick={() => ir("/perguntas")}
                testid="menu-perguntas"
              />
            )}
            {dados.trechos > 0 && (
              <Item
                icone={<Headphones className="h-4 w-4" />}
                rotulo="Trechos da semana"
                conta={dados.trechos}
                onClick={() => ir("/trechos")}
                testid="menu-trechos"
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Item({
  icone,
  rotulo,
  conta,
  destaque,
  onClick,
  testid,
}: {
  icone: React.ReactNode;
  rotulo: string;
  conta?: number;
  destaque?: boolean;
  onClick: () => void;
  testid?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] transition-colors hover:bg-white/[0.07] ${
        destaque ? "bg-red-500/[0.09]" : ""
      }`}
      data-testid={testid}
    >
      <span className="shrink-0 text-white/45">{icone}</span>
      <span className="min-w-0 flex-1 truncate text-white/85">{rotulo}</span>
      {conta !== undefined && conta > 0 && (
        <span className="shrink-0 text-[11px] text-white/35">{conta}</span>
      )}
    </button>
  );
}

function Filete() {
  return <div className="my-1.5 h-px bg-white/[0.09]" />;
}

/** Os números do menu, todos de dado que já existe — nenhum inventado. */
function contar() {
  const salas = salasAoVivo().filter((sala) => !sala.encerradaEm);
  const perguntas = todosOsPosts().filter((post) => post.pergunta && !temResposta(post.id));
  return {
    salas: salas.length,
    primeiraSala: salas[0]?.id,
    comunidades: minhasComunidades().length,
    clubes: meusClubes().length,
    sigo: readFollowing().length,
    meSeguem: meusSeguidores().length,
    perguntas: perguntas.length,
    trechos: trechosQuentes().length,
  };
}
