import { prisma } from "../config/db";
import { ForbiddenError, NotFoundError } from "../utils/errors";

export async function screenApplication(userId: string, applicationId: string) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: { include: { skills: { include: { skill: true } }, company: true } },
      candidate: { include: { candidateProfile: { include: { skills: { include: { skill: true } }, experience: true, education: true } } } },
    },
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

  const requiredSkills = application.job.skills.map((s) => s.skill.name.toLowerCase());
  const candidateSkills = application.candidate.candidateProfile?.skills.map((s) => ({
    name: s.skill.name.toLowerCase(),
    proficiency: s.proficiency,
    yearsExperience: s.yearsExperience || 0,
  })) || [];

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  let skillScore = 0;

  if (requiredSkills.length > 0) {
    for (const required of requiredSkills) {
      const match = candidateSkills.find((cs) => cs.name === required);
      if (match) {
        matchedSkills.push(required);
        skillScore += match.proficiency * 10 + Math.min(match.yearsExperience, 5) * 2;
      } else {
        missingSkills.push(required);
      }
    }
    skillScore = Math.min(100, (skillScore / (requiredSkills.length * 70)) * 100);
  } else {
    skillScore = 50;
  }

  const yearsExperience = application.candidate.candidateProfile?.experience.reduce((total, exp) => {
    const start = new Date(exp.startDate);
    const end = exp.endDate ? new Date(exp.endDate) : new Date();
    const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return total + years;
  }, 0) || 0;

  const experienceScore = Math.min(100, (yearsExperience / 5) * 100);
  const educationBonus = application.candidate.candidateProfile?.education.length ? 10 : 0;

  const finalScore = Math.min(100, Math.round(skillScore * 0.6 + experienceScore * 0.3 + educationBonus));

  const notes = [
    `Skill match: ${matchedSkills.length}/${requiredSkills.length} required skills matched.`,
    matchedSkills.length ? `Matched: ${matchedSkills.join(", ")}.` : "No required skills matched.",
    missingSkills.length ? `Missing: ${missingSkills.join(", ")}.` : "All required skills matched.",
    `Candidate has ${Math.round(yearsExperience * 10) / 10} years of relevant experience.`,
    finalScore >= 75 ? "Strong candidate." : finalScore >= 50 ? "Average fit, consider screening." : "Weak fit.",
  ].join(" ");

  return prisma.application.update({
    where: { id: applicationId },
    data: {
      aiMatchScore: finalScore,
      aiNotes: notes,
      status: finalScore >= 50 ? "SCREENING" : application.status,
    },
    include: {
      candidate: {
        select: { id: true, name: true, email: true },
      },
      job: {
        include: {
          company: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function getApplicationScreening(userId: string, applicationId: string) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
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

  return {
    aiMatchScore: application.aiMatchScore,
    aiNotes: application.aiNotes,
  };
}
