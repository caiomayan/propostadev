CREATE TYPE "public"."tipo_prazo" AS ENUM('FIXO', 'INTERVALO', 'A_PARTIR_DE', 'A_COMBINAR');--> statement-breakpoint
CREATE TYPE "public"."tipo_preco" AS ENUM('FIXO', 'A_PARTIR_DE', 'INTERVALO', 'POR_HORA', 'SOB_CONSULTA');--> statement-breakpoint
CREATE TYPE "public"."tipo_prestador" AS ENUM('PESSOA_FISICA', 'PESSOA_JURIDICA');--> statement-breakpoint
CREATE TABLE "categoria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(100) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categoria_texto_valido" CHECK (btrim("categoria"."nome") <> '' AND btrim("categoria"."slug") <> '')
);
--> statement-breakpoint
CREATE TABLE "mutation_rate_limit" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"window_started_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oferta_servico" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prestador_id" uuid NOT NULL,
	"tipo_servico_id" uuid NOT NULL,
	"titulo" varchar(120) NOT NULL,
	"descricao" text NOT NULL,
	"tipo_preco" "tipo_preco" NOT NULL,
	"preco_minimo" numeric(10, 2),
	"preco_maximo" numeric(10, 2),
	"tipo_prazo" "tipo_prazo" NOT NULL,
	"prazo_minimo_dias" integer,
	"prazo_maximo_dias" integer,
	"ativo" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "oferta_titulo_valido" CHECK (char_length(btrim("oferta_servico"."titulo")) between 5 and 120),
	CONSTRAINT "oferta_descricao_valida" CHECK (char_length(btrim("oferta_servico"."descricao")) between 30 and 5000),
	CONSTRAINT "oferta_excluida_inativa" CHECK ("oferta_servico"."deleted_at" IS NULL OR "oferta_servico"."ativo" = false),
	CONSTRAINT "oferta_preco_valido" CHECK (("oferta_servico"."tipo_preco" = 'SOB_CONSULTA' AND "oferta_servico"."preco_minimo" IS NULL AND "oferta_servico"."preco_maximo" IS NULL) OR ("oferta_servico"."tipo_preco" IN ('FIXO', 'A_PARTIR_DE', 'POR_HORA') AND "oferta_servico"."preco_minimo" IS NOT NULL AND "oferta_servico"."preco_minimo" > 0 AND "oferta_servico"."preco_maximo" IS NULL) OR ("oferta_servico"."tipo_preco" = 'INTERVALO' AND "oferta_servico"."preco_minimo" IS NOT NULL AND "oferta_servico"."preco_maximo" IS NOT NULL AND "oferta_servico"."preco_minimo" > 0 AND "oferta_servico"."preco_maximo" >= "oferta_servico"."preco_minimo")),
	CONSTRAINT "oferta_prazo_valido" CHECK (("oferta_servico"."tipo_prazo" = 'A_COMBINAR' AND "oferta_servico"."prazo_minimo_dias" IS NULL AND "oferta_servico"."prazo_maximo_dias" IS NULL) OR ("oferta_servico"."tipo_prazo" IN ('FIXO', 'A_PARTIR_DE') AND "oferta_servico"."prazo_minimo_dias" IS NOT NULL AND "oferta_servico"."prazo_minimo_dias" BETWEEN 1 AND 3650 AND "oferta_servico"."prazo_maximo_dias" IS NULL) OR ("oferta_servico"."tipo_prazo" = 'INTERVALO' AND "oferta_servico"."prazo_minimo_dias" IS NOT NULL AND "oferta_servico"."prazo_maximo_dias" IS NOT NULL AND "oferta_servico"."prazo_minimo_dias" BETWEEN 1 AND 3650 AND "oferta_servico"."prazo_maximo_dias" BETWEEN "oferta_servico"."prazo_minimo_dias" AND 3650))
);
--> statement-breakpoint
CREATE TABLE "perfil_prestador" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" text NOT NULL,
	"slug" varchar(160) NOT NULL,
	"tipo" "tipo_prestador" NOT NULL,
	"nome_exibicao" varchar(100) NOT NULL,
	"descricao" text NOT NULL,
	"anos_experiencia" smallint NOT NULL,
	"foto_url" text,
	"cidade" varchar(100),
	"uf" varchar(2),
	"pais" varchar(2) DEFAULT 'BR' NOT NULL,
	"email_contato" varchar(254) NOT NULL,
	"telefone" varchar(20),
	"whatsapp" varchar(20),
	"site_url" text,
	"github_url" text,
	"linkedin_url" text,
	"contatos_publicados_em" timestamp with time zone NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "perfil_nome_valido" CHECK (char_length(btrim("perfil_prestador"."nome_exibicao")) between 2 and 100),
	CONSTRAINT "perfil_descricao_valida" CHECK (char_length(btrim("perfil_prestador"."descricao")) between 30 and 5000),
	CONSTRAINT "perfil_experiencia_valida" CHECK ("perfil_prestador"."anos_experiencia" between 0 and 80),
	CONSTRAINT "perfil_email_nao_vazio" CHECK (btrim("perfil_prestador"."email_contato") <> ''),
	CONSTRAINT "perfil_localizacao_valida" CHECK ("perfil_prestador"."pais" ~ '^[A-Z]{2}$' AND ("perfil_prestador"."uf" IS NULL OR "perfil_prestador"."uf" ~ '^[A-Z]{2}$')),
	CONSTRAINT "perfil_slug_valido" CHECK (btrim("perfil_prestador"."slug") <> '')
);
--> statement-breakpoint
CREATE TABLE "avaliacao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" text NOT NULL,
	"prestador_id" uuid NOT NULL,
	"nota" smallint NOT NULL,
	"comentario" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "avaliacao_nota_valida" CHECK ("avaliacao"."nota" BETWEEN 1 AND 5),
	CONSTRAINT "avaliacao_comentario_limite" CHECK ("avaliacao"."comentario" IS NULL OR char_length("avaliacao"."comentario") <= 2000)
);
--> statement-breakpoint
CREATE TABLE "tipo_servico" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"categoria_id" uuid NOT NULL,
	"nome" varchar(100) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"descricao" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tipo_servico_texto_valido" CHECK (btrim("tipo_servico"."nome") <> '' AND btrim("tipo_servico"."slug") <> '')
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "oferta_servico" ADD CONSTRAINT "oferta_servico_prestador_id_perfil_prestador_id_fk" FOREIGN KEY ("prestador_id") REFERENCES "public"."perfil_prestador"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oferta_servico" ADD CONSTRAINT "oferta_servico_tipo_servico_id_tipo_servico_id_fk" FOREIGN KEY ("tipo_servico_id") REFERENCES "public"."tipo_servico"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perfil_prestador" ADD CONSTRAINT "perfil_prestador_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_prestador_id_perfil_prestador_id_fk" FOREIGN KEY ("prestador_id") REFERENCES "public"."perfil_prestador"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tipo_servico" ADD CONSTRAINT "tipo_servico_categoria_id_categoria_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categoria"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categoria_slug_unique" ON "categoria" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "oferta_prestador_idx" ON "oferta_servico" USING btree ("prestador_id");--> statement-breakpoint
CREATE INDEX "oferta_tipo_ativo_idx" ON "oferta_servico" USING btree ("tipo_servico_id","ativo");--> statement-breakpoint
CREATE UNIQUE INDEX "oferta_ativa_por_tipo_unique" ON "oferta_servico" USING btree ("prestador_id","tipo_servico_id") WHERE "oferta_servico"."ativo" AND "oferta_servico"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "perfil_usuario_unique" ON "perfil_prestador" USING btree ("usuario_id");--> statement-breakpoint
CREATE UNIQUE INDEX "perfil_slug_unique" ON "perfil_prestador" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "avaliacao_usuario_prestador_unique" ON "avaliacao" USING btree ("usuario_id","prestador_id");--> statement-breakpoint
CREATE INDEX "avaliacao_prestador_data_idx" ON "avaliacao" USING btree ("prestador_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tipo_servico_slug_unique" ON "tipo_servico" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "tipo_servico_categoria_idx" ON "tipo_servico" USING btree ("categoria_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");