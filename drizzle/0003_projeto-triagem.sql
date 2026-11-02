CREATE TYPE "public"."orcamento_tipo" AS ENUM('FAIXA', 'ATE', 'NAO_SEI');--> statement-breakpoint
CREATE TYPE "public"."projeto_status" AS ENUM('ABERTO', 'ENCERRADO', 'CANCELADO');--> statement-breakpoint
CREATE TABLE "projeto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" text NOT NULL,
	"tipo_servico_id" uuid NOT NULL,
	"titulo" varchar(120) NOT NULL,
	"descricao" text NOT NULL,
	"orcamento_tipo" "orcamento_tipo" NOT NULL,
	"orcamento_min" numeric(10, 2),
	"orcamento_max" numeric(10, 2),
	"prazo_desejado_dias" integer,
	"status" "projeto_status" DEFAULT 'ABERTO' NOT NULL,
	"proposta_aceita_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projeto_titulo_valido" CHECK (char_length(btrim("projeto"."titulo")) between 5 and 120),
	CONSTRAINT "projeto_descricao_valida" CHECK (char_length(btrim("projeto"."descricao")) between 30 and 5000),
	CONSTRAINT "projeto_prazo_valido" CHECK ("projeto"."prazo_desejado_dias" IS NULL OR "projeto"."prazo_desejado_dias" BETWEEN 1 AND 3650),
	CONSTRAINT "projeto_orcamento_valido" CHECK (("projeto"."orcamento_tipo" = 'NAO_SEI' AND "projeto"."orcamento_min" IS NULL AND "projeto"."orcamento_max" IS NULL) OR ("projeto"."orcamento_tipo" = 'ATE' AND "projeto"."orcamento_min" IS NULL AND "projeto"."orcamento_max" IS NOT NULL AND "projeto"."orcamento_max" > 0) OR ("projeto"."orcamento_tipo" = 'FAIXA' AND "projeto"."orcamento_min" IS NOT NULL AND "projeto"."orcamento_max" IS NOT NULL AND "projeto"."orcamento_min" > 0 AND "projeto"."orcamento_max" >= "projeto"."orcamento_min")),
	CONSTRAINT "projeto_aceite_so_encerrado" CHECK ("projeto"."proposta_aceita_id" IS NULL OR "projeto"."status" = 'ENCERRADO')
);
--> statement-breakpoint
CREATE TABLE "objetivo_triagem_tipo" (
	"objetivo_id" uuid NOT NULL,
	"tipo_servico_id" uuid NOT NULL,
	"ordem" smallint NOT NULL,
	CONSTRAINT "objetivo_triagem_tipo_pk" PRIMARY KEY("objetivo_id","tipo_servico_id")
);
--> statement-breakpoint
CREATE TABLE "objetivo_triagem" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"rotulo" varchar(120) NOT NULL,
	"dica" varchar(200),
	"ordem" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "objetivo_triagem_texto_valido" CHECK (btrim("objetivo_triagem"."slug") <> '' AND btrim("objetivo_triagem"."rotulo") <> '')
);
--> statement-breakpoint
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_cliente_id_user_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_tipo_servico_id_tipo_servico_id_fk" FOREIGN KEY ("tipo_servico_id") REFERENCES "public"."tipo_servico"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "objetivo_triagem_tipo" ADD CONSTRAINT "objetivo_triagem_tipo_objetivo_id_objetivo_triagem_id_fk" FOREIGN KEY ("objetivo_id") REFERENCES "public"."objetivo_triagem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "objetivo_triagem_tipo" ADD CONSTRAINT "objetivo_triagem_tipo_tipo_servico_id_tipo_servico_id_fk" FOREIGN KEY ("tipo_servico_id") REFERENCES "public"."tipo_servico"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projeto_cliente_status_idx" ON "projeto" USING btree ("cliente_id","status");--> statement-breakpoint
CREATE INDEX "projeto_tipo_status_idx" ON "projeto" USING btree ("tipo_servico_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "objetivo_triagem_slug_unique" ON "objetivo_triagem" USING btree ("slug");