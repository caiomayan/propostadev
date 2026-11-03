import { and, eq, inArray, like, sql } from "drizzle-orm";
import { auth } from "../src/lib/auth/config";
import { db } from "../src/lib/db";
import { user } from "../src/lib/db/auth-schema";
import { invites, offers, projects, proposals, providers, reviews, serviceTypes } from "../src/lib/db/schema";
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

type OfferSeed = { service: string; title: string; description: string; price: ["FIXO" | "A_PARTIR_DE", string] | ["INTERVALO", string, string]; deadline: ["FIXO" | "A_PARTIR_DE", number] | ["INTERVALO", number, number] };
type ProviderSeed = { n: number; name: string; kind: "PESSOA_FISICA" | "PESSOA_JURIDICA"; years: number; city?: [string, string]; about: string; offers: OfferSeed[] };

/**
 * Prestadores extras para a Triagem ter Preço de referência e compatíveis além de Landing Page.
 * Restrições dos testes E2E sobre a demo: nada em Landing Page, nenhum preço POR_HORA, nenhum prazo mínimo <= 10 dias,
 * nenhum nome parecido com "Clara Código" e Integração de sistemas com menos de 3 ofertas (exemplo de "Dados insuficientes").
 */
const extraProviders: ProviderSeed[] = [
  { n: 9, name: "Vértice Commerce — Demo", kind: "PESSOA_JURIDICA", years: 6, city: ["Recife", "PE"], about: "Lojas virtuais para pequenos varejistas: catálogo, frete, meios de pagamento e painel de pedidos.",
    offers: [{ service: "e-commerce", title: "Loja virtual completa", description: "Loja com catálogo, carrinho, cálculo de frete, pagamento por Pix e cartão e painel de pedidos. Inclui treinamento.", price: ["FIXO", "4500.00"], deadline: ["FIXO", 30] }] },
  { n: 10, name: "Loja Viva — Demo", kind: "PESSOA_FISICA", years: 4, city: ["Natal", "RN"], about: "Desenvolvedora focada em lojas rápidas e bem otimizadas para celular.",
    offers: [{ service: "e-commerce", title: "E-commerce sob medida", description: "Loja personalizada com integração a marketplace e relatórios de vendas. O valor varia com o número de produtos.", price: ["INTERVALO", "3000.00", "6000.00"], deadline: ["INTERVALO", 25, 45] }] },
  { n: 11, name: "Carrinho Certo — Demo", kind: "PESSOA_JURIDICA", years: 8, city: ["João Pessoa", "PB"], about: "Agência de comércio eletrônico com foco em conversão e checkout simples.",
    offers: [{ service: "e-commerce", title: "Loja com checkout otimizado", description: "Loja com checkout em uma página, recuperação de carrinho abandonado e integração com transportadoras.", price: ["FIXO", "5200.00"], deadline: ["FIXO", 35] }] },
  { n: 12, name: "Sistema Ágil — Demo", kind: "PESSOA_JURIDICA", years: 7, city: ["Fortaleza", "CE"], about: "Sistemas web para clínicas, escritórios e prestadores de serviço: agenda, cadastro e relatórios.",
    offers: [{ service: "sistema-web", title: "Sistema de gestão sob medida", description: "Sistema web com login, cadastro de clientes, agenda e relatórios, pensado para o fluxo do seu negócio.", price: ["FIXO", "8000.00"], deadline: ["FIXO", 60] }] },
  { n: 13, name: "Fluxo Interno — Demo", kind: "PESSOA_FISICA", years: 5, about: "Automatizo processos internos que hoje vivem em planilhas.",
    offers: [{ service: "sistema-web", title: "Sistema para substituir planilhas", description: "Transformo suas planilhas em um sistema web com permissões, histórico e exportação de dados.", price: ["A_PARTIR_DE", "6000.00"], deadline: ["A_PARTIR_DE", 45] }] },
  { n: 14, name: "Base Sólida — Demo", kind: "PESSOA_JURIDICA", years: 10, city: ["Campina Grande", "PB"], about: "Equipe de engenharia de software com experiência em sistemas críticos e APIs.",
    offers: [
      { service: "sistema-web", title: "Plataforma web robusta", description: "Sistema web com arquitetura preparada para crescer, testes automatizados e implantação em nuvem.", price: ["FIXO", "9500.00"], deadline: ["FIXO", 75] },
      { service: "backend", title: "Backend escalável", description: "Backend com banco de dados, autenticação, filas e monitoramento, documentado para sua equipe evoluir.", price: ["FIXO", "7000.00"], deadline: ["FIXO", 40] },
    ] },
  { n: 15, name: "Servidor Norte — Demo", kind: "PESSOA_FISICA", years: 6, city: ["Belém", "PA"], about: "Desenvolvedor backend: APIs, bancos de dados e integrações.",
    offers: [
      { service: "backend", title: "Backend para seu aplicativo", description: "Backend para app ou site, com cadastro de usuários, regras de negócio e painel administrativo simples.", price: ["FIXO", "6500.00"], deadline: ["FIXO", 30] },
      { service: "api", title: "API REST documentada", description: "API REST com autenticação, documentação interativa e testes, pronta para ser consumida pelo seu front-end.", price: ["FIXO", "4200.00"], deadline: ["FIXO", 20] },
    ] },
  { n: 16, name: "Rota API — Demo", kind: "PESSOA_JURIDICA", years: 5, city: ["Salvador", "BA"], about: "Integrações e APIs para empresas que precisam conectar sistemas.",
    offers: [
      { service: "api", title: "API de integração", description: "API para conectar seu sistema a parceiros, com controle de acesso, registro de chamadas e documentação.", price: ["FIXO", "3800.00"], deadline: ["FIXO", 25] },
      { service: "backend", title: "Backend de integrações", description: "Serviços de backend que sincronizam dados entre sistemas, com reprocessamento automático de falhas.", price: ["INTERVALO", "5000.00", "9000.00"], deadline: ["INTERVALO", 30, 60] },
      { service: "integracao-de-sistemas", title: "Integração com ERP", description: "Integração entre loja virtual, ERP e planilhas, com sincronização de estoque e pedidos.", price: ["INTERVALO", "3000.00", "7000.00"], deadline: ["INTERVALO", 20, 45] },
    ] },
  { n: 17, name: "Cuidado Web — Demo", kind: "PESSOA_FISICA", years: 3, city: ["João Pessoa", "PB"], about: "Cuido de sites de pequenas empresas: atualizações, segurança e conteúdo.",
    offers: [
      { service: "manutencao-web", title: "Manutenção mensal de site", description: "Atualizações, backup, correções e pequenas mudanças de conteúdo no seu site, com relatório mensal.", price: ["FIXO", "600.00"], deadline: ["FIXO", 14] },
      { service: "site-institucional", title: "Site institucional simples", description: "Site com até cinco páginas, formulário de contato e mapa, com textos revisados e publicação inclusa.", price: ["FIXO", "2200.00"], deadline: ["FIXO", 20] },
    ] },
  { n: 18, name: "Zelo Sites — Demo", kind: "PESSOA_FISICA", years: 2, city: ["Maceió", "AL"], about: "Sites institucionais bonitos e fáceis de atualizar.",
    offers: [
      { service: "manutencao-web", title: "Correções e atualizações", description: "Correção de erros, atualização de plugins e ajustes visuais em sites WordPress e similares.", price: ["FIXO", "450.00"], deadline: ["FIXO", 12] },
      { service: "site-institucional", title: "Site para pequenas empresas", description: "Site responsivo com apresentação, serviços, depoimentos e botão de WhatsApp.", price: ["FIXO", "1900.00"], deadline: ["FIXO", 18] },
    ] },
  { n: 19, name: "Atalaia Digital — Demo", kind: "PESSOA_JURIDICA", years: 9, city: ["Recife", "PE"], about: "Agência digital com sites institucionais, manutenção e suporte contínuo.",
    offers: [
      { service: "manutencao-web", title: "Suporte e evolução contínua", description: "Pacote de suporte com melhorias mensais, monitoramento e atendimento em horário comercial.", price: ["A_PARTIR_DE", "800.00"], deadline: ["A_PARTIR_DE", 15] },
      { service: "site-institucional", title: "Site institucional premium", description: "Site com identidade visual, textos otimizados para busca, blog e painel para atualizar conteúdo.", price: ["FIXO", "2600.00"], deadline: ["FIXO", 25] },
    ] },
  { n: 20, name: "Elo Integra — Demo", kind: "PESSOA_FISICA", years: 4, about: "Integro sistemas que não conversam entre si.",
    offers: [{ service: "integracao-de-sistemas", title: "Integração entre sistemas", description: "Conecto CRM, ERP, planilhas e loja virtual para os dados circularem sem retrabalho manual.", price: ["FIXO", "3500.00"], deadline: ["FIXO", 30] }] },
];

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
  {
    client: "cliente2@demo.example", service: "e-commerce", title: "Loja virtual de cosméticos naturais",
    description: "Quero vender meus cosméticos naturais pela internet, com fotos, kits promocionais, frete calculado e pagamento por Pix e cartão.",
    budget: { tipo: "FAIXA", min: "3500.00", max: "6000.00" }, days: 40, status: "ENCERRADO", daysAgo: 50,
    proposals: [
      { provider: "prestador-demo-9", amount: "4500.00", days: 30, status: "ACEITA", message: "Já montei lojas de cosméticos e sei como apresentar kits. Entrego catálogo, frete, Pix e cartão em 30 dias, com treinamento." },
      { provider: "prestador-demo-11", amount: "5800.00", days: 35, status: "RECUSADA", message: "Loja com checkout em uma página e recuperação de carrinho abandonado, ótimo para quem vende pelo Instagram." },
    ],
    review: { rating: 5, comment: "A loja ficou linda e as vendas começaram na primeira semana. Comunicação ótima durante todo o projeto." },
  },
  {
    client: "cliente3@demo.example", service: "sistema-web", title: "Sistema de agendamento para o escritório",
    description: "Preciso de um sistema para agendar consultas, cadastrar clientes e acompanhar processos, acessível pelos advogados do escritório.",
    budget: { tipo: "ATE", max: "10000.00" }, days: 90, status: "ENCERRADO", daysAgo: 70,
    proposals: [
      { provider: "prestador-demo-12", amount: "8000.00", days: 60, status: "ACEITA", message: "Sistema com agenda compartilhada, cadastro de clientes e acompanhamento de processos, com acesso por perfil de usuário." },
      { provider: "prestador-demo-14", amount: "9500.00", days: 75, status: "RECUSADA", message: "Plataforma robusta, com testes automatizados e trilha de auditoria de quem alterou cada processo." },
    ],
    review: { rating: 4, comment: "Sistema funciona bem e a equipe usa todo dia. Atrasou uma semana, mas avisaram com antecedência." },
  },
  {
    client: "cliente1@demo.example", service: "sistema-web", title: "Sistema de encomendas da confeitaria",
    description: "Quero um sistema para receber encomendas de bolos, controlar datas de entrega e avisar quando o pedido estiver pronto.",
    budget: { tipo: "FAIXA", min: "5000.00", max: "9000.00" }, days: 60, status: "ABERTO", daysAgo: 2, invites: ["prestador-demo-12"],
    proposals: [
      { provider: "prestador-demo-13", amount: "6500.00", days: 50, status: "ENVIADA", message: "Transformo sua planilha de encomendas em um sistema com calendário de entregas e aviso por WhatsApp quando o pedido fica pronto." },
      { provider: "prestador-demo-12", amount: "7800.00", days: 45, status: "ENVIADA", message: "Sistema de encomendas com agenda de produção, controle de sinal pago e relatório semanal de vendas." },
    ],
  },
];

const ago = (days: number, hours = 0) => new Date(Date.now() - (days * 24 + hours) * 3_600_000);

async function seedExtraProviders(password: string, types: Map<string, string>) {
  for (const seed of extraProviders) {
    const email = `prestador${seed.n}@demo.example`;
    const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
    const accountId = existing?.id ?? (await auth.api.signUpEmail({ body: { email, password, name: seed.name } })).user.id;
    await setAccountType(accountId, "PRESTADOR");
    const [provider] = await db.insert(providers).values({ userId: accountId, slug: `prestador-demo-${seed.n}`, type: seed.kind, displayName: seed.name, description: `${seed.about} Perfil fictício de demonstração; não representa um profissional real.`, yearsExperience: seed.years, contactEmail: email, contactsPublishedAt: new Date(), city: seed.city?.[0] ?? null, state: seed.city?.[1] ?? null }).onConflictDoUpdate({ target: providers.userId, set: { displayName: seed.name } }).returning({ id: providers.id });
    for (const offer of seed.offers) {
      const serviceTypeId = types.get(offer.service);
      if (!serviceTypeId) throw new Error(`Tipo de serviço ausente na demo: ${offer.service}`);
      const [exists] = await db.select({ id: offers.id }).from(offers).where(and(eq(offers.providerId, provider.id), eq(offers.serviceTypeId, serviceTypeId))).limit(1);
      if (exists) continue;
      await db.insert(offers).values({ providerId: provider.id, serviceTypeId, title: offer.title, description: offer.description, priceType: offer.price[0], priceMin: offer.price[1], priceMax: offer.price[0] === "INTERVALO" ? offer.price[2] : null, deadlineType: offer.deadline[0], deadlineMinDays: offer.deadline[1], deadlineMaxDays: offer.deadline[0] === "INTERVALO" ? offer.deadline[2] : null, active: true });
    }
  }
}

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
  await seedExtraProviders(password, types);
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
