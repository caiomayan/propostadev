import { test, expect, type Page } from "@playwright/test";
import { Pool } from "pg";

const password = "Proposta-test-password-2026";
const newPassword = "Proposta-nova-senha-2026!";
const neutral = "Se esse e-mail estiver cadastrado";

async function register(page: Page, name: string, email: string) {
  await page.goto("/cadastro");
  await page.getByLabel("Nome", { exact: true }).fill(name);
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("radio", { name: /Quero contratar/ }).check();
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page).toHaveURL(/\/painel$/);
}

test("sem credenciais, entrar e cadastro não mostram botões OAuth", async ({ page }) => {
  for (const path of ["/entrar", "/cadastro"]) {
    await page.goto(path);
    await expect(page.getByRole("button", { name: /GitHub|Google/ })).toHaveCount(0);
    await expect(page.getByText("ou continue com")).toHaveCount(0);
  }
});

test("mostrar/ocultar senha e indicador de força no cadastro", async ({ page }) => {
  await page.goto("/cadastro");
  const input = page.getByLabel("Senha", { exact: true });
  const toggle = page.getByRole("button", { name: "Mostrar senha" });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await input.fill("curta");
  await expect(page.getByRole("status").filter({ hasText: "Muito curta" })).toContainText("Faltam 7 caracteres");
  await input.fill("correto cavalo bateria grampo");
  await expect(page.getByRole("status").filter({ hasText: "Forte" })).toBeVisible();
  await expect(input).toHaveAttribute("type", "password");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(input).toHaveAttribute("type", "text");
  await toggle.press("Enter");
  await expect(input).toHaveAttribute("type", "password");
});

test("esqueci minha senha: resposta neutra, redefinição de uso único e sessões antigas revogadas", async ({ page, browser, baseURL }) => {
  test.setTimeout(120_000);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_TEST });
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const email = `reset-${suffix}@example.test`;
  try {
    await register(page, "Conta de recuperação", email);
    const other = await browser.newContext({ baseURL });
    const otherPage = await other.newPage();
    await otherPage.goto("/entrar");
    await otherPage.getByLabel("E-mail", { exact: true }).fill(email);
    await otherPage.getByLabel("Senha", { exact: true }).fill(password);
    await otherPage.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(otherPage).toHaveURL(/\/painel$/);

    await page.context().clearCookies();
    await page.goto("/entrar");
    await page.getByRole("link", { name: "Esqueci minha senha" }).click();
    await expect(page).toHaveURL(/\/esqueci-senha$/);
    const messages: string[] = [];
    for (const address of [email, `ninguem-${suffix}@example.test`]) {
      await page.goto("/esqueci-senha");
      await page.getByLabel("E-mail", { exact: true }).fill(address);
      await page.getByRole("button", { name: "Enviar link" }).click();
      const status = page.getByRole("status");
      await expect(status).toContainText(neutral);
      messages.push((await status.textContent()) ?? "");
    }
    expect(messages[0]).toBe(messages[1]);

    const tokens = await pool.query<{ identifier: string }>("SELECT v.identifier FROM verification v JOIN \"user\" u ON u.id = v.value WHERE u.email = $1 AND v.identifier LIKE 'reset-password:%'", [email]);
    expect(tokens.rows).toHaveLength(1);
    const token = tokens.rows[0].identifier.replace("reset-password:", "");
    await page.goto(`/api/auth/reset-password/${token}?callbackURL=/redefinir-senha`);
    await expect(page).toHaveURL(new RegExp(`/redefinir-senha\\?token=${token}$`));
    await page.getByLabel("Nova senha", { exact: true }).fill(newPassword);
    await page.getByRole("button", { name: "Redefinir senha", exact: true }).click();
    await expect(page).toHaveURL(/\/entrar\?senha=redefinida$/);
    await expect(page.getByRole("status").first()).toContainText("Senha redefinida");

    await page.getByLabel("E-mail", { exact: true }).fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page.locator(".form-error")).toContainText("Não foi possível entrar");
    await page.getByLabel("E-mail", { exact: true }).fill(email); // o formulário é limpo após a ação
    await page.getByLabel("Senha", { exact: true }).fill(newPassword);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/\/painel$/);

    await otherPage.goto("/painel");
    await expect(otherPage).toHaveURL(/\/entrar/);
    await other.close();

    await page.goto(`/api/auth/reset-password/${token}?callbackURL=/redefinir-senha`);
    await expect(page.getByRole("heading", { name: "Link inválido." })).toBeVisible();
    await page.goto(`/redefinir-senha?token=${token}`);
    await page.getByLabel("Nova senha", { exact: true }).fill("Outra-senha-2026-xyz");
    await page.getByRole("button", { name: "Redefinir senha", exact: true }).click();
    await expect(page.locator(".form-error")).toContainText("inválido");
  } finally {
    await pool.query("DELETE FROM \"user\" WHERE email = $1", [email]);
    await pool.end();
  }
});

test("painel avisa e-mail não confirmado, permite reenviar e some após a confirmação", async ({ page }) => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_TEST });
  const email = `verify-${Date.now()}-${Math.random().toString(16).slice(2, 8)}@example.test`;
  try {
    await register(page, "Conta a confirmar", email);
    const notice = page.getByRole("region", { name: "Confirmação de e-mail" });
    await expect(notice).toContainText("Confirme seu e-mail");
    await notice.getByRole("button", { name: "Reenviar e-mail" }).click();
    await expect(notice.getByRole("status")).toContainText("novo link");
    await pool.query("UPDATE \"user\" SET email_verified = true WHERE email = $1", [email]);
    await page.reload();
    await expect(page.getByRole("region", { name: "Confirmação de e-mail" })).toHaveCount(0);
  } finally {
    await pool.query("DELETE FROM \"user\" WHERE email = $1", [email]);
    await pool.end();
  }
});
