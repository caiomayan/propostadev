import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { listOpportunities } from "@/modules/proposals/queries";
import { parseOpportunityFilters } from "@/modules/proposals/filters";

const testUrl = process.env.DATABASE_URL_TEST;
const pool = new Pool({ connectionString: testUrl });
const categoryId = randomUUID();
const typeA = randomUUID(), typeB = randomUUID(), typeC = randomUUID();
const slugA = `fa-${typeA}`, slugB = `fb-${typeB}`, slugC = `fc-${typeC}`;
const userIds: string[] = [];
const description = "Descrição suficiente para o projeto de teste do banco de dados.";

async function newUser(type: "CLIENTE" | "PRESTADOR", name = "Conta Teste") {
  const id = randomUUID();
  await pool.query('INSERT INTO "user"(id,name,email,tipo_conta) VALUES($1,$2,$3,$4)', [id, name, `${id}@test.example`, type]);
  userIds.push(id);
  return id;
}
async function newProvider(typeIds: string[]) {
  const userId = await newUser("PRESTADOR");
  const id = randomUUID();
  await pool.query("INSERT INTO perfil_prestador(id,usuario_id,slug,tipo,nome_exibicao,descricao,anos_experiencia,email_contato,contatos_publicados_em,ativo) VALUES($1,$2,$3,'PESSOA_FISICA',$4,'Descrição completa do perfil de desenvolvimento para teste.',5,'p@test.example',now(),true)", [id, userId, id, `Prestador ${id}`]);
  for (const typeId of typeIds) await pool.query("INSERT INTO oferta_servico(prestador_id,tipo_servico_id,titulo,descricao,tipo_preco,preco_minimo,tipo_prazo,prazo_minimo_dias,ativo) VALUES($1,$2,'Oferta de teste','Descrição completa do serviço de desenvolvimento para teste.','FIXO',1000,'FIXO',20,true)", [id, typeId]);
  return { id, userId };
}
type Budget = { tipo: "ATE"; max: number } | { tipo: "FAIXA"; min: number; max: number } | { tipo: "NAO_SEI" };
async function newProject(clientId: string, o: { title: string; description?: string; type?: string; budget?: Budget; days?: number | null; status?: string }) {
  const id = randomUUID();
  const b = o.budget ?? { tipo: "ATE", max: 3000 };
  await pool.query("INSERT INTO projeto(id,cliente_id,tipo_servico_id,titulo,descricao,orcamento_tipo,orcamento_min,orcamento_max,prazo_desejado_dias,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
    [id, clientId, o.type ?? typeA, o.title, o.description ?? description, b.tipo, "min" in b ? b.min : null, "max" in b ? b.max : null, o.days === undefined ? 30 : o.days, o.status ?? "ABERTO"]);
  return id;
}
const propose = (projectId: string, providerId: string, status = "ENVIADA") => pool.query("INSERT INTO proposta(projeto_id,prestador_id,valor,prazo_dias,mensagem,status) VALUES($1,$2,2000,30,'Posso entregar esta página com testes, revisão de conteúdo e acompanhamento.',$3)", [projectId, providerId, status]);
const run = async (userId: string, raw: Record<string, unknown> = {}) => {
  const { filters } = parseOpportunityFilters(raw);
  const result = await listOpportunities(userId, filters);
  return { ...result, titles: result.items.map((item) => item.title).sort() };
};

describe.skipIf(!testUrl)("Filtros de Oportunidades (MVP 3, ticket 03)", () => {
  const ids: Record<string, string> = {};
  let provider: { id: string; userId: string }, other: { id: string; userId: string };
  beforeAll(async () => {
    await pool.query("INSERT INTO categoria(id,nome,slug) VALUES($1,'Filtros teste',$2)", [categoryId, categoryId]);
    for (const [id, slug] of [[typeA, slugA], [typeB, slugB], [typeC, slugC]]) await pool.query("INSERT INTO tipo_servico(id,categoria_id,nome,slug) VALUES($1,$2,$3,$4)", [id, categoryId, `Tipo ${slug.slice(0, 4)}`, slug]);
    const client = await newUser("CLIENTE", "Marina Souza");
    provider = await newProvider([typeA, typeB]);
    other = await newProvider([typeA]);
    ids.landing = await newProject(client, { title: "Landing page de café", description: "Preciso de uma página de vendas para a minha cafeteria artesanal, com cardápio.", budget: { tipo: "ATE", max: 2000 }, days: 15 });
    ids.site = await newProject(client, { title: "Site institucional da clínica", description: "Site com agenda e formulário de contato para a clínica de fisioterapia.", budget: { tipo: "FAIXA", min: 3000, max: 6000 }, days: 45 });
    ids.naosei = await newProject(client, { title: "Sistema de pedidos interno", description: "Um sistema simples para controlar os pedidos da padaria, sem orçamento definido.", budget: { tipo: "NAO_SEI" }, days: null });
    ids.loja = await newProject(client, { title: "Loja de camisetas", type: typeB, description: "Loja virtual com 20 produtos, 100% responsiva e pagamento por Pix.", budget: { tipo: "ATE", max: 8000 }, days: 60 });
    ids.fora = await newProject(client, { title: "Projeto de outro tipo", type: typeC });
    ids.encerrado = await newProject(client, { title: "Projeto encerrado", status: "ENCERRADO" });
    await pool.query("INSERT INTO convite(projeto_id,prestador_id) VALUES($1,$2),($3,$2)", [ids.landing, provider.id, ids.loja]);
    await pool.query("INSERT INTO convite(projeto_id,prestador_id) VALUES($1,$2)", [ids.site, other.id]); // convite de OUTRO Prestador
    await propose(ids.landing, provider.id);
    await propose(ids.site, other.id); // proposta de OUTRO Prestador
  });
  afterAll(async () => {
    await pool.query("DELETE FROM projeto WHERE cliente_id = ANY($1)", [userIds]);
    await pool.query('DELETE FROM "user" WHERE id = ANY($1)', [userIds]);
    await pool.query("DELETE FROM tipo_servico WHERE id = ANY($1::uuid[])", [[typeA, typeB, typeC]]);
    await pool.query("DELETE FROM categoria WHERE id=$1", [categoryId]);
    await pool.end();
  });

  it("sem filtros: só Projetos ABERTOS dos Tipos do Prestador", async () => {
    expect((await run(provider.userId)).titles).toEqual(["Landing page de café", "Loja de camisetas", "Sistema de pedidos interno", "Site institucional da clínica"]);
  });

  it("texto casa título e descrição, sem acento e sem diferenciar maiúsculas; % e _ valem como texto", async () => {
    expect((await run(provider.userId, { q: "CAFÉ" })).titles).toEqual(["Landing page de café"]);
    expect((await run(provider.userId, { q: "cafeteria" })).titles).toEqual(["Landing page de café"]); // só na descrição
    expect((await run(provider.userId, { q: "fisioterapia" })).titles).toEqual(["Site institucional da clínica"]);
    expect((await run(provider.userId, { q: "clinica" })).titles).toEqual(["Site institucional da clínica"]); // sem acento
    expect((await run(provider.userId, { q: "%" })).titles).toEqual(["Loja de camisetas"]); // só quem tem "%" no texto: não é curinga
    expect((await run(provider.userId, { q: "_" })).titles).toEqual([]);
    expect((await run(provider.userId, { q: "100%" })).titles).toEqual(["Loja de camisetas"]);
    expect((await run(provider.userId, { q: "inexistente-xyz" })).titles).toEqual([]);
  });

  it("Tipo de serviço restringe; Tipo fora dos do Prestador é ignorado e informado", async () => {
    expect((await run(provider.userId, { tipo: slugB })).titles).toEqual(["Loja de camisetas"]);
    const outside = await run(provider.userId, { tipo: slugC });
    expect(outside.titles).toHaveLength(4); // ignorado: volta ao conjunto sem filtro, não vaza o Tipo C
    expect(outside.ignored).toEqual(["tipo"]);
    expect(outside.titles).not.toContain("Projeto de outro tipo");
    expect((await run(other.userId, { tipo: slugB })).ignored).toEqual(["tipo"]); // other não tem Oferta em B
    expect((await run(provider.userId)).types.map((type) => type.slug).sort()).toEqual([slugA, slugB].sort());
  });

  it("orçamento mínimo compara com o teto; NAO_SEI sempre fica", async () => {
    expect((await run(provider.userId, { orcamento_min: "2500" })).titles).toEqual(["Loja de camisetas", "Sistema de pedidos interno", "Site institucional da clínica"]);
    expect((await run(provider.userId, { orcamento_min: "2000" })).titles).toContain("Landing page de café"); // teto == mínimo casa
    expect((await run(provider.userId, { orcamento_min: "2000,01" })).titles).not.toContain("Landing page de café"); // vírgula decimal
    expect((await run(provider.userId, { orcamento_min: "7000" })).titles).toEqual(["Loja de camisetas", "Sistema de pedidos interno"]);
    const huge = await run(provider.userId, { orcamento_min: "99999999" });
    expect(huge.titles).toEqual(["Sistema de pedidos interno"]);
    expect(huge.items[0].budget.tipo).toBe("NAO_SEI");
  });

  it("prazo até N dias: Projeto sem prazo desejado só aparece sem o filtro", async () => {
    expect((await run(provider.userId, { prazo_ate: "30" })).titles).toEqual(["Landing page de café"]);
    expect((await run(provider.userId, { prazo_ate: "45" })).titles).toEqual(["Landing page de café", "Site institucional da clínica"]);
    expect((await run(provider.userId, { prazo_ate: "3650" })).titles).not.toContain("Sistema de pedidos interno");
    expect((await run(provider.userId)).titles).toContain("Sistema de pedidos interno");
  });

  it("situação usa só o Prestador da sessão", async () => {
    expect((await run(provider.userId, { situacao: "convidado" })).titles).toEqual(["Landing page de café", "Loja de camisetas"]);
    expect((await run(provider.userId, { situacao: "enviada" })).titles).toEqual(["Landing page de café"]);
    expect((await run(provider.userId, { situacao: "sem_proposta" })).titles).toEqual(["Loja de camisetas", "Sistema de pedidos interno", "Site institucional da clínica"]);
    // O outro Prestador: convidado só no Site; enviou proposta só no Site.
    expect((await run(other.userId, { situacao: "convidado" })).titles).toEqual(["Site institucional da clínica"]);
    expect((await run(other.userId, { situacao: "enviada" })).titles).toEqual(["Site institucional da clínica"]);
    expect((await run(other.userId, { situacao: "sem_proposta" })).titles).toEqual(["Landing page de café", "Sistema de pedidos interno"]);
  });

  it("filtros combinam entre si e com a ordem padrão (Convites primeiro)", async () => {
    expect((await run(provider.userId, { tipo: slugA, orcamento_min: "2500", situacao: "sem_proposta" })).titles).toEqual(["Sistema de pedidos interno", "Site institucional da clínica"]);
    expect((await run(provider.userId, { q: "loja", prazo_ate: "60", situacao: "convidado", orcamento_min: "5000" })).titles).toEqual(["Loja de camisetas"]);
    expect((await run(provider.userId, { q: "loja", situacao: "enviada" })).titles).toEqual([]);
    const ordered = await listOpportunities(provider.userId, parseOpportunityFilters({ situacao: "sem_proposta" }).filters);
    expect(ordered.items[0].title).toBe("Loja de camisetas"); // o convite continua na frente
  });

  it("entradas inválidas são ignoradas sem erro, campo a campo", () => {
    const parsed = parseOpportunityFilters({ q: "  ", tipo: "", orcamento_min: "abc", prazo_ate: "-5", situacao: "qualquer" });
    expect(parsed.filters).toEqual({});
    expect(parsed.ignored).toEqual(["orcamento_min", "prazo_ate", "situacao"]); // vazio é "sem filtro", não erro
    for (const [key, value] of [["prazo_ate", "0"], ["prazo_ate", "3651"], ["prazo_ate", "2.5"], ["prazo_ate", "1e3"], ["orcamento_min", "0"], ["orcamento_min", "-10"], ["orcamento_min", "1.234,50"], ["orcamento_min", "123456789"], ["q", "x".repeat(121)]])
      expect(parseOpportunityFilters({ [key]: value }).ignored, `${key}=${value}`).toEqual([key]);
    expect(parseOpportunityFilters({ q: "  café  ", prazo_ate: "30", orcamento_min: "1500,5", situacao: "enviada", tipo: "x", extra: "y" }).filters).toEqual({ q: "café", prazo_ate: 30, orcamento_min: "1500.5", situacao: "enviada", tipo: "x" });
    expect(parseOpportunityFilters({ q: ["a", "b"] }).filters).toEqual({ q: "a" }); // parâmetro repetido: o primeiro
  });

  it("um valor inválido não derruba a consulta nem os outros filtros", async () => {
    expect((await run(provider.userId, { q: "café", prazo_ate: "abc", orcamento_min: "xx" })).titles).toEqual(["Landing page de café"]);
  });

  it("quem não pode ver Oportunidades continua sem ver, com ou sem filtros", async () => {
    const client = await newUser("CLIENTE");
    expect((await listOpportunities(client, { q: "café" })).items).toEqual([]);
    expect((await listOpportunities(client)).standing.state).toBe("sem-perfil");
  });
});
