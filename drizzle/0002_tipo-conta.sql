ALTER TABLE "user" ADD COLUMN "tipo_conta" text;
--> statement-breakpoint
-- Backfill (ADR 0003): quem tem perfil de prestador vira PRESTADOR; os demais, CLIENTE.
UPDATE "user" SET "tipo_conta" = CASE WHEN EXISTS (SELECT 1 FROM perfil_prestador WHERE perfil_prestador.usuario_id = "user".id) THEN 'PRESTADOR' ELSE 'CLIENTE' END;
--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_tipo_conta_check" CHECK ("tipo_conta" IS NULL OR "tipo_conta" IN ('CLIENTE', 'PRESTADOR'));
--> statement-breakpoint
CREATE OR REPLACE FUNCTION proposta_tipo_conta_imutavel() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.tipo_conta IS NOT NULL AND NEW.tipo_conta IS DISTINCT FROM OLD.tipo_conta THEN
    RAISE EXCEPTION 'O tipo de conta não pode ser alterado.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER user_tipo_conta_imutavel BEFORE UPDATE ON "user" FOR EACH ROW EXECUTE FUNCTION proposta_tipo_conta_imutavel();
