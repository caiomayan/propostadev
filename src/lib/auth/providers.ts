import "server-only";

export const socialProviderIds = ["github", "google"] as const;
export type SocialProviderId = (typeof socialProviderIds)[number];
export const socialProviderLabels: Record<SocialProviderId, string> = { github: "GitHub", google: "Google" };

type Env = Record<string, string | undefined>;
const prefix: Record<SocialProviderId, string> = { github: "GITHUB", google: "GOOGLE" };

// Um provedor só é ativado quando ID e segredo existem; sem eles, o botão não é renderizado.
export function enabledSocialProviders(env: Env = process.env): SocialProviderId[] {
  return socialProviderIds.filter((id) => Boolean(env[`${prefix[id]}_CLIENT_ID`]?.trim() && env[`${prefix[id]}_CLIENT_SECRET`]?.trim()));
}
export function socialProviderConfig(env: Env = process.env) {
  const config: Partial<Record<SocialProviderId, { clientId: string; clientSecret: string }>> = {};
  for (const id of enabledSocialProviders(env)) config[id] = { clientId: env[`${prefix[id]}_CLIENT_ID`]!.trim(), clientSecret: env[`${prefix[id]}_CLIENT_SECRET`]!.trim() };
  return config;
}
