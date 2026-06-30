import { prisma } from "../config/db";

export async function cleanDatabase() {
  await prisma.$transaction([
    prisma.message.deleteMany(),
    prisma.interview.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.codingSubmission.deleteMany(),
    prisma.codingTest.deleteMany(),
    prisma.application.deleteMany(),
    prisma.jobSkill.deleteMany(),
    prisma.job.deleteMany(),
    prisma.candidateSkill.deleteMany(),
    prisma.skill.deleteMany(),
    prisma.education.deleteMany(),
    prisma.experience.deleteMany(),
    prisma.project.deleteMany(),
    prisma.certification.deleteMany(),
    prisma.candidateProfile.deleteMany(),
    prisma.companyInvite.deleteMany(),
    prisma.companyMember.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.referral.deleteMany(),
    prisma.company.deleteMany(),
    prisma.session.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.passwordReset.deleteMany(),
    prisma.account.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}
