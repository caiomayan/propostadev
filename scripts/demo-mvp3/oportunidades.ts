import { and, eq } from "drizzle-orm";
import { db } from "../../src/lib/db";
import { user } from "../../src/lib/db/auth-schema";
import { invites, projects, proposals, providers, serviceTypes } from "../../src/lib/db/schema";
import { demoSlug } from "../demo-identidades";

// Dados de demonstração do MVP 3 para este ticket. Idempotente e só aditivo: pode rodar de novo sem duplicar nem apagar.
// Cada Projeto é identificado por Cliente + título. Usa os Clientes demo que o seed-demo já cria; não cria Prestadores nem Ofertas.
// Variedade de propósito: orçamentos em faixa, "até" e "ainda não sei"; prazos curtos, longos e sem prazo; Convites e Propostas.
type Seed = {
  client: string; service: string; title: string; description: string; daysAgo: number; days: number | null;
  budget: { tipo: "FAIXA"; min: string; max: string } | { tipo: "ATE"; max: string } | { tipo: "NAO_SEI" };
  invite?: string[]; proposal?: { provider: string; amount: string; days: number; message: string };
};
// Mensagens próprias de cada Proposta (antes era uma só, genérica; o módulo de identidades corrige as já gravadas).
export const OLD_GENERIC_MESSAGE = "Posso entregar este trabalho com acompanhamento em cada etapa, testes e revisão antes da entrega final.";
export const proposalMessages = {
  contabil: "Já fiz páginas para dois escritórios de contabilidade. Proponho um texto direto para MEI e pequenas empresas, depoimentos de clientes e formulário que chega no seu e-mail com o porte da empresa já preenchido.",
  culinaria: "Monto a página de vendas com os módulos em sanfona, os bônus em destaque e a garantia de sete dias perto do botão de compra. Ligo o checkout da sua plataforma e testo a compra do começo ao fim antes de publicar.",
};
const seeds: Seed[] = [
  { client: "cliente2@demo.example", service: "landing-page", title: "Página de vendas para ateliê de bolsas", description: "Quero uma página simples para vender bolsas artesanais, com galeria de fotos, preços e botão de compra pelo WhatsApp.", daysAgo: 2, days: 10, budget: { tipo: "ATE", max: "900.00" } },
  { client: "cliente3@demo.example", service: "landing-page", title: "Landing page para workshop de fotografia", description: "Página de inscrição para um workshop de fotografia com programa, depoimentos de alunos e formulário de inscrição integrado ao e-mail.", daysAgo: 4, days: 20, budget: { tipo: "FAIXA", min: "1200.00", max: "2500.00" }, invite: [demoSlug(1)] },
  { client: "cliente4@demo.example", service: "landing-page", title: "Página de lançamento de aplicativo", description: "Preciso de uma página de lançamento para um aplicativo de finanças pessoais, com vídeo de demonstração e lista de espera por e-mail.", daysAgo: 6, days: 45, budget: { tipo: "FAIXA", min: "3000.00", max: "5000.00" } },
  { client: "cliente5@demo.example", service: "landing-page", title: "Página para academia de bairro", description: "Página com planos, horários das turmas, fotos do espaço e um formulário para aula experimental gratuita. Ainda não defini quanto investir.", daysAgo: 1, days: null, budget: { tipo: "NAO_SEI" } },
  { client: "cliente6@demo.example", service: "landing-page", title: "Landing page para consultoria contábil", description: "Quero captar clientes para consultoria contábil de pequenas empresas, com texto claro, prova social e formulário de contato.", daysAgo: 8, days: 15, budget: { tipo: "ATE", max: "1800.00" }, invite: [demoSlug(1)], proposal: { provider: demoSlug(1), amount: "1500.00", days: 14, message: proposalMessages.contabil } },
  { client: "cliente2@demo.example", service: "landing-page", title: "Página rápida para evento de música", description: "Página com line-up, ingressos e mapa do local para um evento de música no mês que vem. Precisa ficar pronta com urgência.", daysAgo: 1, days: 7, budget: { tipo: "FAIXA", min: "600.00", max: "1000.00" }, invite: [demoSlug(1), demoSlug(2)] },
  { client: "cliente3@demo.example", service: "landing-page", title: "Landing page de curso de culinária", description: "Página de vendas para um curso online de culinária, com módulos, bônus, depoimentos e garantia de sete dias, integrada à plataforma de pagamento.", daysAgo: 12, days: 30, budget: { tipo: "FAIXA", min: "2000.00", max: "4000.00" }, proposal: { provider: demoSlug(1), amount: "2600.00", days: 28, message: proposalMessages.culinaria } },
  // Tipos extras: quem tem Ofertas em mais de um Tipo (Base Sólida, Rota API) vê o filtro de Tipo de serviço.
  { client: "cliente4@demo.example", service: "sistema-web", title: "Sistema de agendamento para salão", description: "Sistema web para um salão de beleza controlar agenda, clientes e comissões das profissionais, com acesso pelo celular.", daysAgo: 5, days: 60, budget: { tipo: "FAIXA", min: "6000.00", max: "10000.00" } },
  { client: "cliente5@demo.example", service: "backend", title: "Backend para aplicativo de entregas", description: "Backend com cadastro de entregadores, pedidos em tempo real e painel administrativo simples para uma rede pequena de entregas.", daysAgo: 3, days: 40, budget: { tipo: "ATE", max: "8000.00" }, invite: [demoSlug(14)] },
  { client: "cliente6@demo.example", service: "api", title: "API para integrar loja e estoque", description: "API que leia os pedidos da loja virtual e atualize o estoque do sistema interno, com registro das chamadas e documentação.", daysAgo: 9, days: 25, budget: { tipo: "NAO_SEI" } },
];

export async function seedDemoOportunidades(): Promise<void> {
  const types = new Map((await db.select({ id: serviceTypes.id, slug: serviceTypes.slug }).from(serviceTypes)).map((type) => [type.slug, type.id]));
  const providerIds = new Map((await db.select({ id: providers.id, slug: providers.slug }).from(providers)).map((provider) => [provider.slug, provider.id]));
  const ago = (days: number) => new Date(Date.now() - days * 24 * 3_600_000);
  for (const seed of seeds) {
    const [client] = await db.select({ id: user.id }).from(user).where(eq(user.email, seed.client)).limit(1);
    const serviceTypeId = types.get(seed.service);
    if (!client || !serviceTypeId) continue; // demo base ainda não existe: este módulo só acrescenta, nunca cria contas
    const [exists] = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.clientId, client.id), eq(projects.title, seed.title))).limit(1);
    if (exists) continue;
    const budget = seed.budget;
    await db.transaction(async (tx) => {
      const [project] = await tx.insert(projects).values({
        clientId: client.id, serviceTypeId, title: seed.title, description: seed.description, budgetType: budget.tipo,
        budgetMin: budget.tipo === "FAIXA" ? budget.min : null, budgetMax: budget.tipo === "NAO_SEI" ? null : budget.max,
        desiredDays: seed.days, status: "ABERTO", createdAt: ago(seed.daysAgo), updatedAt: ago(seed.daysAgo),
      }).returning({ id: projects.id });
      for (const slug of seed.invite ?? []) { const providerId = providerIds.get(slug); if (providerId) await tx.insert(invites).values({ projectId: project.id, providerId, createdAt: ago(seed.daysAgo) }); }
      const proposal = seed.proposal, providerId = proposal && providerIds.get(proposal.provider);
      if (proposal && providerId) await tx.insert(proposals).values({ projectId: project.id, providerId, amount: proposal.amount, days: proposal.days, message: proposal.message, status: "ENVIADA", createdAt: ago(Math.max(0, seed.daysAgo - 1)), updatedAt: ago(Math.max(0, seed.daysAgo - 1)) });
    });
  }
}
