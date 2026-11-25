import { seedDemoOportunidades } from "./oportunidades";
import { seedDemoPrecosExternos } from "./precos-externos";
import { seedDemoSelo } from "./selo";
import { seedDemoVip } from "./vip";

// MVP 3: cada ticket preenche só o seu módulo, para não disputar este arquivo nem o seed-demo.ts.
// Preços externos de demonstração só existem fora de produção (ADR 0004): em produção entra apenas a coleta real.
export async function seedDemoMvp3(options: { includeDemoExternalPrices: boolean }) {
  await seedDemoSelo();
  await seedDemoOportunidades();
  await seedDemoVip();
  if (options.includeDemoExternalPrices) await seedDemoPrecosExternos();
}
