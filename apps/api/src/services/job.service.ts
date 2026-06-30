import { ApplicationStatus, JobStatus, NotificationType } from "@prisma/client";
import { prisma } from "../config/db";
import { CreateJobInput, UpdateJobInput, ApplyToJobInput } from "@hireflow/shared";
import { createNotification } from "./notification.service";

export async function createJob(userId: string, input: CreateJobInput) {
  const member = await prisma.companyMember.findFirst({
    where: {
      userId,
      role: { in: ["OWNER", "ADMIN"] },
      companyId: input.companyId,
    },
  });

  if (!member) {
    throw new Error("Access denied");
  }

  const { skills, deadline, ...rest } = input;

  const job = await prisma.job.create({
    data: {
      ...rest,
      postedById: userId,
      deadline: deadline ? new Date(deadline) : null,
    },
  });

  if (skills && skills.length > 0) {
    for (const skillName of skills) {
      const skill = await prisma.skill.upsert({
        where: { name: skillName.toLowerCase() },
        create: { name: skillName.toLowerCase() },
        update: {},
      });

      await prisma.jobSkill.create({
        data: {
          jobId: job.id,
          skillId: skill.id,
        },
      });
    }
  }

  return prisma.job.findUnique({
    where: { id: job.id },
    include: {
      company: { select: { id: true, name: true, slug: true, logoUrl: true } },
      skills: { include: { skill: true } },
    },
  });
}

export async function getCompanyJobs(companyId: string, userId: string) {
  const member = await prisma.companyMember.findFirst({
    where: { companyId, userId },
  });

  if (!member) {
    throw new Error("Access denied");
  }

  return prisma.job.findMany({
    where: { companyId },
    include: {
      company: { select: { id: true, name: true, slug: true, logoUrl: true } },
      skills: { include: { skill: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOpenJobs() {
  return prisma.job.findMany({
    where: { status: JobStatus.OPEN },
    include: {
      company: { select: { id: true, name: true, slug: true, logoUrl: true } },
      skills: { include: { skill: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getJobById(jobId: string, userId?: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      company: { select: { id: true, name: true, slug: true, logoUrl: true } },
      skills: { include: { skill: true } },
      applications: userId
        ? {
            where: { candidateId: userId },
            select: { id: true, status: true },
          }
        : false,
    },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  return job;
}

export async function updateJob(userId: string, jobId: string, input: UpdateJobInput) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  const member = await prisma.companyMember.findFirst({
    where: {
      companyId: job.companyId,
      userId,
      role: { in: ["OWNER", "ADMIN"] },
    },
  });

  if (!member) {
    throw new Error("Access denied");
  }

  const { skills, deadline, ...rest } = input;

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: {
      ...rest,
      deadline: deadline ? new Date(deadline) : null,
    },
  });

  if (skills !== undefined) {
    await prisma.jobSkill.deleteMany({ where: { jobId } });
    if (skills.length > 0) {
      for (const skillName of skills) {
        const skill = await prisma.skill.upsert({
          where: { name: skillName.toLowerCase() },
          create: { name: skillName.toLowerCase() },
          update: {},
        });

        await prisma.jobSkill.create({
          data: { jobId, skillId: skill.id },
        });
      }
    }
  }

  return prisma.job.findUnique({
    where: { id: jobId },
    include: {
      company: { select: { id: true, name: true, slug: true, logoUrl: true } },
      skills: { include: { skill: true } },
    },
  });
}

export async function applyToJob(userId: string, input: ApplyToJobInput) {
  const job = await prisma.job.findUnique({
    where: { id: input.jobId },
  });

  if (!job || job.status !== JobStatus.OPEN) {
    throw new Error("Job not available");
  }

  const existing = await prisma.application.findFirst({
    where: { jobId: input.jobId, candidateId: userId },
  });

  if (existing) {
    throw new Error("You have already applied to this job");
  }

  const application = await prisma.application.create({
    data: {
      jobId: input.jobId,
      candidateId: userId,
      coverLetter: input.coverLetter || null,
      resumeUrl: input.resumeUrl || null,
    },
    include: { job: true },
  });

  await createNotification(
    application.job.postedById,
    "New application",
    `A candidate applied to ${application.job.title}`,
    NotificationType.APPLICATION
  );

  return application;
}

export async function getMyApplications(userId: string) {
  return prisma.application.findMany({
    where: { candidateId: userId },
    include: {
      job: {
        include: {
          company: { select: { id: true, name: true, slug: true, logoUrl: true } },
          skills: { include: { skill: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getJobApplications(userId: string, jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  const member = await prisma.companyMember.findFirst({
    where: { companyId: job.companyId, userId },
  });

  if (!member) {
    throw new Error("Access denied");
  }

  return prisma.application.findMany({
    where: { jobId },
    include: {
      candidate: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateApplicationStatus(
  userId: string,
  applicationId: string,
  status: ApplicationStatus
) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: true },
  });

  if (!application) {
    throw new Error("Application not found");
  }

  const member = await prisma.companyMember.findFirst({
    where: {
      companyId: application.job.companyId,
      userId,
      role: { in: ["OWNER", "ADMIN", "RECRUITER"] },
    },
  });

  if (!member) {
    throw new Error("Access denied");
  }

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: { status },
    include: { job: true },
  });

  await createNotification(
    application.candidateId,
    "Application status updated",
    `Your application for ${updated.job.title} is now ${status}`,
    NotificationType.STATUS_UPDATE
  );

  return updated;
}
