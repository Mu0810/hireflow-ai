export type JobStatus = "DRAFT" | "OPEN" | "CLOSED";

export interface Job {
  id: string;
  title: string;
  description: string;
  experience: string | null;
  salary: string | null;
  location: string | null;
  remote: boolean;
  deadline: string | null;
  benefits: string | null;
  openings: number;
  status: JobStatus;
  companyId: string;
  postedById: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobWithCompany extends Job {
  company: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  skills: { id: string; name: string }[];
}

export type ApplicationStatus =
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED";

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  status: ApplicationStatus;
  coverLetter: string | null;
  resumeUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationWithJob extends Application {
  job: JobWithCompany;
  candidate: {
    id: string;
    name: string | null;
    email: string;
  };
}
