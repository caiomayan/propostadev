CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION proposta_touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = clock_timestamp();
  RETURN NEW;
END;
$$;

CREATE TRIGGER perfil_touch_updated_at BEFORE UPDATE ON perfil_prestador FOR EACH ROW EXECUTE FUNCTION proposta_touch_updated_at();
CREATE TRIGGER categoria_touch_updated_at BEFORE UPDATE ON categoria FOR EACH ROW EXECUTE FUNCTION proposta_touch_updated_at();
CREATE TRIGGER tipo_servico_touch_updated_at BEFORE UPDATE ON tipo_servico FOR EACH ROW EXECUTE FUNCTION proposta_touch_updated_at();
CREATE TRIGGER oferta_touch_updated_at BEFORE UPDATE ON oferta_servico FOR EACH ROW EXECUTE FUNCTION proposta_touch_updated_at();
CREATE TRIGGER avaliacao_touch_updated_at BEFORE UPDATE ON avaliacao FOR EACH ROW EXECUTE FUNCTION proposta_touch_updated_at();

CREATE OR REPLACE FUNCTION proposta_prevent_owner_transfer() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.usuario_id IS DISTINCT FROM OLD.usuario_id THEN
    RAISE EXCEPTION 'O responsável pelo perfil não pode ser transferido.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER perfil_owner_immutable BEFORE UPDATE ON perfil_prestador FOR EACH ROW EXECUTE FUNCTION proposta_prevent_owner_transfer();

CREATE OR REPLACE FUNCTION proposta_prevent_self_review() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM perfil_prestador WHERE id = NEW.prestador_id AND usuario_id = NEW.usuario_id) THEN
    RAISE EXCEPTION 'Você não pode avaliar seu próprio perfil.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER avaliacao_no_self_review BEFORE INSERT OR UPDATE ON avaliacao FOR EACH ROW EXECUTE FUNCTION proposta_prevent_self_review();
