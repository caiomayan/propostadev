import { and, eq, isNull, sql } from "drizzle-orm";
import { auth } from "../src/lib/auth/config";
import { db, pool } from "../src/lib/db";
import { user } from "../src/lib/db/auth-schema";
import { offers, providers, reviews, serviceTypes } from "../src/lib/db/schema";
import { setAccountType } from "../src/lib/auth/account-type";
import { REVIEW_ACCEPTANCE_TRIGGER } from "../src/modules/reviews/rules";
import { seedCatalog } from "./seed";
import { demoPhoto, seedDemoScenarios } from "./demo-scenarios";

async function seedDemo() {
  if (process.env.NODE_ENV === "production" || process.env.ALLOW_DEMO_SEED !== "true") throw new Error("Demo recusada: use ALLOW_DEMO_SEED=true apenas em ambiente local.");
  await seedCatalog();
  const password = process.env.DEMO_PASSWORD ?? "Demo-local-2026!";
  const types = await db.select().from(serviceTypes);
  const names = ["Aurora Web — Demo", "Horizonte Digital — Demo", "Nexo Studio — Demo", "Clara Código — Demo", "Ponte APIs — Demo", "Raiz Tecnologia — Demo", "Maré Sistemas — Demo", "Pixel Aberto — Demo"];
  const profiles = [
    { about: "Crio páginas de venda enxutas e rápidas para pequenos negócios, com texto, imagem e botão de contato no lugar certo.", city: ["João Pessoa", "PB"], title: "Landing Page enxuta para pequenos negócios", offer: "Página única responsiva com seção de depoimentos, formulário ou botão de WhatsApp e publicação inclusa." },
    { about: "Estúdio focado em páginas de lançamento: estrutura de oferta, prova social e carregamento rápido no celular.", city: ["Recife", "PE"], title: "Landing Page de lançamento", offer: "Página de campanha com vídeo, depoimentos, perguntas frequentes e integração com sua ferramenta de vendas." },
    { about: "Design e desenvolvimento no mesmo lugar, do layout às fotos de produto, para marcas que querem se destacar.", city: ["Campina Grande", "PB"], title: "Landing Page com design exclusivo", offer: "Layout criado para a sua marca, com tratamento de imagens, animações leves e duas rodadas de ajuste." },
    { about: "Desenvolvedora independente. Trabalho por hora em sites institucionais de clínicas, consultórios e profissionais liberais.", city: ["Natal", "RN"], title: "Site institucional por hora", offer: "Ideal para quem já tem textos e identidade visual e quer pagar só pelas horas de desenvolvimento." },
    { about: "Integrações e sites para empresas de serviços, com atenção a formulários que chegam certo ao seu sistema.", city: ["Fortaleza", "CE"], title: "Site institucional integrado", offer: "Site com formulários ligados ao seu e-mail ou CRM. O valor varia com o número de páginas e integrações." },
    { about: "Sites institucionais com bons textos e estrutura para aparecer no Google, feitos para durar.", city: ["Teresina", "PI"], title: "Site institucional com blog", offer: "Site com páginas de serviço, blog e textos revisados, pronto para aparecer nas buscas da sua região." },
    { about: "Empresa de software com projetos sob medida. O orçamento depende do escopo definido em uma conversa inicial.", city: ["João Pessoa", "PB"], title: "Site institucional sob medida", offer: "Levantamos o que a sua empresa precisa e definimos juntos as páginas, integrações e o cronograma." },
    { about: "Desenvolvedor de APIs para lojas e sistemas internos, com documentação clara e monitoramento desde o início.", city: ["Salvador", "BA"], title: "API para integrar sistemas", offer: "API com autenticação, documentação e testes, pronta para conectar sua loja, seu ERP ou seu aplicativo." },
  ];
  const priceModels = ["FIXO", "FIXO", "FIXO", "POR_HORA", "INTERVALO", "A_PARTIR_DE", "SOB_CONSULTA", "FIXO"] as const;
  for (let i = 0; i < names.length; i++) {
    const email = `prestador${i + 1}@demo.example`;
    const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
    const account = existing[0] ?? (await auth.api.signUpEmail({ body: { email, password, name: names[i] } })).user;
    await setAccountType(account.id, "PRESTADOR"); // no-op se o tipo já estiver definido
    const [provider] = await db.insert(providers).values({ userId: account.id, slug: `prestador-demo-${i + 1}`, type: i % 2 === 0 ? "PESSOA_JURIDICA" : "PESSOA_FISICA", displayName: names[i], description: profiles[i].about, yearsExperience: i + 1, contactEmail: email, contactsPublishedAt: new Date(), city: profiles[i].city[0], state: profiles[i].city[1], photoUrl: demoPhoto(i + 1) }).onConflictDoUpdate({ target: providers.userId, set: { displayName: names[i], photoUrl: demoPhoto(i + 1) } }).returning();
    const service = types.find((type) => type.slug === (i < 3 ? "landing-page" : i === 7 ? "api" : "site-institucional"));
    if (!service) throw new Error("Catálogo de demonstração incompleto.");
    const exists = await db.select({ id: offers.id }).from(offers).where(and(eq(offers.providerId, provider.id), eq(offers.serviceTypeId, service.id), eq(offers.active, true), isNull(offers.deletedAt))).limit(1);
    if (!exists.length) {
      await db.insert(offers).values({ providerId: provider.id, serviceTypeId: service.id, title: profiles[i].title, description: profiles[i].offer, priceType: priceModels[i], priceMin: i === 6 ? null : i < 3 ? ["800.00", "1000.00", "1200.00"][i] : i === 3 ? "90.00" : "1500.00", priceMax: i === 4 ? "3000.00" : null, deadlineType: i === 3 || i === 6 ? "A_COMBINAR" : i === 4 ? "INTERVALO" : i === 5 ? "A_PARTIR_DE" : "FIXO", deadlineMinDays: i === 3 || i === 6 ? null : 7 + i, deadlineMaxDays: i === 4 ? 30 : null, active: true });
    }
  }
  const client = await db.select({ id: user.id }).from(user).where(eq(user.email, "cliente1@demo.example")).limit(1);
  const clientAccount = client[0] ?? (await auth.api.signUpEmail({ body: { email: "cliente1@demo.example", password, name: "Cliente Demo" } })).user;
  await setAccountType(clientAccount.id, "CLIENTE");
  const targets = await db.select({ id: providers.id }).from(providers).where(eq(providers.slug, "prestador-demo-1"));
  if (targets[0]) {
    // Exemplo de "Avaliação anterior, sem contratação verificada" (herança do MVP 1): sem Proposta ACEITA, então o trigger
    // da migration 0005 a recusaria. Ele é desativado só neste INSERT, na mesma transação (mesma conexão), e reativado em seguida.
    const [existing] = await db.select({ id: reviews.id }).from(reviews).where(and(eq(reviews.userId, clientAccount.id), eq(reviews.providerId, targets[0].id))).limit(1);
    if (!existing) await db.transaction(async (tx) => {
      await tx.execute(sql.raw(`ALTER TABLE avaliacao DISABLE TRIGGER ${REVIEW_ACCEPTANCE_TRIGGER}`));
      await tx.insert(reviews).values({ userId: clientAccount.id, providerId: targets[0].id, rating: 4, comment: "Bom atendimento em um trabalho feito antes de a contratação pela plataforma existir." }).onConflictDoNothing();
      await tx.execute(sql.raw(`ALTER TABLE avaliacao ENABLE TRIGGER ${REVIEW_ACCEPTANCE_TRIGGER}`));
    });
  }
  const scenarios = await seedDemoScenarios(password);
  console.info(`Demo pronta: 20 perfis, ${scenarios.clients} clientes e ${scenarios.projects} projetos (${scenarios.created} criados agora). Login prestador1@demo.example ou cliente1@demo.example; senha definida por DEMO_PASSWORD ou padrão local documentado.`);
}

seedDemo().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Falha ao criar demonstração."); process.exitCode = 1; }).finally(() => pool.end());
