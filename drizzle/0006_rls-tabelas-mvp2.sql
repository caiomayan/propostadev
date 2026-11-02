-- Defesa em profundidade no Supabase: as tabelas do MVP 1 já têm RLS habilitada sem políticas (ver README),
-- e os privilégios padrão de anon/authenticated foram revogados. As tabelas novas do MVP 2 seguem o mesmo padrão.
-- O aplicativo conecta como dono das tabelas, que não é afetado por RLS sem FORCE.
ALTER TABLE "projeto" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "objetivo_triagem" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "objetivo_triagem_tipo" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "proposta" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "convite" ENABLE ROW LEVEL SECURITY;
