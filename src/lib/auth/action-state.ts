export type ActionState = { error?: string; success?: string; fields?: Record<string, string[] | undefined> };
export const initialState: ActionState = {};

// Destino interno informado em ?next, ou null quando ausente/inválido. Preserva a query string inteira.
export function internalNext(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  const destination = safeDestination(value);
  return destination === value ? destination : null;
}
export function withNext(path: string, next: string | null) {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}

export function safeDestination(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\u0000-\u001f]/.test(value)) return "/painel";
  return value;
}
