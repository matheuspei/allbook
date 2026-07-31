import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";

import {
  BarraOrkut,
  BotaoOrkut,
  Caixa,
  LinkOrkut,
  PaginaOrkut,
} from "@/components/forum/Orkut";
import { useToast } from "@/hooks/use-toast";
import {
  CATEGORIAS,
  configDo,
  forunsVisiveis,
  membrosDo,
  salvarConfig,
  situacaoDe,
} from "@/lib/forum";
import { GRUPOS_EVENT, criarGrupo, topicosDa, type Grupo } from "@/lib/grupos";

/**
 * **Comunidades** (`/forum`) — a lista, no formato do Orkut.
 *
 * Lá isto era a página "minhas comunidades": uma **grade de imagens quadradas**
 * com o nome embaixo, a busca por nome, o filtro por categoria e o link de criar.
 * A ordem também é a de lá: as suas primeiro, o resto depois.
 *
 * **A imagem é o item.** No Orkut a grade era só imagem e nome — e era isso que
 * fazia a página parecer cheia de gente mesmo com dez comunidades. Aqui, sem
 * imagem enviada, entra o emoji num quadrado cinza, no mesmo tamanho.
 */
export default function Comunidades() {
  const { toast } = useToast();
  const [versao, setVersao] = useState(0);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    const atualizar = () => setVersao((n) => n + 1);
    window.addEventListener(GRUPOS_EVENT, atualizar);
    return () => window.removeEventListener(GRUPOS_EVENT, atualizar);
  }, []);

  const todas = useMemo(() => forunsVisiveis(), [versao]);

  const minhas = todas.filter((grupo) => situacaoDe(grupo.id) === "dentro");
  const outras = todas.filter((grupo) => situacaoDe(grupo.id) !== "dentro");

  function filtrar(lista: Grupo[]) {
    const termo = busca.trim().toLowerCase();
    return lista.filter((grupo) => {
      const config = configDo(grupo.id);
      if (categoria && config.categoria !== categoria) return false;
      if (!termo) return true;
      return (
        grupo.nome.toLowerCase().includes(termo) ||
        grupo.descricao.toLowerCase().includes(termo)
      );
    });
  }

  return (
    <PaginaOrkut testid="comunidades-page">
      <BarraOrkut onde="comunidades" />

      <div className="p-2.5" key={versao}>
        <Caixa
          titulo="buscar comunidades"
          testid="busca-de-comunidades"
          acao={
            <LinkOrkut onClick={() => setCriando((v) => !v)} testid="criar-comunidade">
              criar comunidade »
            </LinkOrkut>
          }
        >
          <div className="flex gap-1.5">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="nome da comunidade"
              className="min-w-0 flex-1 border border-[#b5b5b5] bg-white px-1.5 py-1 text-[11px] text-[#333] focus:border-[#5b7ab5] focus:outline-none"
              data-testid="campo-busca"
            />
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="border border-[#b5b5b5] bg-white px-1 py-1 text-[10px] text-[#333] focus:outline-none"
              data-testid="filtro-categoria"
            >
              <option value="">todas as categorias</option>
              {CATEGORIAS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {criando && <FormularioDeCriacao onPronto={() => setCriando(false)} />}
        </Caixa>

        <Caixa titulo={`minhas comunidades (${minhas.length})`} testid="minhas-comunidades">
          {filtrar(minhas).length === 0 ? (
            <p className="text-[#666]">
              Você ainda não participa de nenhuma comunidade
              {busca || categoria ? " que bata com a busca" : ""}.
            </p>
          ) : (
            <Grade lista={filtrar(minhas)} />
          )}
        </Caixa>

        <Caixa titulo="outras comunidades" testid="outras-comunidades">
          {filtrar(outras).length === 0 ? (
            <p className="text-[#666]">Nenhuma comunidade encontrada.</p>
          ) : (
            <Grade lista={filtrar(outras)} comFicha />
          )}
        </Caixa>

        <p className="mt-2 text-center text-[10px]">
          <LinkOrkut href="/community" testid="voltar-app">
            « voltar ao AllBook
          </LinkOrkut>
        </p>
      </div>
    </PaginaOrkut>
  );

  function FormularioDeCriacao({ onPronto }: { onPronto: () => void }) {
    const [nome, setNome] = useState("");
    const [emoji, setEmoji] = useState("");
    const [descricao, setDescricao] = useState("");
    const [cat, setCat] = useState<string>("");

    return (
      <div className="mt-2.5 border border-[#dcdcdc] bg-[#f8f8f8] p-2" data-testid="form-criar">
        <p className="mb-1.5 font-bold text-[#2b4a80]">criar uma comunidade</p>
        <div className="space-y-1.5">
          <div className="flex gap-1.5">
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value.slice(0, 4))}
              placeholder="💬"
              className="w-11 border border-[#b5b5b5] bg-white px-1 py-1 text-center text-[13px] focus:outline-none"
              aria-label="ícone"
              data-testid="novo-emoji"
            />
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value.slice(0, 60))}
              placeholder="nome da comunidade"
              autoFocus
              className="min-w-0 flex-1 border border-[#b5b5b5] bg-white px-1.5 py-1 text-[11px] focus:border-[#5b7ab5] focus:outline-none"
              data-testid="novo-nome"
            />
          </div>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value.slice(0, 400))}
            placeholder="sobre o que é esta comunidade?"
            rows={2}
            className="w-full resize-none border border-[#b5b5b5] bg-white px-1.5 py-1 text-[11px] focus:border-[#5b7ab5] focus:outline-none"
            data-testid="nova-descricao"
          />
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="w-full border border-[#b5b5b5] bg-white px-1 py-1 text-[11px] focus:outline-none"
            data-testid="nova-categoria"
          >
            <option value="">— categoria —</option>
            {CATEGORIAS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-2 flex gap-2">
          <BotaoOrkut
            primario
            disabled={nome.trim().length === 0}
            onClick={() => {
              const novo = criarGrupo(nome, emoji, descricao);
              if (!novo) return;
              if (cat) salvarConfig(novo.id, { categoria: cat });
              onPronto();
              toast({
                title: `Comunidade "${novo.nome}" criada`,
                description: "Você é o dono — dá para editar tudo em «editar comunidade».",
              });
            }}
            testid="confirmar-criar"
          >
            criar comunidade
          </BotaoOrkut>
          <BotaoOrkut onClick={onPronto}>cancelar</BotaoOrkut>
        </div>
      </div>
    );
  }
}

/**
 * A grade de comunidades — imagem quadrada e nome embaixo.
 *
 * `comFicha` acrescenta membros e tópicos numa linha de apoio: na lista de
 * **descobrir** isso é o que decide se vale entrar, enquanto nas suas o nome
 * basta (você já sabe o que são).
 */
function Grade({ lista, comFicha }: { lista: Grupo[]; comFicha?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-2.5" data-testid="grade-de-comunidades">
      {lista.map((grupo) => {
        const config = configDo(grupo.id);
        return (
          <Link
            key={grupo.id}
            href={`/forum/${grupo.id}`}
            className="text-center"
            data-testid={`comunidade-${grupo.id}`}
          >
            {config.imagem ? (
              <img
                src={config.imagem}
                alt={grupo.nome}
                className="mx-auto h-[68px] w-[68px] border border-[#c9c9c9] object-cover"
              />
            ) : (
              <span className="mx-auto grid h-[68px] w-[68px] place-items-center border border-[#c9c9c9] bg-[#f4f4f4] text-[30px]">
                {grupo.emoji}
              </span>
            )}
            <span className="mt-1 block text-[10px] leading-tight text-[#1a4fa0] hover:underline">
              {grupo.nome}
            </span>
            {comFicha && (
              <span className="block text-[9px] text-[#999]">
                {membrosDo(grupo.id).length} membros · {topicosDa(grupo.id).length} tópicos
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
