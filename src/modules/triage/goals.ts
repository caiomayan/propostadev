// Mapeamento versionado de objetivo (linguagem simples) → Tipos de serviço do catálogo. Sem IA.
// Fonte única: scripts/seed.ts grava estes dados nas tabelas objetivo_triagem e objetivo_triagem_tipo.
// Os slugs de tipo precisam existir no catálogo do seed (tests/unit/triage.test.ts confere).
export type GoalSeed = { slug: string; label: string; hint: string; services: string[] };

export const goalSeeds: GoalSeed[] = [
  { slug: "vender-online", label: "Quero vender online", hint: "Loja virtual ou página de venda", services: ["e-commerce", "landing-page"] },
  { slug: "site-da-empresa", label: "Preciso de um site para minha empresa", hint: "Apresentar o negócio e ser encontrado", services: ["site-institucional", "landing-page"] },
  { slug: "divulgar-campanha", label: "Quero divulgar um produto ou campanha", hint: "Uma página focada em uma ação", services: ["landing-page", "site-institucional"] },
  { slug: "automatizar-processo", label: "Quero automatizar um processo", hint: "Trocar planilhas e tarefas manuais por um sistema", services: ["sistema-web", "backend", "integracao-de-sistemas"] },
  { slug: "integrar-sistemas", label: "Preciso integrar sistemas", hint: "Fazer ferramentas diferentes conversarem", services: ["integracao-de-sistemas", "api"] },
  { slug: "sistema-sob-medida", label: "Quero um sistema sob medida", hint: "Um sistema web feito para o seu fluxo", services: ["sistema-web", "backend", "api"] },
  { slug: "api-para-aplicativo", label: "Preciso de uma API para meu aplicativo", hint: "Servidor e dados para um app ou site", services: ["api", "backend"] },
  { slug: "manutencao", label: "Meu sistema precisa de manutenção", hint: "Corrigir, atualizar ou evoluir o que já existe", services: ["manutencao-web", "sistema-web", "backend"] },
];
