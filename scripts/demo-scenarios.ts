import { and, eq, inArray, like, sql } from "drizzle-orm";
import { auth } from "../src/lib/auth/config";
import { db } from "../src/lib/db";
import { user } from "../src/lib/db/auth-schema";
import { invites, projects, proposals, providers, reviews, serviceTypes } from "../src/lib/db/schema";
import { setAccountType } from "../src/lib/auth/account-type";

/**
 * Cenários da demonstração do MVP 2 (ticket 09B): Clientes, Projetos em todos os estados,
 * Propostas em todos os status, Convites e Avaliações verificadas (sempre depois de um Aceite).
 * Idempotente: cada Projeto é identificado por Cliente + título e só é criado uma vez.
 * Não cria Ofertas nem Prestadores: os preços de referência da demo continuam os do seed-demo.
 */

type ProposalSeed = { provider: string; amount: string; days: number; status: "ENVIADA" | "PRE_SELECIONADA" | "RECUSADA" | "ACEITA" | "RETIRADA"; message: string };
type ProjectSeed = {
  client: string; service: string; title: string; description: string;
  budget: { tipo: "FAIXA"; min: string; max: string } | { tipo: "ATE"; max: string } | { tipo: "NAO_SEI" };
  days: number | null; status: "ABERTO" | "ENCERRADO" | "CANCELADO"; daysAgo: number;
  invites?: string[]; proposals: ProposalSeed[]; review?: { rating: number; comment: string };
};

const clients = [
  { email: "cliente1@demo.example", name: "Mariana Costa" },
  { email: "cliente2@demo.example", name: "Rafael Lima" },
  { email: "cliente3@demo.example", name: "Juliana Alves" },
];

const scenarios: ProjectSeed[] = [
  {
    client: "cliente1@demo.example", service: "landing-page", title: "Site de lançamento da confeitaria",
    description: "Tenho uma confeitaria artesanal e quero uma página com cardápio, fotos dos bolos, depoimentos de clientes e um botão de pedido pelo WhatsApp. Preciso que funcione bem no celular.",
    budget: { tipo: "FAIXA", min: "800.00", max: "1500.00" }, days: 20, status: "ABERTO", daysAgo: 3, invites: ["prestador-demo-1", "prestador-demo-3"],
    proposals: [
      { provider: "prestador-demo-2", amount: "1100.00", days: 12, status: "PRE_SELECIONADA", message: "Já fiz páginas para dois cafés da cidade. Incluo cardápio editável, galeria otimizada e integração com o WhatsApp. Entrego em 12 dias com duas rodadas de ajuste." },
      { provider: "prestador-demo-1", amount: "950.00", days: 15, status: "ENVIADA", message: "Proposta enxuta: página única responsiva, seção de depoimentos e botão de pedido. Você me manda as fotos e os textos e eu cuido do resto, com publicação inclusa." },
      { provider: "prestador-demo-3", amount: "1400.00", days: 25, status: "ENVIADA", message: "Além da página, faço a sessão de fotos de produto com tratamento das imagens e deixo o cardápio pronto para você atualizar sozinha pelo painel." },
    ],
  },
  {
    client: "cliente1@demo.example", service: "site-institucional", title: "Site institucional da clínica veterinária",
    description: "Site com apresentação da equipe, serviços, horários de atendimento, mapa e formulário de contato para uma clínica veterinária de bairro.",
    budget: { tipo: "FAIXA", min: "1500.00", max: "3000.00" }, days: 30, status: "ENCERRADO", daysAgo: 40,
    proposals: [
      { provider: "prestador-demo-4", amount: "2400.00", days: 21, status: "ACEITA", message: "Trabalho com clínicas há três anos. Site com cinco páginas, mapa, formulário e área de equipe, com treinamento de uma hora para vocês atualizarem o conteúdo." },
      { provider: "prestador-demo-6", amount: "2900.00", days: 28, status: "RECUSADA", message: "Site completo com blog para dicas de cuidado com os pets, ótimo para aparecer no Google. Inclui textos revisados e três meses de suporte." },
      { provider: "prestador-demo-7", amount: "1800.00", days: 35, status: "RECUSADA", message: "Faço um site simples e direto, com as informações essenciais. O prazo é um pouco maior porque estou finalizando outro projeto." },
    ],
    review: { rating: 5, comment: "Entregou antes do prazo, explicou cada etapa e ainda nos ensinou a atualizar os horários. Recomendo." },
  },
  {
    client: "cliente2@demo.example", service: "landing-page", title: "Página de captação para curso online",
    description: "Página de vendas para um curso de finanças pessoais, com vídeo de apresentação, módulos do curso, perguntas frequentes e integração com a plataforma de pagamento.",
    budget: { tipo: "ATE", max: "1200.00" }, days: 15, status: "ENCERRADO", daysAgo: 25,
    proposals: [
      { provider: "prestador-demo-2", amount: "1000.00", days: 10, status: "ACEITA", message: "Monto a página com foco em conversão: vídeo no topo, prova social, módulos em sanfona e checkout integrado. Entrego em 10 dias." },
      { provider: "prestador-demo-1", amount: "850.00", days: 14, status: "RECUSADA", message: "Página de vendas responsiva com vídeo, módulos e perguntas frequentes. O checkout fica por conta da sua plataforma, eu só faço a ligação." },
    ],
    review: { rating: 4, comment: "Página bonita e rápida. Precisei pedir um ajuste no checkout, que foi resolvido no mesmo dia." },
  },
  {
    client: "cliente2@demo.example", service: "api", title: "API para integrar a loja ao ERP",
    description: "Preciso sincronizar estoque e pedidos entre a loja virtual e o ERP da empresa. Hoje fazemos tudo à mão em planilhas e isso gera erros de estoque.",
    budget: { tipo: "ATE", max: "6000.00" }, days: null, status: "ABERTO", daysAgo: 1, invites: ["prestador-demo-8"],
    proposals: [
      { provider: "prestador-demo-8", amount: "4800.00", days: 30, status: "ENVIADA", message: "Desenho a integração com fila e reprocessamento, para nenhum pedido se perder se o ERP ficar fora do ar. Inclui documentação e um mês de acompanhamento." },
    ],
  },
  {
    client: "cliente3@demo.example", service: "site-institucional", title: "Site do escritório de advocacia",
    description: "Site sóbrio para um escritório de advocacia trabalhista, com áreas de atuação, perfil dos advogados, artigos e um formulário de primeira consulta.",
    budget: { tipo: "NAO_SEI" }, days: 45, status: "ABERTO", daysAgo: 6,
    proposals: [
      { provider: "prestador-demo-6", amount: "3200.00", days: 30, status: "PRE_SELECIONADA", message: "Já atendi dois escritórios. Proponho um site com área de artigos fácil de publicar e textos revisados para seguir as regras de publicidade da OAB." },
      { provider: "prestador-demo-4", amount: "2600.00", days: 25, status: "ENVIADA", message: "Site institucional com quatro páginas e formulário de primeira consulta que chega direto no e-mail do escritório. Visual sóbrio, como vocês pediram." },
      { provider: "prestador-demo-5", amount: "2000.00", days: 40, status: "RETIRADA", message: "Retirei minha proposta porque fechei outro projeto no mesmo período e não conseguiria cumprir o prazo que vocês precisam." },
    ],
  },
  {
    client: "cliente3@demo.example", service: "landing-page", title: "Página do evento de tecnologia jurídica",
    description: "Página para divulgar um evento presencial sobre tecnologia no direito, com programação, palestrantes e inscrição gratuita.",
    budget: { tipo: "FAIXA", min: "600.00", max: "1000.00" }, days: 10, status: "CANCELADO", daysAgo: 15,
    proposals: [
      { provider: "prestador-demo-3", amount: "900.00", days: 8, status: "ENVIADA", message: "Página de evento com programação por horário, cards de palestrantes e formulário de inscrição com confirmação por e-mail." },
    ],
  },
];

const ago = (days: number, hours = 0) => new Date(Date.now() - (days * 24 + hours) * 3_600_000);

export async function seedDemoScenarios(password: string) {
  const ids = new Map<string, string>();
  for (const client of clients) {
    const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, client.email)).limit(1);
    const id = existing?.id ?? (await auth.api.signUpEmail({ body: { email: client.email, password, name: client.name } })).user.id;
    await setAccountType(id, "CLIENTE");
    await db.update(user).set({ name: client.name }).where(eq(user.id, id));
    ids.set(client.email, id);
  }
  // Contas fictícias não recebem e-mail: marcadas como confirmadas para a demo não exibir o aviso de verificação.
  await db.update(user).set({ emailVerified: true }).where(like(user.email, "%@demo.example"));
  if (process.env.DEMO_RESET === "true") {
    // Volta a demo ao estado inicial depois de ensaios: remove as Avaliações verificadas e os Projetos dos Clientes demo
    // (Propostas e Convites caem em cascata). A Avaliação anterior, sem Aceite, é preservada.
    const clientIds = [...ids.values()];
    await db.delete(reviews).where(and(inArray(reviews.userId, clientIds), sql`EXISTS (SELECT 1 FROM proposta p JOIN projeto j ON j.id = p.projeto_id WHERE p.status = 'ACEITA' AND p.prestador_id = ${reviews.providerId} AND j.cliente_id = ${reviews.userId})`));
    await db.delete(projects).where(inArray(projects.clientId, clientIds));
  }
  const types = new Map((await db.select({ id: serviceTypes.id, slug: serviceTypes.slug }).from(serviceTypes)).map((type) => [type.slug, type.id]));
  const providerIds = new Map((await db.select({ id: providers.id, slug: providers.slug }).from(providers)).map((provider) => [provider.slug, provider.id]));
  let created = 0;
  for (const scenario of scenarios) {
    const clientId = ids.get(scenario.client)!;
    const serviceTypeId = types.get(scenario.service);
    if (!serviceTypeId) throw new Error(`Tipo de serviço ausente na demo: ${scenario.service}`);
    const [exists] = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.clientId, clientId), eq(projects.title, scenario.title))).limit(1);
    if (exists) continue;
    const provider = (slug: string) => { const id = providerIds.get(slug); if (!id) throw new Error(`Prestador ausente na demo: ${slug}`); return id; };
    await db.transaction(async (tx) => {
      const budget = scenario.budget;
      const [project] = await tx.insert(projects).values({
        clientId, serviceTypeId, title: scenario.title, description: scenario.description, budgetType: budget.tipo,
        budgetMin: budget.tipo === "FAIXA" ? budget.min : null, budgetMax: budget.tipo === "NAO_SEI" ? null : budget.max,
        desiredDays: scenario.days, status: "ABERTO", createdAt: ago(scenario.daysAgo), updatedAt: ago(scenario.daysAgo),
      }).returning({ id: projects.id });
      for (const slug of scenario.invites ?? []) await tx.insert(invites).values({ projectId: project.id, providerId: provider(slug), createdAt: ago(scenario.daysAgo, -1) });
      let accepted: { id: string; providerId: string } | null = null;
      for (const [index, item] of scenario.proposals.entries()) {
        const when = ago(scenario.daysAgo, -(index + 2) * 3);
        const [row] = await tx.insert(proposals).values({ projectId: project.id, providerId: provider(item.provider), amount: item.amount, days: item.days, message: item.message, status: item.status, createdAt: when, updatedAt: when }).returning({ id: proposals.id, providerId: proposals.providerId });
        if (item.status === "ACEITA") accepted = row;
      }
      // Estado final do Projeto depois das Propostas: o Aceite encerra e aponta a Proposta aceita.
      await tx.update(projects).set({ status: scenario.status, acceptedProposalId: accepted?.id ?? null, updatedAt: ago(Math.max(0, scenario.daysAgo - 5)) }).where(eq(projects.id, project.id));
      if (scenario.review && accepted) await tx.insert(reviews).values({ userId: clientId, providerId: accepted.providerId, rating: scenario.review.rating, comment: scenario.review.comment, createdAt: ago(Math.max(0, scenario.daysAgo - 8)), updatedAt: ago(Math.max(0, scenario.daysAgo - 8)) }).onConflictDoNothing();
    });
    created++;
  }
  return { clients: clients.length, projects: scenarios.length, created };
}
