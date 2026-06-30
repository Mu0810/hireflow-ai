import { z } from "zod";

export const createInterviewSchema = z.object({
  applicationId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().min(15).max(240).default(30),
  type: z.enum(["PHONE", "VIDEO", "IN_PERSON"]),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export const updateInterviewSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
  durationMinutes: z.number().min(15).max(240).optional(),
  type: z.enum(["PHONE", "VIDEO", "IN_PERSON"]).optional(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export const sendMessageSchema = z.object({
  interviewId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;
export type UpdateInterviewInput = z.infer<typeof updateInterviewSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
