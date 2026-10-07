import { beforeEach, describe, expect, it, vi } from "vitest";
import { safeDestination } from "../../src/lib/auth/action-state";

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn(), mutationAllowed: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getSession: mocks.getSession }));
vi.mock("@/lib/db", () => ({ db: { select: mocks.select, insert: mocks.insert, update: mocks.update, delete: mocks.delete } }));
vi.mock("@/lib/auth/mutation-limit", () => ({ mutationAllowed: mocks.mutationAllowed, mutationError: () => "Erro" }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { saveProvider, setProviderActive } from "../../src/modules/providers/actions";
import { saveOffer, deleteOffer } from "../../src/modules/offers/actions";
import { saveReview, deleteReview } from "../../src/modules/reviews/actions";

beforeEach(() => { vi.clearAllMocks(); mocks.getSession.mockResolvedValue(null); });
describe("direct server actions authorization", () => {
  it.each([saveProvider, setProviderActive, saveOffer, deleteOffer, saveReview, deleteReview])("refuses unauthenticated requests before touching domain data", async (action) => {
    const data = new FormData();
    data.set("userId", "forged-owner");
    data.set("providerId", "forged-provider");
    const result = await action({}, data);
    expect(result.error).toBeTruthy();
    expect(mocks.select).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.delete).not.toHaveBeenCalled();
  });
  it("rejects own profile reviews using the session identity", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "owner" } });
    mocks.select.mockReturnValue({ from: () => ({ where: () => ({ limit: async () => [{ id: "550e8400-e29b-41d4-a716-446655440000", userId: "owner", active: true }] }) }) });
    const data = new FormData();
    data.set("providerId", "550e8400-e29b-41d4-a716-446655440000");
    data.set("rating", "5");
    data.set("userId", "someone-else");
    const result = await saveReview({}, data);
    expect(result.error).toContain("próprio perfil");
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
describe("login destination", () => {
  it.each(["https://attacker.example", "//attacker.example", "/\\attacker.example", "/\nattacker.example", undefined])("rejects unsafe destination %s", (destination) => {
    expect(safeDestination(destination)).toBe("/painel");
  });
  it("preserves an internal destination", () => expect(safeDestination("/painel/ofertas/nova")).toBe("/painel/ofertas/nova"));
});
