export interface CandidateProfile {
  id: string;
  userId: string;
  bio: string | null;
  location: string | null;
  phone: string | null;
  linkedIn: string | null;
  github: string | null;
  portfolio: string | null;
  resumeUrl: string | null;
  expectedSalary: string | null;
  noticePeriod: string | null;
  availableFrom: string | null;
  remoteOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string | null;
  startDate: string;
  endDate: string | null;
  current: boolean;
  gpa: string | null;
}

export interface Experience {
  id: string;
  company: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  current: boolean;
  location: string | null;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  githubUrl: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface Certification {
  id: string;
  name: string;
  organization: string;
  issueDate: string;
  expiryDate: string | null;
  credentialId: string | null;
  url: string | null;
}

export interface CandidateSkill {
  id: string;
  name: string;
  proficiency: number;
  yearsExperience: number | null;
}

export interface FullCandidateProfile extends CandidateProfile {
  education: Education[];
  experience: Experience[];
  projects: Project[];
  certifications: Certification[];
  skills: CandidateSkill[];
}
