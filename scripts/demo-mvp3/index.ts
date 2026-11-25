import { seedDemoAvisos } from "./avisos";
import { seedDemoIdentidades } from "./identidades";
import { seedDemoOportunidades } from "./oportunidades";
import { seedDemoPlataforma } from "./plataforma";
import { seedDemoPrecosExternos } from "./precos-externos";
import { seedDemoSelo } from "./selo";
import { seedDemoVip } from "./vip";

// MVP 3: cada ticket preenche só o seu módulo, para não disputar este arquivo nem o seed-demo.ts.
// Preços externos de demonstração só existem fora de produção (ADR 0004): em produção entra apenas a coleta real.
export async function seedDemoMvp3(options: { includeDemoExternalPrices: boolean }) {
  await seedDemoIdentidades(); // primeiro: os demais localizam Prestadores pelo slug novo
  await seedDemoSelo();
  await seedDemoOportunidades();
  await seedDemoVip();
  // Depois das Oportunidades: lê os Convites e Propostas que elas criam.
  await seedDemoAvisos();
  if (options.includeDemoExternalPrices) await seedDemoPrecosExternos();
  await seedDemoPlataforma(); // depois do VIP: os pedidos só valem para quem não é VIP; por último porque pode exigir DEMO_PASSWORD
}
