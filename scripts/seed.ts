import { db, pool } from "../src/lib/db";
import { and, eq, inArray, notInArray } from "drizzle-orm";
import { categories, serviceTypes, triageGoals, triageGoalServices } from "../src/lib/db/schema";
import { goalSeeds } from "../src/modules/triage/goals";

export const catalog = [
  { name: "Web", slug: "web", services: [{ name: "Landing Page", slug: "landing-page" }, { name: "Site institucional", slug: "site-institucional" }, { name: "E-commerce", slug: "e-commerce" }, { name: "Sistema web", slug: "sistema-web" }] },
  { name: "Backend e APIs", slug: "backend-e-apis", services: [{ name: "API", slug: "api" }, { name: "Backend", slug: "backend" }] },
  { name: "Manutenção e Integrações", slug: "manutencao-e-integracoes", services: [{ name: "Manutenção web", slug: "manutencao-web" }, { name: "Integração de sistemas", slug: "integracao-de-sistemas" }] },
];

export async function seedCatalog() {
  await db.transaction(async (tx) => {
    for (const category of catalog) {
      const [saved] = await tx.insert(categories).values({ name: category.name, slug: category.slug }).onConflictDoUpdate({ target: categories.slug, set: { name: category.name } }).returning({ id: categories.id });
      for (const service of category.services) {
        await tx.insert(serviceTypes).values({ categoryId: saved.id, ...service }).onConflictDoUpdate({ target: serviceTypes.slug, set: { name: service.name, categoryId: saved.id } });
      }
    }
    // Mapeamento objetivo → Tipos de serviço da Triagem (ticket 04); idempotente e sem apagar objetivos fora do seed.
    for (const [index, goal] of goalSeeds.entries()) {
      const [saved] = await tx.insert(triageGoals).values({ slug: goal.slug, label: goal.label, hint: goal.hint, position: index + 1 }).onConflictDoUpdate({ target: triageGoals.slug, set: { label: goal.label, hint: goal.hint, position: index + 1, updatedAt: new Date() } }).returning({ id: triageGoals.id });
      const types = await tx.select({ id: serviceTypes.id, slug: serviceTypes.slug }).from(serviceTypes).where(inArray(serviceTypes.slug, goal.services));
      const wanted = goal.services.map((slug, position) => ({ goalId: saved.id, serviceTypeId: types.find((type) => type.slug === slug)?.id, position: position + 1 }));
      if (wanted.some((item) => !item.serviceTypeId)) throw new Error(`Objetivo "${goal.slug}" aponta para tipo de serviço fora do catálogo.`);
      await tx.delete(triageGoalServices).where(and(eq(triageGoalServices.goalId, saved.id), notInArray(triageGoalServices.serviceTypeId, wanted.map((item) => item.serviceTypeId!))));
      for (const item of wanted) await tx.insert(triageGoalServices).values({ goalId: item.goalId, serviceTypeId: item.serviceTypeId!, position: item.position }).onConflictDoUpdate({ target: [triageGoalServices.goalId, triageGoalServices.serviceTypeId], set: { position: item.position } });
    }
  });
}

if (process.argv[1]?.replaceAll("\\", "/").endsWith("/seed.ts")) {
  seedCatalog().then(() => console.info(`Catálogo atualizado: 3 categorias, 8 tipos de serviço, ${goalSeeds.length} objetivos de triagem.`)).catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Falha ao atualizar catálogo."); process.exitCode = 1; }).finally(() => pool.end());
}
