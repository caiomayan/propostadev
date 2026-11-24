CREATE TYPE "public"."preco_externo_status" AS ENUM('OK', 'FALHA');--> statement-breakpoint
CREATE TABLE "preco_mercado_externo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo_servico_id" uuid NOT NULL,
	"fonte_nome" varchar(100) NOT NULL,
	"fonte_url" text NOT NULL,
	"valor_min" numeric(10, 2),
	"valor_max" numeric(10, 2),
	"trecho" text,
	"status" "preco_externo_status" NOT NULL,
	"erro" text,
	"coletado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "preco_externo_valores_validos" CHECK (("preco_mercado_externo"."status" = 'FALHA' AND "preco_mercado_externo"."valor_min" IS NULL AND "preco_mercado_externo"."valor_max" IS NULL) OR ("preco_mercado_externo"."status" = 'OK' AND "preco_mercado_externo"."valor_min" IS NOT NULL AND "preco_mercado_externo"."valor_max" IS NOT NULL AND "preco_mercado_externo"."valor_min" > 0 AND "preco_mercado_externo"."valor_max" >= "preco_mercado_externo"."valor_min")),
	CONSTRAINT "preco_externo_fonte_valida" CHECK (btrim("preco_mercado_externo"."fonte_nome") <> '' AND "preco_mercado_externo"."fonte_url" ~ '^https://')
);
--> statement-breakpoint
CREATE TABLE "interesse_vip" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prestador_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "perfil_prestador" ADD COLUMN "vip" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "preco_mercado_externo" ADD CONSTRAINT "preco_mercado_externo_tipo_servico_id_tipo_servico_id_fk" FOREIGN KEY ("tipo_servico_id") REFERENCES "public"."tipo_servico"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interesse_vip" ADD CONSTRAINT "interesse_vip_prestador_id_perfil_prestador_id_fk" FOREIGN KEY ("prestador_id") REFERENCES "public"."perfil_prestador"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "preco_externo_tipo_fonte_idx" ON "preco_mercado_externo" USING btree ("tipo_servico_id","fonte_url","coletado_em");--> statement-breakpoint
CREATE UNIQUE INDEX "interesse_vip_prestador_unique" ON "interesse_vip" USING btree ("prestador_id");--> statement-breakpoint
-- Defesa em profundidade no Supabase, como em 0006: RLS sem políticas nas tabelas novas.
ALTER TABLE "interesse_vip" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "preco_mercado_externo" ENABLE ROW LEVEL SECURITY;
