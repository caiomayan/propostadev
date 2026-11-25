// Resume um erro do banco para o log do build sem vazar credenciais: código do Postgres/rede e mensagem,
// percorrendo a cadeia de `cause` (o Drizzle embrulha o erro do driver) e apagando qualquer connection string.
const CONNECTION_STRING = /postgres(?:ql)?:\/\/\S+/gi;

export function describeDbError(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; current && depth < 5; depth++) {
    if (typeof current !== "object") { parts.push(String(current)); break; }
    const { code, message, cause } = current as { code?: unknown; message?: unknown; cause?: unknown };
    const text = [typeof code === "string" ? code : null, typeof message === "string" ? message.split("\n")[0] : null].filter(Boolean).join(" ");
    if (text) parts.push(text);
    current = cause;
  }
  const summary = parts.join(" ← ").replace(CONNECTION_STRING, "<connection string omitida>").slice(0, 500);
  return summary || "erro sem detalhes";
}
