CREATE TYPE "public"."aviso_tipo" AS ENUM('CONVITE_RECEBIDO', 'PROPOSTA_RECEBIDA', 'PROPOSTA_PRE_SELECIONADA', 'PROPOSTA_ACEITA', 'PROPOSTA_RECUSADA');--> statement-breakpoint
CREATE TABLE "aviso" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" text NOT NULL,
	"tipo" "aviso_tipo" NOT NULL,
	"projeto_id" uuid NOT NULL,
	"lido_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "aviso" ADD CONSTRAINT "aviso_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aviso" ADD CONSTRAINT "aviso_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "aviso_usuario_recentes_idx" ON "aviso" USING btree ("usuario_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "aviso_usuario_nao_lidos_idx" ON "aviso" USING btree ("usuario_id") WHERE "aviso"."lido_em" IS NULL;--> statement-breakpoint
-- Defesa em profundidade no Supabase, como em 0006 e 0007: RLS sem políticas na tabela nova.
ALTER TABLE "aviso" ENABLE ROW LEVEL SECURITY;
