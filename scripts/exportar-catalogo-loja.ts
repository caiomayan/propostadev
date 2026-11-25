// Exporta o catálogo público da demo (Ofertas ativas dos Prestadores @demo.example, com Avaliações) para a loja WooCommerce (ADR 0006).
// Só leitura. Rodar com a DATABASE_URL do ambiente desejado: pnpm exec tsx --conditions=react-server scripts/exportar-catalogo-loja.ts
import { writeFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { db } from "../src/lib/db";

async function main() {
  const offers = await db.execute(sql`
    SELECT o.id, o.titulo, o.descricao, o.tipo_preco, o.preco_minimo::text, o.preco_maximo::text, o.tipo_prazo, o.prazo_minimo_dias, o.prazo_maximo_dias,
           t.nome AS tipo, t.slug AS tipo_slug, c.nome AS categoria, c.slug AS categoria_slug,
           p.slug AS prestador_slug, p.nome_exibicao AS prestador, p.tipo AS prestador_tipo, p.descricao AS prestador_descricao, p.anos_experiencia, p.cidade, p.uf, p.vip, p.foto_url
    FROM oferta_servico o JOIN perfil_prestador p ON p.id = o.prestador_id JOIN "user" u ON u.id = p.usuario_id
    JOIN tipo_servico t ON t.id = o.tipo_servico_id JOIN categoria c ON c.id = t.categoria_id
    WHERE o.ativo AND o.deleted_at IS NULL AND u.email LIKE 'prestador%@demo.example'
    ORDER BY c.nome, t.nome, p.nome_exibicao`);
  const reviews = await db.execute(sql`
    SELECT p.slug AS prestador_slug, a.nota, a.comentario, u.name AS autor, a.created_at::date::text AS data
    FROM avaliacao a JOIN perfil_prestador p ON p.id = a.prestador_id JOIN "user" u ON u.id = a.usuario_id JOIN "user" pu ON pu.id = p.usuario_id
    WHERE pu.email LIKE 'prestador%@demo.example' AND a.comentario IS NOT NULL ORDER BY a.created_at`);
  writeFileSync("ecommerce/seed/catalogo.json", JSON.stringify({ ofertas: offers.rows, avaliacoes: reviews.rows }, null, 2));
  console.log(`Catálogo exportado: ${offers.rows.length} Ofertas, ${reviews.rows.length} Avaliações.`);
  process.exit(0);
}
main();
