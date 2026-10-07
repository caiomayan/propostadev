import { z } from "zod";
export const reviewSchema = z.object({ providerId: z.string().uuid(), rating: z.coerce.number().int().min(1).max(5), comment: z.preprocess((v) => v === undefined || v === "" ? null : v, z.string().trim().max(2000).nullable()) });
export type ReviewInput = z.infer<typeof reviewSchema>;
