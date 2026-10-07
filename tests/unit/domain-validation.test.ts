import { describe, expect, it } from "vitest";
import { offerSchema, decimalCents } from "../../src/modules/offers/validation";
import { providerSchema } from "../../src/modules/providers/validation";
import { reviewSchema } from "../../src/modules/reviews/validation";
import { searchSchema } from "../../src/modules/search/validation";

const offer = { serviceTypeId: "00000000-0000-4000-8000-000000000001", title: "Landing page", description: "Desenvolvimento de landing page com conteúdo e formulário.", priceType: "FIXO", priceMin: "1000.00", priceMax: null, deadlineType: "FIXO", deadlineMinDays: 10, deadlineMaxDays: null, active: true };
describe("validação do domínio", () => {
  it("conserva dinheiro decimal e compara centavos sem float", () => {
    expect(offerSchema.parse(offer).priceMin).toBe("1000.00");
    expect(decimalCents("99999999.99")).toBe(BigInt("9999999999"));
    expect(decimalCents("0.10") + decimalCents("0.20")).toBe(BigInt(30));
  });
  it.each([null, "0", "-1", "R$ 10", "1.234", "100000000.00", "abc", "Infinity"])("recusa FIXO com mínimo inválido %s sem lançar exceção", (priceMin) => {
    expect(() => offerSchema.safeParse({ ...offer, priceMin })).not.toThrow();
    expect(offerSchema.safeParse({ ...offer, priceMin }).success).toBe(false);
  });
  it("exige máximo no intervalo e permite valores iguais", () => {
    expect(offerSchema.safeParse({ ...offer, priceType: "INTERVALO" }).success).toBe(false);
    expect(offerSchema.safeParse({ ...offer, priceType: "INTERVALO", priceMax: "999.99" }).success).toBe(false);
    expect(offerSchema.safeParse({ ...offer, priceType: "INTERVALO", priceMax: "1000.00" }).success).toBe(true);
  });
  it("rejeita valores incompatíveis ao trocar modelo", () => {
    expect(offerSchema.safeParse({ ...offer, priceType: "SOB_CONSULTA" }).success).toBe(false);
    expect(offerSchema.safeParse({ ...offer, priceMax: "1001" }).success).toBe(false);
    expect(offerSchema.safeParse({ ...offer, deadlineType: "A_COMBINAR" }).success).toBe(false);
    expect(offerSchema.safeParse({ ...offer, deadlineType: "INTERVALO", deadlineMaxDays: 9 }).success).toBe(false);
    expect(offerSchema.safeParse({ ...offer, deadlineMinDays: 3651 }).success).toBe(false);
  });
  it("perfil exige consentimento, URLs HTTPS e telefone internacional", () => {
    const profile = { type: "PESSOA_FISICA", displayName: "Nome público", description: "Descrição do serviço com informações suficientes para o perfil.", yearsExperience: 5, contactEmail: "PUBLICO@EXAMPLE.COM", contactConsent: true };
    expect(providerSchema.parse(profile).contactEmail).toBe("publico@example.com");
    expect(providerSchema.safeParse({ ...profile, contactConsent: false }).success).toBe(false);
    for (const photoUrl of ["javascript:alert(1)", "http://example.com/a.png", "abc"]) {
      expect(() => providerSchema.safeParse({ ...profile, photoUrl })).not.toThrow();
      expect(providerSchema.safeParse({ ...profile, photoUrl }).success).toBe(false);
    }
    expect(providerSchema.safeParse({ ...profile, phone: "83999999999" }).success).toBe(false);
  });
  it("avaliação limita nota e comentário", () => {
    const value = { providerId: offer.serviceTypeId, rating: 5 };
    expect(reviewSchema.safeParse(value).success).toBe(true);
    expect(reviewSchema.safeParse({ ...value, rating: 6 }).success).toBe(false);
    expect(reviewSchema.safeParse({ ...value, comment: "a".repeat(2001) }).success).toBe(false);
  });
  it("busca impede mistura financeira e limita paginação", () => {
    expect(searchSchema.safeParse({ preco_min: "100" }).success).toBe(false);
    expect(searchSchema.safeParse({ ordenar: "preco", modelo_preco: "SOB_CONSULTA" }).success).toBe(false);
    expect(searchSchema.safeParse({ modelo_preco: "POR_HORA", preco_min: "100", preco_max: "99" }).success).toBe(false);
    expect(searchSchema.safeParse({ pagina: "1001" }).success).toBe(false);
    expect(searchSchema.safeParse({ modelo_preco: "FIXO", preco_min: "800", preco_max: "1200" }).success).toBe(true);
  });
});
