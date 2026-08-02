import { prisma } from "../config/db";
import { CreateReferralInput, UpdateReferralInput, UpdateSubscriptionInput } from "@hireflow/shared";
import { ForbiddenError, NotFoundError } from "../utils/errors";

export async function getCompanySubscription(userId: string, companyId: string) {
  const member = await prisma.companyMember.findFirst({
    where: { companyId, userId },
  });

  if (!member) {
    throw new ForbiddenError("Access denied");
  }

  return prisma.subscription.findUnique({
    where: { companyId },
  });
}

export async function updateCompanySubscription(
  userId: string,
  companyId: string,
  input: UpdateSubscriptionInput
) {
  const member = await prisma.companyMember.findFirst({
    where: { companyId, userId, role: { in: ["OWNER", "ADMIN"] } },
  });

  if (!member) {
    throw new ForbiddenError("Access denied");
  }

  return prisma.subscription.upsert({
    where: { companyId },
    create: {
      companyId,
      plan: input.plan,
      status: input.status || "ACTIVE",
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    },
    update: {
      plan: input.plan,
      status: input.status,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    },
  });
}

export async function createReferral(userId: string, input: CreateReferralInput) {
  const company = await prisma.company.findUnique({
    where: { id: input.companyId },
  });

  if (!company) {
    throw new NotFoundError("Company not found");
  }

  if (input.jobId) {
    const job = await prisma.job.findUnique({
      where: { id: input.jobId },
    });
    if (!job || job.companyId !== input.companyId) {
      throw new NotFoundError("Job not found");
    }
  }

  return prisma.referral.create({
    data: {
      referrerId: userId,
      companyId: input.companyId,
      candidateEmail: input.candidateEmail,
      candidateName: input.candidateName || null,
      jobId: input.jobId || null,
      notes: input.notes || null,
    },
  });
}

export async function getMyReferrals(userId: string) {
  return prisma.referral.findMany({
    where: { referrerId: userId },
    include: {
      company: { select: { id: true, name: true } },
      job: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCompanyReferrals(userId: string, companyId: string) {
  const member = await prisma.companyMember.findFirst({
    where: { companyId, userId },
  });

  if (!member) {
    throw new ForbiddenError("Access denied");
  }

  return prisma.referral.findMany({
    where: { companyId },
    include: {
      referrer: { select: { id: true, name: true, email: true } },
      job: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateReferral(
  userId: string,
  referralId: string,
  input: UpdateReferralInput
) {
  const referral = await prisma.referral.findUnique({
    where: { id: referralId },
    include: { company: true },
  });

  if (!referral) {
    throw new NotFoundError("Referral not found");
  }

  const member = await prisma.companyMember.findFirst({
    where: {
      companyId: referral.companyId,
      userId,
      role: { in: ["OWNER", "ADMIN", "RECRUITER"] },
    },
  });

  if (!member) {
    throw new ForbiddenError("Access denied");
  }

  return prisma.referral.update({
    where: { id: referralId },
    data: {
      status: input.status,
      notes: input.notes,
    },
  });
}
