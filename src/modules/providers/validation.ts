import { z } from "zod";

const optionalText = (schema: z.ZodType<string>) => z.preprocess((v) => v === "" || v === undefined ? null : v, schema.nullable());
const httpsUrl = optionalText(z.string().trim().max(2048).url().pipe(z.string().refine((v) => new URL(v).protocol === "https:", "Use uma URL HTTPS.")));
const phone = optionalText(z.string().regex(/^\+[1-9]\d{7,14}$/, "Use formato internacional, como +5583999999999."));
export const providerSchema = z.object({
  type: z.enum(["PESSOA_FISICA", "PESSOA_JURIDICA"]), displayName: z.string().trim().min(2).max(100), description: z.string().trim().min(30).max(5000),
  yearsExperience: z.coerce.number().int().min(0).max(80), contactEmail: z.string().trim().toLowerCase().email().max(254),
  contactConsent: z.boolean().refine((v) => v, "Autorize a publicação dos contatos para criar ou atualizar o perfil."),
  photoUrl: httpsUrl, city: optionalText(z.string().trim().min(1).max(100)), state: optionalText(z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/)),
  country: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/).default("BR"), phone, whatsapp: phone, siteUrl: httpsUrl, githubUrl: httpsUrl, linkedinUrl: httpsUrl,
});
export type ProviderInput = z.infer<typeof providerSchema>;
