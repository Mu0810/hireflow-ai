import { z } from "zod";
import { UserRole } from "../types/auth";

export const userRoles: UserRole[] = ["SUPER_ADMIN", "COMPANY_ADMIN", "RECRUITER", "CANDIDATE"];

export const emailSchema = z.string().email("Invalid email address").min(1).max(255);

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be less than 128 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number");

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2).max(100),
  role: z.enum(["SUPER_ADMIN", "COMPANY_ADMIN", "RECRUITER", "CANDIDATE"]),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().uuid(),
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().uuid(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
