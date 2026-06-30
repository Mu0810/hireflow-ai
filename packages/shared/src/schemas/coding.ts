import { z } from "zod";

export const codingTestCaseSchema = z.object({
  input: z.string(),
  expectedOutput: z.string(),
});

export const createCodingTestSchema = z.object({
  jobId: z.string().uuid(),
  title: z.string().min(2).max(200),
  description: z.string().min(10).max(5000),
  timeLimitMinutes: z.number().min(5).max(180).default(30),
  language: z.enum(["JAVASCRIPT", "PYTHON", "TYPESCRIPT"]).default("JAVASCRIPT"),
  starterCode: z.string().max(10000).optional().or(z.literal("")),
  testCases: z.array(codingTestCaseSchema).min(1),
});

export const submitCodingTestSchema = z.object({
  testId: z.string().uuid(),
  code: z.string().min(1).max(20000),
});

export type CreateCodingTestInput = z.infer<typeof createCodingTestSchema>;
export type SubmitCodingTestInput = z.infer<typeof submitCodingTestSchema>;
