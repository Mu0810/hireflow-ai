import { z } from "zod";

export const createJobSchema = z.object({
  companyId: z.string().uuid(),
  title: z.string().min(2).max(200),
  description: z.string().min(10).max(10000),
  experience: z.string().max(200).optional().or(z.literal("")),
  salary: z.string().max(200).optional().or(z.literal("")),
  location: z.string().max(200).optional().or(z.literal("")),
  remote: z.boolean().default(false),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  benefits: z.string().max(2000).optional().or(z.literal("")),
  openings: z.number().min(1).default(1),
  skills: z.array(z.string().min(1)).default([]),
});

export const updateJobSchema = createJobSchema.partial();

export const applyToJobSchema = z.object({
  jobId: z.string().uuid(),
  coverLetter: z.string().max(5000).optional().or(z.literal("")),
  resumeUrl: z.string().url().max(500).optional().or(z.literal("")),
});

export const updateApplicationStatusSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"]),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type ApplyToJobInput = z.infer<typeof applyToJobSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
