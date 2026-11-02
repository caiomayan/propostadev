-- Ticket 07: só quem tem Proposta ACEITA daquele Prestador, em Projeto próprio, pode criar uma Avaliação.
-- Vale só para INSERT: editar ou excluir uma Avaliação própria (inclusive as do MVP 1, sem Aceite) continua permitido.
-- O nome começa depois de avaliacao_no_self_review: triggers do mesmo evento disparam em ordem alfabética,
-- então a autoavaliação continua recebendo a própria mensagem.
CREATE OR REPLACE FUNCTION proposta_require_accepted_proposal_for_review() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM proposta pr JOIN projeto pj ON pj.id = pr.projeto_id
    WHERE pr.prestador_id = NEW.prestador_id AND pr.status = 'ACEITA' AND pj.cliente_id = NEW.usuario_id
  ) THEN
    RAISE EXCEPTION 'Só quem contratou este prestador por uma Proposta aceita pode avaliá-lo.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER avaliacao_requer_aceite BEFORE INSERT ON avaliacao FOR EACH ROW EXECUTE FUNCTION proposta_require_accepted_proposal_for_review();
