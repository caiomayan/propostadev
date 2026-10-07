import { sql } from "drizzle-orm";
import { boolean, check, index, integer, numeric, pgEnum, pgTable, smallint, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const providerTypes = ["PESSOA_FISICA", "PESSOA_JURIDICA"] as const;
export const priceTypes = ["FIXO", "A_PARTIR_DE", "INTERVALO", "POR_HORA", "SOB_CONSULTA"] as const;
export const deadlineTypes = ["FIXO", "INTERVALO", "A_PARTIR_DE", "A_COMBINAR"] as const;
export const providerType = pgEnum("tipo_prestador", providerTypes);
export const priceType = pgEnum("tipo_preco", priceTypes);
export const deadlineType = pgEnum("tipo_prazo", deadlineTypes);
const dates = () => ({ createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull() });

export const providers = pgTable("perfil_prestador", {
  id: uuid("id").defaultRandom().primaryKey(), userId: text("usuario_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  slug: varchar("slug", { length: 160 }).notNull(), type: providerType("tipo").notNull(), displayName: varchar("nome_exibicao", { length: 100 }).notNull(),
  description: text("descricao").notNull(), yearsExperience: smallint("anos_experiencia").notNull(), photoUrl: text("foto_url"), city: varchar("cidade", { length: 100 }),
  state: varchar("uf", { length: 2 }), country: varchar("pais", { length: 2 }).default("BR").notNull(), contactEmail: varchar("email_contato", { length: 254 }).notNull(),
  phone: varchar("telefone", { length: 20 }), whatsapp: varchar("whatsapp", { length: 20 }), siteUrl: text("site_url"), githubUrl: text("github_url"), linkedinUrl: text("linkedin_url"),
  contactsPublishedAt: timestamp("contatos_publicados_em", { withTimezone: true }).notNull(), active: boolean("ativo").default(true).notNull(), ...dates(),
}, (t) => [uniqueIndex("perfil_usuario_unique").on(t.userId), uniqueIndex("perfil_slug_unique").on(t.slug),
  check("perfil_nome_valido", sql`char_length(btrim(${t.displayName})) between 2 and 100`), check("perfil_descricao_valida", sql`char_length(btrim(${t.description})) between 30 and 5000`),
  check("perfil_experiencia_valida", sql`${t.yearsExperience} between 0 and 80`), check("perfil_email_nao_vazio", sql`btrim(${t.contactEmail}) <> ''`),
  check("perfil_localizacao_valida", sql`${t.country} ~ '^[A-Z]{2}$' AND (${t.state} IS NULL OR ${t.state} ~ '^[A-Z]{2}$')`),
  check("perfil_slug_valido", sql`btrim(${t.slug}) <> ''`)]);

export const categories = pgTable("categoria", { id: uuid("id").defaultRandom().primaryKey(), name: varchar("nome", { length: 100 }).notNull(), slug: varchar("slug", { length: 120 }).notNull(), active: boolean("ativo").default(true).notNull(), ...dates() }, (t) => [uniqueIndex("categoria_slug_unique").on(t.slug), check("categoria_texto_valido", sql`btrim(${t.name}) <> '' AND btrim(${t.slug}) <> ''`)]);
export const serviceTypes = pgTable("tipo_servico", { id: uuid("id").defaultRandom().primaryKey(), categoryId: uuid("categoria_id").notNull().references(() => categories.id, { onDelete: "restrict" }), name: varchar("nome", { length: 100 }).notNull(), slug: varchar("slug", { length: 120 }).notNull(), description: text("descricao"), active: boolean("ativo").default(true).notNull(), ...dates() }, (t) => [uniqueIndex("tipo_servico_slug_unique").on(t.slug), index("tipo_servico_categoria_idx").on(t.categoryId), check("tipo_servico_texto_valido", sql`btrim(${t.name}) <> '' AND btrim(${t.slug}) <> ''`)]);
export const offers = pgTable("oferta_servico", {
  id: uuid("id").defaultRandom().primaryKey(), providerId: uuid("prestador_id").notNull().references(() => providers.id, { onDelete: "cascade" }), serviceTypeId: uuid("tipo_servico_id").notNull().references(() => serviceTypes.id, { onDelete: "restrict" }),
  title: varchar("titulo", { length: 120 }).notNull(), description: text("descricao").notNull(), priceType: priceType("tipo_preco").notNull(), priceMin: numeric("preco_minimo", { precision: 10, scale: 2 }), priceMax: numeric("preco_maximo", { precision: 10, scale: 2 }),
  deadlineType: deadlineType("tipo_prazo").notNull(), deadlineMinDays: integer("prazo_minimo_dias"), deadlineMaxDays: integer("prazo_maximo_dias"), active: boolean("ativo").default(false).notNull(), deletedAt: timestamp("deleted_at", { withTimezone: true }), ...dates(),
}, (t) => [index("oferta_prestador_idx").on(t.providerId), index("oferta_tipo_ativo_idx").on(t.serviceTypeId, t.active), uniqueIndex("oferta_ativa_por_tipo_unique").on(t.providerId, t.serviceTypeId).where(sql`${t.active} AND ${t.deletedAt} IS NULL`),
  check("oferta_titulo_valido", sql`char_length(btrim(${t.title})) between 5 and 120`), check("oferta_descricao_valida", sql`char_length(btrim(${t.description})) between 30 and 5000`), check("oferta_excluida_inativa", sql`${t.deletedAt} IS NULL OR ${t.active} = false`),
  check("oferta_preco_valido", sql`(${t.priceType} = 'SOB_CONSULTA' AND ${t.priceMin} IS NULL AND ${t.priceMax} IS NULL) OR (${t.priceType} IN ('FIXO', 'A_PARTIR_DE', 'POR_HORA') AND ${t.priceMin} IS NOT NULL AND ${t.priceMin} > 0 AND ${t.priceMax} IS NULL) OR (${t.priceType} = 'INTERVALO' AND ${t.priceMin} IS NOT NULL AND ${t.priceMax} IS NOT NULL AND ${t.priceMin} > 0 AND ${t.priceMax} >= ${t.priceMin})`),
  check("oferta_prazo_valido", sql`(${t.deadlineType} = 'A_COMBINAR' AND ${t.deadlineMinDays} IS NULL AND ${t.deadlineMaxDays} IS NULL) OR (${t.deadlineType} IN ('FIXO', 'A_PARTIR_DE') AND ${t.deadlineMinDays} IS NOT NULL AND ${t.deadlineMinDays} BETWEEN 1 AND 3650 AND ${t.deadlineMaxDays} IS NULL) OR (${t.deadlineType} = 'INTERVALO' AND ${t.deadlineMinDays} IS NOT NULL AND ${t.deadlineMaxDays} IS NOT NULL AND ${t.deadlineMinDays} BETWEEN 1 AND 3650 AND ${t.deadlineMaxDays} BETWEEN ${t.deadlineMinDays} AND 3650)`)]);
export const reviews = pgTable("avaliacao", { id: uuid("id").defaultRandom().primaryKey(), userId: text("usuario_id").notNull().references(() => user.id, { onDelete: "cascade" }), providerId: uuid("prestador_id").notNull().references(() => providers.id, { onDelete: "cascade" }), rating: smallint("nota").notNull(), comment: text("comentario"), ...dates() }, (t) => [uniqueIndex("avaliacao_usuario_prestador_unique").on(t.userId, t.providerId), index("avaliacao_prestador_data_idx").on(t.providerId, t.createdAt), check("avaliacao_nota_valida", sql`${t.rating} BETWEEN 1 AND 5`), check("avaliacao_comentario_limite", sql`${t.comment} IS NULL OR char_length(${t.comment}) <= 2000`)]);
export type Provider = typeof providers.$inferSelect;
export type Offer = typeof offers.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type ServiceType = typeof serviceTypes.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export const mutationRateLimits = pgTable("mutation_rate_limit", { key: text("key").primaryKey(), count: integer("count").default(1).notNull(), windowStartedAt: timestamp("window_started_at", { withTimezone: true }).defaultNow().notNull() });
