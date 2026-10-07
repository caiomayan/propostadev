import { db, pool } from "../src/lib/db";
import { categories, serviceTypes } from "../src/lib/db/schema";

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
  });
}

if (process.argv[1]?.replaceAll("\\", "/").endsWith("/seed.ts")) {
  seedCatalog().then(() => console.info("Catálogo atualizado: 3 categorias, 8 tipos de serviço.")).catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Falha ao atualizar catálogo."); process.exitCode = 1; }).finally(() => pool.end());
}
