// Senha da conta demo da Equipe. A senha padrão é pública (README): só vale em banco local.
export const LOCAL_DEMO_PASSWORD = "Demo-local-2026!";

export function demoPasswordForNewAccount(databaseUrl: string | undefined, demoPassword: string | undefined): string {
  if (demoPassword) return demoPassword;
  const host = new URL(databaseUrl ?? "postgres://invalid").hostname;
  if (["localhost", "127.0.0.1"].includes(host)) return LOCAL_DEMO_PASSWORD;
  throw new Error("Defina DEMO_PASSWORD (a senha das contas demo) para criar a conta da Equipe fora do banco local.");
}
