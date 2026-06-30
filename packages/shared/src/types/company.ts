export type CompanyMemberRole = "OWNER" | "ADMIN" | "RECRUITER";

export interface Company {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  description: string | null;
  logoUrl: string | null;
  verified: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyMember {
  id: string;
  companyId: string;
  userId: string;
  role: CompanyMemberRole;
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  };
  createdAt: string;
}

export interface CompanyWithMembers extends Company {
  members: CompanyMember[];
}
