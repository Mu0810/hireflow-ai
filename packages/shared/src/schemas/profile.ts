import { z } from "zod";

export const profileBaseSchema = z.object({
  bio: z.string().max(2000).optional().or(z.literal("")),
  location: z.string().max(200).optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  linkedIn: z.string().url().max(500).optional().or(z.literal("")),
  github: z.string().url().max(500).optional().or(z.literal("")),
  portfolio: z.string().url().max(500).optional().or(z.literal("")),
  expectedSalary: z.string().max(100).optional().or(z.literal("")),
  noticePeriod: z.string().max(100).optional().or(z.literal("")),
  availableFrom: z.string().datetime().optional().or(z.literal("")),
  remoteOnly: z.boolean().default(false),
});

export const educationSchema = z.object({
  institution: z.string().min(1).max(200),
  degree: z.string().min(1).max(200),
  fieldOfStudy: z.string().max(200).optional().or(z.literal("")),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  current: z.boolean().default(false),
  gpa: z.string().max(20).optional().or(z.literal("")),
});

export const experienceSchema = z.object({
  company: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  current: z.boolean().default(false),
  location: z.string().max(200).optional().or(z.literal("")),
});

export const projectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  url: z.string().url().max(500).optional().or(z.literal("")),
  githubUrl: z.string().url().max(500).optional().or(z.literal("")),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
});

export const certificationSchema = z.object({
  name: z.string().min(1).max(200),
  organization: z.string().min(1).max(200),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  credentialId: z.string().max(200).optional().or(z.literal("")),
  url: z.string().url().max(500).optional().or(z.literal("")),
});

export const skillSchema = z.object({
  name: z.string().min(1).max(100),
  proficiency: z.number().min(1).max(5).default(1),
  yearsExperience: z.number().min(0).optional(),
});

export const updateProfileSchema = z.object({
  ...profileBaseSchema.shape,
  education: z.array(educationSchema).optional(),
  experience: z.array(experienceSchema).optional(),
  projects: z.array(projectSchema).optional(),
  certifications: z.array(certificationSchema).optional(),
  skills: z.array(skillSchema).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type EducationInput = z.infer<typeof educationSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type CertificationInput = z.infer<typeof certificationSchema>;
export type SkillInput = z.infer<typeof skillSchema>;
