# 0005 — Extras do MVP 3: demo realista com aviso no rodapé, Equipe da plataforma por lista de e-mails e Avisos dentro do site

Data: 25/11/2026. Decidido com o dono depois da entrega do MVP 3, antes da Review da Sprint 4 (12h30).

## Contexto

O MVP 3 ficou pronto antes do prazo. O dono pediu demo com cara real em produção e aprovou três extras: um painel da plataforma para conceder o VIP, avisos dentro do site e duas correções da retro (log da migration e checagem de disponibilidade).

## Decisões

1. **A demo perde o sufixo "— Demo" nos nomes, e o rodapé passa a avisar que os dados são fictícios.** Substitui a convenção do MVP 2 (nome com "— Demo"). O site é público, então o aviso continua existindo, só que numa linha discreta do rodapé, e não em cada nome. Pessoa física tem nome de pessoa, pessoa jurídica tem nome de empresa, e o Perfil usa o endereço gerado do nome. Os logins seguem `@demo.example` (testes e colegas usam). O e-mail de contato público usa domínio reservado `.example`, que nunca entrega mensagem a ninguém real. As fotos continuam abstratas (docs/ARCHITECTURE.md proíbe fotos de pessoas inventadas).
2. **A Equipe da plataforma é uma lista de e-mails em variável de ambiente (`PLATAFORMA_EMAILS`), sem papel no banco.** Alternativas: plugin de admin do Better Auth (cria colunas e telas de usuário que não usamos) ou coluna de papel (migration e tela para conceder papel). A lista basta para um painel que só concede e retira o VIP. Quem não está na lista recebe 404, para não revelar a página. Só vale e-mail confirmado. O selo continua derivado (ADR 0004, decisão 2): o painel não toca nele.
3. **Avisos são gravados na mesma transação da ação que os gera e só aparecem dentro do site.** Sem e-mail (a demo usa endereços que não entregam e um e-mail real exigiria opt-out e cuidado com spam). Sem tempo real: o número de não lidos atualiza a cada navegação. Gravar o aviso (e não derivá-lo das Propostas e Convites) mantém o "lido" por aviso e não muda as consultas existentes.

## Consequências

- Uma migration aditiva (tabela de Avisos, com RLS como as demais).
- Uma variável nova na Vercel (`PLATAFORMA_EMAILS`, não secreta), gravada pelo coordenador em Production.
- Os endereços antigos `/prestadores/prestador-demo-N` deixam de existir; o roteiro e os testes passam a usar os novos.
