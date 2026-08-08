/**
 * O esquema do banco, em um lugar só.
 *
 * `import { livros, contas } from "@shared/schema"` continua funcionando como
 * antes — o que mudou é que `shared/schema` deixou de ser um arquivo e virou uma
 * **pasta, um arquivo por assunto**. Com 61 chaves de dados para modelar, um
 * arquivo único passaria de duas mil linhas e ninguém acharia nada nele.
 *
 * A ordem abaixo é a **ordem de dependência**, e também a ordem sugerida da
 * migração (§4 do `docs/BANCO-DE-DADOS.md`): catálogo primeiro, porque não tem
 * dado de usuário e errar ali é barato; depois contas; e só então os dados da
 * pessoa, na ordem em que doem se sumirem.
 */

export * from "./catalogo";
export * from "./contas";
export * from "./biblioteca";
export * from "./opiniao";
export * from "./social";
export * from "./clubes";
export * from "./forum";
export * from "./salas";
export * from "./pedidos";
