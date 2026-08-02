import { CompanyMemberRole, UserRole } from "@prisma/client";
import { prisma } from "../config/db";
import { sendEmail } from "../utils/email";
import { CreateCompanyInput, InviteMemberInput, UpdateCompanyInput } from "@hireflow/shared";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../utils/errors";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function inviteEmailHtml(companyName: string, token: string): string {
  const link = `${process.env.WEB_URL}/invite?token=${token}`;
  return `
    <h1>You've been invited to join ${companyName}</h1>
    <p>Click the link below to accept the invitation:</p>
    <a href="${link}">${link}</a>
    <p>This link expires in 7 days.</p>
  `;
}

export async function createCompany(userId: string, input: CreateCompanyInput) {
  const existing = await prisma.company.findUnique({
    where: { slug: input.slug },
  });

  if (existing) {
    throw new ConflictError("Company slug already taken");
  }

  const company = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        ...input,
        website: input.website || null,
        description: input.description || null,
        ownerId: userId,
      },
    });

    await tx.companyMember.create({
      data: {
        companyId: company.id,
        userId,
        role: CompanyMemberRole.OWNER,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: { role: UserRole.COMPANY_ADMIN },
    });

    await tx.subscription.create({
      data: {
        companyId: company.id,
        plan: "FREE",
        status: "ACTIVE",
      },
    });

    return company;
  });

  return company;
}

export async function getUserCompanies(userId: string) {
  const memberships = await prisma.companyMember.findMany({
    where: { userId },
    include: {
      company: true,
    },
  });

  return memberships.map((m) => ({
    ...m.company,
    memberRole: m.role,
  }));
}

export async function getCompanyById(companyId: string, userId: string) {
  const member = await prisma.companyMember.findFirst({
    where: { companyId, userId },
  });

  if (!member) {
    throw new NotFoundError("Company not found or access denied");
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  return company;
}

export async function updateCompany(
  companyId: string,
  userId: string,
  input: UpdateCompanyInput
) {
  const member = await prisma.companyMember.findFirst({
    where: { companyId, userId, role: { in: [CompanyMemberRole.OWNER, CompanyMemberRole.ADMIN] } },
  });

  if (!member) {
    throw new ForbiddenError("Access denied");
  }

  return prisma.company.update({
    where: { id: companyId },
    data: {
      ...input,
      website: input.website || null,
      description: input.description || null,
    },
  });
}

export async function inviteMember(
  companyId: string,
  invitedBy: string,
  input: InviteMemberInput
) {
  const member = await prisma.companyMember.findFirst({
    where: { companyId, userId: invitedBy, role: { in: [CompanyMemberRole.OWNER, CompanyMemberRole.ADMIN] } },
  });

  if (!member) {
    throw new ForbiddenError("Access denied");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    const existingMember = await prisma.companyMember.findFirst({
      where: { companyId, userId: existingUser.id },
    });
    if (existingMember) {
      throw new ConflictError("User is already a member of this company");
    }
  }

  const existingInvite = await prisma.companyInvite.findFirst({
    where: { companyId, email: input.email, accepted: false },
  });

  if (existingInvite) {
    await prisma.companyInvite.delete({ where: { id: existingInvite.id } });
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new NotFoundError("Company not found");
  }

  const invite = await prisma.companyInvite.create({
    data: {
      email: input.email,
      companyId,
      role: input.role as CompanyMemberRole,
      invitedBy,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });

  await sendEmail({
    to: input.email,
    subject: `You've been invited to join ${company.name}`,
    html: inviteEmailHtml(company.name, invite.token),
  });

  return { success: true };
}

export async function acceptInvite(token: string, userId: string) {
  const invite = await prisma.companyInvite.findUnique({
    where: { token },
  });

  if (!invite || invite.expiresAt < new Date() || invite.accepted) {
    throw new BadRequestError("Invalid or expired invite");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.email !== invite.email) {
    throw new ForbiddenError("Invite email does not match");
  }

  await prisma.$transaction([
    prisma.companyMember.create({
      data: {
        companyId: invite.companyId,
        userId,
        role: invite.role,
      },
    }),
    prisma.companyInvite.update({
      where: { token },
      data: { accepted: true },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { role: invite.role === CompanyMemberRole.ADMIN ? UserRole.COMPANY_ADMIN : UserRole.RECRUITER },
    }),
  ]);

  return { success: true };
}

export async function removeMember(companyId: string, memberId: string, userId: string) {
  const actor = await prisma.companyMember.findFirst({
    where: { companyId, userId, role: { in: [CompanyMemberRole.OWNER, CompanyMemberRole.ADMIN] } },
  });

  if (!actor) {
    throw new ForbiddenError("Access denied");
  }

  const target = await prisma.companyMember.findUnique({
    where: { id: memberId },
  });

  if (!target || target.companyId !== companyId) {
    throw new NotFoundError("Member not found");
  }

  if (target.role === CompanyMemberRole.OWNER) {
    throw new ForbiddenError("Cannot remove company owner");
  }

  if (actor.role === CompanyMemberRole.ADMIN && target.role === CompanyMemberRole.ADMIN) {
    throw new ForbiddenError("Admins cannot remove other admins");
  }

  await prisma.companyMember.delete({
    where: { id: memberId },
  });

  return { success: true };
}

export async function updateMemberRole(
  companyId: string,
  userId: string,
  memberId: string,
  role: CompanyMemberRole
) {
  const actor = await prisma.companyMember.findFirst({
    where: { companyId, userId, role: CompanyMemberRole.OWNER },
  });

  if (!actor) {
    throw new ForbiddenError("Only the owner can change roles");
  }

  const target = await prisma.companyMember.findUnique({
    where: { id: memberId },
  });

  if (!target || target.companyId !== companyId) {
    throw new NotFoundError("Member not found");
  }

  if (target.role === CompanyMemberRole.OWNER) {
    throw new ForbiddenError("Cannot change owner's role");
  }

  await prisma.$transaction([
    prisma.companyMember.update({
      where: { id: memberId },
      data: { role },
    }),
    prisma.user.update({
      where: { id: target.userId },
      data: { role: role === CompanyMemberRole.ADMIN ? UserRole.COMPANY_ADMIN : UserRole.RECRUITER },
    }),
  ]);

  return { success: true };
}
