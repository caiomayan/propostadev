import { test, expect, type Page } from "@playwright/test";
import { Pool } from "pg";
import { confirmEmail, emailCodeCount, expireEmailCode, plantEmailCode } from "./support";

const password = "Proposta-test-password-2026";
const newPassword = "Proposta-nova-senha-2026!";
const neutral = "Se esse e-mail estiver cadastrado";
const uniqueEmail = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}@example.test`;

async function register(page: Page, name: string, email: string) {
  await page.goto("/cadastro");
  await page.getByLabel("Nome", { exact: true }).fill(name);
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("radio", { name: /Quero contratar/ }).check();
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await confirmEmail(page, email);
  await expect(page).toHaveURL(/\/painel$/);
}

test("sem credenciais, entrar e cadastro não mostram botões OAuth", async ({ page }) => {
  for (const path of ["/entrar", "/cadastro"]) {
    await page.goto(path);
    await expect(page.getByRole("button", { name: /GitHub|Google/ })).toHaveCount(0);
    await expect(page.locator(".social-buttons")).toHaveCount(0);
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

test("e-mail sem confirmação não abre o painel; código certo libera e leva ao destino", async ({ page }) => {
  const email = uniqueEmail("gate");
  await page.goto("/cadastro?next=/buscar%3Fq%3Dloja");
  await fillRegistration(page, email);
  await expect(page).toHaveURL(/\/confirmar-email\?next=/);
  await expect(page.getByRole("heading", { name: "Confirme seu e-mail." })).toBeVisible();
  const notice = page.getByRole("region", { name: "Confirmação de e-mail" });
  await expect(notice).toContainText(email);
  const box = notice.getByLabel("Código de confirmação", { exact: true });
  await expect(box).toBeFocused();

  for (const blocked of ["/painel", "/painel/conta", "/painel/projetos"]) {
    await page.goto(blocked);
    await expect(page).toHaveURL(/\/confirmar-email$/);
  }
  await page.goto("/confirmar-email?next=/buscar%3Fq%3Dloja");
  await box.fill("000000");
  await expect(notice.getByRole("alert")).toContainText("Código incorreto");
  await expect(box).toHaveValue("");
  const disabled = await page.request.post("/api/auth/sign-in/email-otp", { data: { email, otp: "000000" } });
  expect(disabled.status()).toBe(404);

  await plantEmailCode(email, "123456");
  await box.fill("123456");
  await expect(page.getByRole("heading", { name: "E-mail confirmado." })).toBeVisible();
  await expect(page).toHaveURL(/\/buscar\?q=loja$/);
  await page.goto("/painel");
  await expect(page).toHaveURL(/\/painel$/);
  await page.goto("/confirmar-email");
  await expect(page).toHaveURL(/\/painel$/);
});

test("quem volta sem código válido recebe outro ao chegar, e quem errou o e-mail consegue sair", async ({ page }) => {
  const email = uniqueEmail("volta");
  await page.goto("/cadastro");
  await fillRegistration(page, email);
  await expect(page).toHaveURL(/\/confirmar-email$/);
  await expireEmailCode(email);
  await page.context().clearCookies();

  await page.goto("/entrar?next=/buscar");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/confirmar-email\?next=%2Fbuscar$/);
  await expect(page.getByRole("region", { name: "Confirmação de e-mail" }).getByRole("status")).toContainText("novo código");
  expect(await emailCodeCount(email)).toBe(1);

  await page.getByRole("button", { name: "Sair e criar a conta de novo" }).click();
  await expect(page).toHaveURL(/\/cadastro$/);
  await page.goto("/painel");
  await expect(page).toHaveURL(/\/entrar/);
});

// --- Destino ?next (ticket 08, complemento) ---
async function fillRegistration(page: Page, email: string) {
  await page.getByLabel("Nome", { exact: true }).fill("Conta com destino");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("radio", { name: /Quero contratar/ }).check();
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
}
async function clearAccountType(email: string) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_TEST });
  try {
    await pool.query('ALTER TABLE "user" DISABLE TRIGGER user_tipo_conta_imutavel');
    await pool.query('UPDATE "user" SET tipo_conta=NULL WHERE email=$1', [email]);
    await pool.query('ALTER TABLE "user" ENABLE TRIGGER user_tipo_conta_imutavel');
  } finally { await pool.end(); }
}

test("cadastro com ?next termina no destino informado", async ({ page }) => {
  const email = uniqueEmail("next");
  await page.goto("/cadastro?next=/buscar%3Fq%3Dloja");
  await fillRegistration(page, email);
  await confirmEmail(page, email);
  await expect(page).toHaveURL(/\/buscar\?q=loja$/);
});

test("query string longa e codificada sobrevive entrar → cadastro → destino", async ({ page }) => {
  const destination = "/buscar?q=" + encodeURIComponent("loja virtual & sistema = ação 100%") + "&rascunho=" + "a%2Fb%3Fc%3Dd%26e".repeat(40) + "&x=1";
  await page.goto(`/entrar?next=${encodeURIComponent(destination)}`);
  await page.getByRole("link", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/cadastro\?next=/);
  expect(new URL(page.url()).searchParams.get("next")).toBe(destination);
  const email = uniqueEmail("longo");
  await fillRegistration(page, email);
  await confirmEmail(page, email);
  await expect.poll(() => { const url = new URL(page.url()); return url.pathname + url.search; }).toBe(destination);
  await page.goto(`/cadastro?next=${encodeURIComponent(destination)}`);
  await page.getByRole("link", { name: "Entrar", exact: true }).last().click();
  expect(new URL(page.url()).searchParams.get("next")).toBe(destination);
});

test("next externo é ignorado no cadastro e na escolha de tipo", async ({ page }) => {
  for (const evil of ["https://evil.example", "//evil.example/x", "/" + String.fromCharCode(92) + "evil.example"]) {
    await page.context().clearCookies();
    await page.goto(`/cadastro?next=${encodeURIComponent(evil)}`);
    await expect(page.locator('input[name="next"]')).toHaveCount(0);
    const email = uniqueEmail("evil");
    await fillRegistration(page, email);
    await confirmEmail(page, email);
    await expect(page).toHaveURL(/\/painel$/);
  }
  const email = uniqueEmail("evil-tipo");
  await page.context().clearCookies();
  await page.goto("/cadastro");
  await fillRegistration(page, email);
  await confirmEmail(page, email);
  await expect(page).toHaveURL(/\/painel$/);
  await clearAccountType(email);
  await page.goto(`/boas-vindas?next=${encodeURIComponent("https://evil.example")}`);
  await page.getByRole("radio", { name: /Quero contratar/ }).check();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page).toHaveURL(/\/painel$/);
});

test("/boas-vindas?next redireciona ao destino depois da escolha do tipo", async ({ page }) => {
  const email = uniqueEmail("boas");
  await page.goto("/cadastro");
  await fillRegistration(page, email);
  await confirmEmail(page, email);
  await expect(page).toHaveURL(/\/painel$/);
  await clearAccountType(email);
  await page.goto("/boas-vindas?next=/buscar%3Fq%3Dloja");
  await page.getByRole("radio", { name: /Quero oferecer serviços/ }).check();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page).toHaveURL(/\/buscar\?q=loja$/);
});
