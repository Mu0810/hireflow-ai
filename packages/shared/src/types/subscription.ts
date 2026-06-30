export type SubscriptionPlan = "FREE" | "STARTER" | "PRO";
export type SubscriptionStatus = "ACTIVE" | "CANCELLED" | "EXPIRED";

export interface Subscription {
  id: string;
  companyId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ReferralStatus = "PENDING" | "HIRED" | "REWARDED";

export interface Referral {
  id: string;
  referrerId: string;
  companyId: string;
  candidateEmail: string;
  candidateName: string | null;
  jobId: string | null;
  status: ReferralStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
