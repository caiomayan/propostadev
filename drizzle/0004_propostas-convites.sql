CREATE TYPE "public"."proposta_status" AS ENUM('ENVIADA', 'PRE_SELECIONADA', 'RECUSADA', 'ACEITA', 'RETIRADA');--> statement-breakpoint
CREATE TABLE "convite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"projeto_id" uuid NOT NULL,
	"prestador_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposta" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"projeto_id" uuid NOT NULL,
	"prestador_id" uuid NOT NULL,
	"valor" numeric(10, 2) NOT NULL,
	"prazo_dias" integer NOT NULL,
	"mensagem" text NOT NULL,
	"status" "proposta_status" DEFAULT 'ENVIADA' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proposta_valor_valido" CHECK ("proposta"."valor" > 0 AND "proposta"."valor" <= 99999999.99),
	CONSTRAINT "proposta_prazo_valido" CHECK ("proposta"."prazo_dias" BETWEEN 1 AND 3650),
	CONSTRAINT "proposta_mensagem_valida" CHECK (char_length(btrim("proposta"."mensagem")) between 30 and 3000)
);
--> statement-breakpoint
-- Limite de descrição passa de 5.000 para 2.000 (o rascunho vive na URL): ajusta linhas antigas antes do novo check.
UPDATE "projeto" SET "descricao" = left("descricao", 2000) WHERE char_length("descricao") > 2000;--> statement-breakpoint
ALTER TABLE "projeto" DROP CONSTRAINT "projeto_descricao_valida";--> statement-breakpoint
ALTER TABLE "convite" ADD CONSTRAINT "convite_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "convite" ADD CONSTRAINT "convite_prestador_id_perfil_prestador_id_fk" FOREIGN KEY ("prestador_id") REFERENCES "public"."perfil_prestador"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposta" ADD CONSTRAINT "proposta_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposta" ADD CONSTRAINT "proposta_prestador_id_perfil_prestador_id_fk" FOREIGN KEY ("prestador_id") REFERENCES "public"."perfil_prestador"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "convite_projeto_prestador_unique" ON "convite" USING btree ("projeto_id","prestador_id");--> statement-breakpoint
CREATE INDEX "convite_prestador_idx" ON "convite" USING btree ("prestador_id");--> statement-breakpoint
CREATE UNIQUE INDEX "proposta_projeto_prestador_unique" ON "proposta" USING btree ("projeto_id","prestador_id");--> statement-breakpoint
CREATE UNIQUE INDEX "proposta_aceita_por_projeto_unique" ON "proposta" USING btree ("projeto_id") WHERE "proposta"."status" = 'ACEITA';--> statement-breakpoint
CREATE INDEX "proposta_projeto_status_idx" ON "proposta" USING btree ("projeto_id","status");--> statement-breakpoint
CREATE INDEX "proposta_prestador_status_idx" ON "proposta" USING btree ("prestador_id","status");--> statement-breakpoint
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_proposta_aceita_id_proposta_id_fk" FOREIGN KEY ("proposta_aceita_id") REFERENCES "public"."proposta"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_descricao_valida" CHECK (char_length(btrim("projeto"."descricao")) between 30 and 2000);