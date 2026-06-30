import { z } from "zod";

export const createReferralSchema = z.object({
  companyId: z.string().uuid(),
  candidateEmail: z.string().email(),
  candidateName: z.string().max(200).optional().or(z.literal("")),
  jobId: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export const updateReferralSchema = z.object({
  status: z.enum(["PENDING", "HIRED", "REWARDED"]),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export const updateSubscriptionSchema = z.object({
  plan: z.enum(["FREE", "STARTER", "PRO"]),
  status: z.enum(["ACTIVE", "CANCELLED", "EXPIRED"]).optional(),
  expiresAt: z.string().datetime().optional().or(z.literal("")),
});

export type CreateReferralInput = z.infer<typeof createReferralSchema>;
export type UpdateReferralInput = z.infer<typeof updateReferralSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
