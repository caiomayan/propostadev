export type ActionState = { error?: string; success?: string; fields?: Record<string, string[] | undefined> };
export const initialState: ActionState = {};

export function safeDestination(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\u0000-\u001f]/.test(value)) return "/painel";
  return value;
}
