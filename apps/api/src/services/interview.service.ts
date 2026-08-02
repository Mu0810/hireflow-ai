import { InterviewStatus, NotificationType } from "@prisma/client";
import { prisma } from "../config/db";
import { CreateInterviewInput, UpdateInterviewInput, SendMessageInput } from "@hireflow/shared";
import { createNotification } from "./notification.service";
import { ForbiddenError, NotFoundError } from "../utils/errors";

export async function createInterview(userId: string, input: CreateInterviewInput) {
  const application = await prisma.application.findUnique({
    where: { id: input.applicationId },
    include: { job: true },
  });

  if (!application) {
    throw new NotFoundError("Application not found");
  }

  const member = await prisma.companyMember.findFirst({
    where: {
      companyId: application.job.companyId,
      userId,
      role: { in: ["OWNER", "ADMIN", "RECRUITER"] },
    },
  });

  if (!member) {
    throw new ForbiddenError("Access denied");
  }

  const interview = await prisma.interview.create({
    data: {
      applicationId: input.applicationId,
      scheduledAt: new Date(input.scheduledAt),
      durationMinutes: input.durationMinutes,
      type: input.type,
      notes: input.notes || null,
      createdById: userId,
    },
    include: {
      application: {
        include: {
          candidate: { select: { id: true, name: true, email: true } },
          job: { include: { company: { select: { id: true, name: true } } } },
        },
      },
    },
  });

  await createNotification(
    application.candidateId,
    "Interview scheduled",
    `You have a ${interview.type} interview for ${application.job.title} on ${new Date(interview.scheduledAt).toLocaleString()}`,
    NotificationType.INTERVIEW
  );

  return interview;
}

export async function getInterview(userId: string, interviewId: string) {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      application: {
        include: {
          candidate: { select: { id: true, name: true, email: true } },
          job: { include: { company: { select: { id: true, name: true } } } },
        },
      },
      messages: {
        include: { sender: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!interview) {
    throw new NotFoundError("Interview not found");
  }

  if (
    interview.createdById !== userId &&
    interview.application.candidateId !== userId
  ) {
    const member = await prisma.companyMember.findFirst({
      where: { companyId: interview.application.job.companyId, userId },
    });
    if (!member) {
      throw new ForbiddenError("Access denied");
    }
  }

  return interview;
}

export async function getMyInterviews(userId: string) {
  return prisma.interview.findMany({
    where: {
      OR: [
        { createdById: userId },
        { application: { candidateId: userId } },
      ],
    },
    include: {
      application: {
        include: {
          candidate: { select: { id: true, name: true, email: true } },
          job: { include: { company: { select: { id: true, name: true } } } },
        },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });
}

export async function updateInterview(userId: string, interviewId: string, input: UpdateInterviewInput) {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { application: { include: { job: true } } },
  });

  if (!interview) {
    throw new NotFoundError("Interview not found");
  }

  const member = await prisma.companyMember.findFirst({
    where: {
      companyId: interview.application.job.companyId,
      userId,
      role: { in: ["OWNER", "ADMIN", "RECRUITER"] },
    },
  });

  if (!member) {
    throw new ForbiddenError("Access denied");
  }

  return prisma.interview.update({
    where: { id: interviewId },
    data: {
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
      durationMinutes: input.durationMinutes,
      type: input.type,
      status: input.status as InterviewStatus | undefined,
      notes: input.notes,
    },
  });
}

export async function sendMessage(userId: string, input: SendMessageInput) {
  const interview = await prisma.interview.findUnique({
    where: { id: input.interviewId },
    include: { application: { include: { job: true } } },
  });

  if (!interview) {
    throw new NotFoundError("Interview not found");
  }

  const isParticipant =
    interview.createdById === userId || interview.application.candidateId === userId;

  if (!isParticipant) {
    const member = await prisma.companyMember.findFirst({
      where: { companyId: interview.application.job.companyId, userId },
    });
    if (!member) {
      throw new ForbiddenError("Access denied");
    }
  }

  const message = await prisma.message.create({
    data: {
      interviewId: input.interviewId,
      senderId: userId,
      content: input.content,
    },
    include: {
      sender: { select: { id: true, name: true, email: true } },
    },
  });

  const recipientId = interview.createdById === userId ? interview.application.candidateId : interview.createdById;
  await createNotification(
    recipientId,
    "New message",
    `New message from ${message.sender.name || message.sender.email} regarding ${interview.application.job.title}`,
    NotificationType.MESSAGE
  );

  return message;
}
